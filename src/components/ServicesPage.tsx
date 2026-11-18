import React from 'react';
import { Activity, Calendar, Video, Pill, FileText, Receipt, Ambulance, Microscope, ShieldCheck, Clock, Building2, Users } from 'lucide-react';

const services = [
  {
    icon: Calendar,
    title: 'Appointment Booking',
    desc: 'Schedule in-person and tele-consultation appointments with specialists across cardiology, pediatrics, orthopedics, neurology, and more. Real-time slot availability with automated confirmation.',
  },
  {
    icon: Video,
    title: 'Telemedicine',
    desc: 'Connect with doctors remotely through secure video consultations. Ideal for follow-ups, second opinions, and patients in regional areas around Rajam, Vizag, and Srikakulam.',
  },
  {
    icon: FileText,
    title: 'Medical Records Access',
    desc: 'View lab reports, imaging results, and clinical notes in one place. Records are encrypted at rest and accessible only to you and your authorized care team.',
  },
  {
    icon: Pill,
    title: 'Digital Prescriptions',
    desc: 'Doctors issue prescriptions digitally, which are instantly available in your patient portal. Track medication history and set dosage reminders.',
  },
  {
    icon: Receipt,
    title: 'Billing & Insurance',
    desc: 'Transparent billing with itemized invoices, insurance claim tracking, and secure online payments. No surprise charges — every cost is visible before you pay.',
  },
  {
    icon: Ambulance,
    title: 'Emergency Dispatch',
    desc: 'One-tap SOS to dispatch an ambulance with GPS tracking, or book an emergency consultation with an on-call specialist. Average response time under 12 minutes in serviced areas.',
  },
  {
    icon: Microscope,
    title: 'Lab & Diagnostics',
    desc: 'Book lab tests and diagnostic scans through partner laboratories. Results are delivered directly to your medical records within 24–48 hours.',
  },
  {
    icon: Building2,
    title: 'Hospital & Bed Management',
    desc: 'Real-time bed availability across wards, ICU, and general rooms. Hospital administrators can manage occupancy, staff allocation, and department workflows from a single dashboard.',
  },
];

const stats = [
  { icon: Users, value: '50+', label: 'Specialists' },
  { icon: Building2, value: '4', label: 'Network Hospitals' },
  { icon: Clock, value: '24/7', label: 'Availability' },
  { icon: ShieldCheck, value: 'AES-256', label: 'Encryption' },
];

export function ServicesPage() {
  return (
    <div className="space-y-12 animate-fadeIn relative pb-20 font-ui text-[var(--color-ink)]">
      {/* Header */}
      <div className="text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-subtle)] rounded-full text-[var(--color-primary)] text-xs font-semibold uppercase tracking-widest border border-[var(--color-line)]">
          <Activity size={14} /> Clinical Services
        </div>
        <h1 className="text-4xl lg:text-6xl font-display font-semibold text-[var(--color-ink)] tracking-tight leading-[1.15]">
          Everything you need for <br />
          <span className="text-[var(--color-primary)]">quietly connected care.</span>
        </h1>
        <p className="text-[var(--color-muted)] text-lg font-normal max-w-2xl mx-auto leading-relaxed">
          From booking your initial consultation to accessing digital prescriptions, Olmera unifies your complete healthcare journey into a serene digital experience.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card p-6 text-center bg-[var(--color-surface)] border-[var(--color-line)] shadow-sm">
            <div className="w-12 h-12 bg-[var(--color-surface-subtle)] rounded-2xl flex items-center justify-center text-[var(--color-primary)] mx-auto mb-3 border border-[var(--color-line)]">
              <stat.icon size={22} />
            </div>
            <p className="text-2xl font-display font-semibold text-[var(--color-ink)]">{stat.value}</p>
            <p className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service, i) => (
          <div key={i} className="card p-6 bg-[var(--color-surface)] border-[var(--color-line)] shadow-sm hover:border-[var(--color-primary)] transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-[var(--color-surface-subtle)] text-[var(--color-primary)] rounded-2xl flex items-center justify-center mb-4 border border-[var(--color-line)] group-hover:scale-105 transition-transform">
                <service.icon size={22} />
              </div>
              <h3 className="font-display font-semibold text-lg text-[var(--color-ink)] mb-2">{service.title}</h3>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">{service.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
