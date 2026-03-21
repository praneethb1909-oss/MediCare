import { useEffect, useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, Clock, User, Phone, CheckCircle2, XCircle, 
  Search, ChevronRight, Filter, MoreVertical, FileText, 
  MessageCircle, AlertCircle, MapPin
} from 'lucide-react';
import { MedicalBackground } from './MedicalBackground';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  patient_id: string;
  hospital_id: string;
  patient: {
    full_name: string;
    phone: string;
    email: string;
  };
  hospital?: {
    name: string;
  };
}

export function MyAppointments() {
  const { user, role } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Resolve doctorId if role is doctor
      let doctorId: string | null = null;
      if (role === 'doctor') {
        const byUserId = await getDocs(query(
          collection(db, 'doctors'),
          where('user_id', '==', user.uid)
        ));
        if (!byUserId.empty) {
          doctorId = byUserId.docs[0].id;
        }
      }

      // 2. Fetch appointments
      const q = role === 'doctor' && doctorId
        ? query(collection(db, 'appointments'), where('doctor_id', '==', doctorId))
        : query(collection(db, 'appointments'), where('patient_id', '==', user.uid));

      const snapshot = await getDocs(q);
      console.log('MyAppointments found:', snapshot.size);
      const apts: Appointment[] = [];

      for (const d of snapshot.docs) {
        const data = d.data();
        
        // Fetch Patient details
        let patientData = { full_name: 'Unknown Patient', phone: 'N/A', email: 'N/A' };
        if (data.patient_id) {
          const pDoc = await getDoc(doc(db, 'patients', data.patient_id));
          if (pDoc.exists()) patientData = pDoc.data() as any;
        }

        // Fetch Hospital details
        let hospitalData = { name: 'MediCare Center' };
        if (data.hospital_id) {
          const hDoc = await getDoc(doc(db, 'hospitals', data.hospital_id));
          if (hDoc.exists()) hospitalData = hDoc.data() as any;
        }

        apts.push({
          id: d.id,
          appointment_date: data.appointment_date,
          appointment_time: data.appointment_time,
          status: data.status,
          notes: data.notes,
          patient_id: data.patient_id,
          hospital_id: data.hospital_id,
          patient: patientData,
          hospital: hospitalData
        });
      }

      setAppointments(apts);
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      setError(`Could not retrieve appointment history: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status: newStatus });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         apt.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
        <p className="text-slate-500 font-medium">Loading Clinical Records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn relative pb-12">
      <MedicalBackground />
      
      <div className="relative z-10">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Clinical <span className="text-blue-600">Schedule</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Manage and review all patient appointments and consultations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 relative z-10">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by patient name or appointment ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12 py-4 shadow-sm w-full bg-white/80 backdrop-blur-sm"
          />
        </div>
        <div className="flex gap-4">
          <div className="relative min-w-[160px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pl-12 py-4 shadow-sm w-full appearance-none bg-white/80 backdrop-blur-sm"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="card p-20 text-center relative z-10 bg-white/50 backdrop-blur-md">
          <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Calendar size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Appointments Found</h3>
          <p className="text-slate-500 dark:text-slate-400">Your search criteria didn't match any clinical records.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 relative z-10">
          {filteredAppointments.map((apt) => (
            <div key={apt.id} className="card p-0 overflow-hidden group hover:border-blue-200 transition-all duration-300 bg-white/80 backdrop-blur-md">
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-64 p-6 bg-slate-50/50 dark:bg-slate-800/50 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-700 flex flex-col justify-center items-center text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200 dark:shadow-none">
                    <Calendar size={32} />
                  </div>
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
                    {new Date(apt.appointment_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-sm font-bold text-blue-600 mt-1 uppercase tracking-widest">{apt.appointment_time}</p>
                  <div className={`mt-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                    apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                    apt.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                    apt.status === 'completed' ? 'bg-blue-50 text-blue-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {apt.status}
                  </div>
                </div>

                <div className="flex-1 p-6 lg:p-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                          <User size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{apt.patient.full_name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <Phone size={12} /> {apt.patient.phone}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <MapPin size={12} /> {apt.hospital?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chief Complaint / Notes</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium italic">
                          "{apt.notes || 'No specific notes provided for this consultation.'}"
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                      {apt.status === 'confirmed' && (
                        <>
                          <button 
                            onClick={() => updateStatus(apt.id, 'completed')}
                            className="btn-primary px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 dark:shadow-none"
                          >
                            Mark Complete
                          </button>
                          <button 
                            onClick={() => updateStatus(apt.id, 'cancelled')}
                            className="btn-outline px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl border-red-100 text-red-600 hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {apt.status === 'completed' && (
                        <button 
                          onClick={() => (window as any).setView('doctor-prescriptions')}
                          className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"
                        >
                          <FileText size={16} /> View Prescription
                        </button>
                      )}
                      <button 
                        className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-600 transition-colors"
                        title="Chat with Patient"
                      >
                        <MessageCircle size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
