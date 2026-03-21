import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity, ArrowRight, Eye, EyeOff, Fingerprint, Globe, Heart, Key, Lock, Mail, ShieldAlert, ShieldCheck, Smartphone, Stethoscope, User } from 'lucide-react';
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
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-[#1E88E5] mx-auto mb-6 shadow-xl shadow-blue-100 dark:shadow-none">
                <Smartphone size={40} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Security Verification</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">We've sent a 6-digit verification code to <br/><span className="font-bold text-slate-900 dark:text-slate-200">{email}</span></p>
              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-2 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 py-1 px-3 rounded-full inline-block">Use code: {generatedOtp}</p>
            </div>

            <div className="flex justify-between gap-2 px-2">
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
                  className="w-12 h-16 text-center text-2xl font-black bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-[#1E88E5] focus:ring-8 focus:ring-blue-500/10 outline-none transition-all dark:text-white"
                  required
                />
              ))}
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading || otp.some(d => !d)}
                className="w-full btn-primary py-5 rounded-2xl text-lg flex items-center justify-center gap-3 shadow-2xl shadow-blue-200 dark:shadow-none group"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="uppercase tracking-widest text-sm font-black">Verify & Authorize</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center space-y-4">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Didn't receive code?</p>
                <button 
                  type="button" 
                  onClick={() => generateRandomOtp()}
                  className="text-sm font-black text-[#1E88E5] hover:underline"
                >
                  Resend OTP
                </button>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setAuthStep('initial')}
              className="w-full text-center text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#1E88E5] transition-colors"
            >
              ← Back to login details
            </button>
          </form>
        );

      case 'forgot-password':
        return (
          <form onSubmit={handleForgotPassword} className="space-y-8 animate-fadeIn">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-[#1E88E5] mx-auto mb-6 shadow-xl shadow-blue-100 dark:shadow-none">
                <Key size={40} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Recovery Console</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-center">Enter your registered clinical email to <br/>receive a secure reset link.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Clinical Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1E88E5] transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="name@medicare.in"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black flex items-center gap-3 border border-red-100 animate-shake uppercase tracking-tighter">
                <ShieldAlert size={18} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full btn-primary py-5 rounded-2xl shadow-xl shadow-blue-100 dark:shadow-none flex items-center justify-center gap-3">
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="uppercase tracking-widest text-sm font-black">Send Recovery Link</span>
              )}
            </button>
            
            <button 
              type="button"
              onClick={() => setAuthStep('initial')}
              className="w-full text-center text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#1E88E5] transition-colors"
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
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Account Type</label>
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
                            ? 'bg-blue-50 border-[#1E88E5] text-[#1E88E5] shadow-xl shadow-blue-100 dark:shadow-none dark:bg-blue-900/20' 
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
                  <label htmlFor="fullName" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Full Legal Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#1E88E5] transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field pl-12"
                      placeholder="Johnathan Doe"
                      required
                    />
                  </div>
                </div>

                {role !== 'patient' && (
                  <div className="space-y-2 animate-fadeIn">
                    <label htmlFor="hospital" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Affiliated Facility</label>
                    <div className="relative">
                       <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <select
                        id="hospital"
                        value={hospitalId}
                        onChange={(e) => setHospitalId(e.target.value)}
                        className="input-field pl-12 appearance-none bg-white dark:bg-slate-800"
                        required
                      >
                        <option value="">Select Healthcare Facility</option>
                        {hospitals.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.city})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#1E88E5] transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="clinical.staff@medicare.in"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Security Key</label>
                {isLogin && (
                  <button 
                    type="button" 
                    onClick={() => setAuthStep('forgot-password')}
                    className="text-[10px] font-black text-[#1E88E5] hover:underline uppercase tracking-[0.1em]"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#1E88E5] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12 pr-12"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-blue-50 transition-colors group opacity-0 pointer-events-none absolute h-0 w-0 overflow-hidden">
                 <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-400 group-hover:text-[#1E88E5]">
                    <Fingerprint size={20} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">Biometric Login</span>
                    <span className="text-[10px] text-slate-400 font-bold">Use Touch ID or Face ID</span>
                 </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black flex items-center gap-3 border border-red-100 animate-shake uppercase tracking-tighter">
                <ShieldAlert size={18} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-5 rounded-[1.25rem] text-lg flex items-center justify-center gap-3 mt-6 shadow-2xl shadow-blue-200 dark:shadow-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="uppercase tracking-widest text-sm font-black">Authorizing...</span>
                </div>
              ) : (
                <>
                  <span className="uppercase tracking-widest text-sm font-black">{isLogin ? 'Sign In to Station' : 'Create My Health ID'}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 md:p-6 relative overflow-hidden font-sans">
      {/* Dynamic SaaS Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-teal-400/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
      
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-blue-100/50 dark:shadow-none w-full max-w-5xl flex flex-col lg:flex-row overflow-hidden border border-white/20 dark:border-slate-800 relative z-10 min-h-[700px]">
        
        {/* Left Side - Enterprise Branding & Social Proof */}
        <div className="bg-[#1E88E5] w-full lg:w-[42%] p-10 lg:p-14 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 scale-150">
            <Activity size={300} strokeWidth={1} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl">
                <Activity className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-black text-3xl tracking-tighter">MediCare</span>
            </div>
            
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">
                <ShieldCheck size={14} /> Enterprise SaaS Platform
              </span>
              <h2 className="text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight">
                Healthcare <br/>
                <span className="text-blue-200">Reimagined.</span>
              </h2>
              <p className="text-blue-50/80 text-lg font-medium leading-relaxed max-w-xs">
                The most trusted hospital appointment & record management system for the Rajam, Vizag, and Srikakulam regions.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-12 space-y-8">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl">
               <div className="flex items-center gap-4 mb-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-4 border-[#1E88E5] bg-blue-300 flex items-center justify-center text-xs font-black shadow-lg">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-black leading-none">12k+</span>
                    <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Active Patients</span>
                  </div>
               </div>
               <p className="text-sm text-blue-50 font-medium italic">"The fastest way to connect with specialists in Andhra Pradesh."</p>
            </div>

            <div className="flex items-center gap-6 opacity-60">
               <div className="flex flex-col">
                  <span className="text-xl font-black">99.9%</span>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Uptime</span>
               </div>
               <div className="w-px h-8 bg-white/20"></div>
               <div className="flex flex-col">
                  <span className="text-xl font-black">256-bit</span>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Encryption</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Workstation */}
        <div className="flex-1 p-8 lg:p-16 bg-white dark:bg-slate-900 overflow-y-auto">
          <div className="max-w-md mx-auto">
            <div className="mb-10">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                {isLogin ? 'Sign In' : 'Get Started'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                {isLogin ? 'Enter your clinical credentials.' : 'Create your secure health ID today.'}
              </p>
            </div>

            {renderAuthStep()}

            <div className="mt-12 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setAuthStep('initial');
                  setError('');
                  setRole('patient');
                  setHospitalId('');
                }}
                className="text-sm font-bold text-slate-400 hover:text-[#1E88E5] transition-colors group"
              >
                {isLogin ? (
                  <>Don't have an enterprise account? <span className="text-[#1E88E5] group-hover:underline">Join Now</span></>
                ) : (
                  <>Already registered? <span className="text-[#1E88E5] group-hover:underline">Secure Sign In</span></>
                )}
              </button>
            </div>

            {/* Quick Access Section for Development */}
            {isLogin && (
              <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 text-center">Development Quick Access</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleQuickLogin('admin@medicare.in', 'Admin@123')}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-all group"
                  >
                    <ShieldCheck size={20} className="text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600 dark:text-slate-400">Hospital Admin</span>
                  </button>
                  <button
                    onClick={() => handleQuickLogin('suresh.a@medicare.in', 'Suresh@123')}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-all group"
                  >
                    <Stethoscope size={20} className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600 dark:text-slate-400">Dr. A Suresh</span>
                  </button>
                  <button
                    onClick={() => handleQuickLogin('patient@medicare.in', 'Patient@123')}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-all group"
                  >
                    <User size={20} className="text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600 dark:text-slate-400">Demo Patient</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
