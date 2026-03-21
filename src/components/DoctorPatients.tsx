import { useEffect, useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Phone, Mail, Calendar, Search, ArrowRight, 
  UserCircle, FileText, Plus, Filter, Activity, 
  ShieldCheck, Clock, CheckCircle2
} from 'lucide-react';
import { MedicalBackground } from './MedicalBackground';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  last_visit?: string;
  total_appointments: number;
  gender?: string;
  age?: number;
  blood_group?: string;
}

export function DoctorPatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadPatients = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Resolve doctorId
      let doctorId: string | null = null;
      const byUserId = await getDocs(query(
        collection(db, 'doctors'),
        where('user_id', '==', user.uid),
        limit(1)
      ));
      if (!byUserId.empty) {
        doctorId = byUserId.docs[0].id;
      }

      if (!doctorId) {
        setPatients([]);
        setLoading(false);
        return;
      }

      // 2. Get all unique patient IDs from appointments where this doctor was involved
      const q = query(
        collection(db, 'appointments'),
        where('doctor_id', '==', doctorId)
      );
      const querySnapshot = await getDocs(q);
      console.log('DoctorPatients found:', querySnapshot.size);
      
      const patientMap = new Map<string, { count: number, lastVisit: string }>();
      
      querySnapshot.docs.forEach(d => {
        const data = d.data();
        const pId = data.patient_id;
        const date = data.appointment_date;
        
        if (!pId) return;

        const existing = patientMap.get(pId) || { count: 0, lastVisit: '' };
        patientMap.set(pId, {
          count: existing.count + 1,
          lastVisit: !existing.lastVisit || date > existing.lastVisit ? date : existing.lastVisit
        });
      });

      // 3. Fetch patient details for each unique patient
      const patientDetails: Patient[] = [];
      for (const [pId, stats] of patientMap.entries()) {
        if (!pId || pId === 'dev-user-id') continue;
        
        const pDoc = await getDoc(doc(db, 'patients', pId));
        if (pDoc.exists()) {
          const data = pDoc.data();
          patientDetails.push({
            id: pId,
            full_name: data.full_name || 'Unknown Patient',
            email: data.email || 'N/A',
            phone: data.phone || 'N/A',
            last_visit: stats.lastVisit,
            total_appointments: stats.count,
            gender: data.gender,
            age: data.age,
            blood_group: data.blood_group
          });
        }
      }

      setPatients(patientDetails);
    } catch (err: any) {
      console.error('Error loading patients:', err);
      setError(`Failed to synchronize patient registry: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const filteredPatients = patients.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
        <p className="text-slate-500 font-medium">Loading Patient Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn relative pb-12">
      <MedicalBackground />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Patient <span className="text-blue-600">Directory</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Comprehensive list of all patients under your clinical care.</p>
        </div>
        <button 
          onClick={() => (window as any).setView('doctor-prescriptions')}
          className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg shadow-blue-100 dark:shadow-none"
        >
          <Plus size={18} /> New Prescription
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 relative z-10">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email, or phone number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12 py-4 shadow-sm w-full bg-white/80 backdrop-blur-sm"
          />
        </div>
        <div className="flex gap-4">
          <button className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-blue-600 transition-all shadow-sm">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="card p-20 text-center relative z-10 bg-white/50 backdrop-blur-md">
          <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-inner">
            <UserCircle size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Registry Empty</h3>
          <p className="text-slate-500 dark:text-slate-400">No patients currently match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="card p-0 overflow-hidden group hover:border-blue-200 transition-all duration-300 bg-white/80 backdrop-blur-md">
              <div className="p-6 border-b border-slate-50 dark:border-slate-800">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                    <User size={28} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical ID</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">#{patient.id.slice(-6).toUpperCase()}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 transition-colors">{patient.full_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{patient.gender || 'N/A'}</span>
                  <span className="text-slate-200">•</span>
                  <span className="text-xs font-bold text-slate-400">{patient.age ? `${patient.age} Yrs` : 'Age N/A'}</span>
                  {patient.blood_group && (
                    <>
                      <span className="text-slate-200">•</span>
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black rounded-lg">{patient.blood_group}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="p-6 space-y-4 bg-slate-50/30 dark:bg-slate-800/30">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Mail size={16} className="text-slate-400" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Phone size={16} className="text-slate-400" />
                    <span>{patient.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Calendar size={16} className="text-slate-400" />
                    <span>Last Visit: {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'New Patient'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engagements</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{patient.total_appointments} Consultations</span>
                  </div>
                  <button 
                    onClick={() => (window as any).setView('doctor-notes')}
                    className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
                    title="View Case Notes"
                  >
                    <FileText size={18} />
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => (window as any).setView('doctor-notes')}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all active:scale-[0.98]"
              >
                Access Medical Record
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
