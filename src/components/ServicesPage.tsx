import React from 'react';
import { Activity, Calendar, Video, Pill, FileText, Receipt, Stethoscope, Ambulance, Microscope, ShieldCheck, Clock, Building2 } from 'lucide-react';

const services = [
  {
    icon: Calendar,
    title: 'Appointment Booking',
    desc: 'Schedule in-person and tele-consultation appointments with specialists across cardiology, pediatrics, orthopedics, neurology, and more. Real-time slot availability with automated confirmation.',
    color: 'blue',
  },
  {
    icon: Video,
    title: 'Telemedicine',
    desc: 'Connect with doctors remotely through secure video consultations. Ideal for follow-ups, second opinions, and patients in rural areas around Rajam, Vizag, and Srikakulam.',
    color: 'emerald',
  },
  {
    icon: FileText,
    title: 'Medical Records Access',
    desc: 'View lab reports, imaging results, and clinical notes in one place. Records are encrypted at rest and accessible only to you and your authorized care team.',
    color: 'slate',
  },
  {
    icon: Pill,
    title: 'Digital Prescriptions',
    desc: 'Doctors issue prescriptions digitally, which are instantly available in your patient portal. Track medication history and set dosage reminders.',
    color: 'teal',
  },
  {
    icon: Receipt,
    title: 'Billing & Insurance',
    desc: 'Transparent billing with itemized invoices, insurance claim tracking, and secure online payments. No surprise charges — every cost is visible before you pay.',
    color: 'amber',
  },
  {
    icon: Ambulance,
    title: 'Emergency Dispatch',
    desc: 'One-tap SOS to dispatch an ambulance with GPS tracking, or book an emergency consultation with an on-call specialist. Average response time under 12 minutes in serviced areas.',
    color: 'red',
  },
  {
    icon: Microscope,
    title: 'Lab & Diagnostics',
    desc: 'Book lab tests and diagnostic scans through partner laboratories. Results are delivered directly to your medical records within 24–48 hours.',
    color: 'indigo',
  },
  {
    icon: Building2,
    title: 'Hospital & Bed Management',
    desc: 'Real-time bed availability across wards, ICU, and general rooms. Hospital administrators can manage occupancy, staff allocation, and department workflows from a single dashboard.',
    color: 'cyan',
  },
];

const stats = [
  { icon: Stethoscope, value: '50+', label: 'Specialists' },
  { icon: Building2, value: '3', label: 'Partner Hospitals' },
  { icon: Clock, value: '24/7', label: 'Availability' },
  { icon: ShieldCheck, value: 'AES-256', label: 'Encryption' },
];

export function ServicesPage() {
  return (
    <div className="space-y-12 animate-fadeIn relative pb-20">
      {/* Header */}
      <div className="text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
          <Activity size={14} /> Our Services
        </div>
        <h1 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
          Everything you need for <br />
          <span className="text-blue-600">connected healthcare.</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
          From booking your first appointment to managing long-term prescriptions, MediCare brings the entire hospital experience online.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card p-6 text-center">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-3">
              <stat.icon size={24} />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service, i) => (
          <div key={i} className="card p-8 group hover:-translate-y-1 transition-all duration-300">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform bg-${service.color}-50 dark:bg-${service.color}-900/20 text-${service.color}-600 dark:text-${service.color}-400`}>
              <service.icon size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">{service.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-sm">{service.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#1E88E5] to-[#1565C0] rounded-3xl p-10 text-white text-center space-y-4 shadow-2xl shadow-blue-200 dark:shadow-none">
        <h2 className="text-3xl font-black tracking-tight">Ready to get started?</h2>
        <p className="text-blue-100 font-medium max-w-lg mx-auto">
          Book your first appointment in under two minutes. No paperwork, no waiting rooms.
        </p>
        <button
          onClick={() => (window as any).setView?.('hospitals')}
          className="px-8 py-4 bg-white text-[#1E88E5] rounded-xl font-black uppercase tracking-widest text-sm hover:bg-blue-50 transition-all active:scale-95 shadow-lg"
        >
          Book an Appointment
        </button>
      </div>
    </div>
  );
}
