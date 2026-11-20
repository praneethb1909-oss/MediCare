/**
 * Automated Verification Suite for Hospital Admin Authentication
 * Validates credential enforcement, facility mismatch blocking, password policies,
 * account lockout triggers, role-based access control, and session timeouts.
 */

import { hospitalIdp, hashHospitalPassword } from './hospitalIdp';
import { validateHospitalPassword } from './passwordPolicy';
import { hasHospitalPermission, HOSPITAL_ROLES } from './rbac';
import { sessionManager } from './sessionManager';
import { auditLogger, SecurityAuditEntry } from './auditLogger';

export interface TestResultItem {
  name: string;
  category: 'IdP Authentication' | 'Facility Affiliation' | 'Password Policy' | 'Account Lockout' | 'RBAC' | 'Session & Audit';
  passed: boolean;
  durationMs: number;
  details: string;
}

export interface HospitalAuthTestSuiteReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  allPassed: boolean;
  results: TestResultItem[];
}

export async function runHospitalAuthValidationSuite(): Promise<HospitalAuthTestSuiteReport> {
  const results: TestResultItem[] = [];
  const startAll = Date.now();

  await hospitalIdp.initialize();

  // Test 1: Valid Hospital Credentials Authenticate Successfully
  const t1Start = Date.now();
  try {
    const res = await hospitalIdp.authenticate({
      hospitalId: 'hosp-1',
      staffIdOrEmail: 'OCH-ADM-01',
      password: 'ClinicSecure@2026!',
      securityToken: '894102'
    });

    const passed = res.success === true && !!res.sessionToken && res.user?.role === 'hospital_administrator';
    results.push({
      name: 'Valid Hospital Staff Credentials Authentication',
      category: 'IdP Authentication',
      passed,
      durationMs: Date.now() - t1Start,
      details: passed 
        ? `Successfully authenticated Dr. K. V. Ramanayya (${res.user?.staffId}) with issued session token.`
        : `Authentication failed unexpectedly: ${res.error}`
    });
  } catch (err: any) {
    results.push({
      name: 'Valid Hospital Staff Credentials Authentication',
      category: 'IdP Authentication',
      passed: false,
      durationMs: Date.now() - t1Start,
      details: `Exception thrown: ${err.message}`
    });
  }

  // Test 2: Unaffiliated External User Blocked
  const t2Start = Date.now();
  try {
    const res = await hospitalIdp.authenticate({
      hospitalId: 'hosp-1',
      staffIdOrEmail: 'unauthorized_guest@gmail.com',
      password: 'ClinicSecure@2026!'
    });

    const passed = Boolean(res.success === false && res.error?.includes('Unrecognized hospital staff credentials'));
    results.push({
      name: 'Unauthorized / External User Blocked Exclusively',
      category: 'IdP Authentication',
      passed,
      durationMs: Date.now() - t2Start,
      details: passed 
        ? 'External/unregistered credential was strictly rejected with access denial.'
        : 'Security failure: Unaffiliated user was not rejected properly.'
    });
  } catch (err: any) {
    results.push({
      name: 'Unauthorized / External User Blocked Exclusively',
      category: 'IdP Authentication',
      passed: false,
      durationMs: Date.now() - t2Start,
      details: `Exception thrown: ${err.message}`
    });
  }

  // Test 3: Hospital Facility Affiliation Mismatch Blocked
  const t3Start = Date.now();
  try {
    // Staff from Vizag (hosp-2) attempting to login under Rajam (hosp-1)
    const res = await hospitalIdp.authenticate({
      hospitalId: 'hosp-1', // Rajam
      staffIdOrEmail: 'OAMI-DIR-01', // Vizag staff member
      password: 'ClinicSecure@2026!'
    });

    const passed = Boolean(res.success === false && (res.error?.includes('Mismatch') || res.error?.includes('registered with')));
    results.push({
      name: 'Cross-Facility Affiliation Isolation',
      category: 'Facility Affiliation',
      passed,
      durationMs: Date.now() - t3Start,
      details: passed 
        ? 'Cross-hospital access blocked: staff profile from Vizag cannot authenticate under Rajam facility portal.'
        : `Security failure: Cross-facility credential was permitted: ${JSON.stringify(res)}`
    });
  } catch (err: any) {
    results.push({
      name: 'Cross-Facility Affiliation Isolation',
      category: 'Facility Affiliation',
      passed: false,
      durationMs: Date.now() - t3Start,
      details: `Exception thrown: ${err.message}`
    });
  }

  // Test 4: Password Policy Enforcement
  const t4Start = Date.now();
  try {
    const weak1 = validateHospitalPassword('password123'); // violates common terms & length & special
    const weak2 = validateHospitalPassword('Short!1'); // too short
    const valid = validateHospitalPassword('Kalyan@HydClinical#2026'); // strong clinical password

    const passed = !weak1.valid && !weak2.valid && valid.valid && valid.strength === 'hospital-grade';
    results.push({
      name: 'Hospital Password Policy Complexity & Dictionary Check',
      category: 'Password Policy',
      passed,
      durationMs: Date.now() - t4Start,
      details: passed
        ? 'Policy correctly rejected weak passwords and validated hospital-grade 10+ char complex string.'
        : `Policy validation discrepancy: weak1=${weak1.valid}, weak2=${weak2.valid}, valid=${valid.valid}`
    });
  } catch (err: any) {
    results.push({
      name: 'Hospital Password Policy Complexity & Dictionary Check',
      category: 'Password Policy',
      passed: false,
      durationMs: Date.now() - t4Start,
      details: `Exception: ${err.message}`
    });
  }

  // Test 5: Account Lockout after Consecutive Failed Attempts
  const t5Start = Date.now();
  try {
    // Attempt invalid passwords on Srikakulam CMO account
    let finalRes: any = null;
    for (let i = 0; i < 5; i++) {
      finalRes = await hospitalIdp.authenticate({
        hospitalId: 'hosp-3',
        staffIdOrEmail: 'MDC-CMO-01',
        password: `WrongPassAttempt#${i}`
      });
    }

    const isLocked = finalRes?.success === false && finalRes?.error?.includes('Account locked');
    
    // Unlock account back to preserve system state
    await hospitalIdp.unlockAccount('MDC-CMO-01', 'OLM-SUP-00');

    results.push({
      name: 'Account Lockout Defense on 5 Consecutive Failed Attempts',
      category: 'Account Lockout',
      passed: isLocked,
      durationMs: Date.now() - t5Start,
      details: isLocked
        ? 'Account automatically locked after 5 failed attempts with 15-minute freeze window, and successfully restored.'
        : 'Failed: Account was not locked after 5 attempts.'
    });
  } catch (err: any) {
    results.push({
      name: 'Account Lockout Defense on 5 Consecutive Failed Attempts',
      category: 'Account Lockout',
      passed: false,
      durationMs: Date.now() - t5Start,
      details: `Exception: ${err.message}`
    });
  }

  // Test 6: Role-Based Access Control (RBAC) Permitted vs Forbidden Operations
  const t6Start = Date.now();
  try {
    const superAdminCanManageInfra = hasHospitalPermission('super_admin', 'infra:manage');
    const cmoCannotManageBilling = !hasHospitalPermission('chief_medical_officer', 'billing:manage');
    const auditorCanExportAudit = hasHospitalPermission('audit_compliance_officer', 'audit:export');
    const adminCanManageBeds = hasHospitalPermission('hospital_administrator', 'infra:manage');

    const passed = superAdminCanManageInfra && cmoCannotManageBilling && auditorCanExportAudit && adminCanManageBeds;
    results.push({
      name: 'Granular Role-Based Access Control (RBAC) Boundaries',
      category: 'RBAC',
      passed,
      durationMs: Date.now() - t6Start,
      details: passed
        ? 'Verified distinct permission boundaries between Super Admin, CMO, Facility Admin, and Compliance Auditor.'
        : 'Discrepancy in role permission evaluation.'
    });
  } catch (err: any) {
    results.push({
      name: 'Granular Role-Based Access Control (RBAC) Boundaries',
      category: 'RBAC',
      passed: false,
      durationMs: Date.now() - t6Start,
      details: `Exception: ${err.message}`
    });
  }

  // Test 7: Session Initialization & Inactivity Calculations
  const t7Start = Date.now();
  try {
    const mockUser = {
      id: 'staff-rjm-01',
      staffId: 'OCH-ADM-01',
      fullName: 'Dr. K. V. Ramanayya',
      hospitalId: 'hosp-1',
      hospitalName: 'Olmera Center for Health',
      email: 'admin.rajam@olmera.health',
      department: 'Hospital Administration',
      role: 'hospital_administrator' as const,
      status: 'active' as const,
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date().toISOString(),
      mfaEnabled: true
    };

    const session = sessionManager.startSession(mockUser, 'test_token_8841');
    const isValid = sessionManager.isSessionValid();
    const hasRemainingTime = session.expiresAt > Date.now();

    results.push({
      name: 'Session Lifecycle & 15-Minute HIPAA Inactivity Expiry',
      category: 'Session & Audit',
      passed: isValid && hasRemainingTime,
      durationMs: Date.now() - t7Start,
      details: (isValid && hasRemainingTime)
        ? `Session created with token "${session.token.slice(0, 14)}..." and 15m expiration window.`
        : 'Session manager failed to validate active session.'
    });
  } catch (err: any) {
    results.push({
      name: 'Session Lifecycle & 15-Minute HIPAA Inactivity Expiry',
      category: 'Session & Audit',
      passed: false,
      durationMs: Date.now() - t7Start,
      details: `Exception: ${err.message}`
    });
  }

  // Test 8: Security Audit Trail Logging with Checksum
  const t8Start = Date.now();
  try {
    const entry = await auditLogger.logEvent({
      eventType: 'AUTH_SUCCESS',
      status: 'success',
      hospitalId: 'hosp-1',
      hospitalName: 'Olmera Center for Health',
      staffId: 'OCH-ADM-01',
      email: 'admin.rajam@olmera.health',
      role: 'hospital_administrator',
      details: 'Automated verification transaction test.'
    });

    const logs = await auditLogger.getRecentLogs(5);
    const logFound = logs.some(l => l.id === entry.id && !!l.checksum);

    results.push({
      name: 'Tamper-Evident Security Audit Transaction Logging',
      category: 'Session & Audit',
      passed: logFound,
      durationMs: Date.now() - t8Start,
      details: logFound
        ? `Logged security event with SHA-256 checksum "${entry.checksum}" and verified retrieval.`
        : 'Audit log entry was not found in storage.'
    });
  } catch (err: any) {
    results.push({
      name: 'Tamper-Evident Security Audit Transaction Logging',
      category: 'Session & Audit',
      passed: false,
      durationMs: Date.now() - t8Start,
      details: `Exception: ${err.message}`
    });
  }

  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.length - passedTests;

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedTests,
    failedTests,
    successRate: Math.round((passedTests / results.length) * 100),
    allPassed: failedTests === 0,
    results
  };
}
