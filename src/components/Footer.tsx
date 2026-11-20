import React from 'react';
import { Mail, ShieldCheck, Lock, Calendar, FileText, Video, Pill, Receipt, Info, Users } from 'lucide-react';
import { OlmeraWordmark } from './brand/OlmeraWordmark';

interface FooterProps {
  setView: (view: any) => void;
}

export function Footer({ setView }: FooterProps) {
  const quickLinks = [
    { label: 'Consultations', icon: Calendar, view: 'hospitals' },
    { label: 'Diagnostic Reports', icon: FileText, view: 'patient-medical-reports' },
    { label: 'Telehealth', icon: Video, view: 'telemedicine' },
    { label: 'Prescriptions', icon: Pill, view: 'patient-prescriptions' },
    { label: 'Billing & Records', icon: Receipt, view: 'patient-billing' },
    { label: 'Find a Specialist', icon: Users, view: 'patient-find-doctor' },
  ];

  const pageLinks = [
    { label: 'About Olmera', view: 'about-us' },
    { label: 'Services', view: 'services' },
    { label: 'Contact', view: 'contact-us' },
  ];

  return (
    <footer className="mt-auto border-t border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)]">
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <OlmeraWordmark className="h-7 w-auto" />
            </div>
            <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider">
              Care, quietly connected.
            </p>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed font-ui">
              A refined healthcare platform connecting patients, specialists, and clinical diagnostics across Rajam, Vizag, and Srikakulam.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-widest font-ui">
              Quick Access
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link, i) => (
                <li key={i}>
                  <button
                    onClick={() => setView(link.view)}
                    className="text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)] dark:hover:text-white transition-colors font-ui flex items-center gap-2"
                  >
                    <link.icon size={13} className="text-[var(--color-line)]" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Pages */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-widest font-ui">
              Platform
            </h4>
            <ul className="space-y-2">
              {pageLinks.map((link, i) => (
                <li key={i}>
                  <button
                    onClick={() => setView(link.view)}
                    className="text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)] dark:hover:text-white transition-colors font-ui flex items-center gap-2"
                  >
                    <Info size={13} className="text-[var(--color-line)]" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-widest font-ui">
              Concierge Care
            </h4>
            <ul className="space-y-2.5 text-xs text-[var(--color-muted)] font-ui">
              <li className="flex items-center gap-2">
                <Mail size={13} className="text-[var(--color-primary)] flex-shrink-0" />
                <span className="truncate">care@olmera.health</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={13} className="text-[var(--color-primary)] flex-shrink-0" />
                <span>HIPAA & EHR Data Safeguarded</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock size={13} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                <span>Direct patient lines protected behind portal authentication</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--color-line)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--color-muted)] font-ui">
          <p>© {new Date().getFullYear()} Olmera Health. All rights reserved. Care, quietly connected.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-[var(--color-primary)] cursor-pointer">Privacy Charter</span>
            <span>•</span>
            <span className="hover:text-[var(--color-primary)] cursor-pointer">Clinical Standards</span>
            <span>•</span>
            <span className="hover:text-[var(--color-primary)] cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
