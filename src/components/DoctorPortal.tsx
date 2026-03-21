import { useEffect, useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, limit, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, Clock, User, MessageCircle, Check, X, FileText, TestTube2, 
  ChevronRight, Activity, Bell, Pill, Users, TrendingUp, DollarSign, 
  Briefcase, ShieldCheck, XCircle, Zap, AlertCircle 
} from 'lucide-react';
import { Chat } from './Chat';
import { MedicalBackground } from './MedicalBackground';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  patient_id: string;
  patient: {
    full_name: string;
    phone: string;
  };
}

export function DoctorPortal() {
  const { user, hospitalId } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    completed: 0
  });

  const loadDoctorInfo = useCallback(async () => {
    if (!user) return;
    try {
      const byUserId = await getDocs(query(
        collection(db, 'doctors'),
        where('user_id', '==', user.uid),
        limit(1)
      ));
      if (!byUserId.empty) {
        setDoctorInfo({ ...byUserId.docs[0].data(), id: byUserId.docs[0].id });
      }
    } catch (error) {
      console.error('Error loading doctor info:', error);
      setError('Failed to load doctor profile.');
    }
  }, [user]);

  const loadAppointments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Resolve the doctor document
      let doctorId: string | null = null;
      let doctorNameFromDb: string | null = null;
      
      const byUserId = await getDocs(query(
        collection(db, 'doctors'),
        where('user_id', '==', user.uid),
        limit(1)
      ));
      
      if (!byUserId.empty) {
        const docData = byUserId.docs[0].data();
        doctorId = byUserId.docs[0].id;
        doctorNameFromDb = docData.name;
        setDoctorInfo({ ...docData, id: doctorId });
      } else if (user.email) {
        const byEmail = await getDocs(query(
          collection(db, 'doctors'),
          where('email', '==', user.email),
          limit(1)
        ));
        if (!byEmail.empty) {
          const docData = byEmail.docs[0].data();
          doctorId = byEmail.docs[0].id;
          doctorNameFromDb = docData.name;
          setDoctorInfo({ ...docData, id: doctorId });
        }
      }

      if (!doctorId && !doctorNameFromDb) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      const appointmentsData: Appointment[] = [];
      const allDocs: any[] = [];

      if (doctorId) {
        console.log('Fetching appointments by doctorId:', doctorId);
        // Temporarily remove orderBy to check if it's an index issue
        const qById = query(
          collection(db, 'appointments'),
          where('doctor_id', '==', doctorId)
        );
        const snapById = await getDocs(qById);
        console.log('Found by ID:', snapById.size);
        allDocs.push(...snapById.docs);
      }

      if (doctorNameFromDb) {
        console.log('Fetching appointments by doctorName:', doctorNameFromDb);
        const qByName = query(
          collection(db, 'appointments'),
          where('doctor_name', '==', doctorNameFromDb)
        );
        const snapByName = await getDocs(qByName);
        console.log('Found by Name:', snapByName.size);
        snapByName.docs.forEach(d => {
          if (!allDocs.find(ad => ad.id === d.id)) {
            allDocs.push(d);
          }
        });
      }

      // Sort combined results
      allDocs.sort((a, b) => {
        const dateA = (a.data().appointment_date || '') + 'T' + (a.data().appointment_time || '');
        const dateB = (b.data().appointment_date || '') + 'T' + (b.data().appointment_time || '');
        return dateA.localeCompare(dateB);
      });

      for (const appointmentDoc of allDocs) {
        const aptData = appointmentDoc.data();
        let patientData = { full_name: 'Unknown Patient', phone: '' };
        if (aptData.patient_id) {
          const patientDoc = await getDoc(doc(db, 'patients', aptData.patient_id));
          if (patientDoc.exists()) {
            patientData = patientDoc.data() as any;
          }
        }

        appointmentsData.push({
          id: appointmentDoc.id,
          appointment_date: aptData.appointment_date || '',
          appointment_time: aptData.appointment_time || '',
          status: aptData.status || 'pending',
          notes: aptData.notes || null,
          patient_id: aptData.patient_id || '',
          patient: {
            full_name: patientData.full_name || 'Unknown Patient',
            phone: patientData.phone || ''
          }
        });
      }

      setAppointments(appointmentsData);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayCount = allDocs.filter(d => d.data().appointment_date === todayStr).length;
      const upcomingCount = allDocs.filter(d => d.data().appointment_date > todayStr && d.data().status !== 'cancelled').length;
      const completedCount = allDocs.filter(d => d.data().status === 'completed').length;

      setStats({
        today: todayCount,
        upcoming: upcomingCount,
        completed: completedCount
      });
    } catch (error: any) {
      console.error('Error loading appointments:', error);
      setError(`Failed to load clinical schedule: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [user, hospitalId]);

  useEffect(() => {
    loadDoctorInfo();
    loadAppointments();
  }, [loadDoctorInfo, loadAppointments]);

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, { status: newStatus });
      setAppointments(appointments.map(apt =>
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      ));
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const formatTime = (timeString: string) => timeString.slice(0, 5);

  const handleConsult = (aptId: string) => {
    (window as any).setView('doctor-prescriptions');
  };

  const handleHistory = (patientId: string) => {
    (window as any).setView('doctor-patients');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
        <p className="text-slate-500 font-medium">Synchronizing Workstation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-12 text-center max-w-2xl mx-auto mt-10">
        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="text-red-600 w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Access Error</h3>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Retry Connection</button>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointment_date + 'T' + apt.appointment_time);
    const today = new Date();
    today.setHours(0,0,0,0);
    return aptDate >= today && apt.status !== 'cancelled';
  }).slice(0, 5); // Show only top 5 in dashboard

  const totalRevenue = stats.completed * 1200;

  console.log('DoctorPortal is rendering its main content');

  return (
    <div className="space-y-8 relative min-h-screen pb-12">
      <MedicalBackground />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Welcome back, <span className="text-blue-600">Dr. {doctorInfo?.name?.split(' ').pop() || 'Practitioner'}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg">Your clinical workstation is optimized and ready for today's sessions.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => (window as any).setView('doctor-notifications')}
            className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-blue-600 transition-all shadow-sm relative group"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
          </button>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 pr-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200 dark:shadow-none">
              {doctorInfo?.name?.charAt(0) || 'D'}
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Clinic Active</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">Apollo Vizag</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {[
          { label: "Today's Queue", value: stats.today, icon: Users, color: 'blue', trend: '+12%' },
          { label: "Upcoming", value: stats.upcoming, icon: Clock, color: 'amber', trend: 'Live' },
          { label: "Completed", value: stats.completed, icon: Check, color: 'emerald', trend: '98%' },
          { label: "Patient Satisfaction", value: "94%", icon: Activity, color: 'indigo', trend: 'High' }
        ].map((item, idx) => (
          <div key={idx} className="card p-6 group hover:border-blue-200 transition-all duration-500 overflow-hidden relative">
            <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-${item.color}-600`}>
              <item.icon size={100} />
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`p-3 bg-${item.color}-50 dark:bg-${item.color}-900/20 rounded-2xl text-${item.color}-600 group-hover:bg-${item.color}-600 group-hover:text-white transition-all duration-500`}>
                <item.icon size={24} />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 bg-${item.color}-50 dark:bg-${item.color}-900/20 text-${item.color}-600 rounded-lg uppercase tracking-widest`}>
                {item.trend}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.15em] mb-1 relative z-10">{item.label}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white relative z-10 tracking-tight">{item.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="card p-8 bg-white/50 backdrop-blur-md">
             <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-xl tracking-tight">
                    <Clock size={24} className="text-blue-600" />
                    Clinical Queue
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Real-time patient timeline for today.</p>
                </div>
                <button 
                  onClick={() => (window as any).setView('doctor-appointments')}
                  className="text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center gap-2 hover:underline group"
                >
                  View Full Schedule <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
             
             <div className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-slate-100 dark:before:bg-slate-800">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((apt, i) => (
                    <div key={apt.id} className="relative pl-12 group">
                       <div className={`absolute left-4 top-1 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow-sm transition-all duration-300 group-hover:scale-125 ${i === 0 ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-200'}`}></div>
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 group-hover:border-blue-200 transition-all shadow-sm hover:shadow-md">
                          <div className="flex items-center gap-4">
                             <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                <User size={28} />
                             </div>
                             <div>
                                <h4 className="font-black text-slate-900 dark:text-white tracking-tight text-lg">{apt.patient.full_name}</h4>
                                <div className="flex items-center gap-4 mt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                   <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg text-blue-600"><Clock size={12} /> {formatTime(apt.appointment_time)}</span>
                                   <span>•</span>
                                   <span className="flex items-center gap-1.5"><MessageCircle size={12} className="text-emerald-500" /> General Consultation</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <button 
                               onClick={() => handleHistory(apt.patient_id)}
                               className="btn-secondary px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl transform hover:-translate-y-0.5 transition-all"
                             >
                               History
                             </button>
                             <button 
                               onClick={() => handleConsult(apt.id)}
                               className="btn-primary px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 dark:shadow-none transform hover:-translate-y-0.5 transition-all"
                             >
                               Consult
                             </button>
                          </div>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200">
                     <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                     <p className="text-slate-400 font-bold">No patients in queue for today</p>
                  </div>
                )}
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="card p-6 bg-white border-none shadow-xl shadow-slate-100 dark:shadow-none border-b-4 border-b-blue-500 group cursor-pointer hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Calendar size={20} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-black text-slate-400">TODAY</span>
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">{stats.today}</h4>
              <p className="text-xs font-bold text-slate-500 uppercase mt-1">Pending Visits</p>
            </div>
            <div className="card p-6 bg-white border-none shadow-xl shadow-slate-100 dark:shadow-none border-b-4 border-b-emerald-500 group cursor-pointer hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Check size={20} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-black text-slate-400">REVENUE</span>
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">₹ {(totalRevenue/1000).toFixed(1)}k</h4>
              <p className="text-xs font-bold text-slate-500 uppercase mt-1">Daily Earnings</p>
            </div>
            <div className="card p-6 bg-white border-none shadow-xl shadow-slate-100 dark:shadow-none border-b-4 border-b-purple-500 group cursor-pointer hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                  <DollarSign size={20} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-black text-slate-400">EST.</span>
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">₹ 12.5k</h4>
              <p className="text-xs font-bold text-slate-500 uppercase mt-1">Monthly Projected</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="card p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
                <FileText size={100} />
             </div>
             <h3 className="text-xl font-black mb-6 flex items-center gap-3 relative z-10">
                <Zap size={24} className="text-blue-400" />
                Quick Notes
             </h3>
             <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-white relative z-10 mb-6 min-h-[120px] custom-scrollbar"
                placeholder="Jot down clinical observations..."
             ></textarea>
             <button className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs relative z-10 shadow-xl hover:bg-blue-50 transition-colors">
                Sync with EHR
             </button>
          </div>

          <div className="card p-8 group overflow-hidden relative border-t-8 border-t-emerald-500">
             <div className="absolute -right-4 -top-4 p-4 text-emerald-500 opacity-5 group-hover:scale-110 transition-transform">
                <DollarSign size={100} strokeWidth={3} />
             </div>
             <h3 className="font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <TrendingUp size={24} className="text-emerald-500" />
                Weekly Performance
             </h3>
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Patient Retention</span>
                   <span className="text-lg font-black text-slate-900 dark:text-white">86%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[86%] rounded-full shadow-lg shadow-emerald-500/50"></div>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                   <span>Benchmark: 80%</span>
                   <span className="text-emerald-500">Exceeding Goal</span>
                </div>
             </div>
          </div>

          <div className="card p-8">
            <h3 className="font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <Briefcase size={24} className="text-blue-600" />
              Quick Modules
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Prescriptions', icon: Pill, id: 'doctor-prescriptions' },
                { label: 'Lab Reports', icon: TestTube2, id: 'doctor-medical-reports' },
                { label: 'Patients', icon: Users, id: 'doctor-patients' },
                { label: 'Team Chat', icon: MessageCircle, id: 'chat' }
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => (window as any).setView(action.id)}
                  className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-blue-200 hover:bg-white transition-all group shadow-sm hover:shadow-md"
                >
                  <action.icon className="text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-500 mb-3" size={28} />
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedAppointment && (
        <Chat
          appointmentId={selectedAppointment}
          doctorName={doctorInfo?.name || 'Doctor'}
          isOpen={chatOpen}
          onClose={() => {
            setChatOpen(false);
            setSelectedAppointment(null);
          }}
        />
      )}
    </div>
  );
}
