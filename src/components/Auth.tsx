import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowRight, ArrowLeft, Eye, EyeOff, Fingerprint, Globe, Key, Lock, Mail, 
  ShieldAlert, ShieldCheck, Smartphone, User, Users, Calendar, ClipboardList, UserCheck
} from 'lucide-react';
import { db, isFirebaseConfigured, auth } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import logoMarkLight from '../../brand/assets/logo-mark-light-on-dark.svg';
import logoMarkDark from '../../brand/assets/logo-mark-dark-on-light.svg';
import { MedicareWaveLoader } from './common/MedicareWaveLoader';

interface Hospital {
  id: string;
  name: string;
  city: string;
}

type AuthStep = 'initial' | 'otp' | 'forgot-password';

interface AuthProps {
  onBack?: () => void;
  initialRole?: 'patient' | 'doctor' | 'admin';
}

export function Auth({ onBack, initialRole = 'patient' }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor' | 'admin' | string>(initialRole);
  const [hospitalId, setHospitalId] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [error, setError] = useState<any>('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, loginAsDemo } = useAuth();

  useEffect(() => {
    if (!isLogin && role !== 'patient') {
      loadHospitals();
    }
  }, [isLogin, role]);

  const loadHospitals = async () => {
    try {
      const q = query(collection(db, 'hospitals'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, city: doc.data().city }));
      setHospitals(data || []);
      if (data && data.length > 0) {
        setHospitalId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading hospitals:', err);
    }
  };

  const generateRandomOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    return code;
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    generateRandomOtp();
    setAuthStep('otp');
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const enteredOtp = otp.join('');
    if (enteredOtp !== generatedOtp) {
      setError(`Invalid verification code. Please enter ${generatedOtp}.`);
      setLoading(false);
      return;
    }

    try {
      if (!isFirebaseConfigured) {
        loginAsDemo(
          role === 'doctor' ? 'doctor' : role === 'admin' ? 'admin' : 'patient',
          email,
          fullName || email.split('@')[0]
        );
        return;
      }
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password, fullName, role, hospitalId || undefined);
        if (error) throw error;
      }
    } catch (err: any) {
      if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key' || err.message?.includes('api-key-not-valid')) {
        loginAsDemo(
          role === 'doctor' ? 'doctor' : role === 'admin' ? 'admin' : 'patient',
          email,
          fullName || email.split('@')[0]
        );
        return;
      }
      let friendlyError = err.message || 'An error occurred';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        friendlyError = 'Invalid credentials. Please verify your email and password.';
      }
      setError(friendlyError);
      setAuthStep('initial');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      alert('A password reset link has been dispatched to your email.');
      setAuthStep('initial');
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleQuickLogin = (roleId: 'admin' | 'doctor' | 'patient', e: string, p: string) => {
    if (!isFirebaseConfigured) {
      loginAsDemo(roleId);
      return;
    }
    setEmail(e);
    setPassword(p);
    setIsLogin(true);
    generateRandomOtp();
    setAuthStep('otp');
  };

  const renderAuthStep = () => {
    switch (authStep) {
      case 'otp':
        return (
          <form onSubmit={handleOtpSubmit} className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-[var(--color-mist)] text-[var(--color-primary)] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Smartphone size={32} />
              </div>
              <h3 className="font-display text-xl text-[var(--color-ink)]">Enter Security Code</h3>
              <p className="text-xs text-[var(--color-muted)] font-ui">
                A verification code was dispatched to <strong className="text-[var(--color-ink)]">{email}</strong>
              </p>
              <button
                type="button"
                onClick={() => setOtp(generatedOtp.split(''))}
                className="text-[11px] font-semibold text-[var(--color-primary)] bg-[var(--color-mist)]/50 px-3 py-1 rounded-full inline-block mt-1 hover:bg-[var(--color-mist)] transition-colors"
              >
                Auto-fill demo code: {generatedOtp}
              </button>
            </div>

            <div className="flex justify-between gap-2 my-4">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otp[i] && i > 0) {
                      document.getElementById(`otp-${i - 1}`)?.focus();
                    }
                  }}
                  className="w-12 h-14 text-center text-xl font-bold bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl focus:border-[var(--color-primary)] outline-none transition-all text-[var(--color-ink)] font-ui"
                  required
                />
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2 border border-red-200 dark:border-red-900/50">
                <ShieldAlert size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.some(d => !d)}
              className="w-full btn-accent py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <MedicareWaveLoader variant="button" text="Authorizing..." />
              ) : (
                <>Authorize Session <ArrowRight size={16} /></>
              )}
            </button>

            <div className="text-center pt-2">
              <button 
                type="button"
                onClick={() => setAuthStep('initial')}
                className="text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors font-ui"
              >
                ← Back to credentials
              </button>
            </div>
          </form>
        );

      case 'forgot-password':
        return (
          <form onSubmit={handleForgotPassword} className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-[var(--color-mist)] text-[var(--color-primary)] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Key size={30} />
              </div>
              <h3 className="font-display text-xl text-[var(--color-ink)]">Reset Credentials</h3>
              <p className="text-xs text-[var(--color-muted)] font-ui">
                Enter your registered clinical email to receive a recovery link.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-muted)] font-ui">Account Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="patient@olmera.health"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                <ShieldAlert size={16} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-sm">
              {loading ? 'Transmitting...' : 'Send Recovery Link'}
            </button>
            
            <button 
              type="button"
              onClick={() => setAuthStep('initial')}
              className="w-full text-center text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors font-ui"
            >
              ← Back to Sign In
            </button>
          </form>
        );

      default:
        return (
          <form onSubmit={handleInitialSubmit} className="space-y-5 animate-fadeIn">
            {!isLogin && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-muted)] font-ui block mb-2">
                    Account Profile
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'patient', label: 'Patient', icon: User },
                      { id: 'doctor', label: 'Specialist', icon: UserCheck },
                      { id: 'admin', label: 'Hospital Admin', icon: ShieldCheck }
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-ui transition-all ${
                          role === r.id 
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm' 
                            : 'bg-[var(--color-surface)] border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-muted)]'
                        }`}
                      >
                        <r.icon size={18} className="mb-1" />
                        <span className="font-semibold">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-xs font-semibold text-[var(--color-muted)] font-ui">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={18} />
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Bharath Burada"
                      required
                    />
                  </div>
                </div>

                {role !== 'patient' && (
                  <div className="space-y-1.5">
                    <label htmlFor="hospital" className="text-xs font-semibold text-[var(--color-muted)] font-ui">Network Hospital</label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={18} />
                      <select
                        id="hospital"
                        value={hospitalId}
                        onChange={(e) => setHospitalId(e.target.value)}
                        className="input-field pl-10"
                        required
                      >
                        <option value="">Select Clinical Facility</option>
                        {hospitals.map((h) => (
                          <option key={h.id} value={h.id}>{h.name} — {h.city}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-muted)] font-ui">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="patient@olmera.health"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--color-muted)] font-ui">Password</label>
                {isLogin && (
                  <button 
                    type="button" 
                    onClick={() => setAuthStep('forgot-password')}
                    className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline font-ui"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                <ShieldAlert size={16} /> {error}
              </div>
            )}

            {/* Main Action: Single Signal Coral Accent per screen */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-accent py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <MedicareWaveLoader variant="button" text="Authorizing..." />
              ) : (
                <>{isLogin ? 'Sign In to Olmera' : 'Create Olmera Account'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col lg:flex-row relative overflow-hidden font-ui">
      {/* LEFT SIDE - DEEP FERN BRAND HERO */}
      <div className="w-full lg:w-1/2 bg-[var(--color-primary)] text-white p-8 lg:p-16 flex flex-col justify-between relative order-2 lg:order-1 min-h-[460px] lg:min-h-screen">
        <div className="relative z-10 space-y-12 max-w-lg">
          {/* Logo Mark & Wordmark */}
          <div className="flex items-center gap-3">
            <img 
              src={logoMarkLight} 
              alt="Olmera" 
              className="h-10 w-10" 
            />
            <span className="font-display text-2xl font-semibold tracking-tight text-[#F4EFE6]">
              olmera
            </span>
          </div>

          <div className="space-y-4">
            <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-semibold tracking-wider uppercase text-[#CFE3DD]">
              Care, quietly connected.
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight text-[#F6F2EA]">
              An open circle of modern clinical care.
            </h1>
            <p className="text-sm sm:text-base text-[#CFE3DD] font-ui font-normal leading-relaxed">
              Quietly connecting patients with verified specialists, biometrics, and accredited hospital networks across Rajam, Vizag, and Srikakulam.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="font-display text-2xl font-semibold text-white block">6 Facilities</span>
              <span className="text-xs text-[#CFE3DD] font-ui">Direct EHR Synchronized</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="font-display text-2xl font-semibold text-white block">108 Rapid SOS</span>
              <span className="text-xs text-[#CFE3DD] font-ui">24/7 Regional Emergency</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 text-xs text-[#CFE3DD]/80 font-ui">
          © {new Date().getFullYear()} Olmera Health. Built with calm, human precision.
        </div>
      </div>

      {/* RIGHT SIDE - AUTH CARD */}
      <div className="flex-1 p-6 sm:p-10 lg:p-16 flex items-center justify-center relative order-1 lg:order-2">
        <div className="w-full max-w-md">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors mb-6 font-ui"
            >
              <ArrowLeft size={14} /> Back to Olmera Homepage
            </button>
          )}

          <div className="card p-8 sm:p-10 bg-[var(--color-surface)] border border-[var(--color-line)] shadow-sm">
            <div className="mb-6 text-center space-y-1">
              <h2 className="font-display text-2xl sm:text-3xl text-[var(--color-ink)]">
                {authStep === 'otp' ? 'Identity Verification' : authStep === 'forgot-password' ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-xs text-[var(--color-muted)] font-ui">
                {isLogin ? 'Access your clinical portal and health vault.' : 'Connect to the Olmera clinical care network.'}
              </p>
            </div>

            {renderAuthStep()}

            {authStep === 'initial' && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setRole('patient');
                  }}
                  className="text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors font-ui"
                >
                  {isLogin ? (
                    <>New to Olmera? <span className="font-semibold text-[var(--color-primary)] hover:underline">Create an account</span></>
                  ) : (
                    <>Already registered? <span className="font-semibold text-[var(--color-primary)] hover:underline">Sign in</span></>
                  )}
                </button>
              </div>
            )}

            {/* Quick Demo Access Station */}
            {isLogin && authStep === 'initial' && (
              <div className="mt-8 pt-6 border-t border-[var(--color-line)]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)] text-center mb-3 font-ui">
                  Instant Demo Access
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'patient', label: 'Patient', email: 'patient@olmera.health', pass: 'Patient@123' },
                    { id: 'doctor', label: 'Specialist', email: 'doctor@olmera.health', pass: 'Doctor@123' },
                    { id: 'admin', label: 'Admin', email: 'admin@olmera.health', pass: 'Admin@123' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => handleQuickLogin(btn.id as any, btn.email, btn.pass)}
                      className="py-2.5 px-2 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-line)] text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-mist)]/50 transition-all text-center font-ui"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
