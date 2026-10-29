import React, { useState } from 'react';

export const SustainabilityPage: React.FC = () => {
  const [scenario, setScenario] = useState<'optimized' | 'baseline'>('optimized');
  const [utilization, setUtilization] = useState(45);
  const [pue, setPue] = useState(1.14);
  const [gridIntensity, setGridIntensity] = useState(184);

  // Non-linear power model: P(U) = P_idle + (P_max - P_idle) * (U / 100)^1.25
  const P_idle = 120; // Watts
  const P_max = 480;  // Watts
  const serverPowerWatts = P_idle + (P_max - P_idle) * Math.pow(utilization / 100, 1.25);
  const facilityPowerWatts = serverPowerWatts * pue;
  const carbonPerHourGrams = (facilityPowerWatts / 1000) * gridIntensity;

  return (
    <div className="flex flex-col w-full font-body-md text-on-surface gap-6">
      {/* Top Banner Section */}
      <section className="w-full bg-surface-container-lowest p-6 md:p-8 border border-outline-variant shadow-sm flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-secondary font-label-md text-label-md uppercase tracking-wider font-mono font-bold">
              <span className="material-symbols-outlined text-[16px]">eco</span>
              <span>MODULE 03 // SUSTAINABLE COMPUTATION OBSERVATORY</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-primary font-extrabold tracking-tight">
              Know what your workloads cost the planet.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
              Student and academic research workloads shouldn’t compute in the dark. UniVerse orchestrates machine learning, routing models, and batch vector queries to execute precisely when regional clean energy supplies peak—aligning collegiate computing directly with grid realities.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-between self-stretch">
            <div className="w-full p-4 bg-surface-container-low border border-outline-variant shadow-sm flex flex-col gap-2 font-mono">
              <div className="flex items-center justify-between text-outline text-xs">
                <span>OBSERVABILITY PIPELINE</span>
                <span className="text-secondary font-bold">ONLINE</span>
              </div>
              <p className="text-xs text-on-surface leading-tight">
                Deterministic spatial-temporal shifting for campus cluster servers. Non-urgent background queries defer execution automatically.
              </p>
              <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
                <span>MARGINAL_INTENSITY</span>
                <span className="font-bold text-primary">{gridIntensity} g CO₂e/kWh</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics Strip: 4 Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-surface-container-lowest border border-outline-variant shadow-sm flex flex-col justify-between hover:border-secondary transition-all">
          <div className="flex items-center justify-between pb-2 text-outline font-label-sm text-label-sm font-mono">
            <span>ACTIVE COMPUTATION POOL</span>
            <span>[SIMULATED]</span>
          </div>
          <div className="my-2">
            <div className="font-data-metric text-data-metric text-primary font-bold">64</div>
            <div className="font-body-sm text-body-sm text-on-surface-variant font-medium">Provisioned Micro-Nodes</div>
          </div>
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary font-mono border-t border-outline-variant/40 pt-2">
            <span className="material-symbols-outlined text-[14px]">grid_view</span>
            <span>Heterogeneous edge + lab rigs</span>
          </div>
        </div>

        <div className="p-6 bg-surface-container-lowest border border-outline-variant shadow-sm flex flex-col justify-between hover:border-secondary transition-all">
          <div className="flex items-center justify-between pb-2 text-outline font-label-sm text-label-sm font-mono">
            <span>CO₂e AVOIDED (7D)</span>
            <span>[ILLUSTRATIVE]</span>
          </div>
          <div className="my-2">
            <div className="font-data-metric text-data-metric text-secondary font-bold">
              14.2 <span className="font-body-md text-body-md text-on-surface font-normal font-mono">kg</span>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant font-medium">Deferred Workload Savings</div>
          </div>
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant font-mono border-t border-outline-variant/40 pt-2">
            <span className="material-symbols-outlined text-[14px]">trending_down</span>
            <span>-38.4% vs unmanaged batch runs</span>
          </div>
        </div>

        <div className="p-6 bg-surface-container-lowest border border-outline-variant shadow-sm flex flex-col justify-between hover:border-secondary transition-all">
          <div className="flex items-center justify-between pb-2 text-outline font-label-sm text-label-sm font-mono">
            <span>GREEN GRID ALIGNMENT</span>
            <span>[REAL-TIME]</span>
          </div>
          <div className="my-2">
            <div className="font-data-metric text-data-metric text-primary font-bold">
              84.2<span className="font-headline-sm text-headline-sm text-secondary font-bold">%</span>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant font-medium">Solar &amp; Hydro Synchronized</div>
          </div>
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant font-mono border-t border-outline-variant/40 pt-2">
            <span className="material-symbols-outlined text-[14px]">wb_sunny</span>
            <span>Peak execution: 12:45 UTC</span>
          </div>
        </div>

        <div className="p-6 bg-surface-container-lowest border border-outline-variant shadow-sm flex flex-col justify-between hover:border-secondary transition-all">
          <div className="flex items-center justify-between pb-2 text-outline font-label-sm text-label-sm font-mono">
            <span>DATA CENTER EFFICIENCY</span>
            <span>[AUDITED]</span>
          </div>
          <div className="my-2">
            <div className="font-data-metric text-data-metric text-primary font-bold">
              {pue.toFixed(2)} <span className="font-label-md text-label-md text-outline font-normal font-mono">PUE</span>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant font-medium">Campus Server Vault Index</div>
          </div>
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant font-mono border-t border-outline-variant/40 pt-2">
            <span className="material-symbols-outlined text-[14px]">thermostat</span>
            <span>Free-air winter intake enabled</span>
          </div>
        </div>
      </section>

      {/* Interactive 24-Hour Diurnal Workload Scheduler */}
      <section className="w-full bg-surface-container-lowest p-6 md:p-8 border border-outline-variant shadow-sm flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/60 pb-4">
          <div>
            <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold font-mono">
              DIURNAL SCHEDULER // TEMPORAL OPTIMIZATION
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold mt-1">
              Solar Apex vs Grid Carbon Intensity
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1">
              Visualizing how heavy batch training cycles, campus map graph updates, and vector embeddings shift dynamically away from fossil-peaking grid periods (18:00–22:00) into low-carbon regional generation hours (11:00–15:00).
            </p>
          </div>

          {/* Interactive Scenario Toggle */}
          <div className="flex items-center p-1 bg-surface-container border border-outline-variant font-mono text-xs">
            <button
              onClick={() => setScenario('baseline')}
              className={`px-4 py-2 font-bold uppercase transition-all ${
                scenario === 'baseline' ? 'bg-error text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Standard Run (Unshifted)
            </button>
            <button
              onClick={() => setScenario('optimized')}
              className={`px-4 py-2 font-bold uppercase transition-all ${
                scenario === 'optimized' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              UniVerse Eco-Shifted
            </button>
          </div>
        </div>

        {/* SVG Diurnal Carbon Intensity Curve */}
        <div className="w-full bg-surface-container-low p-4 border border-outline-variant overflow-x-auto">
          <div className="min-w-[700px]">
            <svg viewBox="0 0 900 320" className="w-full h-auto">
              <defs>
                <linearGradient id="solarGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#003fe1" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#003fe1" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line stroke="#c7c6ca" strokeDasharray="3 3" strokeWidth="0.75" x1="50" x2="870" y1="40" y2="40" />
              <line stroke="#c7c6ca" strokeDasharray="3 3" strokeWidth="0.75" x1="50" x2="870" y1="100" y2="100" />
              <line stroke="#c7c6ca" strokeDasharray="3 3" strokeWidth="0.75" x1="50" x2="870" y1="160" y2="160" />
              <line stroke="#c7c6ca" strokeDasharray="3 3" strokeWidth="0.75" x1="50" x2="870" y1="220" y2="220" />
              <line stroke="#1b1c1a" strokeWidth="1.5" x1="50" x2="870" y1="280" y2="280" />

              {/* Y-Axis Labels */}
              <text className="fill-outline font-mono text-[10px]" textAnchor="end" x="40" y="45">350 g</text>
              <text className="fill-outline font-mono text-[10px]" textAnchor="end" x="40" y="105">250 g</text>
              <text className="fill-outline font-mono text-[10px]" textAnchor="end" x="40" y="165">150 g</text>
              <text className="fill-outline font-mono text-[10px]" textAnchor="end" x="40" y="225">50 g</text>
              <text className="fill-outline font-mono text-[10px]" textAnchor="end" x="40" y="285">0 g</text>

              {/* Solar Surplus Zone */}
              <rect fill="#dde1ff" height="240" opacity="0.45" width="150" x="425" y="40" />
              <text className="fill-secondary font-mono text-[10px] font-bold" textAnchor="middle" x="500" y="30">
                SOLAR SURPLUS APEX (11:00 - 15:00)
              </text>

              {/* Dirty Evening Peak Zone */}
              <rect fill="#ffdad6" height="240" opacity="0.4" width="140" x="685" y="40" />
              <text className="fill-error font-mono text-[10px] font-bold" textAnchor="middle" x="755" y="30">
                GRID CARBON PEAK (18:00 - 22:00)
              </text>

              {/* Carbon Intensity Curve */}
              <path
                d="M 50,130 C 130,120 180,105 250,85 C 320,65 380,185 450,210 C 500,225 550,200 620,150 C 670,110 700,50 750,48 C 800,46 840,90 870,125"
                fill="none"
                stroke="#77777b"
                strokeDasharray="4 2"
                strokeWidth="2.5"
              />

              {/* Baseline Scenario */}
              {scenario === 'baseline' ? (
                <g>
                  <path
                    d="M 50,280 L 50,230 Q 250,220 400,210 T 650,150 Q 750,80 820,100 T 870,230 L 870,280 Z"
                    fill="#ba1a1a"
                    fillOpacity="0.18"
                  />
                  <path
                    d="M 50,230 Q 250,220 400,210 T 650,150 Q 750,80 820,100 T 870,230"
                    fill="none"
                    stroke="#ba1a1a"
                    strokeWidth="3.5"
                  />
                  <circle cx="750" cy="80" fill="#ba1a1a" r="5" />
                  <text className="fill-error font-mono text-[11px] font-bold" textAnchor="middle" x="750" y="65">
                    Unshifted Batch Runs (720 kWh at dirty peak)
                  </text>
                </g>
              ) : (
                /* Eco-Shifted Scenario */
                <g>
                  <path
                    d="M 50,280 L 50,265 Q 200,265 350,250 Q 425,230 450,100 Q 500,75 550,110 Q 620,240 700,265 T 870,270 L 870,280 Z"
                    fill="url(#solarGlow)"
                  />
                  <path
                    d="M 50,265 Q 200,265 350,250 Q 425,230 450,100 Q 500,75 550,110 Q 620,240 700,265 T 870,270"
                    fill="none"
                    stroke="#003fe1"
                    strokeWidth="3.5"
                  />
                  <circle cx="500" cy="75" fill="#003fe1" r="5" />
                  <text className="fill-secondary font-mono text-[11px] font-bold" textAnchor="middle" x="500" y="60">
                    Shifted into Clean Solar Apex (+210% throughput)
                  </text>
                  <circle cx="750" cy="265" fill="#003fe1" r="4" />
                  <text className="fill-on-surface-variant font-mono text-[10px]" textAnchor="middle" x="750" y="255">
                    Dirty hours: Dormant (Zero batch runs)
                  </text>
                </g>
              )}

              {/* X-Axis Timeline Labels */}
              <text className="fill-on-surface font-mono text-[11px]" textAnchor="middle" x="50" y="300">00:00</text>
              <text className="fill-outline font-mono text-[11px]" textAnchor="middle" x="150" y="300">03:00</text>
              <text className="fill-outline font-mono text-[11px]" textAnchor="middle" x="255" y="300">06:00</text>
              <text className="fill-outline font-mono text-[11px]" textAnchor="middle" x="360" y="300">09:00</text>
              <text className="fill-secondary font-mono text-[11px] font-bold" textAnchor="middle" x="500" y="300">13:00 (NOON APEX)</text>
              <text className="fill-outline font-mono text-[11px]" textAnchor="middle" x="640" y="300">17:00</text>
              <text className="fill-error font-mono text-[11px] font-bold" textAnchor="middle" x="750" y="300">20:00 (EVENING PEAK)</text>
              <text className="fill-on-surface font-mono text-[11px]" textAnchor="middle" x="870" y="300">23:59</text>
            </svg>
          </div>
        </div>

        {/* Telemetry Context Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 font-mono">
          <div className="p-4 bg-surface-container-low border border-outline-variant flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-outline">DYNAMIC DEFERRAL WINDOW</span>
            <span className="font-headline-sm text-headline-sm text-primary font-bold">3.8 Hours Average</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant font-sans">
              Non-urgent jobs queue automatically until marginal carbon falls below 140 g/kWh threshold.
            </span>
          </div>

          <div className="p-4 bg-surface-container-low border border-outline-variant flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-outline">SOLAR MATCH ACCURACY</span>
            <span className="font-headline-sm text-headline-sm text-secondary font-bold">96.4% Coincidence</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant font-sans">
              Synchronized via deterministic forecast telemetry using ISO generation feeds.
            </span>
          </div>

          <div className="p-4 bg-surface-container-low border border-outline-variant flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-outline">EMISSIONS SURCHARGE</span>
            <span className="font-headline-sm text-headline-sm text-primary font-bold">0.00 kg Unaccounted</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant font-sans">
              Physical tracking guarantees zero unverified offset purchases; purely real displacement.
            </span>
          </div>
        </div>
      </section>

      {/* Non-Linear Server Power Model Sandbox */}
      <section className="w-full bg-surface-container-lowest p-6 md:p-8 border border-outline-variant shadow-sm flex flex-col gap-6">
        <div className="border-b border-outline-variant/60 pb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold font-mono">
              ALGORITHMIC MODEL SANDBOX // SPEC_03
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold mt-1">
              Non-Linear Power &amp; Facility PUE Sandbox
            </h2>
          </div>
          <span className="bg-surface-container px-3 py-1 font-mono text-xs text-primary font-bold border border-outline-variant">
            P(U) = P_idle + (P_max - P_idle) &times; (U / 100)^1.25
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Sliders */}
          <div className="lg:col-span-7 space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>CLUSTER WORKLOAD UTILIZATION (U):</span>
                <span className="text-secondary">{utilization}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={utilization}
                onChange={(e) => setUtilization(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>FACILITY POWER USAGE EFFECTIVENESS (PUE):</span>
                <span className="text-secondary">{pue.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.05"
                max="2.00"
                step="0.01"
                value={pue}
                onChange={(e) => setPue(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-outline mt-0.5">
                <span>1.05 (Hyperscale Free-Air)</span>
                <span>1.14 (UniVerse Vault)</span>
                <span>1.75 (Legacy Data Center)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>GRID CARBON FACTOR:</span>
                <span className="text-secondary">{gridIntensity} g/kWh</span>
              </div>
              <input
                type="range"
                min="40"
                max="800"
                step="5"
                value={gridIntensity}
                onChange={(e) => setGridIntensity(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          {/* Real-Time Calculation Card */}
          <div className="lg:col-span-5 bg-surface-container-low p-6 border border-outline-variant space-y-4 font-mono">
            <div className="text-xs text-outline uppercase font-bold border-b border-outline-variant pb-1">
              REAL-TIME COMPLIANCE OUTPUT
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-xs text-on-surface-variant">Server Power (P_IT):</span>
              <span className="text-lg font-bold text-primary">{serverPowerWatts.toFixed(1)} W</span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-xs text-on-surface-variant">Total Facility Power (P_total):</span>
              <span className="text-xl font-bold text-secondary">{facilityPowerWatts.toFixed(1)} W</span>
            </div>

            <div className="flex justify-between items-baseline border-t border-outline-variant/60 pt-2">
              <span className="text-xs text-on-surface-variant">Hourly Carbon Footprint:</span>
              <span className="text-2xl font-bold text-primary">{carbonPerHourGrams.toFixed(1)} g CO₂e/h</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SustainabilityPage;
