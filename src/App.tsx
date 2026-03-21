import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { DepartmentList } from './components/DepartmentList';
import { DoctorList } from './components/DoctorList';
import { BookingForm } from './components/BookingForm';
import { HospitalList } from './components/HospitalList';
import { DoctorPortal } from './components/DoctorPortal';
import { DoctorPatients } from './components/DoctorPatients';
import { CaseNotes } from './components/CaseNotes';
import { AdminPortal } from './components/AdminPortal';
import { DashboardLayout } from './components/DashboardLayout';
import { PaymentPage } from './components/PaymentPage';
import { ProfilePage } from './components/ProfilePage';
import { MedicalReportPage } from './components/MedicalReportPage';
import { MyAppointments } from './components/MyAppointments';
import { PrescriptionsPage } from './components/PrescriptionsPage';
import { BillingPage } from './components/BillingPage';
import { FindDoctorPage } from './components/FindDoctorPage';
import { SupportChatPage } from './components/SupportChatPage';
import { NotificationsPage } from './components/NotificationsPage';
import { SettingsPage } from './components/SettingsPage';
import { TelemedicineUI } from './components/TelemedicineUI';
import { Activity } from 'lucide-react';

type View = 
  // Admin Views
  | 'admin-portal' | 'admin-patients' | 'admin-doctors' | 'admin-departments' 
  | 'admin-beds' | 'admin-lab' | 'admin-pharmacy' | 'admin-billing' 
  | 'admin-inventory' | 'admin-reports' | 'admin-users' 
  | 'admin-medical-reports' | 'admin-files' | 'admin-payments' | 'admin-notifications'
  // Doctor Views
  | 'doctor-portal' | 'doctor-appointments' | 'doctor-patients' | 'doctor-records' 
  | 'doctor-lab' | 'doctor-prescriptions' | 'doctor-notes' | 'doctor-notifications' | 'doctor-profile'
  | 'doctor-medical-reports' | 'doctor-settings'
  // Patient Views
  | 'dashboard' | 'hospitals' | 'departments' | 'doctors' | 'booking' | 'payment'
  | 'patient-appointments' | 'patient-records' | 'patient-lab' | 'patient-prescriptions' 
  | 'patient-billing' | 'patient-find-doctor' | 'patient-find-hospital' | 'patient-support' | 'patient-profile'
  | 'patient-medical-reports' | 'patient-notifications'
  | 'telemedicine' | 'bed-availability' | 'pharmacy' | 'ambulance'
  | 'settings';

interface ViewState {
  current: View;
  selectedHospital?: string;
  selectedDepartment?: string;
  selectedDoctor?: string;
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="card p-12 text-center animate-fadeIn">
      <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Activity className="text-blue-600 dark:text-blue-400 w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{title}</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        This module is currently under development. Our team is working hard to bring you the best experience for {title.toLowerCase()}.
      </p>
      <button className="btn-primary mt-8">Learn More</button>
    </div>
  );
}

