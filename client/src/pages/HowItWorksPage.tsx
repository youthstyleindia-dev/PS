import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const HowItWorksPage: React.FC = () => {
  const navigate = useNavigate();

  // Stage 1 Interactive State
  const [discipline, setDiscipline] = useState('cs');
  const [scale, setScale] = useState('Micro');
  const [mentorshipBias, setMentorshipBias] = useState(4);
  const [graphSeed, setGraphSeed] = useState(1);

  // Stage 2 Interactive State
  const [selectedStation, setSelectedStation] = useState({
    id: 'STN_C',
    name: 'ENG_CORRIDOR (NODE C)',
    detour: '+3.2 min'
  });
  const [toleranceVal, setToleranceVal] = useState(3.5);
  const [tripLocked, setTripLocked] = useState(false);

  // Stage 3 Focus Pod Join State
  const [focusBroadcasted, setFocusBroadcasted] = useState(false);

  const stations = [
    { id: 'STN_A', code: 'A: WEST_QUAD', name: 'West Quad Hub', detour: '0 min', cx: 40, cy: 190 },
    { id: 'STN_B', code: 'B: SCIENCE', name: 'Science Concourse', detour: '+1.8 min', cx: 160, cy: 190 },
    { id: 'STN_C', code: 'C: ENG_CORRIDOR', name: 'Engineering Hall', detour: '+3.2 min', cx: 260, cy: 110 },
    { id: 'STN_D', code: 'D: LIBRARY', name: 'Memorial Library', detour: '+4.5 min', cx: 390, cy: 110 },
    { id: 'STN_E', code: 'E: BIOMED', name: 'BioMed Campus', detour: 'Terminus', cx: 490, cy: 40 }
  ];

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
              Workflow Spec
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 font-mono text-xs">
            <button onClick={() => navigate('/')} className="hover:text-secondary transition-colors">
              Platform
            </button>
            <button onClick={() => navigate('/how-it-works')} className="text-secondary font-bold">
              How It Works
            </button>
            <button onClick={() => navigate('/impact')} className="hover:text-secondary transition-colors">
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

      {/* Technical Header Protocol Strip */}
      <div className="w-full bg-surface-container-low border-b border-outline-variant px-4 md:px-12 py-2.5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-secondary border border-secondary px-1.5 py-0.2 bg-surface font-bold">
            PROTO_SPEC // 03
          </span>
          <span className="text-outline uppercase">STAGED_ORCHESTRATION_FLOW</span>
          <span className="text-outline hidden md:inline">[SIMULATED TOPOLOGY: ACTIVE]</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-primary font-bold">DISCOVERY → TRANSIT → STEWARDSHIP</span>
          </span>
          <span className="border border-dashed border-outline px-2 py-0.5 text-outline hidden sm:inline">
            [DEMO DATA MODE]
          </span>
        </div>
      </div>

      {/* Editorial Master Title */}
      <section className="w-full bg-surface border-b border-outline-variant px-4 md:px-12 py-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
          <div className="flex items-center gap-2 font-mono text-xs text-secondary uppercase font-bold">
            <span>§ 03.0</span>
            <span className="text-outline">/</span>
            <span>SYSTEM WORKFLOW ARCHITECTURE</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-primary font-extrabold tracking-tight">
            From disconnected to connected.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
            How UniVerse coordinates daily collegiate rhythms through decentralized trust and computational stewardship. Zero centralized surveillance, deterministic algorithms, and student-owned agency.
          </p>
        </div>
      </section>

      {/* Main 3-Stage Canvas */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-12 py-12 grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Left Sticky Rail Navigator */}
        <aside className="xl:col-span-3">
          <div className="sticky top-24 flex flex-col gap-4 p-4 bg-surface border border-outline-variant shadow-sm font-mono text-xs">
            <span className="text-outline uppercase font-bold tracking-wider">NAVIGATE WORKFLOW</span>

            <a
              href="#stage-01"
              className="p-3 border border-primary bg-primary text-on-primary flex items-center justify-between"
            >
              <span>01. Academic Discovery</span>
              <span className="material-symbols-outlined text-[16px]">hub</span>
            </a>

            <a
              href="#stage-02"
              className="p-3 border border-outline-variant bg-surface hover:bg-surface-container flex items-center justify-between transition-colors"
            >
              <span>02. Transit Mobility Grid</span>
              <span className="material-symbols-outlined text-[16px]">alt_route</span>
            </a>

            <a
              href="#stage-03"
              className="p-3 border border-outline-variant bg-surface hover:bg-surface-container flex items-center justify-between transition-colors"
            >
              <span>03. Campus Stewardship</span>
              <span className="material-symbols-outlined text-[16px]">energy_savings_leaf</span>
            </a>

            <div className="pt-3 border-t border-outline-variant text-[11px] text-outline">
              Deterministic routing • Local differential privacy • Non-linear power caps
            </div>
          </div>
        </aside>

        {/* Right Content Stream */}
        <main className="xl:col-span-9 flex flex-col gap-16">
          {/* ================= STAGE 01: DISCOVERY ================= */}
          <section id="stage-01" className="scroll-mt-24 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center bg-primary text-on-primary font-mono text-base font-bold shadow-[2px_2px_0px_#003fe1]">
                01
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-bold text-secondary uppercase">STAGE 01 // DISCOVERY MESH</span>
                  <span className="border border-dashed border-outline px-1.5 py-0.2 text-outline">[VECTOR COSINE]</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
                  Find Your Academic Coordinates.
                </h2>
              </div>
            </div>

            <div className="bg-surface border border-outline-variant p-6 flex flex-col gap-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-outline-variant pb-4">
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                  Local-first vector matching pairs students with complementary skills, thesis mentors, and study buddies using zero-knowledge cosine distance. Personal profiles remain on your device.
                </p>
                <div className="bg-surface-container-low p-3 border border-outline-variant font-mono text-xs flex flex-col gap-1 min-w-[220px]">
                  <span className="text-outline uppercase">Privacy Guarantee:</span>
                  <span className="text-primary font-bold">100% Client-Side Vectors</span>
                  <span className="text-outline">
                    Cryptographic Hash: <span className="text-secondary font-bold">SHA-256</span>
                  </span>
                </div>
              </div>

              {/* Interactive Skill Matching Simulator */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Simulator Controls */}
                <div className="lg:col-span-5 flex flex-col gap-3 bg-surface-container-low p-4 border border-outline-variant font-mono text-xs">
                  <span className="text-outline uppercase font-bold">Input Skill Vector</span>

                  <div className="flex flex-col gap-1">
                    <label className="text-on-surface-variant">Core Focus Discipline</label>
                    <select
                      value={discipline}
                      onChange={(e) => setDiscipline(e.target.value)}
                      className="w-full bg-surface border border-outline-variant p-2 text-on-surface focus:outline-none focus:border-secondary"
                    >
                      <option value="cs">Distributed Systems &amp; CompSci</option>
                      <option value="arch">Urban Architecture &amp; Spatial Des</option>
                      <option value="econ">Behavioral Economics &amp; Policy</option>
                      <option value="bio">Computational Biology</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-on-surface-variant">Placement Task Scale</label>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {['Micro', 'Sprint', 'Term'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setScale(s)}
                          className={`py-1 border ${
                            scale === s
                              ? 'border-primary bg-primary text-on-primary font-bold'
                              : 'border-outline-variant bg-surface text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          {s} {s === 'Micro' ? '(1w)' : s === 'Sprint' ? '(4w)' : '(12w)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-on-surface-variant">Peer Mentorship Bias</label>
                    <div className="flex items-center justify-between">
                      <span className="text-outline">Direct</span>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={mentorshipBias}
                        onChange={(e) => setMentorshipBias(Number(e.target.value))}
                        className="w-28 accent-secondary cursor-pointer"
                      />
                      <span className="text-secondary font-bold">Cross-Field</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGraphSeed((prev) => prev + 1)}
                    className="mt-2 bg-primary text-on-primary py-2 px-4 uppercase tracking-wider font-bold hover:bg-secondary transition-all shadow-[2px_2px_0px_#003fe1]"
                  >
                    Recompute Graph
                  </button>
                </div>

                {/* Right: Discovered Peer Nodes */}
                <div className="lg:col-span-7 flex flex-col gap-3 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-outline uppercase font-bold">
                      DISCOVERED PEER NODES (CRYPTOGRAPHIC ANONYMOUS)
                    </span>
                    <span className="text-secondary font-bold">[SEED #{graphSeed} ACTIVE]</span>
                  </div>

                  <div className="flex flex-col gap-2 text-xs">
                    <div className="bg-surface p-3 border border-outline-variant flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-secondary font-bold text-lg">#84F</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-primary font-sans text-sm">
                            Systems Theory // Peer Mentor
                          </span>
                          <span className="text-outline text-[11px]">
                            Affinity: {94 + (graphSeed % 5)}.{graphSeed}4% • Mutual Crypt-Hash: 0x93b...19a
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-surface-container text-on-surface border border-outline-variant">
                        P2P_DIRECT
                      </span>
                    </div>

                    <div className="bg-surface p-3 border border-outline-variant flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-outline font-bold text-lg">#22A</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-primary font-sans text-sm">
                            Decentralized Lab // Sprint Collab
                          </span>
                          <span className="text-outline text-[11px]">
                            Affinity: 91.2% • Mutual Crypt-Hash: 0x48e...03f
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-surface-container text-on-surface border border-outline-variant">
                        P2P_DIRECT
                      </span>
                    </div>

                    <div className="bg-surface p-3 border border-outline-variant flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-outline font-bold text-lg">#57C</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-primary font-sans text-sm">
                            Spatial Analysis // Task Buddy
                          </span>
                          <span className="text-outline text-[11px]">
                            Affinity: 87.8% • Mutual Crypt-Hash: 0xaa2...71e
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-surface-container text-on-surface border border-outline-variant">
                        P2P_DIRECT
                      </span>
                    </div>
                  </div>

                  {/* SVG Topology Visualizer */}
                  <div className="w-full bg-surface-container-low border border-outline-variant p-2 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-outline text-[11px] border-b border-outline-variant pb-1">
                      <span>LOCAL VECTOR MATCHING (COSINE DISTANCE)</span>
                      <span>[ILLUSTRATIVE TOPOLOGY]</span>
                    </div>
                    <svg className="w-full h-16 text-on-surface-variant overflow-visible" viewBox="0 0 460 70">
                      <line x1="40" y1="35" x2="160" y2="20" stroke="#c7c6ca" strokeDasharray="2 2" strokeWidth="1" />
                      <line x1="40" y1="35" x2="160" y2="50" stroke="#c7c6ca" strokeDasharray="2 2" strokeWidth="1" />
                      <line x1="160" y1="20" x2="310" y2="35" stroke="#003fe1" strokeWidth="1.5" />
                      <line x1="160" y1="50" x2="310" y2="35" stroke="#c7c6ca" strokeWidth="1" />
                      <line x1="310" y1="35" x2="420" y2="35" stroke="#000000" strokeWidth="2" />

                      <circle cx="40" cy="35" r="6" fill="#000000" />
                      <text x="40" y="58" textAnchor="middle" className="font-mono text-[9px] fill-current">
                        STUDENT
                      </text>
                      <circle cx="160" cy="20" r="5" fill="#003fe1" />
                      <text x="160" y="12" textAnchor="middle" className="font-mono text-[9px] fill-[#003fe1]">
                        DISCIPLINE
                      </text>
                      <circle cx="160" cy="50" r="5" fill="#77777b" />
                      <text x="160" y="65" textAnchor="middle" className="font-mono text-[9px] fill-current">
                        TIMEFRAME
                      </text>
                      <circle cx="310" cy="35" r="6" fill="#003fe1" />
                      <text x="310" y="22" textAnchor="middle" className="font-mono text-[9px] fill-[#003fe1]">
                        ZERO_ZK_HASH
                      </text>
                      <circle cx="420" cy="35" r="8" fill="#000000" />
                      <circle cx="420" cy="35" r="3" fill="#ffffff" />
                      <text x="420" y="58" textAnchor="middle" className="font-mono text-[9px] font-bold fill-current">
                        MATCH_PEER
                      </text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= STAGE 02: TRANSIT ================= */}
          <section id="stage-02" className="scroll-mt-24 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center bg-primary text-on-primary font-mono text-base font-bold shadow-[2px_2px_0px_#003fe1]">
                02
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-bold text-secondary uppercase">STAGE 02 // MOBILITY GRID</span>
                  <span className="border border-dashed border-outline px-1.5 py-0.2 text-outline">[DIJKSTRA]</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
                  Make a Smarter Move.
                </h2>
              </div>
            </div>

            <div className="bg-surface border border-outline-variant p-6 flex flex-col gap-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-outline-variant pb-4">
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                  Campus shuttles and peer carpools coordinate via a deterministic Dijkstra graph. Rides match dynamically under an immutable{' '}
                  <span className="text-primary font-semibold font-mono">≤ 5-minute detour ceiling</span> to eliminate transit fragmentation and excess idle emissions.
                </p>
                <div className="bg-surface-container-low p-3 border border-outline-variant font-mono text-xs flex flex-col gap-1 min-w-[240px]">
                  <span className="text-outline uppercase">Dynamic Routing Tolerance:</span>
                  <span className="font-mono text-primary font-semibold">Δt ≤ 5.00 min [HARD CEILING]</span>
                  <span className="text-outline">
                    Carbon Offset Estimate: <span className="text-secondary font-bold">-44.8 kg CO₂/wk</span>
                  </span>
                </div>
              </div>

              {/* Schematic Map & Detour Sandbox */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* SVG Schematic Map */}
                <div className="lg:col-span-7 flex flex-col gap-3 bg-surface p-4 border border-outline-variant">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-2 font-mono text-xs">
                    <span className="font-bold text-primary uppercase">SCHEMATIC_CAMPUS_TOPOLOGY // NORTH_AXIS</span>
                    <span className="text-secondary">LIVE_CORRIDOR</span>
                  </div>

                  <div className="relative w-full bg-surface-container-lowest border border-outline-variant p-2 overflow-hidden">
                    <svg className="w-full h-auto select-none" viewBox="0 0 540 240">
                      {/* Arterial Transit Spine (Dijkstra path) */}
                      <path
                        d="M 40,190 L 160,190 L 260,110 L 390,110 L 490,40"
                        fill="none"
                        stroke="#003fe1"
                        strokeLinecap="round"
                        strokeWidth="4"
                      />
                      <path
                        d="M 160,190 L 210,70 L 390,110"
                        fill="none"
                        stroke="#c7c6ca"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                      />
                      {/* Detour Arc */}
                      <path
                        d="M 260,110 Q 320,170 390,110"
                        fill="none"
                        stroke="#ba1a1a"
                        strokeDasharray="3 3"
                        strokeWidth="2"
                      />

                      {/* Station Nodes */}
                      {stations.map((stn) => {
                        const isSelected = selectedStation.id === stn.id;
                        return (
                          <g
                            key={stn.id}
                            className="cursor-pointer"
                            onClick={() =>
                              setSelectedStation({
                                id: stn.id,
                                name: `${stn.name} (${stn.code.split(':')[0]})`,
                                detour: stn.detour
                              })
                            }
                          >
                            <circle
                              cx={stn.cx}
                              cy={stn.cy}
                              r={isSelected ? 9 : 7}
                              fill={isSelected ? '#003fe1' : '#ffffff'}
                              stroke={isSelected ? '#ffffff' : '#000000'}
                              strokeWidth={isSelected ? 2 : 3}
                            />
                            <text
                              x={stn.cx}
                              y={stn.cy > 100 ? stn.cy + 22 : stn.cy - 12}
                              textAnchor="middle"
                              className={`font-mono text-[10px] font-bold ${
                                isSelected ? 'fill-[#003fe1]' : 'fill-[#1b1c1a]'
                              }`}
                            >
                              {stn.code}
                            </text>
                          </g>
                        );
                      })}

                      {/* Vehicle Puck */}
                      <g transform="translate(260, 110)">
                        <rect x="-14" y="-14" width="28" height="28" rx="2" fill="#000000" />
                        <text x="0" y="4" textAnchor="middle" className="font-mono text-[9px] fill-white font-bold">
                          V-2
                        </text>
                      </g>
                    </svg>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-surface-container-low border border-outline-variant font-mono text-xs">
                    <span className="text-outline">
                      Active Pin: <strong className="text-primary">{selectedStation.name}</strong>
                    </span>
                    <span className="text-secondary font-bold">
                      Detour Cost: {selectedStation.detour} [PERMISSIBLE]
                    </span>
                  </div>
                </div>

                {/* Right Seat Pooling Controls */}
                <div className="lg:col-span-5 flex flex-col gap-4 bg-surface-container-low p-4 border border-outline-variant justify-between font-mono text-xs">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                      <span className="font-bold text-primary uppercase">POOLING COMPATIBILITY ENGINE</span>
                      <span className="text-outline">[DIJKSTRA_V2]</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-on-surface-variant">Detour Tolerance Ceiling</label>
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-primary">{toleranceVal.toFixed(1)} min</span>
                        <span className="text-outline text-[11px]">MAX ALLOWED: 5.0 min</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.5"
                        value={toleranceVal}
                        onChange={(e) => setToleranceVal(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Shuttle Capacity */}
                    <div className="flex flex-col gap-1">
                      <span className="text-outline uppercase text-[11px]">Shuttle V-2 Current Capacity</span>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                        <div className="bg-primary text-on-primary p-2 border border-primary font-bold">P1 [LOCKED]</div>
                        <div className="bg-primary text-on-primary p-2 border border-primary font-bold">P2 [LOCKED]</div>
                        <div className="bg-secondary text-on-secondary p-2 border border-secondary font-bold">P3 [YOU]</div>
                        <div className="bg-surface text-outline p-2 border border-dashed border-outline">OPEN</div>
                      </div>
                    </div>

                    {/* Detour Audit Verdict */}
                    <div className="p-3 bg-surface border border-outline-variant flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-outline text-[11px]">Algorithm Verification:</span>
                        <span className="text-secondary font-bold">ACCEPTED // COMPATIBLE</span>
                      </div>
                      <p className="font-sans text-xs text-on-surface-variant font-normal">
                        Adding passenger at Node C incurs a 3.2m deviation. Route remains within the strict 5-minute constraint. No existing schedule violated.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline-variant flex items-center justify-between">
                    <span className="text-outline text-[11px]">[ILLUSTRATIVE ROUTE ESTIMATE]</span>
                    <button
                      type="button"
                      onClick={() => setTripLocked(!tripLocked)}
                      className={`py-2 px-4 uppercase font-bold tracking-wider transition-all shadow-[2px_2px_0px_#003fe1] ${
                        tripLocked ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary hover:bg-secondary'
                      }`}
                    >
                      {tripLocked ? 'Trip Confirmed ✓' : 'Lock Shared Trip'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= STAGE 03: STEWARDSHIP ================= */}
          <section id="stage-03" className="scroll-mt-24 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center bg-primary text-on-primary font-mono text-base font-bold shadow-[2px_2px_0px_#003fe1]">
                03
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-bold text-secondary uppercase">STAGE 03 // CAMPUS STEWARDSHIP</span>
                  <span className="border border-dashed border-outline px-1.5 py-0.2 text-outline">[DEMO DATA FEED]</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
                  See the Bigger Picture.
                </h2>
              </div>
            </div>

            <div className="bg-surface border border-outline-variant p-6 flex flex-col gap-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-outline-variant pb-4">
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                  Collective academic health without privacy invasion. Workload energy telemetry monitors systemic exhaustion, coordinates voluntary collective focus blocks, and resolves exam anomalies through peer tribunal review rather than automated proctoring AI.
                </p>
                <div className="bg-surface-container-low p-3 border border-outline-variant font-mono text-xs flex flex-col gap-1 min-w-[240px]">
                  <span className="text-outline uppercase">Auditing Protocol:</span>
                  <span className="text-primary font-bold">Decentralized Peer Tribunal</span>
                  <span className="text-outline">
                    Algorithm Override Power: <span className="text-secondary font-bold">100% Student-Held</span>
                  </span>
                </div>
              </div>

              {/* Stewardship Telemetry Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Exhaustion Index */}
                <div className="bg-surface p-4 border border-outline-variant flex flex-col justify-between gap-4 font-mono text-xs">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-1">
                      <span className="text-primary font-bold uppercase">CAMPUS EXHAUSTION INDEX</span>
                      <span className="text-outline">[DEMO DATA]</span>
                    </div>
                    <div className="text-2xl font-bold text-primary mt-2">
                      68.2 <span className="text-xs text-secondary">/ 100</span>
                    </div>
                    <span className="text-[11px] text-outline">AGGREGATE 7-DAY WORKLOAD PRESSURE</span>
                  </div>

                  {/* Sparkline Bars */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-end justify-between h-20 gap-1 border-b border-outline-variant pb-1">
                      <div className="w-full bg-surface-container-highest h-[45%] hover:bg-secondary transition-colors" title="Mon: 45%"></div>
                      <div className="w-full bg-surface-container-highest h-[55%] hover:bg-secondary transition-colors" title="Tue: 55%"></div>
                      <div className="w-full bg-surface-container-highest h-[72%] hover:bg-secondary transition-colors" title="Wed: 72%"></div>
                      <div className="w-full bg-secondary h-[88%] hover:bg-primary transition-colors" title="Thu: 88% (Midterm Spike)"></div>
                      <div className="w-full bg-surface-container-highest h-[64%] hover:bg-secondary transition-colors" title="Fri: 64%"></div>
                      <div className="w-full bg-surface-container-highest h-[30%] hover:bg-secondary transition-colors" title="Sat: 30%"></div>
                      <div className="w-full bg-surface-container-highest h-[22%] hover:bg-secondary transition-colors" title="Sun: 22%"></div>
                    </div>
                    <div className="flex justify-between text-outline text-[10px]">
                      <span>M</span><span>T</span><span>W</span><span className="text-secondary font-bold">T</span><span>F</span><span>S</span><span>S</span>
                    </div>
                  </div>

                  <p className="font-sans text-xs text-on-surface-variant font-normal">
                    Synthesized from self-reported study logs without revealing individual grades or specific enrolled courses.
                  </p>
                </div>

                {/* Card 2: Communal Focus Pods */}
                <div className="bg-surface p-4 border border-outline-variant flex flex-col justify-between gap-4 font-mono text-xs">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-1">
                      <span className="text-primary font-bold uppercase">COMMUNAL FOCUS PODS</span>
                      <span className="text-secondary">[ACTIVE 28]</span>
                    </div>
                    <div className="text-2xl font-bold text-primary mt-2">
                      412 <span className="text-xs text-outline font-normal">STUDENTS</span>
                    </div>
                    <span className="text-[11px] text-outline">VOLUNTARY DEEP STUDY MESH</span>
                  </div>

                  <div className="flex flex-col gap-2 text-xs">
                    <div className="p-2 bg-surface-container border border-outline-variant flex justify-between items-center">
                      <span className="font-sans text-xs">Library Rotunda (Deep Silence)</span>
                      <span className="text-secondary font-bold">94/100 Seats</span>
                    </div>
                    <div className="p-2 bg-surface-container border border-outline-variant flex justify-between items-center">
                      <span className="font-sans text-xs">BioMed Commons (Low Ambient)</span>
                      <span className="text-primary font-bold">62/80 Seats</span>
                    </div>
                    <div className="p-2 bg-surface-container border border-outline-variant flex justify-between items-center">
                      <span className="font-sans text-xs">Arch Studio 4 (Collaborative)</span>
                      <span className="text-outline font-bold">28/40 Seats</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFocusBroadcasted(!focusBroadcasted)}
                    className="w-full bg-surface-container-low border border-primary text-primary hover:bg-primary hover:text-on-primary py-2 uppercase font-bold tracking-wider transition-colors"
                  >
                    {focusBroadcasted ? 'Seat Beacon Broadcast Active ✓' : 'Broadcast Seat Availability'}
                  </button>
                </div>

                {/* Card 3: Human Exam Tribunal Queue */}
                <div className="bg-surface p-4 border border-outline-variant flex flex-col justify-between gap-4 font-mono text-xs">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-1">
                      <span className="text-primary font-bold uppercase">TRIBUNAL AUDIT QUEUE</span>
                      <span className="text-secondary">[2 PENDING]</span>
                    </div>
                    <div className="text-2xl font-bold text-primary mt-2">
                      0 <span className="text-xs text-outline font-normal">AUTO-PENALTIES</span>
                    </div>
                    <span className="text-[11px] text-outline">HUMAN-IN-THE-LOOP MANDATE</span>
                  </div>

                  <div className="p-3 bg-surface-container-low border border-outline-variant flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-outline">INCIDENT #EX-4091</span>
                      <span className="text-secondary font-bold">ANOMALY FLAG</span>
                    </div>
                    <p className="font-sans text-xs text-on-surface-variant font-normal">
                      Browser blur detected during 14:02:18 exam window. Context note: Multi-factor token verification popup reported by student.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/exams')}
                    className="w-full bg-primary text-on-primary py-2 uppercase font-bold tracking-wider hover:bg-secondary transition-all shadow-[2px_2px_0px_#003fe1]"
                  >
                    Open Proctor Tribunal
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Protocol Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant px-4 md:px-12 py-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-on-surface-variant">
          <div className="flex items-center gap-3">
            <span className="font-bold text-primary uppercase">UniVerse Workflow</span>
            <span className="text-outline">|</span>
            <span>Deterministic Campus Infrastructure</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/onboarding')} className="hover:text-primary transition-colors">
              Node Onboarding
            </button>
            <button onClick={() => navigate('/app')} className="text-secondary font-bold">
              Launch App Console →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HowItWorksPage;
