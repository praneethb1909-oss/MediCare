import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert, Clock, RefreshCw, LogOut } from 'lucide-react';
import { sessionManager } from '../../services/auth/sessionManager';

interface SessionTimeoutModalProps {
  onLogout: () => void;
}

export function SessionTimeoutModal({ onLogout }: SessionTimeoutModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const onLogoutRef = useRef(onLogout);

  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  useEffect(() => {
    // Listen for warning events from sessionManager
    const unsubscribeWarning = sessionManager.onWarning((seconds) => {
      setSecondsRemaining(seconds);
    });

    // Listen for expiration events
    const unsubscribeExpired = sessionManager.onExpired(() => {
      setSecondsRemaining(null);
      onLogoutRef.current?.();
    });

    return () => {
      unsubscribeWarning();
      unsubscribeExpired();
    };
  }, []);

  if (secondsRemaining === null || secondsRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const handleExtend = () => {
    sessionManager.extendSession();
    setSecondsRemaining(null);
  };

  const handleSignOutNow = () => {
    // terminateSession() notifies the onExpired listeners, which invoke onLogout.
    sessionManager.terminateSession('Administrator clicked sign out from timeout prompt.');
    setSecondsRemaining(null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="card p-8 sm:p-10 max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-line)] shadow-2xl rounded-3xl text-center space-y-6">
        
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-mist)] text-[var(--color-primary)] flex items-center justify-center mx-auto shadow-inner">
          <Clock size={32} className="animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)] font-ui">
            HIPAA Security Timeout Protocol
          </span>
          <h3 className="font-display text-2xl text-[var(--color-ink)] font-semibold">
            Session Expiring Shortly
          </h3>
          <p className="text-xs text-[var(--color-muted)] font-ui leading-relaxed">
            Due to 13 minutes of clinical inactivity, your secure hospital administrator session will terminate automatically to protect sensitive patient records.
          </p>
        </div>

        {/* Countdown Timer Display */}
        <div className="p-4 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-line)]">
          <span className="text-3xl font-mono font-semibold text-[var(--color-primary)] tracking-tight">
            {timeFormatted}
          </span>
          <p className="text-[11px] text-[var(--color-muted)] mt-1 font-ui">
            Remaining before automatic secure logoff
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2 font-ui">
          <button
            onClick={handleExtend}
            className="w-full btn-accent py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw size={16} /> Continue Hospital Session
          </button>

          <button
            onClick={handleSignOutNow}
            className="w-full btn-outline py-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> Log Out Securely
          </button>
        </div>

        <div className="pt-2 text-[10px] text-[var(--color-muted)] border-t border-[var(--color-line)] font-ui">
          Hospital Electronic Health Record Security Standard • 45 CFR § 164.312
        </div>
      </div>
    </div>
  );
}
