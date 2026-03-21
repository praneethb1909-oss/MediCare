import { useEffect, useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, addDoc, getDoc, limit, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  Pill, Plus, Search, Calendar, User, Clock, 
  CheckCircle2, AlertCircle, Edit2, History, Save, X, 
  FileText, Download, Trash2, Info
} from 'lucide-react';
import { MedicalBackground } from './MedicalBackground';

interface PrescriptionHistory {
  updated_at: string;
  reason: string;
  previous_data: any;
}

interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  medications: string;
  dosage: string;
  duration: string;
  instructions: string;
  created_at: string;
  updated_at?: string;
  edit_history?: PrescriptionHistory[];
  patient_name?: string;
  status: 'active' | 'expired' | 'cancelled';
}

export function PrescriptionsPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    patient_id: '',
    medications: '',
    dosage: '',
    duration: '',
    instructions: '',
    edit_reason: ''
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

      // 2. Get Assigned Patients
      const aptsSnap = await getDocs(query(collection(db, 'appointments'), where('doctor_id', '==', drId)));
      const pIds = Array.from(new Set(aptsSnap.docs.map(d => d.data().patient_id)));
      
      const pList: any[] = [];
      for (const pid of pIds) {
        if (!pid) continue;
        const pDoc = await getDoc(doc(db, 'patients', pid));
        if (pDoc.exists()) pList.push({ id: pDoc.id, ...pDoc.data() });
      }
      setPatients(pList);

      // 3. Get Prescriptions
      const presSnap = await getDocs(query(
        collection(db, 'prescriptions'), 
        where('doctor_id', '==', drId)
      ));
      
      const presList: Prescription[] = [];
      for (const d of presSnap.docs) {
        const data = d.data();
        const pName = pList.find(p => p.id === data.patient_id)?.full_name || 'Unknown Patient';
        presList.push({ id: d.id, ...data, patient_name: pName } as Prescription);
      }
      setPrescriptions(presList);

    } catch (err) {
      console.error('Error loading prescriptions:', err);
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
      const timestamp = new Date().toISOString();
      
      if (editingId) {
        const oldPres = prescriptions.find(p => p.id === editingId);
        if (!oldPres) return;

        const newHistoryItem: PrescriptionHistory = {
          updated_at: timestamp,
          reason: formData.edit_reason,
          previous_data: {
            medications: oldPres.medications,
            dosage: oldPres.dosage,
            duration: oldPres.duration,
            instructions: oldPres.instructions
          }
        };

        const updatedHistory = [...(oldPres.edit_history || []), newHistoryItem];

        await updateDoc(doc(db, 'prescriptions', editingId), {
          medications: formData.medications,
          dosage: formData.dosage,
          duration: formData.duration,
          instructions: formData.instructions,
          updated_at: timestamp,
          edit_history: updatedHistory
        });
      } else {
        await addDoc(collection(db, 'prescriptions'), {
          patient_id: formData.patient_id,
          doctor_id: doctorId,
          doctor_name: doctorName,
          medications: formData.medications,
          dosage: formData.dosage,
          duration: formData.duration,
          instructions: formData.instructions,
          created_at: timestamp,
          status: 'active',
          edit_history: []
        });
      }

      setIsAdding(false);
      setEditingId(null);
      setFormData({ patient_id: '', medications: '', dosage: '', duration: '', instructions: '', edit_reason: '' });
      loadData();
    } catch (err) {
      console.error('Error saving prescription:', err);
    }
  };

  const handleEdit = (pres: Prescription) => {
    setFormData({
      patient_id: pres.patient_id,
      medications: pres.medications,
      dosage: pres.dosage,
      duration: pres.duration,
      instructions: pres.instructions,
      edit_reason: ''
    });
    setEditingId(pres.id);
    setIsAdding(true);
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    p.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.medications.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
        <p className="text-slate-500 font-medium">Synchronizing Pharmacy Records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn relative pb-12">
      <MedicalBackground />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Pharmacy <span className="text-blue-600">Prescriptions</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Issue and manage medication protocols for your patients.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg shadow-blue-100 dark:shadow-none"
          >
            <Plus size={18} /> Issue Prescription
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="card p-8 relative z-10 animate-scaleIn bg-white/90 backdrop-blur-md border-blue-100 dark:border-blue-900/30 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                <Pill size={20} />
              </div>
              {editingId ? 'Modify Medication Protocol' : 'Issue New Prescription'}
            </h3>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Patient</label>
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
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Medications</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g. Amoxicillin 500mg, Paracetamol..."
                  value={formData.medications}
                  onChange={e => setFormData({...formData, medications: e.target.value})}
                  className="input-field py-4"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dosage Frequency</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g. 1-0-1 (Twice daily after meals)"
                  value={formData.dosage}
                  onChange={e => setFormData({...formData, dosage: e.target.value})}
                  className="input-field py-4"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Duration</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g. 5 Days, 1 Month..."
                  value={formData.duration}
                  onChange={e => setFormData({...formData, duration: e.target.value})}
                  className="input-field py-4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Special Instructions</label>
              <textarea 
                required
                placeholder="Specific instructions for the patient..."
                value={formData.instructions}
                onChange={e => setFormData({...formData, instructions: e.target.value})}
                className="input-field py-4 min-h-[100px] resize-none"
              />
            </div>

            {editingId && (
              <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
                <label className="text-[10px] font-black uppercase tracking-widest text-amber-600 ml-1">Reason for Modification</label>
                <input 
                  required
                  type="text"
                  placeholder="Why is this medication protocol being updated?"
                  value={formData.edit_reason}
                  onChange={e => setFormData({...formData, edit_reason: e.target.value})}
                  className="input-field py-3 border-amber-200 focus:border-amber-500 focus:ring-amber-500/20"
                />
              </div>
            )}

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
                {editingId ? 'Update Protocol' : 'Authorize Prescription'}
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
                placeholder="Search by patient name or medication..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-12 py-4 shadow-sm w-full bg-white/80 backdrop-blur-sm"
              />
            </div>
          </div>

          {filteredPrescriptions.length === 0 ? (
            <div className="card p-20 text-center relative z-10 bg-white/50 backdrop-blur-md">
              <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Pill size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Active Prescriptions</h3>
              <p className="text-slate-500 dark:text-slate-400">You haven't issued any medication protocols yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 relative z-10">
              {filteredPrescriptions.map((pres) => (
                <div key={pres.id} className="card p-0 overflow-hidden group hover:border-blue-200 transition-all duration-300 bg-white/80 backdrop-blur-md">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-64 p-8 bg-slate-50/50 dark:bg-slate-800/50 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                        <Pill size={32} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        pres.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {pres.status}
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 mb-1">Authorized On</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{new Date(pres.created_at).toLocaleDateString()}</p>
                    </div>

                    <div className="flex-1 p-8">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{pres.patient_name}</h3>
                          <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">Patient Subject</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(pres)}
                            className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-blue-600 rounded-xl shadow-sm transition-all"
                            title="Edit Protocol"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button 
                            onClick={() => setShowHistoryId(showHistoryId === pres.id ? null : pres.id)}
                            className={`p-3 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm transition-all ${
                              showHistoryId === pres.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-600'
                            }`}
                            title="View Audit Log"
                          >
                            <History size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medications</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{pres.medications}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dosage</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{pres.dosage}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{pres.duration}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instructions</p>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 italic">"{pres.instructions}"</p>
                      </div>

                      {showHistoryId === pres.id && (
                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <History size={16} className="text-blue-600" /> Protocol Audit Log
                          </h4>
                          <div className="space-y-4">
                            {pres.edit_history && pres.edit_history.length > 0 ? (
                              pres.edit_history.map((h, idx) => (
                                <div key={idx} className="p-4 bg-blue-50/30 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r-2xl">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Modification #{idx + 1}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{new Date(h.updated_at).toLocaleString()}</span>
                                  </div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Reason: {h.reason}</p>
                                  <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-500">
                                    <p>Prev Meds: {h.previous_data.medications}</p>
                                    <p>Prev Dosage: {h.previous_data.dosage}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs font-bold text-slate-400 italic">No modifications recorded for this protocol.</p>
                            )}
                          </div>
                        </div>
                      )}
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
