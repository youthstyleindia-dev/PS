import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

interface HeaderProps {
  onOpenMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileNav }) => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch live activities for the notifications drawer
    fetch('/api/activity?limit=10')
      .then(res => res.json())
      .then(data => {
        if (data.activities) {
          setActivities(data.activities);
          setUnreadCount(Math.min(data.activities.length, 4));
        }
      })
      .catch(() => {});

    const handleClickOutside = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleDisplayNames: Record<string, { label: string; badge: string; color: string; desc: string }> = {
    student: { label: 'Student Scholar', badge: 'STU', color: 'bg-secondary text-on-secondary', desc: 'Placement Hub, Radar Skill Tree & Pool Bookings' },
    driver: { label: 'Transit Driver', badge: 'DRV', color: 'bg-emerald-600 text-white', desc: 'Topological Corridors, Detour Limits & Avoided CO₂' },
    proctor: { label: 'Exam Proctor', badge: 'PRC', color: 'bg-amber-600 text-white', desc: 'Responsible Human-in-the-Loop Tribunal & Mode 2 CV' },
    ta_faculty: { label: 'Faculty / TA', badge: 'FAC', color: 'bg-blue-600 text-white', desc: 'Mentorship Applications, Advising & Study Resources' },
    warden: { label: 'Campus Warden', badge: 'WAR', color: 'bg-teal-600 text-white', desc: 'Residential Operations, Transit Safety & Campus Alerts' },
    admin: { label: 'System Admin', badge: 'ADM', color: 'bg-purple-600 text-white', desc: 'Sustainable HPC Orchestration & Enclave Health' }
  };

  const handleRoleSelect = async (newRole: UserRole) => {
    setShowRoleDropdown(false);
    try {
      await switchRole(newRole);
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('ride') || q.includes('car') || q.includes('transit')) navigate('/rides');
    else if (q.includes('skill') || q.includes('mentor') || q.includes('hub')) navigate('/academic');
    else if (q.includes('carbon') || q.includes('slurm') || q.includes('energy') || q.includes('pue')) navigate('/sustainability');
    else if (q.includes('focus') || q.includes('wellbeing') || q.includes('privacy') || q.includes('dp')) navigate('/wellbeing');
    else if (q.includes('exam') || q.includes('proctor') || q.includes('tribunal')) navigate('/exams');
    else navigate('/app');
  };

  return (
    <>
      <header className="h-16 w-full bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant px-4 md:px-8 flex items-center justify-between z-30 shrink-0 sticky top-0 shadow-sm">
        {/* Left: Mobile Toggle & Breadcrumb Telemetry */}
        <div className="flex items-center gap-4">
          {onOpenMobileNav && (
            <button
              onClick={onOpenMobileNav}
              className="md:hidden p-1.5 text-on-surface-variant hover:text-primary border border-outline-variant"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
          )}

          <div className="hidden md:flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant uppercase font-mono">
            <span className="text-primary font-bold">UNIVERSE</span>
            <span>/</span>
            <span>CAMPUS MESH</span>
            <span>/</span>
            <span className="text-secondary font-bold">VERIFIED ENCLAVE</span>
          </div>

          <div className="hidden xl:flex items-center gap-3 px-3 py-1 bg-surface-container border border-outline-variant text-[11px] font-mono">
            <span className="text-on-surface-variant">
              LATENCY: <strong className="text-on-surface font-bold">1.2MS</strong>
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span className="text-on-surface-variant">
              STORAGE: <strong className="text-on-surface font-bold">SQLITE WAL</strong>
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span className="text-secondary font-bold">ZERO_EXFILTRATION</span>
          </div>
        </div>

        {/* Right: Search + Role Switcher + Notifications + User Menu */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative hidden sm:flex items-center">
            <div className="flex items-center bg-surface-container-high px-3 py-1.5 border border-outline-variant w-44 lg:w-60 text-on-surface-variant justify-between focus-within:border-secondary transition-all">
              <div className="flex items-center gap-1.5 w-full">
                <span className="material-symbols-outlined text-[16px] text-outline">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Node..."
                  className="bg-transparent border-none outline-none font-body-sm text-body-sm text-on-surface placeholder:text-outline w-full"
                />
              </div>
              <kbd className="font-label-sm text-label-sm px-1 py-0.5 bg-surface-container-lowest border border-outline-variant text-on-surface font-mono shrink-0 text-[10px]">
                ⌘K
              </kbd>
            </div>
          </form>

          {/* Interactive Role Switcher Dropdown */}
          <div className="relative" ref={roleMenuRef}>
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant font-label-sm text-label-sm text-on-surface uppercase font-bold font-mono tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
              title="Click to Switch Collegiate Persona"
            >
              <span className={`w-2 h-2 rounded-full ${user?.role === 'driver' ? 'bg-emerald-500' : user?.role === 'proctor' ? 'bg-amber-500' : user?.role === 'admin' ? 'bg-purple-500' : 'bg-secondary'} animate-pulse`}></span>
              <span>{user?.role ? roleDisplayNames[user.role]?.label || user.role.toUpperCase() : 'STUDENT SCHOLAR'}</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-surface-container-lowest border border-outline-variant shadow-2xl z-50 p-2 font-mono text-xs">
                <div className="px-2 py-1.5 border-b border-outline-variant mb-1 flex items-center justify-between">
                  <span className="font-bold text-primary uppercase text-[10px]">Switch Workspace</span>
                  <span className="text-[10px] text-secondary font-bold">[VERIFIED ROLES]</span>
                </div>
                {((user?.roles && user.roles.length > 0 ? user.roles : (user?.role ? [user.role] : ['student'])) as UserRole[]).map((r) => {
                  const cfg = roleDisplayNames[r] || { label: r, badge: r.substring(0, 3).toUpperCase(), color: 'bg-primary text-on-primary', desc: 'Campus role' };
                  const isCurrent = user?.role === r;
                  return (
                    <button
                      key={r}
                      onClick={() => handleRoleSelect(r)}
                      className={`w-full text-left p-2 transition-colors flex items-start gap-2 border mb-1 ${
                        isCurrent
                          ? 'bg-surface-container border-primary font-bold'
                          : 'border-transparent hover:bg-surface-container-high'
                      }`}
                    >
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold ${cfg.color} shrink-0 uppercase`}>
                        {cfg.badge}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <div className="text-primary font-bold text-xs flex items-center gap-1">
                          {cfg.label}
                          {isCurrent && <span className="material-symbols-outlined text-[14px] text-secondary">check</span>}
                        </div>
                        <span className="text-[10px] text-on-surface-variant line-clamp-1">
                          {cfg.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity Center Bell Icon */}
          <button
            onClick={() => setShowActivityDrawer(true)}
            className="relative p-1.5 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer border border-outline-variant bg-surface-container-low"
            title="Campus Mesh Activity Feed"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-on-secondary text-[9px] font-bold font-mono flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Privacy Hardware Shield */}
          <button
            title="Cryptographic Hardware Shield Active"
            className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant bg-surface-container-low"
            onClick={() => navigate('/settings')}
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">verified_user</span>
          </button>

          {/* User Avatar & Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 border border-outline-variant overflow-hidden hover:opacity-90 transition-opacity"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 object-cover" />
              ) : (
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest border border-outline-variant shadow-xl z-50 p-2 font-mono text-xs">
                <div className="p-2 border-b border-outline-variant mb-1">
                  <div className="font-bold text-primary truncate">{user?.name}</div>
                  <div className="text-[10px] text-on-surface-variant truncate">{user?.email}</div>
                  <div className="text-[10px] text-secondary font-bold mt-1 uppercase">
                    ROLE: {user?.role}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-2 py-1.5 hover:bg-surface-container text-on-surface flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[14px]">settings</span>
                  Node Settings &amp; Ledger
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-2 py-1.5 hover:bg-red-50 text-error flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[14px]">logout</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Activity Slide-Over Drawer */}
      {showActivityDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-primary/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface-container-lowest border-l border-outline-variant h-full flex flex-col shadow-2xl font-mono">
            {/* Drawer Header */}
            <div className="p-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary">rss_feed</span>
                <div>
                  <h3 className="font-bold text-sm text-primary uppercase">Campus Activity Feed</h3>
                  <span className="text-[10px] text-outline">CROSS-MODULE AUDIT LOG</span>
                </div>
              </div>
              <button
                onClick={() => setShowActivityDrawer(false)}
                className="p-1 hover:bg-surface-container text-on-surface-variant hover:text-primary border border-outline-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Actions Bar */}
            <div className="px-4 py-2 border-b border-outline-variant bg-surface-container flex items-center justify-between text-xs text-on-surface-variant">
              <span>{activities.length} Recorded Events</span>
              <button
                onClick={() => setUnreadCount(0)}
                className="text-secondary hover:underline font-bold text-[11px] uppercase"
              >
                Mark all as read
              </button>
            </div>

            {/* Activity Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activities.length === 0 ? (
                <div className="text-center py-12 text-outline text-xs">
                  No activity events recorded yet.
                </div>
              ) : (
                activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 bg-surface-container-low border border-outline-variant hover:border-secondary transition-all flex flex-col gap-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 bg-surface-container-highest text-primary font-bold uppercase text-[10px]">
                        {act.module?.toUpperCase() || 'SYSTEM'}
                      </span>
                      <span className="text-[10px] text-outline">
                        {act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : 'RECENT'}
                      </span>
                    </div>
                    <div className="font-bold text-primary text-[11px]">
                      {act.action?.replace(/_/g, ' ')}
                    </div>
                    <p className="text-on-surface-variant font-sans text-[12px] leading-tight">
                      {typeof act.details === 'object'
                        ? JSON.stringify(act.details)
                        : String(act.details || 'Event logged to immutable audit ledger.')}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-surface-container-low border-t border-outline-variant flex items-center justify-between text-[11px] text-outline">
              <span>LEDGER: SQLite WAL Mode</span>
              <button
                onClick={() => {
                  setShowActivityDrawer(false);
                  navigate('/architecture');
                }}
                className="text-primary hover:text-secondary font-bold underline"
              >
                Inspect Ledger Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
