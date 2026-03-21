import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Stethoscope, 
  Building2, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Activity,
  Bed,
  TestTube2,
  Pill,
  Receipt,
  Package,
  BarChart3,
  UserCog,
  FileText,
  ClipboardList,
  Bell,
  UserCircle,
  Search,
  MessageSquare,
  HelpCircle,
  Moon,
  Sun,
  Info,
  Phone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentView: string;
  setView: (view: any) => void;
  role: 'admin' | 'doctor' | 'patient';
}

export function Sidebar({ isOpen, setIsOpen, currentView, setView, role }: SidebarProps) {
  const { signOut } = useAuth();
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const menuItems = {
    admin: [
      { id: 'admin-portal', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'admin-patients', label: 'Patient Management', icon: Users },
      { id: 'admin-doctors', label: 'Doctor Management', icon: Stethoscope },
      { id: 'admin-departments', label: 'Departments', icon: Building2 },
      { id: 'admin-beds', label: 'Beds & Wards', icon: Bed },
      { id: 'admin-medical-reports', label: 'Medical Reports', icon: FileText },
      { id: 'admin-lab', label: 'Lab & Diagnostics', icon: TestTube2 },
      { id: 'admin-pharmacy', label: 'Pharmacy', icon: Pill },
      { id: 'admin-billing', label: 'Billing & Insurance', icon: Receipt },
      { id: 'admin-inventory', label: 'Inventory', icon: Package },
      { id: 'admin-reports', label: 'Reports & Analytics', icon: BarChart3 },
      { id: 'admin-users', label: 'Roles & Users', icon: UserCog },
      { id: 'about-us', label: 'About Us', icon: Info },
      { id: 'contact-us', label: 'Contact Us', icon: Phone },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
    doctor: [
      { id: 'doctor-portal', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'doctor-appointments', label: 'My Appointments', icon: Calendar },
      { id: 'doctor-patients', label: 'My Patients', icon: Users },
      { id: 'doctor-medical-reports', label: 'Medical Reports', icon: FileText },
      { id: 'doctor-prescriptions', label: 'Prescriptions', icon: Pill },
      { id: 'doctor-notes', label: 'Case Notes', icon: ClipboardList },
      { id: 'doctor-notifications', label: 'Notifications', icon: Bell },
      { id: 'doctor-profile', label: 'Profile', icon: UserCircle },
      { id: 'about-us', label: 'About Us', icon: Info },
      { id: 'contact-us', label: 'Contact Us', icon: Phone },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
    patient: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'hospitals', label: 'Book Appointment', icon: Calendar },
      { id: 'patient-appointments', label: 'My Appointments', icon: ClipboardList },
      { id: 'patient-medical-reports', label: 'Medical Reports', icon: FileText },
      { id: 'patient-prescriptions', label: 'Prescriptions', icon: Pill },
      { id: 'patient-billing', label: 'Billing & Payments', icon: Receipt },
      { id: 'patient-find-doctor', label: 'Find Doctor', icon: Search },
      { id: 'patient-find-hospital', label: 'Find Hospital', icon: Building2 },
      { id: 'patient-support', label: 'Support / Chat', icon: MessageSquare },
      { id: 'patient-profile', label: 'Profile', icon: UserCircle },
      { id: 'about-us', label: 'About Us', icon: Info },
      { id: 'contact-us', label: 'Contact Us', icon: Phone },
      { id: 'settings', label: 'Settings', icon: Settings },
    ]
  };

  const items = menuItems[role] || [];

  return (
    <aside 
      className={`fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-all duration-300 z-50 pt-[var(--safe-area-inset-top)] pb-[var(--safe-area-inset-bottom)] hidden lg:block ${
        isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 w-20'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 md:p-6 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!isOpen && 'hidden lg:flex lg:opacity-0 lg:w-0'}`}>
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">MediCare</span>
          </div>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`sidebar-item w-full ${
                currentView === item.id ? 'sidebar-item-active' : ''
              } ${!isOpen && 'justify-center px-0'}`}
              title={!isOpen ? item.label : ''}
            >
              <item.icon size={20} />
              {isOpen && <span className="font-medium truncate text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={toggleDarkMode}
            className={`sidebar-item w-full ${!isOpen && 'justify-center px-0'}`}
            title={!isOpen ? 'Toggle Theme' : ''}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {isOpen && <span className="font-medium text-sm">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          
          <button
            onClick={() => signOut()}
            className={`sidebar-item w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 ${
              !isOpen && 'justify-center px-0'
            }`}
            title={!isOpen ? 'Logout' : ''}
          >
            <LogOut size={20} />
            {isOpen && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
