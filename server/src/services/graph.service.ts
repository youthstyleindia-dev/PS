import campusGraphData from '../algorithms/campus_graph.json';
import {
  CampusNode,
  CampusEdge,
  PathResult,
  GraphTopologyResponse,
} from '../types/rides.types.js';

// Geo Lat/Lng Coordinates for Canonical Nodes
const NODE_GEO_METADATA: Record<string, { lat: number; lng: number; isHub: boolean }> = {
  GATE_NORTH: { lat: 12.9716, lng: 77.5946, isHub: true },
  DORM_NORTH: { lat: 12.9725, lng: 77.5960, isHub: false },
  LIB_CENTRAL: { lat: 12.9730, lng: 77.5985, isHub: true },
  LAB_CS_AI: { lat: 12.9715, lng: 77.6010, isHub: false },
  ACAD_QUAD: { lat: 12.9700, lng: 77.5975, isHub: true },
  INNOVATION: { lat: 12.9690, lng: 77.5940, isHub: false },
  STUDENT_CTR: { lat: 12.9675, lng: 77.5965, isHub: true },
  DORM_SOUTH: { lat: 12.9680, lng: 77.6000, isHub: false },
  SPORTS_CMPLX: { lat: 12.9660, lng: 77.5930, isHub: false },
  GATE_SOUTH: { lat: 12.9650, lng: 77.6020, isHub: true },
};

export class GraphService {
  private nodes: Map<string, CampusNode> = new Map();
  private edges: CampusEdge[] = [];
  private adj: Map<string, CampusEdge[]> = new Map();

  constructor() {
    this.initGraph();
  }

  public normalizeNodeId(id: string): string {
    if (!id) return id;
    if (id === 'INNOVATION_PARK') return 'INNOVATION';
    return id;
  }

  private initGraph(): void {
    for (const rawNode of campusGraphData.nodes as CampusNode[]) {
      const geo = NODE_GEO_METADATA[rawNode.id] || { lat: 12.9700, lng: 77.5970, isHub: false };
      const node: CampusNode = {
        ...rawNode,
        lat: geo.lat,
        lng: geo.lng,
        isHub: geo.isHub,
      };
      this.nodes.set(node.id, node);
      this.adj.set(node.id, []);
    }
    this.edges = campusGraphData.edges as CampusEdge[];
    for (const edge of this.edges) {
      if (this.adj.has(edge.source)) {
        this.adj.get(edge.source)!.push(edge);
      }
    }
  }

  /**
   * Evaluates dynamic time-of-day edge congestion weighting c(t)
   * Morning rush (08:30): 1.65x
   * Midday shift (12:30): 1.35x
   * Evening dispersal (17:45): 1.70x
   * Off-peak: 1.00x
   */
  public getCongestionMultiplier(timeStr: string, edge?: CampusEdge): number {
    try {
      let hour = 12;
      let minute = 0;
      if (timeStr.includes('T') || timeStr.includes(' ')) {
        const d = new Date(timeStr);
        if (!isNaN(d.getTime())) {
          hour = d.getHours();
          minute = d.getMinutes();
        }
      } else if (timeStr.includes(':')) {
        const parts = timeStr.split(':');
        hour = parseInt(parts[0], 10);
        minute = parseInt(parts[1], 10);
      }
      const timeDecimal = hour + minute / 60;

      let globalCongestion = 1.0;
      // Morning rush: 08:15 to 09:30 => 1.65x
      if (timeDecimal >= 8.25 && timeDecimal <= 9.5) {
        globalCongestion = 1.65;
      }
      // Midday shift: 12:00 to 13:30 => 1.35x
      else if (timeDecimal >= 12.0 && timeDecimal <= 13.5) {
        globalCongestion = 1.35;
      }
      // Evening dispersal: 17:00 to 18:30 => 1.70x
      else if (timeDecimal >= 17.0 && timeDecimal <= 18.5) {
        globalCongestion = 1.70;
      }

      // Edge-specific lane mitigation
      if (edge) {
        if (edge.roadType === 'PEDESTRIAN_ACCESS') return 1.0;
        if (edge.roadType === 'EV_SHUTTLE_LANE') return Math.min(1.10, globalCongestion);
      }

      return globalCongestion;
    } catch {
      return 1.0;
    }
  }

  /**
   * Dijkstra shortest path calculation minimizing distance or travel time
   */
  public findShortestPath(
    rawSourceId: string,
    rawTargetId: string,
    timeStr = '12:00',
    mode: 'distance' | 'time' = 'distance'
  ): PathResult | null {
    const sourceId = this.normalizeNodeId(rawSourceId);
    const targetId = this.normalizeNodeId(rawTargetId);

    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) return null;
    if (sourceId === targetId) {
      return { path: [sourceId], totalDistanceKm: 0, totalTimeMins: 0, legs: [] };
    }

    const congestion = this.getCongestionMultiplier(timeStr);
    const dist = new Map<string, number>();
    const prev = new Map<string, { node: string; edge: CampusEdge }>();
    const visited = new Set<string>();

    for (const id of this.nodes.keys()) {
      dist.set(id, Infinity);
    }
    dist.set(sourceId, 0);

