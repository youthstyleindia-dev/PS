import React, { useState, useEffect } from 'react';

export const WellbeingPage: React.FC = () => {
  const [seconds, setSeconds] = useState(42 * 60 + 18);
  const [targetMinutes] = useState(60);
  const [isRunning, setIsRunning] = useState(true);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [dataPurged, setDataPurged] = useState(false);

  // Focus timer countdown
  useEffect(() => {
    let interval: any = null;
    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, seconds]);

  const togglePause = () => {
    setIsRunning(!isRunning);
  };

  const concludeSession = () => {
    setIsRunning(false);
    setSessionCompleted(true);
    setTimeout(() => setSessionCompleted(false), 3000);
  };

  const purgeLocalData = () => {
    if (confirm('Permanently purge all local focus telemetry, domain logs, and DP cohort hashes?')) {
      setDataPurged(true);
      setTimeout(() => setDataPurged(false), 3000);
    }
  };

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const targetSeconds = targetMinutes * 60;
  const progressRatio = (targetSeconds - seconds) / targetSeconds;
  const strokeOffset = 276.46 - progressRatio * 276.46;

  return (
    <div className="flex flex-col w-full font-body-md text-on-surface gap-6">
      {/* Header Section */}
      <section className="w-full bg-surface-container-lowest p-6 md:p-8 border border-outline-variant shadow-sm flex flex-col gap-4">
        <div className="flex flex-col gap-1 max-w-4xl">
          <div className="flex items-center gap-2">
            <span className="font-label-md text-label-md text-secondary font-bold uppercase tracking-wider font-mono">
              // ACADEMIC AGENCY
            </span>
            <span className="font-label-sm text-label-sm border border-outline-variant bg-surface-container px-2 py-0.5 text-on-surface-variant font-mono">
              [VOLUNTARY DISCIPLINE]
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight font-extrabold mt-1">
            Protect the space to focus.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-3xl">
            Voluntary deep work intervals, intentional web usage boundaries, and student-owned attention analytics—free from commercial surveillance, administrative tracking, or behavioral monetization.
          </p>
        </div>

        {/* Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          <div className="bg-surface-container-low border border-outline-variant p-4 flex flex-col justify-between hover:border-secondary transition-all">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-1 font-label-sm text-label-sm text-outline font-mono">
              <span>METRIC_01</span>
              <span className="border border-dashed border-outline px-1 text-[9px] text-outline font-mono">[VOLUNTARY RECORD]</span>
            </div>
            <div className="my-3">
              <div className="font-data-metric text-data-metric font-bold text-primary tracking-tight">
                1,420<span className="text-secondary text-headline-sm ml-1">hrs</span>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Focus Intervals Logged</div>
            </div>
            <div className="font-label-sm text-label-sm text-outline flex items-center gap-1 pt-2 border-t border-outline-variant/40 font-mono">
              <span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span> 100% Student-Triggered
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant p-4 flex flex-col justify-between hover:border-secondary transition-all">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-1 font-label-sm text-label-sm text-outline font-mono">
              <span>METRIC_02</span>
              <span className="bg-secondary-fixed text-on-secondary-fixed px-1 text-[9px] font-bold font-mono">VERIFIED ZERO</span>
            </div>
            <div className="my-3">
              <div className="font-data-metric text-data-metric font-bold text-primary tracking-tight">
                0 <span className="text-primary text-headline-sm font-mono">KB</span>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Cloud Data Retention</div>
            </div>
            <div className="font-label-sm text-label-sm text-outline flex items-center gap-1 pt-2 border-t border-outline-variant/40 font-mono">
              <span className="material-symbols-outlined text-[14px]">lock</span> Zero Central Storage
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant p-4 flex flex-col justify-between hover:border-secondary transition-all">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-1 font-label-sm text-label-sm text-outline font-mono">
              <span>METRIC_03</span>
              <span className="border border-dashed border-outline px-1 text-[9px] text-outline font-mono">[DETERMINISTIC]</span>
            </div>
            <div className="my-3">
              <div className="font-data-metric text-data-metric font-bold text-secondary tracking-tight">100%</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Client-Side Heuristics</div>
            </div>
            <div className="font-label-sm text-label-sm text-outline flex items-center gap-1 pt-2 border-t border-outline-variant/40 font-mono">
              <span className="material-symbols-outlined text-[14px]">terminal</span> In-Browser RegEx Rules
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant p-4 flex flex-col justify-between hover:border-secondary transition-all">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-1 font-label-sm text-label-sm text-outline font-mono">
              <span>METRIC_04</span>
              <span className="text-error font-semibold text-[9px] px-1 border border-error font-mono">ABSOLUTE ZERO</span>
            </div>
            <div className="my-3">
              <div className="font-data-metric text-data-metric font-bold text-primary tracking-tight">0</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Dark Patterns or Shame Cycles</div>
            </div>
            <div className="font-label-sm text-label-sm text-outline flex items-center gap-1 pt-2 border-t border-outline-variant/40 font-mono">
              <span className="material-symbols-outlined text-[14px] text-primary">do_not_disturb_on</span> No Gamified Punishments
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      {sessionCompleted && (
        <div className="p-4 bg-emerald-50 border border-emerald-500 text-emerald-900 font-mono text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>Focus interval successfully recorded to local encrypted SQLite partition.</span>
        </div>
      )}

      {dataPurged && (
        <div className="p-4 bg-amber-50 border border-amber-500 text-amber-900 font-mono text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
          <span>Right to Erasure complete: All local browsing snapshots and focus history wiped cleanly.</span>
        </div>
      )}

      {/* Interactive Spotlight: Circular Timer & Domain Classifier */}
      <section className="w-full bg-surface-container-lowest border border-outline-variant p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Circular Focus Engine */}
          <div className="lg:col-span-6 bg-surface-container-low border border-outline-variant p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
              <div className="font-label-sm text-label-sm font-semibold tracking-wider text-primary uppercase font-mono">
                FOCUS_SESSION // IN_PROGRESS
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-container border border-outline-variant font-label-sm text-label-sm text-primary font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-secondary animate-pulse' : 'bg-outline'}`}></span>
                {isRunning ? 'SESSION_ACTIVE' : 'SESSION_PAUSED'}
              </div>
            </div>

            <div className="my-6 flex flex-col items-center justify-center relative py-4">
              <div className="relative w-64 h-64 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="transparent" r="44" stroke="#e9e8e4" strokeWidth="3" />
                  <circle
                    className="transition-all duration-1000 ease-linear"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="44"
                    stroke="#003fe1"
                    strokeDasharray="276.46"
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="square"
                    strokeWidth="3.5"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline font-mono">
                    REMAINING TIME
                  </span>
                  <span className="font-data-metric text-data-metric font-extrabold text-primary tracking-tighter my-1">
                    {formatTimer(seconds)}
                  </span>
                  <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 font-bold uppercase font-mono">
                    Distributed Concurrency Sprint
                  </span>
                  <span className="font-label-sm text-label-sm text-outline mt-2 tracking-wide flex items-center gap-1 font-mono">
                    <span className="w-1 h-1 rounded-full bg-primary animate-ping"></span>
                    RHYTHM: STEADY CADENCE
                  </span>
                </div>
              </div>

              <div className="w-full max-w-sm mt-4 border border-dashed border-outline-variant p-2 text-center font-label-sm text-label-sm text-on-surface-variant bg-surface-container font-mono">
                <span>TARGET INTERVAL: 60:00 // CLIENT FRICTION GATE ARMED</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/60 font-mono">
              <button
                onClick={togglePause}
                className="flex-1 py-2.5 px-3 bg-surface-container border border-primary text-primary font-label-md text-label-md uppercase tracking-wider hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5 font-bold"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isRunning ? 'pause' : 'play_arrow'}
                </span>
                <span>{isRunning ? 'PAUSE INTERVAL' : 'RESUME INTERVAL'}</span>
              </button>
              <button
                onClick={concludeSession}
                className="flex-1 py-2.5 px-3 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-secondary transition-all flex items-center justify-center gap-1.5 font-bold shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>CONCLUDE SPRINT</span>
              </button>
            </div>
          </div>

          {/* Domain Classifier & Laplace Differential Privacy */}
          <div className="lg:col-span-6 bg-surface-container-low border border-outline-variant p-6 flex flex-col justify-between gap-4 font-mono">
            <div>
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                <span className="font-label-sm text-label-sm font-bold uppercase text-primary">
                  LOCAL CLIENT DOMAIN GATE // ZERO_EXFILTRATION
                </span>
                <span className="font-label-sm text-label-sm text-secondary font-bold">
                  DP LAPLACE (&epsilon; = 0.8)
                </span>
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 font-sans">
                Hostnames are categorized entirely client-side using deterministic regex. URLs, paths, and search parameters are automatically stripped to defend privacy.
              </p>

              {/* Monitored Hostnames Table */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="p-2.5 bg-surface-container-lowest border border-outline-variant flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-primary">github.com</span>
                  </div>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 font-bold">PRODUCTIVE</span>
                </div>

                <div className="p-2.5 bg-surface-container-lowest border border-outline-variant flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-primary">arxiv.org</span>
                  </div>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 font-bold">PRODUCTIVE</span>
                </div>

                <div className="p-2.5 bg-surface-container-lowest border border-outline-variant flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="font-bold text-primary">reddit.com</span>
                  </div>
                  <span className="text-amber-800 bg-amber-100 px-2 py-0.5 font-bold">DISTRACTING</span>
                </div>

                <div className="p-2.5 bg-surface-container-lowest border border-outline-variant flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                    <span className="font-bold text-primary">campus.edu/portal</span>
                  </div>
                  <span className="text-gray-700 bg-gray-100 px-2 py-0.5 font-bold">NEUTRAL</span>
                </div>
              </div>

              {/* Laplace Cohort Card */}
              <div className="mt-4 p-3 bg-surface-container-lowest border border-outline-variant text-xs space-y-1">
                <div className="font-bold text-primary flex items-center justify-between">
                  <span>COHORT DIFFERENTIAL PRIVACY:</span>
                  <span className="text-secondary">&mu;_noisy = 41.2 min</span>
                </div>
                <div className="text-outline text-[11px] leading-relaxed">
                  Formula: Y = X + Lap(&Delta;f / &epsilon;), where &Delta;f = 1.0, &epsilon; = 0.8. Preserves individual confidentiality within student cohort metrics.
                </div>
              </div>
            </div>

            {/* Right to Erasure Purge Button */}
            <div className="pt-3 border-t border-outline-variant/60">
              <button
                onClick={purgeLocalData}
                className="w-full py-2.5 bg-surface-container border border-error text-error hover:bg-red-100 font-label-sm text-label-sm uppercase font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                <span>Execute Complete Right to Erasure (Purge Data)</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WellbeingPage;
