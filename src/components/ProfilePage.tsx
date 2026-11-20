import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, MapPin, Building2, Save, UserCircle, Edit3, Camera } from 'lucide-react';
import { MedicareWaveLoader } from './common/MedicareWaveLoader';

export function ProfilePage() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    specialization: '', // for doctors
  });

  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      if (role === 'admin') {
        const cachedAvatar = localStorage.getItem(`olmera_avatar_${user.uid}`);
        setProfileData({ full_name: user.email?.split('@')[0], email: user.email, photo_url: cachedAvatar || user.photoURL });
        setFormData(prev => ({ ...prev, full_name: user.email?.split('@')[0] || '', email: user.email || '' }));
        return;
      }

      const collectionName = role === 'doctor' ? 'doctors' : 'patients';
      const docRef = doc(db, collectionName, user.uid);
      const docSnap = await getDoc(docRef);

      const cachedAvatar = localStorage.getItem(`olmera_avatar_${user.uid}`);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData({ ...data, photo_url: data.photo_url || cachedAvatar || user.photoURL });
        setFormData({
          full_name: data.full_name || data.name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          address: data.address || '',
          specialization: data.specialization || '',
        });
      } else if (cachedAvatar) {
        setProfileData({ photo_url: cachedAvatar });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);


  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, or WebP).');
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const rawDataUrl = reader.result as string;

        // Resize photo to 256x256 to guarantee fast loading and avoid localStorage/Firestore quota limits
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          }
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          // Immediately update state and localStorage
          setProfileData((prev: any) => ({ ...prev, photo_url: compressedDataUrl }));
          try {
            localStorage.setItem(`olmera_avatar_${user.uid}`, compressedDataUrl);
          } catch (e) {
            console.warn('Local avatar storage warning:', e);
          }

          // Persist to Firestore
          try {
            const collectionName = role === 'doctor' ? 'doctors' : 'patients';
            await updateDoc(doc(db, collectionName, user.uid), {
              photo_url: compressedDataUrl,
              updated_at: new Date().toISOString()
            });
          } catch (dbErr) {
            console.warn('Firestore avatar update warning:', dbErr);
          }

          setUploadingPhoto(false);
        };
        img.onerror = () => {
          setProfileData((prev: any) => ({ ...prev, photo_url: rawDataUrl }));
          setUploadingPhoto(false);
        };
        img.src = rawDataUrl;
      };

      reader.onerror = () => {
        alert('Failed to read image file.');
        setUploadingPhoto(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading photo:', err);
      setUploadingPhoto(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    try {
      const collectionName = role === 'doctor' ? 'doctors' : 'patients';
      const updatePayload: any = {
        phone: formData.phone,
        address: formData.address,
        email: formData.email,
        specialization: formData.specialization,
      };

      if (role === 'doctor') {
        updatePayload.name = formData.full_name;
        updatePayload.specialization = formData.specialization;
      } else {
        updatePayload.full_name = formData.full_name;
      }

      const docRef = doc(db, collectionName, user.uid);
      await updateDoc(docRef, updatePayload);
      
      setIsEditing(false);
      await loadProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MedicareWaveLoader 
        variant="card" 
        text="Loading Clinical Profile..." 
        subtitle="Retrieving verified identity, contact credentials, and health history"
        className="my-12 min-h-[320px]"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-[2rem] flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xl shadow-blue-200 dark:shadow-none overflow-hidden relative border-2 border-white dark:border-slate-800">
              {uploadingPhoto ? (
                <div className="flex flex-col items-center justify-center p-2">
                  <MedicareWaveLoader variant="inline" text="" />
                </div>
              ) : (profileData?.photo_url || user?.photoURL) ? (
                <img 
                  src={profileData?.photo_url || user?.photoURL} 
                  alt={formData.full_name || 'Profile'} 
                  className="w-full h-full object-cover rounded-[2rem]" 
                />
              ) : (
                <UserCircle size={64} />
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-blue-50 transition-all">
              <Camera size={16} className="text-[#1E88E5]" />
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
            </label>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{formData.full_name || 'My Profile'}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              {role} Account
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="btn-outline flex items-center gap-2 self-start md:self-center"
        >
          {isEditing ? 'Cancel Editing' : <><Edit3 size={18} /> Edit Profile</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="card p-8">
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      disabled={!isEditing}
                      className="input-field pl-12 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className="input-field pl-12 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      className="input-field pl-12 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                      placeholder="+91 XXXX XXX XXX"
                    />
                  </div>
                </div>

                {role === 'doctor' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Specialization</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        disabled={!isEditing}
                        className="input-field pl-12 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                    className="input-field pl-12 pt-4 disabled:bg-slate-50 dark:disabled:bg-slate-800 resize-none"
                    placeholder="Street, City, PIN"
                  ></textarea>
                </div>
              </div>

              {isEditing && (
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <MedicareWaveLoader variant="button" text="Saving..." />
                  ) : (
                    <><Save size={20} /> Save Changes</>
                  )}
                </button>
              )}
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 bg-blue-600 text-white border-none shadow-xl shadow-blue-200 dark:shadow-none">
            <h3 className="font-bold text-xl mb-4">Account Security</h3>
            <p className="text-blue-100 text-sm mb-6 leading-relaxed">
              Maintain your account security by updating your password regularly.
            </p>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors">
              Change Password
            </button>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">System Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">User ID</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">{user?.uid.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Joined On</span>
                <span className="text-slate-600 dark:text-slate-400">Mar 01, 2026</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Last Login</span>
                <span className="text-slate-600 dark:text-slate-400">Just Now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
