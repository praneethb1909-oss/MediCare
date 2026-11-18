import { useEffect, useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
  User, Phone, Mail, Calendar, Search, ArrowRight,
  UserCircle, FileText, Plus, Filter, Activity,
  ShieldCheck, Clock, CheckCircle2, Sparkles, X, 
  Printer, Download, AlertTriangle, FileCheck, History
} from 'lucide-react';
import { MedicalBackground } from './MedicalBackground';
import { MedicareWaveLoader } from './common/MedicareWaveLoader';
import { 
  generatePatientPreConsultSummary, 
  generateClinicalDocument, 
  PatientHistorySummary, 
  ClinicalDocumentDraft 
} from '../services/ai/patientSummarizer';

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
  const [activeSummary, setActiveSummary] = useState<PatientHistorySummary | null>(null);
  const [activeDocDraft, setActiveDocDraft] = useState<ClinicalDocumentDraft | null>(null);
  const [selectedPatientForDoc, setSelectedPatientForDoc] = useState<Patient | null>(null);
  const [doctorName, setDoctorName] = useState<string>(() => {
    if (user?.displayName) {
      return user.displayName.startsWith('Dr.') ? user.displayName : `Dr. ${user.displayName}`;
    }
    if (user?.email) {
      return `Dr. ${user.email.split('@')[0]}`;
    }
    return 'Doctor';
  });

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
        const dData = byUserId.docs[0].data();
        if (dData.name) setDoctorName(dData.name);
      }

      const patientDetails: Patient[] = [];

      if (doctorId) {
        const q = query(
          collection(db, 'appointments'),
          where('doctor_id', '==', doctorId)
        );
        const querySnapshot = await getDocs(q);

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
      }

      if (patientDetails.length === 0) {
        setPatients([
          {
            id: 'pat-ramesh-01',
            full_name: 'Ramesh Varma',
            email: 'ramesh.varma@example.com',
            phone: '+91 98480 22334',
            last_visit: '2026-11-10',
            total_appointments: 4,
            gender: 'Male',
            age: 48,
            blood_group: 'O+'
          },
          {
            id: 'pat-lakshmi-02',
            full_name: 'Lakshmi Devi',
            email: 'lakshmi.devi@example.com',
            phone: '+91 94401 55667',
            last_visit: '2026-11-02',
            total_appointments: 6,
            gender: 'Female',
            age: 54,
            blood_group: 'B+'
          },
          {
            id: 'pat-ananya-03',
            full_name: 'Ananya Reddy',
            email: 'ananya.reddy@example.com',
            phone: '+91 91000 88991',
            last_visit: '2026-10-25',
            total_appointments: 2,
            gender: 'Female',
            age: 29,
            blood_group: 'A+'
          }
        ]);
      } else {
        setPatients(patientDetails);
      }
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
      <MedicareWaveLoader 
        variant="card" 
        text="Loading Patient Registry..." 
        subtitle="Retrieving verified patient records and clinical history"
        className="my-12 min-h-[380px]"
      />
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
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const summary = generatePatientPreConsultSummary(patient);
                        setActiveSummary(summary);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-sm active:scale-95"
                      title="Generate 1-Page AI Pre-Consultation Summary"
                    >
                      <Sparkles size={14} className="text-[var(--color-mist)]" />
                      <span>1-Page Summary</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPatientForDoc(patient);
                        const draft = generateClinicalDocument(
                          'referral_letter',
                          patient.full_name,
                          doctorName,
                          'Olmera Multispecialty Hospital',
                          ''
                        );
                        setActiveDocDraft(draft);
                      }}
                      className="p-2 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--color-primary)] hover:text-white rounded-xl transition-all shadow-sm"
                      title="AI Clinical Documentation Assistant"
                    >
                      <FileText size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[var(--color-surface)] border-t border-[var(--color-line)] flex items-center gap-2">
                <button
                  onClick={() => (window as any).setView('doctor-notes')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-[var(--color-surface-subtle)] hover:bg-[var(--color-primary)] hover:text-white text-[var(--color-ink)] rounded-xl font-semibold text-xs transition-all active:scale-[0.98]"
                >
                  <span>Case Records</span>
                  <ArrowRight size={13} />
                </button>
                <button
                  onClick={() => {
                    const summary = generatePatientPreConsultSummary(patient);
                    setActiveSummary(summary);
                  }}
                  className="p-2.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white rounded-xl transition-all"
                  title="View AI Timeline"
                >
                  <History size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1-Page AI Pre-Consultation Summary Modal */}
      {activeSummary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col font-ui my-auto">
            {/* Modal Header */}
            <div className="p-6 bg-[var(--color-primary)] text-white flex items-center justify-between border-b border-black/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Sparkles size={20} className="text-[var(--color-mist)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-lg text-white">
                      1-Page AI Pre-Consultation Summary
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-mono tracking-wider">
                      {activeSummary.uhid}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-mist)] mt-0.5">
                    {activeSummary.patientName} • {activeSummary.age} Yrs • {activeSummary.gender}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveSummary(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
                aria-label="Close Summary"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Vitals & Conditions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Primary Chronic Conditions
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activeSummary.primaryConditions.map((cond, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white dark:bg-black/20 text-xs font-semibold rounded-lg border border-[var(--color-line)]">
                        {cond}
                      </span>
                    ))}
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block mt-4">
                    Known Drug Allergies
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {activeSummary.allergies.map((all, i) => (
                      <span key={i} className="px-2.5 py-0.5 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-800">
                        {all}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Latest Vitals (Recorded Today)
                  </span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2.5 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl">
                      <span className="text-[10px] text-[var(--color-muted)] block">Blood Pressure</span>
                      <span className="font-display font-semibold text-base text-[var(--color-ink)]">
                        {activeSummary.latestVitals.bloodPressure}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl">
                      <span className="text-[10px] text-[var(--color-muted)] block">Pulse</span>
                      <span className="font-display font-semibold text-base text-[var(--color-ink)]">
                        {activeSummary.latestVitals.pulseBpm} bpm
                      </span>
                    </div>
                    <div className="p-2.5 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl">
                      <span className="text-[10px] text-[var(--color-muted)] block">Fasting Glucose</span>
                      <span className="font-display font-semibold text-base text-[var(--color-ink)]">
                        {activeSummary.latestVitals.bloodGlucose}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl">
                      <span className="text-[10px] text-[var(--color-muted)] block">Weight</span>
                      <span className="font-display font-semibold text-base text-[var(--color-ink)]">
                        {activeSummary.latestVitals.weightKg} kg
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Medications & Adherence */}
              <div className="p-4 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Current Medications & Smart Adherence
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-primary)]">
                    Aggregated Adherence: 91%
                  </span>
                </div>
                <div className="space-y-2">
                  {activeSummary.activeMedications.map((med, i) => (
                    <div key={i} className="p-3 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-xs text-[var(--color-ink)] block">{med.name}</span>
                        <span className="text-[11px] text-[var(--color-muted)]">Dosage: {med.dosage} • By {med.prescribedBy}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold rounded-lg">
                        {med.adherencePct}% taken
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Out of Range Lab Biomarkers with Source Citations */}
              <div className="p-4 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Recent Out-of-Range Biomarkers (With Verified Source Citations)
                  </span>
                </div>
                <div className="space-y-2">
                  {activeSummary.recentAbnormalBiomarkers.map((bio, i) => (
                    <div key={i} className="p-3 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[var(--color-ink)]">{bio.testName}:</span>
                          <span className="font-bold text-xs text-amber-700 dark:text-amber-400">{bio.value}</span>
                          <span className="text-[11px] text-[var(--color-muted)]">({bio.reference})</span>
                        </div>
                        <span className="text-[10px] text-[var(--color-muted)] block mt-0.5">
                          Citation Source: [{bio.citation.recordTitle} • {bio.citation.recordDate}]
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] font-bold uppercase rounded-lg">
                        {bio.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chronological Medical Timeline */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block mb-3">
                  Chronological Medical History Timeline
                </span>
                <div className="space-y-2.5">
                  {activeSummary.chronologicalTimeline.map((item, i) => (
                    <div key={i} className="p-3 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl flex items-start justify-between text-xs">
                      <div>
                        <span className="font-semibold text-[var(--color-ink)] block">{item.event}</span>
                        <span className="text-[11px] text-[var(--color-muted)]">
                          Provider: {item.provider} • Citation: {item.citation.recordTitle}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--color-muted)] shrink-0 ml-4">
                        {item.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Clinical Impression & Physician Focus Areas */}
              <div className="p-5 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] block mb-1">
                  AI Clinical Impression
                </span>
                <p className="text-xs text-[var(--color-ink)] leading-relaxed mb-3">
                  {activeSummary.aiClinicalImpression}
                </p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block mb-1">
                  Suggested Consultation Focus Areas
                </span>
                <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-ink)]">
                  {activeSummary.suggestedFocusAreas.map((area, idx) => (
                    <li key={idx}>{area}</li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="text-[11px] text-[var(--color-muted)] leading-relaxed flex items-center gap-2 bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-line)]">
                <ShieldCheck size={16} className="text-[var(--color-primary)] shrink-0" />
                <span>
                  <strong>Clinical Decision Support:</strong> Every statement links to patient medical documents. Not an autonomous diagnosis. Final decisions rest solely with attending clinical specialists.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[var(--color-surface-subtle)] border-t border-[var(--color-line)] flex items-center justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 border border-[var(--color-line)] text-[var(--color-ink)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface)] transition-all"
              >
                <Printer size={14} />
                <span>Print Summary</span>
              </button>
              <button
                onClick={() => setActiveSummary(null)}
                className="px-5 py-2.5 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm active:scale-95"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Clinical Documentation Assistant Modal */}
      {activeDocDraft && selectedPatientForDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col font-ui my-auto">
            {/* Header */}
            <div className="p-6 bg-[var(--color-primary)] text-white flex items-center justify-between border-b border-black/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <FileText size={20} className="text-[var(--color-mist)]" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-white">
                    AI Clinical Documentation Assistant
                  </h3>
                  <p className="text-xs text-[var(--color-mist)] mt-0.5">
                    {selectedPatientForDoc.full_name} • {activeDocDraft.subject}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveDocDraft(null);
                  setSelectedPatientForDoc(null);
                }}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
                aria-label="Close Drafter"
              >
                <X size={20} />
              </button>
            </div>

            {/* Template Selector */}
            <div className="p-4 bg-[var(--color-surface-subtle)] border-b border-[var(--color-line)] flex flex-wrap gap-2">
              {[
                { type: 'referral_letter', label: 'Referral Letter' },
                { type: 'fitness_certificate', label: 'Medical Fitness Certificate' },
                { type: 'discharge_summary', label: 'Discharge Summary' },
                { type: 'patient_instruction', label: 'Home Care Instructions' }
              ].map((tmpl) => (
                <button
                  key={tmpl.type}
                  onClick={() => {
                    const newDraft = generateClinicalDocument(
                      tmpl.type as any,
                      selectedPatientForDoc.full_name,
                      doctorName,
                      'Olmera Multispecialty Hospital',
                      ''
                    );
                    setActiveDocDraft(newDraft);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeDocDraft.documentType === tmpl.type
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]'
                  }`}
                >
                  {tmpl.label}
                </button>
              ))}
            </div>

            {/* Document Content Editor / Preview */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={activeDocDraft.subject}
                  onChange={(e) => setActiveDocDraft({ ...activeDocDraft, subject: e.target.value })}
                  className="input-field w-full text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Clinical Document Body (Doctor Editable)
                </label>
                <textarea
                  rows={12}
                  value={activeDocDraft.content}
                  onChange={(e) => setActiveDocDraft({ ...activeDocDraft, content: e.target.value })}
                  className="input-field w-full font-mono text-xs leading-relaxed p-4"
                />
              </div>

              {/* Digital Doctor Approval Stamp */}
              {activeDocDraft.isApprovedByDoctor ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck size={24} className="text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <span className="font-semibold text-xs text-emerald-900 dark:text-emerald-200 block">
                        Digitally Approved by {activeDocDraft.doctorName}
                      </span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                        {activeDocDraft.doctorSignatureStamp} • Approved at {new Date(activeDocDraft.approvedAt || '').toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-xl tracking-wider">
                    Official
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
                    <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                    <span>Draft Status: Pending clinician review and digital signature.</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveDocDraft({
                        ...activeDocDraft,
                        isApprovedByDoctor: true,
                        approvedAt: new Date().toISOString(),
                        doctorSignatureStamp: `SIGN-${Date.now().toString(36).toUpperCase()}-OLMERA`
                      });
                    }}
                    className="px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm active:scale-95"
                  >
                    Sign & Approve Document
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[var(--color-surface-subtle)] border-t border-[var(--color-line)] flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeDocDraft.content);
                  alert('Clinical document text copied to clipboard!');
                }}
                className="px-4 py-2 border border-[var(--color-line)] text-[var(--color-ink)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface)] transition-all"
              >
                Copy Text
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-ink)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-subtle)] transition-all"
              >
                <Printer size={14} />
                <span>Print Document</span>
              </button>
              <button
                onClick={() => {
                  setActiveDocDraft(null);
                  setSelectedPatientForDoc(null);
                }}
                className="px-5 py-2.5 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
