/**
 * Olmera Healthcare - Emergency Red-Flag Triage Engine
 * 
 * Safety Rule: Must evaluate every query/symptom for acute, life-threatening red flags
 * BEFORE ordinary LLM processing.
 */

export interface EmergencyEvaluation {
  isEmergency: boolean;
  category?: 'cardiac' | 'stroke' | 'respiratory' | 'anaphylaxis' | 'trauma' | 'mental_health';
  matchedKeywords: string[];
  immediateAction: string;
  emergencyNumber: string;
  guidanceText: {
    en: string;
    te: string;
    hi: string;
  };
}

const EMERGENCY_RULES: Array<{
  category: 'cardiac' | 'stroke' | 'respiratory' | 'anaphylaxis' | 'trauma' | 'mental_health';
  keywords: string[];
  immediateAction: string;
  guidanceText: { en: string; te: string; hi: string };
}> = [
  {
    category: 'cardiac',
    keywords: [
      'chest pain', 'chest tightness', 'heart attack', 'crushing chest', 
      'left arm pain', 'jaw pain chest', 'sweating chest pain', 'గుండె నొప్పి', 
      'ఛాతీ నొప్పి', 'छाती में दर्द', 'हार्ट अटैक'
    ],
    immediateAction: 'Call 108 Emergency Ambulance immediately. Sit down, keep calm, and avoid physical exertion.',
    guidanceText: {
      en: 'POTENTIAL CARDIAC EMERGENCY: Severe chest discomfort requires immediate paramedic evaluation. Do not drive yourself. Call 108 immediately.',
      te: 'అత్యవసర గుండె సమస్య సంకేతం: తీవ్రమైన ఛాతీ నొప్పికి తక్షణ వైద్యం అవసరం. స్వయంగా వాహనం నడపవద్దు. వెంటనే 108 కి కాల్ చేయండి.',
      hi: 'गंभीर आपातकालीन स्थिति: सीने में तेज दर्द दिल के दौरे का संकेत हो सकता है। तुरंत 108 एम्बुलेंस पर कॉल करें।'
    }
  },
  {
    category: 'stroke',
    keywords: [
      'facial droop', 'face drooping', 'arm weakness', 'slurred speech', 
      'sudden numbness', 'cannot speak', 'sudden blindness', 'stroke', 
      'పక్షవాతం', 'ముఖం వంకర', 'लकवा', 'चेहरा टेढ़ा'
    ],
    immediateAction: 'FAST Protocol: Check Face, Arms, Speech, Time. Call 108 immediately.',
    guidanceText: {
      en: 'POTENTIAL STROKE ALERT: Sudden weakness or speech difficulty is a medical emergency. Every minute counts. Contact 108 immediately.',
      te: 'పక్షవాతం (స్ట్రోక్) హెచ్చరిక: శరీర భాగం బలహీనపడటం లేదా మాట తడబడటం అత్యవసరం. వెంటనే 108 ని సంప్రదించండి.',
      hi: 'स्ट्रोक की चेतावनी: चेहरे का टेढ़ापन या बोलने में असमर्थता आपातकाल है। तुरंत 108 पर संपर्क करें।'
    }
  },
  {
    category: 'respiratory',
    keywords: [
      'cannot breathe', 'severe shortness of breath', 'choking', 'blue lips', 
      'gasping for air', 'suffocating', 'శ్వాస ఆడట్లేదు', 'ఊపిరాడటం లేదు', 
      'सांस नहीं आ रही', 'दम घुटना'
    ],
    immediateAction: 'Sit upright, loosen tight clothing. Call 108 immediately for supplemental oxygen.',
    guidanceText: {
      en: 'SEVERE RESPIRATORY DISTRESS: Inability to breathe is critical. Call 108 immediately and stay in an upright seated position.',
      te: 'తీవ్రమైన శ్వాస సమస్య: ఊపిరాడకపోవడం అత్యంత ప్రమాదకరం. వెంటనే 108 కి కాల్ చేసి నిటారుగా కూర్చోండి.',
      hi: 'गंभीर सांस की तकलीफ: सांस लेने में असमर्थता आपातकालीन है। तुरंत 108 पर कॉल करें।'
    }
  },
  {
    category: 'anaphylaxis',
    keywords: [
      'throat swelling', 'tongue swelling', 'anaphylaxis', 'severe allergic', 
      'lip swelling breathing', 'గొంతు వాపు', 'गले में सूजन', 'एलर्जिक शॉक'
    ],
    immediateAction: 'Use Epinephrine autoinjector if prescribed. Call 108 immediately.',
    guidanceText: {
      en: 'ACUTE ANAPHYLAXIS SUSPECTED: Airway swelling is life-threatening. Seek immediate emergency care or call 108.',
      te: 'తీవ్రమైన ఎలర్జీ హెచ్చరిక: శ్వాసనాళాల వాపు ప్రాణాంతకం కావచ్చు. వెంటనే 108 కి కాల్ చేయండి.',
      hi: 'गंभीर एलर्जी की चेतावनी: गले या जीभ में सूजन जानलेवा हो सकती है। तुरंत 108 पर संपर्क करें।'
    }
  },
  {
    category: 'trauma',
    keywords: [
      'uncontrolled bleeding', 'profuse bleeding', 'head injury unconscious', 
      'severe hemorrhage', 'ఆగని రక్తస్రావం', 'తీవ్ర రక్తస్రావం', 'खून बहना बंद नहीं'
    ],
    immediateAction: 'Apply firm, continuous direct pressure to the wound with a clean cloth. Call 108.',
    guidanceText: {
      en: 'SEVERE HEMORRHAGE / TRAUMA: Apply direct pressure to wound. Call 108 immediately.',
      te: 'తీవ్రమైన రక్తస్రావం: గాయంపై శుభ్రమైన గుడ్డతో గట్టిగా నొక్కి ఉంచండి. వెంటనే 108 కి కాల్ చేయండి.',
      hi: 'गंभीर रक्तस्राव: घाव पर साफ कपड़े से सीधा दबाव डालें और तुरंत 108 पर कॉल करें।'
    }
  },
  {
    category: 'mental_health',
    keywords: [
      'suicide', 'kill myself', 'end my life', 'want to die', 
      'ఆత్మహత్య', 'చనిపోవాలని ఉంది', 'आत्महत्या'
    ],
    immediateAction: 'Connect immediately with Tele-MANAS (14416 / 1800 891 4416) or National Helpline 9152987821.',
    guidanceText: {
      en: 'CRISIS SUPPORT AVAILABLE: You are not alone. Reach free, confidential mental health counselors right now: Dial 14416 (Tele-MANAS) or 108.',
      te: 'మీకు సహాయం అందుబాటులో ఉంది: మీరు ఒంటరిగా లేరు. ఉచిత కౌన్సిలింగ్ కోసం టెలి-మానస్ 14416 లేదా 108 కి కాల్ చేయండి.',
      hi: 'सहायता उपलब्ध है: आप अकेले नहीं हैं। कृपया तुरंत टेली-मानस हेल्पलाइन 14416 या 108 पर कॉल करें।'
    }
  }
];

export function evaluateEmergency(text: string): EmergencyEvaluation {
  const normalized = text.toLowerCase();
  
  for (const rule of EMERGENCY_RULES) {
    const matched = rule.keywords.filter(kw => normalized.includes(kw.toLowerCase()));
    if (matched.length > 0) {
      return {
        isEmergency: true,
        category: rule.category,
        matchedKeywords: matched,
        immediateAction: rule.immediateAction,
        emergencyNumber: rule.category === 'mental_health' ? '14416' : '108',
        guidanceText: rule.guidanceText
      };
    }
  }

  return {
    isEmergency: false,
    matchedKeywords: [],
    immediateAction: '',
    emergencyNumber: '108',
    guidanceText: { en: '', te: '', hi: '' }
  };
}
