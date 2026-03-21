import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, ArrowLeft, CheckCircle, User, Video } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
  hospital_id?: string;
  available_days: string[];
  available_hours_start: string;
  available_hours_end: string;
  fee?: number;
}

interface BookingFormProps {
  doctorId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function BookingForm({ doctorId, onBack, onSuccess }: BookingFormProps) {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<'In-person' | 'Tele-consultation'>('In-person');
  const [isEmergency, setIsEmergency] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [dayFullyBooked, setDayFullyBooked] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const loadDoctor = useCallback(async () => {
    try {
      const docRef = doc(db, 'doctors', doctorId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setDoctor({ id: docSnap.id, ...docSnap.data() } as Doctor);
      }
    } catch (error) {
      console.error('Error loading doctor:', error);
    }
  }, [doctorId]);

  useEffect(() => {
    loadDoctor();
  }, [loadDoctor]);

  const loadBookedSlots = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'appointments'),
        where('doctor_id', '==', doctorId),
        where('appointment_date', '==', appointmentDate)
      );
      const querySnapshot = await getDocs(q);
      const validDocs = querySnapshot.docs
        .filter(doc => doc.data().status !== 'cancelled')
      const booked = validDocs.map(doc => doc.data().appointment_time);
      setBookedSlots(booked);
      // Daily capacity rule
      const MAX_APPTS_PER_DAY = 20;
      setDayFullyBooked(validDocs.length >= MAX_APPTS_PER_DAY);
    } catch (error) {
      console.error('Error loading booked slots:', error);
    }
  }, [appointmentDate, doctorId]);

  useEffect(() => {
    if (appointmentDate && doctorId) {
      loadBookedSlots();
    }
  }, [appointmentDate, doctorId, loadBookedSlots]);

  

  const generateTimeSlots = () => {
    if (!doctor) return [];
    if (dayFullyBooked) return [];

    const slots = [];
    const start = parseInt(doctor.available_hours_start.split(':')[0]);
    const end = parseInt(doctor.available_hours_end.split(':')[0]);

    for (let hour = start; hour < end; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30:00`);
    }

    return slots.filter(slot => !bookedSlots.includes(slot));
  };

  const isDateAvailable = (date: string) => {
    if (!doctor) return false;
    const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
    // Default to Mon-Sat if not provided
    const defaultDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const allowedDays = (doctor.available_days && doctor.available_days.length > 0) ? doctor.available_days : defaultDays;
    if (isEmergency) {
      // Allow Sunday for emergencies
      return allowedDays.includes(dayName) || dayName === 'Sunday';
    }
    return allowedDays.includes(dayName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // For development purposes, if skip login is enabled, we allow a mock user ID
      const effectiveUserId = user?.uid || 'dev-user-id';
      
      if (!isDateAvailable(appointmentDate)) {
        throw new Error('Doctor is not available on this day');
      }

      // Final check for slot availability
      const checkQuery = query(
        collection(db, 'appointments'),
        where('doctor_id', '==', doctorId),
        where('appointment_date', '==', appointmentDate),
        where('appointment_time', '==', appointmentTime)
      );
      const checkSnapshot = await getDocs(checkQuery);
      const isActuallyBooked = checkSnapshot.docs.some(doc => doc.data().status !== 'cancelled');
      
      if (isActuallyBooked) {
        throw new Error('This time slot has just been booked. Please choose another one.');
      }

      await addDoc(collection(db, 'appointments'), {
        patient_id: effectiveUserId,
        doctor_id: doctorId,
        doctor_name: doctor?.name || null,
        hospital_id: doctor?.hospital_id || null,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        type: isEmergency ? 'emergency' : appointmentType,
        notes: notes || null,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="card p-12 text-center max-w-lg mx-auto animate-fadeIn">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
        <p className="text-slate-500 mb-8">Your appointment request has been sent to Dr. {doctor?.name}. You'll receive a notification once it's confirmed.</p>
        <div className="animate-pulse flex items-center justify-center gap-2 text-blue-600 font-bold">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          Redirecting to Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 font-medium transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Specialist
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Doctor Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-4 shadow-sm">
                <User size={48} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{doctor?.name}</h3>
              <p className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-6">{doctor?.specialization}</p>
              
              <div className="w-full space-y-4 pt-6 border-t border-slate-50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Consultation</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    ₹{(doctor?.fee ?? 1200).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-300">Duration</span>
                  <span className="font-bold text-slate-900 dark:text-white">30 Mins</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-2">
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar size={24} className="text-blue-600" />
              Book Consultation
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Appointment Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar size={16} />
                    </div>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  {appointmentDate && !isDateAvailable(appointmentDate) && (
                    <p className="text-xs text-red-500 font-bold mt-1">Specialist is not available on this day.</p>
                  )}
                  {appointmentDate && dayFullyBooked && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">Fully booked for the selected day.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Available Time</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Clock size={16} />
                    </div>
                    <select
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm appearance-none"
                      required
                      disabled={!appointmentDate || !isDateAvailable(appointmentDate) || dayFullyBooked}
                    >
                      <option value="">Select Time Slot</option>
                      {generateTimeSlots().map((slot) => (
                        <option key={slot} value={slot}>
                          {slot.slice(0, 5)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Consultation Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAppointmentType('In-person')}
                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      appointmentType === 'In-person'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 dark:text-blue-300 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-200 dark:hover:border-slate-600'
                    }`}
                  >
                    <User size={20} />
                    <span className="font-bold">In-person</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppointmentType('Tele-consultation')}
                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      appointmentType === 'Tele-consultation'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 dark:text-blue-300 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-200 dark:hover:border-slate-600'
                    }`}
                  >
                    <Video size={20} />
                    <span className="font-bold">Tele-consultation</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Emergency</label>
                <label className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
                  <input type="checkbox" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} />
                  Allow Sundays for emergency booking
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Reason for Visit (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm min-h-[120px] resize-none"
                  placeholder="Tell us more about your symptoms..."
                ></textarea>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-bold border border-red-100 dark:border-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !appointmentDate || !appointmentTime || !isDateAvailable(appointmentDate) || dayFullyBooked}
                className="w-full btn-primary py-4 text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Confirm Appointment
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
