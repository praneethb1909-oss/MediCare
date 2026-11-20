/**
 * Olmera Healthcare - AI Patient History Summarizer & Documentation Assistant
 * 
 * Safety Rule: Every important statement must link to its original medical record.
 * All clinical documentation must be reviewed and approved by the doctor.
 */

import { SmartLLMRouter } from './routing';

export interface SourceCitation {
  recordId: string;
  recordTitle: string;
  recordDate: string;
  sourceType: 'lab_report' | 'prescription' | 'vitals_log' | 'intake_form';
}

export interface PatientHistorySummary {
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  uhid: string;
  generatedAt: string;
  primaryConditions: string[];
  allergies: string[];
  activeMedications: {
    name: string;
    dosage: string;
    adherencePct: number;
    prescribedBy: string;
  }[];
  recentAbnormalBiomarkers: {
    testName: string;
    value: string;
    reference: string;
    status: 'high' | 'low' | 'critical';
    citation: SourceCitation;
  }[];
  latestVitals: {
    bloodPressure: string;
    pulseBpm: number;
    bloodGlucose: string;
    weightKg: number;
    recordedAt: string;
  };
  chronologicalTimeline: {
    date: string;
    event: string;
    type: 'consultation' | 'lab_report' | 'prescription' | 'vitals';
    provider: string;
    citation: SourceCitation;
  }[];
  aiClinicalImpression: string;
  suggestedFocusAreas: string[];
}

export interface ClinicalDocumentDraft {
  documentType: 'referral_letter' | 'fitness_certificate' | 'discharge_summary' | 'patient_instruction';
  patientName: string;
  patientUhid: string;
  doctorName: string;
  hospitalName: string;
  date: string;
  subject: string;
  content: string;
  isApprovedByDoctor: boolean;
  approvedAt?: string;
  doctorSignatureStamp?: string;
}

export function generatePatientPreConsultSummary(
  patientData: any,
  prescriptions: any[] = [],
  reports: any[] = [],
  vitals: any = null
): PatientHistorySummary {
  const patientId: string = patientData?.id || '';
  const patientName = patientData?.full_name || 'Patient';
  const uhid = patientId ? `OL-${patientId.slice(0, 8).toUpperCase()}` : '';

  return {
    patientId,
    patientName: patientName,
    age: patientData?.age ?? 0,
    gender: patientData?.gender || 'Not specified',
    uhid: uhid,
    generatedAt: new Date().toISOString(),
    primaryConditions: patientData?.conditions || [],
    allergies: patientData?.allergies || [],
    activeMedications: prescriptions.map(p => ({
      name: p.medications || '',
      dosage: p.dosage || '',
      adherencePct: p.adherence_pct ?? 0,
      prescribedBy: p.doctor_name || ''
    })),
    recentAbnormalBiomarkers: [],
    latestVitals: {
      bloodPressure: vitals?.blood_pressure || '',
      pulseBpm: vitals?.pulse ?? 0,
      bloodGlucose: vitals?.glucose || '',
      weightKg: vitals?.weight ?? 0,
      recordedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    },
    chronologicalTimeline: [],
    aiClinicalImpression: patientData?.ai_clinical_impression || '',
    suggestedFocusAreas: patientData?.suggested_focus_areas || []
  };
}

/**
 * AI Documentation Assistant Generator with Strict Human Approval Guardrails
 */
