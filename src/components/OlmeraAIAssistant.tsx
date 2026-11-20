import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Mic, MicOff, Volume2, VolumeX, X, AlertTriangle, 
  Sparkles, Globe, Shield, Phone, ChevronRight, User, CheckCircle2, ShieldAlert 
} from 'lucide-react';
import { processAssistantQuery, AssistantMessage, AssistantLanguage } from '../services/ai/assistantService';
import { useAuth } from '../contexts/AuthContext';

interface OlmeraAIAssistantProps {
  isOpen?: boolean;
  onClose?: () => void;
  isFloating?: boolean;
}

export function OlmeraAIAssistant({ isOpen = true, onClose, isFloating = false }: OlmeraAIAssistantProps) {
  const { user } = useAuth();
  const [language, setLanguage] = useState<AssistantLanguage>('en');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello, I am your Olmera Health Companion. How can I assist with your symptoms, medication schedule, or lab reports today?',
      timestamp: 'Just now',
      language: 'en',
      suggestedActions: ['Explain my latest lab reports', 'Check medication schedule', 'Cardiology specialist advice']
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check Web Speech API support
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSpeechSupported(true);
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice Input via Web Speech API
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      handleSendMessage(transcript);
    };

    recognition.start();
  };

  // Voice Output via SpeechSynthesis
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const userMsg: AssistantMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      language: language
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Query AI service with patient context
    const aiResponse = await processAssistantQuery(textToSend, language, {
      patientName: user?.displayName || 'Valued Patient',
      restingBloodPressure: '128/82 mmHg',
      bloodGlucose: '118 mg/dL',
      activeConditions: ['Type 2 Diabetes', 'Mild Hypertension']
    });

    setMessages(prev => [...prev, aiResponse]);
  };

  return (
    <div className={`flex flex-col bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl shadow-xl overflow-hidden font-ui ${
      isFloating ? 'fixed bottom-24 right-6 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] z-50 animate-scaleIn' : 'w-full h-full min-h-[580px]'
    }`}>
      
      {/* Header */}
      <div className="p-4 bg-[var(--color-primary)] text-white flex items-center justify-between border-b border-black/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <Sparkles size={20} className="text-[var(--color-mist)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-base leading-none">Olmera Health Companion</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-[11px] text-[var(--color-mist)] mt-0.5">Multilingual • Clinical Triage Enabled</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex bg-black/20 p-1 rounded-xl text-xs font-semibold">
            {(['en', 'te', 'hi'] as AssistantLanguage[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 py-0.5 rounded-lg transition-colors uppercase ${
                  language === lang ? 'bg-white text-[var(--color-primary)]' : 'text-white/80 hover:text-white'
                }`}
                title={lang === 'te' ? 'తెలుగు' : lang === 'hi' ? 'हिंदी' : 'English'}
              >
                {lang}
              </button>
            ))}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
              aria-label="Close Assistant"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-[var(--color-surface-subtle)] px-4 py-2 border-b border-[var(--color-line)] flex items-center justify-between text-[11px] text-[var(--color-muted)]">
        <span className="flex items-center gap-1.5">
          <Shield size={12} className="text-[var(--color-primary)]" />
          AI-assisted guidance. For emergencies, dial 108 immediately.
        </span>
        <span className="uppercase text-[9px] font-bold tracking-wider text-[var(--color-primary)]">
          {language === 'te' ? 'తెలుగు మోడ్' : language === 'hi' ? 'हिंदी मोड' : 'EN Active'}
        </span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Sender bubble */}
            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[var(--color-primary)] text-white rounded-br-none shadow-sm'
                  : msg.isEmergencyAlert
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-200 rounded-bl-none shadow-md'
                  : 'bg-[var(--color-surface-subtle)] border border-[var(--color-line)] text-[var(--color-ink)] rounded-bl-none shadow-sm'
              }`}
            >
              {/* Emergency Alert Tag */}
              {msg.isEmergencyAlert && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold uppercase text-xs">
                  <AlertTriangle size={18} /> Emergency Red-Flag Triage
                </div>
              )}

              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Emergency Action Buttons */}
              {msg.isEmergencyAlert && (
                <div className="mt-3 pt-3 border-t border-rose-200 dark:border-rose-800 space-y-2">
                  <a
                    href="tel:108"
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <Phone size={14} /> Call 108 Emergency Ambulance (Toll-Free)
                  </a>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined' && (window as any).setView) {
                        (window as any).setView('emergency');
                      }
                    }}
                    className="w-full py-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShieldAlert size={14} /> Open Clinical Emergency Triage
                  </button>
                </div>
              )}

              {/* Audio Playback Button */}
              {msg.sender === 'assistant' && !msg.isEmergencyAlert && (
                <div className="mt-2 pt-2 border-t border-[var(--color-line)]/50 flex items-center justify-between">
                  <span className="text-[10px] text-[var(--color-muted)] font-mono">{msg.timestamp}</span>
                  <button
                    onClick={() => speakText(msg.text)}
                    className="p-1 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors rounded-lg flex items-center gap-1 text-[11px]"
                    title="Listen to response"
                  >
                    <Volume2 size={14} />
                    <span>Read out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Suggested Follow-up Action Chips */}
            {msg.suggestedActions && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                {msg.suggestedActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(action)}
                    className="px-2.5 py-1 bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-primary)] text-[var(--color-ink)] rounded-lg text-[11px] font-medium transition-colors shadow-xs"
                  >
                    + {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <div className="p-3 bg-[var(--color-surface)] border-t border-[var(--color-line)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Input Button */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening 
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse' 
                  : 'bg-[var(--color-surface-subtle)] text-[var(--color-primary)] border-[var(--color-line)] hover:border-[var(--color-primary)]'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Speak your question'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              language === 'te' 
                ? 'మీ ఆరోగ్య సమస్య లేదా ప్రశ్నను టైప్ చేయండి...' 
                : language === 'hi' 
                ? 'अपनी स्वास्थ्य समस्या या प्रश्न लिखें...' 
                : 'Ask about symptoms, reports, medications...'
            }
            className="flex-1 px-4 py-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-xl text-xs sm:text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] transition-colors"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="btn-primary p-2.5 rounded-xl disabled:opacity-40 transition-opacity"
            aria-label="Send query"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
