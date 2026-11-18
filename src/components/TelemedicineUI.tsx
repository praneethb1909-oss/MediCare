import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  MessageSquare, 
  User, 
  ShieldCheck, 
  Clock, 
  FileText, 
  ChevronLeft,
  Settings,
  MoreVertical,
  Maximize,
  AlertCircle,
  Check,
  Upload,
  Plus,
  ArrowRight,
  Send,
  X,
  Download,
  CheckCircle2,
  Eye,
  ExternalLink,
  Trash2
} from 'lucide-react';

interface TelemedicineUIProps {
  doctorName?: string;
  onBack: () => void;
}

interface SharedDoc {
  id: string;
  name: string;
  url: string;
  size: string;
  uploadedAt: string;
}

export function TelemedicineUI({ doctorName = "Dr. Ramesh Babu", onBack }: TelemedicineUIProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [step, setViewStep] = useState<'checklist' | 'upload' | 'call' | 'summary'>('checklist');
  const [checklist, setChecklist] = useState<boolean[]>([false, false, false, false]);

  const [uploadedDocs, setUploadedDocs] = useState<SharedDoc[]>([
    { 
      id: 'doc-seed-1', 
      name: 'Blood_Test_Feb24.pdf', 
      url: 'https://example.com/blood-test.pdf', 
      size: '2.4 MB', 
      uploadedAt: '10:42 AM' 
    }
  ]);
  const [previewDoc, setPreviewDoc] = useState<SharedDoc | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let interval: any;
    if (step === 'call') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const fileList = Array.from(files);

    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        const newDoc: SharedDoc = {
          id: `tele-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          url: dataUrl,
          size: `${sizeMb} MB`,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setUploadedDocs(prev => [newDoc, ...prev]);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    });
  };

  if (step === 'checklist') {
    return (
      <div className="max-w-2xl mx-auto animate-fadeIn">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-8 transition-colors">
          <ChevronLeft size={20} /> Back to Dashboard
        </button>

        <div className="card p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-[#1E88E5] shadow-xl shadow-blue-100 dark:shadow-none">
            <Video size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Telemedicine Session</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 max-w-md mx-auto">
            You are about to join a secure video consultation with <span className="text-[#1E88E5] font-black">{doctorName}</span>. Please complete the checklist.
          </p>

          <div className="space-y-4 mb-10 text-left">
            {[
              "Ensure you are in a quiet, well-lit environment.",
              "Grant camera and microphone permissions when prompted.",
              "Check your internet connection stability.",
              "I have my latest medical reports ready."
            ].map((item, i) => (
              <div 
                key={i} 
                onClick={() => {
                  const newChecklist = [...checklist];
                  newChecklist[i] = !newChecklist[i];
                  setChecklist(newChecklist);
                }}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                  checklist[i] 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-blue-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                  checklist[i] 
                    ? 'bg-[#1E88E5] border-[#1E88E5]' 
                    : 'border-blue-200'
                }`}>
                  <Check size={14} className={`text-white transition-opacity ${checklist[i] ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                <p className={`text-sm font-bold transition-colors ${checklist[i] ? 'text-[#1E88E5]' : 'text-slate-600 dark:text-slate-300'}`}>
                  {item}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={onBack} className="flex-1 btn-outline py-4">Cancel Session</button>
            <button 
              onClick={() => setViewStep('upload')}
              disabled={checklist.some(c => !c)}
              className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 shadow-2xl shadow-blue-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'upload') {
    return (
      <div className="max-w-2xl mx-auto animate-fadeIn">
        <button onClick={() => setViewStep('checklist')} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-8 transition-colors">
          <ChevronLeft size={20} /> Back to Checklist
        </button>

        <div className="card p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-emerald-600 shadow-xl shadow-emerald-100 dark:shadow-none">
            <Upload size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Clinical Documents</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-md mx-auto">
            Upload any relevant medical reports or prescriptions for the doctor to review during the session.
          </p>

          <div 
            onClick={() => document.getElementById('tele-upload')?.click()}
            className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 mb-6 group hover:border-[#1E88E5] transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-800/30"
          >
            <input 
              id="tele-upload" 
              type="file" 
              className="hidden" 
              multiple 
              accept="image/*,.pdf"
              onChange={handleDocumentUpload} 
            />
            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-[#1E88E5] shadow-sm transition-colors">
              <Plus size={28} />
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
              {isUploading ? 'Attaching Clinical Documents...' : 'Select Files to Share'}
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG (Instant Encryption)</p>
          </div>

          {uploadedDocs.length > 0 && (
            <div className="mb-8 space-y-3 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Attached for Consultation ({uploadedDocs.length})</span>
              <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1">
                {uploadedDocs.map(doc => (
                  <div key={doc.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl flex-shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-400">{doc.size} • Uploaded {doc.uploadedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDoc(doc);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="View Document"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedDocs(prev => prev.filter(d => d.id !== doc.id));
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Remove Document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => setViewStep('call')} className="flex-1 btn-outline py-4">Skip for Now</button>
            <button 
              onClick={() => setViewStep('call')}
              className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 shadow-2xl shadow-blue-200 dark:shadow-none"
            >
              Join Session <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Document Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[110] flex items-center justify-center p-4 sm:p-6 animate-fadeIn text-left">
            <div className="bg-[var(--color-surface)] border border-[var(--color-line)] w-full max-w-4xl h-[85vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-5 border-b border-[var(--color-line)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-mist)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-[var(--color-ink)] truncate">{previewDoc.name}</h3>
                    <p className="text-xs text-[var(--color-muted)]">{previewDoc.size} • Consultation Document</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewDoc.url}
                    download={previewDoc.name}
                    className="btn-outline px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 rounded-xl"
                  >
                    <Download size={14} /> Download
                  </a>
                  <button 
                    onClick={() => setPreviewDoc(null)}
                    className="p-2 hover:bg-[var(--color-surface-subtle)] rounded-xl text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-4 bg-[var(--color-surface-subtle)]/50 flex items-center justify-center overflow-hidden">
                {previewDoc.url.includes('pdf') || previewDoc.url.startsWith('data:application/pdf') || previewDoc.url.endsWith('.pdf') ? (
                  <iframe src={previewDoc.url} className="w-full h-full rounded-xl bg-white border border-[var(--color-line)] shadow-inner" title={previewDoc.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                    <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-full object-contain rounded-xl bg-white shadow-lg border border-[var(--color-line)]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Call Document Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4 sm:p-6 animate-fadeIn text-left">
            <div className="bg-[var(--color-surface)] border border-[var(--color-line)] w-full max-w-4xl h-[85vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-5 border-b border-[var(--color-line)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-mist)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-[var(--color-ink)] truncate">{previewDoc.name}</h3>
                    <p className="text-xs text-[var(--color-muted)]">{previewDoc.size} • Consultation Document</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewDoc.url}
                    download={previewDoc.name}
                    className="btn-outline px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 rounded-xl"
                  >
                    <Download size={14} /> Download
                  </a>
                  <button 
                    onClick={() => setPreviewDoc(null)}
                    className="p-2 hover:bg-[var(--color-surface-subtle)] rounded-xl text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-4 bg-[var(--color-surface-subtle)]/50 flex items-center justify-center overflow-hidden">
                {previewDoc.url.includes('pdf') || previewDoc.url.startsWith('data:application/pdf') || previewDoc.url.endsWith('.pdf') ? (
                  <iframe src={previewDoc.url} className="w-full h-full rounded-xl bg-white border border-[var(--color-line)] shadow-inner" title={previewDoc.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                    <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-full object-contain rounded-xl bg-white shadow-lg border border-[var(--color-line)]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === 'call') {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col md:flex-row font-sans overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 relative flex flex-col">
          {/* Doctor Video (Main) */}
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=1600" 
              alt="Doctor Video" 
              className="w-full h-full object-cover"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40"></div>
          </div>

          {/* Top Bar Overlay */}
          <div className="relative z-10 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-black uppercase tracking-widest">{formatDuration(callDuration)}</span>
                </div>
              </div>
              <div className="flex flex-col text-white drop-shadow-lg">
                <span className="text-lg font-black tracking-tight">{doctorName}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Cardiology Specialist</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-white/20 transition-all">
                <Maximize size={20} />
              </button>
              <button className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-white/20 transition-all">
                <Settings size={20} />
              </button>
            </div>
          </div>

          {/* Patient Video (PIP) */}
          <div className="absolute bottom-32 right-6 md:bottom-24 w-32 md:w-48 aspect-[3/4] bg-slate-800 rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl z-20">
            {isVideoOff ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <VideoOff size={32} />
                <span className="text-[10px] font-black uppercase">Video Off</span>
              </div>
            ) : (
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400" 
                alt="Patient Video" 
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Controls Bar */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-white/10 backdrop-blur-xl px-8 py-4 rounded-[2.5rem] border border-white/20 shadow-2xl">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/50' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {isMuted ? <MicOff size={24} strokeWidth={2.5} /> : <Mic size={24} strokeWidth={2.5} />}
            </button>
            <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-4 rounded-2xl transition-all ${isVideoOff ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/50' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {isVideoOff ? <VideoOff size={24} strokeWidth={2.5} /> : <Video size={24} strokeWidth={2.5} />}
            </button>
            <button 
              onClick={() => setChatOpen(!chatOpen)}
              className={`p-4 rounded-2xl transition-all ${chatOpen ? 'bg-[#1E88E5] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <MessageSquare size={24} strokeWidth={2.5} />
            </button>
            <div className="w-px h-8 bg-white/20 mx-2"></div>
            <button 
              onClick={() => setViewStep('summary')}
              className="p-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 hover:scale-110 transition-all shadow-xl shadow-red-600/30"
            >
              <PhoneOff size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Call Sidebar (Reports/Chat) */}
        {chatOpen && (
          <div className="w-full md:w-96 bg-white dark:bg-slate-900 flex flex-col border-l border-slate-100 dark:border-slate-800 animate-slideLeft">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Consultation Hub</h3>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Live Shared Documents ({uploadedDocs.length})
                  </span>
                  <label className="text-[10px] font-black text-[#1E88E5] hover:underline cursor-pointer flex items-center gap-1 uppercase tracking-widest">
                    <Plus size={12} /> Add File
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept="image/*,.pdf" 
                      onChange={handleDocumentUpload} 
                    />
                  </label>
                </div>

                <div className="space-y-2.5">
                  {uploadedDocs.map(doc => (
                    <div 
                      key={doc.id} 
                      onClick={() => setPreviewDoc(doc)}
                      className="p-3.5 bg-blue-50/70 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-center gap-3 cursor-pointer hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-all group"
                      title="Click to view full document"
                    >
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-xl text-[#1E88E5] group-hover:scale-105 transition-transform flex-shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{doc.name}</p>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">{doc.size} • Tap to Inspect</p>
                      </div>
                      <Eye size={16} className="text-slate-400 group-hover:text-[#1E88E5] flex-shrink-0 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doctor's Live Notes</span>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                    "Patient reporting persistent mild chest pain during morning walks. Blood pressure monitoring required..."
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
               <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                  <input 
                    type="text" 
                    placeholder="Type message..." 
                    className="flex-1 bg-transparent border-none outline-none px-2 text-sm font-medium dark:text-white"
                  />
                  <button className="p-2 bg-[#1E88E5] text-white rounded-xl shadow-lg">
                    <Send size={18} />
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* Live Call Document Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4 sm:p-6 animate-fadeIn text-left">
            <div className="bg-[var(--color-surface)] border border-[var(--color-line)] w-full max-w-4xl h-[85vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-5 border-b border-[var(--color-line)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-mist)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-[var(--color-ink)] truncate">{previewDoc.name}</h3>
                    <p className="text-xs text-[var(--color-muted)]">{previewDoc.size} • Consultation Document</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewDoc.url}
                    download={previewDoc.name}
                    className="btn-outline px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 rounded-xl"
                  >
                    <Download size={14} /> Download
                  </a>
                  <button 
                    onClick={() => setPreviewDoc(null)}
                    className="p-2 hover:bg-[var(--color-surface-subtle)] rounded-xl text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-4 bg-[var(--color-surface-subtle)]/50 flex items-center justify-center overflow-hidden">
                {previewDoc.url.includes('pdf') || previewDoc.url.startsWith('data:application/pdf') || previewDoc.url.endsWith('.pdf') ? (
                  <iframe src={previewDoc.url} className="w-full h-full rounded-xl bg-white border border-[var(--color-line)] shadow-inner" title={previewDoc.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                    <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-full object-contain rounded-xl bg-white shadow-lg border border-[var(--color-line)]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn pb-12">
          <div className="card p-10 text-center border-t-8 border-t-emerald-500">
        <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-emerald-600 shadow-xl shadow-emerald-100 dark:shadow-none">
          <CheckCircle2 size={48} strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">Session Completed</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 text-lg">
          Your consultation with <span className="text-[#1E88E5] font-black">{doctorName}</span> has ended successfully. A summary has been generated.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 text-left">
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Diagnosis Summary</span>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">Mild hypertension noted. Follow-up blood profile recommended in 14 days.</p>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Duration</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">18:42</span>
              <span className="text-xs font-bold text-slate-400 pb-1">MINUTES</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button className="flex-1 btn-outline py-4 flex items-center justify-center gap-2">
            <Download size={20} /> Download Invoice
          </button>
          <button 
            onClick={onBack}
            className="flex-1 btn-primary py-4 shadow-2xl shadow-blue-200 dark:shadow-none"
          >
            Go to My Records
          </button>
        </div>
      </div>
    </div>
  );
}
