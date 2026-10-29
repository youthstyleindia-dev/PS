import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3 py-1.5 transition-colors font-body-sm font-medium ${
      isActive
        ? 'bg-primary text-on-primary font-semibold shadow-sm'
        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
    }`;

  return (
    <aside className="w-72 bg-surface-container-low border-r border-outline-variant flex flex-col justify-between shrink-0 h-screen select-none overflow-y-auto">
      <div className="flex flex-col">
        {/* Node Status Header */}
        <div className="p-4 bg-surface-container-lowest border-b border-outline-variant">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-md text-label-md text-primary tracking-wider uppercase font-bold">
              UniVerse // NODE 0X4F92
            </span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-bold">
              ONLINE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest font-mono">
              PEER_MESH ACTIVE
            </span>
          </div>
        </div>

        {/* Current Authenticated User Card */}
        <div className="p-3 mx-2 mt-2 bg-surface-container border border-outline-variant flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-primary text-[18px]">terminal</span>
            )}
          </div>
          <div className="overflow-hidden min-w-0">
            <div className="font-body-sm text-body-sm font-semibold text-on-surface truncate">
              {user?.name || 'Scholar Node'}
            </div>
            <div className="font-label-sm text-label-sm text-on-surface-variant truncate uppercase font-mono">
              {user?.role ? `${user.role.toUpperCase()} • ${user.department || 'CAMPUS'}` : 'COLLEGIATE GUEST'}
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="px-2 pt-4 space-y-4">
          {/* Group 1: OVERVIEW */}
          <div className="space-y-1">
            <div className="px-3 font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
              OVERVIEW
            </div>
            <NavLink to="/app" className={navClass}>
              <span className="material-symbols-outlined text-[16px] mr-2">dashboard</span>
              Dashboard Overview
            </NavLink>
          </div>

          {/* Group 2: ACADEMIC HUB */}
          <div className="space-y-1">
            <div className="px-3 font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
              ACADEMIC HUB
            </div>
            <NavLink to="/academic" className={navClass}>
              <span className="material-symbols-outlined text-[16px] mr-2">school</span>
              Skill Inventory &amp; Tree
            </NavLink>
            <NavLink to="/academic" className={navClass}>
              <span className="material-symbols-outlined text-[16px] mr-2">group</span>
              Mentorship Commons
            </NavLink>
          </div>

          {/* Group 3: CAMPUS TRANSIT */}
          <div className="space-y-1">
            <div className="px-3 font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
              CAMPUS TRANSIT
            </div>
            <NavLink to="/rides" className={navClass}>
              <span className="material-symbols-outlined text-[16px] mr-2">directions_car</span>
              Ride Pooling &amp; Matcher
            </NavLink>
          </div>

          {/* Group 4: SUSTAINABILITY */}
          <div className="space-y-1">
            <div className="px-3 font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
              SUSTAINABILITY
            </div>
            <NavLink to="/sustainability" className={navClass}>
              <span className="material-symbols-outlined text-[16px] mr-2">energy_savings_leaf</span>
              Slurm Carbon Sync &amp; Obs.
            </NavLink>
          </div>

          {/* Group 5: SOVEREIGN TOOLS */}
          <div className="space-y-1">
            <div className="px-3 font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
              SOVEREIGN TOOLS
            </div>
            <NavLink to="/wellbeing" className={navClass}>
              <span className="material-symbols-outlined text-[16px] mr-2">timer</span>
              Focus &amp; Wellbeing (DP)
            </NavLink>
            <NavLink to="/exams" className={navClass}>
              <span className="material-symbols-outlined text-[16px] mr-2">gavel</span>
              Exam Review Tribunal
            </NavLink>
            <NavLink to="/architecture" className={navClass}>
              <span className="material-symbols-outlined text-[16px] mr-2">hub</span>
              Algorithm Sandbox &amp; Docs
            </NavLink>
          </div>

          {/* Group 6: CAMPUS PROTOCOL */}
          <div className="space-y-1">
            <div className="px-3 font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
              CAMPUS PROTOCOL
            </div>
            <NavLink to="/how-it-works" className={navClass}>
              <span className="material-symbols-outlined text-[16px] mr-2">route</span>
              Workflow Explainer
            </NavLink>
            <NavLink to="/impact" className={navClass}>
              <span className="material-symbols-outlined text-[16px] mr-2">analytics</span>
              Impact &amp; Responsibility
            </NavLink>
            <NavLink to="/about" className={navClass}>
              <span className="material-symbols-outlined text-[16px] mr-2">menu_book</span>
              Principles &amp; Ethos
            </NavLink>
            <NavLink to="/onboarding" className={navClass}>
              <span className="material-symbols-outlined text-[16px] mr-2">tune</span>
              Node Setup Wizard
            </NavLink>
          </div>

          {/* Group 7: NODE SETTINGS */}
          <div className="space-y-1">
            <div className="px-3 font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
              NODE SETTINGS
            </div>
            <NavLink to="/settings" className={navClass}>
              <span className="material-symbols-outlined text-[16px] mr-2">key</span>
              Enclave Keys &amp; Sessions
            </NavLink>
          </div>
        </nav>
      </div>

      {/* Bottom Session Footer */}
      <div className="p-3 border-t border-outline-variant space-y-2 bg-surface-container-low">
        {/* Quick Sandbox Persona Switcher */}
        <div className="p-2 bg-surface border border-outline-variant flex items-center justify-between text-xs">
          <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono">
            Persona
          </div>
          <div className="flex gap-1 font-mono text-[10px]">
            <button
              onClick={() => switchRole('student')}
              className={`px-1.5 py-0.5 border ${
                user?.role === 'student'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
              }`}
            >
              STU
            </button>
            <button
              onClick={() => switchRole('driver')}
              className={`px-1.5 py-0.5 border ${
                user?.role === 'driver'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
              }`}
            >
              DRV
            </button>
            <button
              onClick={() => switchRole('proctor')}
              className={`px-1.5 py-0.5 border ${
                user?.role === 'proctor'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
              }`}
            >
              PRC
            </button>
            <button
              onClick={() => switchRole('admin')}
              className={`px-1.5 py-0.5 border ${
                user?.role === 'admin'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
              }`}
            >
              ADM
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 border border-outline-variant bg-surface-container text-error hover:bg-red-100 transition-colors font-label-sm text-label-sm uppercase font-semibold flex items-center justify-between"
          type="button"
        >
          <span>End Active Session</span>
          <span className="material-symbols-outlined text-[16px]">logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Navbar;
