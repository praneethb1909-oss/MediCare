import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './mobile/MobileBottomNav';
import { Footer } from './Footer';
import { OlmeraAIAssistant } from './OlmeraAIAssistant';
import { Sparkles } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: any) => void;
  role: 'admin' | 'doctor' | 'patient';
  user: any;
}

export function DashboardLayout({ children, currentView, setView, role, user }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Close sidebar on view change for mobile
  useEffect(() => {
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  }, [currentView]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] flex flex-col relative safe-area-padding">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity animate-fadeIn lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        currentView={currentView}
        setView={setView}
        role={role}
      />
      <main
        className={`flex-1 flex flex-col transition-all duration-300 w-full min-h-screen ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
          }`}
      >
        <Header role={role} user={user} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-24 md:pb-8">
          <div className="w-full max-w-[1536px] mx-auto">
            {children}
          </div>
        </div>
        <Footer setView={setView} />
      </main>

      {/* Floating Olmera AI Assistant Trigger */}
      {!isAIOpen && (
        <button
          onClick={() => setIsAIOpen(true)}
          className="fixed bottom-20 md:bottom-8 right-5 z-40 flex items-center gap-2.5 px-4 py-3 bg-[var(--color-primary)] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 group"
          aria-label="Open Olmera AI Healthcare Assistant"
        >
          <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
            <Sparkles size={16} className="text-[var(--color-mist)] group-hover:rotate-12 transition-transform" />
          </div>
          <span className="font-ui font-semibold text-xs tracking-wide hidden sm:inline">Ask Olmera AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      )}

      {/* Floating Olmera AI Assistant Window */}
      {isAIOpen && (
        <OlmeraAIAssistant
          isFloating={true}
          isOpen={isAIOpen}
          onClose={() => setIsAIOpen(false)}
        />
      )}

      <MobileBottomNav currentView={currentView} setView={setView} role={role} />
    </div>
  );
}
