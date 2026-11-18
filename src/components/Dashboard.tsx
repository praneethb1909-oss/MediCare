import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, orderBy, addDoc, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
  Calendar, Clock, User, Trash2, Plus, MessageCircle, Activity, ChevronRight,
  FileText, Receipt, ClipboardList, Pill, TestTube2, Video, Play, TrendingUp,
  Shield, Zap, Bed, Smartphone, Phone, AlertCircle, CheckCircle2,
  MoreVertical, X, Download, Share2, Bell, Sparkles, Droplets, ShieldCheck
} from 'lucide-react';
import { Chat } from './Chat';
import { AIPreConsultationModal } from './AIPreConsultationModal';
import { MedicareWaveLoader } from './common/MedicareWaveLoader';

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
  const [patientName, setPatientName] = useState(() => {
    return user?.displayName || (user?.email ? user.email.split('@')[0] : '');
  });
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
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'telemedicine'>('all');

  const HEALTH_QUOTES = [
    { te: "ఆరోగ్యమే మహాభాగ్యం.", en: "Health is the greatest wealth." },
    { te: "మంచి ఆహారం, సరైన వ్యాయామం - ఆరోగ్యానికి మూలం.", en: "Good nutrition and regular movement form the foundation of well-being." },
    { te: "నిద్ర లేమి అన్ని రోగాలకు కారణం.", en: "Restorative sleep is essential for vital organs and immune strength." },
    { te: "పరిశుభ్రతే దైవం, ఆరోగ్యమే ప్రాణం.", en: "Cleanliness of body and mind sustains vital energy." },
    { te: "The greatest wealth is health.", en: "Classical Philosophy" },
    { te: "It is health that is real wealth and not pieces of gold and silver.", en: "Mahatma Gandhi" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % HEALTH_QUOTES.length);
    }, 6000);
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
        limit(3)
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
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [intakeAppointment, setIntakeAppointment] = useState<Appointment | null>(null);

  const loadPatientProfile = useCallback(async () => {
    if (!user) return;

    const fallbackName = user.displayName || (user.email ? user.email.split('@')[0] : 'Patient');
    if (!patientName) {
      setPatientName(fallbackName);
    }

    try {
      // 1. By UID from patients collection
      const patientDoc = await getDoc(doc(db, 'patients', user.uid));
      if (patientDoc.exists() && patientDoc.data().full_name) {
        setPatientName(patientDoc.data().full_name);
        return;
      }

      // 2. Query patients by email
      if (user.email) {
        const byEmail = await getDocs(query(
          collection(db, 'patients'),
          where('email', '==', user.email),
          limit(1)
        ));
        if (!byEmail.empty && byEmail.docs[0].data().full_name) {
          setPatientName(byEmail.docs[0].data().full_name);
          return;
        }
      }

      // 3. Fallback to auth credentials
      if (fallbackName) {
        setPatientName(fallbackName);
      }
    } catch (error) {
      console.error('Error loading patient profile:', error);
      if (fallbackName) setPatientName(fallbackName);
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

        let doctorData = { name: 'Specialist Physician', specialization: 'General Medicine' };
        if (aptData.doctor_id) {
          try {
            const doctorDoc = await getDoc(doc(db, 'doctors', aptData.doctor_id));
            if (doctorDoc.exists()) {
              doctorData = doctorDoc.data() as any;
            }
          } catch (e) {
            console.warn('Could not fetch doctor doc', e);
          }
        }

        appointmentsData.push({
          id: appointmentDoc.id,
          appointment_date: aptData.appointment_date,
          appointment_time: aptData.appointment_time,
          status: aptData.status,
          notes: aptData.notes,
          type: aptData.type || 'In-person',
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
      alert('Emergency Ambulance dispatched to ' + location + '. A coordinator has been notified.');
      setShowEmergencyModal(false);
      setEmergencyStep('initial');
    } catch (error) {
      console.error('Emergency request failed:', error);
    }
  };

  const bookEmergencyConsultation = async (symptoms: string) => {
    try {
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

      alert('Emergency consultation scheduled. An on-call physician is reviewing your request.');
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAiAnalysis(`Olmera Clinical Triage Insights:

1. **Initial Assessment (Triage Agent):** Categorised as Level 3 (Routine / Non-Critical).
2. **Recommended Specialist:** General Medicine / Internal Medicine.
3. **Action Steps:**
   - Stay hydrated and avoid strenuous physical activity.
   - Schedule a consultation within 24–48 hours for clinical evaluation.
   - If severe symptoms or chest tightness occur, call 108 immediately.`);
    } catch (error) {
      console.error('AI Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateAISummary = async () => {
    setAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAiSummary(`Olmera Clinical Summary
      
Patient: ${patientName || user?.displayName || user?.email?.split('@')[0] || 'Patient'}
UHID: OL-${(user?.uid || '8841').slice(0, 6).toUpperCase()}
Date: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
Triage Level: Standard Outpatient
Status: Awaiting Physician Review

Note: Summary synthesized by Olmera Clinical Engine for physician sign-off.`);
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
        return 'bg-[var(--color-surface-subtle)] text-[var(--color-primary)] border border-[var(--color-mist)]';
      case 'pending':
        return 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40';
      case 'emergency':
        return 'bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40';
      case 'cancelled':
        return 'bg-[var(--color-surface-subtle)] text-[var(--color-muted)] border border-[var(--color-line)]';
      default:
        return 'bg-[var(--color-surface-subtle)] text-[var(--color-primary)] border border-[var(--color-line)]';
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (activeTab === 'upcoming') {
      const aptDate = new Date(apt.appointment_date + 'T' + apt.appointment_time);
      return aptDate >= new Date() && apt.status !== 'cancelled';
    }
    if (activeTab === 'telemedicine') {
      return apt.type === 'Tele-consultation' || apt.type === 'telemedicine';
    }
    return true;
  });

  return (
    <div className="space-y-6 lg:space-y-8 animate-fadeIn pb-12 relative w-full font-ui">
      
      {/* Hero: Patient Command Center Header */}
      <div className="relative overflow-hidden bg-[var(--color-primary)] text-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[var(--color-line)] shadow-sm">
        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium uppercase tracking-wider text-[var(--color-mist)] border border-white/10">
                <ShieldCheck size={14} className="text-[var(--color-mist)]" />
                Verified Patient Portal
              </span>
              <span className="px-3 py-1 bg-black/20 backdrop-blur-md rounded-full text-xs font-mono text-[var(--color-mist)] border border-white/5">
                UHID: OL-{(user?.uid || '8841').slice(0, 8).toUpperCase()}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold tracking-tight leading-tight text-white">
                Welcome back, <span className="capitalize text-[var(--color-mist)]">{patientName || user?.displayName || user?.email?.split('@')[0] || 'Patient'}</span>
              </h1>
              <p className="text-[var(--color-mist)] text-sm sm:text-base font-normal mt-1 max-w-2xl leading-relaxed">
                Connect with specialists across Rajam, Vizag, and Srikakulam. Review clinical appointments, lab diagnostics, and live biometric telemetry.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Single Signal Coral element on screen for primary CTA */}
              <button
                onClick={onBookNew}
                className="btn-accent px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-sm"
              >
                <Plus size={18} /> Book Consultation
              </button>
              <button
                onClick={() => (window as any).setView('telemedicine')}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-medium text-sm transition-all flex items-center gap-2 backdrop-blur-sm"
              >
                <Video size={18} /> Teleconsultation
              </button>
              <button
                onClick={() => (window as any).setView('patient-medical-reports')}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-medium text-sm transition-all flex items-center gap-2 backdrop-blur-sm"
              >
                <FileText size={18} /> View Reports
              </button>
            </div>
          </div>

          {/* Real-time Health Status Cards */}
          <div className="grid grid-cols-2 gap-4 w-full xl:w-auto xl:min-w-[340px]">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--color-mist)]">Resting Pulse</span>
                <div className="w-2 h-2 rounded-full bg-[var(--color-mist)] animate-ping"></div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-semibold text-white">72</span>
                <span className="text-xs text-[var(--color-mist)]">BPM</span>
              </div>
              <p className="text-[11px] text-[var(--color-mist)] font-normal mt-1">Normal Resting Rhythm</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--color-mist)]">Daily Steps</span>
                <Zap size={14} className="text-[var(--color-mist)]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-semibold text-white">8,420</span>
                <span className="text-xs text-[var(--color-mist)]">Steps</span>
              </div>
              <p className="text-[11px] text-[var(--color-mist)] font-normal mt-1">84% of daily target</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inspirational Quote & Clinic Ticker */}
      <div className="card p-4 rounded-2xl bg-[var(--color-surface)] border-[var(--color-line)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--color-surface-subtle)] text-[var(--color-primary)] rounded-xl flex-shrink-0 border border-[var(--color-line)]">
            <Activity size={18} />
          </div>
          <div className="transition-all duration-300">
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {HEALTH_QUOTES[quoteIndex].te}
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              {HEALTH_QUOTES[quoteIndex].en}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-[var(--color-muted)] pl-4 border-l border-[var(--color-line)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
            <span>Network Clinics Active</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Phone size={14} className="text-[var(--color-primary)]" />
            <span>Careline: 7032130919</span>
          </div>
        </div>
      </div>

      {/* 4 Professional Quick Action Services */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Emergency SOS */}
        <button
          onClick={() => setShowEmergencyModal(true)}
          className="card p-5 bg-[var(--color-surface)] border-[var(--color-line)] rounded-2xl text-left hover:border-[var(--color-primary)] transition-all group flex items-start justify-between shadow-sm"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 bg-[var(--color-surface-subtle)] text-[var(--color-primary)] rounded-xl flex items-center justify-center border border-[var(--color-line)] group-hover:scale-105 transition-transform">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="font-display font-semibold text-[var(--color-ink)] text-base">Emergency SOS</h4>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">Ambulance dispatch & urgent care</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] group-hover:translate-x-0.5 transition-transform">
              Emergency Desk →
            </span>
          </div>
          <span className="px-2 py-0.5 bg-[var(--color-surface-subtle)] text-[var(--color-muted)] border border-[var(--color-line)] text-[10px] font-semibold uppercase rounded-full">
            24/7
          </span>
        </button>

        {/* AI Symptom Triage */}
        <button
          onClick={() => setShowAIModal(true)}
          className="card p-5 bg-[var(--color-surface)] border-[var(--color-line)] rounded-2xl text-left hover:border-[var(--color-primary)] transition-all group flex items-start justify-between shadow-sm"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 bg-[var(--color-surface-subtle)] text-[var(--color-primary)] rounded-xl flex items-center justify-center border border-[var(--color-line)] group-hover:scale-105 transition-transform">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="font-display font-semibold text-[var(--color-ink)] text-base">Clinical Triage</h4>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">Guidance powered by Olmera AI</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] group-hover:translate-x-0.5 transition-transform">
              Check Symptoms →
            </span>
          </div>
          <span className="px-2 py-0.5 bg-[var(--color-surface-subtle)] text-[var(--color-muted)] border border-[var(--color-line)] text-[10px] font-semibold uppercase rounded-full">
            Triage
          </span>
        </button>

        {/* WhatsApp Helpline */}
        <a
          href="https://wa.me/917032130919?text=Hello%20Olmera%20Support,%20I%20need%20assistance%20with%20my%20health%20records/appointment."
          target="_blank"
          rel="noopener noreferrer"
          className="card p-5 bg-[var(--color-surface)] border-[var(--color-line)] rounded-2xl text-left hover:border-[var(--color-primary)] transition-all group flex items-start justify-between shadow-sm"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 bg-[var(--color-surface-subtle)] text-[var(--color-primary)] rounded-xl flex items-center justify-center border border-[var(--color-line)] group-hover:scale-105 transition-transform">
              <Smartphone size={20} />
            </div>
            <div>
              <h4 className="font-display font-semibold text-[var(--color-ink)] text-base">Care Concierge</h4>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">Direct chat with care coordinators</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] group-hover:translate-x-0.5 transition-transform">
              Open WhatsApp →
            </span>
          </div>
          <span className="px-2 py-0.5 bg-[var(--color-surface-subtle)] text-[var(--color-muted)] border border-[var(--color-line)] text-[10px] font-semibold uppercase rounded-full">
            Online
          </span>
        </a>

        {/* Digital Health Records */}
        <button
          onClick={() => (window as any).setView('patient-medical-reports')}
          className="card p-5 bg-[var(--color-surface)] border-[var(--color-line)] rounded-2xl text-left hover:border-[var(--color-primary)] transition-all group flex items-start justify-between shadow-sm"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 bg-[var(--color-surface-subtle)] text-[var(--color-primary)] rounded-xl flex items-center justify-center border border-[var(--color-line)] group-hover:scale-105 transition-transform">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="font-display font-semibold text-[var(--color-ink)] text-base">Medical Vault</h4>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">Lab reports, prescriptions & scans</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] group-hover:translate-x-0.5 transition-transform">
              Open Records →
            </span>
          </div>
          <span className="px-2 py-0.5 bg-[var(--color-surface-subtle)] text-[var(--color-muted)] border border-[var(--color-line)] text-[10px] font-semibold uppercase rounded-full">
            Secure
          </span>
        </button>
      </div>

      {/* Main Responsive Grid: 8 Cols Main Content + 4 Cols Clinical Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Appointments, Vitals & Wellness (8 Cols) */}
        <div className="lg:col-span-8 space-y-6 lg:space-y-8">
          {/* Clinical Queue Section */}
          <div className="card p-6 sm:p-8 bg-[var(--color-surface)] border-[var(--color-line)] rounded-3xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[var(--color-line)]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[var(--color-surface-subtle)] text-[var(--color-primary)] rounded-xl border border-[var(--color-line)]">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-semibold text-[var(--color-ink)]">
                      Clinical Queue & Appointments
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--color-muted)] font-ui">
                      Manage scheduled specialist consultations and clinical follow-ups
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Selector & Book Button */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex p-1 bg-[var(--color-surface-subtle)] rounded-xl text-xs font-medium border border-[var(--color-line)]">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'all' ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}
                  >
                    All ({appointments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'upcoming' ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => setActiveTab('telemedicine')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'telemedicine' ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}
                  >
                    Telehealth
                  </button>
                </div>

                <button
                  onClick={onBookNew}
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2"
                >
                  <Plus size={16} /> Book Consultation
                </button>
              </div>
            </div>

            {/* Appointment Content */}
            {loading ? (
              <MedicareWaveLoader 
                variant="card" 
                text="Syncing Clinical Queue & Appointments..." 
                subtitle="Retrieving verified consultations and specialist schedules"
                className="my-4"
              />
            ) : filteredAppointments.length === 0 ? (
              <div className="py-12 px-6 text-center bg-[var(--color-surface-subtle)] rounded-2xl border border-dashed border-[var(--color-line)]">
                <div className="w-14 h-14 bg-[var(--color-surface)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--color-line)] text-[var(--color-muted)]">
                  <Calendar size={28} />
                </div>
                <h3 className="text-base font-display font-semibold text-[var(--color-ink)] mb-1">
                  No {activeTab !== 'all' ? activeTab : ''} consultations scheduled
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-muted)] mb-6 max-w-md mx-auto">
                  You have no active consultations in this view. Choose a specialty below or schedule a consultation:
                </p>

                {/* Quick Specialty Chips */}
                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto mb-6">
                  {['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Neurology'].map((spec) => (
                    <button
                      key={spec}
                      onClick={onBookNew}
                      className="px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-primary)] rounded-xl text-xs font-medium text-[var(--color-ink)] transition-colors shadow-sm"
                    >
                      + {spec}
                    </button>
                  ))}
                </div>

                <button
                  onClick={onBookNew}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                  Browse all specialists & network hospitals →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-5 bg-[var(--color-surface-subtle)] rounded-2xl border border-[var(--color-line)] hover:border-[var(--color-primary)] transition-all shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[var(--color-mist)] text-[var(--color-primary)] rounded-2xl flex items-center justify-center font-display font-semibold text-base flex-shrink-0 border border-[var(--color-line)]">
                          {apt.doctor.name?.[0] || 'D'}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="text-base font-display font-semibold text-[var(--color-ink)]">
                              {apt.doctor.name}
                            </h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${getStatusColor(apt.status)}`}>
                              {apt.status}
                            </span>
                            <span className="px-2 py-0.5 bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-muted)] rounded text-[11px] font-medium flex items-center gap-1">
                              {apt.type === 'Tele-consultation' ? <Video size={12} className="text-[var(--color-primary)]" /> : <User size={12} className="text-[var(--color-primary)]" />}
                              {apt.type || 'In-person'}
                            </span>
                          </div>

                          <p className="text-xs font-medium text-[var(--color-primary)]">
                            {apt.doctor.specialization || 'Clinical Specialist'}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[var(--color-muted)]">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Calendar size={14} className="text-[var(--color-muted)]" />
                              {new Date(apt.appointment_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                              <Clock size={14} className="text-[var(--color-muted)]" />
                              {apt.appointment_time.slice(0, 5)} hrs
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={() => {
                            setIntakeAppointment(apt);
                            setShowIntakeModal(true);
                          }}
                          className="px-3 py-2 bg-[var(--color-primary)] text-white hover:opacity-90 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                          title="Complete AI Pre-Visit Intake for Doctor"
                        >
                          <Sparkles size={14} className="text-[var(--color-mist)]" />
                          <span>AI Intake</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAppointment(apt.id);
                            setDoctorName(apt.doctor.name);
                            setChatOpen(true);
                          }}
                          className="px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-primary)] text-[var(--color-primary)] rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
                          title="Open Specialist Chat"
                        >
                          <MessageCircle size={15} />
                          <span>Chat</span>
                        </button>
                        <button
                          onClick={() => {
                            setReschedulingApt(apt.id);
                            setShowRescheduleModal(true);
                          }}
                          className="px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-primary)] text-[var(--color-ink)] rounded-xl text-xs font-medium transition-all"
                          title="Reschedule Slot"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => setViewingAppointment(apt)}
                          className="p-2 bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-primary)] text-[var(--color-muted)] rounded-xl transition-all"
                          title="View Details"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <button
                          onClick={() => cancelAppointment(apt.id)}
                          className="p-2 bg-[var(--color-surface)] border border-[var(--color-line)] hover:bg-rose-50 text-rose-600 rounded-xl transition-all"
                          title="Cancel"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Tracker for Confirmed Appointments */}
                    {apt.status !== 'cancelled' && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-line)]">
                        <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)] mb-2">
                          <span className="font-medium text-[var(--color-ink)]">Consultation Sequence</span>
                          <span className="text-[var(--color-primary)] font-medium">Step 1: Confirmed</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {[
                            { label: 'Booking', active: true },
                            { label: 'Pre-Triage', active: true },
                            { label: 'Consult', active: false },
                            { label: 'Rx & Care', active: false }
                          ].map((step, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className={`h-1.5 rounded-full ${step.active ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-line)]'}`}></div>
                              <span className={`text-[10px] font-medium block ${step.active ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-muted)]'}`}>
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vitals & Biometric Tracking Panel */}
          <div className="card p-6 sm:p-8 bg-[var(--color-surface)] border-[var(--color-line)] rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-line)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[var(--color-surface-subtle)] text-[var(--color-primary)] rounded-xl border border-[var(--color-line)]">
                  <Activity size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold text-[var(--color-ink)]">
                    Live Vitals & Health Insights
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-muted)] font-ui">
                    Recorded biometrics synchronized from recent network clinic visits
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 bg-[var(--color-surface-subtle)] text-[var(--color-primary)] text-xs font-medium rounded-full border border-[var(--color-line)]">
                Telemetry Normal
              </span>
            </div>

            {/* 4 Vitals Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-[var(--color-surface-subtle)] rounded-2xl border border-[var(--color-line)]">
                <div className="flex items-center gap-2 text-[var(--color-primary)] mb-2">
                  <Activity size={16} />
                  <span className="text-xs font-medium text-[var(--color-muted)]">Blood Pressure</span>
                </div>
                <p className="text-xl font-display font-semibold text-[var(--color-ink)]">
                  {patientVitals?.blood_pressure || '120/80'} <span className="text-xs font-normal text-[var(--color-muted)]">mmHg</span>
                </p>
                <p className="text-[10px] text-[var(--color-primary)] font-medium mt-1">Optimal Range</p>
              </div>

              <div className="p-4 bg-[var(--color-surface-subtle)] rounded-2xl border border-[var(--color-line)]">
                <div className="flex items-center gap-2 text-[var(--color-primary)] mb-2">
                  <Activity size={16} />
                  <span className="text-xs font-medium text-[var(--color-muted)]">Pulse Rate</span>
                </div>
                <p className="text-xl font-display font-semibold text-[var(--color-ink)]">
                  {patientVitals?.pulse || '72'} <span className="text-xs font-normal text-[var(--color-muted)]">BPM</span>
                </p>
                <p className="text-[10px] text-[var(--color-primary)] font-medium mt-1">Resting Rhythm</p>
              </div>

              <div className="p-4 bg-[var(--color-surface-subtle)] rounded-2xl border border-[var(--color-line)]">
                <div className="flex items-center gap-2 text-[var(--color-primary)] mb-2">
                  <Droplets size={16} />
                  <span className="text-xs font-medium text-[var(--color-muted)]">SpO2 Oxygen</span>
                </div>
                <p className="text-xl font-display font-semibold text-[var(--color-ink)]">
                  {patientVitals?.spo2 || '98'} <span className="text-xs font-normal text-[var(--color-muted)]">%</span>
                </p>
                <p className="text-[10px] text-[var(--color-primary)] font-medium mt-1">Optimal Saturation</p>
              </div>

              <div className="p-4 bg-[var(--color-surface-subtle)] rounded-2xl border border-[var(--color-line)]">
                <div className="flex items-center gap-2 text-[var(--color-primary)] mb-2">
                  <TrendingUp size={16} />
                  <span className="text-xs font-medium text-[var(--color-muted)]">Body Weight</span>
                </div>
                <p className="text-xl font-display font-semibold text-[var(--color-ink)]">
                  {patientVitals?.weight || '68.5'} <span className="text-xs font-normal text-[var(--color-muted)]">kg</span>
                </p>
                <p className="text-[10px] text-[var(--color-muted)] font-medium mt-1">BMI 22.4 (Healthy)</p>
              </div>
            </div>

            {/* Clinical Note Callout */}
            <div className="p-4 bg-[var(--color-surface-subtle)] rounded-2xl border border-[var(--color-line)]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary)] mb-1">
                Attending Physician Note
              </p>
              <p className="text-xs sm:text-sm text-[var(--color-ink)] italic leading-relaxed">
                {patientVitals?.clinical_note
                  ? `"${patientVitals.clinical_note}"`
                  : '"Patient vitals remain stable. Maintain balanced hydration, 30 minutes daily moderate movement, and schedule routine screening next quarter."'}
              </p>
            </div>
          </div>

          {/* Health & Wellness Videos */}
          <div className="card p-6 sm:p-8 bg-[var(--color-surface)] border-[var(--color-line)] rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[var(--color-surface-subtle)] text-[var(--color-primary)] rounded-xl border border-[var(--color-line)]">
                  <Video size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold text-[var(--color-ink)]">
                    Health & Preventive Guidance
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-muted)] font-ui">
                    Curated clinical recommendations from certified specialists
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[var(--color-line)] overflow-hidden group hover:shadow-md transition-all bg-[var(--color-surface)]">
                <div className="aspect-video relative overflow-hidden bg-[var(--color-surface-subtle)]">
                  <img
                    src="https://images.unsplash.com/photo-1505751172107-573967a4dd29?auto=format&fit=crop&q=80&w=800"
                    alt="Preventive Wellness"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-[var(--color-primary)] shadow-md group-hover:scale-110 transition-transform">
                      <Play size={20} className="ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-medium px-2 py-0.5 rounded">
                    04:20
                  </span>
                </div>
                <div className="p-4">
                  <h4 className="font-display font-semibold text-[var(--color-ink)] text-sm group-hover:text-[var(--color-primary)] transition-colors">
                    10 Principles for Cardiovascular Longevity
                  </h4>
                  <p className="text-xs text-[var(--color-muted)] mt-1">
                    Cardiology department guidance on arterial wellness and lipid balance.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-line)] overflow-hidden group hover:shadow-md transition-all bg-[var(--color-surface)]">
                <div className="aspect-video relative overflow-hidden bg-[var(--color-surface-subtle)]">
                  <img
                    src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800"
                    alt="Spinal Flexibility"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-[var(--color-primary)] shadow-md group-hover:scale-110 transition-transform">
                      <Play size={20} className="ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-medium px-2 py-0.5 rounded">
                    12:15
                  </span>
                </div>
                <div className="p-4">
                  <h4 className="font-display font-semibold text-[var(--color-ink)] text-sm group-hover:text-[var(--color-primary)] transition-colors">
                    Morning Posture & Spinal Mobility
                  </h4>
                  <p className="text-xs text-[var(--color-muted)] mt-1">
                    Physical rehabilitation routines to reduce postural strain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clinical Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Urgent Support Quick Card */}
          <div className="bg-[var(--color-primary)] rounded-3xl p-6 text-white border border-[var(--color-line)] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-semibold uppercase tracking-wider text-[var(--color-mist)]">
                Emergency Hotline
              </span>
              <AlertCircle size={20} className="text-[var(--color-mist)]" />
            </div>
            <div>
              <h3 className="text-xl font-display font-semibold">Immediate Assistance</h3>
              <p className="text-xs text-[var(--color-mist)] mt-1 leading-relaxed">
                Connect directly with the 24/7 Olmera emergency and hospital triage network.
              </p>
            </div>
            <div className="space-y-2 pt-1">
              <button
                onClick={() => setShowEmergencyModal(true)}
                className="w-full py-3 bg-white text-[var(--color-primary)] hover:bg-[var(--color-surface-subtle)] rounded-xl font-medium text-xs transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <AlertCircle size={16} /> Dispatch Ambulance / SOS
              </button>
              <a
                href="tel:108"
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-2"
              >
                <Phone size={14} /> Dial 108 Emergency
              </a>
            </div>
          </div>

          {/* Active Prescriptions & Medications Tracker */}
          <div className="card p-6 bg-[var(--color-surface)] border-[var(--color-line)] rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)]">
              <div className="flex items-center gap-2 text-[var(--color-ink)] font-display font-semibold text-base">
                <Pill size={18} className="text-[var(--color-primary)]" />
                <span>Active Prescriptions</span>
              </div>
              <button
                onClick={() => (window as any).setView('patient-prescriptions')}
                className="text-xs font-medium text-[var(--color-primary)] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-line)]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[var(--color-ink)]">Metformin 500mg</span>
                  <span className="px-2 py-0.5 bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-primary)] rounded text-[10px] font-medium">
                    Daily
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted)] mt-1">1 tablet post-breakfast • Dr. S. Rao</p>
              </div>

              <div className="p-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-line)]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[var(--color-ink)]">Vitamin D3 60k IU</span>
                  <span className="px-2 py-0.5 bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-primary)] rounded text-[10px] font-medium">
                    Weekly
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted)] mt-1">1 capsule on Sundays • Refill in 2 wks</p>
              </div>
            </div>
          </div>

          {/* Recent Lab Reports Widget */}
          <div className="card p-6 bg-[var(--color-surface)] border-[var(--color-line)] rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)]">
              <div className="flex items-center gap-2 text-[var(--color-ink)] font-display font-semibold text-base">
                <FileText size={18} className="text-[var(--color-primary)]" />
                <span>Recent Diagnostics</span>
              </div>
              <button
                onClick={() => (window as any).setView('patient-medical-reports')}
                className="text-xs font-medium text-[var(--color-primary)] hover:underline"
              >
                All Reports
              </button>
            </div>

            <div className="space-y-2.5">
              {medicalReports.length > 0 ? (
                medicalReports.map((report, i) => (
                  <div
                    key={i}
                    onClick={() => (window as any).setView('patient-medical-reports')}
                    className="p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-line)] hover:border-[var(--color-primary)] cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-medium text-[var(--color-ink)] truncate max-w-[180px]">{report.title}</p>
                      <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
                        {new Date(report.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-[var(--color-muted)]" />
                  </div>
                ))
              ) : (
                <div className="p-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-line)] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[var(--color-ink)]">Complete Blood Count (CBC)</p>
                    <p className="text-[10px] text-[var(--color-primary)] font-medium mt-0.5">Normal • Verified by Pathologist</p>
                  </div>
                  <ChevronRight size={16} className="text-[var(--color-muted)]" />
                </div>
              )}
            </div>
          </div>

          {/* Health Tip Widget */}
          <div className="card p-6 bg-[var(--color-surface-subtle)] rounded-3xl border border-[var(--color-line)] space-y-3">
            <div className="flex items-center gap-2 text-[var(--color-primary)] font-semibold text-xs uppercase tracking-wider">
              <Sparkles size={16} />
              <span>Physician Tip of the Day</span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--color-ink)] leading-relaxed font-normal">
              "Maintaining steady hydration (2.5 to 3 liters daily) directly relieves cardiovascular workload and supports metabolic equilibrium."
            </p>
            <p className="text-[11px] text-[var(--color-muted)]">
              — Dr. Ramesh Kumar, Chief Cardiologist (Olmera Care Center)
            </p>
          </div>

          {/* Quick Hospital Services 4-Pills Grid */}
          <div className="card p-6 bg-[var(--color-surface)] border-[var(--color-line)] rounded-3xl shadow-sm space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-[var(--color-muted)]">
              Clinical Facilities
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Bed Tracking', icon: Bed, view: 'hospitals' },
                { label: 'Pharmacy', icon: Pill, view: 'patient-prescriptions' },
                { label: 'Telehealth', icon: Video, view: 'telemedicine' },
                { label: 'Lab Tests', icon: TestTube2, view: 'patient-medical-reports' },
              ].map((svc, i) => (
                <button
                  key={i}
                  onClick={() => (window as any).setView(svc.view)}
                  className="p-3 rounded-xl bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-primary)] text-left transition-all group"
                >
                  <svc.icon size={18} className="text-[var(--color-primary)] mb-1.5 group-hover:scale-105 transition-transform" />
                  <p className="text-xs font-medium text-[var(--color-ink)]">{svc.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Triage Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] text-[var(--color-ink)] w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-[var(--color-line)] animate-scaleIn">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-line)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[var(--color-surface-subtle)] text-[var(--color-primary)] rounded-2xl flex items-center justify-center border border-[var(--color-line)]">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold">Olmera Clinical Triage</h3>
                  <p className="text-xs text-[var(--color-muted)]">AI-guided initial assessment</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAIModal(false);
                  setAiAnalysis(null);
                }}
                className="p-2 hover:bg-[var(--color-surface-subtle)] rounded-xl transition-colors text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--color-muted)] block mb-1.5">
                  Describe symptoms, severity, and duration:
                </label>
                <textarea
                  id="ai-symptoms-input"
                  placeholder="e.g. Mild persistent headache since 2 days, slight fatigue..."
                  className="w-full p-3.5 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-2xl focus:border-[var(--color-primary)] outline-none transition-all text-sm min-h-[110px]"
                />
              </div>

              {aiAnalysis ? (
                <div className="p-4 bg-[var(--color-surface-subtle)] rounded-2xl border border-[var(--color-line)] text-xs sm:text-sm text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed">
                  {aiAnalysis}
                </div>
              ) : analyzing ? (
                <MedicareWaveLoader 
                  variant="card" 
                  text="Analyzing reported symptoms..." 
                  subtitle="Evaluating clinical guidelines and telemetry patterns"
                  className="my-2 border-none bg-transparent shadow-none"
                />
              ) : (
                <button
                  onClick={() => {
                    const input = (document.getElementById('ai-symptoms-input') as HTMLTextAreaElement)?.value || '';
                    runAIAnalysis(input);
                  }}
                  className="btn-primary w-full py-3.5 rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} /> Run Clinical Triage
                </button>
              )}

              <p className="text-[10px] text-[var(--color-muted)] text-center leading-relaxed">
                Notice: AI Triage is for preliminary guidance only and does not substitute a licensed clinical consultation. In emergency, call 108.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] text-[var(--color-ink)] w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-[var(--color-line)] animate-scaleIn">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-line)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[var(--color-surface-subtle)] text-[var(--color-primary)] rounded-2xl flex items-center justify-center border border-[var(--color-line)]">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold">Emergency Assistance</h3>
                  <p className="text-xs text-[var(--color-muted)]">Immediate dispatch & triage response</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEmergencyModal(false);
                  setEmergencyStep('initial');
                }}
                className="p-2 hover:bg-[var(--color-surface-subtle)] rounded-xl transition-colors text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <X size={20} />
              </button>
            </div>

            {emergencyStep === 'initial' && (
              <div className="space-y-3">
                <button
                  onClick={() => setEmergencyStep('ambulance')}
                  className="w-full p-4 bg-[var(--color-surface-subtle)] hover:border-[var(--color-primary)] border border-[var(--color-line)] rounded-2xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2 bg-[var(--color-surface)] text-[var(--color-primary)] rounded-xl border border-[var(--color-line)]">
                      <Bed size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[var(--color-ink)]">Dispatch Ambulance</p>
                      <p className="text-xs text-[var(--color-muted)]">Paramedic unit dispatched to current GPS</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[var(--color-muted)]" />
                </button>

                <button
                  onClick={() => setEmergencyStep('booking')}
                  className="w-full p-4 bg-[var(--color-surface-subtle)] hover:border-[var(--color-primary)] border border-[var(--color-line)] rounded-2xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2 bg-[var(--color-surface)] text-[var(--color-primary)] rounded-xl border border-[var(--color-line)]">
                      <Video size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[var(--color-ink)]">Emergency Video Triage</p>
                      <p className="text-xs text-[var(--color-muted)]">Connect directly with an on-call physician</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[var(--color-muted)]" />
                </button>

                <a
                  href="https://wa.me/917032130919?text=EMERGENCY:%20I%20need%20immediate%20medical%20assistance."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-4 bg-[var(--color-surface-subtle)] hover:border-[var(--color-primary)] border border-[var(--color-line)] rounded-2xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2 bg-[var(--color-surface)] text-[var(--color-primary)] rounded-xl border border-[var(--color-line)]">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[var(--color-ink)]">Careline Coordinator</p>
                      <p className="text-xs text-[var(--color-muted)]">Direct coordinator line: 7032130919</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[var(--color-muted)]" />
                </a>
              </div>
            )}

            {emergencyStep === 'ambulance' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-muted)] block mb-1">
                    Confirm Pickup Location & Landmark:
                  </label>
                  <textarea
                    id="emergency-location"
                    placeholder="e.g. Near GMRIT Campus, Main Road, Rajam..."
                    className="w-full p-3 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-xl text-sm min-h-[90px] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEmergencyStep('initial')}
                    className="btn-outline flex-1 py-3 rounded-xl font-medium text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      const loc = (document.getElementById('emergency-location') as HTMLTextAreaElement)?.value;
                      requestEmergencyAmbulance(loc || 'Current Location');
                    }}
                    className="btn-primary flex-[2] py-3 rounded-xl font-medium text-xs shadow-sm"
                  >
                    Confirm Dispatch
                  </button>
                </div>
              </div>
            )}

            {emergencyStep === 'booking' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-muted)] block mb-1">
                    Describe Emergency Symptoms:
                  </label>
                  <textarea
                    id="emergency-symptoms"
                    placeholder="Briefly state symptoms for the on-call physician..."
                    className="w-full p-3 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-xl text-sm min-h-[90px] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEmergencyStep('initial')}
                    className="btn-outline flex-1 py-3 rounded-xl font-medium text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      const sym = (document.getElementById('emergency-symptoms') as HTMLTextAreaElement)?.value;
                      bookEmergencyConsultation(sym || 'Immediate medical attention required');
                    }}
                    className="btn-primary flex-[2] py-3 rounded-xl font-medium text-xs shadow-sm"
                  >
                    Connect With Physician
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && reschedulingApt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] text-[var(--color-ink)] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[var(--color-line)] animate-scaleIn space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--color-line)] pb-3">
              <h3 className="font-display font-semibold text-lg">Reschedule Consultation</h3>
              <button onClick={() => setShowRescheduleModal(false)} className="text-[var(--color-muted)] hover:text-[var(--color-ink)]">
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-muted)] block mb-1">Select New Date</label>
              <input type="date" id="reschedule-date" className="w-full p-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-xl text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-muted)] block mb-1">Select New Time</label>
              <input type="time" id="reschedule-time" className="w-full p-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-xl text-sm outline-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowRescheduleModal(false)} className="btn-outline flex-1 py-2.5 text-xs rounded-xl">Cancel</button>
              <button 
                onClick={() => {
                  const d = (document.getElementById('reschedule-date') as HTMLInputElement)?.value;
                  const t = (document.getElementById('reschedule-time') as HTMLInputElement)?.value;
                  if (d && t) handleReschedule(reschedulingApt, d, t);
                }} 
                className="btn-primary flex-1 py-2.5 text-xs rounded-xl"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {viewingAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] text-[var(--color-ink)] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[var(--color-line)] animate-scaleIn space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--color-line)] pb-3">
              <h3 className="font-display font-semibold text-lg">Consultation Details</h3>
              <button onClick={() => setViewingAppointment(null)} className="text-[var(--color-muted)] hover:text-[var(--color-ink)]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong className="text-[var(--color-muted)]">Specialist:</strong> {viewingAppointment.doctor.name}</p>
              <p><strong className="text-[var(--color-muted)]">Specialization:</strong> {viewingAppointment.doctor.specialization}</p>
              <p><strong className="text-[var(--color-muted)]">Date & Time:</strong> {viewingAppointment.appointment_date} at {viewingAppointment.appointment_time}</p>
              <p><strong className="text-[var(--color-muted)]">Type:</strong> {viewingAppointment.type || 'In-person'}</p>
              <p><strong className="text-[var(--color-muted)]">Status:</strong> <span className="capitalize">{viewingAppointment.status}</span></p>
              {viewingAppointment.notes && (
                <p><strong className="text-[var(--color-muted)]">Notes:</strong> {viewingAppointment.notes}</p>
              )}
            </div>
            <button onClick={() => setViewingAppointment(null)} className="btn-outline w-full py-2.5 text-xs rounded-xl mt-4">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Doctor Chat Drawer / Modal */}
      {chatOpen && selectedAppointment && (
        <Chat
          appointmentId={selectedAppointment}
          doctorName={doctorName || 'Specialist Physician'}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* AI Pre-Consultation Intake Modal */}
      {showIntakeModal && (
        <AIPreConsultationModal
          isOpen={showIntakeModal}
          onClose={() => setShowIntakeModal(false)}
          doctorName={intakeAppointment?.doctor.name || 'Specialist Physician'}
          specialty={intakeAppointment?.doctor.specialization || 'Clinical Outpatient'}
          appointmentId={intakeAppointment?.id || 'apt-intake-01'}
          onComplete={(_submission) => {
            alert('AI Pre-Visit Intake brief successfully compiled and linked to your appointment profile!');
            setShowIntakeModal(false);
          }}
        />
      )}

    </div>
  );
}
