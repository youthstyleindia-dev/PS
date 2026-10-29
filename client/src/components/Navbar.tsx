import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { navigationByRole } from '../navigation/navigationByRole';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3 py-1.5 transition-colors font-body-sm font-medium ${
      isActive
        ? 'bg-primary text-on-primary font-semibold shadow-sm'
        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
    }`;

  const currentRole: UserRole = user?.role || 'student';
  const navGroups = navigationByRole[currentRole] || navigationByRole.student;
  const userRoles = user?.roles || (user?.role ? [user.role] : ['student']);

  const rolePillShort: Record<UserRole, string> = {
    student: 'STU',
    driver: 'DRV',
    proctor: 'PRC',
    ta_faculty: 'FAC',
    warden: 'WAR',
    admin: 'ADM'
  };

  return (
    <aside className="w-72 bg-surface-container-low border-r border-outline-variant flex flex-col justify-between shrink-0 h-screen select-none overflow-y-auto">
      <div className="flex flex-col">
        {/* Node Status Header */}
        <div className="p-4 bg-surface-container-lowest border-b border-outline-variant">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-md text-label-md text-primary tracking-wider uppercase font-bold">
              UniVerse // {currentRole.toUpperCase()}_NODE
            </span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-bold font-mono">
              ONLINE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest font-mono">
              RBAC SCOPE ACTIVE
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
              {currentRole.toUpperCase()} • {user?.department || 'CAMPUS'}
            </div>
          </div>
        </div>

        {/* Role-Specific Navigation Groups */}
        <nav className="px-2 pt-4 space-y-4">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-3 font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                {group.groupName}
              </div>
              {group.items.map((item, iIdx) => (
                <NavLink key={iIdx} to={item.path} className={navClass}>
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-[16px] mr-2">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`font-label-sm text-[10px] px-1.5 py-0.2 font-mono font-bold ${
                        item.badgeColor || 'bg-surface-container-highest text-on-surface'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Session Footer */}
      <div className="p-3 border-t border-outline-variant space-y-2 bg-surface-container-low">
        {/* Workspace Switcher — Only displays roles granted to this identity */}
        <div className="p-2 bg-surface border border-outline-variant flex items-center justify-between text-xs">
          <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono">
            {userRoles.length > 1 ? 'Workspace' : 'Assigned Role'}
          </div>
          <div className="flex gap-1 font-mono text-[10px]">
            {userRoles.map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                title={`Switch to ${r.toUpperCase()} workspace`}
                className={`px-1.5 py-0.5 border ${
                  currentRole === r
                    ? 'bg-primary text-on-primary font-bold'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                {rolePillShort[r] || r.substring(0, 3).toUpperCase()}
              </button>
            ))}
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
