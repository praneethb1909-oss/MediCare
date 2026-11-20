import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Calendar, Users, Building2, Settings, ChevronLeft, ChevronRight,
  LogOut, Bed, TestTube2, Pill, Receipt, Package, BarChart3, UserCog, FileText,
  ClipboardList, Bell, CircleUser as UserCircle, Search, MessageSquare, Info, Phone, Layers,
  Sun, Moon, UserCheck, Cpu
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { OlmeraWordmark } from './brand/OlmeraWordmark';
import logoMarkLight from '../../brand/assets/logo-mark-light-on-dark.svg';
import logoMarkDark from '../../brand/assets/logo-mark-dark-on-light.svg';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentView: string;
  setView: (view: any) => void;
  role: 'admin' | 'doctor' | 'patient';
}

export function Sidebar({ isOpen, setIsOpen, currentView, setView, role }: SidebarProps) {
  const { signOut } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !document.documentElement.classList.contains('dark');
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('olmera_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('olmera_theme', 'light');
    }
    setIsDarkMode(nextDark);
  };

  const menuItems = {
    admin: [
      { id: 'admin-portal', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'admin-patients', label: 'Patients', icon: Users },
      { id: 'admin-doctors', label: 'Specialists', icon: UserCheck },
      { id: 'admin-departments', label: 'Departments', icon: Building2 },
      { id: 'admin-beds', label: 'Beds & Wards', icon: Bed },
      { id: 'admin-medical-reports', label: 'Medical Reports', icon: FileText },
      { id: 'admin-lab', label: 'Diagnostics', icon: TestTube2 },
      { id: 'admin-pharmacy', label: 'Pharmacy', icon: Pill },
      { id: 'admin-billing', label: 'Billing & Insurance', icon: Receipt },
      { id: 'admin-inventory', label: 'Inventory', icon: Package },
      { id: 'admin-reports', label: 'Analytics', icon: BarChart3 },
      { id: 'admin-users', label: 'Roles & Staff', icon: UserCog },
      { id: 'about-us', label: 'About Olmera', icon: Info },
      { id: 'services', label: 'Services', icon: Layers },
      { id: 'contact-us', label: 'Contact', icon: Phone },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
    doctor: [
      { id: 'doctor-portal', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'doctor-appointments', label: 'Consultations', icon: Calendar },
      { id: 'doctor-patients', label: 'Patients', icon: Users },
      { id: 'doctor-medical-reports', label: 'Diagnostics', icon: FileText },
      { id: 'doctor-prescriptions', label: 'Prescriptions', icon: Pill },
      { id: 'doctor-notes', label: 'Clinical Notes', icon: ClipboardList },
      { id: 'doctor-notifications', label: 'Notifications', icon: Bell },
      { id: 'doctor-profile', label: 'Profile', icon: UserCircle },
      { id: 'about-us', label: 'About Olmera', icon: Info },
      { id: 'services', label: 'Services', icon: Layers },
      { id: 'contact-us', label: 'Contact', icon: Phone },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
    patient: [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'hospitals', label: 'Book Consultation', icon: Calendar },
      { id: 'patient-appointments', label: 'My Consultations', icon: ClipboardList },
      { id: 'patient-medical-reports', label: 'Lab Reports', icon: FileText },
      { id: 'patient-prescriptions', label: 'Prescriptions', icon: Pill },
      { id: 'patient-billing', label: 'Billing & Records', icon: Receipt },
      { id: 'patient-find-doctor', label: 'Find Specialist', icon: Search },
      { id: 'patient-find-hospital', label: 'Network Clinics', icon: Building2 },
      { id: 'patient-support', label: 'Care Concierge', icon: MessageSquare },
      { id: 'patient-profile', label: 'My Profile', icon: UserCircle },
      { id: 'about-us', label: 'About Olmera', icon: Info },
      { id: 'services', label: 'Services', icon: Layers },
      { id: 'contact-us', label: 'Contact', icon: Phone },
      { id: 'settings', label: 'Settings', icon: Settings },
    ]
  };

  const items = menuItems[role] || [];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 h-screen bg-[var(--color-surface)] border-r border-[var(--color-line)] transition-all duration-300 z-50 pt-[var(--safe-area-inset-top)] pb-[var(--safe-area-inset-bottom)] ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20 w-64'
        }`}
    >
      <div className="flex flex-col h-full">
        {/* Header Branding */}
        <div className="p-4 md:p-5 flex items-center justify-between border-b border-[var(--color-line)]/50 min-h-[72px]">
          {isOpen ? (
            <div className="flex items-center gap-3">
              <OlmeraWordmark className="h-7 w-auto" />
            </div>
          ) : (
            <div className="hidden lg:flex justify-center w-full">
              <img src={logoMarkDark} alt="Olmera" className="h-7 w-7 block dark:hidden" />
              <img src={logoMarkLight} alt="Olmera" className="h-7 w-7 hidden dark:block" />
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-[var(--color-surface-subtle)] rounded-lg transition-colors text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            aria-label={isOpen ? "Collapse navigation" : "Expand navigation"}
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {items.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`sidebar-item w-full ${isActive ? 'sidebar-item-active' : ''} ${!isOpen && 'justify-center px-0'
                  }`}
                title={!isOpen ? item.label : ''}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {isOpen && <span className="font-ui text-sm truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer Utilities */}
        <div className="p-3 border-t border-[var(--color-line)] space-y-1">
          <button
            onClick={toggleDarkMode}
            className={`sidebar-item w-full ${!isOpen && 'justify-center px-0'}`}
            title={!isOpen ? 'Toggle Mode' : ''}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            {isOpen && <span className="text-sm font-ui">{isDarkMode ? 'Light Parchment' : 'Dark Mode'}</span>}
          </button>

          <button
            onClick={() => signOut()}
            className={`sidebar-item w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 ${!isOpen && 'justify-center px-0'
              }`}
            title={!isOpen ? 'Logout' : ''}
          >
            <LogOut size={18} />
            {isOpen && <span className="text-sm font-ui">Log Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
