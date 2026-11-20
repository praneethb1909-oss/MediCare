/**
 * Olmera Healthcare - Pre-Visit Patient Intake Agent
 * 
 * Conducts structured patient intake prior to doctor consultations.
 * Evaluates emergency red flags and produces structured briefs for physicians.
 */

import { evaluateEmergency, EmergencyEvaluation } from './emergencyTriage';
import { SmartLLMRouter } from './routing';

export interface IntakeQuestion {
  id: string;
  question: {
    en: string;
    te: string;
    hi: string;
  };
  field: 'chief_complaint' | 'duration' | 'severity' | 'aggravating_factors' | 'current_meds' | 'allergies';
  type: 'text' | 'rating' | 'choice';
  options?: string[];
}

export interface PatientIntakeSubmission {
  appointmentId: string;
  patientName: string;
  timestamp: string;
  chiefComplaint: string;
  duration: string;
  severityRating: number;
  aggravatingFactors: string;
  currentMedications: string;
  knownAllergies: string;
  emergencyEvaluation: EmergencyEvaluation;
  structuredDoctorBrief: string;
}

export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    id: 'q1',
    field: 'chief_complaint',
    type: 'text',
    question: {
      en: 'What is the main health concern or symptom bringing you in today?',
      te: 'ఈ రోజు మీరు వైద్యుడిని సంప్రదించడానికి ప్రధాన కారణం లేదా లక్షణం ఏమిటి?',
      hi: 'आज डॉक्टर से परामर्श का मुख्य कारण या लक्षण क्या है?'
    }
  },
  {
    id: 'q2',
    field: 'duration',
    type: 'choice',
    options: ['Less than 24 hours', '2 - 3 days', '1 - 2 weeks', 'More than a month'],
    question: {
      en: 'How long have you been experiencing this symptom?',
      te: 'ఈ సమస్య ఎంత కాలంగా ఉంది?',
      hi: 'यह समस्या कितने समय से हो रही है?'
    }
  },
  {
    id: 'q3',
    field: 'severity',
    type: 'rating',
    question: {
      en: 'On a scale from 1 (mild) to 10 (unbearable), how severe is the discomfort right now?',
      te: '1 (తేలికపాటి) నుండి 10 (తీవ్రమైనది) స్కేల్ ఆధారంగా అసౌకర్య తీవ్రత ఎంత?',
      hi: '1 (हल्का) से 10 (असहनीय) के पैमाने पर, वर्तमान में तकलीफ का स्तर क्या है?'
    }
  },
  {
    id: 'q4',
    field: 'aggravating_factors',
    type: 'text',
    question: {
      en: 'Does anything make it better or worse (e.g. food, exertion, rest, posture)?',
      te: 'ఆహారం, శ్రమ, విశ్రాంతి లేదా భంగిమ వల్ల ఇది పెరుగుతుందా లేదా తగ్గుతుందా?',
      hi: 'क्या किसी चीज (जैसे भोजन, व्यायाम, आराम) से यह बढ़ता या घटता है?'
    }
  },
  {
    id: 'q5',
    field: 'current_meds',
    type: 'text',
    question: {
      en: 'Have you taken any medication or remedies for this issue so far?',
      te: 'ఈ సమస్య కోసం మీరు ఇంతవరకు ఏవైనా మందులు తీసుకున్నారా?',
      hi: 'क्या आपने इस समस्या के लिए अब तक कोई दवाई ली है?'
    }
  }
];

export function compileIntakeBrief(
  answers: Record<string, any>,
  patientName: string = 'Patient',
  appointmentId: string = 'apt-intake'
): PatientIntakeSubmission {
  const chief = answers.chief_complaint || 'General medical follow-up';
  const duration = answers.duration || 'Not specified';
  const severity = Number(answers.severity) || 3;
  const factors = answers.aggravating_factors || 'None reported';
  const meds = answers.current_meds || 'None';
  const allergies = answers.allergies || 'No new allergies reported';

  // Emergency safety verification
  const emergencyCheck = evaluateEmergency(`${chief} ${factors}`);

  const structuredDoctorBrief = `PRE-VISIT CLINICAL INTAKE BRIEF
Patient: ${patientName} | Date: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
Severity Score: ${severity}/10 ${severity >= 7 ? '(ALERT: Moderate-High Severity)' : '(Low-Moderate)'}

1. Chief Complaint:
   ${chief}

2. Symptom Chronology:
   Duration: ${duration}
   Modifying Factors: ${factors}

3. Pre-Consultation Interventions:
   Self-Medication / Remedies Taken: ${meds}
   Patient-Reported Allergies: ${allergies}

4. Emergency Red-Flag Triage:
   ${emergencyCheck.isEmergency ? `⚠️ URGENT RED FLAG DETECTED (${emergencyCheck.category?.toUpperCase()}): Immediate physician escalation advised.` : '✓ No acute life-threatening emergency flags detected during automated intake.'}
`;

  return {
    appointmentId,
    patientName,
    timestamp: new Date().toISOString(),
    chiefComplaint: chief,
    duration,
    severityRating: severity,
    aggravatingFactors: factors,
    currentMedications: meds,
    knownAllergies: allergies,
    emergencyEvaluation: emergencyCheck,
    structuredDoctorBrief
  };
}

/**
 * Intelligent Physician Brief Synthesis using NVIDIA NIM Multi-Model Router
 */
export async function compileIntakeBriefWithLLM(
  answers: Record<string, any>,
  patientName: string = 'Patient',
  appointmentId: string = 'apt-intake',
  doctorName?: string,
  specialty?: string
): Promise<PatientIntakeSubmission> {
  const baseSubmission = compileIntakeBrief(answers, patientName, appointmentId);

  try {
    const router = SmartLLMRouter.getInstance();
    const prompt = `Synthesize this patient intake for attending specialist Dr. ${doctorName || 'Practitioner'} (${specialty || 'General Medicine'}):
Patient: ${patientName}
Chief Complaint: ${baseSubmission.chiefComplaint}
Duration: ${baseSubmission.duration}
Severity Score: ${baseSubmission.severityRating}/10
Aggravating Factors: ${baseSubmission.aggravatingFactors}
Current Medications / Interventions: ${baseSubmission.currentMedications}
Allergies: ${baseSubmission.knownAllergies}
Emergency Flag: ${baseSubmission.emergencyEvaluation.isEmergency ? 'YES - High Risk' : 'None detected'}

Generate a structured physician pre-consultation brief with:
1. Executive Clinical Summary
2. Timeline & Provoking Factors
3. Preliminary Diagnostic Considerations (Differential)
4. Recommended Examination & Lab Focus Points
Format in concise, bulleted clinical presentation format.`;

    const res = await router.completePrompt({
      prompt,
      systemInstruction: 'You are an Olmera AI Clinical Intake Specialist assisting an outpatient physician.',
      temperature: 0.5,
      maxTokens: 1024,
      taskType: 'clinical_summary'
    });

    if (res.content.trim().length > 50) {
      baseSubmission.structuredDoctorBrief = res.content;
    }
  } catch (err) {
    console.warn('AI intake brief synthesis fallback:', err);
  }

  return baseSubmission;
}
