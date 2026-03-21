import React from 'react';
import { Bell, Search, User, Calendar, Activity, Settings, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  role: 'admin' | 'doctor' | 'patient';
  user: any;
  onToggleSidebar: () => void;
}

export function Header({ role, user, onToggleSidebar }: HeaderProps) {

  const getRoleLabel = () => {
    switch (role) {
      case 'admin': return 'Hospital Admin';
      case 'doctor': return 'Clinical Specialist';
      case 'patient': return 'Patient Portal';
      default: return 'MediCare';
    }
  };

  return (
    <header className="h-20 lg:h-24 bg-white/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 backdrop-blur-md transition-all duration-300 pt-[var(--safe-area-inset-top)]">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500"
        >
          <Menu size={24} />
        </button>
        <div className="flex flex-col">
          <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter truncate max-w-[150px] md:max-w-none">{getRoleLabel()}</h2>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Live</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-2.5 rounded-2xl focus-within:ring-4 focus-within:ring-blue-50 dark:focus-within:ring-blue-900/20 transition-all duration-300">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search Station..." 
            className="bg-transparent border-none outline-none text-sm w-48 xl:w-64 placeholder:text-slate-400 dark:text-white font-medium"
          />
        </div>

        <div className="hidden sm:flex items-center gap-3 pr-6 border-r border-slate-100 dark:border-slate-800">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900 dark:text-white leading-none capitalize">{user?.email?.split('@')[0]}</p>
            <p className="text-[10px] font-black text-[#1E88E5] uppercase tracking-widest mt-1">Verified {role}</p>
          </div>
          <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/30 text-[#1E88E5] dark:text-blue-400 rounded-2xl flex items-center justify-center font-black border-2 border-white dark:border-slate-800 shadow-xl shadow-blue-100/50 dark:shadow-none transition-transform hover:scale-105">
            {user?.email?.[0].toUpperCase()}
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2">
          <button className="p-3 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-all relative group">
            <Bell size={22} className="group-hover:text-[#1E88E5] transition-colors" />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></span>
          </button>
          <button className="p-3 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-all group">
            <Settings size={22} className="group-hover:text-[#1E88E5] transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
}
