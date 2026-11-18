import React from 'react';
import { Bell, Search, Settings, Menu } from 'lucide-react';
import { OlmeraWordmark } from './brand/OlmeraWordmark';

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
      default: return 'Olmera';
    }
  };

  return (
    <header className="h-20 lg:h-22 bg-[var(--color-surface)]/90 border-b border-[var(--color-line)] flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40 backdrop-blur-md transition-all duration-300 pt-[var(--safe-area-inset-top)]">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 hover:bg-[var(--color-surface-subtle)] rounded-xl text-[var(--color-muted)] z-50 relative"
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>

        {/* Brand Wordmark in Header */}
        <div className="flex items-center gap-4">
          <OlmeraWordmark className="h-7 w-auto" />
          <div className="hidden sm:block h-5 w-[1px] bg-[var(--color-line)]"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-muted)] font-sans">
              {getRoleLabel()}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] opacity-80"></span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <div className="hidden lg:flex items-center gap-2 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] px-3.5 py-2 rounded-xl focus-within:border-[var(--color-primary)] transition-all">
          <Search size={16} className="text-[var(--color-muted)]" />
          <input 
            type="text" 
            placeholder="Search records, specialists..." 
            className="bg-transparent border-none outline-none text-xs w-44 xl:w-56 placeholder:text-[var(--color-muted)] text-[var(--color-ink)] font-ui"
          />
        </div>

        <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-[var(--color-line)]">
          <div className="text-right">
            <p className="text-xs font-semibold text-[var(--color-ink)] leading-none capitalize">
              {user?.displayName || user?.email?.split('@')[0] || 'Patient'}
            </p>
            <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider mt-1 font-medium">
              Verified {role}
            </p>
          </div>
          <div className="w-9 h-9 bg-[var(--color-mist)] text-[var(--color-primary)] rounded-xl flex items-center justify-center font-bold text-xs border border-[var(--color-line)]">
            {(user?.displayName?.[0] || user?.email?.[0] || 'O').toUpperCase()}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            className="p-2 hover:bg-[var(--color-surface-subtle)] rounded-xl text-[var(--color-muted)] transition-colors relative"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-accent)] rounded-full"></span>
          </button>
          <button 
            className="p-2 hover:bg-[var(--color-surface-subtle)] rounded-xl text-[var(--color-muted)] transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
