import React from 'react';
import { Search } from 'lucide-react';
import { UserRole, ActivityItem } from '../types';
import { RoleSwitcher, roleConfigs } from './RoleSwitcher';
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
  const activeRoleConfig = roleConfigs[currentRole] || roleConfigs.student;

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

        {/* Dynamic User Identity Pill updating with selected role */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border-subtle">
          <div className="relative">
            <img
              src={activeRoleConfig.avatar}
              alt={activeRoleConfig.name}
              className="w-8 h-8 rounded-full border border-border-subtle object-cover bg-surface"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-sidebar ${
                currentRole === 'student'
                  ? 'bg-accent'
                  : currentRole === 'driver'
                  ? 'bg-sky-400'
                  : currentRole === 'proctor'
                  ? 'bg-amber-400'
                  : 'bg-purple-400'
              }`}
            />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-fg-primary leading-tight flex items-center gap-1.5">
              <span>{activeRoleConfig.name}</span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold tracking-tight ${activeRoleConfig.color}`}>
                {currentRole}
              </span>
            </div>
            <div className="text-[10px] text-fg-muted font-mono leading-tight">
              {activeRoleConfig.code} • {activeRoleConfig.badge}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
