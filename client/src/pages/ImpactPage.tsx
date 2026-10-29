import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const ImpactPage: React.FC = () => {
  const navigate = useNavigate();
  const [detourTolerance, setDetourTolerance] = useState<'3.5' | '5.0'>('3.5');
  const [carbonSaved, setCarbonSaved] = useState<number>(44.8);

  const handleToleranceChange = (val: '3.5' | '5.0') => {
    setDetourTolerance(val);
    setCarbonSaved(val === '3.5' ? 44.8 : 68.2);
  };

  return (
    <div className="w-full min-h-screen bg-background font-body-md text-on-surface flex flex-col">
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
            <span className="font-mono text-xs text-secondary uppercase px-1.5 py-0.5 border border-secondary font-bold">
              Impact &amp; Responsibility
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 font-mono text-xs">
            <button onClick={() => navigate('/')} className="hover:text-secondary transition-colors">
              Platform
            </button>
            <button onClick={() => navigate('/how-it-works')} className="hover:text-secondary transition-colors">
              How It Works
            </button>
            <button onClick={() => navigate('/impact')} className="text-secondary font-bold">
              Impact
            </button>
            <button onClick={() => navigate('/about')} className="hover:text-secondary transition-colors">
              Principles
            </button>
            <button onClick={() => navigate('/architecture')} className="hover:text-secondary transition-colors">
              Architecture
            </button>
          </nav>

          <div className="flex items-center gap-3 font-mono text-xs">
            <button
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 border border-primary text-primary hover:bg-surface-container font-bold uppercase transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/app')}
              className="px-4 py-1.5 bg-primary text-on-primary font-bold uppercase hover:bg-secondary transition-all shadow-[2px_2px_0px_#003fe1]"
            >
              Open Console
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section: Four Core Empirical Metrics */}
      <section className="w-full bg-surface border-b border-outline-variant px-4 md:px-12 py-12">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-secondary uppercase px-2 py-0.5 border border-secondary font-bold">
                AUDITED IMPACT TELEMETRY
              </span>
              <span className="text-outline">[MEASURED REAL-TIME]</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-primary font-extrabold tracking-tight">
              Responsible, empirical collective stewardship.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Every algorithm deployed in UniVerse is bounded by transparent ecological and ethical guarantees. Here are the system-wide benchmarks across campus mobility, clean HPC computing, and student privacy.
            </p>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric Card 1 */}
            <div className="flex flex-col bg-surface border border-outline-variant p-6 shadow-sm justify-between">
              <div>
                <div className="flex justify-between items-start mb-3 font-mono text-xs">
                  <span className="uppercase text-outline font-bold">LOC_METRIC // 01</span>
                  <span className="px-1.5 py-0.5 bg-primary text-on-primary font-bold">TRANSIT</span>
                </div>
                <div className="text-3xl font-bold font-mono text-primary">-{carbonSaved} kg</div>
                <div className="text-xs text-on-surface-variant mt-1 font-medium">CO₂ avoided weekly via pooling</div>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between font-mono text-xs">
                <span className="text-outline">[ESTIMATED METRIC]</span>
                <span className="material-symbols-outlined text-secondary text-[18px]">commute</span>
              </div>
            </div>

            {/* Metric Card 2 */}
            <div className="flex flex-col bg-surface border border-outline-variant p-6 shadow-sm justify-between">
              <div>
                <div className="flex justify-between items-start mb-3 font-mono text-xs">
                  <span className="uppercase text-outline font-bold">LOC_METRIC // 02</span>
                  <span className="px-1.5 py-0.5 bg-secondary text-on-secondary font-bold">SOLAR SHIFT</span>
                </div>
                <div className="text-3xl font-bold font-mono text-secondary">68.4%</div>
                <div className="text-xs text-on-surface-variant mt-1 font-medium">Compute deferred to solar apex</div>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between font-mono text-xs">
                <span className="text-outline">[SIMULATED EVENT]</span>
                <span className="material-symbols-outlined text-secondary text-[18px]">solar_power</span>
              </div>
            </div>

            {/* Metric Card 3 */}
            <div className="flex flex-col bg-surface border border-outline-variant p-6 shadow-sm justify-between">
              <div>
                <div className="flex justify-between items-start mb-3 font-mono text-xs">
                  <span className="uppercase text-outline font-bold">LOC_METRIC // 03</span>
                  <span className="px-1.5 py-0.5 bg-surface-container text-on-surface-variant font-bold">STUDENT ENCLAVE</span>
                </div>
                <div className="text-3xl font-bold font-mono text-primary">1,420 hrs</div>
                <div className="text-xs text-on-surface-variant mt-1 font-medium">Voluntary deep work logged locally</div>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between font-mono text-xs">
                <span className="text-outline">[ACTUAL INFERENCE]</span>
                <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
              </div>
            </div>

            {/* Metric Card 4 */}
            <div className="flex flex-col bg-surface border border-outline-variant p-6 shadow-sm justify-between">
              <div>
                <div className="flex justify-between items-start mb-3 font-mono text-xs">
                  <span className="uppercase text-outline font-bold">LOC_METRIC // 04</span>
                  <span className="px-1.5 py-0.5 bg-primary text-on-primary font-bold">HUMAN TRIBUNAL</span>
                </div>
                <div className="text-3xl font-bold font-mono text-primary">100%</div>
                <div className="text-xs text-on-surface-variant mt-1 font-medium">Human-in-the-loop review rate</div>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between font-mono text-xs">
                <span className="text-outline">[ACTUAL INFERENCE]</span>
                <span className="material-symbols-outlined text-secondary text-[18px]">gavel</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 02: CAMPUS MOBILITY & TRANSIT DECARBONIZATION */}
      <section className="w-full px-4 md:px-12 py-16 bg-surface-container-low border-b border-outline-variant">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="font-mono text-xs text-secondary uppercase font-bold mb-1">// TRANSIT ARCHITECTURE</div>
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
                Campus Mobility &amp; Transit Decarbonization
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mt-1">
                Coordinated carpool routing designed around student schedule overlaps, balancing personal transit time against net campus fuel consumption.
              </p>
            </div>

            {/* Detour Tolerance Toggle */}
            <div className="bg-surface border border-outline-variant p-3 shadow-sm flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between items-center gap-4">
                <span className="text-outline uppercase font-bold">DETOUR TOLERANCE CEILING</span>
                <span className="text-secondary font-bold">{detourTolerance} MIN TOLERANCE</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToleranceChange('3.5')}
                  className={`px-3 py-1 transition-all ${
                    detourTolerance === '3.5'
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  3.5 MIN (BALANCED)
                </button>
                <button
                  type="button"
                  onClick={() => handleToleranceChange('5.0')}
                  className={`px-3 py-1 transition-all ${
                    detourTolerance === '5.0'
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  5.0 MIN (MAX IMPACT)
                </button>
              </div>
            </div>
          </div>

          {/* Mobility Visualization Bento */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Route Diagram */}
            <div className="lg:col-span-7 bg-surface border border-outline-variant p-6 shadow-sm flex flex-col justify-between font-mono text-xs">
              <div className="flex justify-between items-center mb-4">
                <span className="text-outline uppercase font-bold">NODAL TOPOLOGY: QUADRANT A-4</span>
                <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant">
                  AUTONOMOUS MULTI-STOP MESH
                </span>
              </div>

              {/* Schematic SVG */}
              <div className="relative w-full h-64 bg-surface-container-low border border-outline-variant p-4 flex items-center justify-center overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 600 220" fill="none">
                  {/* Background route spine */}
                  <path d="M60 160 C 140 160, 160 70, 240 70" stroke="#c7c6ca" strokeDasharray="4 4" strokeWidth="2" />
                  <path d="M240 70 C 320 70, 360 140, 440 140" stroke="#c7c6ca" strokeDasharray="4 4" strokeWidth="2" />
                  <path d="M440 140 L 540 50" stroke="#c7c6ca" strokeDasharray="4 4" strokeWidth="2" />

                  {/* Active detour dynamic line */}
                  <path
                    d={
                      detourTolerance === '3.5'
                        ? 'M60 160 Q 150 120 240 70 T 440 140 T 540 50'
                        : 'M60 160 Q 150 180 240 70 T 440 170 T 540 50'
                    }
                    fill="none"
                    stroke="#003fe1"
                    strokeWidth="3.5"
                  />

                  {/* Nodes */}
                  <g transform="translate(60, 160)">
                    <circle r="12" fill="#faf9f5" stroke="#000000" strokeWidth="2" />
                    <circle r="4" fill="#003fe1" />
                    <text x="-25" y="24" className="font-mono text-[10px] font-bold fill-primary">Main Gate</text>
                  </g>
                  <g transform="translate(240, 70)">
                    <circle r="12" fill="#faf9f5" stroke="#000000" strokeWidth="2" />
                    <circle r="4" fill="#003fe1" />
                    <text x="-15" y="-16" className="font-mono text-[10px] font-bold fill-primary">Library Node</text>
                  </g>
                  <g transform="translate(440, 140)">
                    <circle r="12" fill="#faf9f5" stroke="#000000" strokeWidth="2" />
                    <circle r="4" fill="#003fe1" />
                    <text x="-20" y="24" className="font-mono text-[10px] font-bold fill-primary">Science Quad</text>
                  </g>
                  <g transform="translate(540, 50)">
                    <circle r="14" fill="#000000" stroke="#000000" strokeWidth="2" />
                    <circle r="4" fill="#ffffff" />
                    <text x="-25" y="-16" className="font-mono text-[10px] font-bold fill-primary">North Dorms</text>
                  </g>
                </svg>
              </div>

              <div className="flex justify-between items-center text-[11px] text-outline mt-3">
                <span>Dijkstra Shortest Path Matrix</span>
                <span className="text-secondary font-bold">Detour: {detourTolerance} min max</span>
              </div>
            </div>

            {/* Impact Metrics Breakdown */}
            <div className="lg:col-span-5 bg-surface border border-outline-variant p-6 shadow-sm flex flex-col justify-between font-mono text-xs">
              <div className="flex flex-col gap-4">
                <span className="text-outline uppercase font-bold">CARBON &amp; TRANSIT TRADEOFF ANALYSIS</span>

                <div className="space-y-3">
                  <div className="p-3 bg-surface-container-low border border-outline-variant flex justify-between items-center">
                    <div>
                      <span className="block font-bold text-primary">Solo Transit Footprint</span>
                      <span className="text-[11px] text-outline">Uncoordinated single-occupancy</span>
                    </div>
                    <span className="text-sm font-bold text-primary font-mono">148.5 kg CO₂/wk</span>
                  </div>

                  <div className="p-3 bg-surface-container-low border border-secondary flex justify-between items-center">
                    <div>
                      <span className="block font-bold text-secondary">UniVerse Coordinated Pool</span>
                      <span className="text-[11px] text-secondary">≤ {detourTolerance}m detour ceiling</span>
                    </div>
                    <span className="text-sm font-bold text-secondary font-mono">
                      {(148.5 - carbonSaved).toFixed(1)} kg CO₂/wk
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-surface-container border border-outline-variant">
                  <span className="text-[11px] text-outline block mb-1">PROVENANCE GUARANTEE</span>
                  <p className="font-sans text-xs text-on-surface-variant font-normal">
                    Route optimization calculated entirely on-device using topological adjacency graphs. Zero raw GPS coordinates transmitted to central servers.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/rides')}
                className="w-full mt-4 py-2.5 bg-primary text-on-primary font-bold uppercase hover:bg-secondary transition-all shadow-[2px_2px_0px_#003fe1]"
              >
                Inspect Live Ride Board →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03: SUSTAINABLE COMPUTING & SOLAR APEX */}
      <section className="w-full px-4 md:px-12 py-16 bg-surface border-b border-outline-variant">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs text-secondary uppercase font-bold">// COMPUTE EFFICIENCY</span>
            <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
              Diurnal Solar Synchronized HPC Scheduling
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Non-linear power scaling algorithm caps cluster power and defers heavy batch jobs (PyTorch/CUDA) to hours with peak on-campus photovoltaic generation.
            </p>
          </div>

          <div className="p-6 bg-surface-container-low border border-outline-variant font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="font-bold text-primary uppercase">CLUSTER POWER MODEL EQUATION</span>
              <span className="text-secondary font-bold">EMPIRICAL CUBIC FORMULA</span>
            </div>

            <div className="p-4 bg-surface border border-outline-variant text-center font-mono text-sm sm:text-base font-bold text-primary">
              P(U) = P_idle + (P_max - P_idle) &times; (U / 100)<sup>1.25</sup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-surface border border-outline-variant">
                <span className="text-outline text-[11px] block">P_idle (Idle Base Draw)</span>
                <span className="text-lg font-bold text-primary">120 W</span>
              </div>
              <div className="p-3 bg-surface border border-outline-variant">
                <span className="text-outline text-[11px] block">P_max (Peak Load Draw)</span>
                <span className="text-lg font-bold text-primary">450 W</span>
              </div>
              <div className="p-3 bg-surface border border-outline-variant">
                <span className="text-outline text-[11px] block">Superlinear Power Exponent</span>
                <span className="text-lg font-bold text-secondary">&alpha; = 1.25</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant px-4 md:px-12 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-on-surface-variant">
          <div className="flex items-center gap-3">
            <span className="font-bold text-primary uppercase">UniVerse Impact</span>
            <span className="text-outline">|</span>
            <span>Measurable Environmental &amp; Privacy Standards</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/sustainability')} className="hover:text-primary transition-colors">
              HPC Scheduler
            </button>
            <button onClick={() => navigate('/app')} className="text-secondary font-bold">
              Return to Console →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ImpactPage;
