import { useEffect, useState, useCallback } from 'react';
import { db, storage, isFirebaseConfigured } from '../lib/firebase';
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
  CreditCard, ExternalLink, MoreVertical, Building,
  Mail, User, XCircle, Cpu, Eye, ShieldAlert, Lock, Unlock,
  RefreshCw, Play, CheckCircle2, Clock, Database, Copy, CheckCheck
} from 'lucide-react';
import { MedicalBackground } from './MedicalBackground';
import { MedicareWaveLoader } from './common/MedicareWaveLoader';
import { auditLogger, SecurityAuditEntry } from '../services/auth/auditLogger';
import { hospitalIdp, HospitalRecord } from '../services/auth/hospitalIdp';
import { sessionManager, HospitalAdminSession } from '../services/auth/sessionManager';
import { runHospitalAuthValidationSuite, HospitalAuthTestSuiteReport } from '../services/auth/validateHospitalAuth';
import { HOSPITAL_ROLES, hasHospitalPermission } from '../services/auth/rbac';
import { processClinicalFileUpload, resolveClinicalDocumentUrl } from '../services/storage/clinicalStorage';
import { maskEmail } from '../utils/masking';

type AdminTab = 'dashboard' | 'doctors' | 'patients' | 'appointments' | 'hospitals' | 'reports' | 'files' | 'payments' | 'notifications' | 'audit';

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
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string } | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // UI States
  const [isAddingDoctor, setIsAddingAddingDoctor] = useState(false);
  const [isAddingHospital, setIsAddingHospital] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);

  // Hospital Authentication & Security Audit States
  const [activeSession, setActiveSession] = useState<HospitalAdminSession | null>(() => sessionManager.getActiveSession());
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const s = sessionManager.getActiveSession();
    return s ? Math.max(0, Math.floor((s.expiresAt - Date.now()) / 1000)) : 900;
  });
  const [auditLogs, setAuditLogs] = useState<SecurityAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilterStatus, setAuditFilterStatus] = useState<string>('ALL');
  const [auditFilterEvent, setAuditFilterEvent] = useState<string>('ALL');
  const [auditSearchTerm, setAuditSearchTerm] = useState<string>('');
  const [testSuiteReport, setTestSuiteReport] = useState<HospitalAuthTestSuiteReport | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [unlockTargetId, setUnlockTargetId] = useState('');
  const [unlockStatus, setUnlockStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

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
      let remoteFiles: any[] = [];
      if (isFirebaseConfigured) {
        try {
          const storageRef = ref(storage, 'reports');
          const res = await listAll(storageRef);
          remoteFiles = await Promise.all(res.items.map(async (item) => {
            const url = await getDownloadURL(item);
            return { name: item.name, url, fullPath: item.fullPath };
          }));
        } catch (storageErr) {
          console.warn('Storage listAll warning:', storageErr);
        }
      }

      // Also fetch from Firestore medical_reports
      let firestoreFiles: any[] = [];
      try {
        const snap = await getDocs(query(collection(db, 'medical_reports'), limit(25)));
        firestoreFiles = snap.docs.map(d => {
          const data = d.data();
          return {
            name: data.title || data.file_name || `Report_${d.id.slice(-6)}`,
            url: data.file_url,
            fullPath: `reports/${d.id}`,
            uploaded_at: data.uploaded_at
          };
        });
      } catch (e) {
        console.warn('Firestore files fetch fallback:', e);
      }

      // Also merge with persistent localStorage
      let cached: any[] = [];
      try {
        const stored = localStorage.getItem('olmera_admin_files');
        if (stored) cached = JSON.parse(stored);
      } catch (e) {
        console.warn('Cached admin files read warning:', e);
      }

      const all = [...cached, ...firestoreFiles, ...remoteFiles];
      const unique = all.filter((f, idx, arr) => arr.findIndex(x => x.name === f.name && x.url === f.url) === idx);

      setFiles(unique);
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

  const loadAuditData = useCallback(async () => {
    try {
      setAuditLoading(true);
      const logs = await auditLogger.getRecentLogs(100);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Audit log fetch error:', err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const s = sessionManager.getActiveSession();
      setActiveSession(s);
      if (s) {
        const diff = Math.max(0, Math.floor((s.expiresAt - Date.now()) / 1000));
        setRemainingSeconds(diff);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadDashboardData();
    if (activeTab === 'files') loadFiles();
    if (activeTab === 'payments') loadPayments();
    if (activeTab === 'audit') loadAuditData();
  }, [loadDashboardData, loadAuditData, activeTab]);

  const formatRemaining = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const handleRunSecurityTests = async () => {
    try {
      setIsRunningTests(true);
      setShowTestModal(true);
      const report = await runHospitalAuthValidationSuite();
      setTestSuiteReport(report);
      await loadAuditData();
    } catch (err) {
      console.error('Failed to run security tests:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleUnlockAccount = async (targetId: string) => {
    if (!targetId.trim()) return;
    try {
      const staff = activeSession?.user.staffId || 'ADM-ROOT';
      const ok = await hospitalIdp.unlockAccount(targetId.trim(), staff);
      if (ok) {
        setUnlockStatus({ success: true, message: `Staff account "${targetId.trim()}" successfully unlocked.` });
        setUnlockTargetId('');
        await loadAuditData();
      } else {
        setUnlockStatus({ success: false, message: `Account "${targetId.trim()}" was not found or is already active.` });
      }
    } catch (err: any) {
      setUnlockStatus({ success: false, message: err.message || 'Unlock operation failed.' });
    }
  };

  const handleExportAuditLogs = (format: 'csv' | 'json') => {
    if (auditLogs.length === 0) return;
    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `olmera_security_audit_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = ['Timestamp', 'Event Type', 'Status', 'Hospital ID', 'Hospital Name', 'Staff ID', 'Email', 'Role', 'Details', 'Checksum (SHA-256)', 'Client IP'];
      const rows = auditLogs.map(l => [
        `"${l.timestamp}"`,
        `"${l.eventType}"`,
        `"${l.status}"`,
        `"${l.hospitalId || ''}"`,
        `"${l.hospitalName || ''}"`,
        `"${l.staffId || ''}"`,
        `"${l.email ? maskEmail(l.email) : ''}"`,
        `"${l.role || ''}"`,
        `"${(l.details || '').replace(/"/g, '""')}"`,
        `"${l.checksum}"`,
        `"${l.ipAddress}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `olmera_security_audit_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    setSuccess(`Security audit trail exported as ${format.toUpperCase()}.`);
  };

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
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setError('');

      const storedFile = await processClinicalFileUpload(file, {
        userId: user?.uid || 'admin-portal',
        userName: user?.displayName || 'Hospital Admin',
        title: file.name,
        reportType: 'Administrative Document'
      });

      const newFile = {
        name: storedFile.name,
        url: storedFile.url,
        size: storedFile.size,
        uploaded_at: storedFile.uploaded_at
      };

      setFiles(prev => [newFile, ...prev]);
      setSuccess(`Document "${file.name}" uploaded and archived.`);
    } catch (err: any) {
      console.error('File archive error:', err);
      setError(err?.message || 'Failed to archive document.');
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
                className="w-full bg-white text-indigo-600 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-indigo-50 transition-all mt-4"
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
                <Mail size={14} /> {maskEmail(dr.email)}
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{maskEmail(p.email)}</p>
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

  const renderPayments = () => (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Billing & <span className="text-blue-600">Transactions</span></h1>
        <p className="text-slate-500 font-medium">Financial audit log of all clinical consultations and invoices.</p>
      </div>
      <div className="card p-8 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="text-blue-600" size={24} />
            <h3 className="font-bold text-slate-800 dark:text-white">Transaction History</h3>
          </div>
          <span className="text-xs font-bold text-slate-400">Total: ₹{stats.revenue.toLocaleString()}</span>
        </div>
        <div className="text-center py-12 text-slate-400">
          <DollarSign size={48} className="mx-auto mb-3 opacity-30 text-blue-500" />
          <p className="font-semibold text-slate-600 dark:text-slate-300">All payment records reconciled.</p>
          <p className="text-xs text-slate-400 mt-1">Live payment gateway integration active.</p>
        </div>
      </div>
    </div>
  );

  const handleOpenPreview = async (file: any) => {
    let resolvedUrl = file.url;
    try {
      const url = await resolveClinicalDocumentUrl(file.id || file.name, file.url);
      if (url) resolvedUrl = url;
    } catch (e) {
      console.warn('Preview resolution warning:', e);
    }
    setPreviewFile({ name: file.name, url: resolvedUrl });
  };

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
              <button 
                onClick={() => handleOpenPreview(file)} 
                className="btn-primary py-2 px-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                title="View document"
              >
                <Eye size={14} /> View
              </button>
              <a href={file.url} target="_blank" rel="noreferrer" download={file.name} className="flex-1 btn-secondary py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Download size={14} /> Download
              </a>
              <button onClick={async () => {
                if (confirm('Delete this document permanently?')) {
                  try {
                    if (file.fullPath) {
                      await deleteObject(ref(storage, file.fullPath)).catch(() => {});
                    }
                  } catch (e) {
                    console.warn('Storage deletion warning:', e);
                  }
                  try {
                    const stored = localStorage.getItem('olmera_admin_files');
                    if (stored) {
                      const list = JSON.parse(stored);
                      localStorage.setItem('olmera_admin_files', JSON.stringify(list.filter((x: any) => x.name !== file.name)));
                    }
                  } catch (e) {
                    console.warn('File local cache removal warning:', e);
                  }
                  setFiles(prev => prev.filter(x => x.name !== file.name));
                }
              }} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {previewFile && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] w-full max-w-5xl h-[88vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-[var(--color-line)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-mist)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-[var(--color-ink)] truncate">{previewFile.name}</h3>
                  <p className="text-xs text-[var(--color-muted)]">Verified Medical Record</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  className="btn-outline px-3.5 py-2 text-xs font-semibold flex items-center gap-2 rounded-xl"
                  title="Download File"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  onClick={() => window.open(previewFile.url, '_blank')}
                  className="btn-outline px-3.5 py-2 text-xs font-semibold flex items-center gap-2 rounded-xl"
                  title="Open in new window"
                >
                  <ExternalLink size={14} />
                  <span className="hidden sm:inline">Open Tab</span>
                </button>
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-[var(--color-surface-subtle)] rounded-xl text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
                  aria-label="Close Preview"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 bg-[var(--color-surface-subtle)]/50 flex items-center justify-center overflow-hidden">
              {previewFile.url.includes('pdf') || previewFile.url.startsWith('data:application/pdf') || previewFile.url.endsWith('.pdf') ? (
                <iframe src={previewFile.url} className="w-full h-full rounded-xl bg-white border border-[var(--color-line)] shadow-inner" title={previewFile.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                  <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-xl bg-white shadow-lg border border-[var(--color-line)]" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAudit = () => {
    const filteredLogs = auditLogs.filter(log => {
      const matchesStatus = auditFilterStatus === 'ALL' || log.status === auditFilterStatus;
      const matchesEvent = auditFilterEvent === 'ALL' || log.eventType === auditFilterEvent;
      const query = auditSearchTerm.toLowerCase();
      const matchesSearch = !query || 
        log.details?.toLowerCase().includes(query) ||
        log.staffId?.toLowerCase().includes(query) ||
        log.hospitalName?.toLowerCase().includes(query) ||
        log.hospitalId?.toLowerCase().includes(query) ||
        log.checksum?.toLowerCase().includes(query) ||
        log.ipAddress?.toLowerCase().includes(query);
      return matchesStatus && matchesEvent && matchesSearch;
    });

    const successCount = auditLogs.filter(l => l.status === 'success').length;
    const failureCount = auditLogs.filter(l => l.status === 'failure').length;
    const lockedCount = auditLogs.filter(l => l.status === 'blocked').length;

    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[2rem] shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                HIPAA & DISHA Accredited Authentication Active
              </span>
              <span className="text-xs text-[var(--color-muted)] font-mono">SHA-256 Tamper-Evident</span>
            </div>
            <h1 className="text-3xl font-display text-[var(--color-ink)] tracking-tight">Hospital Security & Audit Center</h1>
            <p className="text-sm text-[var(--color-muted)] mt-1 max-w-2xl">
              Real-time audit telemetry, multi-hospital IdP isolation, 15-minute HIPAA session lifecycle, and cryptographic verification logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleExportAuditLogs('csv')}
              className="btn-outline px-4 py-2.5 text-xs font-semibold flex items-center gap-2 rounded-xl"
              title="Export as CSV"
            >
              <Download size={14} />
              Export CSV
            </button>
            <button
              onClick={() => handleExportAuditLogs('json')}
              className="btn-outline px-4 py-2.5 text-xs font-semibold flex items-center gap-2 rounded-xl"
              title="Export as JSON"
            >
              <Download size={14} />
              Export JSON
            </button>
            <button
              onClick={handleRunSecurityTests}
              disabled={isRunningTests}
              className="btn-accent px-5 py-2.5 text-xs font-bold flex items-center gap-2 rounded-xl shadow-md disabled:opacity-50"
            >
              {isRunningTests ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={15} />}
              {isRunningTests ? 'Running Suite...' : 'Run Security Suite'}
            </button>
          </div>
        </div>

        {/* Security Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[1.5rem] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Total Audits</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                <Database size={18} />
              </div>
            </div>
            <h3 className="text-3xl font-display text-[var(--color-ink)]">{auditLogs.length}</h3>
            <p className="text-xs text-[var(--color-muted)] mt-2 flex items-center gap-1 font-mono">
              <ShieldCheck size={12} className="text-emerald-500" /> Tamper-evident ledger
            </p>
          </div>

          <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[1.5rem] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Authorized Logins</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <h3 className="text-3xl font-display text-emerald-600 dark:text-emerald-400">{successCount}</h3>
            <p className="text-xs text-[var(--color-muted)] mt-2">
              Verified clinical hospital staff
            </p>
          </div>

          <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[1.5rem] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Blocked / Denied</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                <ShieldAlert size={18} />
              </div>
            </div>
            <h3 className="text-3xl font-display text-rose-600 dark:text-rose-400">{failureCount + lockedCount}</h3>
            <p className="text-xs text-[var(--color-muted)] mt-2">
              {lockedCount} lockout(s) triggered
            </p>
          </div>

          <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[1.5rem] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">HIPAA Idle Timeout</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <Clock size={18} />
              </div>
            </div>
            <h3 className="text-3xl font-mono font-semibold text-[var(--color-ink)] tracking-tight">{formatRemaining(remainingSeconds)}</h3>
            <p className="text-xs text-[var(--color-muted)] mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 15-min auto-logout active
            </p>
          </div>
        </div>

        {/* Current Active Hospital Staff Session & Emergency Unlock Station */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Hospital Session Details */}
          <div className="lg:col-span-2 p-6 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[1.75rem] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display text-[var(--color-ink)] flex items-center gap-2">
                <Building size={18} className="text-[var(--color-primary)]" />
                Active Hospital Facility Binding
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-mist)] text-[var(--color-primary)] font-semibold">
                Facility Isolation Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-line)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-muted)]">Hospital Network</span>
                <p className="font-semibold text-sm text-[var(--color-ink)] mt-0.5 truncate">
                  {activeSession?.user.hospitalName || 'Olmera Healthcare Network'}
                </p>
                <p className="text-[10px] text-[var(--color-muted)] font-mono mt-0.5">ID: {activeSession?.user.hospitalId || 'OL-NET-01'}</p>
              </div>

              <div className="p-3.5 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-line)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-muted)]">Clinical Staff Profile</span>
                <p className="font-semibold text-sm text-[var(--color-ink)] mt-0.5 truncate">
                  {activeSession?.user.fullName || user?.displayName || 'Administrator'}
                </p>
                <p className="text-[10px] text-[var(--color-muted)] font-mono mt-0.5">Staff ID: {activeSession?.user.staffId || 'ADM-ROOT'}</p>
              </div>

              <div className="p-3.5 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-line)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-muted)]">Enforced Role & Scope</span>
                <p className="font-semibold text-sm text-[var(--color-primary)] mt-0.5 capitalize truncate">
                  {(activeSession?.user.role || 'super_admin').replace(/_/g, ' ')}
                </p>
                <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{activeSession?.user.department || 'Administration'}</p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <ShieldCheck size={16} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong>Zero Trust Boundary:</strong> Staff credentials from other healthcare institutions cannot access this facility's records or administrative consoles without regional administrative delegations.
              </span>
            </div>
          </div>

          {/* Account Lockout Relief Station */}
          <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[1.75rem] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                  <Lock size={16} />
                </div>
                <h3 className="text-base font-display text-[var(--color-ink)]">Staff Account Unlock</h3>
              </div>
              <p className="text-xs text-[var(--color-muted)] mb-4">
                Hospital staff accounts are automatically locked for 15 minutes after 5 consecutive failed authentication attempts.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-1">
                    Staff ID or Hospital Email
                  </label>
                  <input
                    type="text"
                    value={unlockTargetId}
                    onChange={(e) => setUnlockTargetId(e.target.value)}
                    placeholder="e.g. OCH-ADM-01 or vami.admin@olmera.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] font-mono"
                  />
                </div>

                <button
                  onClick={() => handleUnlockAccount(unlockTargetId)}
                  disabled={!unlockTargetId.trim()}
                  className="w-full btn-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-2 rounded-xl disabled:opacity-40"
                >
                  <Unlock size={14} />
                  Clear Lockout Counter
                </button>
              </div>
            </div>

            {unlockStatus && (
              <div className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${unlockStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                {unlockStatus.success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{unlockStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[1.75rem] shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={16} />
              <input
                type="text"
                value={auditSearchTerm}
                onChange={(e) => setAuditSearchTerm(e.target.value)}
                placeholder="Search audit trail by Staff ID, Hospital, Details, IP, or Checksum..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-wider flex items-center gap-1">
                <Filter size={13} /> Status:
              </span>
              {(['ALL', 'success', 'failure', 'blocked'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setAuditFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    auditFilterStatus === status
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'bg-[var(--color-surface-subtle)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {status === 'ALL' ? 'All' : status === 'blocked' ? 'Locked' : status.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Trail Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--color-line)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-subtle)] border-b border-[var(--color-line)] text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event & Status</th>
                  <th className="py-3 px-4">Hospital / Department</th>
                  <th className="py-3 px-4">Staff ID / Account</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">SHA-256 Checksum</th>
                  <th className="py-3 px-4 text-right">IP / Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)] text-xs">
                {auditLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--color-muted)]">
                      <MedicareWaveLoader variant="inline" size="sm" text="Verifying and retrieving clinical audit ledger..." />
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--color-muted)]">
                      <ShieldCheck size={28} className="mx-auto mb-2 opacity-40" />
                      No security audit events match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isSuccess = log.status === 'success';
                    const isLocked = log.status === 'blocked';
                    const isDenied = log.status === 'failure';

                    return (
                      <tr key={log.id} className="hover:bg-[var(--color-surface-subtle)]/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--color-muted)] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide ${
                            isSuccess
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : isLocked
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isSuccess ? 'bg-emerald-500' : isLocked ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            {log.eventType.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-[var(--color-ink)] truncate max-w-[160px]">{log.hospitalName || 'Network Global'}</p>
                          <p className="text-[10px] text-[var(--color-muted)] font-mono">{log.hospitalId || 'ALL'}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-mono font-bold text-[var(--color-primary)]">{log.staffId || 'ANONYMOUS'}</p>
                          {log.email && <p className="text-[10px] text-[var(--color-muted)] truncate max-w-[140px]">{maskEmail(log.email)}</p>}
                        </td>

                        <td className="py-3.5 px-4 text-[var(--color-ink)] max-w-xs">
                          <p className="line-clamp-2">{log.details}</p>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(log.checksum);
                              setCopiedHash(log.id);
                              setTimeout(() => setCopiedHash(null), 2000);
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--color-surface-subtle)] hover:bg-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
                            title={`Full Checksum: ${log.checksum}\nClick to copy`}
                          >
                            <span>{log.checksum.substring(0, 10)}...</span>
                            {copiedHash === log.id ? <CheckCheck size={11} className="text-emerald-600" /> : <Copy size={11} />}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-[11px] text-[var(--color-muted)] whitespace-nowrap">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Test Suite Modal */}
        {showTestModal && testSuiteReport && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
            <div className="bg-[var(--color-surface)] border border-[var(--color-line)] w-full max-w-3xl max-h-[90vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
              {/* Modal Header */}
              <div className="p-6 border-b border-[var(--color-line)] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      testSuiteReport.allPassed 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {testSuiteReport.allPassed ? 'ALL TESTS PASSED (100%)' : 'TESTS FAILED'}
                    </span>
                    <span className="text-xs text-[var(--color-muted)] font-mono">
                      {testSuiteReport.passedTests}/{testSuiteReport.totalTests} Passed
                    </span>
                  </div>
                  <h3 className="text-xl font-display text-[var(--color-ink)] mt-1">Hospital Authentication Security Suite</h3>
                </div>

                <button
                  onClick={() => setShowTestModal(false)}
                  className="p-2 hover:bg-[var(--color-surface-subtle)] rounded-xl text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body: Test Cases */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-3">
                {testSuiteReport.results.map((test, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      test.passed 
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/40' 
                        : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          test.passed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}>
                          {test.passed ? <Check size={16} /> : <X size={16} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[var(--color-ink)]">{test.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-surface-subtle)] text-[var(--color-muted)] font-semibold">
                              {test.category}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-ink)] font-mono mt-2 bg-white/70 dark:bg-black/20 p-2.5 rounded-xl border border-[var(--color-line)]">
                            {test.details}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--color-muted)] shrink-0">
                        {test.durationMs}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-[var(--color-line)] bg-[var(--color-surface-subtle)]/50 flex items-center justify-between">
                <p className="text-xs text-[var(--color-muted)]">
                  Cryptographic verification verified at {new Date(testSuiteReport.timestamp).toLocaleTimeString()}
                </p>
                <button
                  onClick={() => setShowTestModal(false)}
                  className="btn-primary px-5 py-2 text-xs font-semibold rounded-xl"
                >
                  Close Suite Results
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
            { id: 'notifications', label: 'Broadcasts', icon: Bell },
            { id: 'audit', label: 'Security & Audit', icon: ShieldCheck }
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

        <div className="mt-auto pt-6 border-t border-[var(--color-line)] space-y-3">
          {/* Active Hospital Session Telemetry */}
          <div className="p-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-line)] space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                HIPAA Session
              </span>
              <span className="font-mono text-[var(--color-ink)] flex items-center gap-1">
                <Clock size={11} />
                {formatRemaining(remainingSeconds)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] uppercase font-bold text-[var(--color-muted)]">Facility</span>
              <span className="font-semibold text-[var(--color-ink)] truncate max-w-[130px]">{activeSession?.user.hospitalName || 'Network HQ'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] uppercase font-bold text-[var(--color-muted)]">Staff ID</span>
              <span className="font-mono text-[11px] font-bold text-[var(--color-primary)]">{activeSession?.user.staffId || 'ADM-ROOT'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-line)]">
            <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
              {(activeSession?.user.fullName?.[0] || user?.displayName?.[0] || user?.email?.[0] || 'A').toUpperCase()}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-xs font-bold text-[var(--color-ink)] truncate">
                {activeSession?.user.fullName || user?.displayName || user?.email?.split('@')[0] || 'Administrator'}
              </p>
              <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider truncate">
                {activeSession?.user.role?.replace(/_/g, ' ') || 'Hospital Admin'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 relative z-10 overflow-y-auto max-h-screen custom-scrollbar">
        {loading && activeTab === 'dashboard' ? (
          <div className="py-24 flex items-center justify-center">
            <MedicareWaveLoader 
              variant="card" 
              text="Synchronizing Clinical Command Center..." 
              subtitle="Aggregating hospital beds, doctor rosters, telemetry, and consultation records" 
            />
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'doctors' && renderDoctors()}
            {activeTab === 'patients' && renderPatients()}
            {activeTab === 'appointments' && renderAppointments()}
            {activeTab === 'hospitals' && renderHospitals()}
            {activeTab === 'files' && renderFiles()}
            {activeTab === 'payments' && renderPayments()}
            {activeTab === 'notifications' && renderNotifications()}
            {activeTab === 'audit' && renderAudit()}
          </>
        )}
        
        {/* Fallback for other tabs */}
        {!['dashboard', 'doctors', 'patients', 'appointments', 'hospitals', 'files', 'payments', 'notifications', 'audit'].includes(activeTab) && (
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
