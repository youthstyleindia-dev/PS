import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { AcademicHub } from './pages/AcademicHub';
import { ProvenanceBadge } from './components/ProvenanceBadge';
import { UserRole, ActivityItem } from './types';
import { Car, Leaf, Brain, ShieldAlert, ArrowLeft, Construction } from 'lucide-react';

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act_1',
    module: 'hub',
    title: 'Mentorship Request Accepted',
    description: 'Diya Patel accepted your System Design Mock request for Saturday 11:00 AM.',
    timestamp: '10m ago',
    read: false,
    provenance: 'ESTIMATED_METRIC'
  },
  {
    id: 'act_2',
    module: 'rides',
    title: 'Ride Match Confirmed',
    description: 'Matched with Vikram Rao from North Gate to Central Dining (0.22 kg CO2 saved).',
    timestamp: '45m ago',
    read: false,
    provenance: 'ESTIMATED_METRIC'
  },
  {
    id: 'act_3',
    module: 'sustainability',
    title: 'Workload Telemetry Captured',
    description: 'AI GPU Inference workload telemetry updated with PUE 1.25 and grid carbon 210g/kWh.',
    timestamp: '2h ago',
    read: true,
    provenance: 'SIMULATED_EVENT'
  },
  {
    id: 'act_4',
    module: 'exams',
    title: 'Proctor Incident Resolved',
    description: 'False positive head pose event reviewed and dismissed with rationale notes.',
    timestamp: '3h ago',
    read: true,
    provenance: 'ACTUAL_INFERENCE'
  }
];

// Placeholder preview components for upcoming milestones M2, M3, M4, M5
const RidePoolingPlaceholder: React.FC = () => (
  <div className="p-8 max-w-4xl mx-auto space-y-6">
    <div className="p-6 rounded-2xl bg-card border border-border-subtle space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-400/30">
            <Car className="w-6 h-6" />
          </span>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">Module B • Milestone 2</span>
            <h1 className="text-xl font-bold text-fg-primary">Smart Campus Ride-Pooling Engine</h1>
          </div>
        </div>
        <ProvenanceBadge type="ESTIMATED_METRIC" label="DARP Matching" />
      </div>
      <p className="text-xs text-fg-muted leading-relaxed">
        10 canonical campus nodes, 22 road edges, dynamic time-of-day traffic weighting, and Dial-a-Ride insertion matching heuristic enforcing 35% detour bounds.
      </p>
      <div className="p-4 rounded-xl bg-surface/50 border border-border-subtle flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 text-fg-muted">
          <Construction className="w-4 h-4 text-warning" />
          Relational schema & seed graph initialized in SQLite. Full interactive visualizer scheduled for M2.
        </span>
        <Link to="/hub" className="text-accent hover:underline font-semibold flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Academic Hub
        </Link>
      </div>
    </div>
  </div>
);

const SustainabilityPlaceholder: React.FC = () => (
  <div className="p-8 max-w-4xl mx-auto space-y-6">
    <div className="p-6 rounded-2xl bg-card border border-border-subtle space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Leaf className="w-6 h-6" />
          </span>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">Module C • Milestone 3</span>
            <h1 className="text-xl font-bold text-fg-primary">Sustainable Computing Observatory</h1>
          </div>
        </div>
        <ProvenanceBadge type="SIMULATED_EVENT" label="Workload Simulator" />
      </div>
      <p className="text-xs text-fg-muted leading-relaxed">
        Non-linear power modeling (P_idle + Delta P * U^gamma) with cooling PUE factors and diurnal solar grid carbon curves comparing Baseline vs Eco-scaled scenarios.
      </p>
      <div className="p-4 rounded-xl bg-surface/50 border border-border-subtle flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 text-fg-muted">
          <Construction className="w-4 h-4 text-warning" />
          Service workloads (LMS, AI GPU, IoT) seeded in database. Real-time telemetry dashboard scheduled for M3.
        </span>
        <Link to="/hub" className="text-accent hover:underline font-semibold flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Academic Hub
        </Link>
      </div>
    </div>
  </div>
);

const WellbeingPlaceholder: React.FC = () => (
  <div className="p-8 max-w-4xl mx-auto space-y-6">
    <div className="p-6 rounded-2xl bg-card border border-border-subtle space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-400/30">
            <Brain className="w-6 h-6" />
          </span>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">Module D • Milestone 4</span>
            <h1 className="text-xl font-bold text-fg-primary">Privacy-Aware Digital Wellbeing</h1>
          </div>
        </div>
        <ProvenanceBadge type="ESTIMATED_METRIC" label="Laplace DP (eps=0.8)" />
      </div>
      <p className="text-xs text-fg-muted leading-relaxed">
        Local-first domain hostname sanitization, Deep Work Index (DWI), context switch tracking, Laplace differential privacy, and cohort k-anonymity suppression.
      </p>
      <div className="p-4 rounded-xl bg-surface/50 border border-border-subtle flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 text-fg-muted">
          <Construction className="w-4 h-4 text-warning" />
          Domain categorization rules and focus sessions seeded. Session lifecycle controls scheduled for M4.
        </span>
        <Link to="/hub" className="text-accent hover:underline font-semibold flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Academic Hub
        </Link>
      </div>
    </div>
  </div>
);

const ExamMonitoringPlaceholder: React.FC = () => (
  <div className="p-8 max-w-4xl mx-auto space-y-6">
    <div className="p-6 rounded-2xl bg-card border border-border-subtle space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-400/30">
            <ShieldAlert className="w-6 h-6" />
          </span>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">Module E • Milestone 5</span>
            <h1 className="text-xl font-bold text-fg-primary">Responsible Examination Monitoring</h1>
          </div>
        </div>
        <ProvenanceBadge type="ACTUAL_INFERENCE" label="Edge CV Pose" />
      </div>
      <p className="text-xs text-fg-muted leading-relaxed">
        Computer vision head pose deviation and zone intrusion observation, strictly human-in-the-loop triage, zero automated penalties, and immutable SQLite audit logging.
      </p>
      <div className="p-4 rounded-xl bg-surface/50 border border-border-subtle flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 text-fg-muted">
          <Construction className="w-4 h-4 text-warning" />
          Observation events and audit trail seeded in database. Video feed ingestion and proctor desk scheduled for M5.
        </span>
        <Link to="/hub" className="text-accent hover:underline font-semibold flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Academic Hub
        </Link>
      </div>
    </div>
  </div>
);

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);

  const handleMarkAllAsRead = () => {
    setActivities((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const handleClearActivities = () => {
    setActivities([]);
  };

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-canvas text-fg-primary antialiased">
        {/* Persistent Responsive Navigation Sidebar */}
        <Navbar />

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Global Header with Role Persona Binding */}
          <Header
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            activities={activities}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClearActivities={handleClearActivities}
          />

          {/* Scrollable View Area */}
          <main className="flex-1 overflow-y-auto p-6 bg-canvas">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/hub" element={<AcademicHub currentRole={currentRole} />} />
              <Route path="/rides" element={<RidePoolingPlaceholder />} />
              <Route path="/sustainability" element={<SustainabilityPlaceholder />} />
              <Route path="/wellbeing" element={<WellbeingPlaceholder />} />
              <Route path="/exams" element={<ExamMonitoringPlaceholder />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};
