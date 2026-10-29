import React, { useState } from 'react';
import { Bell, X, Check, ShieldAlert, GraduationCap, Car, Leaf, Brain } from 'lucide-react';
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
      case 'wellbeing': return Brain;
      case 'exams': return ShieldAlert;
      default: return Bell;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg border border-border-subtle bg-surface/60 hover:bg-surface text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
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
          <div className="w-96 bg-card border-l border-border-strong h-full flex flex-col shadow-2xl">
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
                className="p-1 rounded hover:bg-surface text-fg-muted hover:text-fg-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions Bar */}
            <div className="px-4 py-2 border-b border-border-subtle flex items-center justify-between text-xs text-fg-muted bg-surface/20">
              <button
                onClick={onMarkAllAsRead}
                className="hover:text-accent flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
              <button
                onClick={onClear}
                className="hover:text-rose-400 font-medium transition-colors cursor-pointer"
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
