import campusGraph from './campus_graph.json';

export interface CampusNode {
  id: string;
  name: string;
  x: number;
  y: number;
  zone: string;
}

export interface CampusEdge {
  id: string;
  source: string;
  target: string;
  distanceKm: number;
  baseTimeMins: number;
  roadType: string;
}

export interface PathResult {
  path: string[];
  totalDistanceKm: number;
  totalTimeMins: number;
}

export interface RideOfferInput {
  id: string;
  driverId: string;
  originNodeId: string;
  destinationNodeId: string;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  vehicleType?: 'PETROL_CAR' | 'ELECTRIC_VEHICLE' | 'E_SHUTTLE';
  status?: string;
}

export interface RideRequestInput {
  id: string;
  passengerId: string;
  originNodeId: string;
  destinationNodeId: string;
  desiredTime: string;
  seatsNeeded: number;
  maxDetourRatio?: number;
}

export interface MatchResult {
  matched: boolean;
  reason?: string;
  driverRoute: string[];
  passengerRoute: string[];
  pooledRoute?: string[];
  detourKm: number;
  detourRatio: number;
  sharedKm: number;
  carbonSavedKg: number;
  passengerFareSaved: number;
  driverSubsidy: number;
}

export class CampusGraphOracle {
  public nodes: Map<string, CampusNode> = new Map();
  public edges: CampusEdge[] = [];
  public adj: Map<string, CampusEdge[]> = new Map();

  constructor() {
    for (const node of campusGraph.nodes as CampusNode[]) {
      this.nodes.set(node.id, node);
      this.adj.set(node.id, []);
    }
    this.edges = campusGraph.edges as CampusEdge[];
    for (const edge of this.edges) {
      if (this.adj.has(edge.source)) {
        this.adj.get(edge.source)!.push(edge);
      }
    }
  }

