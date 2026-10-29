import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, demoLogin, register, error, clearError } = useAuth();

  const [activeTab, setActiveTab] = useState<'sso' | 'register'>('sso');
  const [email, setEmail] = useState('aarav.sharma@campus.edu');
  const [password, setPassword] = useState('CampusPass123!');
  const [institution, setInstitution] = useState('poly');
  const [isEphemeral, setIsEphemeral] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('student');
  const [regDept, setRegDept] = useState('Computer Science & Engineering');

  const handleAuthSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearError();
    setLoading(true);
    try {
      if (activeTab === 'sso') {
        await login(email, password);
      } else {
        await register({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
          department: regDept,
          year_of_study: 1
        });
      }
      navigate('/app');
    } catch (err) {
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
              className="font-headline-sm text-headline-sm tracking-tight text-primary font-bold uppercase hover:text-secondary transition-colors"
            >
              UniVerse
            </button>
            <span className="font-label-sm text-label-sm text-outline uppercase px-2 py-0.5 bg-surface-container-high">
              Node // 0x4F92
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 font-label-sm text-label-sm uppercase bg-surface-container text-on-surface-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Verified Academic Node
            </span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Return to Campus Public Portal
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-1 flex flex-col bg-surface">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-12 py-8 md:py-12 flex flex-col gap-8">
          {/* Node Security Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-outline-variant/40">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-label-sm text-label-sm uppercase px-2 py-1 bg-surface-container-highest text-on-surface font-semibold tracking-wider">
                ACADEMIC NODE V2.4
              </span>
              <span className="font-label-sm text-label-sm uppercase px-2 py-1 bg-surface-container-high text-on-surface-variant tracking-wider">
                [DEMO SANDBOX ACTIVE]
              </span>
              <span className="font-label-sm text-label-sm uppercase text-secondary font-semibold flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-secondary"></span>
                TLS 1.3 ENCLAVE ATTESTED
              </span>
            </div>
            <div className="font-label-sm text-label-sm text-outline uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">verified_user</span>
              SHIBBOLETH FEDERATION: INCOMMON // EDUGAIN
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Mission & Demo Personas */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold">
                  IDENTITY DECOUPLING // PROTOCOL V2.4
                </span>
                <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight font-extrabold leading-[1.05]">
                  Authenticate without surveillance.
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl pt-2">
                  UniVerse utilizes client-side cryptographic keypairs and federated institutional SAML/Shibboleth. No persistent session tracking, behavioral profiling, or advertising telemetry.
                </p>
              </div>

              {/* Security Principles */}
              <div className="flex flex-col gap-2 bg-surface-container-low p-4 border border-outline-variant">
                <div className="flex items-start gap-3 p-3 bg-surface-container-lowest">
                  <span className="font-label-md text-label-md font-bold text-secondary px-2 py-0.5 bg-secondary-fixed">
                    01
                  </span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-primary uppercase tracking-wide">
                      ZERO COMMERCIAL HARVESTING
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      University identity is attested via zero-knowledge proofs. Metadata never leaves local encrypted storage partitions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-surface-container-lowest">
                  <span className="font-label-md text-label-md font-bold text-secondary px-2 py-0.5 bg-secondary-fixed">
                    02
                  </span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-primary uppercase tracking-wide">
                      ROLE-BASED DEMO SANDBOX
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Explore collegiate perspectives safely. Switch between commuter scholar, peer driver, faculty ombuds, or administrator with zero identity contamination.
                    </p>
                  </div>
                </div>
              </div>

              {/* Instant Demo Personas */}
              <div className="bg-surface-container p-4 border border-outline-variant flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-secondary">group_work</span>
                    <span className="font-label-md text-label-md uppercase font-bold text-primary tracking-wide">
                      Instant Demo Personas
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline uppercase">[SANDBOX PRESETS]</span>
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
                        <span className="font-headline-sm text-[16px] font-bold text-primary group-hover:text-secondary">
                          Aarav Sharma
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-secondary-fixed text-on-secondary-fixed font-bold uppercase">
                          STUDENT
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Senior Computer Science • Peer Mentee & Commuter
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold mt-0.5">
                        Status: Active carpool slot • 4 Focus sprints completed
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm bg-primary text-on-primary px-3 py-1.5 uppercase font-bold self-start sm:self-center shrink-0 group-hover:bg-secondary transition-colors">
                      Enter Persona
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
                        <span className="font-headline-sm text-[16px] font-bold text-primary group-hover:text-secondary">
                          Vikram Rao
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-surface-container-highest text-primary font-bold uppercase">
                          DRIVER
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Mechanical Engineering • EV Carpool Commuter
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold mt-0.5">
                        Status: Dijkstra corridor dynamic router linked (0.34kg CO2 saved)
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm bg-primary text-on-primary px-3 py-1.5 uppercase font-bold self-start sm:self-center shrink-0 group-hover:bg-secondary transition-colors">
                      Enter Persona
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
                        <span className="font-headline-sm text-[16px] font-bold text-primary group-hover:text-secondary">
                          Dr. Meenakshi Sundaram
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-100 text-amber-900 font-bold uppercase">
                          PROCTOR
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Examination Review Chair • Non-Punitive Auditor
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold mt-0.5">
                        Status: 3 Blind appeal packages awaiting human review
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm bg-primary text-on-primary px-3 py-1.5 uppercase font-bold self-start sm:self-center shrink-0 group-hover:bg-secondary transition-colors">
                      Enter Persona
                    </span>
                  </button>

                  {/* Persona 4: Admin */}
                  <button
                    disabled={loading}
                    onClick={() => handleDemoPersona('admin')}
                    className="w-full text-left p-3 bg-surface-container-lowest hover:bg-surface-container-high transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-outline-variant shadow-sm group"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-[16px] font-bold text-primary group-hover:text-secondary">
                          Campus IT Operations
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-100 text-purple-900 font-bold uppercase">
                          ADMIN
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        UniVerse Central Operations • Sustainable HPC Cluster Admin
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold mt-0.5">
                        Status: Facility PUE 1.25 • 26 SQLite Relational Tables Active
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm bg-primary text-on-primary px-3 py-1.5 uppercase font-bold self-start sm:self-center shrink-0 group-hover:bg-secondary transition-colors">
                      Enter Persona
                    </span>
                  </button>
                </div>
              </div>

              {/* Consensus Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-4 border border-outline-variant flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Active Node Consensus
                  </span>
                  <span className="font-data-metric text-data-metric font-bold text-primary">
                    99.98%
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    42 Campus Validator Nodes
                  </span>
                </div>
                <div className="bg-surface-container-low p-4 border border-outline-variant flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Decoupled Identities
                  </span>
                  <span className="font-data-metric text-data-metric font-bold text-secondary">
                    14,290
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Zero PII Leak Disclosures
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Authentication Terminal */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="bg-surface-container-lowest border border-outline-variant shadow-lg p-6 sm:p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between bg-surface-container-low p-2 border border-outline-variant">
                  <span className="font-label-sm text-label-sm font-bold uppercase text-primary tracking-wider">
                    AUTH_ID: 0x98FF-SESSION-EPHEMERAL
                  </span>
                  <span className="font-label-sm text-label-sm uppercase text-secondary font-semibold">
                    PORT: 3001 (EXPRESS/WAL)
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
                    Campus SSO / Password
                  </button>
                  <button
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 py-2 px-3 font-label-md text-label-md font-bold uppercase tracking-wider text-center transition-all ${
                      activeTab === 'register'
                        ? 'text-primary bg-surface-container-lowest shadow-sm'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Provision New Node Account
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
                    <button
                      type="button"
                      onClick={() => handleDemoPersona('student')}
                      className="self-start px-3 py-1 bg-primary text-on-primary text-[11px] font-bold uppercase hover:bg-secondary transition-colors"
                    >
                      Bypass &amp; Instant Enter as Student
                    </button>
                  </div>
                )}

                {/* Tab 1: Login Form */}
                {activeTab === 'sso' ? (
                  <form onSubmit={handleAuthSubmit} className="flex flex-col gap-5">
                    {/* Quick 1-Click Credential Presets */}
                    <div className="flex flex-col gap-1.5 p-2.5 bg-surface-container border border-outline-variant">
                      <span className="font-label-sm text-[11px] font-bold uppercase text-primary tracking-wider">
                        Quick Preset Credential Autofill:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setEmail('aarav.sharma@campus.edu'); setPassword('CampusPass123!'); }}
                          className="px-2 py-1 bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant text-[11px] font-mono font-bold text-primary flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                          Student (Aarav / Alex)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEmail('dr.patel@campus.edu'); setPassword('faculty123'); }}
                          className="px-2 py-1 bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant text-[11px] font-mono font-bold text-primary flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Faculty / Proctor (Dr. Patel)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEmail('vikram.rao@campus.edu'); setPassword('CampusPass123!'); }}
                          className="px-2 py-1 bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant text-[11px] font-mono font-bold text-primary flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Driver (Vikram)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEmail('admin@campus.edu'); setPassword('admin123'); }}
                          className="px-2 py-1 bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant text-[11px] font-mono font-bold text-primary flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                          Admin (IT Ops)
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant tracking-wider">
                        1. Select Institutional Node
                      </label>
                      <div className="relative">
                        <select
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="w-full bg-surface-container-low text-primary font-body-md text-body-md px-3 py-2.5 border border-outline-variant appearance-none focus:outline-none focus:border-secondary"
                        >
                          <option value="poly">Polytechnic Institute (Node #09 - Active InCommon)</option>
                          <option value="state">State Metropolitan University (Node #14)</option>
                          <option value="urban">Urban Research College (Node #03 - Sandbox Fed)</option>
                          <option value="federated">EduGAIN Global Academic Gateway</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                          <span className="material-symbols-outlined text-[20px]">expand_more</span>
                        </div>
                      </div>
                      <span className="font-label-sm text-label-sm text-outline">
                        Shibboleth v3.4 SP with Zero-Knowledge Credential Shrouding
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant tracking-wider">
                        2. Academic NetID or Federated Identifier
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. aarav.sharma@campus.edu"
                        className="w-full bg-surface-container-low text-primary font-label-md text-label-md px-3 py-2.5 border border-outline-variant focus:outline-none focus:border-secondary"
                      />
                      <span className="font-label-sm text-label-sm text-outline">
                        Demo Accounts: aarav.sharma@campus.edu, vikram.rao@campus.edu, m.sundaram@campus.edu, admin@campus.edu
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant tracking-wider">
                          3. Institutional Passphrase / Token
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="font-label-sm text-label-sm uppercase text-secondary font-bold hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                          {showPassword ? 'Hide' : 'Reveal'}
                        </button>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full bg-surface-container-low text-primary font-label-md text-label-md px-3 py-2.5 border border-outline-variant focus:outline-none focus:border-secondary"
                      />
                      <span className="font-label-sm text-label-sm text-outline">
                        Default Demo Password: <code className="font-bold text-primary">CampusPass123!</code>
                      </span>
                    </div>

                    <div className="p-3 bg-surface-container-low border border-outline-variant flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="ephemeral-check"
                        checked={isEphemeral}
                        onChange={(e) => setIsEphemeral(e.target.checked)}
                        className="mt-1 accent-primary w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="ephemeral-check" className="flex flex-col cursor-pointer">
                        <span className="font-label-md text-label-md font-bold text-primary uppercase">
                          Keep Session Strictly Ephemeral
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Recommended on public lab terminals & transit kiosks. Zero local cache stored beyond this runtime.
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary text-on-primary py-3.5 px-4 font-label-md text-label-md font-bold uppercase tracking-wider hover:bg-on-surface transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                          <span>Attesting Identity Enclave...</span>
                        </>
                      ) : (
                        <>
                          <span>Authenticate with Campus Node</span>
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Tab 2: Provision New Account Form */
                  <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant tracking-wider">
                        Full Name & Scholar ID
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Sarah Jenkins"
                        className="w-full bg-surface-container-low text-primary font-body-md text-body-md px-3 py-2 border border-outline-variant focus:outline-none focus:border-secondary"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant tracking-wider">
                        Academic Email
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. s.jenkins@polytechnic.edu"
                        className="w-full bg-surface-container-low text-primary font-label-md text-label-md px-3 py-2 border border-outline-variant focus:outline-none focus:border-secondary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant tracking-wider">
                          Collegiate Role
                        </label>
                        <select
                          value={regRole}
                          onChange={(e) => setRegRole(e.target.value as UserRole)}
                          className="w-full bg-surface-container-low text-primary font-body-md text-body-md px-3 py-2 border border-outline-variant focus:outline-none"
                        >
                          <option value="student">Student Scholar</option>
                          <option value="driver">Campus Transit Driver</option>
                          <option value="proctor">Examination Proctor</option>
                          <option value="admin">System Administrator</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant tracking-wider">
                          Department
                        </label>
                        <input
                          type="text"
                          value={regDept}
                          onChange={(e) => setRegDept(e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="w-full bg-surface-container-low text-primary font-body-md text-body-md px-3 py-2 border border-outline-variant focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant tracking-wider">
                        Master Passphrase (min 8 characters)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full bg-surface-container-low text-primary font-label-md text-label-md px-3 py-2 border border-outline-variant focus:outline-none focus:border-secondary"
                      />
                      <span className="font-label-sm text-label-sm text-outline">
                        Will be hashed via Bcrypt (10 salt rounds) and recorded in SQLite.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-secondary text-on-secondary py-3 px-4 font-label-md text-label-md font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2"
                    >
                      {loading ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                          <span>Creating Secure Ledger Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Provision Scholar Ledger Account</span>
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Footer Notice */}
                <div className="p-3 bg-surface-container-low border border-outline-variant text-[11px] font-mono text-outline leading-tight">
                  <div className="font-bold text-primary mb-1">LOCAL-FIRST SOVEREIGNTY:</div>
                  All cryptographic signatures and database operations run directly against local SQLite (WAL mode). Zero telemetry sent to commercial clouds.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default LoginPage;
