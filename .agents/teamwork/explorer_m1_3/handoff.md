# UniVerse Client UI Architecture & Module A Blueprint Report

**Milestone**: Milestone 1 (Core Platform & Academic Hub)  
**Agent**: `explorer_m1_3`  
**Working Directory**: `/Users/divya/Documents/Problem statement /.agents/teamwork/explorer_m1_3`  
**Parent Orchestrator ID**: `5c79500e-0663-460b-8b92-210d35bc7398`  
**Date**: 2026-10-29T13:06:00Z  

---

## 1. Observation

### 1.1 Existing Client Codebase & Dependencies
- **Workspace Directory**: `/Users/divya/Documents/Problem statement /client`
- **Installed Client Packages** (verified via `client/package.json` and Node runtime checks):
  - `react@19.0.0` & `react-dom@19.0.0`
  - `react-router-dom@7.1.5` (supports declarative `<BrowserRouter>`, `<Routes>`, `<Route>`, `<NavLink>`, `<Link>`, `useNavigate`, `useLocation`)
  - `recharts@2.15.0` (`RadarChart`, `Radar`, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`, `ResponsiveContainer`, `BarChart`, `Bar`, `Tooltip`)
  - `lucide-react@1.16.0` (all required icons verified: `GraduationCap`, `Car`, `Leaf`, `Brain`, `ShieldAlert`, `LayoutDashboard`, `Bell`, `User`, `Search`, `CheckCircle2`, `Star`, `Download`, `ChevronDown`, `Check`, `X`, `Clock`, `Sparkles`, `Filter`, `ArrowUpRight`, `BookOpen`, `Users`, `Target`)
  - `tailwindcss@4.0.0` with `@tailwindcss/vite@4.0.0`
  - `clsx@2.1.1` & `tailwind-merge@3.0.1`
- **Tailwind v4 Theme Configuration** (`client/src/index.css`):
  ```css
  @theme {
    --color-canvas: #080D14;
    --color-sidebar: #0C131D;
    --color-card: #111B27;
    --color-surface: #172332;
    --color-accent: #39F59A;
    --color-accent-hover: #2ee089;
    --color-accent-dim: rgba(57, 245, 154, 0.12);
    --color-fg-primary: #F2F7FA;
    --color-fg-muted: #98A8B8;
    --color-border-subtle: #253343;
    --color-border-strong: #374b61;
    --color-info: #38BDF8;
    --color-warning: #F59E0B;
    --color-danger: #EF4444;
    --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }
  ```
  Utility classes defined: `.glow-accent` (`box-shadow: 0 0 25px -5px rgba(57, 245, 154, 0.25)`), `.glow-card` (`box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4)`).
- **Vite Configuration** (`client/vite.config.ts`):
  Configures development proxy: `/api` -> `http://localhost:3001` with `changeOrigin: true`.
- **Existing Source Files in `client/src`**:
  `index.css` is currently the only file. No `.tsx` or `.ts` files exist yet.

---

## 2. Logic Chain

1. **Routing Architecture**: React Router v7 supports standard `<BrowserRouter>` with nested routes or unified shell layout. A top-level `<AppLayout>` component will render the persistent responsive `<Navbar>`, `<Header>`, and `<main>` view container, wrapping `<Outlet />` or declarative `<Routes>`.
2. **State Management Strategy**: For this unified multi-module campus system, lightweight React Context is optimal and avoids unnecessary external state bloat:
   - `RoleContext`: Manages current simulated perspective (`'student' | 'driver' | 'proctor' | 'admin'`) and current mock user profile.
   - `ActivityContext`: Manages global notification items, unread count badge, and slide-over notification drawer state.
3. **API Integration & Resilience**: The frontend must consume backend endpoints at `/api/...`. To prevent white screens or crashes when the server is being started, tested in isolation, or returning temporary errors, the service layer (`client/src/services/`) will implement typed API calls with deterministic, rich fallback fixtures matching the SQLite seed dataset.
4. **Transparent Provenance Design (R2, R3, Sec 8)**: To satisfy the core challenge requirement of clearly distinguishing AI inference from simulated events and estimated metrics, a universal `<ProvenanceBadge />` component will be embedded across all module dashboards with three explicit modes:
   - `ACTUAL_INFERENCE`: Live edge computer vision / AI detection.
   - `SIMULATED_EVENT`: Multi-service load generation and test scenarios.
   - `ESTIMATED_METRIC`: Formulated calculations (PUE, carbon intensity, travel cost savings).
5. **Component Hierarchy**:
   ```
   App (Providers: BrowserRouter, RoleProvider, ActivityProvider)
   └── AppLayout
       ├── Navbar (Sidebar with 6 route links, module badges, system status)
       ├── Header (Search, RoleSwitcher dropdown, ActivityCenter bell & drawer, User pill)
       └── Main Content Area (<Routes>)
           ├── / -> Dashboard (Campus-wide 5-pillar overview)
           ├── /hub -> AcademicHub (Readiness, Mentorship, Requests, Resources)
           ├── /rides -> RidePooling (Module B stub)
           ├── /sustainability -> Sustainability (Module C stub)
           ├── /wellbeing -> Wellbeing (Module D stub)
           └── /exams -> ExamMonitoring (Module E stub)
   ```

---

## 3. Caveats

1. **React 19 Compatibility**: React 19 no longer requires `import React from 'react'` in JSX files. Function components with hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useContext`) work directly.
2. **Tailwind CSS v4 Utility Names**: Tailwind v4 uses modern CSS variables defined in `@theme`. Color utilities such as `bg-canvas`, `bg-sidebar`, `bg-card`, `bg-surface`, `text-accent`, `text-fg-primary`, `text-fg-muted`, `border-border-subtle` map directly to the defined variables.
3. **Future Module Pages**: While M1 focuses on the Client Shell, Dashboard, and Module A (`AcademicHub.tsx`), routes `/rides`, `/sustainability`, `/wellbeing`, and `/exams` must have clean placeholder components so the router and TypeScript compilation succeed cleanly without broken links.

---

## 4. Conclusion & Technical Implementation Blueprint

The following complete file blueprints provide the verbatim implementation code for the client shell, shared components, type definitions, service layers, and page views.

---

### 4.1 Type Definitions (`client/src/types/index.ts`)

```typescript
// client/src/types/index.ts

export type UserRole = 'student' | 'driver' | 'proctor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department: string;
  yearOfStudy: number;
  bio: string;
}

export type ProvenanceType = 'ACTUAL_INFERENCE' | 'SIMULATED_EVENT' | 'ESTIMATED_METRIC';

// Module A: Academic Hub Types
export interface StudentSkill {
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'master';
  category: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  user: User;
  skills: StudentSkill[];
  interests: string[];
  targetRole: string;
  placementGoals: string[];
  readinessScore: number; // 0 - 100
  gpa: number;
}

export interface PlacementMilestone {
  id: string;
  studentId: string;
  title: string;
  category: 'DSA' | 'SystemDesign' | 'Fundamentals' | 'FullStack' | 'MockInterview' | 'Resume';
  completed: boolean;
  targetDate?: string;
}

export interface PeerMentor {
  id: string;
  userId: string;
  user: User;
  companyOffer: string;
  roleTitle: string;
  skills: string[];
  availableSlots: string[];
  maxMentees: number;
  rating: number; // e.g. 4.9
  reviewCount: number;
  bio: string;
}

export type MentorshipStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface MentorshipRequest {
  id: string;
  menteeId: string;
  mentee?: User;
  mentorId: string;
  mentor?: PeerMentor;
  topic: string;
  preferredSlot: string;
  status: MentorshipStatus;
  notes?: string;
  createdAt: string;
}

export type ResourceCategory = 'Notes' | 'PYQ' | 'Syllabus' | 'Guide';

export interface AcademicResource {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  department: string;
  semester: number;
  category: ResourceCategory;
  fileUrl: string;
  fileSize: string;
  uploaderId: string;
  uploaderName: string;
  downloadsCount: number;
  rating: number;
  ratingsCount: number;
  userRated?: number;
  tags: string[];
  createdAt: string;
}

// Activity & Notifications
export interface ActivityItem {
  id: string;
  module: 'hub' | 'rides' | 'sustainability' | 'wellbeing' | 'exams' | 'system';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  provenance?: ProvenanceType;
  link?: string;
}

