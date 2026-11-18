import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Calendar, Clock, ChevronRight, User, Filter, Building2, Phone, Mail, IndianRupee, Award, Briefcase } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { MedicareWaveLoader } from './common/MedicareWaveLoader';

interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
  hospital_id: string;
  department_id: string;
  experience?: string;
  rating?: number;
  reviews?: number;
  fee?: number;
  available_days: string[];
  available_hours_start: string;
  available_hours_end: string;
  image?: string;
  education?: string;
}

const FALLBACK_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Ramesh Babu',
    specialization: 'Cardiologist',
    hospital_id: 'hosp-1',
    department_id: 'dept-1',
    experience: '18 Years',
    rating: 4.9,
    reviews: 142,
    fee: 1000,
    available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    available_hours_start: '09:00:00',
    available_hours_end: '17:00:00',
    education: 'MBBS, MD (Medicine), DM (Cardiology) - AIIMS',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'doc-2',
    name: 'Dr. Lakshmi Prasanna',
    specialization: 'Neurologist',
    hospital_id: 'hosp-2',
    department_id: 'dept-2',
    experience: '14 Years',
    rating: 4.8,
    reviews: 98,
    fee: 1200,
    available_days: ['Mon', 'Wed', 'Fri', 'Sat'],
    available_hours_start: '10:00:00',
    available_hours_end: '18:00:00',
    education: 'MBBS, DM (Neurology), Fellowship in Stroke Care (UK)',
    image: 'https://images.unsplash.com/photo-1594824813583-49035f5ee49b?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'doc-3',
    name: 'Dr. A Suresh',
    specialization: 'Orthopedic Surgeon',
    hospital_id: 'hosp-5',
    department_id: 'dept-4',
    experience: '16 Years',
    rating: 4.9,
    reviews: 210,
    fee: 1000,
    available_days: ['Mon', 'Tue', 'Thu', 'Fri'],
    available_hours_start: '09:00:00',
    available_hours_end: '16:00:00',
    education: 'MBBS, MS (Ortho), MCh (Joint Replacement)',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'doc-4',
    name: 'Dr. K. Sravani',
    specialization: 'Gynecologist & Obstetrician',
    hospital_id: 'hosp-7',
    department_id: 'dept-14',
    experience: '12 Years',
    rating: 4.9,
    reviews: 175,
    fee: 800,
    available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    available_hours_start: '10:00:00',
    available_hours_end: '19:00:00',
    education: 'MBBS, DGO, DNB (Obstetrics & Gynecology)',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'doc-5',
    name: 'Dr. M. Venkat Rao',
    specialization: 'Pediatrician',
    hospital_id: 'hosp-3',
    department_id: 'dept-3',
    experience: '15 Years',
    rating: 4.7,
    reviews: 130,
    fee: 700,
    available_days: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat'],
    available_hours_start: '09:00:00',
    available_hours_end: '15:00:00',
    education: 'MBBS, MD (Pediatrics), Fellowship in Neonatology',
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'doc-6',
    name: 'Dr. P. Rakesh',
    specialization: 'General Physician',
    hospital_id: 'hosp-1',
    department_id: 'dept-5',
    experience: '11 Years',
    rating: 4.8,
    reviews: 115,
    fee: 600,
    available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    available_hours_start: '08:30:00',
    available_hours_end: '16:30:00',
    education: 'MBBS, MD (General Medicine)',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400'
  }
];

interface FindDoctorPageProps {
  onBack?: () => void;
  onSelectDoctor?: (doctorId: string) => void;
}

export function FindDoctorPage({ onBack, onSelectDoctor }: FindDoctorPageProps = {}) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const q = query(collection(db, 'doctors'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const doctorsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));
      setDoctors(doctorsData.length > 0 ? doctorsData : FALLBACK_DOCTORS);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setDoctors(FALLBACK_DOCTORS);
    } finally {
      setLoading(false);
    }
  };

  const specialties = ['All Specialties', ...new Set(doctors.map(d => d.specialization || 'General Specialist'))];

  const filteredDoctors = doctors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (d.specialization || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All Specialties' || d.specialization === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  if (loading) {
    return (
      <MedicareWaveLoader 
        variant="card" 
        text="Discovering Clinical Specialists..." 
        subtitle="Retrieving verified doctors across Rajam, Vizag, and Srikakulam"
        className="my-12 min-h-[340px]"
      />
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto py-4">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors mb-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          ← Back to Homepage
        </button>
      )}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1 max-w-2xl">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Find a Specialist</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Consult with top-rated medical professionals in your area.</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name or specialty..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-12 py-4 shadow-sm"
              />
            </div>
            <div className="sm:w-56">
              <select 
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="input-field py-4 shadow-sm appearance-none cursor-pointer"
              >
                {specialties.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredDoctors.length === 0 ? (
          <div className="lg:col-span-2 card p-20 text-center">
            <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <User size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Specialists Found</h3>
            <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="card group overflow-hidden hover:border-blue-300 dark:hover:border-blue-900/50 transition-all duration-300">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-48 h-48 sm:h-auto overflow-hidden relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {doctor.image ? (
                    <img 
                      src={doctor.image} 
                      alt={doctor.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <User size={64} className="text-slate-300" />
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Star className="text-amber-400 fill-amber-400" size={14} />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{doctor.rating || '4.5'}</span>
                  </div>
                </div>
                
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{doctor.name}</h3>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{doctor.specialization || 'General Specialist'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consultation Fee</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-end">
                          <IndianRupee size={16} />{doctor.fee || '1200'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Award size={14} className="text-emerald-500" />
                        <span>{doctor.experience || '10+'} Exp.</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Briefcase size={14} className="text-blue-500" />
                        <span>{doctor.reviews || '50+'} Reviews</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium mt-4 line-clamp-1 italic">"{doctor.education || 'MBBS, MD Specialist'}"</p>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-2 flex items-center gap-3 border border-slate-100 dark:border-slate-800">
                      <Calendar size={16} className="text-blue-500" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Availability</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{doctor.available_days?.join(', ') || 'Contact for schedule'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onSelectDoctor ? onSelectDoctor(doctor.id) : (window as any).goToBooking?.(doctor.id)}
                      className="btn-primary px-6 py-3 text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-100 dark:shadow-none group/btn"
                    >
                      Book Now <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
