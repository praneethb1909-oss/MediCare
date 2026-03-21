import React from 'react';
import { 
  Home, 
  Calendar, 
  FileText, 
  Settings, 
  Bell, 
  MessageSquare, 
  User,
  Activity,
  Search,
  Plus
} from 'lucide-react';

interface MobileBottomNavProps {
  currentView: string;
  setView: (view: any) => void;
  role: 'admin' | 'doctor' | 'patient';
}

export function MobileBottomNav({ currentView, setView, role }: MobileBottomNavProps) {
  const getNavItems = () => {
    if (role === 'doctor') {
      return [
        { id: 'doctor-portal', label: 'Home', icon: Home },
        { id: 'doctor-appointments', label: 'Schedule', icon: Calendar },
        { id: 'doctor-notifications', label: 'Alerts', icon: Bell },
        { id: 'doctor-profile', label: 'Profile', icon: User },
      ];
    }
    if (role === 'admin') {
      return [
        { id: 'admin-portal', label: 'Stats', icon: Activity },
        { id: 'admin-medical-reports', label: 'Reports', icon: FileText },
        { id: 'admin-users', label: 'Users', icon: User },
        { id: 'settings', label: 'Config', icon: Settings },
      ];
    }
    return [
      { id: 'dashboard', label: 'Home', icon: Home },
      { id: 'patient-appointments', label: 'Visits', icon: Calendar },
      { id: 'patient-support', label: 'Chat', icon: MessageSquare },
      { id: 'patient-profile', label: 'Me', icon: User },
    ];
  };

  const items = getNavItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-50 lg:hidden safe-area-pb">
      {items.map((item) => {
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
      
      {role === 'patient' && (
        <button 
          onClick={() => setView('hospitals')}
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-200 dark:shadow-none flex items-center justify-center border-4 border-slate-50 dark:border-slate-950 active:scale-95 transition-transform"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
}