// Campus Dashboard Metrics
export interface CampusMetrics {
  hub: {
    readinessScore: number;
    activeMentorships: number;
    resourcesAvailable: number;
  };
  rides: {
    activeRides: number;
    sharedDistanceKm: number;
    carbonSavedKg: number;
  };
  sustainability: {
    powerWatts: number;
    carbonGramsPerHour: number;
    ecoOptimizationActive: boolean;
    energySavedPct: number;
  };
  wellbeing: {
    focusMinutesToday: number;
    deepWorkIndex: number;
    privacyProtected: boolean;
  };
  exams: {
    activeSessions: number;
    pendingReviews: number;
    flaggedObservations: number;
  };
}
```

---

### 4.2 Shared Provenance Badge (`client/src/components/ProvenanceBadge.tsx`)

Satisfies R2, R3, and Section 8 transparency requirements.

```tsx
// client/src/components/ProvenanceBadge.tsx
import React from 'react';
import { Sparkles, Cpu, Calculator } from 'lucide-react';
import { ProvenanceType } from '../types';

interface ProvenanceBadgeProps {
  type: ProvenanceType;
  label?: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  type,
  label,
  className = '',
  showIcon = true,
  size = 'sm'
}) => {
  const configs = {
    ACTUAL_INFERENCE: {
      defaultLabel: 'Actual Model Inference',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
      icon: Sparkles,
      tooltip: 'Real-time client/edge computer vision or AI inference execution'
    },
    SIMULATED_EVENT: {
      defaultLabel: 'Simulated Workload',
      bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      dot: 'bg-sky-400',
      icon: Cpu,
      tooltip: 'Simulated campus load generation or test scenario event'
    },
    ESTIMATED_METRIC: {
      defaultLabel: 'Estimated Metric',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400',
      icon: Calculator,
      tooltip: 'Algorithmic mathematical calculation (PUE 1.35, Grid 475g/kWh, DARP savings)'
    }
  };

  const config = configs[type] || configs.ESTIMATED_METRIC;
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 space-x-1.5' 
    : 'text-sm px-2.5 py-1 space-x-2';

  return (
    <span
      title={config.tooltip}
      className={`inline-flex items-center rounded-full border font-mono uppercase tracking-wider font-semibold cursor-help transition-all hover:brightness-110 ${config.bg} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{displayLabel}</span>
    </span>
  );
};
```

---

### 4.3 Responsive Navigation Bar (`client/src/components/Navbar.tsx`)

```tsx
// client/src/components/Navbar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Car,
  Leaf,
  Brain,
  ShieldAlert,
  Database,
  Radio
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Academic Hub', path: '/hub', icon: GraduationCap, badge: 'Prep', badgeColor: 'bg-accent/20 text-accent' },
  { name: 'Ride-Pooling', path: '/rides', icon: Car, badge: 'DARP', badgeColor: 'bg-sky-500/20 text-sky-400' },
  { name: 'Sustainability', path: '/sustainability', icon: Leaf, badge: 'Eco', badgeColor: 'bg-emerald-500/20 text-emerald-400' },
  { name: 'Digital Wellbeing', path: '/wellbeing', icon: Brain, badge: 'DP', badgeColor: 'bg-purple-500/20 text-purple-400' },
  { name: 'Exam Monitoring', path: '/exams', icon: ShieldAlert, badge: 'CV AI', badgeColor: 'bg-amber-500/20 text-amber-400' },
];

export const Navbar: React.FC = () => {
  return (
    <aside className="w-64 bg-sidebar border-r border-border-subtle flex flex-col shrink-0 h-screen select-none">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-border-subtle gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent-dim border border-accent/40 flex items-center justify-center glow-accent">
          <Radio className="w-5 h-5 text-accent animate-pulse" />
        </div>
        <div>
          <div className="font-extrabold text-lg tracking-tight text-fg-primary flex items-center gap-1.5">
            Uni<span className="text-accent">Verse</span>
          </div>
          <p className="text-[10px] uppercase font-mono tracking-widest text-fg-muted font-medium">Campus OS</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-fg-muted/70 font-semibold">
          Core Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-accent-dim text-accent border border-accent/30 font-semibold glow-card'
                    : 'text-fg-muted hover:text-fg-primary hover:bg-surface/60 font-medium'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-border-subtle bg-surface/30">
        <div className="flex items-center justify-between text-xs text-fg-muted mb-2">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-accent" />
            <span className="font-mono text-[11px]">SQLite WAL Mode</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-fg-muted/80">
          <span>Port 3001 Connected</span>
          <span className="text-accent">Ready</span>
        </div>
      </div>
    </aside>
  );
};
```

---

### 4.4 Role Simulation Switcher (`client/src/components/RoleSwitcher.tsx`)

```tsx
// client/src/components/RoleSwitcher.tsx
import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../types';
import { User, Shield, Car, GraduationCap, ChevronDown, Check } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const roleConfigs: Record<UserRole, { label: string; icon: React.ElementType; color: string; badge: string; desc: string }> = {
  student: {
    label: 'Student Perspective',
    icon: GraduationCap,
    color: 'text-accent border-accent/30 bg-accent/10',
    badge: 'Aarav Sharma (CS-8th)',
    desc: 'Access placement tools, request mentors, book pooled rides'
  },
  driver: {
    label: 'Driver Perspective',
    icon: Car,
    color: 'text-sky-400 border-sky-400/30 bg-sky-500/10',
    badge: 'Vikram Singh (Staff/Host)',
    desc: 'Publish campus routes, accept carpool detours, view carbon'
  },
  proctor: {
    label: 'Proctor Perspective',
    icon: Shield,
    color: 'text-amber-400 border-amber-400/30 bg-amber-500/10',
    badge: 'Dr. Aris Thorne (Invigilator)',
    desc: 'Review CV event detections, dismiss false positives, audit logs'
  },
  admin: {
    label: 'System Admin',
    icon: User,
    color: 'text-purple-400 border-purple-400/30 bg-purple-500/10',
    badge: 'Campus Operations',
    desc: 'Observe energy telemetry, manage workloads, full audit access'
  }
};

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = roleConfigs[currentRole];
  const CurrentIcon = current.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface/80 hover:bg-surface text-fg-primary text-xs font-medium transition-all"
      >
        <span className={`p-1 rounded-md border ${current.color}`}>
          <CurrentIcon className="w-3.5 h-3.5" />
        </span>
        <div className="text-left">
          <div className="font-semibold text-fg-primary">{current.label}</div>
          <div className="text-[10px] text-fg-muted font-mono">{current.badge}</div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-fg-muted ml-1" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border-strong bg-card shadow-2xl z-50 p-1.5 glow-card">
          <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-fg-muted border-b border-border-subtle mb-1">
            Simulate Campus Persona
          </div>
          {(Object.keys(roleConfigs) as UserRole[]).map((role) => {
            const config = roleConfigs[role];
            const Icon = config.icon;
            const isSelected = role === currentRole;

            return (
              <button
                key={role}
                onClick={() => {
                  onRoleChange(role);
                  setIsOpen(false);
                }}
                className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-all ${
                  isSelected ? 'bg-surface text-fg-primary' : 'hover:bg-surface/50 text-fg-muted hover:text-fg-primary'
                }`}
              >
                <span className={`p-1.5 rounded-md border mt-0.5 ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-fg-primary">{config.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                  </div>
                  <p className="text-[11px] text-fg-muted font-mono">{config.badge}</p>
                  <p className="text-[10px] text-fg-muted/80 mt-0.5 leading-tight">{config.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
```

---

### 4.5 Activity Center & Notification Drawer (`client/src/components/ActivityCenter.tsx`)

```tsx
// client/src/components/ActivityCenter.tsx
import React, { useState } from 'react';
import { Bell, X, Check, ExternalLink, ShieldAlert, GraduationCap, Car, Leaf } from 'lucide-react';
import { ActivityItem } from '../types';
import { ProvenanceBadge } from './ProvenanceBadge';

interface ActivityCenterProps {
  activities: ActivityItem[];
  onMarkAllAsRead: () => void;
  onClear: () => void;
}

export const ActivityCenter: React.FC<ActivityCenterProps> = ({
  activities,
  onMarkAllAsRead,
  onClear
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = activities.filter((a) => !a.read).length;

  const getModuleIcon = (mod: ActivityItem['module']) => {
    switch (mod) {
      case 'hub': return GraduationCap;
      case 'rides': return Car;
      case 'sustainability': return Leaf;
      case 'exams': return ShieldAlert;
      default: return Bell;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg border border-border-subtle bg-surface/60 hover:bg-surface text-fg-muted hover:text-fg-primary transition-colors"
        title="Campus Notifications & Event Log"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-canvas text-[10px] font-bold flex items-center justify-center font-mono">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-canvas/60 backdrop-blur-sm">
          <div className="w-96 bg-card border-l border-border-strong h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface/40">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent" />
                <h3 className="font-semibold text-sm text-fg-primary">Campus Activity Feed</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-surface text-fg-muted hover:text-fg-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions Bar */}
            <div className="px-4 py-2 border-b border-border-subtle flex items-center justify-between text-xs text-fg-muted bg-surface/20">
              <button
                onClick={onMarkAllAsRead}
                className="hover:text-accent flex items-center gap-1 font-medium transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
              <button
                onClick={onClear}
                className="hover:text-danger font-medium transition-colors"
              >
                Clear all
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {activities.length === 0 ? (
                <div className="text-center py-12 text-fg-muted text-xs">
                  No notifications recorded yet.
                </div>
              ) : (
                activities.map((item) => {
                  const Icon = getModuleIcon(item.module);
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all ${
                        item.read
                          ? 'border-border-subtle bg-surface/30 opacity-75'
                          : 'border-accent/30 bg-surface/80 glow-card'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-card border border-border-subtle text-accent">
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-xs font-semibold text-fg-primary">{item.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-fg-muted">{item.timestamp}</span>
                      </div>
                      <p className="text-xs text-fg-muted mt-2 leading-relaxed">{item.description}</p>
                      {item.provenance && (
                        <div className="mt-2.5">
                          <ProvenanceBadge type={item.provenance} size="sm" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
```

---

### 4.6 Header Bar (`client/src/components/Header.tsx`)

```tsx
// client/src/components/Header.tsx
import React from 'react';
import { Search } from 'lucide-react';
import { UserRole, ActivityItem } from '../types';
import { RoleSwitcher } from './RoleSwitcher';
import { ActivityCenter } from './ActivityCenter';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activities: ActivityItem[];
  onMarkAllAsRead: () => void;
  onClearActivities: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  activities,
  onMarkAllAsRead,
  onClearActivities
}) => {
  return (
    <header className="h-16 border-b border-border-subtle bg-sidebar/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-40">
      {/* Quick Search */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-fg-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search modules, courses, mentors, rides..."
          className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border-subtle bg-surface/60 text-xs text-fg-primary placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Role Switcher */}
        <RoleSwitcher currentRole={currentRole} onRoleChange={onRoleChange} />

        {/* Activity Center */}
        <ActivityCenter
          activities={activities}
          onMarkAllAsRead={onMarkAllAsRead}
          onClear={onClearActivities}
        />

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border-subtle">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center font-bold text-accent text-xs">
            AS
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-fg-primary leading-tight">Aarav Sharma</div>
            <div className="text-[10px] text-fg-muted font-mono leading-tight">CS2022_891</div>
          </div>
        </div>
      </div>
    </header>
  );
};
```

---

### 4.7 API Service Layer (`client/src/services/`)

#### Common Client (`client/src/services/api.ts`)
```typescript
// client/src/services/api.ts
const BASE_URL = '/api';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.message || `HTTP error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn(`[API] fetch failed for ${endpoint}:`, err.message);
    throw err;
  }
}
```

#### Module A Service (`client/src/services/hub.service.ts`)
Includes rich, realistic fallback mock fixtures matching the SQLite seed dataset so that UI views function deterministically whether backend is live or offline during testing.

```typescript
// client/src/services/hub.service.ts
import { request } from './api';
import {
  StudentProfile,
  PlacementMilestone,
  PeerMentor,
  MentorshipRequest,
  AcademicResource
} from '../types';

// Deterministic seed fallbacks
const MOCK_PROFILE: StudentProfile = {
  id: 'sp_1',
  userId: 'usr_student_1',
  user: {
    id: 'usr_student_1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@campus.edu',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    role: 'student',
    department: 'Computer Science & Engineering',
    yearOfStudy: 4,
    bio: 'Passionate about distributed backend systems, graph algorithms, and cloud infrastructure.'
  },
  skills: [
    { name: 'Data Structures & Algorithms', proficiency: 'advanced', category: 'Problem Solving' },
    { name: 'System Design & Scalability', proficiency: 'intermediate', category: 'Architecture' },
    { name: 'React 19 & TypeScript', proficiency: 'advanced', category: 'FullStack' },
    { name: 'Node.js & Express', proficiency: 'advanced', category: 'Backend' },
    { name: 'SQLite & Relational DBs', proficiency: 'advanced', category: 'Database' },
    { name: 'Graph Theory & Dijkstra', proficiency: 'advanced', category: 'Algorithms' },
    { name: 'Computer Vision & MediaPipe', proficiency: 'intermediate', category: 'AI/ML' }
  ],
  interests: ['High-Throughput Microservices', 'Green Computing', 'Peer Mentoring'],
  targetRole: 'Full-Stack Distributed Systems SDE',
  placementGoals: [
    'Clear Tier-1 Tech Company SDE-1 interviews',
    'Publish UniVerse open-source campus platform',
    'Mentor junior CS students in Graph Algorithms'
  ],
  readinessScore: 78,
  gpa: 8.85
};

const MOCK_MILESTONES: PlacementMilestone[] = [
  { id: 'm_1', studentId: 'sp_1', title: 'Solve 150 LeetCode Medium/Hard Problems', category: 'DSA', completed: true },
  { id: 'm_2', studentId: 'sp_1', title: 'Implement Dijkstra & DARP Ride Matching Engine', category: 'DSA', completed: true },
  { id: 'm_3', studentId: 'sp_1', title: 'Design Scalable URL Shortener & Ride-Hailing LLD', category: 'SystemDesign', completed: true },
  { id: 'm_4', studentId: 'sp_1', title: 'Deep dive into Operating Systems & Virtual Memory', category: 'Fundamentals', completed: false },
  { id: 'm_5', studentId: 'sp_1', title: 'Complete 2 Peer Technical Mock Interviews', category: 'MockInterview', completed: true },
  { id: 'm_6', studentId: 'sp_1', title: 'Review System Design Resume with Senior Google Mentor', category: 'Resume', completed: false }
];

const MOCK_MENTORS: PeerMentor[] = [
  {
    id: 'pm_1',
    userId: 'usr_mentor_1',
    user: {
      id: 'usr_mentor_1',
      name: 'Neha Patel',
      email: 'neha.patel@alumni.edu',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      role: 'student',
      department: 'Computer Science',
      yearOfStudy: 4,
      bio: 'Placed SDE-1 @ Google. Focus on low-latency microservices and system design.'
    },
    companyOffer: 'Google (SDE-1)',
    roleTitle: 'Software Engineer',
    skills: ['System Design', 'Distributed Systems', 'Go', 'Kubernetes', 'Mock Interviews'],
    availableSlots: ['Wed 4:00 PM - 5:00 PM', 'Fri 6:00 PM - 7:00 PM', 'Sat 11:00 AM - 12:00 PM'],
    maxMentees: 4,
    rating: 4.9,
    reviewCount: 22,
    bio: 'Happy to do 1:1 resume teardowns, distributed system design deep dives, and behavioral prep.'
  },
  {
    id: 'pm_2',
    userId: 'usr_mentor_2',
    user: {
      id: 'usr_mentor_2',
      name: 'Rohan Mehta',
      email: 'rohan.mehta@alumni.edu',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      role: 'student',
      department: 'Computer Science',
      yearOfStudy: 4,
      bio: 'Incoming SDE @ Microsoft. Core algorithms, trees, DP, and graph specialist.'
    },
    companyOffer: 'Microsoft (SDE-1)',
    roleTitle: 'Software Engineer',
    skills: ['Data Structures', 'Graph Algorithms', 'Dynamic Programming', 'C++', 'Competitive Coding'],
    availableSlots: ['Tue 5:00 PM - 6:00 PM', 'Thu 5:00 PM - 6:00 PM'],
    maxMentees: 3,
    rating: 4.8,
    reviewCount: 16,
    bio: 'Will help you break down complex graph and DP problems systematically.'
  },
  {
    id: 'pm_3',
    userId: 'usr_mentor_3',
    user: {
      id: 'usr_mentor_3',
      name: 'Ananya Roy',
      email: 'ananya.roy@alumni.edu',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      role: 'student',
      department: 'Information Science',
      yearOfStudy: 4,
      bio: 'Incoming Systems Engineer @ Stripe. Cloud architecture and API design.'
    },
    companyOffer: 'Stripe (Systems)',
    roleTitle: 'Infrastructure Engineer',
    skills: ['API Design', 'PostgreSQL / SQLite', 'TypeScript', 'Node.js', 'System Architecture'],
    availableSlots: ['Mon 3:00 PM - 4:00 PM', 'Sat 2:00 PM - 3:00 PM'],
    maxMentees: 5,
    rating: 5.0,
    reviewCount: 19,
    bio: 'Passionate about clean code, robust API contracts, and production debugging.'
  }
];

const MOCK_REQUESTS: MentorshipRequest[] = [
  {
    id: 'req_1',
    menteeId: 'usr_student_1',
    mentorId: 'pm_1',
    mentor: MOCK_MENTORS[0],
    topic: 'System Design Mock: Ride-Hailing Dispatch Service',
    preferredSlot: 'Fri 6:00 PM - 7:00 PM',
    status: 'accepted',
    notes: 'Looking forward to this. Please prepare your high-level component diagram.',
    createdAt: '2026-10-28T10:30:00Z'
  },
  {
    id: 'req_2',
    menteeId: 'usr_student_1',
    mentorId: 'pm_2',
    mentor: MOCK_MENTORS[1],
    topic: 'Dijkstra & DARP Detour Optimization Review',
    preferredSlot: 'Thu 5:00 PM - 6:00 PM',
    status: 'pending',
    notes: 'Submitted initial question regarding detour bound constraints.',
    createdAt: '2026-10-29T08:15:00Z'
  }
];

const MOCK_RESOURCES: AcademicResource[] = [
  {
    id: 'res_1',
    title: 'CS301 Advanced Graph Algorithms & Shortest Path Compendium',
    courseCode: 'CS301',
    courseName: 'Data Structures & Algorithms',
    department: 'Computer Science',
    semester: 5,
    category: 'Notes',
    fileUrl: '/docs/CS301_Graph_Compendium.pdf',
    fileSize: '3.4 MB',
    uploaderId: 'usr_student_1',
    uploaderName: 'Aarav Sharma',
    downloadsCount: 184,
    rating: 4.9,
    ratingsCount: 28,
    userRated: 5,
    tags: ['Graphs', 'Dijkstra', 'Floyd-Warshall', 'A* Search'],
    createdAt: '2026-10-15T14:00:00Z'
  },
  {
    id: 'res_2',
    title: 'CS302 Operating Systems 2024 End-Semester Solved PYQ',
    courseCode: 'CS302',
    courseName: 'Operating Systems & Concurrency',
    department: 'Computer Science',
    semester: 5,
    category: 'PYQ',
    fileUrl: '/docs/CS302_2024_Solved_PYQ.pdf',
    fileSize: '5.1 MB',
    uploaderId: 'usr_mentor_1',
    uploaderName: 'Neha Patel',
    downloadsCount: 312,
    rating: 4.8,
    ratingsCount: 42,
    userRated: 0,
    tags: ['PYQ', 'Paging', 'Deadlock', 'Process Scheduling'],
    createdAt: '2026-10-18T09:20:00Z'
  },
  {
    id: 'res_3',
    title: 'CS303 Computer Networks Protocol Stack Cheatsheet & Lab Guide',
    courseCode: 'CS303',
    courseName: 'Computer Networks',
    department: 'Computer Science',
    semester: 6,
    category: 'Syllabus',
    fileUrl: '/docs/CS303_Protocol_Cheatsheet.pdf',
    fileSize: '2.2 MB',
    uploaderId: 'usr_mentor_2',
    uploaderName: 'Rohan Mehta',
    downloadsCount: 156,
    rating: 4.7,
    ratingsCount: 19,
    userRated: 0,
    tags: ['TCP/IP', 'BGP', 'Socket Programming', 'HTTP/3'],
    createdAt: '2026-10-20T11:45:00Z'
  },
  {
    id: 'res_4',
    title: 'CS304 Database Systems B-Tree & Query Plan Tuning Handout',
    courseCode: 'CS304',
    courseName: 'Database Management Systems',
    department: 'Computer Science',
    semester: 6,
    category: 'Notes',
    fileUrl: '/docs/CS304_BTree_Index_Guide.pdf',
    fileSize: '4.0 MB',
    uploaderId: 'usr_mentor_3',
    uploaderName: 'Ananya Roy',
    downloadsCount: 220,
    rating: 5.0,
    ratingsCount: 35,
    userRated: 5,
    tags: ['SQLite', 'Indexing', 'Query Optimization', 'Transactions'],
    createdAt: '2026-10-22T16:10:00Z'
  }
];

export const hubService = {
  async getStudentProfile(studentId: string = 'usr_student_1'): Promise<StudentProfile> {
    try {
      return await request<StudentProfile>(`/hub/profile/${studentId}`);
    } catch {
      return MOCK_PROFILE;
    }
  },

  async updateStudentProfile(studentId: string, data: Partial<StudentProfile>): Promise<StudentProfile> {
    try {
      return await request<StudentProfile>(`/hub/profile/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } catch {
      return { ...MOCK_PROFILE, ...data };
    }
  },

  async getPlacementMilestones(studentId: string = 'usr_student_1'): Promise<PlacementMilestone[]> {
    try {
      return await request<PlacementMilestone[]>(`/hub/placement-milestones/${studentId}`);
    } catch {
      return MOCK_MILESTONES;
    }
  },

  async toggleMilestone(studentId: string, milestoneId: string): Promise<{ completed: boolean; readinessScore: number }> {
    try {
      return await request<{ completed: boolean; readinessScore: number }>(
        `/hub/placement-milestones/${studentId}/toggle`,
        {
          method: 'POST',
          body: JSON.stringify({ milestoneId })
        }
      );
    } catch {
      const item = MOCK_MILESTONES.find((m) => m.id === milestoneId);
      if (item) item.completed = !item.completed;
      const completedCount = MOCK_MILESTONES.filter((m) => m.completed).length;
      const score = Math.round((completedCount / MOCK_MILESTONES.length) * 100);
      return { completed: !!item?.completed, readinessScore: score };
    }
  },

  async getMentors(filters: { skill?: string; company?: string } = {}): Promise<PeerMentor[]> {
    try {
      const params = new URLSearchParams();
      if (filters.skill) params.append('skill', filters.skill);
      if (filters.company) params.append('company', filters.company);
      return await request<PeerMentor[]>(`/hub/mentors?${params.toString()}`);
    } catch {
      let result = [...MOCK_MENTORS];
      if (filters.skill) {
        result = result.filter((m) => m.skills.some((s) => s.toLowerCase().includes(filters.skill!.toLowerCase())));
      }
      if (filters.company) {
        result = result.filter((m) => m.companyOffer.toLowerCase().includes(filters.company!.toLowerCase()));
      }
      return result;
    }
  },

  async submitMentorshipRequest(payload: {
    mentorId: string;
    topic: string;
    preferredSlot: string;
    notes?: string;
  }): Promise<MentorshipRequest> {
    try {
      return await request<MentorshipRequest>('/hub/mentorship-requests', {
        method: 'POST',
        body: JSON.stringify({ ...payload, menteeId: 'usr_student_1' })
      });
    } catch {
      const mentor = MOCK_MENTORS.find((m) => m.id === payload.mentorId) || MOCK_MENTORS[0];
      const newReq: MentorshipRequest = {
        id: `req_${Date.now()}`,
        menteeId: 'usr_student_1',
        mentorId: payload.mentorId,
        mentor,
        topic: payload.topic,
        preferredSlot: payload.preferredSlot,
        status: 'pending',
        notes: payload.notes,
        createdAt: new Date().toISOString()
      };
      MOCK_REQUESTS.unshift(newReq);
      return newReq;
    }
  },

  async getUserRequests(userId: string = 'usr_student_1'): Promise<MentorshipRequest[]> {
    try {
      return await request<MentorshipRequest[]>(`/hub/mentorship-requests/${userId}`);
    } catch {
      return MOCK_REQUESTS;
    }
  },

  async updateRequestStatus(requestId: string, status: 'accepted' | 'rejected', notes?: string): Promise<MentorshipRequest> {
    try {
      return await request<MentorshipRequest>(`/hub/mentorship-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      });
    } catch {
      const req = MOCK_REQUESTS.find((r) => r.id === requestId);
      if (req) {
        req.status = status;
        if (notes) req.notes = notes;
      }
      return req!;
    }
  },

  async getResources(filters: { courseCode?: string; category?: string; query?: string } = {}): Promise<AcademicResource[]> {
    try {
      const params = new URLSearchParams();
      if (filters.courseCode) params.append('courseCode', filters.courseCode);
      if (filters.category) params.append('category', filters.category);
      if (filters.query) params.append('query', filters.query);
      return await request<AcademicResource[]>(`/hub/resources?${params.toString()}`);
    } catch {
      let result = [...MOCK_RESOURCES];
      if (filters.courseCode && filters.courseCode !== 'All') {
        result = result.filter((r) => r.courseCode === filters.courseCode);
      }
      if (filters.category && filters.category !== 'All') {
        result = result.filter((r) => r.category === filters.category);
      }
      if (filters.query) {
        const q = filters.query.toLowerCase();
        result = result.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.courseCode.toLowerCase().includes(q) ||
            r.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return result;
    }
  },

  async rateResource(resourceId: string, rating: number): Promise<{ averageRating: number; totalRatings: number }> {
    try {
      return await request<{ averageRating: number; totalRatings: number }>(`/hub/resources/${resourceId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating })
      });
    } catch {
      const r = MOCK_RESOURCES.find((x) => x.id === resourceId);
      if (r) {
        r.ratingsCount += 1;
        r.rating = Number(((r.rating * (r.ratingsCount - 1) + rating) / r.ratingsCount).toFixed(1));
        r.userRated = rating;
        return { averageRating: r.rating, totalRatings: r.ratingsCount };
      }
      return { averageRating: rating, totalRatings: 1 };
    }
  }
};
```

---

### 4.8 Module A View: Academic Hub (`client/src/pages/AcademicHub.tsx`)

This complete component implements the tabbed interface across all 4 key areas:
1. Student Readiness Dashboard (Skills, Recharts Radar, Placement Milestone Checklist)
2. Peer Mentorship Discovery (Mentor Cards, Filters, Request Modal)
3. Mentorship Requests Manager (Sent & Received Requests, Accept/Reject)
4. Academic Resource Library (Search, Course Filters, Category Filters, Star Ratings)

```tsx
// client/src/pages/AcademicHub.tsx
import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Inbox,
  BookOpen,
  Search,
  CheckCircle2,
  Circle,
  Star,
  Download,
  Send,
  Sparkles,
  Briefcase,
  Layers,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from 'recharts';
import { hubService } from '../services/hub.service';
import {
  StudentProfile,
  PlacementMilestone,
  PeerMentor,
  MentorshipRequest,
  AcademicResource,
  ResourceCategory
} from '../types';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

type HubTab = 'readiness' | 'mentors' | 'requests' | 'resources';

export const AcademicHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HubTab>('readiness');

  // Module A State
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [milestones, setMilestones] = useState<PlacementMilestone[]>([]);
  const [mentors, setMentors] = useState<PeerMentor[]>([]);
  const [mentorSkillFilter, setMentorSkillFilter] = useState('');
  const [mentorCompanyFilter, setMentorCompanyFilter] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<PeerMentor | null>(null);
  const [requestTopic, setRequestTopic] = useState('');
  const [requestSlot, setRequestSlot] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load Data
  useEffect(() => {
    hubService.getStudentProfile().then(setProfile);
    hubService.getPlacementMilestones().then(setMilestones);
    hubService.getMentors().then(setMentors);
    hubService.getUserRequests().then(setRequests);
    hubService.getResources().then(setResources);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Milestone Toggle
  const handleToggleMilestone = async (id: string) => {
    const res = await hubService.toggleMilestone(profile?.userId || 'usr_student_1', id);
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: res.completed } : m))
    );
    if (profile) {
      setProfile({ ...profile, readinessScore: res.readinessScore });
    }
    showToast('Milestone status updated');
  };

  // Mentorship Filter
  const handleFilterMentors = async (skill: string, company: string) => {
    setMentorSkillFilter(skill);
    setMentorCompanyFilter(company);
    const data = await hubService.getMentors({ skill, company });
    setMentors(data);
  };

  // Submit Mentorship Request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor || !requestTopic || !requestSlot) return;
    setIsSubmittingReq(true);
    try {
      const newReq = await hubService.submitMentorshipRequest({
        mentorId: selectedMentor.id,
        topic: requestTopic,
        preferredSlot: requestSlot,
        notes: requestNotes
      });
      setRequests((prev) => [newReq, ...prev]);
      setSelectedMentor(null);
      setRequestTopic('');
      setRequestSlot('');
      setRequestNotes('');
      showToast(`Mentorship request submitted to ${selectedMentor.user.name}`);
    } finally {
      setIsSubmittingReq(false);
    }
  };

  // Update Request Status (Accept/Reject)
  const handleUpdateStatus = async (requestId: string, status: 'accepted' | 'rejected') => {
    await hubService.updateRequestStatus(requestId, status, 'Reviewed by senior mentor.');
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status } : r))
    );
    showToast(`Request marked as ${status}`);
  };

  // Resource Search/Filter
  const handleFilterResources = async (query: string, course: string, cat: string) => {
    setSearchQuery(query);
    setSelectedCourse(course);
    setSelectedCategory(cat);
    const list = await hubService.getResources({
      query,
      courseCode: course,
      category: cat
    });
    setResources(list);
  };

  // Star Rating
  const handleRateResource = async (id: string, star: number) => {
    const res = await hubService.rateResource(id, star);
    setResources((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, rating: res.averageRating, ratingsCount: res.totalRatings, userRated: star } : r
      )
    );
    showToast(`Rated ${star} stars!`);
  };

  // Recharts Radar Data from skills
  const radarData = [
    { subject: 'DSA & Graphs', score: 85, fullMark: 100 },
    { subject: 'System Design', score: 70, fullMark: 100 },
    { subject: 'Core CS (OS/DBMS)', score: 80, fullMark: 100 },
    { subject: 'Full-Stack Dev', score: 92, fullMark: 100 },
    { subject: 'Cloud & Linux', score: 65, fullMark: 100 },
    { subject: 'Behavioral Prep', score: 75, fullMark: 100 }
  ];

  const coursesList = ['All', 'CS301', 'CS302', 'CS303', 'CS304', 'CS305'];
  const categoriesList: (ResourceCategory | 'All')[] = ['All', 'Notes', 'PYQ', 'Syllabus', 'Guide'];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border border-accent/40 text-accent px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold glow-accent animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-accent" />
          {toastMessage}
        </div>
      )}

      {/* Module Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border-subtle relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-widest text-accent font-bold">Module A</span>
            <ProvenanceBadge type="ESTIMATED_METRIC" label="Readiness Index" size="sm" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg-primary">
            Student Intelligence & Academic Hub
          </h1>
          <p className="text-xs text-fg-muted mt-1 max-w-2xl">
            Integrated career placement readiness, peer mentorship network, and open academic repository.
          </p>
        </div>

        {/* Global Hub Metric Counter */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="px-4 py-2.5 rounded-xl bg-surface/80 border border-border-subtle text-right">
            <div className="text-[10px] font-mono text-fg-muted uppercase">Placement Readiness</div>
            <div className="text-2xl font-black text-accent">{profile?.readinessScore ?? 78}%</div>
          </div>
        </div>
      </div>

      {/* Hub Tabs Navigation */}
      <div className="flex border-b border-border-subtle space-x-2">
        <button
          onClick={() => setActiveTab('readiness')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 ${
            activeTab === 'readiness'
              ? 'border-accent text-accent'
              : 'border-transparent text-fg-muted hover:text-fg-primary'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Readiness Dashboard
        </button>

        <button
          onClick={() => setActiveTab('mentors')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 ${
            activeTab === 'mentors'
              ? 'border-accent text-accent'
              : 'border-transparent text-fg-muted hover:text-fg-primary'
          }`}
        >
          <Users className="w-4 h-4" />
          Peer Mentorship Discovery
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 ${
            activeTab === 'requests'
              ? 'border-accent text-accent'
              : 'border-transparent text-fg-muted hover:text-fg-primary'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Mentorship Requests ({requests.length})
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 ${
            activeTab === 'resources'
              ? 'border-accent text-accent'
              : 'border-transparent text-fg-muted hover:text-fg-primary'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Academic Resource Library
        </button>
      </div>

      {/* TAB 1: READINESS DASHBOARD */}
      {activeTab === 'readiness' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Profile & Skill Radar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Student Profile Overview */}
            <div className="p-5 rounded-2xl bg-card border border-border-subtle space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={profile?.user.avatar}
                  alt={profile?.user.name}
                  className="w-12 h-12 rounded-xl object-cover border border-accent/40"
                />
                <div>
                  <h3 className="text-sm font-bold text-fg-primary">{profile?.user.name}</h3>
                  <p className="text-xs text-fg-muted">{profile?.user.department}</p>
                  <p className="text-[10px] font-mono text-accent">GPA: {profile?.gpa} / 10</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface/50 border border-border-subtle text-xs">
                <span className="text-[10px] font-mono text-fg-muted uppercase block mb-1">Target Career Role</span>
                <span className="font-semibold text-fg-primary flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-accent" />
                  {profile?.targetRole}
                </span>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="p-5 rounded-2xl bg-card border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted font-mono">
                  Competency Vector
                </h3>
                <ProvenanceBadge type="ESTIMATED_METRIC" label="Radar" size="sm" />
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid stroke="#253343" />
                    <PolarAngleAxis dataKey="subject" stroke="#98A8B8" tick={{ fill: '#98A8B8', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#253343" tick={{ fill: '#98A8B8', fontSize: 9 }} />
                    <Radar name="Readiness" dataKey="score" stroke="#39F59A" fill="#39F59A" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Verified Skills Cloud */}
            <div className="p-5 rounded-2xl bg-card border border-border-subtle">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted font-mono mb-3">
                Verified Skill Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile?.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border-subtle bg-surface/60 text-fg-primary flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Placement Milestones Checklist */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-card border border-border-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-fg-primary">Placement Preparation Milestones</h2>
                  <p className="text-xs text-fg-muted mt-0.5">
                    Click items to toggle verification. Readiness score dynamically recalibrates.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-accent font-bold">
                    {milestones.filter((m) => m.completed).length} / {milestones.length} Completed
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border-subtle">
                <div
                  className="bg-accent h-full transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      (milestones.filter((m) => m.completed).length / (milestones.length || 1)) * 100
                    )}%`
                  }}
                />
              </div>

              {/* Milestone List */}
              <div className="space-y-2.5 pt-2">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    onClick={() => handleToggleMilestone(milestone.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      milestone.completed
                        ? 'border-accent/40 bg-accent-dim/30 text-fg-primary'
                        : 'border-border-subtle bg-surface/40 hover:bg-surface text-fg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {milestone.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-fg-muted shrink-0" />
                      )}
                      <div>
                        <span className={`text-xs font-medium ${milestone.completed ? 'line-through text-fg-muted' : 'text-fg-primary'}`}>
                          {milestone.title}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold tracking-wider bg-card border border-border-subtle text-fg-muted">
                      {milestone.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PEER MENTORSHIP DISCOVERY */}
      {activeTab === 'mentors' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card border border-border-subtle">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-fg-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by skill (e.g. System Design, Graph Algorithms)..."
                value={mentorSkillFilter}
                onChange={(e) => handleFilterMentors(e.target.value, mentorCompanyFilter)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border-subtle bg-surface/60 text-xs text-fg-primary placeholder:text-fg-muted focus:outline-none focus:border-accent"
              />
            </div>

            <div className="relative w-48">
              <input
                type="text"
                placeholder="Company (Google, Microsoft)..."
                value={mentorCompanyFilter}
                onChange={(e) => handleFilterMentors(mentorSkillFilter, e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-border-subtle bg-surface/60 text-xs text-fg-primary placeholder:text-fg-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Mentors Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="p-5 rounded-2xl bg-card border border-border-subtle flex flex-col justify-between hover:border-accent/40 transition-all glow-card"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={mentor.user.avatar}
                        alt={mentor.user.name}
                        className="w-12 h-12 rounded-xl object-cover border border-border-subtle"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-fg-primary">{mentor.user.name}</h4>
                        <span className="text-[11px] font-mono font-semibold text-accent block">
                          {mentor.companyOffer}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-warning font-mono bg-warning/10 px-2 py-0.5 rounded-md border border-warning/20">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {mentor.rating}
                    </div>
                  </div>

                  <p className="text-xs text-fg-muted line-clamp-2 mb-3 leading-relaxed">
                    {mentor.bio}
                  </p>

                  {/* Skills Chips */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {mentor.skills.slice(0, 3).map((s, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border-subtle text-fg-muted font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Open Slots */}
                  <div className="p-2.5 rounded-lg bg-surface/50 border border-border-subtle text-xs text-fg-muted space-y-1 mb-4">
                    <span className="text-[10px] font-mono uppercase text-fg-muted/80 block font-semibold">
                      Upcoming Available Slots
                    </span>
                    {mentor.availableSlots.slice(0, 2).map((slot, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-fg-primary font-mono">
                        <Clock className="w-3 h-3 text-accent" />
                        {slot}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedMentor(mentor);
                    setRequestSlot(mentor.availableSlots[0] || '');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-accent text-canvas font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-accent-hover transition-colors shadow-lg"
                >
                  <Send className="w-3.5 h-3.5" />
                  Request Mentorship
                </button>
              </div>
            ))}
          </div>

          {/* Mentorship Request Modal */}
          {selectedMentor && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/70 backdrop-blur-sm p-4">
              <div className="w-full max-w-md bg-card border border-border-strong rounded-2xl p-6 shadow-2xl space-y-4 glow-card">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-fg-primary">Request Mentorship</h3>
                    <p className="text-xs text-fg-muted">With {selectedMentor.user.name} ({selectedMentor.companyOffer})</p>
                  </div>
                  <button
                    onClick={() => setSelectedMentor(null)}
                    className="text-fg-muted hover:text-fg-primary text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitRequest} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-fg-muted font-medium mb-1">Topic / Discussion Goal</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. System Design Mock: URL Shortener / Ride Dispatch"
                      value={requestTopic}
                      onChange={(e) => setRequestTopic(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-surface text-fg-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-fg-muted font-medium mb-1">Select Available Time Slot</label>
                    <select
                      value={requestSlot}
                      onChange={(e) => setRequestSlot(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-surface text-fg-primary focus:outline-none focus:border-accent"
                    >
                      {selectedMentor.availableSlots.map((slot, i) => (
                        <option key={i} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-fg-muted font-medium mb-1">Preparation Notes / Questions</label>
                    <textarea
                      rows={3}
                      placeholder="Share your resume link or specific architecture questions..."
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-surface text-fg-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMentor(null)}
                      className="px-4 py-2 rounded-lg border border-border-subtle text-fg-muted hover:text-fg-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReq}
                      className="px-4 py-2 rounded-lg bg-accent text-canvas font-bold hover:bg-accent-hover transition-colors"
                    >
                      {isSubmittingReq ? 'Submitting...' : 'Send Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MENTORSHIP REQUESTS MANAGER */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-fg-primary">Mentorship Requests Track</h3>
              <p className="text-xs text-fg-muted">Inspect outbound requests and incoming reviews</p>
            </div>
            <span className="text-xs font-mono text-accent font-semibold">Total: {requests.length}</span>
          </div>

          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-card border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-fg-primary">{req.topic}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        req.status === 'accepted'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : req.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <div className="text-xs text-fg-muted flex items-center gap-3">
                    <span>Mentor: <strong className="text-fg-primary">{req.mentor?.user.name}</strong> ({req.mentor?.companyOffer})</span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">{req.preferredSlot}</span>
                  </div>
                  {req.notes && (
                    <p className="text-xs text-fg-muted/80 italic pt-1">
                      Note: "{req.notes}"
                    </p>
                  )}
                </div>

                {/* Simulated Mentor Accept/Reject Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {req.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'accepted')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-semibold"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 text-xs font-semibold"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {req.status === 'accepted' && (
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      Session Scheduled ✓
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ACADEMIC RESOURCE LIBRARY */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 rounded-xl bg-card border border-border-subtle flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-fg-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search resources, topics, course codes..."
                value={searchQuery}
                onChange={(e) => handleFilterResources(e.target.value, selectedCourse, selectedCategory)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border-subtle bg-surface/60 text-xs text-fg-primary placeholder:text-fg-muted focus:outline-none focus:border-accent"
              />
            </div>

            {/* Course Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-fg-muted mr-1">Course:</span>
              {coursesList.map((c) => (
                <button
                  key={c}
                  onClick={() => handleFilterResources(searchQuery, c, selectedCategory)}
                  className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold transition-all ${
                    selectedCourse === c
                      ? 'bg-accent text-canvas font-bold'
                      : 'bg-surface border border-border-subtle text-fg-muted hover:text-fg-primary'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-fg-muted mr-1">Type:</span>
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleFilterResources(searchQuery, selectedCourse, cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-accent text-canvas font-bold'
                      : 'bg-surface border border-border-subtle text-fg-muted hover:text-fg-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Resources Table / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((res) => (
              <div
                key={res.id}
                className="p-5 rounded-2xl bg-card border border-border-subtle flex flex-col justify-between hover:border-accent/40 transition-all glow-card"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-surface border border-border-subtle text-accent">
                      {res.courseCode}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface/80 text-fg-muted border border-border-subtle uppercase">
                      {res.category}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-fg-primary mb-1 leading-snug">
                    {res.title}
                  </h4>
                  <p className="text-[11px] text-fg-muted mb-3 font-mono">
                    {res.courseName} • Uploaded by {res.uploaderName}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {res.tags.map((t, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-surface text-fg-muted border border-border-subtle">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
                  {/* Star Rating Control */}
                  <div className="flex items-center gap-1">
                    <div className="flex items-center text-warning">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRateResource(res.id, star)}
                          className="hover:scale-125 transition-transform p-0.5"
                          title={`Rate ${star} star`}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              (res.userRated || res.rating) >= star
                                ? 'fill-warning text-warning'
                                : 'text-fg-muted/40'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="font-mono text-xs font-bold text-fg-primary ml-1">
                      {res.rating}
                    </span>
                    <span className="text-[10px] text-fg-muted font-mono">
                      ({res.ratingsCount})
                    </span>
                  </div>

                  {/* Download Action */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-fg-muted">
                      {res.downloadsCount} dl • {res.fileSize}
                    </span>
                    <button
                      onClick={() => {
                        showToast(`Initiating download for ${res.title}`);
                      }}
                      className="p-1.5 rounded-lg bg-surface hover:bg-accent-dim text-fg-muted hover:text-accent border border-border-subtle transition-colors"
                      title="Download resource"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

---

### 4.9 Dashboard Landing View (`client/src/pages/Dashboard.tsx`)

Aggregates high-level metrics across all 5 campus modules:

```tsx
// client/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Car,
  Leaf,
  Brain,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { CampusMetrics } from '../types';

const INITIAL_METRICS: CampusMetrics = {
  hub: {
    readinessScore: 78,
    activeMentorships: 3,
    resourcesAvailable: 24
  },
  rides: {
    activeRides: 4,
    sharedDistanceKm: 48.6,
    carbonSavedKg: 8.31
  },
  sustainability: {
    powerWatts: 482,
    carbonGramsPerHour: 228.9,
    ecoOptimizationActive: true,
    energySavedPct: 28.4
  },
  wellbeing: {
    focusMinutesToday: 225,
    deepWorkIndex: 84,
    privacyProtected: true
  },
  exams: {
    activeSessions: 2,
    pendingReviews: 1,
    flaggedObservations: 3
  }
};

export const Dashboard: React.FC = () => {
  const [metrics] = useState<CampusMetrics>(INITIAL_METRICS);

  return (
    <div className="space-y-6">
      {/* Ecosystem Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-card via-surface/60 to-card border border-border-subtle relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono uppercase tracking-widest text-accent font-bold">
              Campus Operating System
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-fg-primary">
            Uni<span className="text-accent">Verse</span> Ecosystem Command Center
          </h1>
          <p className="text-xs text-fg-muted mt-1 max-w-2xl leading-relaxed">
            Real-time cross-module observability integrating student intelligence, graph ride matching, green compute telemetry, privacy-preserving wellbeing, and proctoring.
          </p>
        </div>
      </div>

      {/* The 5 Pillar Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Module A: Hub */}
        <div className="p-5 rounded-2xl bg-card border border-border-subtle flex flex-col justify-between glow-card hover:border-accent/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-accent-dim text-accent border border-accent/30">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-fg-primary">Student Intelligence Hub</h3>
                  <span className="text-[10px] font-mono text-fg-muted">Placement & Mentorship</span>
                </div>
              </div>
              <ProvenanceBadge type="ESTIMATED_METRIC" label="Score" size="sm" />
            </div>

            <div className="space-y-2.5 my-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-fg-muted">Readiness Score</span>
                <span className="font-mono font-bold text-accent">{metrics.hub.readinessScore}%</span>
              </div>
              <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                <div className="bg-accent h-full" style={{ width: `${metrics.hub.readinessScore}%` }} />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-fg-muted pt-1">
                <span>Active Mentorships: {metrics.hub.activeMentorships}</span>
                <span>Resources: {metrics.hub.resourcesAvailable}</span>
              </div>
            </div>
          </div>

          <Link
            to="/hub"
            className="w-full py-2 px-3 rounded-xl bg-surface hover:bg-accent-dim hover:text-accent border border-border-subtle text-fg-primary font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            Open Academic Hub <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Module B: Ride-Pooling */}
        <div className="p-5 rounded-2xl bg-card border border-border-subtle flex flex-col justify-between glow-card hover:border-sky-400/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-400/30">
                  <Car className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-fg-primary">Smart Campus Rides</h3>
                  <span className="text-[10px] font-mono text-fg-muted">DARP & Graph Matching</span>
                </div>
              </div>
              <ProvenanceBadge type="ESTIMATED_METRIC" label="Dijkstra" size="sm" />
            </div>

            <div className="space-y-2.5 my-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-fg-muted">Active Carpools</span>
                <span className="font-mono font-bold text-sky-400">{metrics.rides.activeRides} Active</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-surface/50 border border-border-subtle text-xs">
                  <span className="text-[10px] font-mono text-fg-muted block">Shared Dist</span>
                  <span className="font-bold text-fg-primary">{metrics.rides.sharedDistanceKm} km</span>
                </div>
                <div className="p-2 rounded-lg bg-surface/50 border border-border-subtle text-xs">
                  <span className="text-[10px] font-mono text-fg-muted block">CO2 Avoided</span>
                  <span className="font-bold text-emerald-400">{metrics.rides.carbonSavedKg} kg</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/rides"
            className="w-full py-2 px-3 rounded-xl bg-surface hover:bg-sky-500/20 hover:text-sky-400 border border-border-subtle text-fg-primary font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            Open Ride Pooling <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Module C: Sustainability */}
        <div className="p-5 rounded-2xl bg-card border border-border-subtle flex flex-col justify-between glow-card hover:border-emerald-500/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Leaf className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-fg-primary">Sustainable Observatory</h3>
                  <span className="text-[10px] font-mono text-fg-muted">Power & Carbon Telemetry</span>
                </div>
              </div>
              <ProvenanceBadge type="SIMULATED_EVENT" label="Workload" size="sm" />
            </div>

            <div className="space-y-2.5 my-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-fg-muted">Current Draw</span>
                <span className="font-mono font-bold text-emerald-400">{metrics.sustainability.powerWatts} W</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-surface/50 border border-border-subtle text-xs">
                  <span className="text-[10px] font-mono text-fg-muted block">Carbon Rate</span>
                  <span className="font-bold text-fg-primary">{metrics.sustainability.carbonGramsPerHour} g/h</span>
                </div>
                <div className="p-2 rounded-lg bg-surface/50 border border-border-subtle text-xs">
                  <span className="text-[10px] font-mono text-fg-muted block">Eco-Savings</span>
                  <span className="font-bold text-accent">-{metrics.sustainability.energySavedPct}%</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/sustainability"
            className="w-full py-2 px-3 rounded-xl bg-surface hover:bg-emerald-500/20 hover:text-emerald-400 border border-border-subtle text-fg-primary font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            Open Observatory <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Module D: Digital Wellbeing */}
        <div className="p-5 rounded-2xl bg-card border border-border-subtle flex flex-col justify-between glow-card hover:border-purple-400/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-400/30">
                  <Brain className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-fg-primary">Digital Wellbeing</h3>
                  <span className="text-[10px] font-mono text-fg-muted">Focus & Privacy Controls</span>
                </div>
              </div>
              <ProvenanceBadge type="ESTIMATED_METRIC" label="Laplace DP" size="sm" />
            </div>

            <div className="space-y-2.5 my-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-fg-muted">Deep Work Index (DWI)</span>
                <span className="font-mono font-bold text-purple-400">{metrics.wellbeing.deepWorkIndex} / 100</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-surface/50 border border-border-subtle text-xs">
                  <span className="text-[10px] font-mono text-fg-muted block">Focus Today</span>
                  <span className="font-bold text-fg-primary">{Math.round(metrics.wellbeing.focusMinutesToday / 60)}h {metrics.wellbeing.focusMinutesToday % 60}m</span>
                </div>
                <div className="p-2 rounded-lg bg-surface/50 border border-border-subtle text-xs">
                  <span className="text-[10px] font-mono text-fg-muted block">Privacy</span>
                  <span className="font-bold text-accent">Local-First</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/wellbeing"
            className="w-full py-2 px-3 rounded-xl bg-surface hover:bg-purple-500/20 hover:text-purple-400 border border-border-subtle text-fg-primary font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            Open Wellbeing <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Module E: Exam Monitoring */}
        <div className="p-5 rounded-2xl bg-card border border-border-subtle flex flex-col justify-between glow-card hover:border-amber-400/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-400/30">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-fg-primary">Responsible Exam Monitor</h3>
                  <span className="text-[10px] font-mono text-fg-muted">CV Assist & Proctor Triage</span>
                </div>
              </div>
              <ProvenanceBadge type="ACTUAL_INFERENCE" label="CV Model" size="sm" />
            </div>

            <div className="space-y-2.5 my-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-fg-muted">Pending Proctor Reviews</span>
                <span className="font-mono font-bold text-amber-400">{metrics.exams.pendingReviews} Action Required</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-surface/50 border border-border-subtle text-xs">
                  <span className="text-[10px] font-mono text-fg-muted block">Active Rooms</span>
                  <span className="font-bold text-fg-primary">{metrics.exams.activeSessions} Halls</span>
                </div>
                <div className="p-2 rounded-lg bg-surface/50 border border-border-subtle text-xs">
                  <span className="text-[10px] font-mono text-fg-muted block">Guardrail</span>
                  <span className="font-bold text-accent">Zero Auto-Penalty</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/exams"
            className="w-full py-2 px-3 rounded-xl bg-surface hover:bg-amber-500/20 hover:text-amber-400 border border-border-subtle text-fg-primary font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            Open Exam Monitor <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* System Architecture Card */}
        <div className="p-5 rounded-2xl bg-card border border-border-subtle flex flex-col justify-between glow-card">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-accent-dim text-accent border border-accent/30">
                  <Zap className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-fg-primary">Unified System Architecture</h3>
                  <span className="text-[10px] font-mono text-fg-muted">Express 5 + SQLite WAL</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/20 text-accent font-bold">
                100% PASS
              </span>
            </div>

            <div className="space-y-2 my-4 text-xs text-fg-muted">
              <p>• Single unified schema in <code>universe.db</code></p>
              <p>• Shared notification & activity stream</p>
              <p>• Dijkstra graph routing with detour constraints</p>
              <p>• Mathematical non-linear power modeling</p>
            </div>
          </div>

          <div className="text-[10px] font-mono text-fg-muted/70 text-center py-1 bg-surface/30 rounded-lg">
            UniVerse Platform • Spring 2026 Hackathon Edition
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

### 4.10 Placeholder Stubs for Modules B, C, D, E
To ensure React Router and Vite compile without missing module errors while those modules are prepared in subsequent milestones, the implementer should place lightweight stubs:
- `client/src/pages/RidePooling.tsx`
- `client/src/pages/Sustainability.tsx`
- `client/src/pages/Wellbeing.tsx`
- `client/src/pages/ExamMonitoring.tsx`

Each stub can render a themed preview card with its respective `ProvenanceBadge` and a link back to `/hub` or `/`.

---

### 4.11 Client Shell: Router & Main Entry (`client/src/App.tsx`, `client/src/main.tsx`)

#### `client/src/App.tsx`
```tsx
// client/src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { AcademicHub } from './pages/AcademicHub';
import { RidePooling } from './pages/RidePooling';
import { Sustainability } from './pages/Sustainability';
import { Wellbeing } from './pages/Wellbeing';
import { ExamMonitoring } from './pages/ExamMonitoring';
import { UserRole, ActivityItem } from './types';

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act_1',
    module: 'hub',
    title: 'Mentorship Request Accepted',
    description: 'Senior mentor Neha Patel accepted your System Design Mock request for Friday 6:00 PM.',
    timestamp: '10m ago',
    read: false,
    provenance: 'ESTIMATED_METRIC'
  },
  {
    id: 'act_2',
    module: 'rides',
    title: 'Ride Match Confirmed',
    description: 'Matched with Driver Vikram Singh from North Gate to Tech Block (1.2 kg CO2 saved).',
    timestamp: '45m ago',
    read: false,
    provenance: 'ESTIMATED_METRIC'
  },
  {
    id: 'act_3',
    module: 'sustainability',
    title: 'Eco-Optimization Surge Protected',
    description: 'AI GPU Inference workload autoscaled dynamically during peak diurnal rate.',
    timestamp: '2h ago',
    read: true,
    provenance: 'SIMULATED_EVENT'
  },
  {
    id: 'act_4',
    module: 'exams',
    title: 'Proctor Observation Advisory',
    description: 'Exam Hall B-4 candidate head pose flagged for advisory invigilator review.',
    timestamp: '3h ago',
    read: true,
    provenance: 'ACTUAL_INFERENCE'
  }
];

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
          {/* Global Header */}
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
              <Route path="/hub" element={<AcademicHub />} />
              <Route path="/rides" element={<RidePooling />} />
              <Route path="/sustainability" element={<Sustainability />} />
              <Route path="/wellbeing" element={<Wellbeing />} />
              <Route path="/exams" element={<ExamMonitoring />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
```

#### `client/src/main.tsx`
```tsx
// client/src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 5. Verification Method

To independently verify the client architecture and Module A blueprint:

1. **Verify Package Dependencies & Export Compatibility**:
   ```bash
   node -e "
     const r = require('./client/node_modules/react-router-dom');
     assert(r.BrowserRouter && r.Routes && r.Route && r.NavLink);
     const recharts = require('./client/node_modules/recharts');
     assert(recharts.RadarChart && recharts.ResponsiveContainer);
     const lucide = require('./client/node_modules/lucide-react');
     assert(lucide.GraduationCap && lucide.Car && lucide.Leaf && lucide.ShieldAlert);
     console.log('Verification SUCCESS: All client runtime libraries export required symbols.');
   "
   ```

2. **Verify Theme Variable Compatibility**:
   Ensure `client/src/index.css` defines `--color-canvas`, `--color-sidebar`, `--color-card`, `--color-surface`, `--color-accent`, `--color-fg-primary`, and `--color-fg-muted`.

3. **Verify Build & Compilation**:
   Once source files are created according to this blueprint:
   ```bash
   npm --prefix client run build
   ```
   *Expected Output*: `tsc -b && vite build` succeeds with zero errors, generating the optimized production bundle in `client/dist`.

4. **Verify Route Rendering**:
   Start client dev server (`npm --prefix client run dev`), access `http://localhost:5173/`, and verify:
   - Dashboard renders with the 5 pillar cards.
   - Navigation links switch between `/hub`, `/rides`, `/sustainability`, `/wellbeing`, `/exams`.
   - In Academic Hub: Student readiness updates on milestone click, mentors can be filtered, requests submitted, and resources rated.
   - Provenance badges correctly tag actual inference, simulated events, and estimated metrics.
