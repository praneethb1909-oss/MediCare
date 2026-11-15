import React from 'react';
import { Activity, Mail, Phone, MapPin, Calendar, FileText, Video, Pill, Receipt, Info, Stethoscope } from 'lucide-react';

interface FooterProps {
  setView: (view: any) => void;
}

export function Footer({ setView }: FooterProps) {
  const quickLinks = [
    { label: 'Book Appointment', icon: Calendar, view: 'hospitals' },
    { label: 'Medical Reports', icon: FileText, view: 'patient-medical-reports' },
    { label: 'Telemedicine', icon: Video, view: 'telemedicine' },
    { label: 'Prescriptions', icon: Pill, view: 'patient-prescriptions' },
    { label: 'Billing & Payments', icon: Receipt, view: 'patient-billing' },
    { label: 'Find a Doctor', icon: Stethoscope, view: 'patient-find-doctor' },
  ];

  const pageLinks = [
    { label: 'About Us', view: 'about-us' },
    { label: 'Services', view: 'services' },
    { label: 'Contact Us', view: 'contact-us' },
  ];

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight">MediCare</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              A hospital management platform connecting patients, doctors, and administrators across Rajam, Vizag, and Srikakulam, Andhra Pradesh.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Access</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, i) => (
                <li key={i}>
                  <button
                    onClick={() => setView(link.view)}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-2"
                  >
                    <link.icon size={14} className="text-slate-300 dark:text-slate-600" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Pages */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Information</h4>
            <ul className="space-y-2">
              {pageLinks.map((link, i) => (
                <li key={i}>
                  <button
                    onClick={() => setView(link.view)}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-2"
                  >
                    <Info size={14} className="text-slate-300 dark:text-slate-600" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:praneethb1909@gmail.com" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-2">
                  <Mail size={14} className="text-slate-300 dark:text-slate-600" />
                  praneethb1909@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+917032130919" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-2">
                  <Phone size={14} className="text-slate-300 dark:text-slate-600" />
                  +91 70321 30919
                </a>
              </li>
              <li className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                <MapPin size={14} className="text-slate-300 dark:text-slate-600" />
                Rajam, Andhra Pradesh, IN
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 font-medium">
            {new Date().getFullYear()} MediCare. Built for better healthcare access in Andhra Pradesh.
          </p>
          <p className="text-xs text-slate-400 font-medium">
            For emergencies, call <span className="font-bold text-red-500">108</span> or use the in-app SOS button.
          </p>
        </div>
      </div>
    </footer>
  );
}