function AppContent() {
  const { user, loading, role } = useAuth();
  const [viewState, setViewState] = useState<ViewState>({ 
    current: 'dashboard' 
  });

  // Native Mobile Configuration
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#2563eb' });

      const backListener = CapApp.addListener('backButton', () => {
        if (['dashboard', 'doctor-portal', 'admin-portal'].includes(viewState.current)) {
          CapApp.exitApp();
        } else {
          const homeView = role === 'doctor' ? 'doctor-portal' : role === 'admin' ? 'admin-portal' : 'dashboard';
          setViewState({ current: homeView as View });
        }
      });

      return () => {
        backListener.then(l => l.remove());
      };
    }
  }, [viewState.current, role]);

  // Handle Initial Role-Based Redirect
  useEffect(() => {
    if (!loading && user && role) {
      const homeView = role === 'doctor' ? 'doctor-portal' : role === 'admin' ? 'admin-portal' : 'dashboard';
      setViewState({ current: homeView as View });
    }
  }, [role, user, loading]);

  const setView = useCallback((view: View) => {
    setViewState({ current: view });
  }, []);

  // Expose setView globally for quick component access
  useEffect(() => {
    (window as any).setView = setView;
    (window as any).goToBooking = (doctorId: string) => {
      setViewState(prev => ({ ...prev, current: 'booking', selectedDoctor: doctorId }));
    };
    
    // Listen for custom navigation events
    const handleNav = (e: any) => setView(e.detail);
    window.addEventListener('navigate', handleNav);
    return () => window.removeEventListener('navigate', handleNav);
  }, [setView]);

  const navigateToDoctors = (departmentId: string) => {
    setViewState({ current: 'doctors', selectedDepartment: departmentId, selectedHospital: viewState.selectedHospital });
  };

  const navigateToBooking = (doctorId: string) => {
    setViewState({ ...viewState, current: 'booking', selectedDoctor: doctorId });
  };

  const selectHospital = (hospitalId: string) => {
    setViewState({ current: 'departments', selectedHospital: hospitalId });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading MediCare...</p>
        </div>
      </div>
    );
  }

  const isDevelopmentSkipLogin = false;
  if (!user && !isDevelopmentSkipLogin) {
    return <Auth />;
  }

  const currentUser = user || (isDevelopmentSkipLogin ? { email: 'dev.user@medicare.in', uid: 'dev-user-id' } : null);
  const currentRole = role || (isDevelopmentSkipLogin ? 'patient' : null);

  const renderContent = () => {
    // Role-Based Routing
    if (currentRole === 'doctor') {
      switch (viewState.current) {
        case 'doctor-portal': return <DoctorPortal />;
        case 'doctor-appointments': return <MyAppointments />;
        case 'doctor-patients': return <DoctorPatients />;
        case 'doctor-notes': return <CaseNotes />;
        case 'doctor-prescriptions': return <PrescriptionsPage />;
        case 'doctor-notifications': return <NotificationsPage />;
        case 'doctor-medical-reports': return <MedicalReportPage />;
        case 'doctor-settings': return <SettingsPage />;
        default: return <DoctorPortal />;
      }
    }

    if (currentRole === 'admin') {
      return <AdminPortal />; // AdminPortal handles its own internal tabs
    }

    // Patient Views (Default)
    switch (viewState.current) {
      case 'dashboard': return <Dashboard onBookNew={() => setView('hospitals')} />;
      case 'hospitals': return <HospitalList onSelectHospital={selectHospital} />;
      case 'departments':
        return viewState.selectedHospital ? (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Select Department</h2>
            <DepartmentList onSelectDepartment={navigateToDoctors} />
          </div>
        ) : <HospitalList onSelectHospital={selectHospital} />;
      case 'doctors':
        return viewState.selectedDepartment ? (
          <DoctorList
            departmentId={viewState.selectedDepartment}
            hospitalId={viewState.selectedHospital}
            onSelectDoctor={navigateToBooking}
            onBack={() => setView('departments')}
          />
        ) : null;
      case 'booking':
        return viewState.selectedDoctor ? (
          <BookingForm
            doctorId={viewState.selectedDoctor}
            onBack={() => setView('doctors')}
            onSuccess={() => setView('payment')}
          />
        ) : null;
      case 'payment':
        return <PaymentPage amount={1200} onSuccess={() => setView('dashboard')} onCancel={() => setView('dashboard')} />;
      case 'patient-appointments': return <MyAppointments />;
      case 'patient-records': return <PlaceholderView title="Medical Records" />;
      case 'patient-lab': return <MedicalReportPage pageLabel="Lab Reports" />;
      case 'patient-prescriptions': return <PrescriptionsPage />;
      case 'patient-billing': return <BillingPage />;
      case 'patient-find-doctor': return <FindDoctorPage />;
      case 'patient-support': return <SupportChatPage />;
      case 'patient-profile': return <ProfilePage />;
      case 'patient-notifications': return <NotificationsPage />;
      case 'telemedicine': return <TelemedicineUI onBack={() => setView('dashboard')} />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard onBookNew={() => setView('hospitals')} />;
    }
  };

  console.log('App Rendering', { currentRole, viewState: viewState.current });

  // AdminPortal has its own layout, so we only wrap Patient/Doctor in DashboardLayout
  if (currentRole === 'admin') {
    return renderContent();
  }

  return (
    <DashboardLayout 
      currentView={viewState.current} 
      setView={setView} 
      role={currentRole as any}
      user={currentUser}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
