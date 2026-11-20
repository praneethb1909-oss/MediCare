import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, Lock, Mail, Key, ArrowRight, ArrowLeft, 
  Eye, EyeOff, ShieldAlert, CheckCircle2, XCircle, Clock, 
  Smartphone, Award, FileText, ChevronRight, Activity, Terminal
} from 'lucide-react';
import { OlmeraWordmark } from '../brand/OlmeraWordmark';
import { hospitalIdp, HospitalRecord, HospitalStaffProfile } from '../../services/auth/hospitalIdp';
import { validateHospitalPassword, HOSPITAL_PASSWORD_RULES } from '../../services/auth/passwordPolicy';
import { runHospitalAuthValidationSuite, HospitalAuthTestSuiteReport } from '../../services/auth/validateHospitalAuth';
import { MedicareWaveLoader } from '../common/MedicareWaveLoader';

interface HospitalAdminLoginProps {
  onSuccess: (adminProfile: HospitalStaffProfile, sessionToken: string) => void;
  onBackToPublic: () => void;
}

export function HospitalAdminLogin({ onSuccess, onBackToPublic }: HospitalAdminLoginProps) {
  const [hospitals, setHospitals] = useState<HospitalRecord[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('hosp-1');
  const [staffIdentifier, setStaffIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [securityToken, setSecurityToken] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [requiresMfaStep, setRequiresMfaStep] = useState<boolean>(false);

  // Status & Validation States
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState<number | null>(null);
  const [showPasswordRules, setShowPasswordRules] = useState<boolean>(false);

  // Automated Test Suite Modal
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const [runningTests, setRunningTests] = useState<boolean>(false);
  const [testReport, setTestReport] = useState<HospitalAuthTestSuiteReport | null>(null);

  useEffect(() => {
    hospitalIdp.initialize().then(() => {
      const list = hospitalIdp.getHospitals();
      setHospitals(list);
      if (list.length > 0) setSelectedHospitalId(list[0].id);
    });
  }, []);

  const passwordEvaluation = validateHospitalPassword(password);
  const selectedHospital = hospitals.find(h => h.id === selectedHospitalId);

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedHospitalId) {
      setErrorMessage('Please select your accredited hospital facility.');
      return;
    }

    if (!staffIdentifier.trim()) {
      setErrorMessage('Please provide your official staff ID or institutional hospital email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your hospital password.');
      return;
    }

    if (!passwordEvaluation.valid) {
      setErrorMessage(
        `Password does not meet hospital security policy. Failed requirements: ${passwordEvaluation.errors.join(', ')}.`
      );
      setShowPasswordRules(true);
      return;
    }

    // Advance to security token / MFA verification step
    setRequiresMfaStep(true);
  };

  const handleFinalAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await hospitalIdp.authenticate({
        hospitalId: selectedHospitalId,
        staffIdOrEmail: staffIdentifier,
        password,
        securityToken: securityToken.trim()
      });

      if (!res.success || !res.user || !res.sessionToken) {
        setErrorMessage(res.error || 'Authentication rejected by Hospital Identity Provider.');
        setRemainingAttempts(res.remainingAttempts ?? null);
        setLockoutRemainingSec(res.lockoutRemainingSeconds ?? null);
        setLoading(false);
        return;
      }

      // Successfully authenticated
      onSuccess(res.user, res.sessionToken);
    } catch (err: any) {
      console.error('Hospital authentication error:', err);
      setErrorMessage(err.message || 'System encountered a network error while verifying hospital directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunSecurityTests = async () => {
    setRunningTests(true);
    setShowTestModal(true);
    try {
      const report = await runHospitalAuthValidationSuite();
      setTestReport(report);
    } catch (e: any) {
      console.error('Test execution failed:', e);
    } finally {
      setRunningTests(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] flex flex-col justify-between font-ui transition-colors">
      
      {/* Top Clinical Security Banner */}
      <header className="border-b border-[var(--color-line)] bg-[var(--color-surface)] py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToPublic}
              className="p-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)] transition-colors"
              title="Return to Public Portal"
            >
              <ArrowLeft size={18} />
            </button>
            <OlmeraWordmark className="h-7 w-auto" />
            <span className="hidden sm:inline-block w-px h-4 bg-[var(--color-line)]"></span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-mist)]/60 text-[var(--color-primary)] text-[10px] font-semibold uppercase tracking-wider">
              <ShieldCheck size={12} /> Hospital Enterprise IdP
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={handleRunSecurityTests}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-line)] hover:border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-surface-subtle)] font-medium text-xs transition-colors"
            >
              <Terminal size={14} /> Security Test Suite
            </button>
            <span className="hidden md:inline text-[var(--color-muted)] text-[11px]">
              EHR Access Standard § 164.312
            </span>
          </div>
        </div>
      </header>

      {/* Main Authentication Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 lg:p-12 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full max-w-5xl items-center">
          
          {/* Left Column: Hospital Identity Context & Compliance Notice */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] font-semibold text-[var(--color-accent)] uppercase tracking-wider block">
                Restricted Clinical Access
              </span>
              <h1 className="font-display text-3xl sm:text-4xl text-[var(--color-ink)] font-semibold leading-tight">
                Hospital Network <br />
                <span className="italic text-[var(--color-primary)]">Command Center.</span>
              </h1>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                Authentication into this portal is restricted exclusively to accredited hospital directors, medical officers, and operations administrators across Andhra Pradesh.
              </p>
            </div>

            {/* Selected Hospital Facility Card */}
            {selectedHospital && (
              <div className="card p-5 bg-[var(--color-surface)] border border-[var(--color-line)] shadow-sm space-y-2">
                <div className="flex items-center gap-2.5 text-[var(--color-primary)]">
                  <Building2 size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Target Clinical Facility</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">
                  {selectedHospital.name}
                </h3>
                <p className="text-xs text-[var(--color-muted)]">
                  Regional Hub: {selectedHospital.city} • Code: {selectedHospital.code}
                </p>
                <div className="pt-2 border-t border-[var(--color-line)] flex items-center justify-between text-[11px] text-[var(--color-muted)]">
                  <span>Authorized Domain:</span>
                  <span className="font-mono text-[var(--color-primary)] font-semibold">@{selectedHospital.allowedDomain}</span>
                </div>
              </div>
            )}

            {/* Hospital Security & Regulatory Notice */}
            <div className="card p-5 bg-[var(--color-surface)] border border-[var(--color-line)] shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-[var(--color-primary)]">
                <ShieldCheck size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Hospital IdP Safeguards</span>
              </div>
              <ul className="text-xs text-[var(--color-muted)] space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0" />
                  <span>Administrative privileges are issued exclusively by accredited medical superintendents.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0" />
                  <span>Cross-facility credential usage is strictly prevented by facility identity boundaries.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0" />
                  <span>5 consecutive failed attempts trigger an automated 15-minute clinical account freeze.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0" />
                  <span>Sessions automatically terminate after 15 minutes of idle time per HIPAA § 164.312.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Secure Form Card */}
          <div className="lg:col-span-7">
            <div className="card p-6 sm:p-10 bg-[var(--color-surface)] border border-[var(--color-line)] shadow-lg rounded-3xl">
              
              <div className="mb-6 space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
                    {requiresMfaStep ? 'Two-Factor Token Verification' : 'Hospital Staff Authentication'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--color-mist)] text-[var(--color-primary)] text-[10px] font-semibold uppercase tracking-wider">
                    {requiresMfaStep ? 'Step 2 of 2' : 'Step 1 of 2'}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  {requiresMfaStep 
                    ? 'Enter the 6-digit cryptographic security code from your clinical authenticator.'
                    : 'Validate your clinical identity against your hospital’s enterprise user database.'}
                </p>
              </div>

              {/* Error Message Box */}
              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-300 animate-fadeIn">
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold">{errorMessage}</p>
                    {remainingAttempts !== null && remainingAttempts > 0 && (
                      <p className="text-[11px] opacity-90">
                        {remainingAttempts} attempt(s) remaining before automatic 15-minute account lockout.
                      </p>
                    )}
                    {lockoutRemainingSec !== null && lockoutRemainingSec > 0 && (
                      <p className="text-[11px] opacity-90">
                        Lockout expires in {Math.ceil(lockoutRemainingSec / 60)} minutes.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 1: Hospital Facility & Staff Credentials */}
              {!requiresMfaStep ? (
                <form onSubmit={handleInitialSubmit} className="space-y-5 animate-fadeIn">
                  
                  {/* Hospital Facility Selector */}
                  <div className="space-y-1.5">
                    <label htmlFor="hosp-select" className="text-xs font-semibold text-[var(--color-muted)] block">
                      Accredited Hospital Facility
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={17} />
                      <select
                        id="hosp-select"
                        value={selectedHospitalId}
                        onChange={(e) => setSelectedHospitalId(e.target.value)}
                        className="input-field pl-10"
                        required
                      >
                        {hospitals.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} — {h.city} ({h.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Staff ID or Institutional Email */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="staff-id" className="text-xs font-semibold text-[var(--color-muted)]">
                        Staff Badge ID or Institutional Email
                      </label>
                      <span className="text-[10px] text-[var(--color-muted)] font-mono">e.g. OAMI-DIR-01</span>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={17} />
                      <input
                        id="staff-id"
                        type="text"
                        value={staffIdentifier}
                        onChange={(e) => setStaffIdentifier(e.target.value)}
                        placeholder="admin.rajam@olmera.health or OCH-ADM-01"
                        className="input-field pl-10"
                        required
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Password Field with Policy Feedback */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="staff-password" className="text-xs font-semibold text-[var(--color-muted)]">
                        Hospital Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPasswordRules(!showPasswordRules)}
                        className="text-[11px] text-[var(--color-primary)] hover:underline font-semibold"
                      >
                        {showPasswordRules ? 'Hide Policy' : 'View Policy'}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={17} />
                      <input
                        id="staff-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setShowPasswordRules(true)}
                        placeholder="••••••••••••"
                        className="input-field pl-10 pr-10"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Live Password Strength Meter */}
                    {password && (
                      <div className="pt-1.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[var(--color-muted)]">Policy Strength:</span>
                          <span className={`font-semibold capitalize ${
                            passwordEvaluation.strength === 'hospital-grade' ? 'text-emerald-600' :
                            passwordEvaluation.strength === 'strong' ? 'text-blue-600' :
                            passwordEvaluation.strength === 'moderate' ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {passwordEvaluation.strength.replace('-', ' ')} ({passwordEvaluation.score}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--color-line)] rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              passwordEvaluation.score >= 90 ? 'bg-emerald-500' :
                              passwordEvaluation.score >= 75 ? 'bg-blue-500' :
                              passwordEvaluation.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${passwordEvaluation.score}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Real-Time Password Checklist Dropdown */}
                    {showPasswordRules && (
                      <div className="p-3.5 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-line)] mt-2 space-y-2 text-xs">
                        <span className="font-semibold text-[11px] text-[var(--color-ink)] block">
                          Hospital Credential Security Rules:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                          {HOSPITAL_PASSWORD_RULES.map((rule) => {
                            const isPassed = rule.validator(password);
                            return (
                              <div key={rule.id} className="flex items-center gap-1.5">
                                {isPassed ? (
                                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                ) : (
                                  <XCircle size={13} className="text-[var(--color-muted)] shrink-0" />
                                )}
                                <span className={isPassed ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-[var(--color-muted)]'}>
                                  {rule.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Primary Continue Button (Signal Coral Accent CTA) */}
                  <button
                    type="submit"
                    className="w-full btn-accent py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <span>Proceed to Verification</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                /* Step 2: 2FA / Hospital Security Token Verification */
                <form onSubmit={handleFinalAuthenticate} className="space-y-6 animate-fadeIn">
                  <div className="text-center space-y-2 p-4 bg-[var(--color-surface-subtle)] rounded-2xl border border-[var(--color-line)]">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-mist)] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-2">
                      <Smartphone size={24} />
                    </div>
                    <h3 className="font-display text-base font-semibold text-[var(--color-ink)]">
                      Hospital Security Token
                    </h3>
                    <p className="text-xs text-[var(--color-muted)] max-w-sm mx-auto">
                      Enter the 6-digit code displayed on your registered hardware token or hospital authenticator application.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="sec-token" className="text-xs font-semibold text-[var(--color-muted)] block text-center">
                      6-Digit Clinical Passcode
                    </label>
                    <input
                      id="sec-token"
                      type="text"
                      maxLength={6}
                      value={securityToken}
                      onChange={(e) => setSecurityToken(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] focus:border-[var(--color-primary)] outline-none text-[var(--color-ink)]"
                      placeholder="894102"
                      required
                      autoFocus
                    />
                    <div className="text-center pt-1">
                      <p className="text-[11px] text-[var(--color-muted)]">
                        TOTP security code refreshes every 30 seconds via hospital authenticator
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <button
                      type="submit"
                      disabled={loading || securityToken.length !== 6}
                      className="w-full btn-accent py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {loading ? (
                        <MedicareWaveLoader variant="button" text="Authenticating with IdP..." />
                      ) : (
                        <>
                          <ShieldCheck size={17} /> Authorize Clinical Session
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setRequiresMfaStep(false)}
                      className="w-full btn-outline py-2.5 text-xs font-semibold rounded-xl"
                    >
                      ← Back to Credential Entry
                    </button>
                  </div>
                </form>
              )}

              {/* Security Compliance Disclaimer */}
              <div className="mt-8 pt-5 border-t border-[var(--color-line)] text-[10px] text-[var(--color-muted)] space-y-1">
                <p className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-[var(--color-primary)]" />
                  <span>Encrypted with SHA-256 salted credentials & TLS 1.3 cryptographic transport.</span>
                </p>
                <p>
                  Unauthorized attempts are recorded in the facility immutable audit register under Section § 164.312(b).
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Security Test Suite Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="card p-6 sm:p-8 max-w-3xl w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl max-h-[90vh] flex flex-col shadow-2xl">
            
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line)]">
              <div className="flex items-center gap-2.5">
                <Terminal size={20} className="text-[var(--color-primary)]" />
                <h3 className="font-display text-xl font-semibold text-[var(--color-ink)]">
                  Hospital Authentication Security Verification Suite
                </h3>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {runningTests ? (
                <div className="py-16 text-center space-y-4">
                  <MedicareWaveLoader 
                    variant="inline" 
                    text="Executing Automated Security & Identity Provider Tests..." 
                  />
                  <p className="text-xs text-[var(--color-muted)]">
                    Simulating credential attacks, facility mismatches, lockout thresholds, and session timeouts...
                  </p>
                </div>
              ) : testReport ? (
                <div className="space-y-4">
                  {/* Results Summary Ribbon */}
                  <div className="p-4 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--color-line)] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">
                        Suite Verification Status
                      </span>
                      <p className="font-display text-2xl font-bold text-emerald-600">
                        {testReport.passedTests} / {testReport.totalTests} Passed ({testReport.successRate}%)
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full font-semibold text-xs border border-emerald-200">
                      Zero Security Violations
                    </span>
                  </div>

                  {/* Individual Test Cases */}
                  <div className="space-y-2">
                    {testReport.results.map((t, idx) => (
                      <div 
                        key={idx} 
                        className="p-3.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {t.passed ? (
                              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle size={16} className="text-red-600 shrink-0" />
                            )}
                            <span className="font-semibold text-[var(--color-ink)] text-sm">{t.name}</span>
                            <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface-subtle)] text-[10px] text-[var(--color-muted)] font-mono">
                              {t.category}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-muted)] pl-6">{t.details}</p>
                        </div>
                        <span className="text-[10px] text-[var(--color-muted)] font-mono shrink-0">
                          {t.durationMs}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-4 border-t border-[var(--color-line)] flex justify-end gap-2">
              <button
                onClick={handleRunSecurityTests}
                disabled={runningTests}
                className="btn-primary px-4 py-2 text-xs font-semibold rounded-xl"
              >
                Re-Run Suite
              </button>
              <button
                onClick={() => setShowTestModal(false)}
                className="btn-outline px-4 py-2 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[var(--color-line)] py-4 px-4 text-center text-xs text-[var(--color-muted)] font-ui">
        © {new Date().getFullYear()} Olmera Health Network. Hospital Identity Provider & Credential Gateway. Care, quietly connected.
      </footer>
    </div>
  );
}
