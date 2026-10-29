import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { roleKey } = useParams<{ roleKey?: string }>();
  const { login, loginWithRole, demoLogin, register, error, clearError } = useAuth();

  const [activeTab, setActiveTab] = useState<'sso' | 'register'>('sso');
  const [email, setEmail] = useState('aarav.sharma@campus.edu');
  const [password, setPassword] = useState('CampusPass123!');
  const [isEphemeral, setIsEphemeral] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Register form state (always provisioned as student)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDept, setRegDept] = useState('Computer Science & Engineering');

  // Normalize target role from URL if present
  const normalizedTargetRole: UserRole | null = roleKey
    ? (roleKey === 'faculty' || roleKey === 'ta' ? 'ta_faculty' : roleKey as UserRole)
    : null;

  // Set default credentials based on target role portal
  useEffect(() => {
    if (normalizedTargetRole === 'driver') {
      setEmail('vikram.rao@campus.edu');
      setPassword('CampusPass123!');
    } else if (normalizedTargetRole === 'proctor') {
      setEmail('m.sundaram@campus.edu');
      setPassword('CampusPass123!');
    } else if (normalizedTargetRole === 'ta_faculty') {
      setEmail('dr.patel@campus.edu');
      setPassword('CampusPass123!');
    } else if (normalizedTargetRole === 'warden') {
      setEmail('warden@campus.edu');
      setPassword('CampusPass123!');
    } else if (normalizedTargetRole === 'admin') {
      setEmail('admin@campus.edu');
      setPassword('CampusPass123!');
    } else if (normalizedTargetRole === 'student') {
      setEmail('aarav.sharma@campus.edu');
      setPassword('CampusPass123!');
    }
  }, [normalizedTargetRole]);

  const portalMetadata: Record<UserRole, { title: string; subtitle: string; badge: string; color: string }> = {
    student: {
      title: 'Sign In: Scholar & Academic Hub',
      subtitle: 'Placement Readiness, Skill Radars, Mentorship Commons & Carpooling',
      badge: 'STUDENT PORTAL',
      color: 'bg-secondary text-on-secondary'
    },
    driver: {
      title: 'Transit Partner Access',
      subtitle: 'Campus Mobility Fleet, Route Corridor Matching & Detour Controls',
      badge: 'DRIVER PORTAL',
      color: 'bg-emerald-600 text-white'
    },
    proctor: {
      title: 'Examination Review Workspace',
      subtitle: 'Human-in-the-Loop Tribunal, Observation Packets & Audit Logs',
      badge: 'PROCTOR PORTAL',
      color: 'bg-amber-600 text-white'
    },
    ta_faculty: {
      title: 'Academic Faculty & Mentor Workspace',
      subtitle: 'Mentorship Applications, Graduate Advising & Resource Publishing',
      badge: 'FACULTY PORTAL',
      color: 'bg-blue-600 text-white'
    },
    warden: {
      title: 'Campus Operations & Residential Staff',
      subtitle: 'Residential Safety, Transit Mesh Observability & Facilities',
      badge: 'WARDEN PORTAL',
      color: 'bg-teal-600 text-white'
    },
    admin: {
      title: 'System Administration & Security Enclave',
      subtitle: 'User Directory, Role Governance, Slurm Telemetry & Audit Trail',
      badge: 'ADMIN PORTAL',
      color: 'bg-purple-600 text-white'
    }
  };

  const currentMeta = normalizedTargetRole && portalMetadata[normalizedTargetRole]
    ? portalMetadata[normalizedTargetRole]
    : {
        title: 'UniVerse Unified Campus Portal',
        subtitle: 'Authenticating Enclave Nodes across 5 Integrated Collegiate Domains',
        badge: 'ALL-ACCESS PORTAL',
        color: 'bg-primary text-on-primary'
      };

  const handleAuthSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearError();
    setLoading(true);
    try {
      if (activeTab === 'sso') {
        if (normalizedTargetRole) {
          await loginWithRole(email, password, normalizedTargetRole);
        } else {
          await login(email, password);
        }
      } else {
        await register({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: 'student',
          department: regDept,
          year_of_study: 1
        });
      }
      navigate('/app');
    } catch {
      // Error handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPersona = async (role: UserRole) => {
    clearError();
    setLoading(true);
    try {
      await demoLogin(role);
      navigate('/app');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-surface flex flex-col font-body-md text-on-surface">
      {/* Top Header Strip */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant shadow-sm">
        <div className="h-16 w-full px-4 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-8 h-8 bg-primary text-on-primary flex items-center justify-center font-mono font-bold text-sm tracking-wider hover:bg-secondary transition-colors"
            >
              U
            </button>
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">
              UniVerse
            </span>
            <span className="font-label-sm text-label-sm px-2 py-0.5 bg-surface-container-high text-on-surface font-mono font-bold hidden sm:inline-block">
              {currentMeta.badge}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/how-it-works')}
              className="px-3 py-1.5 text-xs font-mono font-medium text-on-surface-variant hover:text-primary transition-colors hidden md:block"
            >
              HOW_IT_WORKS
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1.5 text-xs font-mono font-medium text-on-surface-variant hover:text-primary transition-colors"
            >
              BACK_TO_CAMPUS
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12">
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
          {/* Distinct Role Entry Point Navigation Strip */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-on-surface-variant font-bold tracking-wider">
                Select Dedicated Workspace Entry Point:
              </span>
              <span className="font-mono text-[11px] text-secondary font-semibold">
                ROLE-BASED AUTHORIZATION ENFORCED
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/login')}
                className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border transition-all ${
                  !normalizedTargetRole
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant'
                }`}
              >
                All-Campus SSO
              </button>
              {(['student', 'driver', 'proctor', 'ta_faculty', 'warden', 'admin'] as UserRole[]).map((r) => {
                const meta = portalMetadata[r];
                const isSelected = normalizedTargetRole === r;
                return (
                  <button
                    key={r}
                    onClick={() => navigate(`/login/${r}`)}
                    className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? `${meta.color} border-current shadow-sm`
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant'
                    }`}
                  >
                    <span>{meta.badge.replace(' PORTAL', '')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Context & Evaluator Persona Switcher */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="space-y-3">
                <span className={`inline-flex items-center px-2 py-0.5 font-label-sm text-label-sm font-mono font-bold uppercase ${currentMeta.color}`}>
                  {currentMeta.badge}
                </span>
                <h1 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
                  {currentMeta.title}
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {currentMeta.subtitle}. Enforces strict server-side boundary isolation where each account accesses only its authorized workspace.
                </p>
              </div>

              {/* Pre-provisioned Demo Evaluator Quick Access */}
              <div className="bg-surface-container-low p-4 sm:p-5 border border-outline-variant flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">verified_user</span>
                    <span className="font-headline-sm text-[14px] font-bold text-primary uppercase font-mono">
                      Pre-Provisioned Demo Personas
                    </span>
                  </div>
                  <span className="font-label-sm text-[11px] font-mono text-secondary font-bold">
                    [EVALUATOR TEST FIXTURES]
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Persona 1: Student */}
                  <button
                    disabled={loading}
                    onClick={() => handleDemoPersona('student')}
                    className="w-full text-left p-3 bg-surface-container-lowest hover:bg-surface-container-high transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-outline-variant shadow-sm group"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-[15px] font-bold text-primary group-hover:text-secondary">
                          Aarav Sharma
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-secondary text-on-secondary font-bold uppercase">
                          STUDENT
                        </span>
                      </div>
                      <span className="font-body-sm text-xs text-on-surface-variant">
                        4th-Year Computer Science • Placement Readiness 85%
                      </span>
                    </div>
                    <span className="font-label-sm text-xs bg-primary text-on-primary px-3 py-1 uppercase font-bold self-start sm:self-center shrink-0">
                      Enter
                    </span>
                  </button>

                  {/* Persona 2: Driver */}
                  <button
                    disabled={loading}
                    onClick={() => handleDemoPersona('driver')}
                    className="w-full text-left p-3 bg-surface-container-lowest hover:bg-surface-container-high transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-outline-variant shadow-sm group"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-[15px] font-bold text-primary group-hover:text-secondary">
                          Vikram Rao
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-600 text-white font-bold uppercase">
                          DRIVER
                        </span>
                      </div>
                      <span className="font-body-sm text-xs text-on-surface-variant">
                        Tata Nexon EV • Daily North Gate Itinerary Operator
                      </span>
                    </div>
                    <span className="font-label-sm text-xs bg-primary text-on-primary px-3 py-1 uppercase font-bold self-start sm:self-center shrink-0">
                      Enter
                    </span>
                  </button>

                  {/* Persona 3: Proctor */}
                  <button
                    disabled={loading}
                    onClick={() => handleDemoPersona('proctor')}
                    className="w-full text-left p-3 bg-surface-container-lowest hover:bg-surface-container-high transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-outline-variant shadow-sm group"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-[15px] font-bold text-primary group-hover:text-secondary">
                          Dr. Meenakshi Sundaram
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-600 text-white font-bold uppercase">
                          PROCTOR
                        </span>
                      </div>
                      <span className="font-body-sm text-xs text-on-surface-variant">
                        Examination Review Chair • Double-Blind Auditor
                      </span>
                    </div>
                    <span className="font-label-sm text-xs bg-primary text-on-primary px-3 py-1 uppercase font-bold self-start sm:self-center shrink-0">
                      Enter
                    </span>
                  </button>

                  {/* Persona 4: Faculty / TA */}
                  <button
                    disabled={loading}
                    onClick={() => handleDemoPersona('ta_faculty')}
                    className="w-full text-left p-3 bg-surface-container-lowest hover:bg-surface-container-high transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-outline-variant shadow-sm group"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-[15px] font-bold text-primary group-hover:text-secondary">
                          Dr. Priya Patel
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-600 text-white font-bold uppercase">
                          FACULTY / TA
                        </span>
                      </div>
                      <span className="font-body-sm text-xs text-on-surface-variant">
                        Graduate Mentor &amp; Resource Author
                      </span>
                    </div>
                    <span className="font-label-sm text-xs bg-primary text-on-primary px-3 py-1 uppercase font-bold self-start sm:self-center shrink-0">
                      Enter
                    </span>
                  </button>

                  {/* Persona 5: Warden */}
                  <button
                    disabled={loading}
                    onClick={() => handleDemoPersona('warden')}
                    className="w-full text-left p-3 bg-surface-container-lowest hover:bg-surface-container-high transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-outline-variant shadow-sm group"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-[15px] font-bold text-primary group-hover:text-secondary">
                          Campus Residential Warden
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-teal-600 text-white font-bold uppercase">
                          WARDEN
                        </span>
                      </div>
                      <span className="font-body-sm text-xs text-on-surface-variant">
                        Residential Operations &amp; Transit Safety
                      </span>
                    </div>
                    <span className="font-label-sm text-xs bg-primary text-on-primary px-3 py-1 uppercase font-bold self-start sm:self-center shrink-0">
                      Enter
                    </span>
                  </button>

                  {/* Persona 6: Admin */}
                  <button
                    disabled={loading}
                    onClick={() => handleDemoPersona('admin')}
                    className="w-full text-left p-3 bg-surface-container-lowest hover:bg-surface-container-high transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-outline-variant shadow-sm group"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-[15px] font-bold text-primary group-hover:text-secondary">
                          Campus IT Operations
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-600 text-white font-bold uppercase">
                          ADMIN
                        </span>
                      </div>
                      <span className="font-body-sm text-xs text-on-surface-variant">
                        System Operations • 28 Relational SQLite Tables
                      </span>
                    </div>
                    <span className="font-label-sm text-xs bg-primary text-on-primary px-3 py-1 uppercase font-bold self-start sm:self-center shrink-0">
                      Enter
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Authentication Terminal */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="bg-surface-container-lowest border border-outline-variant shadow-lg p-6 sm:p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between bg-surface-container-low p-2 border border-outline-variant font-mono text-xs">
                  <span className="font-bold uppercase text-primary tracking-wider">
                    TARGET: {normalizedTargetRole ? normalizedTargetRole.toUpperCase() : 'GENERAL_SSO'}
                  </span>
                  <span className="text-secondary font-semibold">
                    PORT: 3001
                  </span>
                </div>

                {/* Tabs */}
                <div className="flex bg-surface-container-high p-1 border border-outline-variant">
                  <button
                    onClick={() => setActiveTab('sso')}
                    className={`flex-1 py-2 px-3 font-label-md text-label-md font-bold uppercase tracking-wider text-center transition-all ${
                      activeTab === 'sso'
                        ? 'text-primary bg-surface-container-lowest shadow-sm'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Campus Sign-In
                  </button>
                  <button
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 py-2 px-3 font-label-md text-label-md font-bold uppercase tracking-wider text-center transition-all ${
                      activeTab === 'register'
                        ? 'text-primary bg-surface-container-lowest shadow-sm'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Public Student Onboarding
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-red-50 border border-error text-error text-xs font-mono flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        {error}
                      </span>
                      <button onClick={clearError} className="underline text-[10px]">
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 1: Login Form */}
                {activeTab === 'sso' ? (
                  <form onSubmit={handleAuthSubmit} className="flex flex-col gap-5">
                    {/* Quick Preset Credential Autofill */}
                    <div className="flex flex-col gap-1.5 p-2.5 bg-surface-container border border-outline-variant">
                      <span className="font-label-sm text-[11px] font-bold uppercase text-primary tracking-wider">
                        Quick Preset Credential Autofill:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setEmail('aarav.sharma@campus.edu'); setPassword('CampusPass123!'); }}
                          className="px-2 py-0.5 bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant text-[10px] font-mono text-on-surface font-semibold"
                        >
                          Student (Aarav)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEmail('vikram.rao@campus.edu'); setPassword('CampusPass123!'); }}
                          className="px-2 py-0.5 bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant text-[10px] font-mono text-on-surface font-semibold"
                        >
                          Driver (Vikram)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEmail('m.sundaram@campus.edu'); setPassword('CampusPass123!'); }}
                          className="px-2 py-0.5 bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant text-[10px] font-mono text-on-surface font-semibold"
                        >
                          Proctor (Dr. Sundaram)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEmail('dr.patel@campus.edu'); setPassword('CampusPass123!'); }}
                          className="px-2 py-0.5 bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant text-[10px] font-mono text-on-surface font-semibold"
                        >
                          Faculty (Dr. Patel)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEmail('admin@campus.edu'); setPassword('CampusPass123!'); }}
                          className="px-2 py-0.5 bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant text-[10px] font-mono text-on-surface font-semibold"
                        >
                          Admin (IT Ops)
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant tracking-wider">
                        Collegiate Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. aarav.sharma@campus.edu"
                        className="w-full bg-surface-container-low text-primary font-body-md text-body-md px-3 py-2.5 border border-outline-variant focus:outline-none focus:border-secondary"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant tracking-wider">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="font-label-sm text-xs text-on-surface-variant hover:text-primary font-mono"
                        >
                          {showPassword ? 'HIDE' : 'SHOW'}
                        </button>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-surface-container-low text-primary font-body-md text-body-md px-3 py-2.5 border border-outline-variant focus:outline-none focus:border-secondary"
                      />
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isEphemeral}
                          onChange={(e) => setIsEphemeral(e.target.checked)}
                          className="w-4 h-4 border border-outline text-secondary focus:ring-0"
                        />
                        <span className="font-label-sm text-xs text-on-surface-variant">
                          Remember session on this device
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-primary text-on-primary font-label-md text-label-md font-bold uppercase tracking-wider hover:bg-secondary transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">lock_open</span>
                          <span>
                            {normalizedTargetRole
                              ? `Authorize & Enter ${normalizedTargetRole.toUpperCase()} Workspace`
                              : 'Authenticate Session'}
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Tab 2: Public Registration Form */
                  <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                    <div className="p-3 bg-surface-container border border-outline-variant text-xs font-mono space-y-1">
                      <div className="text-secondary font-bold">PUBLIC ONBOARDING POLICY</div>
                      <div className="text-on-surface-variant">
                        Public registrations provision verified <strong>Student Scholar</strong> profiles.
                      </div>
                      <div className="text-outline">
                        Privileged Transit Driver, Invigilator, or Admin roles require administrative invitation.
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-xs font-bold uppercase text-on-surface-variant tracking-wider">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Diya Sharma"
                        className="w-full bg-surface-container-low text-primary font-body-md text-body-md px-3 py-2 border border-outline-variant focus:outline-none focus:border-secondary"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-xs font-bold uppercase text-on-surface-variant tracking-wider">
                        Collegiate Email
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. diya.sharma@campus.edu"
                        className="w-full bg-surface-container-low text-primary font-body-md text-body-md px-3 py-2 border border-outline-variant focus:outline-none focus:border-secondary"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-xs font-bold uppercase text-on-surface-variant tracking-wider">
                        Department
                      </label>
                      <input
                        type="text"
                        value={regDept}
                        onChange={(e) => setRegDept(e.target.value)}
                        placeholder="e.g. Computer Science & Engineering"
                        className="w-full bg-surface-container-low text-primary font-body-md text-body-md px-3 py-2 border border-outline-variant focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-xs font-bold uppercase text-on-surface-variant tracking-wider">
                        Password (Min. 8 Characters)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-surface-container-low text-primary font-body-md text-body-md px-3 py-2 border border-outline-variant focus:outline-none focus:border-secondary"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-primary text-on-primary font-label-md text-label-md font-bold uppercase tracking-wider hover:bg-secondary transition-colors shadow-sm disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <span>Provisioning...</span>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">person_add</span>
                          <span>Provision Student Node</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
