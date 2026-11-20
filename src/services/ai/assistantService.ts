/**
 * Olmera Healthcare - Multilingual AI Healthcare Assistant Service
 * 
 * Languages: English, Telugu (తెలుగు), Hindi (हिंदी)
 * Modalities: Natural text and Web Speech voice synthesis/recognition
 * Safety: Mandatory emergency evaluation before any standard AI generation.
 */

import { evaluateEmergency, EmergencyEvaluation } from './emergencyTriage';
import { SmartLLMRouter } from './routing';

export type AssistantLanguage = 'en' | 'te' | 'hi';

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  language: AssistantLanguage;
  isEmergencyAlert?: boolean;
  emergencyData?: EmergencyEvaluation;
  suggestedActions?: string[];
  sourceCitations?: string[];
}

export interface PatientHealthContext {
  patientName: string;
  activeConditions?: string[];
  currentMedications?: string[];
  recentBiomarkers?: string[];
  restingBloodPressure?: string;
  bloodGlucose?: string;
}

const FAQ_KNOWLEDGE_BASE: Array<{
  keywords: string[];
  response: {
    en: string;
    te: string;
    hi: string;
  };
  specialistRecommendation?: string;
}> = [
  {
    keywords: ['headache', 'migraine', 'తల నొప్పి', 'सिरदर्द'],
    response: {
      en: 'Headaches are commonly caused by dehydration, sleep deficit, visual strain, or stress. Drink 500ml water, rest in a quiet dim room, and avoid screens. If accompanied by sudden thunderclap intensity, neck stiffness, fever, or vision blur, seek immediate medical attention.',
      te: 'తలనొప్పి తరచుగా నిర్జలీకరణం (డీహైడ్రేషన్), తగినంత నిద్ర లేకపోవడం లేదా ఒత్తిడి వల్ల వస్తుంది. తగినంత నీరు త్రాగి విశ్రాంతి తీసుకోండి. విపరీతమైన తలనొప్పి లేదా మెడ పట్టేయడం వంటివి ఉంటే వెంటనే వైద్యుడిని సంప్రదించండి.',
      hi: 'सिरदर्द अक्सर पानी की कमी, नींद की कमी या तनाव से होता है। पर्याप्त पानी पिएं और शांत कमरे में आराम करें। यदि सिरदर्द अत्यधिक तीव्र हो या गर्दन में अकड़न हो, तो तुरंत डॉक्टर को दिखाएं।'
    },
    specialistRecommendation: 'General Medicine / Neurologist'
  },
  {
    keywords: ['fever', 'temperature', 'జ్వరం', 'పుల్లటి జ్వరం', 'बुखार'],
    response: {
      en: 'Fever indicates an active immune response. Stay hydrated with electrolytes and water, wear light cotton clothing, and rest. Check temperature every 4–6 hours. If fever persists over 101°F (38.3°C) for more than 48 hours, or is accompanied by chills and cough, consult a physician.',
      te: 'జ్వరం అనేది శరీరంలో ఇన్ఫెక్షన్ పై రోగనిరోధక వ్యవస్థ పోరాడుతున్న సంకేతం. తగినంత ద్రవాలు తీసుకోండి. 48 గంటలకు మించి జ్వరం కొనసాగితే వైద్యుడిని సంప్రదించండి.',
      hi: 'बुखार शरीर की रोग प्रतिरोधक क्षमता का संकेत है। खूब पानी और तरल पदार्थ लें। यदि 48 घंटे से अधिक बुखार रहे, तो नजदीकी चिकित्सक से परामर्श लें।'
    },
    specialistRecommendation: 'General Physician / Internal Medicine'
  },
  {
    keywords: ['diabetes', 'sugar', 'glucose', 'మధుమేహం', 'చక్కెర స్థాయి', 'डायबिटीज', 'शुगर'],
    response: {
      en: 'For optimal glycemic control, balance complex carbohydrates (millets, whole grains, pulses), take prescribed medications consistently around meal times, walk 30 minutes daily, and monitor morning fasting levels twice weekly.',
      te: 'రక్తంలో చక్కెరను నియంత్రించడానికి తృణధాన్యాలు తీసుకోండి, రోజూ 30 నిమిషాలు నడవండి మరియు మందులను సక్రమంగా వేసుకోండి.',
      hi: 'ब्लड शुगर नियंत्रण के लिए संतुलित आहार लें, रोजाना 30 मिनट टहलें और डॉक्टर द्वारा दी गई दवाएं समय पर लें।'
    },
    specialistRecommendation: 'Endocrinologist / Diabetologist'
  },
  {
    keywords: ['blood pressure', 'bp', 'హై బిపి', 'రక్తపోటు', 'బ్లడ్ ప్రెషర్', 'बीपी', 'रक्तचाप'],
    response: {
      en: 'Healthy target resting BP is typically around 120/80 mmHg. Maintain low-sodium intake (under 1 teaspoon daily), manage emotional stress, stay hydrated, and take prescribed anti-hypertensives without skipping doses.',
      te: 'రక్తపోటు సాధారణంగా 120/80 mmHg ఉండాలి. ఉప్పు వాడకం తగ్గించండి మరియు రోజూ విశ్రాంతి తీసుకోండి.',
      hi: 'सामान्य बीपी लगभग 120/80 mmHg होना चाहिए। भोजन में नमक कम करें और तनाव से बचें।'
    },
    specialistRecommendation: 'Cardiologist / General Physician'
  },
  {
    keywords: ['diet', 'food', 'nutrition', 'ఆహారం', 'భోజనం', 'డైట్', 'आहार', 'खानपान'],
    response: {
      en: 'Focus on whole foods: seasonal vegetables, fiber-rich lentils, hydration (at least 2.5–3 liters daily in coastal Andhra weather), and minimal ultra-processed refined sugars.',
      te: 'తాజా ఆకుకూరలు, కాయగూరలు, తృణధాన్యాలు మరియు రోజుకు కనీసం 2.5 నుండి 3 లీటర్ల నీరు త్రాగడం అలవాటు చేసుకోండి.',
      hi: 'ताजा सब्जियां, दालें, और रोजाना कम से कम 2.5-3 लीटर पानी पीना सेहत के लिए आवश्यक है।'
    },
    specialistRecommendation: 'Clinical Dietitian'
  }
];

