import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Focus timer widget state
  const [focusMinutes, setFocusMinutes] = useState(45);
  const [secondsRemaining, setSecondsRemaining] = useState(45 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, secondsRemaining]);

  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const handleSelectPreset = (mins: number) => {
    setFocusMinutes(mins);
    setSecondsRemaining(mins * 60);
    setTimerRunning(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalSeconds = focusMinutes * 60;
  const progressRatio = (totalSeconds - secondsRemaining) / totalSeconds;
  const strokeOffset = 427 - progressRatio * 427;

  return (
    <div className="flex flex-col w-full font-body-md text-on-surface gap-6">
      {/* Banner / Header Node Bar */}
      <section className="w-full bg-surface-container-lowest p-6 border border-outline-variant shadow-sm relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-secondary-fixed/40 blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 bg-surface-container font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-mono">
                AUTH // NODE 0X4F92
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                PEER_SYNCHRONIZED
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              Good morning, {user?.name || 'Scholar'}. Node 0x4f92 synchronized.
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant flex flex-wrap items-center gap-x-2">
              <span>Collegiate Session: Active</span>
              <span className="text-outline-variant">•</span>
              <span>5 Modules Provisioned</span>
              <span className="text-outline-variant">•</span>
              <span className="text-secondary font-medium">0 External Telemetry Trackers Detected</span>
            </p>
          </div>

          {/* Quick Action Ledger Controls (Strictly Role-Scoped) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {user?.role === 'driver' ? (
              <button
                onClick={() => navigate('/rides')}
                className="px-4 py-2.5 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider shadow-sm hover:translate-y-[-1px] transition-transform flex items-center gap-1.5 font-bold"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">add_road</span>
                <span>+ Publish Driver Route</span>
              </button>
            ) : user?.role === 'proctor' ? (
              <button
                onClick={() => navigate('/exams')}
                className="px-4 py-2.5 bg-amber-600 text-white font-label-md text-label-md uppercase tracking-wider shadow-sm hover:translate-y-[-1px] transition-transform flex items-center gap-1.5 font-bold"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">gavel</span>
                <span>Open Review Tribunal</span>
              </button>
            ) : user?.role === 'admin' ? (
              <button
                onClick={() => navigate('/settings')}
                className="px-4 py-2.5 bg-purple-600 text-white font-label-md text-label-md uppercase tracking-wider shadow-sm hover:translate-y-[-1px] transition-transform flex items-center gap-1.5 font-bold"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                <span>User &amp; Role Registry</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/rides')}
                className="px-4 py-2.5 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider shadow-sm hover:translate-y-[-1px] transition-transform flex items-center gap-1.5 font-bold"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">directions_car</span>
                <span>+ Find Carpool</span>
              </button>
            )}

            {user?.role === 'student' && (
              <button
                onClick={() => navigate('/wellbeing')}
                className="px-4 py-2.5 bg-surface-container-high text-on-surface hover:bg-surface-container-highest font-label-md text-label-md uppercase tracking-wider transition-colors flex items-center gap-1.5 font-bold border border-outline-variant"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">timer</span>
                <span>Start 45m Focus</span>
              </button>
            )}

            {(user?.role === 'student' || user?.role === 'ta_faculty' || user?.role === 'admin') && (
              <button
                onClick={() => navigate('/academic')}
                className="px-4 py-2.5 bg-surface-container-high text-on-surface hover:bg-surface-container-highest font-label-md text-label-md uppercase tracking-wider transition-colors flex items-center gap-1.5 font-bold border border-outline-variant"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">school</span>
                <span>Academic Hub</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Top 4 High-Density Collegiate Ledger Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Active Route */}
        <div
          onClick={() => navigate('/rides')}
          className="bg-surface-container-lowest p-4 border border-outline-variant shadow-sm flex flex-col justify-between cursor-pointer hover:border-secondary transition-all"
        >
          <div>
            <div className="flex items-center justify-between pb-1">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                REF: MOBILITY_COMMUTE
              </span>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container font-semibold text-secondary font-mono">
                08:42 DEPART
              </span>
            </div>
            <div className="mt-1">
              <span className="font-body-sm text-body-sm text-on-surface-variant block">Active Transit Route</span>
              <h3 className="font-headline-sm text-headline-sm text-primary mt-0.5 font-bold">
                North Gate → Engineering Arch
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-1 space-y-1 border-t border-outline-variant/40">
            <div className="flex items-center justify-between font-label-sm text-label-sm font-mono">
              <span className="text-on-surface-variant">Detour: +2.8 min (Safe)</span>
              <span className="text-on-surface font-semibold">2 Seats Left</span>
            </div>
            <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-outline font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>Driver: Vikram Rao (Tata Nexon EV)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Deep Focus Today */}
        <div
          onClick={() => navigate('/wellbeing')}
          className="bg-surface-container-lowest p-4 border border-outline-variant shadow-sm flex flex-col justify-between cursor-pointer hover:border-secondary transition-all"
        >
          <div>
            <div className="flex items-center justify-between pb-1">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                REF: LOCAL_TELEMETRY
              </span>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container text-on-surface-variant uppercase font-medium font-mono">
                5-DAY STREAK
              </span>
            </div>
            <div className="mt-1">
              <span className="font-body-sm text-body-sm text-on-surface-variant block">Deep Focus Accumulated</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-data-metric text-data-metric text-primary font-bold">2h 45m</span>
                <span className="font-label-md text-label-md text-outline font-mono">/ 4h GOAL</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-1 space-y-1.5 border-t border-outline-variant/40">
            <div className="w-full bg-surface-container-high h-1.5 overflow-hidden">
              <div className="bg-primary h-full" style={{ width: '68%' }}></div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm text-outline font-mono">
              <span>Target Progress 68%</span>
              <span>Laplace DP Noise Added</span>
            </div>
          </div>
        </div>

        {/* Card 3: Campus Grid Sync */}
        <div
          onClick={() => navigate('/sustainability')}
          className="bg-surface-container-lowest p-4 border border-outline-variant shadow-sm flex flex-col justify-between cursor-pointer hover:border-secondary transition-all"
        >
          <div>
            <div className="flex items-center justify-between pb-1">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                REF: SLURM_SOLAR_SYNC
              </span>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed uppercase font-semibold font-mono">
                PEAK SOLAR
              </span>
            </div>
            <div className="mt-1">
              <span className="font-body-sm text-body-sm text-on-surface-variant block">Campus Grid Clean Energy</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-data-metric text-data-metric text-secondary font-bold">84.2%</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">RENEWABLE APEX</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-1 space-y-1 font-label-sm text-label-sm font-mono border-t border-outline-variant/40">
            <div className="text-on-surface font-medium truncate">Optimal Slurm: 11:30 - 15:00 UTC</div>
            <div className="text-outline">Queue dispatch pre-warmed on H100 Node #12</div>
          </div>
        </div>

        {/* Card 4: Role-Scoped Action Metric */}
        {user?.role === 'proctor' || user?.role === 'admin' ? (
          <div
            onClick={() => navigate('/exams')}
            className="bg-surface-container-lowest p-4 border border-outline-variant shadow-sm flex flex-col justify-between cursor-pointer hover:border-secondary transition-all"
          >
            <div>
              <div className="flex items-center justify-between pb-1">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                  REF: EXAM_TRIBUNAL
                </span>
                <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-error-container text-on-error-container font-semibold uppercase font-mono">
                  18H REMAINING
                </span>
              </div>
              <div className="mt-1">
                <span className="font-body-sm text-body-sm text-on-surface-variant block">Pending Proctor Reviews</span>
                <h3 className="font-headline-sm text-headline-sm text-primary mt-0.5 font-bold">
                  1 Observation Packet
                </h3>
              </div>
            </div>
            <div className="mt-4 pt-1 space-y-1 font-label-sm text-label-sm font-mono border-t border-outline-variant/40">
              <div className="flex items-center justify-between text-on-surface">
                <span>Packet: CS301_Midterm_Q4</span>
                <span className="text-secondary font-medium">Double-Blinded</span>
              </div>
              <div className="text-outline">Human-in-the-loop review mandatory</div>
            </div>
          </div>
        ) : user?.role === 'driver' ? (
          <div
            onClick={() => navigate('/rides')}
            className="bg-surface-container-lowest p-4 border border-outline-variant shadow-sm flex flex-col justify-between cursor-pointer hover:border-secondary transition-all"
          >
            <div>
              <div className="flex items-center justify-between pb-1">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                  REF: DRIVER_FLEET
                </span>
                <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-semibold uppercase font-mono">
                  ACTIVE COMMUTER
                </span>
              </div>
              <div className="mt-1">
                <span className="font-body-sm text-body-sm text-on-surface-variant block">Vehicle Capacity Status</span>
                <h3 className="font-headline-sm text-headline-sm text-primary mt-0.5 font-bold">
                  EV Sedan • 4 Seats
                </h3>
              </div>
            </div>
            <div className="mt-4 pt-1 space-y-1 font-label-sm text-label-sm font-mono border-t border-outline-variant/40">
              <div className="flex items-center justify-between text-on-surface">
                <span>Detour Ceiling: ≤ 35%</span>
                <span className="text-secondary font-medium">Verified Partner</span>
              </div>
              <div className="text-outline">Shared carpool legs discounted 40%</div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => navigate('/academic')}
            className="bg-surface-container-lowest p-4 border border-outline-variant shadow-sm flex flex-col justify-between cursor-pointer hover:border-secondary transition-all"
          >
            <div>
              <div className="flex items-center justify-between pb-1">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                  REF: PLACEMENT_RADAR
                </span>
                <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-semibold uppercase font-mono">
                  TIER 1 READY
                </span>
              </div>
              <div className="mt-1">
                <span className="font-body-sm text-body-sm text-on-surface-variant block">Placement Readiness Index</span>
                <h3 className="font-headline-sm text-headline-sm text-primary mt-0.5 font-bold">
                  85% Prepared
                </h3>
              </div>
            </div>
            <div className="mt-4 pt-1 space-y-1 font-label-sm text-label-sm font-mono border-t border-outline-variant/40">
              <div className="flex items-center justify-between text-on-surface">
                <span>Core CS &amp; System Design</span>
                <span className="text-secondary font-medium">3 Mentors Matched</span>
              </div>
              <div className="text-outline">Google &amp; Microsoft mock rounds active</div>
            </div>
          </div>
        )}
      </section>

      {/* Main Grid: 8 Cols Left (Timeline & Matches) + 4 Cols Right (Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section A: Timeline Interactive Ledger */}
          <section className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-outline-variant/50">
              <div>
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block font-mono">
                  DISPATCH CHRONOLOGY
                </span>
                <h2 className="font-headline-sm text-headline-sm text-primary mt-0.5 font-bold">
                  Today's Academic &amp; Transit Timeline
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm px-2 py-1 bg-surface-container text-on-surface-variant font-medium font-mono">
                  OCTOBER 29, 2026
                </span>
                <span className="font-label-sm text-label-sm px-2 py-1 bg-secondary-fixed text-on-secondary-fixed font-semibold font-mono">
                  ALL LOCAL
                </span>
              </div>
            </div>

            {/* Vertical Architectural Timeline Container */}
            <div className="space-y-4 mt-4 relative">
              {/* Entry 1: Ride Pooling */}
              <div className="relative flex flex-col sm:flex-row sm:items-start gap-4 p-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant transition-colors group">
                <div className="sm:w-28 shrink-0 flex sm:flex-col items-center sm:items-start justify-between font-mono">
                  <span className="font-label-md text-label-md text-primary font-bold">08:42 — 09:05</span>
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container-highest text-on-surface-variant uppercase mt-1">
                    23 MINS
                  </span>
                </div>
                <div className="w-7 h-7 bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0 shadow-sm border border-secondary">
                  <span className="material-symbols-outlined text-[16px]">directions_car</span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <h4 className="font-headline-sm text-headline-sm text-primary font-bold group-hover:text-secondary transition-colors">
                      Carpool to North Campus Gate
                    </h4>
                    <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold font-mono">
                      Dijkstra Matched
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Joined carpool with driver Vikram Rao via route node #41. Real-time detour impact calculated at +2.8 min (well under 35% ceiling).
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 font-label-sm text-label-sm text-outline font-mono">
                    <span className="px-2 py-0.5 bg-surface-container-lowest border border-outline-variant">
                      Pickup: North Dorms
                    </span>
                    <span className="px-2 py-0.5 bg-surface-container-lowest border border-outline-variant">
                      Drop: Turing Engineering Arch
                    </span>
                    <span className="px-2 py-0.5 bg-surface-container-lowest border border-outline-variant text-secondary font-medium">
                      CO2 Avoided: 0.34 kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Entry 2: CS Lecture */}
              <div className="relative flex flex-col sm:flex-row sm:items-start gap-4 p-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant transition-colors group">
                <div className="sm:w-28 shrink-0 flex sm:flex-col items-center sm:items-start justify-between font-mono">
                  <span className="font-label-md text-label-md text-primary font-bold">10:00 — 11:30</span>
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container-highest text-on-surface-variant uppercase mt-1">
                    90 MINS
                  </span>
                </div>
                <div className="w-7 h-7 bg-surface-container-highest text-on-surface flex items-center justify-center shrink-0 shadow-sm border border-outline">
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <h4 className="font-headline-sm text-headline-sm text-primary font-bold group-hover:text-secondary transition-colors">
                      CS417: Distributed Systems Lecture
                    </h4>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium font-mono">
                      Hall B • Room 204
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Topics: Byzantine Fault Tolerance, Raft consensus proofs, and gossip protocols. Syllabus verified via local peer cache without cloud telemetry.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 font-label-sm text-label-sm text-outline font-mono">
                    <span className="px-2 py-0.5 bg-surface-container-lowest border border-outline-variant">
                      Peer Mentor: Diya Patel In Room
                    </span>
                    <span className="px-2 py-0.5 bg-surface-container-lowest border border-outline-variant">
                      Audio Note Ledger Sync: Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Entry 3: Green Compute Window */}
              <div className="relative flex flex-col sm:flex-row sm:items-start gap-4 p-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant transition-colors group">
                <div className="sm:w-28 shrink-0 flex sm:flex-col items-center sm:items-start justify-between font-mono">
                  <span className="font-label-md text-label-md text-secondary font-bold">12:00 — 14:00</span>
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed uppercase mt-1">
                    120 MINS
                  </span>
                </div>
                <div className="w-7 h-7 bg-secondary text-on-secondary flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">energy_savings_leaf</span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <h4 className="font-headline-sm text-headline-sm text-primary font-bold group-hover:text-secondary transition-colors">
                      Green Compute Window: Slurm Batch #9024
                    </h4>
                    <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-semibold font-mono">
                      SOLAR SURPLUS ACTIVE
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    GPU model distillation allocated to clean energy window (solar grid output &gt; 80%). Expected carbon avoidance: 3.84 kg CO2e vs evening run.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 font-label-sm text-label-sm text-outline font-mono">
                    <span className="px-2 py-0.5 bg-surface-container-lowest border border-outline-variant">
                      Slurm Partition: gpu-a100
                    </span>
                    <span className="px-2 py-0.5 bg-surface-container-lowest border border-outline-variant text-secondary font-medium">
                      Job Status: Queued (Hold for Solar Spike)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section B: Interdisciplinary Skills & Study Matches */}
          <section className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-outline-variant/50">
              <div>
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block font-mono">
                  PEER CONSTELLATION GRAPH
                </span>
                <h2 className="font-headline-sm text-headline-sm text-primary mt-0.5 font-bold">
                  Interdisciplinary Skills &amp; Course Matching
                </h2>
              </div>
              <button
                onClick={() => navigate('/academic')}
                className="font-label-sm text-label-sm text-secondary hover:underline uppercase font-bold flex items-center gap-1 font-mono"
                type="button"
              >
                <span>Explore Skill Tree</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-surface-container-low border border-outline-variant flex flex-col justify-between hover:bg-surface-container transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-bold font-mono">
                      94% MATCH
                    </span>
                    <span className="material-symbols-outlined text-outline text-[18px]">group</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mt-1 font-bold">
                    Distributed Systems
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    3 active study pods collaborating on Raft cluster implementation &amp; quorum verification.
                  </p>
                </div>
                <div className="mt-4 pt-2 flex items-center justify-between border-t border-outline-variant/40">
                  <span className="font-label-sm text-label-sm text-outline font-mono">3 Pods Active</span>
                  <button
                    onClick={() => navigate('/academic')}
                    className="px-2.5 py-1 bg-primary text-on-primary font-label-sm text-label-sm uppercase hover:bg-secondary transition-colors font-mono font-bold"
                  >
                    Connect
                  </button>
                </div>
              </div>

              <div className="p-4 bg-surface-container-low border border-outline-variant flex flex-col justify-between hover:bg-surface-container transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container text-on-surface font-bold font-mono">
                      88% MATCH
                    </span>
                    <span className="material-symbols-outlined text-outline text-[18px]">school</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mt-1 font-bold">
                    Applied Cryptography
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Graduate thesis mentor available for zero-knowledge proving systems review and ZK-SNARKs.
                  </p>
                </div>
                <div className="mt-4 pt-2 flex items-center justify-between border-t border-outline-variant/40">
                  <span className="font-label-sm text-label-sm text-outline font-mono">1 Thesis Mentor</span>
                  <button
                    onClick={() => navigate('/academic')}
                    className="px-2.5 py-1 bg-primary text-on-primary font-label-sm text-label-sm uppercase hover:bg-secondary transition-colors font-mono font-bold"
                  >
                    Request
                  </button>
                </div>
              </div>

              <div className="p-4 bg-surface-container-low border border-outline-variant flex flex-col justify-between hover:bg-surface-container transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container text-on-surface font-bold font-mono">
                      82% MATCH
                    </span>
                    <span className="material-symbols-outlined text-outline text-[18px]">memory</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mt-1 font-bold">
                    GPU Optimization
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Campus research team opening 2 cooperative compute slots on NVIDIA cluster nodes.
                  </p>
                </div>
                <div className="mt-4 pt-2 flex items-center justify-between border-t border-outline-variant/40">
                  <span className="font-label-sm text-label-sm text-outline font-mono">Slurm Queue Open</span>
                  <button
                    onClick={() => navigate('/sustainability')}
                    className="px-2.5 py-1 bg-primary text-on-primary font-label-sm text-label-sm uppercase hover:bg-secondary transition-colors font-mono font-bold"
                  >
                    Queue In
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (4 Columns) - Sovereign Tools & Gauges */}
        <div className="lg:col-span-4 space-y-6">
          {/* Widget 1: Sovereign Focus Timer */}
          <div className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-1">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                  SOVEREIGN WORKSPACE
                </span>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container text-on-surface-variant font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  SHAME-FREE
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-primary mt-1 font-bold">
                Focus Sprint Dial
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Strict local timer. Zero productivity surveillance or punitive tracking metrics.
              </p>

              {/* Focus Dial SVG */}
              <div className="flex flex-col items-center justify-center my-6">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    <circle
                      className="text-surface-container"
                      cx="80"
                      cy="80"
                      fill="none"
                      r="68"
                      stroke="currentColor"
                      strokeWidth="8"
                    />
                    <circle
                      className="text-secondary transition-all duration-500"
                      cx="80"
                      cy="80"
                      fill="none"
                      r="68"
                      stroke="currentColor"
                      strokeDasharray="427"
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      strokeWidth="8"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-data-metric text-data-metric text-primary font-bold">
                      {formatTime(secondsRemaining)}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5 font-mono">
                      {timerRunning ? 'SPRINT ACTIVE' : 'READY TO START'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSelectPreset(25)}
                  className={`px-2 py-2 border border-outline-variant text-center transition-colors font-label-sm text-label-sm font-mono ${
                    focusMinutes === 25 ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                  type="button"
                >
                  <span className="font-bold block">25M</span>
                  <span className="text-outline text-[9px] block">POMODORO</span>
                </button>
                <button
                  onClick={() => handleSelectPreset(45)}
                  className={`px-2 py-2 border border-outline-variant text-center transition-colors font-label-sm text-label-sm font-mono ${
                    focusMinutes === 45 ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                  type="button"
                >
                  <span className="font-bold block">45M</span>
                  <span className="text-[9px] block">DEEP WORK</span>
                </button>
                <button
                  onClick={() => handleSelectPreset(90)}
                  className={`px-2 py-2 border border-outline-variant text-center transition-colors font-label-sm text-label-sm font-mono ${
                    focusMinutes === 90 ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                  type="button"
                >
                  <span className="font-bold block">90M</span>
                  <span className="text-outline text-[9px] block">FLOW STATE</span>
                </button>
              </div>
            </div>

            <div className="mt-4 pt-2">
              <button
                onClick={toggleTimer}
                className="w-full py-2.5 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider font-bold hover:bg-secondary transition-colors font-mono"
                type="button"
              >
                {timerRunning ? 'Pause Sprint Interval' : 'Start Sprint Session'}
              </button>
            </div>
          </div>

          {/* Widget 2: Campus Solar & Carbon Dial */}
          <div className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm">
            <div className="flex items-center justify-between pb-1">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                CAMPUS MICROGRID APEX
              </span>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-semibold font-mono">
                GRID TELEMETRY
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-primary mt-1 font-bold">
              Solar &amp; Carbon Dial
            </h3>
            <div className="mt-4 p-4 bg-surface-container-low border border-outline-variant space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-outline block font-mono">
                    CURRENT CLEAN SURPLUS
                  </span>
                  <span className="font-data-metric text-data-metric text-secondary font-bold">
                    84.2%
                  </span>
                </div>
                {/* Clean energy sparkline SVG */}
                <div className="w-28 h-12">
                  <svg className="w-full h-full" viewBox="0 0 120 40">
                    <path
                      className="text-secondary"
                      d="M0,32 Q20,28 40,20 T80,10 T120,6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                    <path
                      className="text-secondary-fixed"
                      d="M0,32 Q20,28 40,20 T80,10 T120,6 L120,40 L0,40 Z"
                      fill="currentColor"
                      opacity="0.4"
                    />
                  </svg>
                </div>
              </div>
              <div className="space-y-1 font-body-sm text-body-sm text-on-surface-variant">
                <div className="flex items-center gap-1.5 text-primary font-medium">
                  <span className="material-symbols-outlined text-secondary text-[16px]">check_circle</span>
                  <span>Optimal Model Training Window</span>
                </div>
                <p>
                  Campus solar array currently operating at +410kW surplus. Slurm scheduler carbon throttle released for non-urgent compilation batches.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-2 flex items-center justify-between font-label-sm text-label-sm text-outline font-mono border-t border-outline-variant/40">
              <span>Carbon Intensity: 42g CO2/kWh</span>
              <span className="text-secondary font-semibold">Surplus Peak: 14:15 UTC</span>
            </div>
          </div>

          {/* Widget 3: Cryptographic Enclave Status */}
          <div className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm">
            <div className="flex items-center justify-between pb-1">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                HARDWARE ENCLAVE
              </span>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container text-on-surface font-semibold font-mono">
                ED25519 VERIFIED
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-primary mt-1 font-bold">
              Local Sovereign Ledger
            </h3>
            <div className="mt-4 space-y-2 font-label-sm text-label-sm font-mono">
              <div className="p-2 bg-surface-container border border-outline-variant flex items-center justify-between">
                <span className="text-on-surface-variant">KEY FINGERPRINT</span>
                <span className="text-on-surface font-semibold">ed25519:7a81...c39f</span>
              </div>
              <div className="p-2 bg-surface-container border border-outline-variant flex items-center justify-between">
                <span className="text-on-surface-variant">SQLITE / WAL FOOTPRINT</span>
                <span className="text-on-surface font-semibold">26 Relational Tables</span>
              </div>
              <div className="p-2 bg-surface-container border border-outline-variant flex items-center justify-between">
                <span className="text-on-surface-variant">OUTBOUND TRACKERS</span>
                <span className="text-secondary font-bold">0 DETECTED (BLOCKED)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