  public getCongestionMultiplier(timeStr: string): number {
    try {
      let hour = 12;
      let minute = 0;
      if (timeStr.includes('T')) {
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
      // Morning rush: 08:15 to 09:30
      if (timeDecimal >= 8.25 && timeDecimal <= 9.5) return 1.65;
      // Midday shift: 12:00 to 13:30
      if (timeDecimal >= 12.0 && timeDecimal <= 13.5) return 1.35;
      // Evening dispersal: 17:00 to 18:30
      if (timeDecimal >= 17.0 && timeDecimal <= 18.5) return 1.70;
      return 1.0;
    } catch {
      return 1.0;
    }
  }

  public findShortestPath(sourceId: string, targetId: string, timeStr = '12:00'): PathResult | null {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) return null;
    if (sourceId === targetId) {
      return { path: [sourceId], totalDistanceKm: 0, totalTimeMins: 0 };
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
          const alt = dist.get(u)! + edge.distanceKm;
          if (alt < dist.get(edge.target)!) {
            dist.set(edge.target, alt);
            prev.set(edge.target, { node: u, edge });
          }
        }
      }
    }

    if (dist.get(targetId) === Infinity) return null;

    const path: string[] = [];
    let curr = targetId;
    let totalTime = 0;
    let totalDist = 0;

    path.unshift(curr);
    while (prev.has(curr)) {
      const p = prev.get(curr)!;
      totalDist += p.edge.distanceKm;
      totalTime += p.edge.baseTimeMins * congestion;
      curr = p.node;
      path.unshift(curr);
    }

    return {
      path,
      totalDistanceKm: Math.round(totalDist * 100) / 100,
      totalTimeMins: Math.round(totalTime * 10) / 10,
    };
  }

  public matchRide(offer: RideOfferInput, request: RideRequestInput): MatchResult {
    // 1. Capacity check
    if (offer.availableSeats < request.seatsNeeded) {
      return {
        matched: false,
        reason: 'INSUFFICIENT_SEAT_CAPACITY',
        driverRoute: [],
        passengerRoute: [],
        detourKm: 0,
        detourRatio: 1.0,
        sharedKm: 0,
        carbonSavedKg: 0,
        passengerFareSaved: 0,
        driverSubsidy: 0,
      };
    }

    // 2. Direct paths
    const driverDirect = this.findShortestPath(offer.originNodeId, offer.destinationNodeId, offer.departureTime);
    const passDirect = this.findShortestPath(request.originNodeId, request.destinationNodeId, request.desiredTime);

    if (!driverDirect || !passDirect) {
      return {
        matched: false,
        reason: 'UNREACHABLE_NODES',
        driverRoute: [],
        passengerRoute: [],
        detourKm: 0,
        detourRatio: 1.0,
        sharedKm: 0,
        carbonSavedKg: 0,
        passengerFareSaved: 0,
        driverSubsidy: 0,
      };
    }

    // 3. Pooled trajectory: Od -> Op -> Dp -> Dd
    const leg1 = this.findShortestPath(offer.originNodeId, request.originNodeId, offer.departureTime);
    const leg2 = this.findShortestPath(request.originNodeId, request.destinationNodeId, offer.departureTime);
    const leg3 = this.findShortestPath(request.destinationNodeId, offer.destinationNodeId, offer.departureTime);

    if (!leg1 || !leg2 || !leg3) {
      return {
        matched: false,
        reason: 'INVALID_POOLED_PATH',
        driverRoute: driverDirect.path,
        passengerRoute: passDirect.path,
        detourKm: 0,
        detourRatio: 1.0,
        sharedKm: 0,
        carbonSavedKg: 0,
        passengerFareSaved: 0,
        driverSubsidy: 0,
      };
    }

    const pooledDist = leg1.totalDistanceKm + leg2.totalDistanceKm + leg3.totalDistanceKm;
    const detourKm = Math.max(0, pooledDist - driverDirect.totalDistanceKm);
    const detourRatio = driverDirect.totalDistanceKm > 0 ? detourKm / driverDirect.totalDistanceKm : 0;
    const maxAllowedDetour = request.maxDetourRatio ?? 0.35;

    // Build unique node sequence
    const pooledRoute = [
      ...leg1.path,
      ...leg2.path.slice(1),
      ...leg3.path.slice(1),
    ];

    if (detourRatio > maxAllowedDetour) {
      return {
        matched: false,
        reason: 'DETOUR_LIMIT_EXCEEDED',
        driverRoute: driverDirect.path,
        passengerRoute: passDirect.path,
        pooledRoute,
        detourKm: Math.round(detourKm * 100) / 100,
        detourRatio: Math.round(detourRatio * 1000) / 1000,
        sharedKm: 0,
        carbonSavedKg: 0,
        passengerFareSaved: 0,
        driverSubsidy: 0,
      };
    }

    // Shared km is leg2 (passenger segment)
    const sharedKm = leg2.totalDistanceKm;
    const soloSum = driverDirect.totalDistanceKm + passDirect.totalDistanceKm;
    const avoidedKm = Math.max(0, soloSum - pooledDist);

    // Emissions factor
    const efKg = offer.vehicleType === 'ELECTRIC_VEHICLE' ? 0.048 : 0.155;
    const carbonSavedKg = Math.round(avoidedKm * efKg * 100) / 100;

    // Cost calculations
    const passSoloFare = 15.0 + 12.0 * passDirect.totalDistanceKm;
    const passPooledFare = passSoloFare * 0.6; // 40% savings
    const passSavings = Math.round((passSoloFare - passPooledFare) * 100) / 100;
    const driverSubsidy = Math.round(passPooledFare * 0.85 * 100) / 100;

    return {
      matched: true,
      driverRoute: driverDirect.path,
      passengerRoute: passDirect.path,
      pooledRoute,
      detourKm: Math.round(detourKm * 100) / 100,
      detourRatio: Math.round(detourRatio * 1000) / 1000,
      sharedKm: Math.round(sharedKm * 100) / 100,
      carbonSavedKg,
      passengerFareSaved: passSavings,
      driverSubsidy,
    };
  }
}
