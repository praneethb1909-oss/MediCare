import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './mobile/MobileBottomNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: any) => void;
  role: 'admin' | 'doctor' | 'patient';
  user: any;
}

export function DashboardLayout({ children, currentView, setView, role, user }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

  // Close sidebar on view change for mobile
  React.useEffect(() => {
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  }, [currentView]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex relative safe-area-padding">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && window.innerWidth <= 1024 && (
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
        className={`flex-1 flex flex-col transition-all duration-300 w-full ${
          isSidebarOpen && window.innerWidth > 1024 ? 'ml-64' : window.innerWidth > 1024 ? 'ml-20' : 'ml-0'
        }`}
      >
        <Header role={role} user={user} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      <MobileBottomNav currentView={currentView} setView={setView} role={role} />
    </div>
  );
}
