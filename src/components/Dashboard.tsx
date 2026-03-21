import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, orderBy, addDoc, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, User, Trash2, Plus, MessageCircle, Activity, ChevronRight, FileText, Receipt, ClipboardList, Pill, TestTube2, Video, Play, TrendingUp, Shield, Heart, Zap, Bed, Smartphone, Phone, AlertCircle, CheckCircle2, MoreVertical, X, Download, Share2, Stethoscope, Bell } from 'lucide-react';
import { Chat } from './Chat';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  type?: string;
  doctor: {
    name: string;
    specialization: string | null;
  };
}

interface DashboardProps {
  onBookNew: () => void;
}

export function Dashboard({ onBookNew }: DashboardProps) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showSummaryPreview, setShowSummaryPreview] = useState(false);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [medicalReports, setMedicalReports] = useState<any[]>([]);
  const [patientVitals, setPatientVitals] = useState<any>(null);

  const HEALTH_QUOTES = [
    "ఆరోగ్యమే మహాభాగ్యం. (Health is the greatest wealth.)",
    "మంచి ఆహారం, సరైన వ్యాయామం - ఆరోగ్యానికి మూలం. (Good food, proper exercise - the root of health.)",
    "నిద్ర లేమి అన్ని రోగాలకు కారణం. (Lack of sleep is the cause of all diseases.)",
    "పరిశుభ్రతే దైవం, ఆరోగ్యమే ప్రాణం. (Cleanliness is Godliness, Health is Life.)",
    "The greatest wealth is health. - Virgil",
    "It is health that is real wealth and not pieces of gold and silver. - Mahatma Gandhi"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % HEALTH_QUOTES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [HEALTH_QUOTES.length]);

  

  const loadPatientVitals = useCallback(async () => {
    if (!user) return;
    try {
      const vitalsDoc = await getDoc(doc(db, 'patient_vitals', user.uid));
      if (vitalsDoc.exists()) {
        setPatientVitals(vitalsDoc.data());
      }
    } catch (error) {
      console.error('Error loading patient vitals:', error);
    }
  }, [user]);

  const loadMedicalReports = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'medical_reports'),
        where('patient_id', '==', user.uid),
        orderBy('uploaded_at', 'desc'),
        limit(2)
      );
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedicalReports(reports);
    } catch (error) {
      console.error('Error loading medical reports:', error);
    }
  }, [user]);

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [emergencyStep, setEmergencyStep] = useState<'initial' | 'ambulance' | 'booking'>('initial');
  const [reschedulingApt, setReschedulingApt] = useState<string | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const loadPatientProfile = useCallback(async () => {
    if (!user) {
      if (patientName === '') setPatientName('Dev User');
      return;
    }

    try {
      const patientDoc = await getDoc(doc(db, 'patients', user.uid));
      if (patientDoc.exists()) {
        setPatientName(patientDoc.data().full_name);
      }
    } catch (error) {
      console.error('Error loading patient profile:', error);
    }
  }, [user, patientName]);

  const loadAppointments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'appointments'),
        where('patient_id', '==', user.uid),
        orderBy('appointment_date', 'asc'),
        orderBy('appointment_time', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const appointmentsData: Appointment[] = [];

      for (const appointmentDoc of querySnapshot.docs) {
        const aptData = appointmentDoc.data();
        
        // Fetch doctor info separately if not denormalized
        const doctorDoc = await getDoc(doc(db, 'doctors', aptData.doctor_id));
        const doctorData = doctorDoc.exists() ? doctorDoc.data() : { name: 'Unknown', specialization: '' };

        appointmentsData.push({
            id: appointmentDoc.id,
            appointment_date: aptData.appointment_date,
            appointment_time: aptData.appointment_time,
            status: aptData.status,
            notes: aptData.notes,
            type: aptData.type,
            doctor: {
              name: doctorData.name,
              specialization: doctorData.specialization
            }
          });
      }

      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAppointments();
    loadPatientProfile();
    loadMedicalReports();
    loadPatientVitals();
  }, [loadAppointments, loadPatientProfile, loadMedicalReports, loadPatientVitals]);

  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, { status: 'cancelled' });

      setAppointments(appointments.map(apt => apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt));
    } catch (error) {
      console.error('Error canceling appointment:', error);
      alert('Failed to cancel appointment');
    }
  };

  const handleReschedule = async (appointmentId: string, newDate: string, newTime: string) => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, { 
        appointment_date: newDate, 
        appointment_time: newTime,
        status: 'rescheduled'
      });
      setShowRescheduleModal(false);
      loadAppointments();
    } catch (error) {
      console.error('Error rescheduling:', error);
    }
  };

  const requestEmergencyAmbulance = async (location: string) => {
    try {
      await addDoc(collection(db, 'emergency_requests'), {
        patient_id: user?.uid,
        type: 'ambulance',
        status: 'dispatched',
        location: location,
        timestamp: new Date().toISOString()
      });
      alert('Emergency Ambulance has been dispatched to ' + location + '!');
      setShowEmergencyModal(false);
      setEmergencyStep('initial');
    } catch (error) {
      console.error('Emergency request failed:', error);
    }
  };

  const bookEmergencyConsultation = async (symptoms: string) => {
    try {
      // Find an available emergency doctor (simulated)
      const q = query(collection(db, 'doctors'), where('specialization', '==', 'Emergency Medicine'));
      const snapshot = await getDocs(q);
      const doctor = snapshot.docs[0];

      await addDoc(collection(db, 'appointments'), {
        patient_id: user?.uid,
        doctor_id: doctor?.id || 'emergency_default',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5),
        status: 'emergency',
        notes: symptoms,
        type: 'emergency_quick_book'
      });
      
      alert('Emergency consultation booked! A doctor will contact you immediately.');
      setShowEmergencyModal(false);
      setEmergencyStep('initial');
      loadAppointments();
    } catch (error) {
      console.error('Emergency booking failed:', error);
    }
  };

  const runAIAnalysis = async (symptoms: string) => {
    if (!symptoms.trim()) return;
    setAnalyzing(true);
    setAiAnalysis(null);
    try {
      // Simulate Multi-Agent AI processing
      await new Promise(resolve => setTimeout(resolve, 2500));
      setAiAnalysis(`Based on your symptoms, our AI Triage Agents suggest:
      
1. **Primary Agent (Diagnosis):** Possible Seasonal Allergies or Mild Respiratory Infection.
2. **Specialist Agent (Recommendation):** Consult a General Physician. Rest and hydration are advised.
3. **Urgency Agent (Triage):** Non-emergency. Routine appointment recommended within 48 hours.`);
    } catch (error) {
      console.error('AI Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateAISummary = async () => {
    setAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAiSummary(`MediCare AI - Clinical Summary Preview
      
Patient: ${patientName || 'Valued Patient'}
Triage Level: Standard
Initial Analysis: Seasonal allergic rhinitis.
Recommended Action: Antihistamines and hydration.

Note: This summary is generated by MediCare Multi-Agent AI and is pending verified doctor approval.`);
      setShowSummaryPreview(true);
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointment_date + 'T' + apt.appointment_time);
    return aptDate >= new Date() && apt.status !== 'cancelled';
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-12 relative">
      {/* 3D Health Animation for Dark Mode */}
      <div className="hidden dark:block absolute top-0 right-0 -z-10 w-96 h-96 opacity-20 blur-[100px] pointer-events-none">
        <div className="w-full h-full bg-red-500 rounded-full animate-blob"></div>
      </div>
      <div className="hidden dark:block absolute top-40 right-20 z-0 pointer-events-none perspective-1000">
        <div className="animate-heart-3d flex flex-col items-center">
          <Heart size={120} className="text-red-500/40 fill-red-500/20 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" strokeWidth={0.5} />
          <div className="mt-4 px-4 py-2 bg-red-500/10 backdrop-blur-md rounded-full border border-red-500/20">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">Live Vitals Monitoring</span>
          </div>
        </div>
      </div>

      {/* SaaS Promotional Banner / Important Alerts */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1E88E5] to-[#1565C0] rounded-3xl p-8 text-white shadow-2xl shadow-blue-200 dark:shadow-none group">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              <Shield size={14} /> Comprehensive Coverage
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">Your Health, Simplified. <br/><span className="text-blue-200">Manage Appointments & Records.</span></h2>
            <p className="text-blue-50/80 text-lg mb-6 font-medium">Connect with top specialists in Rajam, Vizag, and Srikakulam from the comfort of your home.</p>
            <div className="flex flex-wrap gap-4">
              <button onClick={onBookNew} className="px-6 py-3 bg-white text-[#1E88E5] rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg active:scale-95">
                <Plus size={20} /> Book Now
              </button>
              <button 
                onClick={() => (window as any).setView('telemedicine')}
                className="px-6 py-3 bg-blue-400/20 backdrop-blur-md border border-white/30 text-white rounded-xl font-bold hover:bg-blue-400/30 transition-all flex items-center gap-2 active:scale-95"
              >
                <Video size={20} /> Telemedicine
              </button>
            </div>
          </div>
          <div className="hidden md:flex flex-col gap-4 w-64">
             <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="text-red-300" size={20} />
                  <span className="font-bold text-sm">Heart Rate</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black">72</span>
                  <span className="text-xs text-blue-200 pb-1">BPM</span>
                </div>
             </div>
             <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 ml-8">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="text-yellow-300" size={20} />
                  <span className="font-bold text-sm">Activity</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black">8.4k</span>
                  <span className="text-xs text-blue-200 pb-1">Steps</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Inspirational Quote Rolling Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 py-4 px-6 rounded-2xl shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl text-[#1E88E5] group-hover:scale-110 transition-transform">
          <Activity size={20} strokeWidth={2.5} />
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-sm font-semibold tracking-tight animate-fadeIn" key={quoteIndex}>
          {HEALTH_QUOTES[quoteIndex]}
        </p>
      </div>

        {/* SaaS Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button 
            onClick={() => setShowEmergencyModal(true)}
            className="p-6 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] transition-all shadow-xl shadow-red-200 dark:shadow-none flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <Zap size={60} />
            </div>
            <Activity size={32} className="animate-pulse" />
            <span className="font-black uppercase tracking-widest text-[10px]">Emergency</span>
          </button>
          
          <a 
            href="https://wa.me/917032130919" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] transition-all shadow-xl shadow-emerald-200 dark:shadow-none flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <MessageCircle size={60} />
            </div>
            <Smartphone size={32} />
            <span className="font-black uppercase tracking-widest text-[10px]">WhatsApp</span>
          </a>

          <button 
            onClick={() => setShowAIModal(true)}
            className="p-6 bg-slate-900 dark:bg-slate-800 text-white rounded-[2rem] transition-all shadow-xl flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <Zap size={60} />
            </div>
            <Activity size={32} className="text-blue-400" />
            <span className="font-black uppercase tracking-widest text-[10px]">AI Triage</span>
          </button>

          <button className="p-6 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] transition-all shadow-xl shadow-slate-100 dark:shadow-none flex flex-col items-center justify-center gap-3 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform text-slate-900">
              <Plus size={60} />
            </div>
            <Plus size={32} className="text-[#1E88E5]" />
            <span className="font-black uppercase tracking-widest text-[10px]">Records</span>
          </button>
        </div>

        {/* AI Triage Modal */}
        {showAIModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-scaleIn border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-[#1E88E5]">
                    <Zap size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">AI Multi-Agent Triage</h3>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Intelligent Clinical Analysis</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowAIModal(false);
                    setAiAnalysis(null);
                  }} 
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Describe your symptoms</label>
                  <textarea 
                    id="ai-symptoms-input"
                    placeholder="e.g. persistent headache, mild fever, or chest pain..."
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-[#1E88E5] outline-none transition-all dark:text-white min-h-[120px]"
                  />
                </div>

                {analyzing ? (
                  <div className="p-8 flex flex-col items-center justify-center gap-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-dashed border-blue-200">
                    <div className="w-10 h-10 border-4 border-[#1E88E5] border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-center">
                      <p className="text-sm font-black text-[#1E88E5] uppercase tracking-widest">Consulting Agents...</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">Diagnosis, Specialist, & Urgency Agents are analyzing</p>
                    </div>
                  </div>
                ) : aiAnalysis ? (
                  <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <Shield size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Confidential AI Report</span>
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-line font-medium text-slate-300">
                      {aiAnalysis}
                    </div>
                    <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                      <button 
                        onClick={() => {
                          setShowAIModal(false);
                          onBookNew();
                        }}
                        className="w-full py-3 bg-[#1E88E5] rounded-xl text-xs font-black uppercase tracking-widest"
                      >
                        Book Suggested Specialist
                      </button>
                      <button 
                        onClick={generateAISummary}
                        disabled={analyzing}
                        className="w-full py-3 bg-white/10 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                      >
                        {analyzing ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <FileText size={14} />
                            Generate AI Summary for Doctor
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      const input = (document.getElementById('ai-symptoms-input') as HTMLTextAreaElement).value;
                      runAIAnalysis(input);
                    }}
                    className="w-full p-5 bg-[#1E88E5] hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Zap size={20} />
                    Run AI Triage
                  </button>
                )}

                <p className="text-[9px] text-slate-400 text-center font-bold uppercase leading-relaxed px-4">
                  AI results are for guidance only. In case of severe emergency, use the SOS button immediately or call 108.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Modal */}
        {showEmergencyModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-scaleIn border border-red-100 dark:border-red-900/30">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600">
                    <AlertCircle size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">SOS Help Desk</h3>
                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Immediate Response Required</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowEmergencyModal(false);
                    setEmergencyStep('initial');
                  }} 
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              {emergencyStep === 'initial' && (
                <div className="space-y-4 mb-8">
                  <button 
                    onClick={() => setEmergencyStep('ambulance')}
                    className="w-full p-6 bg-red-600 hover:bg-red-700 text-white rounded-3xl flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Bed size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-lg">Dispatch Ambulance</p>
                        <p className="text-xs text-red-100 font-medium">GPS location will be shared</p>
                      </div>
                    </div>
                    <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={() => setEmergencyStep('booking')}
                    className="w-full p-6 bg-slate-900 hover:bg-black text-white rounded-3xl flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Stethoscope size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-lg">Emergency Consultation</p>
                        <p className="text-xs text-slate-400 font-medium">Connect with on-call doctor</p>
                      </div>
                    </div>
                    <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </button>

                  <a 
                    href="https://wa.me/917032130919?text=EMERGENCY:%20I%20need%20immediate%20medical%20assistance."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Smartphone size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-lg">WhatsApp Doctor</p>
                        <p className="text-xs text-emerald-100 font-medium">Direct line: 7032130919</p>
                      </div>
                    </div>
                    <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              )}

              {emergencyStep === 'ambulance' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Location</label>
                    <textarea 
                      id="emergency-location"
                      placeholder="Enter precise location or landmarks..."
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-red-500 outline-none transition-all dark:text-white min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setEmergencyStep('initial')}
                      className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => {
                        const loc = (document.getElementById('emergency-location') as HTMLTextAreaElement).value;
                        requestEmergencyAmbulance(loc || 'Current Location');
                      }}
                      className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-200"
                    >
                      Confirm Dispatch
                    </button>
                  </div>
                </div>
              )}

              {emergencyStep === 'booking' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Symptoms Description</label>
                    <textarea 
                      id="emergency-symptoms"
                      placeholder="Briefly describe the emergency symptoms..."
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-red-500 outline-none transition-all dark:text-white min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setEmergencyStep('initial')}
                      className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => {
                        const sym = (document.getElementById('emergency-symptoms') as HTMLTextAreaElement).value;
                        bookEmergencyConsultation(sym || 'No description provided');
                      }}
                      className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              )}

              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 mt-8">
                <div className="flex items-center gap-3 text-[#1E88E5] mb-2">
                  <Activity size={20} />
                  <span className="text-sm font-black uppercase tracking-widest">Triage AI Active</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Our Multi-Agent AI system is monitoring this request. An emergency specialist will be assigned to your case within 60 seconds.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Appointments & History */}
          <div className="lg:col-span-2 space-y-8">
            {/* Appointments Section */}
            <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-2xl shadow-blue-100/20 dark:shadow-none relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 text-blue-600">
                <Calendar size={200} />
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Calendar className="text-[#1E88E5]" size={32} />
                    Clinical Queue
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage your active treatment schedule</p>
                </div>
                <button
                  onClick={onBookNew}
                  className="btn-primary py-4 px-8 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-200 dark:shadow-none group"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  <span className="uppercase tracking-widest text-xs font-black">Book Specialist</span>
                </button>
              </div>

              <div className="space-y-6 relative z-10">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#1E88E5] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Syncing EHR Data...</p>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="py-20 text-center bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                      <Calendar className="text-slate-300" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No active bookings</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto font-medium">You haven't scheduled any consultations yet. Start by choosing a specialist.</p>
                    <button onClick={onBookNew} className="text-[#1E88E5] font-black uppercase tracking-[0.2em] text-xs hover:underline">Find a Doctor →</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="group bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-blue-100/50 dark:hover:shadow-none"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-start gap-5">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-[#1E88E5] group-hover:scale-110 transition-transform duration-500">
                              <User size={32} />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{apt.doctor.name}</h3>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(apt.status)}`}>
                                  {apt.status}
                                </span>
                              </div>
                              <p className="text-[#1E88E5] font-black uppercase tracking-widest text-[10px] mb-3">{apt.doctor.specialization}</p>
                              <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-bold">
                                  <Calendar size={16} className="text-slate-400" />
                                  {new Date(apt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-bold">
                                  <Clock size={16} className="text-slate-400" />
                                  {apt.appointment_time.slice(0, 5)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 self-end md:self-center">
                            <button
                              onClick={() => {
                                setSelectedAppointment(apt.id);
                                setDoctorName(apt.doctor.name);
                                setChatOpen(true);
                              }}
                              className="p-4 bg-blue-50 dark:bg-blue-900/20 text-[#1E88E5] rounded-2xl hover:bg-[#1E88E5] hover:text-white transition-all duration-300 shadow-sm"
                              title="Live Chat"
                            >
                              <MessageCircle size={20} />
                            </button>
                            <button
                              onClick={() => {
                                setReschedulingApt(apt.id);
                                setShowRescheduleModal(true);
                              }}
                              className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm"
                              title="Reschedule"
                            >
                              <Calendar size={20} />
                            </button>
                            <button
                              onClick={() => cancelAppointment(apt.id)}
                              className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm"
                              title="Cancel Session"
                            >
                              <Trash2 size={20} />
                            </button>
                            <button
                              onClick={() => setViewingAppointment(apt)}
                              className="p-4 bg-slate-50 dark:bg-slate-700 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-sm"
                              title="View Details"
                            >
                              <MoreVertical size={20} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Status Tracking Timeline - Minimal UI */}
                        {apt.status !== 'cancelled' && (
                          <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Workflow Progress</span>
                              </div>
                              <span className="text-[10px] font-black text-[#1E88E5] uppercase tracking-widest">Stage 1 of 4</span>
                            </div>
                            
                            <div className="relative">
                              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-700 -translate-y-1/2"></div>
                              <div className="relative flex justify-between">
                                {[
                                  { label: 'Confirmed', icon: CheckCircle2, active: true },
                                  { label: 'Pre-Check', icon: ClipboardList, active: apt.status === 'confirmed' },
                                  { label: 'Consultation', icon: Activity, active: false },
                                  { label: 'Follow-up', icon: FileText, active: false }
                                ].map((step, idx) => (
                                  <div key={idx} className="flex flex-col items-center gap-2 relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                      step.active 
                                        ? 'bg-[#1E88E5] text-white shadow-lg shadow-blue-200 scale-110' 
                                        : 'bg-white dark:bg-slate-800 text-slate-300 border-2 border-slate-100 dark:border-slate-700'
                                    }`}>
                                      <step.icon size={14} />
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${step.active ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                      {step.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          {/* Health Analytics Widget */}
          <div className="card p-6">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Health Insights
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500">
                    <Heart size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Blood Pressure</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {patientVitals?.blood_pressure || '---/--'} <span className="text-[10px] text-slate-400 font-normal">mmHg</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-500">
                    <Zap size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Body Weight</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {patientVitals?.weight || '--.-'} <span className="text-[10px] text-slate-400 font-normal">kg</span>
                </span>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Note</p>
                <p className="text-xs text-slate-500 italic leading-relaxed">
                  {patientVitals?.clinical_note ? `"${patientVitals.clinical_note}"` : '"No recent clinical notes available."'}
                </p>
              </div>
            </div>
          </div>

          {/* Health Video Section */}
          <div className="space-y-4 pt-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-xl">
              <Video size={22} className="text-red-500" />
              Health & Wellness
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card overflow-hidden group">
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 relative flex items-center justify-center cursor-pointer">
                  <img src="https://images.unsplash.com/photo-1505751172107-573967a4dd29?auto=format&fit=crop&q=80&w=800" alt="Health Video" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center text-blue-600 shadow-xl group-hover:scale-110 transition-all">
                      <Play size={32} className="ml-1" />
                    </div>
                  </div>
                  <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded">04:20</span>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 transition-colors">10 Tips for a Healthier Heart</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Learn from top cardiologists about maintaining heart health.</p>
                </div>
              </div>
              <div className="card overflow-hidden group">
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 relative flex items-center justify-center cursor-pointer">
                  <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800" alt="Yoga Video" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center text-blue-600 shadow-xl group-hover:scale-110 transition-all">
                      <Play size={32} className="ml-1" />
                    </div>
                  </div>
                  <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded">12:15</span>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 transition-colors">Morning Yoga for Flexibility</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Start your day with these simple yoga poses.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Medical Reports Widget */}
          <div className="card p-6">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <FileText size={20} className="text-purple-600" />
              Recent Lab Reports
            </h3>
            <div className="space-y-4">
              {medicalReports.length > 0 ? (
                medicalReports.map((report, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-blue-200 cursor-pointer transition-all">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{report.title}</p>
                      <p className="text-[10px] text-slate-500 uppercase mt-0.5">
                        {new Date(report.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No recent lab reports</p>
              )}
            </div>
            <button 
              onClick={() => (window as any).setView('patient-medical-reports')}
              className="w-full mt-6 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase hover:underline"
            >
              View All Reports
            </button>
          </div>

          {/* Clinical Reminders */}
          <div className="card p-6 border-l-4 border-l-amber-500">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Bell size={18} className="text-amber-500" />
              Active Reminders
            </h3>
            <div className="space-y-4">
              {appointments.filter(a => a.status === 'confirmed').length > 0 ? (
                appointments.filter(a => a.status === 'confirmed').slice(0, 2).map((apt, i) => (
                  <div key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Upcoming: {apt.doctor.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">
                        {new Date(apt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {apt.appointment_time.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">No active reminders</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Stay healthy!</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Active</span>
               <button className="text-[10px] font-black text-[#1E88E5] uppercase tracking-widest hover:underline">Manage Alerts</button>
            </div>
          </div>

          {/* Health Tip Widget */}
          <div className="card p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-200 dark:shadow-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
              <Activity size={100} />
            </div>
            <h3 className="font-bold text-xl mb-4 relative z-10">Health Tip of the Day</h3>
            <p className="text-blue-100 mb-6 relative z-10 text-sm leading-relaxed">
              Stay hydrated! Drinking enough water is essential for your kidneys and other bodily functions. Aim for at least 8 glasses a day.
            </p>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors relative z-10 text-sm backdrop-blur-sm border border-white/10">
              Read More Tips
            </button>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Activity size={18} className="text-emerald-500" />
              Quick Services
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Bed Booking', icon: Bed, view: 'bed-availability' },
                { label: 'Pharmacy', icon: Pill, view: 'pharmacy' },
                { label: 'Ambulance', icon: Activity, view: 'ambulance' },
                { label: 'Telemedicine', icon: Video, view: 'telemedicine' },
              ].map((action, i) => (
                <button 
                  key={i} 
                  onClick={() => (window as any).setView(action.view)}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-100 dark:border-slate-800 transition-all flex flex-col items-center gap-3 group text-center"
                >
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl text-slate-400 group-hover:text-[#1E88E5] shadow-sm transition-colors">
                    <action.icon size={20} />
                  </div>
                  <span className="text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-wider">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {chatOpen && selectedAppointment && (
        <Chat
          appointmentId={selectedAppointment}
          doctorName={doctorName}
          isOpen={chatOpen}
          onClose={() => {
            setChatOpen(false);
            setSelectedAppointment(null);
          }}
        />
      )}

      {/* AI Summary Preview Modal */}
      {showSummaryPreview && aiSummary && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-scaleIn border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-[#1E88E5]">
                  <ClipboardList size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Clinical Summary</h3>
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">AI Generated Preview</p>
                </div>
              </div>
              <button onClick={() => setShowSummaryPreview(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 mb-8">
              <pre className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {aiSummary}
              </pre>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  alert('Summary sent to clinical queue for doctor verification.');
                  setShowSummaryPreview(false);
                  setShowAIModal(false);
                }}
                className="w-full p-5 bg-[#1E88E5] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-200 dark:shadow-none transition-all active:scale-95"
              >
                Send to Doctor for Approval
              </button>
              <button 
                onClick={() => setShowSummaryPreview(false)}
                className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600 transition-colors"
              >
                Edit Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && reschedulingApt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-scaleIn border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Calendar size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Reschedule</h3>
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Select new slot</p>
                </div>
              </div>
              <button onClick={() => setShowRescheduleModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleReschedule(reschedulingApt, formData.get('date') as string, formData.get('time') as string);
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Date</label>
                <input 
                  type="date" 
                  name="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-emerald-500 outline-none transition-all dark:text-white" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Preferred Time</label>
                <input 
                  type="time" 
                  name="time"
                  required
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-emerald-500 outline-none transition-all dark:text-white" 
                />
              </div>
              <button type="submit" className="w-full p-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-200 dark:shadow-none transition-all active:scale-95">
                Confirm Reschedule
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {viewingAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-scaleIn border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-[#1E88E5]">
                  <ClipboardList size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Appointment Details</h3>
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">EHR Reference: {viewingAppointment.id.slice(0, 8)}</p>
                </div>
              </div>
              <button onClick={() => setViewingAppointment(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Doctor</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{viewingAppointment.doctor.name}</p>
                  <p className="text-[10px] text-blue-500 font-bold uppercase">{viewingAppointment.doctor.specialization}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(viewingAppointment.status)}`}>
                    {viewingAppointment.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date & Time</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {new Date(viewingAppointment.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-slate-500">{viewingAppointment.appointment_time.slice(0, 5)}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    {viewingAppointment.type === 'Tele-consultation' ? <Video size={14} className="text-blue-500" /> : <User size={14} className="text-emerald-500" />}
                    {viewingAppointment.type || 'In-person'}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Patient Notes</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                  {viewingAppointment.notes || 'No notes provided for this consultation.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setViewingAppointment(null);
                    setSelectedAppointment(viewingAppointment.id);
                    setDoctorName(viewingAppointment.doctor.name);
                    setChatOpen(true);
                  }}
                  className="flex-1 p-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  Open Chat
                </button>
                <button
                  onClick={() => setViewingAppointment(null)}
                  className="flex-1 p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