    while (visited.size < this.nodes.size) {
      let u: string | null = null;
      let minD = Infinity;

      for (const [id, d] of dist.entries()) {
        if (!visited.has(id) && d < minD) {
          minD = d;
          u = id;
        }
      }

      if (!u || minD === Infinity) break;
      if (u === targetId) break;
      visited.add(u);

      const edges = this.adj.get(u) || [];
      for (const edge of edges) {
        if (!visited.has(edge.target)) {
          const edgeWeight = mode === 'time'
            ? edge.baseTimeMins * congestion
            : edge.distanceKm;
          const alt = dist.get(u)! + edgeWeight;
          if (alt < dist.get(edge.target)!) {
            dist.set(edge.target, alt);
            prev.set(edge.target, { node: u, edge });
          }
        }
      }
    }

    if (dist.get(targetId) === Infinity) return null;

    const path: string[] = [];
    const legs: { from: string; to: string; distanceKm: number; timeMins: number; roadType: string }[] = [];
    let curr = targetId;
    let totalDist = 0;
    let totalTime = 0;

    path.unshift(curr);
    while (prev.has(curr)) {
      const p = prev.get(curr)!;
      totalDist += p.edge.distanceKm;
      const legTime = p.edge.baseTimeMins * congestion;
      totalTime += legTime;
      legs.unshift({
        from: p.node,
        to: curr,
        distanceKm: p.edge.distanceKm,
        timeMins: Math.round(legTime * 10) / 10,
        roadType: p.edge.roadType,
      });
      curr = p.node;
      path.unshift(curr);
    }

    return {
      path,
      totalDistanceKm: Math.round(totalDist * 100) / 100,
      totalTimeMins: Math.round(totalTime * 10) / 10,
      legs,
    };
  }

  /**
   * A* Pathfinding using Euclidean coordinate heuristic
   */
  public findShortestPathAStar(
    rawSourceId: string,
    rawTargetId: string,
    timeStr = '12:00'
  ): PathResult | null {
    const sourceId = this.normalizeNodeId(rawSourceId);
    const targetId = this.normalizeNodeId(rawTargetId);

    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) return null;
    if (sourceId === targetId) {
      return { path: [sourceId], totalDistanceKm: 0, totalTimeMins: 0, legs: [] };
    }

    const targetNode = this.nodes.get(targetId)!;
    // Heuristic: Euclidean distance in km (1 unit ≈ 0.0014 km)
    const heuristic = (nodeId: string): number => {
      const n = this.nodes.get(nodeId);
      if (!n) return 0;
      const dx = n.x - targetNode.x;
      const dy = n.y - targetNode.y;
      return Math.sqrt(dx * dx + dy * dy) * 0.0014;
    };

    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const prev = new Map<string, { node: string; edge: CampusEdge }>();
    const openSet = new Set<string>([sourceId]);
    const closedSet = new Set<string>();

    for (const id of this.nodes.keys()) {
      gScore.set(id, Infinity);
      fScore.set(id, Infinity);
    }
    gScore.set(sourceId, 0);
    fScore.set(sourceId, heuristic(sourceId));

    while (openSet.size > 0) {
      let current: string | null = null;
      let minF = Infinity;
      for (const id of openSet) {
        const f = fScore.get(id)!;
        if (f < minF) {
          minF = f;
          current = id;
        }
      }

      if (!current) break;
      if (current === targetId) break;

      openSet.delete(current);
      closedSet.add(current);

      const edges = this.adj.get(current) || [];
      for (const edge of edges) {
        if (closedSet.has(edge.target)) continue;

        const tentativeG = gScore.get(current)! + edge.distanceKm;
        if (!openSet.has(edge.target)) openSet.add(edge.target);

        if (tentativeG < (gScore.get(edge.target) || Infinity)) {
          prev.set(edge.target, { node: current, edge });
          gScore.set(edge.target, tentativeG);
          fScore.set(edge.target, tentativeG + heuristic(edge.target));
        }
      }
    }

    if (gScore.get(targetId) === Infinity) return null;

    const path: string[] = [];
    const legs: { from: string; to: string; distanceKm: number; timeMins: number; roadType: string }[] = [];
    const congestion = this.getCongestionMultiplier(timeStr);
    let curr = targetId;
    let totalDist = 0;
    let totalTime = 0;

    path.unshift(curr);
    while (prev.has(curr)) {
      const p = prev.get(curr)!;
      totalDist += p.edge.distanceKm;
      const legTime = p.edge.baseTimeMins * congestion;
      totalTime += legTime;
      legs.unshift({
        from: p.node,
        to: curr,
        distanceKm: p.edge.distanceKm,
        timeMins: Math.round(legTime * 10) / 10,
        roadType: p.edge.roadType,
      });
      curr = p.node;
      path.unshift(curr);
    }

    return {
      path,
      totalDistanceKm: Math.round(totalDist * 100) / 100,
      totalTimeMins: Math.round(totalTime * 10) / 10,
      legs,
    };
  }

  /**
   * Returns full campus graph topology for visualizer and route overlays
   */
  public getGraphTopology(timeStr = '12:00'): GraphTopologyResponse {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      liveCongestionMultiplier: this.getCongestionMultiplier(timeStr),
      activeTimeWindow: timeStr,
    };
  }

  public getNode(id: string): CampusNode | undefined {
    return this.nodes.get(this.normalizeNodeId(id));
  }

  public getAllNodes(): CampusNode[] {
    return Array.from(this.nodes.values());
  }

  public getAllEdges(): CampusEdge[] {
    return this.edges;
  }
}

export const graphService = new GraphService();
