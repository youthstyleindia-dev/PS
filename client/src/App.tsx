import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Header } from './components/Header';
import { CampusCopilotWidget } from './components/CampusCopilotWidget';
import { Dashboard } from './pages/Dashboard';
import { AcademicHub } from './pages/AcademicHub';
import { RidesPage } from './pages/RidesPage';
import { SustainabilityPage } from './pages/SustainabilityPage';
import { WellbeingPage } from './pages/WellbeingPage';
import { ExamMonitorPage } from './pages/ExamMonitorPage';
import { LandingPage } from './pages/LandingPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AboutPrinciplesPage } from './pages/AboutPrinciplesPage';
import { ImpactPage } from './pages/ImpactPage';
import { CampusFeedPage } from './pages/CampusFeedPage';
import { MentorDirectoryPage } from './pages/MentorDirectoryPage';
import { CampusCopilotPage } from './pages/CampusCopilotPage';
import { EventsPage } from './pages/EventsPage';
import { FacilityIssuesPage } from './pages/FacilityIssuesPage';
import { DriverTripsPage } from './pages/DriverTripsPage';
import { RoleGate } from './auth/RoleGate';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const isStandalone = location.pathname === '/' ||
    location.pathname.startsWith('/login') ||
    ['/onboarding', '/how-it-works', '/about', '/impact'].includes(location.pathname) ||
    (location.pathname === '/architecture' && !isAuthenticated);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (isStandalone) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface font-mono text-sm text-on-surface-variant">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="uppercase tracking-widest text-xs">Authenticating UniVerse Campus Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden font-body-md selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:flex">
        <Navbar />
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-primary/40 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          ></div>
          <div className="relative z-10 w-72 bg-surface-container-low h-full shadow-2xl flex flex-col">
            <Navbar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header onOpenMobileNav={() => setMobileNavOpen(true)} />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Persistent Campus Copilot Floating Widget */}
      <CampusCopilotWidget />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<RoleGate allowedRoles={['student', 'driver', 'proctor', 'ta_faculty', 'warden', 'admin']}><Dashboard /></RoleGate>} />
            <Route path="/feed" element={<RoleGate allowedRoles={['student', 'driver', 'proctor', 'ta_faculty', 'warden', 'admin']}><CampusFeedPage /></RoleGate>} />
            <Route path="/mentors" element={<RoleGate allowedRoles={['student', 'ta_faculty', 'admin']}><MentorDirectoryPage /></RoleGate>} />
            <Route path="/assistant" element={<RoleGate allowedRoles={['student', 'driver', 'proctor', 'ta_faculty', 'warden', 'admin']}><CampusCopilotPage /></RoleGate>} />
            <Route path="/events" element={<RoleGate allowedRoles={['student', 'driver', 'proctor', 'ta_faculty', 'warden', 'admin']}><EventsPage /></RoleGate>} />
            <Route path="/campus" element={<RoleGate allowedRoles={['student', 'driver', 'proctor', 'ta_faculty', 'warden', 'admin']}><EventsPage /></RoleGate>} />
            <Route path="/academic" element={<RoleGate allowedRoles={['student', 'ta_faculty', 'admin']}><AcademicHub /></RoleGate>} />
            <Route path="/hub" element={<RoleGate allowedRoles={['student', 'ta_faculty', 'admin']}><AcademicHub /></RoleGate>} />
            <Route path="/facilities" element={<RoleGate allowedRoles={['warden', 'admin', 'student', 'ta_faculty']}><FacilityIssuesPage /></RoleGate>} />
            <Route path="/driver/trips" element={<RoleGate allowedRoles={['driver', 'admin']}><DriverTripsPage /></RoleGate>} />
            <Route path="/rides" element={<RoleGate allowedRoles={['student', 'driver', 'ta_faculty', 'warden', 'admin']}><RidesPage /></RoleGate>} />
            <Route path="/sustainability" element={<RoleGate allowedRoles={['student', 'driver', 'ta_faculty', 'warden', 'admin']}><SustainabilityPage /></RoleGate>} />
            <Route path="/wellbeing" element={<RoleGate allowedRoles={['student']}><WellbeingPage /></RoleGate>} />
            <Route path="/exam-monitor" element={<RoleGate allowedRoles={['proctor', 'admin']}><ExamMonitorPage /></RoleGate>} />
            <Route path="/exams" element={<RoleGate allowedRoles={['proctor', 'admin']}><ExamMonitorPage /></RoleGate>} />
            {/* Public Architecture Page - no RoleGate */}
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/settings" element={<RoleGate allowedRoles={['student', 'driver', 'proctor', 'ta_faculty', 'warden', 'admin']}><SettingsPage /></RoleGate>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/:roleKey" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/about" element={<AboutPrinciplesPage />} />
            <Route path="/impact" element={<ImpactPage />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
