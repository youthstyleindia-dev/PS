import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, demoLogin } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(3);
  const [selectedPersona, setSelectedPersona] = useState<UserRole>('student');
  const [department, setDepartment] = useState<string>(
    user?.department || 'Electrical Engineering & Computer Science (EECS)'
  );
  const [academicCohort, setAcademicCohort] = useState<string>('Senior (Class of 2025)');
  const [selectedFocus, setSelectedFocus] = useState<string[]>([
    'Distributed Systems',
    'Applied Cryptography',
    'Sustainable Mobility'
  ]);
  const [workspaceLanding, setWorkspaceLanding] = useState<string>('/app');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const focusOptions = [
    'Distributed Systems',
    'Applied Cryptography',
    'Compiler Engineering',
    'Sustainable Mobility',
    'Ethical AI Governance',
    'Edge AI & Privacy',
    'Topological Transit Optimization'
  ];

  const toggleFocus = (item: string) => {
    if (selectedFocus.includes(item)) {
      setSelectedFocus(selectedFocus.filter((f) => f !== item));
    } else {
      setSelectedFocus([...selectedFocus, item]);
    }
  };

  const handleCompleteSetup = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      // 1. Authenticate or switch to selected persona
      await demoLogin(selectedPersona);

      // 2. Persist profile preferences if token exists
      const token = localStorage.getItem('universe_auth_token') || localStorage.getItem('token');
      if (token) {
        await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            department,
            bio: `Active focus: ${selectedFocus.join(', ')}. Default route: ${workspaceLanding}`
          })
        }).catch(() => {});
      }

      setSuccessMessage('Cryptographic enclave initialized! Redirecting to workspace...');
      setTimeout(() => {
        navigate(workspaceLanding);
      }, 1000);
    } catch (err: any) {
      console.error('Setup failed', err);
      // Fallback redirect
      navigate(workspaceLanding);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-surface font-body-md text-on-surface flex flex-col justify-between">
      {/* Top Protocol Header */}
      <header className="w-full bg-surface-container-low border-b border-outline-variant px-4 md:px-12 py-3 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-primary tracking-tight uppercase">UniVerse Node Setup</span>
          <span className="text-outline">/</span>
          <span className="text-secondary font-semibold">INITIALIZATION_PROTOCOL_V1</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-outline hidden sm:inline">STAGE 03 // PERSONA &amp; FOCUS</span>
          <button
            onClick={() => navigate('/login')}
            className="text-primary hover:text-secondary underline transition-colors"
          >
            Switch to SSO
          </button>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="w-full max-w-4xl mx-auto px-4 md:px-6 py-8 flex-1">
        {/* Top Progress Stepper Strip */}
        <div className="w-full bg-surface-container-low border border-outline-variant p-2 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-left">
            {/* Step 1 */}
            <div
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-3 p-2 bg-surface-container cursor-pointer hover:bg-surface-container-high transition-colors"
            >
              <div className="w-6 h-6 bg-primary text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[14px]">check</span>
              </div>
              <div className="min-w-0">
                <span className="block font-mono text-[10px] text-outline uppercase tracking-wider">
                  STAGE 01 // VERIFIED
                </span>
                <span className="block text-xs font-medium text-on-surface truncate">
                  Institutional Attestation
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-3 p-2 bg-surface-container cursor-pointer hover:bg-surface-container-high transition-colors"
            >
              <div className="w-6 h-6 bg-primary text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[14px]">check</span>
              </div>
              <div className="min-w-0">
                <span className="block font-mono text-[10px] text-outline uppercase tracking-wider">
                  STAGE 02 // SECURED
                </span>
                <span className="block text-xs font-medium text-on-surface truncate">
                  Cryptographic Enclave
                </span>
              </div>
            </div>

            {/* Step 3 (Active) */}
            <div className="flex items-center gap-3 p-2 bg-primary text-on-primary shadow-sm">
              <div className="w-6 h-6 bg-secondary text-on-secondary flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                03
              </div>
              <div className="min-w-0">
                <span className="block font-mono text-[10px] text-secondary uppercase tracking-wider">
                  STAGE 03 // ACTIVE
                </span>
                <span className="block text-xs font-bold truncate text-on-primary">
                  Collegiate Persona
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Editorial Section Header */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-secondary animate-pulse"></span>
            <span className="font-mono text-xs uppercase tracking-widest text-outline">
              INITIALIZATION PROTOCOL // STEP 03 OF 03
            </span>
            <span className="ml-auto font-mono text-xs text-outline bg-surface-container px-2 py-0.5 border border-outline-variant">
              SANDBOX NODE #402
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Select your collegiate persona &amp; active focus.
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            Tailor your local client view to your daily campus rhythm. You can switch personas at any point with zero identity contamination or loss of cryptographic keys.
          </p>
        </div>

        {/* 01 // SELECT PRIMARY ARCHETYPE */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2">
            <span className="font-mono text-xs uppercase tracking-wider text-outline font-bold">
              01 // SELECT PRIMARY ARCHETYPE
            </span>
            <span className="font-mono text-xs text-secondary font-bold">HOTSWAPPABLE PROFILE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role 1: Student Scholar */}
            <div
              onClick={() => setSelectedPersona('student')}
              className={`p-6 border cursor-pointer transition-all flex flex-col justify-between ${
                selectedPersona === 'student'
                  ? 'border-primary bg-surface-container-lowest shadow-[3px_3px_0px_#003fe1]'
                  : 'border-outline-variant bg-surface hover:bg-surface-container-low'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-secondary font-bold uppercase tracking-wider">
                      UNDERGRADUATE / GRADUATE
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mt-0.5">
                      Student Scholar &amp; Commuter
                    </h3>
                  </div>
                  <div
                    className={`w-5 h-5 flex items-center justify-center shrink-0 border ${
                      selectedPersona === 'student'
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                  Prioritize peer-to-peer carpools, semester skill trees, library focus timers, and course syllabus vector pairing.
                </p>
              </div>

              <div className="pt-3 bg-surface-container-low border border-outline-variant p-3 font-mono text-xs">
                <span className="block text-[10px] text-outline uppercase mb-1">BUNDLED MODULES</span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="bg-surface px-2 py-0.5 border border-outline-variant">Transit Dijkstra</span>
                  <span className="bg-surface px-2 py-0.5 border border-outline-variant">Academic Commons</span>
                  <span className="bg-surface px-2 py-0.5 border border-outline-variant">Local Focus Mode</span>
                </div>
              </div>
            </div>

            {/* Role 2: Research Assistant & Slurm Operator */}
            <div
              onClick={() => setSelectedPersona('admin')}
              className={`p-6 border cursor-pointer transition-all flex flex-col justify-between ${
                selectedPersona === 'admin'
                  ? 'border-primary bg-surface-container-lowest shadow-[3px_3px_0px_#003fe1]'
                  : 'border-outline-variant bg-surface hover:bg-surface-container-low'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-outline font-bold uppercase tracking-wider">
                      GRADUATE FELLOW / LAB RESEARCHER
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mt-0.5">
                      Research Assistant &amp; Slurm Operator
                    </h3>
                  </div>
                  <div
                    className={`w-5 h-5 flex items-center justify-center shrink-0 border ${
                      selectedPersona === 'admin'
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                  Synchronize batch PyTorch / CUDA jobs to regional solar surpluses and track compute carbon intensities in real-time.
                </p>
              </div>

              <div className="pt-3 bg-surface-container-low border border-outline-variant p-3 font-mono text-xs">
                <span className="block text-[10px] text-outline uppercase mb-1">BUNDLED MODULES</span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="bg-surface px-2 py-0.5 border border-outline-variant">Slurm Peak Alert</span>
                  <span className="bg-surface px-2 py-0.5 border border-outline-variant">HPC Cluster Power</span>
                  <span className="bg-surface px-2 py-0.5 border border-outline-variant">Carbon Modeling</span>
                </div>
              </div>
            </div>

            {/* Role 3: Peer Ombudsman & Tribunal Member */}
            <div
              onClick={() => setSelectedPersona('proctor')}
              className={`p-6 border cursor-pointer transition-all flex flex-col justify-between ${
                selectedPersona === 'proctor'
                  ? 'border-primary bg-surface-container-lowest shadow-[3px_3px_0px_#003fe1]'
                  : 'border-outline-variant bg-surface hover:bg-surface-container-low'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-outline font-bold uppercase tracking-wider">
                      STUDENT ADVOCACY / SENATE
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mt-0.5">
                      Peer Ombudsman &amp; Tribunal Member
                    </h3>
                  </div>
                  <div
                    className={`w-5 h-5 flex items-center justify-center shrink-0 border ${
                      selectedPersona === 'proctor'
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                  Review cryptographic false-positive evidence packets with zero-knowledge anonymity and submit human-in-the-loop rulings.
                </p>
              </div>

              <div className="pt-3 bg-surface-container-low border border-outline-variant p-3 font-mono text-xs">
                <span className="block text-[10px] text-outline uppercase mb-1">BUNDLED MODULES</span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="bg-surface px-2 py-0.5 border border-outline-variant">Multi-Sig Tribunal</span>
                  <span className="bg-surface px-2 py-0.5 border border-outline-variant">Evidence Inspector</span>
                  <span className="bg-surface px-2 py-0.5 border border-outline-variant">Student Rebuttal</span>
                </div>
              </div>
            </div>

            {/* Role 4: Campus Transit Steward */}
            <div
              onClick={() => setSelectedPersona('driver')}
              className={`p-6 border cursor-pointer transition-all flex flex-col justify-between ${
                selectedPersona === 'driver'
                  ? 'border-primary bg-surface-container-lowest shadow-[3px_3px_0px_#003fe1]'
                  : 'border-outline-variant bg-surface hover:bg-surface-container-low'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-outline font-bold uppercase tracking-wider">
                      VANPOOL CAPTAIN / MICRO-MOBILITY
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mt-0.5">
                      Campus Transit Steward &amp; Driver
                    </h3>
                  </div>
                  <div
                    className={`w-5 h-5 flex items-center justify-center shrink-0 border ${
                      selectedPersona === 'driver'
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                  Manage campus node corridors, coordinate 5-minute detour tolerances, and optimize high-occupancy carpool match densities.
                </p>
              </div>

              <div className="pt-3 bg-surface-container-low border border-outline-variant p-3 font-mono text-xs">
                <span className="block text-[10px] text-outline uppercase mb-1">BUNDLED MODULES</span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="bg-surface px-2 py-0.5 border border-outline-variant">Dijkstra Dispatch</span>
                  <span className="bg-surface px-2 py-0.5 border border-outline-variant">Detour Envelopes</span>
                  <span className="bg-surface px-2 py-0.5 border border-outline-variant">Route Publishing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 02 // AFFILIATION & FOCUS VECTOR */}
        <div className="p-6 bg-surface border border-outline-variant mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-outline-variant pb-2">
            <span className="font-mono text-xs uppercase tracking-wider text-outline font-bold">
              02 // AFFILIATION &amp; FOCUS VECTOR
            </span>
            <span className="font-mono text-xs text-outline">ED25519 METADATA ATTACHED</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Department */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[11px] text-outline uppercase">Department Affiliation</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface border border-outline-variant py-2.5 px-3 focus:outline-none focus:border-secondary font-body-sm"
              >
                <option>Electrical Engineering &amp; Computer Science (EECS)</option>
                <option>Civil &amp; Environmental Engineering (CEE)</option>
                <option>Mathematics &amp; Computational Science</option>
                <option>Urban Planning &amp; Transportation Design</option>
                <option>Philosophy &amp; Public Ethics Policy</option>
              </select>
            </div>

            {/* Academic Cohort */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[11px] text-outline uppercase">Academic Cohort / Year</label>
              <select
                value={academicCohort}
                onChange={(e) => setAcademicCohort(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface border border-outline-variant py-2.5 px-3 focus:outline-none focus:border-secondary font-body-sm"
              >
                <option>Senior (Class of 2025)</option>
                <option>Junior (Class of 2026)</option>
                <option>Sophomore (Class of 2027)</option>
                <option>Freshman (Class of 2028)</option>
                <option>Graduate Fellow / Postdoctoral</option>
              </select>
            </div>
          </div>

          {/* Priority Focus Areas */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="font-mono text-[11px] text-outline uppercase">
                Priority Focus Areas (Select multiple)
              </label>
              <span className="font-mono text-xs text-secondary font-bold">
                {selectedFocus.length} SELECTED
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {focusOptions.map((opt) => {
                const isSelected = selectedFocus.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleFocus(opt)}
                    className={`px-3 py-1.5 font-mono text-xs transition-colors border ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 03 // DEFAULT WORKSPACE LANDING */}
        <div className="p-6 bg-surface border border-outline-variant mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-outline-variant pb-2">
            <span className="font-mono text-xs uppercase tracking-wider text-outline font-bold">
              03 // DEFAULT WORKSPACE LANDING
            </span>
            <span className="font-mono text-xs text-outline">CAN BE OVERRIDDEN IN SETTINGS</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { path: '/app', icon: 'dashboard', label: 'Overview', sub: 'Unified Pulse' },
              { path: '/academic', icon: 'menu_book', label: 'Academic Hub', sub: 'Syllabus Tree' },
              { path: '/rides', icon: 'directions_car', label: 'Transit Board', sub: 'Peer Carpools' },
              { path: '/wellbeing', icon: 'timer', label: 'Focus Engine', sub: 'Local Pomodoro' }
            ].map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => setWorkspaceLanding(item.path)}
                className={`p-4 border flex flex-col items-center justify-center text-center transition-all ${
                  workspaceLanding === item.path
                    ? 'bg-primary text-on-primary border-primary shadow-[2px_2px_0px_#003fe1]'
                    : 'bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[24px] mb-1">{item.icon}</span>
                <span className="font-bold text-xs">{item.label}</span>
                <span className="text-[10px] opacity-75 mt-0.5 font-mono">{item.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status Notification */}
        {successMessage && (
          <div className="mb-6 p-4 bg-surface-container border border-secondary text-secondary font-mono text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Final Submission Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-outline-variant">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-6 py-3 border border-outline text-primary font-mono text-xs uppercase font-bold hover:bg-surface-container transition-colors"
          >
            ← Back to Sandbox Access
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCompleteSetup}
            className="w-full sm:w-auto px-8 py-3 bg-primary text-on-primary font-mono text-xs uppercase font-bold tracking-wider hover:bg-secondary transition-all shadow-[3px_3px_0px_#003fe1] flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent animate-spin"></span>
                <span>Initializing Enclave...</span>
              </>
            ) : (
              <>
                <span>Finalize Persona &amp; Launch Node</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Protocol Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant px-4 md:px-12 py-4 text-center font-mono text-xs text-outline">
        UniVerse Collegiate Mesh // Zero Centralized Surveillance // Ed25519 Local Attestation
      </footer>
    </div>
  );
};

export default OnboardingPage;
