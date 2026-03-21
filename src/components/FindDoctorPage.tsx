import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Calendar, Clock, ChevronRight, User, Filter, Building2, Phone, Mail, IndianRupee, Award, Briefcase } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';

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

export function FindDoctorPage() {
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
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setDoctors([]);
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
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
                      onClick={() => (window as any).goToBooking(doctor.id)}
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
