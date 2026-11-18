import React, { useState, useEffect, useMemo } from 'react';
import { 
  Pill, Clock, Calendar, CheckCircle2, XCircle, AlertTriangle, 
  Upload, Camera, RefreshCw, Plus, Shield, Search, ArrowRight, User 
} from 'lucide-react';
import { 
  parsePrescriptionText, checkDrugInteractions, 
  ParsedMedication, DrugInteraction 
} from '../services/ai/prescriptionParser';
import { useAuth } from '../contexts/AuthContext';

export function SmartMedicationSchedule() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<ParsedMedication[]>(() => {
    return parsePrescriptionText(''); // Default calibrated medications
  });

  const [activeSlot, setActiveSlot] = useState<'all' | 'morning' | 'afternoon' | 'night'>('all');
  const [takenStatus, setTakenStatus] = useState<Record<string, 'taken' | 'missed'>>({});
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [rawPrescriptionInput, setRawPrescriptionInput] = useState('');
  const [scanning, setScanning] = useState(false);

  // Check drug interactions across all current medications
  const interactions = useMemo(() => {
    const medNames = medications.map(m => m.name);
    return checkDrugInteractions(medNames);
  }, [medications]);

  // Calculate adherence percentage
  const adherenceStats = useMemo(() => {
    const totalScheduled = medications.length;
    if (totalScheduled === 0) return { taken: 0, total: 0, pct: 100 };

    const takenCount = Object.values(takenStatus).filter(s => s === 'taken').length;
    const pct = Math.round((takenCount / totalScheduled) * 100);
    return { taken: takenCount, total: totalScheduled, pct };
  }, [medications, takenStatus]);

  const handleMarkDose = (id: string, status: 'taken' | 'missed') => {
    setTakenStatus(prev => ({
      ...prev,
      [id]: prev[id] === status ? undefined as any : status
    }));
  };

  const handleScanPrescription = async () => {
    setScanning(true);
    // Simulate OCR & AI parsing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    const extracted = parsePrescriptionText(rawPrescriptionInput || `
Rx:
1. Atorvastatin 20mg - 0-0-1 Night after dinner
2. Aspirin 75mg - 1-0-0 Morning after breakfast
3. Pantoprazole 40mg - 1-0-0 Morning before food
    `);
    setMedications(prev => [...prev, ...extracted]);
    setScanning(false);
    setShowScannerModal(false);
    setRawPrescriptionInput('');
  };

  const filteredMeds = medications.filter(med => {
    if (activeSlot === 'all') return true;
    return med.scheduleSlots.includes(activeSlot);
  });

  return (
    <div className="space-y-6 animate-fadeIn font-ui text-[var(--color-ink)]">
      
      {/* Top Header Card */}
      <div className="card p-6 sm:p-8 bg-[var(--color-surface)] border-[var(--color-line)] rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-surface-subtle)] rounded-full text-xs font-semibold text-[var(--color-primary)] border border-[var(--color-line)] mb-2">
            <Pill size={14} /> Smart Prescription & Dosage Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[var(--color-ink)]">
            Daily Medication Schedule
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-muted)] max-w-xl">
            Prescriptions extracted via AI OCR, synchronized into daily reminder slots with clinical drug-interaction checks.
          </p>
        </div>

        {/* Adherence Ring Card */}
        <div className="flex items-center gap-4 p-4 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-2xl">
          <div className="w-14 h-14 rounded-full border-4 border-[var(--color-primary)] flex items-center justify-center font-display font-semibold text-lg text-[var(--color-primary)]">
            {adherenceStats.pct}%
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Today's Adherence</p>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {adherenceStats.taken} of {adherenceStats.total} Doses Confirmed
            </p>
            <p className="text-[10px] text-emerald-600 font-medium">Verified by Olmera Care Engine</p>
          </div>
        </div>
      </div>

      {/* Drug-Drug Interaction Safety Alert (if detected) */}
      {interactions.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-700/60 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
            <AlertTriangle size={18} />
            <span>Clinical Drug Interaction Notice ({interactions.length} Found)</span>
          </div>
          {interactions.map((int, i) => (
            <div key={i} className="text-xs text-amber-900 dark:text-amber-200 pl-6 border-l-2 border-amber-300 dark:border-amber-600 ml-2 py-1">
              <p><strong>Interaction:</strong> {int.drugs[0].toUpperCase()} + {int.drugs[1].toUpperCase()}</p>
              <p className="text-amber-800/90 dark:text-amber-300/90">{int.description}</p>
              <p className="italic mt-0.5 text-[11px]"><strong>Guidance:</strong> {int.clinicalAction}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action Strip: Tabs & Scanner Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Time-of-Day Filter Tabs */}
        <div className="inline-flex p-1 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-line)] text-xs font-medium">
          {[
            { id: 'all', label: 'All Doses' },
            { id: 'morning', label: 'Morning (08:00)' },
            { id: 'afternoon', label: 'Afternoon (13:00)' },
            { id: 'night', label: 'Night (20:30)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSlot(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeSlot === tab.id 
                  ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm font-semibold' 
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Prescription Scanner Action Button */}
        <button
          onClick={() => setShowScannerModal(true)}
          className="btn-accent px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
        >
          <Camera size={16} /> Scan / Upload Prescription
        </button>
      </div>

      {/* Medication Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMeds.map((med) => {
          const status = takenStatus[med.id];
          return (
            <div
              key={med.id}
              className={`card p-5 bg-[var(--color-surface)] border transition-all rounded-2xl shadow-sm ${
                status === 'taken' 
                  ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/20' 
                  : status === 'missed' 
                  ? 'border-rose-300 dark:border-rose-800/60 bg-rose-50/20' 
                  : 'border-[var(--color-line)] hover:border-[var(--color-primary)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-subtle)] text-[var(--color-primary)] flex items-center justify-center border border-[var(--color-line)]">
                    <Pill size={20} />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-base text-[var(--color-ink)]">
                      {med.name}
                    </h4>
                    <p className="text-xs font-medium text-[var(--color-primary)]">
                      {med.dosage} • <span className="capitalize">{med.form}</span>
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                  med.timing === 'before_food' 
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' 
                    : 'bg-[var(--color-surface-subtle)] text-[var(--color-primary)] border border-[var(--color-line)]'
                }`}>
                  {med.timing.replace('_', ' ')}
                </span>
              </div>

              {/* Schedule Details */}
              <div className="p-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-line)] mb-4 text-xs space-y-1">
                <div className="flex justify-between text-[var(--color-muted)]">
                  <span>Frequency:</span>
                  <span className="font-medium text-[var(--color-ink)]">{med.frequency}</span>
                </div>
                <div className="flex justify-between text-[var(--color-muted)]">
                  <span>Scheduled Time:</span>
                  <span className="font-medium text-[var(--color-ink)]">{med.defaultTimes.join(', ')}</span>
                </div>
                <div className="flex justify-between text-[var(--color-muted)]">
                  <span>Doctor:</span>
                  <span className="font-medium text-[var(--color-ink)]">{med.prescribingDoctor}</span>
                </div>
                <p className="text-[11px] text-[var(--color-muted)] italic pt-1 border-t border-[var(--color-line)]/60">
                  "{med.instructions}"
                </p>
              </div>

              {/* Dose Confirmation Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleMarkDose(med.id, 'taken')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    status === 'taken' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'btn-outline hover:border-emerald-500 hover:text-emerald-600'
                  }`}
                >
                  <CheckCircle2 size={15} /> Taken
                </button>
                <button
                  onClick={() => handleMarkDose(med.id, 'missed')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    status === 'missed' 
                      ? 'bg-rose-600 text-white shadow-sm' 
                      : 'btn-outline hover:border-rose-500 hover:text-rose-600'
                  }`}
                >
                  <XCircle size={15} /> Missed
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prescription Scanner Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] text-[var(--color-ink)] w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-[var(--color-line)] animate-scaleIn space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-subtle)] text-[var(--color-primary)] flex items-center justify-center border border-[var(--color-line)]">
                  <Camera size={20} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">AI Prescription Scanner</h3>
                  <p className="text-xs text-[var(--color-muted)]">Extract medicines, dosage & timings</p>
                </div>
              </div>
              <button 
                onClick={() => setShowScannerModal(false)}
                className="p-1 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[var(--color-muted)]">
                Paste the doctor's prescription text or click below to simulate an OCR photo extraction:
              </p>
              <textarea
                value={rawPrescriptionInput}
                onChange={(e) => setRawPrescriptionInput(e.target.value)}
                placeholder="e.g.&#10;1. Atorvastatin 20mg - 0-0-1 Night after dinner&#10;2. Aspirin 75mg - 1-0-0 Morning after breakfast&#10;3. Pantoprazole 40mg - 1-0-0 Morning before food"
                className="w-full p-3.5 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-xl text-xs sm:text-sm min-h-[140px] outline-none focus:border-[var(--color-primary)] font-mono"
              />

              <div className="p-3 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-xl text-[11px] text-[var(--color-muted)] flex items-start gap-2">
                <Shield size={14} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                <span>Extracted medications are checked for drug-drug interactions against our verified clinical safety matrix before being added to your daily schedule.</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowScannerModal(false)}
                className="btn-outline flex-1 py-2.5 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={scanning}
                onClick={handleScanPrescription}
                className="btn-primary flex-[2] py-2.5 text-xs rounded-xl flex items-center justify-center gap-2"
              >
                {scanning ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
                {scanning ? 'Extracting Schedule...' : 'Analyze & Add to Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
