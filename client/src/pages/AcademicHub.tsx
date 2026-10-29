import React, { useState } from 'react';
import { PlacementDatasetExplorer } from '../components/PlacementDatasetExplorer';

export const AcademicHub: React.FC<{ currentRole?: string }> = () => {
  const [activeTab, setActiveTab] = useState<'skills' | 'tasks' | 'mentors' | 'resources' | 'placements'>('skills');
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Dynamic placement tasks state
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Publish Sanitized Portfolio Repository', desc: 'Strip private credential tokens and configure open reproducibility Dockerfile', done: true },
    { id: 2, title: 'Departmental Systems Architecture Review', desc: 'Peer critique board completed with 2 senior lab colleagues', done: true },
    { id: 3, title: 'Self-Host Cryptographic Skill Attestation', desc: 'Signed using local PGP keypair, published to campus node peer cache', done: true },
    { id: 4, title: 'Simulated Technical Distributed Concurrency Board', desc: 'Completed 45m peer mock interview on memory models and latch locks', done: true },
    { id: 5, title: 'Target Engineering Syllabus Alignment Audit', desc: 'Map past distributed systems homework benchmarks to industry open RFCs', done: false },
    { id: 6, title: 'Book Cross-Cohort Research Mentorship Session', desc: 'Schedule 30-minute peer slot with graduate systems architecture candidate', done: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const completedCount = tasks.filter(t => t.done).length;
  const progressPct = Math.round((completedCount / tasks.length) * 100);

  const handleOpenMentorRequest = (mentorName: string) => {
    setSelectedMentor(mentorName);
    setRequestSuccess(false);
    setRequestNote('');
    setMentorModalOpen(true);
  };

  const handleSendMentorRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSuccess(true);
    setTimeout(() => {
      setMentorModalOpen(false);
      setRequestSuccess(false);
    }, 1800);
  };

  return (
    <div className="flex flex-col w-full font-body-md text-on-surface gap-6">
      {/* Top Technical Identification Strip */}
      <section className="w-full bg-surface-container-low px-4 py-2 border border-outline-variant">
        <div className="w-full flex flex-wrap items-center justify-between gap-2 font-label-sm text-label-sm font-mono">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-on-primary px-2 py-0.5 tracking-widest uppercase font-bold">
              MODULE_01
            </span>
            <span className="text-on-surface font-semibold tracking-wide uppercase">
              ACADEMIC HUB &amp; PEER KNOWLEDGE LEDGER
            </span>
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <span className="flex items-center gap-1.5 text-primary font-medium">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              STATE: VERIFIED_PEER_MESH
            </span>
            <span className="hidden md:inline bg-surface-container-high px-2 py-0.5 text-on-surface-variant font-mono">
              POLICY: ZERO REPUTATION ARBITRAGE
            </span>
            <span className="hidden lg:inline text-outline font-mono">HASH: 0x9f32..c18</span>
          </div>
        </div>
      </section>

      {/* Editorial Hero Section */}
      <section className="w-full bg-surface-container-lowest p-6 md:p-8 border border-outline-variant shadow-sm">
        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col gap-1 max-w-4xl">
            <div className="flex items-center gap-1.5 text-secondary font-label-md text-label-md uppercase tracking-wider font-mono font-bold">
              <span className="material-symbols-outlined text-[16px]">school</span>
              <span>Sovereign Scholar Infrastructure</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight font-extrabold">
              Your next step, made clearer.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl pt-1 leading-relaxed">
              Interdisciplinary skill inventories, dynamic peer mentorship, and curated curriculum resources—organized around real student momentum without administrative tracking or commercial gatekeeping.
            </p>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-surface-container-low p-4 border border-outline-variant flex flex-col justify-between">
              <span className="font-label-sm text-label-sm uppercase text-outline font-mono">Active Ledger Nodes</span>
              <span className="font-data-metric text-data-metric text-primary mt-1 font-bold">1,842</span>
              <span className="font-label-sm text-label-sm text-secondary mt-1 font-mono font-semibold">[SANDBOX REPLICAS]</span>
            </div>
            <div className="bg-surface-container-low p-4 border border-outline-variant flex flex-col justify-between">
              <span className="font-label-sm text-label-sm uppercase text-outline font-mono">Peer Mentors Online</span>
              <span className="font-data-metric text-data-metric text-primary mt-1 font-bold">318</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 font-mono">14 Departments</span>
            </div>
            <div className="bg-surface-container-low p-4 border border-outline-variant flex flex-col justify-between">
              <span className="font-label-sm text-label-sm uppercase text-outline font-mono">Open Syllabi Cataloged</span>
              <span className="font-data-metric text-data-metric text-primary mt-1 font-bold">4,920</span>
              <span className="font-label-sm text-label-sm text-secondary mt-1 font-mono font-semibold">Zero Commercial APIs</span>
            </div>
            <div className="bg-surface-container-low p-4 border border-outline-variant flex flex-col justify-between">
              <span className="font-label-sm text-label-sm uppercase text-outline font-mono">Privacy Integrity</span>
              <span className="font-data-metric text-data-metric text-secondary mt-1 font-bold">100%</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 font-mono">Client-Side Verification</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive High-Fidelity Preview UI Container */}
      <section className="w-full flex flex-col bg-surface-container-lowest border border-outline-variant shadow-sm">
        {/* Container Top Index Utility Bar */}
        <div className="bg-surface-container-high px-4 py-2 border-b border-outline-variant flex flex-wrap items-center justify-between gap-2 font-label-sm text-label-sm text-on-surface-variant font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>
            <span className="font-semibold text-primary">PREVIEW_VIEWPORT // HUB_LIVE_STATE</span>
            <span className="text-outline">·</span>
            <span>COORDINATE: CAMPUS_NODE_NORTH.L3</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-surface-container px-2 py-0.5 text-outline">[INTERACTIVE PROVENANCE: ACTUAL]</span>
            <span className="text-secondary font-semibold">LATENCY: 14ms (LOCAL_MESH)</span>
          </div>
        </div>

        {/* Viewport Tabs Navigation */}
        <div className="flex flex-wrap border-b border-outline-variant bg-surface-container-low">
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-3 font-label-md text-label-md font-bold uppercase tracking-wider transition-all border-r border-outline-variant flex items-center gap-2 ${
              activeTab === 'skills'
                ? 'bg-surface-container-lowest text-primary border-b-2 border-b-secondary'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">account_tree</span>
            01 // Skill Inventory &amp; Radar
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-3 font-label-md text-label-md font-bold uppercase tracking-wider transition-all border-r border-outline-variant flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'bg-surface-container-lowest text-primary border-b-2 border-b-secondary'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">checklist</span>
            02 // Placement Tasks ({completedCount}/{tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('mentors')}
            className={`px-4 py-3 font-label-md text-label-md font-bold uppercase tracking-wider transition-all border-r border-outline-variant flex items-center gap-2 ${
              activeTab === 'mentors'
                ? 'bg-surface-container-lowest text-primary border-b-2 border-b-secondary'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">groups</span>
            03 // Mentorship Commons
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-3 font-label-md text-label-md font-bold uppercase tracking-wider transition-all border-r border-outline-variant flex items-center gap-2 ${
              activeTab === 'resources'
                ? 'bg-surface-container-lowest text-primary border-b-2 border-b-secondary'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            04 // Sovereign Course Catalog
          </button>
          <button
            onClick={() => setActiveTab('placements')}
            className={`px-4 py-3 font-label-md text-label-md font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'placements'
                ? 'bg-surface-container-lowest text-primary border-b-2 border-b-secondary'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">school</span>
            05 // Placement Dataset (1,997 Scholars)
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {/* TAB 1: Skill Inventory */}
          {activeTab === 'skills' && (
            <div className="flex flex-col gap-6">
              {/* Placement Goals Card */}
              <div className="bg-surface-container-low p-4 border border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="font-label-sm text-label-sm uppercase text-secondary font-mono">
                    TARGET ROLE PROFILE
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold mt-0.5">
                    Distributed Systems &amp; Backend Engineer
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Curriculum benchmarks mapped against high-scale distributed data stores and fault-tolerant infrastructure.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-3 py-1 font-bold font-mono">
                    BENCHMARK: TIER-1 SDE
                  </span>
                </div>
              </div>

              {/* Skills Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-surface-container p-4 border border-outline-variant flex flex-col justify-between hover:border-secondary transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-outline font-label-sm text-label-sm mb-1 font-mono">
                      <span>TAG_ID: DIST_SYS</span>
                      <span className="text-secondary font-semibold font-bold">94% FIT</span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-primary font-bold">
                      Distributed Systems Architecture
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Raft consensus protocols, leader election proofs, log replication, gossip networks, and Paxos state machines.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-outline-variant flex items-center justify-between font-label-sm text-label-sm font-mono">
                    <span className="text-on-surface-variant">Courses: CS417, CS632</span>
                    <span className="text-primary font-semibold">Verified</span>
                  </div>
                </div>

                <div className="bg-surface-container p-4 border border-outline-variant flex flex-col justify-between hover:border-secondary transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-outline font-label-sm text-label-sm mb-1 font-mono">
                      <span>TAG_ID: APPLIED_CRYPTO</span>
                      <span className="text-secondary font-semibold font-bold">88% FIT</span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-primary font-bold">
                      Applied Cryptography
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Elliptic curve digital signatures (Ed25519), zero-knowledge proving mechanisms, verifiable credentials, and PRNG seeds.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-outline-variant flex items-center justify-between font-label-sm text-label-sm font-mono">
                    <span className="text-on-surface-variant">Courses: MATH502, CS555</span>
                    <span className="text-primary font-semibold">Peer-Reviewed</span>
                  </div>
                </div>

                <div className="bg-surface-container p-4 border border-outline-variant flex flex-col justify-between hover:border-secondary transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-outline font-label-sm text-label-sm mb-1 font-mono">
                      <span>TAG_ID: GPU_OPT</span>
                      <span className="text-secondary font-semibold font-bold">82% FIT</span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-primary font-bold">
                      GPU Optimization
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      CUDA memory coalescing, warp divergence reduction, shared memory caching, kernel fusion patterns.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-outline-variant flex items-center justify-between font-label-sm text-label-sm font-mono">
                    <span className="text-on-surface-variant">Courses: ECE484</span>
                    <span className="text-primary font-semibold">Lab Verified</span>
                  </div>
                </div>

                <div className="bg-surface-container p-4 border border-outline-variant flex flex-col justify-between hover:border-secondary transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-outline font-label-sm text-label-sm mb-1 font-mono">
                      <span>TAG_ID: LTI_PROTOCOLS</span>
                      <span className="text-secondary font-semibold font-bold">91% FIT</span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-primary font-bold">
                      LTI Protocols &amp; Auth
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      IMS Global 1.3 Advantage standard integration, deep linking payload validation, role delegation tokens.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-outline-variant flex items-center justify-between font-label-sm text-label-sm font-mono">
                    <span className="text-on-surface-variant">Courses: CS390 Lab</span>
                    <span className="text-primary font-semibold">Project Proven</span>
                  </div>
                </div>

                <div className="bg-surface-container p-4 border border-outline-variant flex flex-col justify-between hover:border-secondary transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-outline font-label-sm text-label-sm mb-1 font-mono">
                      <span>TAG_ID: ZK_PROOFS</span>
                      <span className="text-secondary font-semibold font-bold">79% FIT</span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-primary font-bold">
                      Zero-Knowledge Proofs
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Circom circuits, Groth16 zk-SNARK setup rituals, verifiable computation, private credential issuance.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-outline-variant flex items-center justify-between font-label-sm text-label-sm font-mono">
                    <span className="text-on-surface-variant">Courses: MATH710 Seminar</span>
                    <span className="text-primary font-semibold">Research Track</span>
                  </div>
                </div>

                <div className="bg-surface-container-low p-4 border border-dashed border-outline-variant flex flex-col justify-center items-center text-center gap-2 hover:bg-surface-container transition-colors cursor-pointer group">
                  <span className="material-symbols-outlined text-[32px] text-outline group-hover:text-primary transition-colors">
                    add_circle
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">
                    Map New Competency
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">
                    Ingest code repository or course syllabus markdown directly into client-side embedding index.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Placement Tasks */}
          {activeTab === 'tasks' && (
            <div className="flex flex-col gap-6">
              {/* Progress Indicator */}
              <div className="bg-surface-container-low p-6 border border-outline-variant flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="font-label-sm text-label-sm uppercase text-secondary font-mono font-bold">
                      STATUS // CHECKLIST_METRIC
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                      Profile Readiness Indicator
                    </h3>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {completedCount} of {tasks.length} milestones finalized in local sandbox
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 font-mono">
                    <span className="font-data-metric text-data-metric text-primary font-bold">{progressPct}%</span>
                    <span className="font-label-sm text-label-sm uppercase text-outline">PROGRESS</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-surface-container h-3 border border-outline-variant overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                  ></div>
                </div>

                {/* Regulatory Disclaimer */}
                <div className="bg-surface-container-lowest p-3 border border-outline-variant flex items-start gap-2 text-on-surface-variant font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px] text-outline shrink-0 mt-0.5">info</span>
                  <span>
                    <strong>Explicit Notice:</strong> Indicator derived strictly from user-completed checklist tasks; does not predict, forecast, or guarantee employment outcomes, interview offers, or salary bands.
                  </span>
                </div>
              </div>

              {/* Tasks List */}
              <div className="flex flex-col gap-2">
                {tasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    className="p-4 border border-outline-variant flex items-center justify-between gap-4 cursor-pointer hover:border-secondary transition-all bg-surface-container-low"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 flex items-center justify-center font-label-sm border ${
                          t.done
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface-container-highest border-outline text-outline'
                        }`}
                      >
                        {t.done ? (
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        ) : (
                          <span className="w-2 h-2 bg-outline"></span>
                        )}
                      </div>
                      <div>
                        <div
                          className={`font-headline-sm text-[16px] leading-tight font-semibold ${
                            t.done ? 'text-primary' : 'text-on-surface'
                          }`}
                        >
                          {t.title}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          {t.desc}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`font-label-sm text-label-sm px-3 py-1 uppercase font-mono font-bold shrink-0 ${
                        t.done
                          ? 'bg-surface-container-high text-primary'
                          : 'bg-surface-container text-outline'
                      }`}
                    >
                      {t.done ? 'COMPLETED' : 'PENDING ACTION'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Mentors */}
          {activeTab === 'mentors' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-low p-4 border border-outline-variant">
                <div>
                  <div className="font-label-sm text-label-sm uppercase text-secondary font-mono font-bold">
                    DISCOVERY // PEER_DIRECTORY
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold mt-1">
                    Autonomous Peer Mentorship Mesh
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Direct encrypted exchange. No hourly fees, no middleman rating penalties.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm bg-surface-container-lowest px-3 py-1.5 text-primary font-mono border border-outline-variant font-bold">
                    ACTIVE COHORTS: 8 VERIFIED
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Mentor 1 */}
                <div className="bg-surface-container p-4 border border-outline-variant flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-12 h-12 bg-primary text-on-primary flex items-center justify-center font-mono font-bold text-lg">
                        ER
                      </div>
                      <span className="font-label-sm text-label-sm bg-surface-container-highest text-primary px-2 py-0.5 font-mono">
                        ID: MENTOR_042
                      </span>
                    </div>
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-primary font-bold">
                        Elena Rostova
                      </h4>
                      <p className="font-label-sm text-label-sm text-secondary font-semibold font-mono mt-0.5">
                        CS &amp; Ethics Ph.D. Candidate
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Specializing in algorithmic fairness, formal verification of distributed contracts, and privacy-preserving data collection.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1 font-mono text-[11px]">
                      <span className="bg-surface-container-lowest text-primary px-1.5 py-0.5 border border-outline-variant">
                        Zk-SNARKs
                      </span>
                      <span className="bg-surface-container-lowest text-primary px-1.5 py-0.5 border border-outline-variant">
                        Formal Methods
                      </span>
                      <span className="bg-surface-container-lowest text-primary px-1.5 py-0.5 border border-outline-variant">
                        LTI Auth
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 bg-surface-container-low p-2 border-t border-outline-variant flex items-center justify-between font-mono">
                    <span className="font-label-sm text-label-sm text-outline">SLOTS: 2 THIS WEEK</span>
                    <button
                      onClick={() => handleOpenMentorRequest('Elena Rostova')}
                      className="bg-primary text-on-primary font-label-sm text-label-sm uppercase px-3 py-1 hover:bg-secondary transition-colors font-bold"
                    >
                      P2P Direct
                    </button>
                  </div>
                </div>

                {/* Mentor 2 */}
                <div className="bg-surface-container p-4 border border-outline-variant flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-12 h-12 bg-secondary text-on-secondary flex items-center justify-center font-mono font-bold text-lg">
                        MV
                      </div>
                      <span className="font-label-sm text-label-sm bg-surface-container-highest text-primary px-2 py-0.5 font-mono">
                        ID: MENTOR_109
                      </span>
                    </div>
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-primary font-bold">
                        Marcus Vance
                      </h4>
                      <p className="font-label-sm text-label-sm text-secondary font-semibold font-mono mt-0.5">
                        Systems Architecture M.Sc.
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Core contributor to open high-throughput async network runtimes. Advises on kernel interfaces and distributed storage.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1 font-mono text-[11px]">
                      <span className="bg-surface-container-lowest text-primary px-1.5 py-0.5 border border-outline-variant">
                        Rust Async
                      </span>
                      <span className="bg-surface-container-lowest text-primary px-1.5 py-0.5 border border-outline-variant">
                        Distributed Sys
                      </span>
                      <span className="bg-surface-container-lowest text-primary px-1.5 py-0.5 border border-outline-variant">
                        io_uring
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 bg-surface-container-low p-2 border-t border-outline-variant flex items-center justify-between font-mono">
                    <span className="font-label-sm text-label-sm text-outline">SLOTS: 4 THIS WEEK</span>
                    <button
                      onClick={() => handleOpenMentorRequest('Marcus Vance')}
                      className="bg-primary text-on-primary font-label-sm text-label-sm uppercase px-3 py-1 hover:bg-secondary transition-colors font-bold"
                    >
                      P2P Direct
                    </button>
                  </div>
                </div>

                {/* Mentor 3 */}
                <div className="bg-surface-container p-4 border border-outline-variant flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-12 h-12 bg-surface-container-high text-primary flex items-center justify-center font-mono font-bold text-lg border border-outline">
                        AC
                      </div>
                      <span className="font-label-sm text-label-sm bg-surface-container-highest text-primary px-2 py-0.5 font-mono">
                        ID: MENTOR_228
                      </span>
                    </div>
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-primary font-bold">
                        Aria Chen
                      </h4>
                      <p className="font-label-sm text-label-sm text-secondary font-semibold font-mono mt-0.5">
                        Applied Mathematics &amp; HPC Fellow
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Focus on sparse matrix decomposition, GPU parallel compilation, and mathematical optimization pipelines.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1 font-mono text-[11px]">
                      <span className="bg-surface-container-lowest text-primary px-1.5 py-0.5 border border-outline-variant">
                        GPU Optimization
                      </span>
                      <span className="bg-surface-container-lowest text-primary px-1.5 py-0.5 border border-outline-variant">
                        CUDA
                      </span>
                      <span className="bg-surface-container-lowest text-primary px-1.5 py-0.5 border border-outline-variant">
                        MPI
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 bg-surface-container-low p-2 border-t border-outline-variant flex items-center justify-between font-mono">
                    <span className="font-label-sm text-label-sm text-outline">SLOTS: 1 THIS WEEK</span>
                    <button
                      onClick={() => handleOpenMentorRequest('Aria Chen')}
                      className="bg-primary text-on-primary font-label-sm text-label-sm uppercase px-3 py-1 hover:bg-secondary transition-colors font-bold"
                    >
                      P2P Direct
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Resources */}
          {activeTab === 'resources' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-low p-4 border border-outline-variant">
                <div>
                  <div className="font-label-sm text-label-sm uppercase text-secondary font-mono font-bold">
                    CURATED_COMMONS // OPEN_ACCESS
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold mt-1">
                    Academic Syllabus &amp; Lab Archive
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Peer-verified past examinations, lab benchmark frameworks, and reproducible course runbooks.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-label-sm text-label-sm bg-surface-container-lowest px-3 py-1.5 text-on-surface-variant border border-outline-variant font-bold">
                    FILTER: ALL_SUBJECTS
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="bg-surface-container p-4 border border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-secondary transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-surface-container-lowest text-primary border border-outline-variant">
                      <span className="material-symbols-outlined text-[20px]">terminal</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-label-sm text-label-sm text-outline font-mono">
                        <span>ARCHIVE_REF: LAB_417_RUNBOOK</span>
                        <span className="text-secondary font-bold">VERIFIED 2026</span>
                      </div>
                      <h4 className="font-headline-sm text-[16px] text-primary font-bold mt-0.5">
                        Distributed Raft Cluster Simulator &amp; Chaos Injector
                      </h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-2xl">
                        Complete harness for reproducing Byzantine fault tolerance benchmarks across 5 virtual nodes.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-mono">
                    <span className="bg-surface-container-low text-primary px-2 py-0.5 font-label-sm text-label-sm border border-outline-variant font-bold">
                      PDF + REPO
                    </span>
                    <button
                      onClick={() => alert('Downloading open course runbook from local SQLite archive.')}
                      className="bg-primary text-on-primary font-label-sm text-label-sm uppercase px-3 py-1 hover:bg-secondary transition-colors inline-flex items-center gap-1 font-bold"
                    >
                      <span>Preview</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                    </button>
                  </div>
                </div>

                <div className="bg-surface-container p-4 border border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-secondary transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-surface-container-lowest text-primary border border-outline-variant">
                      <span className="material-symbols-outlined text-[20px]">description</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-label-sm text-label-sm text-outline font-mono">
                        <span>ARCHIVE_REF: EXAM_SYS_620</span>
                        <span className="text-secondary font-bold">PEER ANNOTATED</span>
                      </div>
                      <h4 className="font-headline-sm text-[16px] text-primary font-bold mt-0.5">
                        Advanced Concurrency &amp; Memory Semantics Midterm Walkthrough
                      </h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-2xl">
                        Full annotated solutions covering cache coherence protocols (MESI), atomic operations, and hazard pointers.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-mono">
                    <span className="bg-surface-container-low text-primary px-2 py-0.5 font-label-sm text-label-sm border border-outline-variant font-bold">
                      LATEX + PDF
                    </span>
                    <button
                      onClick={() => alert('Downloading annotated midterm walkthrough from local SQLite archive.')}
                      className="bg-primary text-on-primary font-label-sm text-label-sm uppercase px-3 py-1 hover:bg-secondary transition-colors inline-flex items-center gap-1 font-bold"
                    >
                      <span>Preview</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                    </button>
                  </div>
                </div>

                <div className="bg-surface-container p-4 border border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-secondary transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-surface-container-lowest text-primary border border-outline-variant">
                      <span className="material-symbols-outlined text-[20px]">dataset</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-label-sm text-label-sm text-outline font-mono">
                        <span>ARCHIVE_REF: SYLLABUS_CORPUS_V3</span>
                        <span className="text-secondary font-bold">MACHINE READABLE</span>
                      </div>
                      <h4 className="font-headline-sm text-[16px] text-primary font-bold mt-0.5">
                        Standard Collegiate Computer Science Topic Embeddings (1998-2026)
                      </h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-2xl">
                        JSON matrix of course outcome competencies across 42 accredited institutions without proprietary licensing.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-mono">
                    <span className="bg-surface-container-low text-primary px-2 py-0.5 font-label-sm text-label-sm border border-outline-variant font-bold">
                      JSON MATRIX
                    </span>
                    <button
                      onClick={() => alert('Opening JSON syllabus embedding corpus in local browser sandbox.')}
                      className="bg-primary text-on-primary font-label-sm text-label-sm uppercase px-3 py-1 hover:bg-secondary transition-colors inline-flex items-center gap-1 font-bold"
                    >
                      <span>Preview</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Placement Dataset Explorer */}
          {activeTab === 'placements' && (
            <PlacementDatasetExplorer />
          )}
        </div>
      </section>

      {/* Mentor Request Modal */}
      {mentorModalOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">handshake</span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Request Peer Mentorship
                </h3>
              </div>
              <button
                onClick={() => setMentorModalOpen(false)}
                className="text-outline hover:text-primary"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {requestSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-500 text-emerald-900 font-mono text-sm space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Session Requested Successfully
                </div>
                <div>Encrypted notification delivered to {selectedMentor}.</div>
              </div>
            ) : (
              <form onSubmit={handleSendMentorRequest} className="space-y-4 font-mono">
                <div>
                  <div className="text-xs text-on-surface-variant mb-1 font-bold">RECIPIENT MENTOR:</div>
                  <div className="p-2 bg-surface-container border border-outline-variant text-primary font-bold">
                    {selectedMentor}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-on-surface-variant mb-1 font-bold">SESSION TOPIC &amp; GOALS:</div>
                  <textarea
                    required
                    rows={3}
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    placeholder="e.g. Would love a 30m review of Raft log replication invariant proofs for upcoming technical mock..."
                    className="w-full p-2 bg-surface-container-low border border-outline-variant font-body-sm text-body-sm text-primary focus:outline-none focus:border-secondary"
                  />
                </div>

                <div className="text-[11px] text-outline">
                  Zero commercial billing or transaction take rate. Direct peer cryptographic coordination.
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setMentorModalOpen(false)}
                    className="px-3 py-1.5 border border-outline-variant text-on-surface hover:bg-surface-container font-label-sm uppercase font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-primary text-on-primary hover:bg-secondary font-label-sm uppercase font-bold"
                  >
                    Dispatch Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicHub;