export function generateClinicalDocumentDraft(
  type: ClinicalDocumentDraft['documentType'],
  patientName: string,
  doctorName: string,
  hospitalName: string,
  clinicalNotes: string
): ClinicalDocumentDraft {
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const uhid = `OL-${Math.floor(100000 + Math.random() * 900000)}`;

  let subject = '';
  let content = '';

  switch (type) {
    case 'referral_letter':
      subject = `Clinical Referral Letter: ${patientName} (UHID: ${uhid})`;
      content = `To: The Attending Consultant / Specialist Department
From: ${doctorName}, ${hospitalName}
Date: ${dateStr}

Re: Clinical Referral of ${patientName} (UHID: ${uhid})

Dear Colleague,

I am referring the above patient for your specialized clinical evaluation and management regarding:

${clinicalNotes || 'Please refer to the attached clinical records for the complete case details.'}

Kindly examine and share your expert recommendations for further therapeutic continuity.

Sincerely,
${doctorName}
Clinical Specialist, ${hospitalName}`;
      break;

    case 'fitness_certificate':
      subject = `Medical Fitness Certificate: ${patientName}`;
      content = `MEDICAL FITNESS CERTIFICATE
${hospitalName} — Clinical Outpatient Services
Date: ${dateStr}

This is to certify that I have conducted a clinical examination of:
Patient: ${patientName}
UHID: ${uhid}
Date of Examination: ${dateStr}

Clinical Observations:
${clinicalNotes || 'Clinical examination findings to be recorded by the attending physician.'}

Conclusion:
In my clinical assessment, the individual is medically fit to resume standard occupational and physical duties.

Attending Physician:
${doctorName}
${hospitalName}`;
      break;

    case 'discharge_summary':
      subject = `Clinical Discharge Summary: ${patientName}`;
      content = `CLINICAL DISCHARGE INSTRUCTIONS
${hospitalName}
Patient: ${patientName} | UHID: ${uhid}
Discharge Date: ${dateStr}

Primary Diagnosis:
${clinicalNotes || 'Refer to the inpatient case sheet for the recorded diagnosis.'}

Medications on Discharge:
Refer to the issued discharge prescription for the complete medication regimen.

Lifestyle & Care Instructions:
- Maintain adequate daily hydration.
- Follow the nutritional routine advised by your care team.
- Engage in regular moderate physical activity as tolerated.

Follow-Up Schedule:
- Return for follow-up clinical review as advised by the treating doctor.
- In case of emergency, contact emergency services or visit the nearest hospital immediately.

Treating Doctor:
${doctorName}
${hospitalName}`;
      break;

    case 'patient_instruction':
      subject = `Prescribed Home Care Guidelines: ${patientName}`;
      content = `PATIENT CARE INSTRUCTIONS
From: ${doctorName} (${hospitalName})
Date: ${dateStr}

Dear ${patientName},

Please follow these individualized care instructions:
${clinicalNotes || 'Follow the prescribed medication schedule and contact your care team with any concerns.'}

Notice: These instructions complement your consultation. For questions, connect with your Care Concierge via your patient portal.`;
      break;
  }

  return {
    documentType: type,
    patientName,
    patientUhid: uhid,
    doctorName,
    hospitalName,
    date: dateStr,
    subject,
    content,
    isApprovedByDoctor: false
  };
}

export const generateClinicalDocument = generateClinicalDocumentDraft;

/**
 * Intelligent Clinical Document Drafting using NVIDIA NIM Multi-Model Router
 */
export async function generateClinicalDocumentWithLLM(
  type: ClinicalDocumentDraft['documentType'],
  patientName: string,
  doctorName: string,
  hospitalName: string,
  clinicalNotes: string
): Promise<ClinicalDocumentDraft> {
  const baseDraft = generateClinicalDocumentDraft(type, patientName, doctorName, hospitalName, clinicalNotes);
  
  try {
    const router = SmartLLMRouter.getInstance();
    const prompt = `Draft a formal medical ${type.replace(/_/g, ' ')} for:
Patient: ${patientName}
Attending Physician: ${doctorName}
Hospital / Node: ${hospitalName}
Clinical Case Notes: ${clinicalNotes || 'Ambulatory outpatient evaluation and ongoing therapy.'}

Requirements:
- Professional medical terminology
- Clear clinical indications and history
- Strict patient safety & physician approval footer
Output only the drafted document content.`;

    const res = await router.completePrompt({
      prompt,
      systemInstruction: 'You are an Olmera AI Clinical Documentation Assistant. Generate professional, accredited clinical letters and certificates.',
      temperature: 0.5,
      maxTokens: 1024,
      taskType: 'clinical_summary'
    });

    if (res.content.trim().length > 50) {
      baseDraft.content = res.content;
    }
  } catch (err) {
    console.warn('AI document draft generation fallback:', err);
  }

  return baseDraft;
}
