import { useEffect, useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, addDoc, getDoc, limit, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  ClipboardList, Plus, Search, Calendar, User, Clock, 
  CheckCircle2, AlertCircle, Edit2, Trash2, Save, X, Filter
} from 'lucide-react';
import { MedicalBackground } from './MedicalBackground';

interface CaseNote {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  content: string;
  symptoms: string;
  diagnosis: string;
  created_at: string;
  updated_at?: string;
  patient_name?: string;
}

export function CaseNotes() {
  const { user } = useAuth();
  const [notes, setCaseNotes] = useState<CaseNote[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    patient_id: '',
    symptoms: '',
    diagnosis: '',
    content: ''
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // 1. Get Doctor Info
      const drSnap = await getDocs(query(collection(db, 'doctors'), where('user_id', '==', user.uid), limit(1)));
      let drId = '';
      let drName = 'Doctor';
      if (!drSnap.empty) {
        drId = drSnap.docs[0].id;
        drName = drSnap.docs[0].data().name;
        setDoctorId(drId);
        setDoctorName(drName);
      }

      // 2. Get Assigned Patients (those who had appointments with this doctor)
      const aptsSnap = await getDocs(query(collection(db, 'appointments'), where('doctor_id', '==', drId)));
      const pIds = Array.from(new Set(aptsSnap.docs.map(d => d.data().patient_id)));
      
      const pList: any[] = [];
      for (const pid of pIds) {
        if (!pid) continue;
        const pDoc = await getDoc(doc(db, 'patients', pid));
        if (pDoc.exists()) pList.push({ id: pDoc.id, ...pDoc.data() });
      }
      setPatients(pList);

      // 3. Get Case Notes
      const notesSnap = await getDocs(query(
        collection(db, 'case_notes'), 
        where('doctor_id', '==', drId)
      ));
      
      const notesList: CaseNote[] = [];
      for (const d of notesSnap.docs) {
        const data = d.data();
        const pName = pList.find(p => p.id === data.patient_id)?.full_name || 'Unknown Patient';
        notesList.push({ id: d.id, ...data, patient_name: pName } as CaseNote);
      }
      setCaseNotes(notesList);

    } catch (err) {
      console.error('Error loading clinical notes:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;

    try {
      const noteData = {
        ...formData,
        doctor_id: doctorId,
        doctor_name: doctorName,
        updated_at: new Date().toISOString()
      };

      if (editingId) {
        await updateDoc(doc(db, 'case_notes', editingId), noteData);
      } else {
        await addDoc(collection(db, 'case_notes'), {
          ...noteData,
          created_at: new Date().toISOString()
        });
      }

      setIsAdding(false);
      setEditingId(null);
      setFormData({ patient_id: '', symptoms: '', diagnosis: '', content: '' });
      loadData();
    } catch (err) {
      console.error('Error saving clinical note:', err);
    }
  };

  const handleEdit = (note: CaseNote) => {
    setFormData({
      patient_id: note.patient_id,
      symptoms: note.symptoms,
      diagnosis: note.diagnosis,
      content: note.content
    });
    setEditingId(note.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this clinical observation?')) return;
    try {
      await deleteDoc(doc(db, 'case_notes', id));
      loadData();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const filteredNotes = notes.filter(n => 
    n.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
        <p className="text-slate-500 font-medium">Retrieving Clinical Records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn relative pb-12">
      <MedicalBackground />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Clinical <span className="text-blue-600">Case Notes</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Document patient interactions and clinical observations.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg shadow-blue-100 dark:shadow-none"
          >
            <Plus size={18} /> New Case Note
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="card p-8 relative z-10 animate-scaleIn bg-white/90 backdrop-blur-md border-blue-100 dark:border-blue-900/30 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                <ClipboardList size={20} />
              </div>
              {editingId ? 'Refine Clinical Note' : 'New Clinical Entry'}
            </h3>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Patient Subject</label>
                <select 
                  required
                  value={formData.patient_id}
                  onChange={e => setFormData({...formData, patient_id: e.target.value})}
                  className="input-field py-4 appearance-none"
                  disabled={!!editingId}
                >
                  <option value="">Select Patient...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Symptoms</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g. Chronic cough, low-grade fever..."
                  value={formData.symptoms}
                  onChange={e => setFormData({...formData, symptoms: e.target.value})}
                  className="input-field py-4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Clinical Diagnosis</label>
              <input 
                required
                type="text"
                placeholder="Initial or confirmed diagnosis..."
                value={formData.diagnosis}
                onChange={e => setFormData({...formData, diagnosis: e.target.value})}
                className="input-field py-4"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Observation Details</label>
              <textarea 
                required
                placeholder="Comprehensive clinical notes and observations..."
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                className="input-field py-4 min-h-[200px] resize-none"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="button"
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="btn-outline px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px]"
              >
                Discard
              </button>
              <button 
                type="submit"
                className="btn-primary px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 dark:shadow-none"
              >
                <Save size={16} className="inline mr-2" />
                {editingId ? 'Update Note' : 'Commit Entry'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 relative z-10">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by patient name or diagnosis..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-12 py-4 shadow-sm w-full bg-white/80 backdrop-blur-sm"
              />
            </div>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="card p-20 text-center relative z-10 bg-white/50 backdrop-blur-md">
              <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                <ClipboardList size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Case Notes</h3>
              <p className="text-slate-500 dark:text-slate-400">You haven't recorded any clinical observations yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 relative z-10">
              {filteredNotes.map((note) => (
                <div key={note.id} className="card p-8 group hover:border-blue-200 transition-all duration-300 bg-white/80 backdrop-blur-md">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                            <User size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{note.patient_name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Clock size={12} /> {new Date(note.created_at).toLocaleDateString()}
                              </span>
                              {note.updated_at && (
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Modified</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(note)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(note.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <AlertCircle size={12} className="text-amber-500" /> Symptoms
                          </p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{note.symptoms}</p>
                        </div>
                        <div className="p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20">
                          <p className="text-[10px] font-black text-emerald-600/70 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <CheckCircle2 size={12} /> Diagnosis
                          </p>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{note.diagnosis}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Observations</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                          {note.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
