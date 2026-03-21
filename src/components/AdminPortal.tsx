import { useEffect, useState, useCallback } from 'react';
import { db, storage } from '../lib/firebase';
import { 
  collection, query, getDocs, doc, getDoc, updateDoc, 
  deleteDoc, addDoc, where, orderBy, limit, Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, UserPlus, Calendar, Home, TrendingUp, 
  DollarSign, FileText, Bell, Settings, Search, 
  Plus, Edit2, Trash2, Check, X, Filter, 
  ChevronRight, Download, Upload, Image as ImageIcon,
  AlertCircle, Briefcase, Activity, ShieldCheck, PieChart,
  CreditCard, ExternalLink, MoreVertical, Building
} from 'lucide-react';
import { MedicalBackground } from './MedicalBackground';

type AdminTab = 'dashboard' | 'doctors' | 'patients' | 'appointments' | 'hospitals' | 'reports' | 'files' | 'payments' | 'notifications';

export function AdminPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data States
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    revenue: 0,
    activeHospitals: 0
  });
  
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // UI States
  const [isAddingDoctor, setIsAddingAddingDoctor] = useState(false);
  const [isAddingHospital, setIsAddingHospital] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const drs = await getDocs(collection(db, 'doctors'));
      const pts = await getDocs(collection(db, 'patients'));
      const apts = await getDocs(collection(db, 'appointments'));
      const hosps = await getDocs(collection(db, 'hospitals'));
      
      setStats({
        totalDoctors: drs.size,
        totalPatients: pts.size,
        totalAppointments: apts.size,
        revenue: apts.docs.filter(d => d.data().status === 'completed').length * 1200,
        activeHospitals: hosps.size
      });

      setDoctors(drs.docs.map(d => ({ id: d.id, ...d.data() })));
      setPatients(pts.docs.map(d => ({ id: d.id, ...d.data() })));
      setAppointments(apts.docs.map(d => ({ id: d.id, ...d.data() })));
      setHospitals(hosps.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Admin Load Error:', err);
      setError('Failed to synchronize command center data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFiles = async () => {
    try {
      const storageRef = ref(storage, 'reports');
      const res = await listAll(storageRef);
      const fileList = await Promise.all(res.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return { name: item.name, url, fullPath: item.fullPath };
      }));
      setFiles(fileList);
    } catch (err) {
      console.error('File load error:', err);
    }
  };

  const loadPayments = async () => {
    try {
      const q = query(collection(db, 'appointments'), where('status', '==', 'completed'), limit(20));
      const snap = await getDocs(q);
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Payment load error:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
    if (activeTab === 'files') loadFiles();
    if (activeTab === 'payments') loadPayments();
  }, [loadDashboardData, activeTab]);

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm('Decommission this medical practitioner?')) return;
    try {
      await deleteDoc(doc(db, 'doctors', id));
      setDoctors(doctors.filter(d => d.id !== id));
      setSuccess('Doctor credentials revoked.');
    } catch (err) {
      setError('Failed to revoke access.');
    }
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const fileRef = ref(storage, `reports/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      loadFiles();
      setSuccess('Clinical document archived.');
    } catch (err) {
      setError('Upload failure.');
    } finally {
      setUploading(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Doctors', value: stats.totalDoctors, icon: Briefcase, color: 'blue' },
          { label: 'Registered Patients', value: stats.totalPatients, icon: Users, color: 'emerald' },
          { label: 'Total Consultations', value: stats.totalAppointments, icon: Calendar, color: 'amber' },
          { label: 'System Revenue', value: `₹${(stats.revenue/1000).toFixed(1)}k`, icon: DollarSign, color: 'purple' }
        ].map((stat, idx) => (
          <div key={idx} className="card p-6 group hover:border-blue-200 transition-all duration-500 relative overflow-hidden">
            <div className={`absolute -right-4 -bottom-4 opacity-5 text-${stat.color}-600`}>
              <stat.icon size={100} />
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-2xl text-${stat.color}-600`}>
                <stat.icon size={24} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LIVE</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-8 bg-white/50 backdrop-blur-md">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Activity size={24} className="text-blue-600" />
              Recent System Activity
            </h3>
            <button className="text-blue-600 font-bold text-xs hover:underline uppercase tracking-widest">System Audit Log</button>
          </div>
          <div className="space-y-4">
            {appointments.slice(0, 5).map((apt, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-50 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">New Appointment: #{apt.id.slice(-6)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{apt.appointment_date} at {apt.appointment_time}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                  apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {apt.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="card p-8 bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none shadow-2xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <ShieldCheck size={120} />
            </div>
            <h3 className="text-xl font-black mb-6 flex items-center gap-3 relative z-10">
              <Settings size={24} className="text-indigo-200" />
              Core Infrastructure
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center text-sm font-bold">
                <span>Hospital Nodes</span>
                <span className="bg-white/20 px-3 py-1 rounded-lg">{stats.activeHospitals} Active</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span>System Uptime</span>
                <span className="text-emerald-300">99.98%</span>
              </div>
              <button 
                onClick={() => setActiveTab('hospitals')}
                className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-indigo-50 transition-all mt-4"
              >
                Manage Infrastructure
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDoctors = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Medical <span className="text-blue-600">Practitioners</span></h1>
          <p className="text-slate-500 font-medium">Add, edit and manage credentials for clinical staff.</p>
        </div>
        <button 
          onClick={() => setIsAddingAddingDoctor(true)}
          className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg shadow-blue-100 dark:shadow-none"
        >
          <UserPlus size={18} /> Register Doctor
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, specialty, or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12 py-4 shadow-sm w-full bg-white/80 backdrop-blur-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.filter(d => d.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((dr) => (
          <div key={dr.id} className="card p-0 overflow-hidden group hover:border-blue-200 transition-all">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                  <Briefcase size={28} />
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteDoctor(dr.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{dr.name}</h3>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">{dr.specialty}</p>
            </div>
            <div className="p-6 bg-slate-50/30 dark:bg-slate-800/30 space-y-3">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                <Building size={14} /> {dr.hospital_name || 'Apollo Vizag'}
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                <Mail size={14} /> {dr.email}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPatients = () => (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Patient <span className="text-blue-600">Registry</span></h1>
        <p className="text-slate-500 font-medium">Global database of all registered patients and their clinical status.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((p) => (
          <div key={p.id} className="card p-6 bg-white/80 backdrop-blur-md hover:border-blue-200 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white">{p.full_name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.email}</p>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status: Active</span>
              <button className="text-blue-600 font-bold text-xs uppercase tracking-widest">View History</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Clinical <span className="text-blue-600">Events</span></h1>
        <p className="text-slate-500 font-medium">Monitor and manage all scheduled consultations across nodes.</p>
      </div>
      <div className="card p-0 overflow-hidden bg-white/80 backdrop-blur-md">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Doctor</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date/Time</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {appointments.map((apt, i) => (
              <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">{apt.patient_name || 'Patient'}</td>
                <td className="px-8 py-5 font-bold text-slate-700 dark:text-slate-200">Dr. {apt.doctor_name || 'Practitioner'}</td>
                <td className="px-8 py-5">
                  <p className="text-xs font-black text-slate-900 dark:text-white">{apt.appointment_date}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{apt.appointment_time}</p>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                    apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {apt.status}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                    <button className="p-2 text-slate-400 hover:text-red-600"><XCircle size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderHospitals = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Clinical <span className="text-blue-600">Infrastructure</span></h1>
          <p className="text-slate-500 font-medium">Manage hospital nodes, departments, and bed capacity.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg">
          <Plus size={18} /> Add Hospital
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hospitals.map((h) => (
          <div key={h.id} className="card p-8 bg-white/80 backdrop-blur-md group hover:border-blue-200 transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                <Building size={32} />
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={18} /></button>
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{h.name}</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{h.location}</p>
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-50">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Doctors</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">12</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Beds</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">45</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <p className="text-sm font-black text-emerald-500">Online</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">System <span className="text-blue-600">Broadcasts</span></h1>
          <p className="text-slate-500 font-medium">Issue global alerts and manage system-wide notifications.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg">
          <Bell size={18} /> New Broadcast
        </button>
      </div>
      <div className="card p-8 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Recent Broadcasts</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active System-wide Announcements</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-black text-slate-900">System Maintenance: March 24</h4>
              <span className="text-[10px] font-black text-slate-400 uppercase">2 days ago</span>
            </div>
            <p className="text-sm text-slate-600 font-medium">Scheduled maintenance for clinical nodes between 02:00 - 04:00 IST.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFiles = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Clinical <span className="text-blue-600">Vault</span></h1>
          <p className="text-slate-500 font-medium">Secure storage for medical records and diagnostic documents.</p>
        </div>
        <div className="flex gap-4">
          <label className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg cursor-pointer">
            <Upload size={18} /> {uploading ? 'Uploading...' : 'Upload Document'}
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {files.map((file, i) => (
          <div key={i} className="card p-6 bg-white/80 backdrop-blur-md group hover:border-blue-200 transition-all">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 shadow-inner">
              <FileText size={24} />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1 truncate" title={file.name}>{file.name}</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Medical Record</p>
            <div className="flex gap-2">
              <a href={file.url} target="_blank" rel="noreferrer" className="flex-1 btn-secondary py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <Download size={14} /> Download
              </a>
              <button onClick={async () => {
                if (confirm('Delete this document permanently?')) {
                  await deleteObject(ref(storage, file.fullPath));
                  loadFiles();
                }
              }} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 relative">
      <MedicalBackground />
      
      {/* Admin Sidebar */}
      <div className="lg:w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-100 dark:border-slate-800 p-8 flex flex-col relative z-20">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Admin <span className="text-blue-600">Vault</span></h2>
        </div>

        <nav className="space-y-2 flex-1">
          {[
            { id: 'dashboard', label: 'Command Center', icon: PieChart },
            { id: 'doctors', label: 'Practitioners', icon: Briefcase },
            { id: 'patients', label: 'Patient Registry', icon: Users },
            { id: 'appointments', label: 'Clinical Events', icon: Calendar },
            { id: 'hospitals', label: 'Infrastructure', icon: Home },
            { id: 'files', label: 'Clinical Vault', icon: FileText },
            { id: 'payments', label: 'Revenue Ops', icon: CreditCard },
            { id: 'notifications', label: 'Broadcasts', icon: Bell }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none translate-x-2' 
                : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold">A</div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white">Admin Unit</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Root Access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 relative z-10 overflow-y-auto max-h-screen custom-scrollbar">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'doctors' && renderDoctors()}
        {activeTab === 'patients' && renderPatients()}
        {activeTab === 'appointments' && renderAppointments()}
        {activeTab === 'hospitals' && renderHospitals()}
        {activeTab === 'files' && renderFiles()}
        {activeTab === 'payments' && renderPayments()}
        {activeTab === 'notifications' && renderNotifications()}
        
        {/* Fallback for other tabs */}
        {!['dashboard', 'doctors', 'patients', 'appointments', 'hospitals', 'files', 'payments', 'notifications'].includes(activeTab) && (
          <div className="card p-20 text-center bg-white/50 backdrop-blur-md">
            <div className="bg-blue-50 dark:bg-blue-900/20 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-blue-600">
              <Activity size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Module Offline</h2>
            <p className="text-slate-500 font-medium">The {activeTab} module is undergoing scheduled maintenance or protocol updates.</p>
          </div>
        )}
      </main>

      {/* Status Toasts */}
      {(success || error) && (
        <div className="fixed bottom-8 right-8 z-50 animate-slideUp">
          <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 ${success ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
            {success ? <Check size={20} /> : <AlertCircle size={20} />}
            <p className="text-xs font-black uppercase tracking-widest">{success || error}</p>
            <button onClick={() => { setSuccess(null); setError(null); }} className="ml-4 p-1 hover:bg-white/20 rounded-lg"><X size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
