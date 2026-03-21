import { useEffect, useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { User, Mail, Phone, Calendar, ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
  email: string | null;
  phone: string | null;
  available_days: string[];
  available_hours_start: string;
  available_hours_end: string;
}

interface DoctorListProps {
  departmentId: string;
  hospitalId?: string;
  onSelectDoctor: (doctorId: string) => void;
  onBack: () => void;
}

export function DoctorList({ departmentId, hospitalId, onSelectDoctor, onBack }: DoctorListProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentName, setDepartmentName] = useState('');

  const { role } = useAuth();

  const loadDoctors = useCallback(async () => {
    try {
      const deptDoc = await getDoc(doc(db, 'departments', departmentId));
      if (deptDoc.exists()) {
        setDepartmentName(deptDoc.data().name);
      } else {
        setDepartmentName('Department');
      }

      // First attempt: filter by both department and hospital (no orderBy to avoid index requirements)
      let primaryQuery = hospitalId
        ? query(
            collection(db, 'doctors'),
            where('department_id', '==', departmentId),
            where('hospital_id', '==', hospitalId)
          )
        : query(
            collection(db, 'doctors'),
            where('department_id', '==', departmentId)
          );

      let querySnapshot = await getDocs(primaryQuery);
      let doctorsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));

      // Fallback: if filtering by hospital yields no result, broaden to department-only
      if (doctorsData.length === 0 && hospitalId) {
        const fallbackQuery = query(
          collection(db, 'doctors'),
          where('department_id', '==', departmentId)
        );
        const fallbackSnap = await getDocs(fallbackQuery);
        doctorsData = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));
      }

      // In-memory sort by name for UX
      doctorsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId, hospitalId]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 font-medium transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Departments
      </button>

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">{departmentName} Specialists</h2>
        <p className="text-slate-500">Choose a specialist to book your consultation.</p>
      </div>

      {doctors.length === 0 ? (
        <div className="card p-12 text-center max-w-2xl mx-auto">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-slate-300 w-8 h-8" />
          </div>
          <p className="text-slate-500 font-medium">No doctors are currently available in this department.</p>
          <button onClick={onBack} className="mt-4 text-blue-600 font-semibold hover:underline">Try another department</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="card p-6 hover:border-blue-200 group transition-all duration-300"
            >
              <div className="flex items-start gap-5 mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                  <User size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{doctor.name}</h3>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 uppercase tracking-wider">
                    {doctor.specialization || 'General Specialist'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Mail size={14} />
                  </div>
                  <span className="truncate">{doctor.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Phone size={14} />
                  </div>
                  <span>{doctor.phone || 'N/A'}</span>
                </div>
                <div className="col-span-2 flex items-center gap-3 text-sm text-slate-500">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Calendar size={14} />
                  </div>
                  <span>Available: {doctor.available_days?.join(', ') || 'Contact for schedule'}</span>
                </div>
              </div>

              <button
                onClick={() => onSelectDoctor(doctor.id)}
                className="w-full btn-primary flex items-center justify-center gap-2 group/btn"
              >
                <span>Book Appointment</span>
                <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
