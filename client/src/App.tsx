import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Header } from './components/Header';
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

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const standaloneRoutes = ['/', '/login', '/onboarding', '/how-it-works', '/about', '/impact'];
  const isStandalone = standaloneRoutes.includes(location.pathname);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (isStandalone) {
    return <>{children}</>;
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
            <Route path="/app" element={<Dashboard />} />
            <Route path="/academic" element={<AcademicHub />} />
            <Route path="/hub" element={<AcademicHub />} />
            <Route path="/rides" element={<RidesPage />} />
            <Route path="/sustainability" element={<SustainabilityPage />} />
            <Route path="/wellbeing" element={<WellbeingPage />} />
            <Route path="/exam-monitor" element={<ExamMonitorPage />} />
            <Route path="/exams" element={<ExamMonitorPage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/login" element={<LoginPage />} />
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