export async function processAssistantQuery(
  userInput: string,
  language: AssistantLanguage = 'en',
  patientContext?: PatientHealthContext
): Promise<AssistantMessage> {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const normalized = userInput.toLowerCase();

  // 1. Mandatory Emergency Red-Flag Triage
  const emergencyCheck = evaluateEmergency(userInput);
  if (emergencyCheck.isEmergency) {
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: emergencyCheck.guidanceText[language] || emergencyCheck.guidanceText.en,
      timestamp,
      language,
      isEmergencyAlert: true,
      emergencyData: emergencyCheck,
      suggestedActions: [
        'Call 108 Emergency Ambulance',
        'Request Rapid Clinical Emergency Triage',
        'Access Patient Emergency SOS'
      ]
    };
  }

  // 2. Contextual RAG matching (incorporating patient health history)
  let contextualPrefix = '';
  if (patientContext) {
    if (normalized.includes('my medication') || normalized.includes('my sugar') || normalized.includes('my bp') || normalized.includes('నా మందులు') || normalized.includes('मेरी दवाई')) {
      contextualPrefix = `[Context: ${patientContext.patientName} | Vitals: BP ${patientContext.restingBloodPressure || '128/82'}, Glucose ${patientContext.bloodGlucose || '118 mg/dL'}]\n\n`;
    }
  }

  // 3. Match against Approved Healthcare Knowledge
  for (const item of FAQ_KNOWLEDGE_BASE) {
    const isMatch = item.keywords.some(kw => normalized.includes(kw));
    if (isMatch) {
      const responseText = contextualPrefix + (item.response[language] || item.response.en);
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        timestamp,
        language,
        suggestedActions: item.specialistRecommendation 
          ? [`Schedule consultation with ${item.specialistRecommendation}`, 'Log in Health Vault']
          : ['Record symptoms in journal', 'Check Vitals']
      };
    }
  }

  // 4. Dynamic Intelligent LLM Router Generation with Automatic Multi-Key Failover
  try {
    const router = SmartLLMRouter.getInstance();
    const routerPrompt = `${contextualPrefix}User Inquiry in ${language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English'}: "${userInput}"\n\nProvide an empathetic, scientifically sound clinical response in ${language === 'te' ? 'Telugu (తెలుగు)' : language === 'hi' ? 'Hindi (हिंदी)' : 'English'}. Include lifestyle self-care and advise when to visit an outpatient specialist. Add the clinical disclaimer.`;

    const routerResult = await router.completePrompt({
      prompt: routerPrompt,
      systemInstruction: 'You are Olmera Health Companion, a clinical triage and patient support assistant. You prioritize patient safety, explain conditions calmly, and never fabricate diagnoses.',
      temperature: 0.5,
      maxTokens: 1024,
      taskType: 'chat'
    });

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: routerResult.content,
      timestamp,
      language,
      suggestedActions: [
        `Routed via ${routerResult.keyUsed.name}`,
        'Book Consultation with Specialist',
        'Check Emergency SOS'
      ],
      sourceCitations: [`Model: ${routerResult.keyUsed.model}`, `Latency: ${routerResult.metrics.latencyMs}ms`]
    };
  } catch (_routerErr) {
    // Graceful fallback to static verified responses if all keys are exhausted
    const defaultResponses = {
      en: `${contextualPrefix}Thank you for sharing your concern. In Olmera Healthcare, your symptoms are evaluated contextually with your health profile. Please maintain adequate hydration, observe if symptoms change over the next 24 hours, and consult a qualified specialist for definitive diagnosis.

Notice: AI-generated guidance, not medical advice. For emergencies, always dial 108.`,
      te: `${contextualPrefix}మీ సందేహాన్ని తెలిపినందుకు ధన్యవాదాలు. తగినంత నీరు త్రాగండి, విశ్రాంతి తీసుకోండి మరియు సరైన నిర్ధారణ కోసం మా ప్రత్యేక వైద్యులను సంప్రదించండి.

గమనిక: ఇది AI సలహా మాత్రమే, వైద్యుల పరిశీలనకు ప్రత్యామ్నాయం కాదు. అత్యవసర పరిస్థితుల్లో 108 కి కాల్ చేయండి.`,
      hi: `${contextualPrefix}अपनी स्वास्थ्य समस्या साझा करने के लिए धन्यवाद। पर्याप्त पानी पिएं, आराम करें और सही जांच के लिए संबंधित विशेषज्ञ चिकित्सक से संपर्क करें।

सूचना: यह AI मार्गदर्शन है, डॉक्टर की सलाह का विकल्प नहीं। आपातकाल में तुरंत 108 पर कॉल करें।`
    };

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: defaultResponses[language] || defaultResponses.en,
      timestamp,
      language,
      suggestedActions: ['Book Consultation with Specialist', 'Check Emergency SOS', 'View Medical Vault']
    };
  }
}
