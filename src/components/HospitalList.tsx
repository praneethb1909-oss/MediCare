import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { Building2, ChevronRight, Search, MapPin, Star, Activity, Phone, Mail, Users } from 'lucide-react';

interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  description: string;
  image_url: string;
}

interface HospitalListProps {
  onSelectHospital: (hospitalId: string) => void;
}

export function HospitalList({ onSelectHospital }: HospitalListProps) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');

  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    try {
      const q = query(collection(db, 'hospitals'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const hospitalsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hospital));

      setHospitals(hospitalsData);
    } catch (error) {
      console.error('Error loading hospitals:', error);
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         h.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'All Cities' || h.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const cities = ['All Cities', ...new Set(hospitals.map(h => h.city))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1 max-w-2xl">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Find Healthcare</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Search and filter top-rated hospitals and medical centers.</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search hospital name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-12 py-4 shadow-sm"
              />
            </div>
            <div className="sm:w-48">
              <select 
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="input-field py-4 shadow-sm appearance-none cursor-pointer"
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {filteredHospitals.length === 0 ? (
        <div className="card p-20 text-center">
          <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Search size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Hospitals Found</h3>
          <p className="text-slate-500 dark:text-slate-400">Try adjusting your search terms or filters.</p>
          <button onClick={() => { setSearchTerm(''); setSelectedCity('All Cities'); }} className="btn-primary mt-6">Clear All Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredHospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="card group overflow-hidden flex flex-col md:flex-row h-full hover:border-blue-300 dark:hover:border-blue-900/50"
            >
              <div className="w-full md:w-2/5 h-48 md:h-auto overflow-hidden relative">
                <img
                  src={hospital.image_url || `https://images.unsplash.com/photo-1587350859728-117692273fd1?auto=format&fit=crop&q=80&w=800`}
                  alt={hospital.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 flex items-center gap-1 text-white">
                  <Star className="text-amber-400 fill-amber-400" size={14} />
                  <span className="text-xs font-bold">4.8 (120 reviews)</span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{hospital.name}</h3>
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mt-1">
                        <MapPin size={12} />
                        <span className="text-xs font-medium">{hospital.city}</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-xl">
                      <Building2 size={20} />
                    </div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2 mt-4 leading-relaxed">{hospital.description}</p>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {['Emergency', 'Cardiology', 'Neurology'].map((spec, i) => (
                      <span key={i} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-100 dark:border-slate-700">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => onSelectHospital(hospital.id)}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 group/btn"
                  >
                    <span className="text-sm">Book Appointment</span>
                    <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  <button className="btn-outline p-3">
                    <Activity size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
