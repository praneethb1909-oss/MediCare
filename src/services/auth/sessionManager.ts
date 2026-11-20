/**
 * Hospital Admin Secure Session Manager
 * Enforces HIPAA automatic logoff controls (45 CFR § 164.312(a)(2)(iii))
 * by tracking inactivity, issuing pre-timeout warnings, and safely terminating idle sessions.
 */

import { HospitalStaffProfile } from './hospitalIdp';
import { auditLogger } from './auditLogger';

export interface HospitalAdminSession {
  token: string;
  user: HospitalStaffProfile;
  loginTime: number;
  lastActivityTime: number;
  expiresAt: number;
}

export type SessionWarningCallback = (secondsRemaining: number) => void;
export type SessionExpiredCallback = (reason: string) => void;

const SESSION_STORAGE_KEY = 'olmera_hospital_admin_session';

// HIPAA Inactivity Defaults
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes
export const WARNING_BEFORE_TIMEOUT_MS = 2 * 60 * 1000; // 2 Minutes (warning at 13 mins)

export class HospitalSessionManager {
  private static instance: HospitalSessionManager;
  private currentSession: HospitalAdminSession | null = null;
  private checkInterval: any = null;
  private warningListeners: Set<SessionWarningCallback> = new Set();
  private expiredListeners: Set<SessionExpiredCallback> = new Set();
  private isWarningActive = false;
  private boundActivityHandler: (() => void) | null = null;
  private readonly activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  private constructor() {
    this.restoreSession();
    this.setupActivityListeners();
  }

  public static getInstance(): HospitalSessionManager {
    if (!HospitalSessionManager.instance) {
      HospitalSessionManager.instance = new HospitalSessionManager();
    }
    return HospitalSessionManager.instance;
  }

  private restoreSession(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const session: HospitalAdminSession = JSON.parse(stored);
        if (session && Date.now() < session.expiresAt) {
          this.currentSession = session;
          this.startHeartbeat();
        } else {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.warn('Session restoration error:', e);
    }
  }

  private persistSession(): void {
    if (typeof window === 'undefined') return;
    try {
      if (this.currentSession) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.currentSession));
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Session persistence failed:', e);
    }
  }

  /**
   * Initializes a new authenticated hospital admin session
   */
  public startSession(user: HospitalStaffProfile, token: string): HospitalAdminSession {
    const now = Date.now();
    const session: HospitalAdminSession = {
      token,
      user,
      loginTime: now,
      lastActivityTime: now,
      expiresAt: now + INACTIVITY_TIMEOUT_MS
    };

    this.currentSession = session;
    this.isWarningActive = false;
    this.persistSession();
    this.setupActivityListeners();
    this.startHeartbeat();

    return session;
  }

  /**
   * Records user activity to keep the session alive
   */
  public recordActivity(): void {
    if (!this.currentSession) return;
    const now = Date.now();
    this.currentSession.lastActivityTime = now;
    this.currentSession.expiresAt = now + INACTIVITY_TIMEOUT_MS;
    this.isWarningActive = false;
    this.persistSession();
  }

  /**
   * Extends the session explicitly (e.g. from the warning modal)
   */
  public extendSession(): void {
    this.recordActivity();
  }

  /**
   * Returns current active session or null if inactive/expired
   */
  public getActiveSession(): HospitalAdminSession | null {
    if (!this.currentSession) return null;
    if (Date.now() >= this.currentSession.expiresAt) {
      this.terminateSession('Session expired due to clinical inactivity timeout.');
      return null;
    }
    return this.currentSession;
  }

  /**
   * Checks if an admin session is currently active and valid
   */
  public isSessionValid(): boolean {
    return this.getActiveSession() !== null;
  }

  /**
   * Terminates the active session
   */
  public async terminateSession(reason = 'User logged out.'): Promise<void> {
    const session = this.currentSession;
    if (session) {
      await auditLogger.logEvent({
        eventType: reason.includes('inactivity') ? 'SESSION_TIMEOUT' : 'LOGOUT',
        status: reason.includes('inactivity') ? 'warning' : 'success',
        hospitalId: session.user.hospitalId,
        hospitalName: session.user.hospitalName,
        staffId: session.user.staffId,
        email: session.user.email,
        role: session.user.role,
        details: reason
      });
    }

    this.currentSession = null;
    this.isWarningActive = false;
    this.stopHeartbeat();
    this.cleanupActivityListeners();
    this.persistSession();

    // Notify listeners
    this.expiredListeners.forEach(cb => cb(reason));
  }

  /**
   * Registers a callback for pre-timeout warnings
   */
  public onWarning(callback: SessionWarningCallback): () => void {
    this.warningListeners.add(callback);
    return () => this.warningListeners.delete(callback);
  }

  /**
   * Registers a callback for session expiration
   */
  public onExpired(callback: SessionExpiredCallback): () => void {
    this.expiredListeners.add(callback);
    return () => this.expiredListeners.delete(callback);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.checkInterval = setInterval(() => {
      this.checkSessionStatus();
    }, 1000); // tick every second
  }

  private stopHeartbeat(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private checkSessionStatus(): void {
    if (!this.currentSession) {
      this.stopHeartbeat();
      return;
    }

    const now = Date.now();
    const remainingMs = this.currentSession.expiresAt - now;

    // 1. Session expired
    if (remainingMs <= 0) {
      this.terminateSession('Clinical session expired due to 15 minutes of inactivity.');
      return;
    }

    // 2. Pre-timeout warning window (e.g. 2 minutes remaining)
    if (remainingMs <= WARNING_BEFORE_TIMEOUT_MS) {
      this.isWarningActive = true;
      const secondsLeft = Math.ceil(remainingMs / 1000);
      this.warningListeners.forEach(cb => cb(secondsLeft));
    }
  }

  private setupActivityListeners(): void {
    if (typeof window === 'undefined') return;

    // Clean up any existing listeners before attaching new ones
    this.cleanupActivityListeners();

    this.boundActivityHandler = () => {
      // If warning modal is actively showing, user must click "Extend" explicitly
      if (!this.isWarningActive) {
        this.recordActivity();
      }
    };

    this.activityEvents.forEach(evt => {
      window.addEventListener(evt, this.boundActivityHandler!, { passive: true });
    });
  }

  /**
   * Cleans up registered window event listeners to prevent memory leaks
   * and duplicate activity tracking when session manager is torn down.
   */
  public cleanupActivityListeners(): void {
    if (typeof window === 'undefined' || !this.boundActivityHandler) return;

    this.activityEvents.forEach(evt => {
      window.removeEventListener(evt, this.boundActivityHandler!);
    });
    this.boundActivityHandler = null;
  }

  /**
   * Full teardown of session manager: stops heartbeat, removes activity listeners,
   * and clears listener sets.
   */
  public teardown(): void {
    this.stopHeartbeat();
    this.cleanupActivityListeners();
    this.warningListeners.clear();
    this.expiredListeners.clear();
  }
}

export const sessionManager = HospitalSessionManager.getInstance();
