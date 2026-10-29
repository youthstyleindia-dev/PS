import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../types';
import { User, Shield, Car, GraduationCap, ChevronDown, Check } from 'lucide-react';

export interface RoleConfigItem {
  label: string;
  name: string;
  code: string;
  avatar: string;
  icon: React.ElementType;
  color: string;
  badge: string;
  desc: string;
}

export const roleConfigs: Record<UserRole, RoleConfigItem> = {
  student: {
    label: 'Student Perspective',
    name: 'Aarav Sharma',
    code: 'CS2022_891',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
    icon: GraduationCap,
    color: 'text-accent border-accent/30 bg-accent/10',
    badge: 'Aarav Sharma (CS-4th Yr)',
    desc: 'Access placement tools, request mentors, book pooled rides'
  },
  driver: {
    label: 'Driver Perspective',
    name: 'Vikram Rao',
    code: 'DRV_2024_03',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram',
    icon: Car,
    color: 'text-sky-400 border-sky-400/30 bg-sky-500/10',
    badge: 'Vikram Rao (EV Shuttle)',
    desc: 'Publish campus routes, accept carpool detours, view carbon'
  },
  proctor: {
    label: 'Proctor Perspective',
    name: 'Dr. Meenakshi Sundaram',
    code: 'FAC_CS_104',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meenakshi',
    icon: Shield,
    color: 'text-amber-400 border-amber-400/30 bg-amber-500/10',
    badge: 'Dr. Meenakshi Sundaram',
    desc: 'Review CV event detections, dismiss false positives, audit logs'
  },
  admin: {
    label: 'System Admin',
    name: 'Campus Central IT',
    code: 'SYS_ADMIN_01',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    icon: User,
    color: 'text-purple-400 border-purple-400/30 bg-purple-500/10',
    badge: 'Campus Central IT',
    desc: 'Observe energy telemetry, manage workloads, full audit access'
  }
};

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

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
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface/80 hover:bg-surface text-fg-primary text-xs font-medium transition-all cursor-pointer"
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
                className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-all cursor-pointer ${
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
