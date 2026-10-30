import React from 'react';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-surface flex flex-col font-body-md text-on-surface">
      {/* Top Header Navigation */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant shadow-sm">
        <div className="h-16 w-full max-w-7xl mx-auto px-4 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              onClick={() => navigate('/')}
              className="font-headline-sm text-headline-sm tracking-tight text-primary font-bold uppercase cursor-pointer"
            >
              UniVerse
            </span>
            <span className="font-label-sm text-label-sm text-outline uppercase px-2 py-0.5 bg-surface-container-high font-mono">
              Node // 0x4F92
            </span>
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 font-label-sm text-label-sm uppercase bg-surface-container text-on-surface-variant font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Verified Academic Mesh
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 font-mono text-xs">
            <a href="#modules" className="hover:text-secondary transition-colors text-on-surface-variant font-medium">
              Platform
            </a>
            <button onClick={() => navigate('/how-it-works')} className="hover:text-secondary transition-colors text-on-surface-variant font-medium">
              How It Works
            </button>
            <button onClick={() => navigate('/impact')} className="hover:text-secondary transition-colors text-on-surface-variant font-medium">
              Impact
            </button>
            <button onClick={() => navigate('/about')} className="hover:text-secondary transition-colors text-on-surface-variant font-medium">
              Principles
            </button>
            <button onClick={() => navigate('/architecture')} className="hover:text-secondary transition-colors text-on-surface-variant font-medium">
              Architecture
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="font-label-md text-label-md uppercase tracking-wider text-on-surface hover:text-secondary font-bold font-mono transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/app')}
              className="px-4 py-2 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider font-bold hover:bg-secondary transition-all shadow-sm font-mono flex items-center gap-1.5"
            >
              <span>Explore Console</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 1: PUBLIC HOMEPAGE HERO */}
      <section className="w-full bg-surface border-b border-outline-variant px-4 md:px-12 py-12 md:py-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Editorial Manifesto */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary px-2 py-0.5 border border-secondary font-mono font-bold">
                CAMPUS OPERATING SYSTEM // V1.0
              </span>
              <span className="font-label-sm text-label-sm text-outline font-mono">
                [ZERO COMMERCIAL EXFILTRATION]
              </span>
            </div>

            <h1 className="font-headline-xl text-headline-xl text-primary font-extrabold tracking-tight leading-[1.05]">
              A unified, privacy-first operating system for the next century of scholarship.
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-2xl">
              Five interconnected collegiate systems—placement intelligence, graph ride-pooling, sustainable HPC scheduling, differential-privacy focus, and ethical proctor review—unified on a local-first, zero-knowledge architecture.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 font-mono">
              <button
                onClick={() => navigate('/app')}
                className="px-6 py-3.5 bg-primary text-on-primary font-label-md text-label-md uppercase font-bold hover:bg-secondary transition-all flex items-center gap-2 shadow-sm"
              >
                <span>Explore Console</span>
                <span className="material-symbols-outlined text-[18px]">key</span>
              </button>

              <button
                onClick={() => navigate('/architecture')}
                className="px-6 py-3.5 bg-surface-container border border-outline text-primary font-label-md text-label-md uppercase font-bold hover:bg-surface-container-high transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">terminal</span>
                <span>System Architecture</span>
              </button>
            </div>

            {/* Live Telemetry Ticker */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-outline-variant font-mono text-xs text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-primary">01</span>
                <span className="text-outline">/</span>
                <span className="uppercase">Academic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-primary">02</span>
                <span className="text-outline">/</span>
                <span className="uppercase">Transit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-primary">03</span>
                <span className="text-outline">/</span>
                <span className="uppercase">Compute</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-primary">04</span>
                <span className="text-outline">/</span>
                <span className="uppercase">Focus</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-primary">05</span>
                <span className="text-outline">/</span>
                <span className="uppercase">Exams</span>
              </div>
            </div>
          </div>

          {/* Right Column: Campus Constellation Orbital Graphic */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full aspect-square max-w-[440px] bg-primary p-6 shadow-[6px_6px_0px_#003fe1] flex flex-col justify-between overflow-hidden border border-primary">
              <div className="flex items-center justify-between border-b border-white/20 pb-2 z-10 font-mono text-xs text-white">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="tracking-wider uppercase font-bold">ORBITAL_GRAPH // NODE_0X4F92</span>
                </div>
                <span className="text-outline">CAMPUS MESH</span>
              </div>

              {/* Vector Constellation SVG */}
              <div className="relative w-full h-[280px] flex items-center justify-center my-auto">
                <svg className="w-full h-full max-h-[300px]" viewBox="0 0 400 400">
                  <circle cx="200" cy="200" fill="none" r="145" stroke="#77777b" strokeDasharray="6 6" strokeWidth="1.5" opacity="0.4" />
                  <ellipse cx="200" cy="200" fill="none" rx="170" ry="75" stroke="#003fe1" strokeWidth="2.5" transform="rotate(-28 200 200)" opacity="0.9" />
                  <ellipse cx="200" cy="200" fill="none" rx="170" ry="75" stroke="#9466ff" strokeWidth="2.5" transform="rotate(28 200 200)" opacity="0.8" />
                  <line x1="70" y1="160" x2="330" y2="240" stroke="#c7c6ca" strokeDasharray="3 3" strokeWidth="1" opacity="0.4" />

                  {/* Core Node */}
                  <circle cx="200" cy="200" fill="#faf9f5" r="28" />
                  <circle cx="200" cy="200" fill="#000000" r="16" />
                  <text x="200" y="204" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="9" fontWeight="700" textAnchor="middle">
                    CORE
                  </text>

                  {/* Node 1: Green Quad */}
                  <circle cx="275" cy="115" fill="#a7f3d0" r="14" />
                  <circle cx="275" cy="115" fill="#000000" r="6" />
                  <text x="298" y="119" fill="#faf9f5" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600">
                    ECO // COMPUTE
                  </text>

                  {/* Node 2: Library Hub */}
                  <circle cx="85" cy="165" fill="#305bfe" r="16" />
                  <circle cx="85" cy="165" fill="#ffffff" r="7" />
                  <text x="22" y="196" fill="#faf9f5" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600">
                    ACADEMIC // HUB
                  </text>

                  {/* Node 3: Transit */}
                  <circle cx="120" cy="270" fill="#ff8a80" r="14" />
                  <circle cx="120" cy="270" fill="#000000" r="5" />
                  <text x="50" y="302" fill="#faf9f5" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600">
                    TRANSIT // DARP
                  </text>

                  {/* Node 4: Labs */}
                  <circle cx="318" cy="242" fill="#d9f66f" r="15" />
                  <circle cx="318" cy="242" fill="#000000" r="6" />
                  <text x="268" y="278" fill="#faf9f5" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600">
                    EXAM // ETHICS
                  </text>
                </svg>
              </div>

              <div className="border-t border-white/20 pt-2 flex items-center justify-between z-10 font-mono text-xs text-white">
                <span>ACTIVE_PEERS: 4,812</span>
                <span className="text-emerald-400">P2P_MESH: ENCRYPTED</span>
                <span className="bg-white text-black px-1 font-bold">L-ZERO</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: FIVE CONNECTED COLLEGIATE MODULES */}
      <section id="modules" className="w-full bg-surface-container-low border-b border-outline-variant px-4 md:px-12 py-16 scroll-mt-16">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col gap-2 max-w-3xl">
            <span className="font-label-sm text-label-sm text-secondary uppercase font-bold font-mono">
              ECOSYSTEM ARCHITECTURE // FIVE MODULES
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
              Integrated campus intelligence without fragmented silos.
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Every workflow in UniVerse operates as a sovereign node in one unified fabric.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div
              onClick={() => navigate('/academic')}
              className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm flex flex-col justify-between cursor-pointer hover:border-secondary hover:-translate-y-1 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-secondary">MODULE_01</span>
                  <span className="text-outline">[ACTUAL DATA]</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Student Intelligence &amp; Academic Hub
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Radar skill trees, peer mentor discovery, placement milestone trackers, and curated syllabi without proprietary middleman markups.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-outline-variant flex items-center justify-between font-mono text-xs">
                <span className="text-outline">6-Axis Competencies</span>
                <span className="text-secondary font-bold flex items-center gap-1">
                  Explore <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div
              onClick={() => navigate('/rides')}
              className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm flex flex-col justify-between cursor-pointer hover:border-secondary hover:-translate-y-1 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-secondary">MODULE_02</span>
                  <span className="text-outline">[DIJKSTRA ENGINE]</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Smart Campus Transit &amp; Ride-Pooling
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Topological shortest path calculations with $\le 35\%$ detour ceilings, vehicle emission coefficients, and avoided CO2 calculations.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-outline-variant flex items-center justify-between font-mono text-xs">
                <span className="text-outline">10 Nodes // 30 Edges</span>
                <span className="text-secondary font-bold flex items-center gap-1">
                  Explore <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div
              onClick={() => navigate('/sustainability')}
              className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm flex flex-col justify-between cursor-pointer hover:border-secondary hover:-translate-y-1 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-secondary">MODULE_03</span>
                  <span className="text-outline">[SLURM ORACLE]</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Sustainable Computing Observatory
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Diurnal solar intensity curves, non-linear server power formula P(U) = P_idle + (P_max - P_idle)(U/100)^1.25, and facility PUE comparisons.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-outline-variant flex items-center justify-between font-mono text-xs">
                <span className="text-outline">Solar Apex Sync</span>
                <span className="text-secondary font-bold flex items-center gap-1">
                  Explore <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>

            {/* Card 4 */}
            <div
              onClick={() => navigate('/wellbeing')}
              className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm flex flex-col justify-between cursor-pointer hover:border-secondary hover:-translate-y-1 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-secondary">MODULE_04</span>
                  <span className="text-outline">[LAPLACE DP]</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Privacy-Aware Digital Wellbeing
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Voluntary attention sprints, client hostname stripping, Laplace Differential Privacy ($\epsilon = 0.8$), and complete Right to Erasure data purges.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-outline-variant flex items-center justify-between font-mono text-xs">
                <span className="text-outline">Zero Cloud Spying</span>
                <span className="text-secondary font-bold flex items-center gap-1">
                  Explore <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>

            {/* Card 5 */}
            <div
              onClick={() => navigate('/exams')}
              className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm flex flex-col justify-between cursor-pointer hover:border-secondary hover:-translate-y-1 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-secondary">MODULE_05</span>
                  <span className="text-outline">[ETHICAL AI]</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Responsible Examination Review
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Observations, not accusations. Mandatory human-in-the-loop review queue requiring written auditor justifications and student rebuttals.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-outline-variant flex items-center justify-between font-mono text-xs">
                <span className="text-outline">Charter Article 12.3</span>
                <span className="text-secondary font-bold flex items-center gap-1">
                  Explore <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>

            {/* Card 6: Sandbox Entry */}
            <div
              onClick={() => navigate('/architecture')}
              className="bg-primary text-on-primary p-6 shadow-[4px_4px_0px_#003fe1] flex flex-col justify-between cursor-pointer hover:opacity-95 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-secondary-fixed font-bold">SYSTEM_SPEC</span>
                  <span className="text-white/60">[LOCAL RUNNABLE]</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-white font-bold">
                  Explore Algorithm Sandbox &amp; Verification Suite
                </h3>
                <p className="font-body-sm text-body-sm text-white/80">
                  Inspect the mathematical formulas, run interactive Dijkstra and carbon benchmarks, and inspect test matrix outputs.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-white/20 flex items-center justify-between font-mono text-xs">
                <span className="text-white/70">132 / 132 Tests Passing</span>
                <span className="text-white font-bold flex items-center gap-1">
                  Launch <span className="material-symbols-outlined text-[14px]">terminal</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FOOTER */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant px-4 md:px-12 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs text-on-surface-variant">
          <div className="flex items-center gap-3">
            <span className="font-headline-sm text-headline-sm text-primary font-bold uppercase">
              UniVerse
            </span>
            <span className="text-outline">|</span>
            <span>Intelligent, Sustainable, and Privacy-Aware Campus OS</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/architecture')} className="hover:text-primary transition-colors">
              Architecture Spec
            </button>
            <button onClick={() => navigate('/login')} className="hover:text-primary transition-colors">
              SSO Portal
            </button>
            <span className="text-secondary font-bold">SQLITE WAL // PORT 3001</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
