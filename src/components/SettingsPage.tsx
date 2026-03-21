import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { 
  User, Bell, Shield, Globe, Moon, Sun, 
  Save, Camera, Mail, Phone, MapPin, 
  CheckCircle2, AlertCircle, Smartphone, Eye, 
  EyeOff, Key, Lock, Briefcase
} from 'lucide-react';
import { MedicalBackground } from './MedicalBackground';

export function SettingsPage() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');

  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    experience: '',
    address: '',
    bio: '',
    hospital_name: ''
  });

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    email_appointments: true,
    push_reminders: true,
    sms_alerts: false,
    marketing_updates: false,
    critical_alerts: true
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        setLoading(true);
        let userData: any = null;
        let docRef: any = null;

        if (role === 'doctor') {
          const q = query(collection(db, 'doctors'), where('user_id', '==', user.uid), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            userData = snap.docs[0].data();
            docRef = snap.docs[0].ref;
          }
        } else if (role === 'admin') {
          const docSnap = await getDoc(doc(db, 'admins', user.uid));
          if (docSnap.exists()) {
            userData = docSnap.data();
            docRef = docSnap.ref;
          }
        } else {
          const docSnap = await getDoc(doc(db, 'patients', user.uid));
          if (docSnap.exists()) {
            userData = docSnap.data();
            docRef = docSnap.ref;
          }
        }

        if (userData) {
          setProfile({
            name: userData.name || userData.full_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            specialty: userData.specialty || '',
            experience: userData.experience || '',
            address: userData.address || '',
            bio: userData.bio || '',
            hospital_name: userData.hospital_name || ''
          });
          if (userData.notification_preferences) {
            setNotifications(userData.notification_preferences);
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to retrieve profile configuration.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, role]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      let docRef: any = null;
      if (role === 'doctor') {
        const q = query(collection(db, 'doctors'), where('user_id', '==', user.uid), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) docRef = snap.docs[0].ref;
      } else if (role === 'admin') {
        docRef = doc(db, 'admins', user.uid);
      } else {
        docRef = doc(db, 'patients', user.uid);
      }

      if (docRef) {
        await updateDoc(docRef, {
          ...profile,
          updated_at: new Date().toISOString()
        });
        setSuccess('Profile synchronized successfully.');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to persist profile modifications.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNotifications = async (key: string, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);

    if (!user) return;
    try {
      let docRef: any = null;
      if (role === 'doctor') {
        const q = query(collection(db, 'doctors'), where('user_id', '==', user.uid), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) docRef = snap.docs[0].ref;
      } else if (role === 'admin') {
        docRef = doc(db, 'admins', user.uid);
      } else {
        docRef = doc(db, 'patients', user.uid);
      }

      if (docRef) {
        await updateDoc(docRef, {
          notification_preferences: updated,
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error updating notification preferences:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
        <p className="text-slate-500 font-medium">Synchronizing System Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn relative pb-12">
      <MedicalBackground />
      
      <div className="relative z-10">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          System <span className="text-blue-600">Configurations</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your personal profile, notification preferences, and security protocols.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 relative z-10">
        {/* Navigation Sidebar */}
        <div className="lg:w-72 space-y-2">
          {[
            { id: 'profile', label: 'Clinical Profile', icon: User },
            { id: 'notifications', label: 'Alert Protocols', icon: Bell },
            { id: 'security', label: 'Vault Security', icon: Shield }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
                activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none translate-x-2' 
                : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="card p-8 bg-white/90 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row items-center gap-8 mb-10 pb-10 border-b border-slate-100 dark:border-slate-800">
                <div className="relative group">
                  <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-300 overflow-hidden border-4 border-white dark:border-slate-900 shadow-xl">
                    <User size={64} />
                  </div>
                  <button className="absolute -bottom-2 -right-2 p-3 bg-blue-600 text-white rounded-2xl shadow-lg hover:scale-110 transition-transform">
                    <Camera size={18} />
                  </button>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{profile.name || 'MediCare Professional'}</h3>
                  <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">{role} Access Level</p>
                  <p className="text-xs font-medium text-slate-400 mt-2 flex items-center justify-center sm:justify-start gap-2">
                    <Globe size={14} /> Regional Node: South India
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        value={profile.name}
                        onChange={e => setProfile({...profile, name: e.target.value})}
                        className="input-field pl-12 py-4"
                        placeholder="Clinical Name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contact Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="email" 
                        value={profile.email}
                        className="input-field pl-12 py-4 bg-slate-50/50 cursor-not-allowed"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Direct Line</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="tel" 
                        value={profile.phone}
                        onChange={e => setProfile({...profile, phone: e.target.value})}
                        className="input-field pl-12 py-4"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                  </div>
                  {role === 'doctor' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Specialization</label>
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                          type="text" 
                          value={profile.specialty}
                          onChange={e => setProfile({...profile, specialty: e.target.value})}
                          className="input-field pl-12 py-4"
                          placeholder="e.g. Cardiology"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Professional Bio</label>
                  <textarea 
                    value={profile.bio}
                    onChange={e => setProfile({...profile, bio: e.target.value})}
                    className="input-field py-4 min-h-[120px] resize-none"
                    placeholder="Brief professional summary..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    {success && (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs animate-fadeIn">
                        <CheckCircle2 size={16} /> {success}
                      </div>
                    )}
                    {error && (
                      <div className="flex items-center gap-2 text-red-600 font-bold text-xs animate-fadeIn">
                        <AlertCircle size={16} /> {error}
                      </div>
                    )}
                  </div>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="btn-primary px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 dark:shadow-none flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Save size={18} />
                    )}
                    Synchronize Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card p-8 bg-white/90 backdrop-blur-md">
              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Alert Protocols</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Configure how the system communicates critical clinical updates.</p>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'email_appointments', label: 'Clinical Appointment Summaries', desc: 'Receive detailed daily schedule via email.', icon: Mail },
                  { id: 'push_reminders', label: 'Real-time Push Reminders', desc: 'Instant notifications for immediate clinical actions.', icon: Smartphone },
                  { id: 'sms_alerts', label: 'Emergency SMS Alerts', desc: 'Direct mobile messaging for high-priority events.', icon: Phone },
                  { id: 'critical_alerts', label: 'System Health & Security', desc: 'Mandatory alerts for vault and account integrity.', icon: Shield }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-100 transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 group-hover:text-blue-600 transition-colors shadow-sm">
                        <item.icon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{item.label}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleUpdateNotifications(item.id, !notifications[item.id as keyof typeof notifications])}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none ${
                        notifications[item.id as keyof typeof notifications] ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all shadow-md ${
                        notifications[item.id as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-8 bg-white/90 backdrop-blur-md">
              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Vault Security</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Update authentication credentials and manage session integrity.</p>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-widest text-[10px]">Update Passcode</h4>
                      <p className="text-xs text-slate-500 font-medium">Ensure your passcode is complex and rotating regularly.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input type="password" placeholder="Current Secret Key" className="input-field pl-12 py-4 text-sm" />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input type="password" placeholder="New Master Key" className="input-field pl-12 py-4 text-sm" />
                    </div>
                    <button className="btn-primary w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 dark:shadow-none">
                      Rotate Access Credentials
                    </button>
                  </div>
                </div>

                <div className="p-6 border border-red-100 dark:border-red-900/20 bg-red-50/20 dark:bg-red-900/5 rounded-3xl">
                  <h4 className="text-sm font-black text-red-600 tracking-tight uppercase tracking-widest text-[10px] mb-2">Critical Actions</h4>
                  <p className="text-xs text-slate-500 font-medium mb-4">Requesting vault decommissioning will purge all local data access.</p>
                  <button className="text-red-600 text-[10px] font-black uppercase tracking-widest hover:underline">
                    Deactivate System Access
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
