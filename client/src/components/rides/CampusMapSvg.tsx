import React from 'react';
import { CampusNode, CampusEdge } from '../../services/rides.service';

interface CampusMapSvgProps {
  nodes: CampusNode[];
  edges: CampusEdge[];
  selectedOrigin?: string;
  selectedDestination?: string;
  pickupNodeId?: string;
  dropoffNodeId?: string;
  highlightedPath?: string[];
  pooledPath?: string[];
  detourSegment?: string[];
  liveCongestionMultiplier?: number;
  activeTime?: string;
  onSelectNode?: (nodeId: string) => void;
  onTimeChange?: (time: string) => void;
}

const ZONE_COLORS: Record<string, string> = {
  TRANSIT: '#F59E0B',     // Amber
  ACADEMIC: '#38BDF8',    // Cyan
  RESIDENTIAL: '#A78BFA', // Purple
  COMMONS: '#EC4899',     // Pink
  RESEARCH: '#39F59A',    // Neon Emerald
  ATHLETICS: '#FB923C',   // Orange
  Academic: '#38BDF8',
  Transit: '#F59E0B',
  Residential: '#A78BFA',
  Recreation: '#FB923C',
};

const RUSH_HOURS = [
  { label: 'Morning Rush', time: '08:30', mult: '1.65x', color: '#EF4444' },
  { label: 'Midday Shift', time: '12:30', mult: '1.35x', color: '#F59E0B' },
  { label: 'Evening Peak', time: '17:45', mult: '1.70x', color: '#EF4444' },
  { label: 'Off-Peak Normal', time: '21:00', mult: '1.00x', color: '#10B981' },
];

