import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity, ArrowRight, Eye, EyeOff, Fingerprint, Globe, Heart, Key, Lock, Mail, ShieldAlert, ShieldCheck, Smartphone, Stethoscope, User, Users, Calendar, ClipboardList } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface Hospital {
  id: string;
  name: string;
  city: string;
}

type AuthStep = 'initial' | 'otp' | '2fa' | 'forgot-password';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('patient');
  const [hospitalId, setHospitalId] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

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

    // Verify the generated OTP
    const enteredOtp = otp.join('');
    if (enteredOtp !== generatedOtp) {
      setError(`Invalid verification code. Please enter ${generatedOtp}.`);
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password, fullName, role, hospitalId || undefined);
        if (error) throw error;
      }
    } catch (err: any) {
      let friendlyError = err.message || 'An error occurred';
      
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        friendlyError = 'Email/Password authentication is not enabled in your Firebase Console. Please go to Authentication > Sign-in method and enable Email/Password.';
      } else if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        friendlyError = (
          <div className="text-left space-y-2">
            <p className="font-bold">Sign-in method is not enabled.</p>
            <ol className="list-decimal ml-4 text-xs font-normal">
              <li>Open your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-600">Firebase Console</a></li>
              <li>Go to <strong>Authentication &gt; Sign-in method</strong></li>
              <li>Click <strong>Add new provider</strong></li>
              <li>Select <strong>Email/Password</strong> and click <strong>Enable</strong></li>
              <li>Click <strong>Save</strong></li>
            </ol>
          </div>
        ) as any;
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        friendlyError = 'Invalid email or password. Please check your credentials or use “Forgot password” to reset.';
      } else if (err.code === 'auth/invalid-api-key') {
        friendlyError = 'Invalid Firebase API Key. Please check your configuration.';
      } else if (err.code === 'auth/network-request-failed') {
        friendlyError = 'Network error. Please check your internet connection.';
      }

      setError(friendlyError);
      // On error, we go back to initial to allow corrections, but keep the email/pass
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
      alert('A recovery link has been sent to your email.');
      setAuthStep('initial');
    } catch (err: any) {
      let msg = err?.message || 'Failed to send recovery link';
      if (err?.code === 'auth/user-not-found') {
        msg = 'No account found with this email. Please check the email or sign up.';
      }
      setError(msg);
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
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleQuickLogin = async (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setIsLogin(true);
    generateRandomOtp();
    // Directly go to OTP step to make it feel seamless
    setAuthStep('otp');
  };

  const renderAuthStep = () => {
    switch (authStep) {
      case 'otp':
        return (
          <form onSubmit={handleOtpSubmit} className="space-y-8 animate-fadeIn">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500/10 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-6 shadow-xl">
                <Smartphone size={40} strokeWidth={1.5} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Verification code sent to <br/><span className="font-bold text-slate-900 dark:text-slate-200">{email}</span></p>
              <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 mt-2 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 py-1 px-3 rounded-full inline-block border border-blue-100 dark:border-blue-800">Use code: {generatedOtp}</p>
            </div>

            <div className="flex justify-between gap-2">
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
                  className="w-full h-16 text-center text-2xl font-black bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white"
                  required
                />
              ))}
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading || otp.some(d => !d)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-5 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all group disabled:opacity-50 disabled:translate-y-0"
              >
                {loading ? (
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>Authorize Session <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>

              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => generateRandomOtp()}
                  className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest"
                >
                  Resend New Code
                </button>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setAuthStep('initial')}
              className="w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
            >
              ← Edit Credentials
            </button>
          </form>
        );

      case 'forgot-password':
        return (
          <form onSubmit={handleForgotPassword} className="space-y-8 animate-fadeIn">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-500/10 dark:bg-purple-900/30 rounded-3xl flex items-center justify-center text-purple-600 mx-auto mb-6 shadow-xl">
                <Key size={40} strokeWidth={1.5} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-center">Enter your registered clinical email to <br/>receive a secure reset link.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Clinical Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-14 pr-6 text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white"
                  placeholder="name@medicare.in"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-2xl text-[10px] font-black flex items-center gap-3 border border-red-100 dark:border-red-900/30 animate-shake uppercase tracking-widest">
                <ShieldAlert size={16} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all">
              {loading ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : 'Send Recovery Link'}
            </button>
            
            <button 
              type="button"
              onClick={() => setAuthStep('initial')}
              className="w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
            >
              ← Back to Sign In
            </button>
          </form>
        );

      default:
        return (
          <form onSubmit={handleInitialSubmit} className="space-y-6 animate-fadeIn">
            {!isLogin && (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Account Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'patient', label: 'Patient', icon: Heart },
                      { id: 'doctor', label: 'Doctor', icon: Stethoscope },
                      { id: 'admin', label: 'Admin', icon: ShieldCheck }
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all border-2 ${
                          role === r.id 
                            ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-xl shadow-blue-500/10 dark:bg-blue-900/20' 
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-blue-200'
                        }`}
                      >
                        <r.icon size={20} className="mb-2" strokeWidth={role === r.id ? 2.5 : 2} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-14 pr-6 text-sm font-medium focus:border-blue-500 outline-none transition-all dark:text-white"
                      placeholder="Johnathan Doe"
                      required
                    />
                  </div>
                </div>

                {role !== 'patient' && (
                  <div className="space-y-2 animate-fadeIn">
                    <label htmlFor="hospital" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Facility</label>
                    <div className="relative">
                       <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <select
                        id="hospital"
                        value={hospitalId}
                        onChange={(e) => setHospitalId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-14 pr-10 text-sm font-medium focus:border-blue-500 outline-none transition-all dark:text-white appearance-none"
                        required
                      >
                        <option value="">Select Facility</option>
                        {hospitals.map((h) => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-14 pr-6 text-sm font-medium focus:border-blue-500 outline-none transition-all dark:text-white"
                  placeholder="name@medicare.in"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Security Key</label>
                {isLogin && (
                  <button type="button" onClick={() => setAuthStep('forgot-password')} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">Forgot?</button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-14 pr-12 text-sm font-medium focus:border-blue-500 outline-none transition-all dark:text-white"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-2xl text-[10px] font-black flex items-center gap-3 border border-red-100 dark:border-red-900/30 animate-shake uppercase tracking-widest">
                <ShieldAlert size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-5 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 mt-6 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all group disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .dark .glass-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>

      {/* LEFT SIDE - BRANDING & 3D ELEMENTS */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 p-8 lg:p-20 flex flex-col justify-between relative overflow-hidden order-2 lg:order-1 min-h-[500px] lg:min-h-screen">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12">
          <Activity size={400} strokeWidth={1} className="text-white" />
        </div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 -right-20 w-60 h-60 bg-cyan-300/20 rounded-full blur-[80px]"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-16 group cursor-default">
            <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 group-hover:scale-110 transition-transform duration-500">
              <Activity className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-black text-3xl tracking-tighter text-white">MediCare</span>
          </div>

          <div className="space-y-8 max-w-xl">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/20 shadow-lg">
                <ShieldCheck size={14} className="text-cyan-300" /> 99.9% Uptime
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/20 shadow-lg">
                <Lock size={14} className="text-purple-300" /> Secure System
              </span>
            </div>

            <h2 className="text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight drop-shadow-2xl">
              Healthcare <br/>
              <span className="text-cyan-200">Reimagined.</span>
            </h2>
            <p className="text-blue-50/90 text-xl font-medium leading-relaxed max-w-md">
              Smart hospital management platform built for modern clinical excellence and patient care.
            </p>
          </div>
        </div>

        {/* 3D FLOATING CARDS */}
        <div className="relative z-10 mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg">
          <div className="animate-float glass-card p-6 rounded-3xl border border-white/20 shadow-2xl group hover:scale-105 transition-transform duration-500">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-100 shadow-inner">
                <Users size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">12.8k</span>
                <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Patients Active</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 w-3/4 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
            </div>
          </div>

          <div className="animate-float-delayed glass-card p-6 rounded-3xl border border-white/20 shadow-2xl sm:mt-8 group hover:scale-105 transition-transform duration-500">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-100 shadow-inner">
                <Calendar size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">450+</span>
                <span className="text-[10px] font-bold text-purple-100 uppercase tracking-widest">Appointments Today</span>
              </div>
            </div>
            <div className="flex -space-x-3 mt-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white/20 bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-[8px] font-black text-white shadow-lg">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-[8px] font-black text-white">
                +12
              </div>
            </div>
          </div>

          <div className="animate-float-delayed glass-card p-6 rounded-3xl border border-white/20 shadow-2xl group hover:scale-105 transition-transform duration-500 sm:col-span-2 sm:max-w-xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-100 shadow-inner">
                <ClipboardList size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">94%</span>
                <span className="text-[10px] font-bold text-cyan-100 uppercase tracking-widest">Prescription Accuracy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - AUTH WORKSTATION */}
      <div className="flex-1 p-8 lg:p-20 bg-slate-50 dark:bg-slate-950 flex items-center justify-center relative order-1 lg:order-2">
        {/* Background blobs for right side */}
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-purple-400/10 rounded-full blur-[100px]"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="glass-card p-10 lg:p-12 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-none border border-white/40 dark:border-slate-800">
            <div className="mb-10 text-center">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                {authStep === 'otp' ? 'Verify Identity' : authStep === 'forgot-password' ? 'Reset Access' : isLogin ? 'Sign In' : 'Create Account'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                {authStep === 'otp' ? 'Enter verification code' : authStep === 'forgot-password' ? 'Secure password recovery' : isLogin ? 'Enter your credentials' : 'Join our healthcare network'}
              </p>
            </div>

            {renderAuthStep()}

            {authStep === 'initial' && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setAuthStep('initial');
                    setError('');
                    setRole('patient');
                    setHospitalId('');
                  }}
                  className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-all group"
                >
                  {isLogin ? (
                    <>New to MediCare? <span className="text-blue-600 group-hover:underline font-black">Create Account</span></>
                  ) : (
                    <>Already registered? <span className="text-blue-600 group-hover:underline font-black">Secure Sign In</span></>
                  )}
                </button>
              </div>
            )}

            {/* Quick Access Section */}
            {isLogin && authStep === 'initial' && (
              <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">Quick Access Station</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'admin', label: 'Admin', icon: ShieldCheck, color: 'indigo', email: 'admin@medicare.in', pass: 'Admin@123' },
                    { id: 'doctor', label: 'Doctor', icon: Stethoscope, color: 'blue', email: 'suresh.a@medicare.in', pass: 'Suresh@123' },
                    { id: 'patient', label: 'Patient', icon: User, color: 'emerald', email: 'patient@medicare.in', pass: 'Patient@123' }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => handleQuickLogin(btn.email, btn.pass)}
                      className="flex flex-col items-center justify-center p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 transition-all group active:scale-95"
                    >
                      <div className={`p-2 rounded-xl bg-${btn.color}-50 dark:bg-${btn.color}-900/20 text-${btn.color}-600 mb-2 group-hover:scale-110 transition-transform`}>
                        <btn.icon size={20} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400">{btn.label}</span>
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
