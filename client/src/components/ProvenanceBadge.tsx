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
    ? 'text-[10px] px-2 py-0.5 space-x-1.5' 
    : 'text-xs px-2.5 py-1 space-x-2';

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