export const CampusMapSvg: React.FC<CampusMapSvgProps> = ({
  nodes,
  edges,
  selectedOrigin,
  selectedDestination,
  pickupNodeId,
  dropoffNodeId,
  highlightedPath = [],
  pooledPath = [],
  detourSegment = [],
  liveCongestionMultiplier = 1.0,
  activeTime = '08:30',
  onSelectNode,
  onTimeChange,
}) => {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Helper to determine if an edge is part of a given path
  const isEdgeInPath = (edge: CampusEdge, path: string[]) => {
    for (let i = 0; i < path.length - 1; i++) {
      if (
        (path[i] === edge.source && path[i + 1] === edge.target) ||
        (path[i] === edge.target && path[i + 1] === edge.source)
      ) {
        return true;
      }
    }
    return false;
  };

  // Determine edge color based on live congestion multiplier
  const getCongestionColor = (multiplier: number) => {
    if (multiplier <= 1.15) return '#10B981'; // Green (Free Flow)
    if (multiplier <= 1.45) return '#F59E0B'; // Amber / Yellow (Moderate)
    return '#EF4444';                         // Red / Orange (Heavy Rush)
  };

  const defaultEdgeColor = getCongestionColor(liveCongestionMultiplier);

  return (
    <div className="w-full bg-[#0C131D] rounded-2xl border border-border-subtle p-4 relative overflow-hidden shadow-xl">
      {/* Map Header & Congestion Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-border-subtle/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-accent font-bold uppercase tracking-wider">Campus Spatial Graph</span>
          <span className="text-fg-muted font-mono hidden sm:inline">(Interactive Dijkstra & DARP Matching)</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-accent/30" />
            <span className="text-fg-muted">Origin</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899] ring-2 ring-[#EC4899]/30" />
            <span className="text-fg-muted">Destination</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-accent" />
            <span className="text-accent font-medium">Pooled Route</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#38BDF8] border-t border-dashed border-[#38BDF8]" />
            <span className="text-[#38BDF8] font-medium">Driver Direct</span>
          </span>
          <span className="flex items-center gap-1.5 pl-2 border-l border-border-subtle">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: defaultEdgeColor }} />
            <span className="font-mono text-[10px] text-fg-muted">c(t) = {liveCongestionMultiplier.toFixed(2)}x</span>
          </span>
        </div>
      </div>

      {/* Time Scrubber / Rush Hour Selector */}
      {onTimeChange && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-surface/80 border border-border-subtle/60 text-xs">
          <span className="text-fg-muted font-mono text-[11px] whitespace-nowrap">Time Scrubber:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto w-full">
            {RUSH_HOURS.map(rh => (
              <button
                key={rh.time}
                onClick={() => onTimeChange(rh.time)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTime === rh.time
                    ? 'bg-accent text-[#080D14] font-bold shadow'
                    : 'bg-card text-fg-muted hover:text-fg-primary border border-border-subtle/50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rh.color }} />
                <span>{rh.time}</span>
                <span className="opacity-80">({rh.mult})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="relative aspect-[16/10] w-full max-h-[480px]">
        <svg viewBox="100 50 800 900" className="w-full h-full select-none">
          <defs>
            <filter id="glow-pooled" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-driver" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid background reference lines */}
          <g stroke="#172332" strokeWidth="1" strokeDasharray="4,4">
            {[200, 350, 500, 650, 800].map(x => (
              <line key={`vx-${x}`} x1={x} y1="50" x2={x} y2="950" />
            ))}
            {[100, 250, 400, 550, 700, 850].map(y => (
              <line key={`hy-${y}`} x1="100" y1={y} x2="900" y2={y} />
            ))}
          </g>

          {/* Network Edges */}
          <g>
            {edges.map(edge => {
              const u = nodeMap.get(edge.source);
              const v = nodeMap.get(edge.target);
              if (!u || !v || edge.source > edge.target) return null; // Draw once per undirected pair

              const isPooled = isEdgeInPath(edge, pooledPath);
              const isDriver = isEdgeInPath(edge, highlightedPath);
              const isDetour = isEdgeInPath(edge, detourSegment);

              let stroke = '#253343';
              let strokeWidth = 2;
              let strokeDasharray = undefined;
              let filter = undefined;

              if (isPooled) {
                stroke = '#39F59A';
                strokeWidth = 5;
                filter = 'url(#glow-pooled)';
              } else if (isDetour) {
                stroke = '#F59E0B';
                strokeWidth = 4;
                strokeDasharray = '6,4';
              } else if (isDriver) {
                stroke = '#38BDF8';
                strokeWidth = 3.5;
                strokeDasharray = '6,4';
                filter = 'url(#glow-driver)';
              } else {
                stroke = defaultEdgeColor;
                strokeWidth = 2;
              }

              return (
                <g key={edge.id}>
                  <line
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeLinecap="round"
                    filter={filter}
                    className="transition-all duration-300"
                  />
                  {/* Distance badge on edge midpoint */}
                  <rect
                    x={(u.x + v.x) / 2 - 16}
                    y={(u.y + v.y) / 2 - 9}
                    width="32"
                    height="18"
                    rx="5"
                    fill="#080D14"
                    stroke={isPooled ? '#39F59A' : '#253343'}
                    strokeWidth="1"
                  />
                  <text
                    x={(u.x + v.x) / 2}
                    y={(u.y + v.y) / 2 + 4}
                    textAnchor="middle"
                    fill={isPooled ? '#39F59A' : '#98A8B8'}
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    {edge.distanceKm}k
                  </text>
                </g>
              );
            })}
          </g>

          {/* Campus Nodes */}
          <g>
            {nodes.map(node => {
              const isOrigin = selectedOrigin === node.id;
              const isDestination = selectedDestination === node.id;
              const isPickup = pickupNodeId === node.id;
              const isDropoff = dropoffNodeId === node.id;
              const isPooledNode = pooledPath.includes(node.id);
              const isDriverNode = highlightedPath.includes(node.id);
              const zoneColor = ZONE_COLORS[node.zone] || '#38BDF8';

              let nodeFill = '#111B27';
              let nodeStroke = zoneColor;
              let radius = 15;

              if (isOrigin) {
                nodeFill = '#39F59A';
                nodeStroke = '#ffffff';
                radius = 19;
              } else if (isDestination) {
                nodeFill = '#EC4899';
                nodeStroke = '#ffffff';
                radius = 19;
              } else if (isPickup) {
                nodeFill = '#10B981';
                nodeStroke = '#39F59A';
                radius = 17;
              } else if (isDropoff) {
                nodeFill = '#F43F5E';
                nodeStroke = '#FDA4AF';
                radius = 17;
              } else if (isPooledNode) {
                nodeFill = '#172332';
                nodeStroke = '#39F59A';
                radius = 16;
              } else if (isDriverNode) {
                nodeFill = '#172332';
                nodeStroke = '#38BDF8';
                radius = 16;
              }

              return (
                <g
                  key={node.id}
                  onClick={() => onSelectNode?.(node.id)}
                  className="cursor-pointer group"
                >
                  {/* Ping Animation for Origin/Destination/Pickup/Dropoff */}
                  {(isOrigin || isDestination || isPickup || isDropoff) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 9}
                      fill="none"
                      stroke={isOrigin ? '#39F59A' : isDestination ? '#EC4899' : isPickup ? '#10B981' : '#F43F5E'}
                      strokeWidth="2"
                      opacity="0.6"
                      className="animate-ping"
                    />
                  )}

                  {/* Outer Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill={nodeFill}
                    stroke={nodeStroke}
                    strokeWidth={isOrigin || isDestination ? 3.5 : 2}
                    className="transition-all duration-200 group-hover:scale-115"
                    style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                  />

                  {/* Inner Dot / Status Pin */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius / 3.2}
                    fill={isOrigin || isDestination ? '#080D14' : zoneColor}
                  />

                  {/* Pin Callout Badge */}
                  {(isOrigin || isDestination || isPickup || isDropoff) && (
                    <g transform={`translate(${node.x - 30}, ${node.y - radius - 20})`}>
                      <rect
                        width="60"
                        height="16"
                        rx="4"
                        fill={isOrigin ? '#39F59A' : isDestination ? '#EC4899' : isPickup ? '#10B981' : '#F43F5E'}
                      />
                      <text
                        x="30"
                        y="11.5"
                        textAnchor="middle"
                        fill="#080D14"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {isOrigin ? 'ORIGIN' : isDestination ? 'DEST' : isPickup ? 'PICKUP' : 'DROPOFF'}
                      </text>
                    </g>
                  )}

                  {/* Node Name Label */}
                  <text
                    x={node.x}
                    y={node.y + radius + 15}
                    textAnchor="middle"
                    fill={isOrigin || isDestination ? '#F2F7FA' : '#98A8B8'}
                    fontSize="11"
                    fontWeight={isOrigin || isDestination ? 'bold' : '500'}
                    fontFamily="sans-serif"
                    className="pointer-events-none group-hover:fill-fg-primary"
                  >
                    {node.name.split(' (')[0].split(' / ')[0]}
                  </text>

                  {/* Zone Tag */}
                  <text
                    x={node.x}
                    y={node.y + radius + 27}
                    textAnchor="middle"
                    fill={zoneColor}
                    fontSize="8.5"
                    fontFamily="monospace"
                    className="pointer-events-none opacity-85"
                  >
                    [{node.zone}]
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <p className="text-[11px] text-fg-muted mt-2 text-center">
        Tip: Click any node to set as Origin or Destination. Green paths show the DARP pooled route with $\le 35\%$ detour.
      </p>
    </div>
  );
};
