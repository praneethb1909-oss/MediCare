import React, { useState } from 'react';
import { 
  Bot, AlertTriangle, CheckCircle2, ChevronRight, ArrowLeft, 
  Sparkles, Shield, User, X, FileText, Send, Phone 
} from 'lucide-react';
import { 
  INTAKE_QUESTIONS, compileIntakeBrief, compileIntakeBriefWithLLM,
  PatientIntakeSubmission 
} from '../services/ai/intakeAgent';
import { useAuth } from '../contexts/AuthContext';

interface AIPreConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName?: string;
  specialty?: string;
  appointmentId?: string;
  onComplete?: (submission: PatientIntakeSubmission) => void;
}

export function AIPreConsultationModal({
  isOpen,
  onClose,
  doctorName = 'Specialist Physician',
  specialty = 'Clinical Outpatient',
  appointmentId = 'apt-intake-01',
  onComplete
}: AIPreConsultationModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({
    severity: 4
  });
  const [completedBrief, setCompletedBrief] = useState<PatientIntakeSubmission | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  if (!isOpen) return null;

  const currentQ = INTAKE_QUESTIONS[currentStep];

  const handleNext = async () => {
    if (currentStep < INTAKE_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsCompiling(true);
      try {
        // Compile brief with NVIDIA AI Synthesis
        const submission = await compileIntakeBriefWithLLM(
          answers,
          user?.displayName || 'Valued Patient',
          appointmentId,
          doctorName,
          specialty
        );
        setCompletedBrief(submission);
        if (onComplete) onComplete(submission);
      } finally {
        setIsCompiling(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 font-ui">
      <div className="bg-[var(--color-surface)] text-[var(--color-ink)] w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-[var(--color-line)] animate-scaleIn space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-surface-subtle)] text-[var(--color-primary)] flex items-center justify-center border border-[var(--color-line)]">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">AI Pre-Visit Intake Agent</h3>
              <p className="text-xs text-[var(--color-muted)]">
                Preparing clinical summary for {doctorName} ({specialty})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-ink)] rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Completed Brief View */}
        {completedBrief ? (
          <div className="space-y-4 animate-fadeIn">
            {completedBrief.emergencyEvaluation.isEmergency ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 rounded-2xl space-y-2 text-rose-900 dark:text-rose-200">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-600 dark:text-rose-400">
                  <AlertTriangle size={18} />
                  <span>URGENT CLINICAL WARNING DETECTED</span>
                </div>
                <p className="text-xs leading-relaxed">
                  {completedBrief.emergencyEvaluation.guidanceText.en}
                </p>
                <div className="flex gap-2 pt-1">
                  <a href="tel:108" className="btn-accent py-2 px-4 text-xs font-bold rounded-xl flex items-center gap-2">
                    <Phone size={14} /> Call 108 Emergency
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs">
                <CheckCircle2 size={20} className="flex-shrink-0" />
                <span>Intake successfully compiled. Your attending specialist will review this structured brief prior to consultation.</span>
              </div>
            )}

            <div className="p-4 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-muted)]">
                <span>Summary Generated for Doctor:</span>
                <span className="font-mono text-[10px]">Severity: {completedBrief.severityRating}/10</span>
              </div>
              <pre className="text-xs font-mono text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                {completedBrief.structuredDoctorBrief}
              </pre>
            </div>

            <button
              onClick={onClose}
              className="btn-primary w-full py-3 rounded-xl text-xs font-semibold"
            >
              Done & Return to Appointments
            </button>
          </div>
        ) : (
          /* Step-by-step Intake Questions */
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[var(--color-muted)]">
                <span>Question {currentStep + 1} of {INTAKE_QUESTIONS.length}</span>
                <span className="font-medium">{Math.round(((currentStep + 1) / INTAKE_QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--color-line)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--color-primary)] transition-all duration-300 rounded-full"
                  style={{ width: `${((currentStep + 1) / INTAKE_QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <h4 className="font-display font-semibold text-base sm:text-lg text-[var(--color-ink)]">
                {currentQ.question.en}
              </h4>
              <p className="text-xs text-[var(--color-muted)] italic">
                {currentQ.question.te}
              </p>
            </div>

            {/* Input by type */}
            <div>
              {currentQ.type === 'text' && (
                <textarea
                  value={answers[currentQ.field] || ''}
                  onChange={(e) => setAnswers({ ...answers, [currentQ.field]: e.target.value })}
                  placeholder="Type your response here..."
                  className="w-full p-3.5 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-2xl text-xs sm:text-sm outline-none focus:border-[var(--color-primary)] min-h-[90px]"
                />
              )}

              {currentQ.type === 'choice' && currentQ.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentQ.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [currentQ.field]: opt })}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                        answers[currentQ.field] === opt
                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                          : 'bg-[var(--color-surface-subtle)] border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-primary)]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {currentQ.type === 'rating' && (
                <div className="space-y-3 p-4 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-2xl">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-[var(--color-muted)]">Mild (1)</span>
                    <span className="text-base font-display font-semibold text-[var(--color-primary)]">
                      Level {answers.severity || 4} / 10
                    </span>
                    <span className="text-rose-600">Severe (10)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={answers.severity || 4}
                    onChange={(e) => setAnswers({ ...answers, severity: Number(e.target.value) })}
                    className="w-full accent-[var(--color-primary)] cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                className="btn-outline px-4 py-2.5 text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-40"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="btn-primary px-6 py-2.5 text-xs rounded-xl flex items-center gap-2"
              >
                {currentStep === INTAKE_QUESTIONS.length - 1 ? 'Compile Brief' : 'Next Question'}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
