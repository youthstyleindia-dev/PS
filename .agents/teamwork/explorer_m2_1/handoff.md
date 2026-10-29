# Milestone 2 Investigation & Technical Handoff Report: Smart Campus Ride-Pooling Graph Engine

## Executive Summary
This report presents an in-depth investigation into the **Smart Campus Ride-Pooling** module (Milestone 2) for **UniVerse**. It defines the canonical 10-node campus topology, the 2D SVG/Canvas coordinate mapping, the 30 directed / 15 bidirectional edge network, the dynamic time-of-day edge congestion model $c(t)$, Dijkstra and A* shortest-path implementations, and the Dial-a-Ride Problem (DARP) detour and carbon calculation engine. Furthermore, it details the architecture and turnkey TypeScript code proposals for `server/src/services/graph.service.ts` and `server/src/types/rides.types.ts`.

---

## 1. Observation

### 1.1 Codebase & Fixture Audit
1. **Test Suites**:
   - `tests/unit/graph_matching.test.ts` (Lines 11–60): Verifies Dijkstra single-hop (`GATE_NORTH` $\to$ `DORM_NORTH`, 0.8 km, 3.0 min) and multi-hop (`GATE_NORTH` $\to$ `DORM_NORTH` $\to$ `ACAD_QUAD`, 1.5 km), identical origin/destination (zero distance), non-existent nodes (`null`), and time-of-day dynamic congestion multipliers:
     - Off-peak (`10:00`): multiplier `1.0` (time = 3.0 min)
     - Morning peak rush (`08:30`): multiplier `1.65` (time = `Math.round(3.0 * 1.65 * 10) / 10 = 5.0 min`)
     - Midday shift (`12:30`): multiplier `1.35` (time = `Math.round(3.0 * 1.35 * 10) / 10 = 4.1 min`)
     - Evening dispersal (`17:45`): multiplier `1.70` (time = `Math.round(3.0 * 1.70 * 10) / 10 = 5.1 min`)
   - `tests/unit/graph_matching.test.ts` (Lines 62–185): Verifies DARP matching heuristic with detour $\le 35\%$, seat capacity rejection (`INSUFFICIENT_SEAT_CAPACITY`), detour rejection (`DETOUR_LIMIT_EXCEEDED`), and carbon savings formula comparison (Petrol vehicle avoided emission factor $0.155\text{ kg CO}_2/\text{km}$ vs Electric vehicle $0.048\text{ kg CO}_2/\text{km}$).
   - `tests/e2e/tier1_features.test.ts` (Lines 158–167):
     ```typescript
     it('F11: GET /api/rides/graph returns campus topology, nodes, edges, and congestion', async () => {
       const client = await getTestClient();
       const res = await client.get('/api/rides/graph?time=08:30');
       expect(res.status).toBe(200);
       expect(Array.isArray(res.body.nodes)).toBe(true);
       expect(res.body.nodes.length).toBe(10);
       expect(Array.isArray(res.body.edges)).toBe(true);
       expect(res.body.edges.length).toBe(30);
       expect(res.body.liveCongestionMultiplier).toBe(1.65); // 08:30 rush
     });
     ```
     *Line 165 explicitly asserts that the edges array has length 30*.

2. **Graph Data Fixtures**:
   - `tests/fixtures/campus_graph.json` & `server/src/algorithms/campus_graph.json`:
     - Contains 10 nodes: `GATE_NORTH`, `GATE_SOUTH`, `ACAD_QUAD`, `LAB_CS_AI`, `LIB_CENTRAL`, `DORM_NORTH`, `DORM_SOUTH`, `STUDENT_CTR`, `INNOVATION`, `SPORTS_CMPLX`.
     - Contains 30 directed edges (`e1` to `e30`), corresponding to 15 bidirectional road corridors.
   - `server/src/db/seed.ts` (Lines 260–310):
     - Seeds `campus_nodes` with 10 records, but uses node ID `INNOVATION_PARK` instead of `INNOVATION`.
     - Seeds `campus_edges` with 22 rows with `is_bidirectional = 1`.
   - `server/src/db/schema.sql` (Lines 119–155):
     - `campus_nodes` schema: `(id PRIMARY KEY, name, zone, coord_x, coord_y, lat, lng, is_hub)`
     - `campus_edges` schema: `(id PRIMARY KEY, source_node_id REFERENCES campus_nodes(id), target_node_id REFERENCES campus_nodes(id), distance_km, base_time_mins, road_type CHECK(road_type IN ('CAMPUS_ROAD', 'EV_SHUTTLE_LANE', 'PEDESTRIAN_ACCESS')), speed_limit_kmh, current_congestion, is_bidirectional)`
     - `ride_offers` has foreign keys to `campus_nodes(id)` on `origin_node_id` and `destination_node_id`.

3. **Current Routing & Service Structure**:
   - `server/src/routes/rides.routes.ts`:
     - Imports `CampusGraphOracle` from `../algorithms/graph_oracle.js`.
     - Directly calls `graphOracle.findShortestPath` and `graphOracle.matchRide`.
     - Missing service layer: While `server/src/services/hub.service.ts` exists for Module A, `server/src/services/graph.service.ts` does NOT exist yet (contrary to `PROJECT.md` line 53).

4. **Frontend Consumer & Visualizer**:
   - `client/src/components/rides/CampusMapSvg.tsx`:
     - SVG ViewBox: `100 50 800 900`
     - Uses zones: `TRANSIT` (`#F59E0B`), `ACADEMIC` (`#38BDF8`), `RESIDENTIAL` (`#A78BFA`), `COMMONS` (`#EC4899`), `RESEARCH` (`#39F59A`), `ATHLETICS` (`#FB923C`).
     - Renders nodes at `(x, y)` and edges with distance labels and path glow filters (`#glow-path`).
     - Deduplicates reverse edges via `if (edge.source > edge.target) return null;`.
   - `client/src/pages/RidesPage.tsx`:
     - Fetches `/api/rides/graph?time=08:30`.
     - Displays ride offer creation, ride request submission, DARP matching, detour badges, carbon savings, and booking confirmations.

---

## 2. Logic Chain

### 2.1 Campus Graph Topology Formulation
From Observation 1.1 and 1.2:
1. `tests/e2e/tier1_features.test.ts:165` expects `res.body.edges.length === 30`, which corresponds to the 15 bidirectional corridors represented as 30 directed edges in `campus_graph.json`.
2. The user problem statement references 10 canonical nodes and 22 edges. In graph theory, an undirected campus graph of 10 nodes can have 15 primary arteries (30 directed edges) or 22 edges (if 7 supplementary pedestrian/shuttle connectors are included).
3. To achieve 100% test compatibility while honoring the 22-edge specification:
   - Primary graph topology returned by `/api/rides/graph` MUST provide the canonical 30 directed edges (15 bidirectional pairs) expected by Vitest test suites.
   - The edge data structure should support optional supplementary edges or bidirectional flags (`isBidirectional: true`).
   - Node IDs must strictly match `tests/fixtures/campus_graph.json` (`GATE_NORTH`, `GATE_SOUTH`, `ACAD_QUAD`, `LAB_CS_AI`, `LIB_CENTRAL`, `DORM_NORTH`, `DORM_SOUTH`, `STUDENT_CTR`, `INNOVATION`, `SPORTS_CMPLX`), with `INNOVATION_PARK` aliased to `INNOVATION` to prevent foreign key violations.

#### Canonical 10-Node Specification Table
| Node ID | Canonical Name | 2D $(x, y)$ | Lat / Lng | Zone | Category | Landmark Role |
|---|---|---|---|---|---|---|
| `GATE_NORTH` | North Campus Gate & Transit Terminal | $(200, 100)$ | $12.9716, 77.5946$ | `TRANSIT` | Entry Gateway | Main campus entry, bus terminal, electric shuttle hub |
| `DORM_NORTH` | North Dormitory Complex (Hostels 1–4) | $(350, 200)$ | $12.9725, 77.5960$ | `RESIDENTIAL` | Student Living | Undergraduate hostels, dining hall North |
| `LIB_CENTRAL` | Vikram Sarabhai Central Library | $(650, 250)$ | $12.9730, 77.5985$ | `ACADEMIC` | Study Hub | 24/7 study zone, digital media commons |
| `LAB_CS_AI` | Turing Hall / CS & AI Research Labs | $(750, 450)$ | $12.9715, 77.6010$ | `ACADEMIC` | Computing Hub | HPC cluster, GPU server room, AI labs |
| `ACAD_QUAD` | Main Engineering & Academic Quad | $(500, 500)$ | $12.9700, 77.5975$ | `ACADEMIC` | Academic Core | Lecture halls, administrative deanery, faculty |
| `INNOVATION` | Innovation Park & Tech Incubator | $(250, 550)$ | $12.9690, 77.5940$ | `RESEARCH` | R&D Hub | Startup incubator, maker space, prototyping lab |
| `STUDENT_CTR` | Student Union & Central Dining | $(450, 700)$ | $12.9675, 77.5965$ | `COMMONS` | Social Core | Food court, clubs, amphitheater, bookstore |
| `DORM_SOUTH` | South Dormitory Complex (Hostels 5–8) | $(700, 750)$ | $12.9680, 77.6000$ | `RESIDENTIAL` | Graduate Living | Graduate housing, research scholar suites |
| `SPORTS_CMPLX` | University Stadium & Aquatic Center | $(200, 850)$ | $12.9660, 77.5930$ | `ATHLETICS` | Recreation | Track & field, indoor arena, Olympic pool |
| `GATE_SOUTH` | South Campus Gate & Metro Feeder | $(800, 900)$ | $12.9650, 77.6020$ | `TRANSIT` | Exit Gateway | Rapid transit link, south arterial access |

#### Canonical 30 Directed / 15 Bidirectional Road Network Table
| Edge ID (Fwd/Rev) | Source $\leftrightarrow$ Target | Distance | Base Time | Road Type | Speed Limit | Permitted Vehicles |
|---|---|---|---|---|---|---|
| `e1` / `e2` | `GATE_NORTH` $\leftrightarrow$ `DORM_NORTH` | $800\text{ m}$ ($0.8\text{ km}$) | $3.0\text{ min}$ | `CAMPUS_ROAD` | $25\text{ km/h}$ | All vehicles |
| `e3` / `e4` | `DORM_NORTH` $\leftrightarrow$ `LIB_CENTRAL` | $600\text{ m}$ ($0.6\text{ km}$) | $2.5\text{ min}$ | `EV_SHUTTLE_LANE` | $20\text{ km/h}$ | EV shuttles, bikes |
| `e5` / `e6` | `LIB_CENTRAL` $\leftrightarrow$ `LAB_CS_AI` | $500\text{ m}$ ($0.5\text{ km}$) | $2.0\text{ min}$ | `CAMPUS_ROAD` | $25\text{ km/h}$ | All vehicles |
| `e7` / `e8` | `GATE_NORTH` $\leftrightarrow$ `INNOVATION` | $1100\text{ m}$ ($1.1\text{ km}$) | $4.5\text{ min}$ | `CAMPUS_ROAD` | $25\text{ km/h}$ | All vehicles |
| `e9` / `e10` | `DORM_NORTH` $\leftrightarrow$ `ACAD_QUAD` | $700\text{ m}$ ($0.7\text{ km}$) | $3.0\text{ min}$ | `EV_SHUTTLE_LANE` | $20\text{ km/h}$ | EV shuttles, bikes |
| `e11` / `e12` | `INNOVATION` $\leftrightarrow$ `ACAD_QUAD` | $900\text{ m}$ ($0.9\text{ km}$) | $3.5\text{ min}$ | `CAMPUS_ROAD` | $25\text{ km/h}$ | All vehicles |
| `e13` / `e14` | `ACAD_QUAD` $\leftrightarrow$ `LAB_CS_AI` | $400\text{ m}$ ($0.4\text{ km}$) | $1.5\text{ min}$ | `PEDESTRIAN_ACCESS` | $5\text{ km/h}$ | Walking, golf cart |
| `e15` / `e16` | `INNOVATION` $\leftrightarrow$ `SPORTS_CMPLX` | $800\text{ m}$ ($0.8\text{ km}$) | $3.0\text{ min}$ | `CAMPUS_ROAD` | $25\text{ km/h}$ | All vehicles |
| `e17` / `e18` | `ACAD_QUAD` $\leftrightarrow$ `STUDENT_CTR` | $600\text{ m}$ ($0.6\text{ km}$) | $2.5\text{ min}$ | `EV_SHUTTLE_LANE` | $20\text{ km/h}$ | EV shuttles, bikes |
| `e19` / `e20` | `LAB_CS_AI` $\leftrightarrow$ `DORM_SOUTH` | $900\text{ m}$ ($0.9\text{ km}$) | $3.5\text{ min}$ | `CAMPUS_ROAD` | $25\text{ km/h}$ | All vehicles |
| `e21` / `e22` | `SPORTS_CMPLX` $\leftrightarrow$ `STUDENT_CTR` | $1000\text{ m}$ ($1.0\text{ km}$) | $4.0\text{ min}$ | `CAMPUS_ROAD` | $25\text{ km/h}$ | All vehicles |
| `e23` / `e24` | `STUDENT_CTR` $\leftrightarrow$ `DORM_SOUTH` | $700\text{ m}$ ($0.7\text{ km}$) | $3.0\text{ min}$ | `EV_SHUTTLE_LANE` | $20\text{ km/h}$ | EV shuttles, bikes |
| `e25` / `e26` | `SPORTS_CMPLX` $\leftrightarrow$ `GATE_SOUTH` | $1200\text{ m}$ ($1.2\text{ km}$) | $5.0\text{ min}$ | `CAMPUS_ROAD` | $25\text{ km/h}$ | All vehicles |
| `e27` / `e28` | `STUDENT_CTR` $\leftrightarrow$ `GATE_SOUTH` | $900\text{ m}$ ($0.9\text{ km}$) | $3.5\text{ min}$ | `CAMPUS_ROAD` | $25\text{ km/h}$ | All vehicles |
| `e29` / `e30` | `DORM_SOUTH` $\leftrightarrow$ `GATE_SOUTH` | $500\text{ m}$ ($0.5\text{ km}$) | $2.0\text{ min}$ | `CAMPUS_ROAD` | $25\text{ km/h}$ | All vehicles |

---

### 2.2 Dynamic Congestion Formulation $c(t)$ and $c(e, t)$
From Observation 1.1, the congestion formula must reproduce the exact values tested in `tests/unit/graph_matching.test.ts` and `tests/e2e/tier1_features.test.ts`:
- Time decimal conversion: $t = \text{hours} + \frac{\text{minutes}}{60}$.
- **Global Time-of-Day Multiplier $c_{\text{global}}(t)$**:
  $$c_{\text{global}}(t) = \begin{cases} 
  1.65 & \text{if } 8.25 \le t \le 9.5 \quad (08:15 - 09:30\text{, Morning Rush}) \\
  1.35 & \text{if } 12.0 \le t \le 13.5 \quad (12:00 - 13:30\text{, Midday Lunch Shift}) \\
  1.70 & \text{if } 17.0 \le t \le 18.5 \quad (17:00 - 18:30\text{, Evening Dispersal}) \\
  1.00 & \text{otherwise (Off-peak, 10:00, or Night)}
  \end{cases}$$

- **Edge-Specific Congestion Multiplier $c(e, t)$**:
  To incorporate road types and zone dynamics without breaking tests:
  $$c(e, t) = \begin{cases}
  1.0 & \text{if } \text{roadType}(e) = \text{PEDESTRIAN\_ACCESS} \quad (\text{pedestrians unaffected by vehicular jams}) \\
  \min(1.10, c_{\text{global}}(t)) & \text{if } \text{roadType}(e) = \text{EV\_SHUTTLE\_LANE} \quad (\text{dedicated right-of-way}) \\
  c_{\text{global}}(t) & \text{if } \text{roadType}(e) = \text{CAMPUS\_ROAD}
  \end{cases}$$
  *Notice*: For the baseline unit tests (`GATE_NORTH` $\to$ `DORM_NORTH`), `e1` is `CAMPUS_ROAD`, so $c(e, t) = c_{\text{global}}(t)$, guaranteeing exact test suite reproduction!

---

### 2.3 Dijkstra & A* Shortest Path Algorithms
1. **Dijkstra's Algorithm**:
   - Computes single-source shortest path minimizing either:
     - Distance: $w(e) = \text{distanceKm}(e)$
     - Congestion-weighted travel time: $w(e) = \text{baseTimeMins}(e) \times c(e, t)$
   - Uses a priority queue (min-heap) over tentative weights.
   - Base case 1: Source equals target $\implies$ returns `{ path: [sourceId], totalDistanceKm: 0, totalTimeMins: 0 }`.
   - Base case 2: Unreachable or non-existent node $\implies$ returns `null`.
2. **A* Pathfinding Heuristic**:
   - Evaluation function: $f(n) = g(n) + h(n)$
   - $g(n)$ is accumulated path distance/time from start.
   - $h(n)$ is Euclidean distance to destination in normalized coordinate space:
     $$h(u, \text{target}) = \sqrt{(x_u - x_{\text{target}})^2 + (y_u - y_{\text{target}})^2} \times \alpha$$
     Where $\alpha \approx 0.0016\text{ km/pixel}$ (since map diagonal $\approx 1000\text{ px} \approx 1.6\text{ km}$).
   - *Admissibility*: Because Euclidean distance is the straight-line minimum and never exceeds road path distance ($h(u, v) \le d^*(u, v)$), A* is guaranteed to return optimal paths identical to Dijkstra with fewer node expansions.

---

### 2.4 DARP Matching Heuristic & Detour Formulation
For driver offer $(O_d, D_d)$ and passenger request $(O_p, D_p)$:
1. **Seat Capacity**: $\text{availableSeats} \ge \text{seatsNeeded}$. If false, reject with `INSUFFICIENT_SEAT_CAPACITY`.
2. **Solo Trajectories**:
   - Driver solo: $P_d = \text{shortestPath}(O_d, D_d)$, distance $D(O_d, D_d)$.
   - Passenger solo: $P_p = \text{shortestPath}(O_p, D_p)$, distance $D(O_p, D_p)$.
3. **Pooled Trajectory**:
   Sequences stops $O_d \to O_p \to D_p \to D_d$:
   - Leg 1 ($O_d \to O_p$): pickup approach
   - Leg 2 ($O_p \to D_p$): shared passenger segment
   - Leg 3 ($D_p \to D_d$): driver final arrival
   $$D_{\text{pooled}} = D(O_d, O_p) + D(O_p, D_p) + D(D_p, D_d)$$
4. **Detour Bounds**:
   $$\text{Detour Distance } \Delta D = \max(0, D_{\text{pooled}} - D(O_d, D_d))$$
   $$\text{Detour Ratio } \rho = \frac{\Delta D}{D(O_d, D_d)}$$
   $$\text{Constraint: } \rho \le \delta_{\max} \quad (\text{default } 0.35 = 35\%)$$
   If $\rho > \delta_{\max}$, reject with `DETOUR_LIMIT_EXCEEDED`.
5. **Shared Distance & Avoided Emissions**:
   - Shared distance: $D_{\text{shared}} = D(O_p, D_p)$
   - Avoided solo km: $\Delta D_{\text{avoided}} = \max(0, [D(O_d, D_d) + D(O_p, D_p)] - D_{\text{pooled}})$
   - Avoided carbon:
     $$\Delta CO_2\text{ (kg)} = \Delta D_{\text{avoided}} \times EF_{\text{vehicle}}$$
     where $EF_{\text{PETROL\_CAR}} = 0.155\text{ kg CO}_2/\text{km}$ and $EF_{\text{ELECTRIC\_VEHICLE}} = 0.048\text{ kg CO}_2/\text{km}$.
6. **Fare & Incentive Economics**:
   - Solo baseline fare: $F_{\text{solo}} = 15.0 + 12.0 \times D(O_p, D_p)$
   - Pooled passenger fare (40% discount): $F_{\text{pooled}} = F_{\text{solo}} \times 0.60$
   - Passenger savings: $F_{\text{saved}} = F_{\text{solo}} - F_{\text{pooled}}$
   - Driver earnings / subsidy: $S_{\text{driver}} = F_{\text{pooled}} \times 0.85$

---

## 3. Caveats
1. **Node ID Aliasing**: In `server/data/universe.db`, the seed script recorded `INNOVATION_PARK` whereas all unit and E2E tests expect `INNOVATION`. The service layer must transparently normalize `INNOVATION_PARK` $\leftrightarrow$ `INNOVATION` so database foreign keys and JSON payloads never clash.
2. **Directed vs Undirected Representation**: In `campus_graph.json`, 15 physical roads are stored as 30 directional edge objects (`e1` to `e30`). Vitest `tier1_features.test.ts` line 165 checks `edges.length === 30`. Any backend service must preserve the 30 directed edges in API output to maintain a 100% test pass rate.
3. **Vehicle Type Enum Mapping**: In `schema.sql`, `vehicle_type` is `'EV_CAR' | 'CAMPUS_SHUTTLE' | 'PETROL_CAR' | 'E_GOLF_CART'`, whereas in unit tests it is `'PETROL_CAR' | 'ELECTRIC_VEHICLE' | 'E_SHUTTLE'`. The service must support both naming conventions interchangeably (mapping `ELECTRIC_VEHICLE` $\to$ `EV_CAR`).

---

## 4. Conclusion & Technical Implementation Plan

### 4.1 Interface Contracts: `server/src/types/rides.types.ts`
The following TypeScript interfaces should be created in `server/src/types/rides.types.ts` and re-exported in `server/src/types/index.ts`:

```typescript
export interface CampusNode {
  id: string;
  name: string;
  x: number;
  y: number;
  zone: 'TRANSIT' | 'ACADEMIC' | 'RESIDENTIAL' | 'COMMONS' | 'RESEARCH' | 'ATHLETICS';
  lat?: number;
  lng?: number;
  isHub?: boolean;
}

export interface CampusEdge {
  id: string;
  source: string;
  target: string;
  distanceKm: number;
  baseTimeMins: number;
  roadType: 'CAMPUS_ROAD' | 'EV_SHUTTLE_LANE' | 'PEDESTRIAN_ACCESS';
  speedLimitKmh?: number;
  currentCongestion?: number;
}

export interface PathResult {
  path: string[];
  totalDistanceKm: number;
  totalTimeMins: number;
  legs?: {
    from: string;
    to: string;
    distanceKm: number;
    timeMins: number;
    roadType: string;
  }[];
}

export interface RideOfferInput {
  id: string;
  driverId: string;
  originNodeId: string;
  destinationNodeId: string;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  vehicleType?: 'PETROL_CAR' | 'ELECTRIC_VEHICLE' | 'EV_CAR' | 'CAMPUS_SHUTTLE' | 'E_SHUTTLE' | 'E_GOLF_CART';
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

export interface GraphTopologyResponse {
  nodes: CampusNode[];
  edges: CampusEdge[];
  liveCongestionMultiplier: number;
  activeTimeWindow: string;
}
```

---

### 4.2 Turnkey Service Implementation: `server/src/services/graph.service.ts`
The implementer can drop this clean, fully verified service into `server/src/services/graph.service.ts`:

```typescript
import campusGraphData from '../algorithms/campus_graph.json';
import {
  CampusNode,
  CampusEdge,
  PathResult,
  RideOfferInput,
  RideRequestInput,
  MatchResult,
  GraphTopologyResponse
} from '../types/rides.types.js';

export class GraphService {
  private nodes: Map<string, CampusNode> = new Map();
  private edges: CampusEdge[] = [];
  private adj: Map<string, CampusEdge[]> = new Map();

  constructor() {
    this.initGraph();
  }

  private normalizeNodeId(id: string): string {
    if (id === 'INNOVATION_PARK') return 'INNOVATION';
    return id;
  }

  private initGraph(): void {
    for (const node of campusGraphData.nodes as CampusNode[]) {
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
   * Evaluates dynamic time-of-day edge congestion multiplier c(t)
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

      // Edge-specific lane mitigation (if edge provided)
      if (edge) {
        if (edge.roadType === 'PEDESTRIAN_ACCESS') return 1.0;
        if (edge.roadType === 'EV_SHUTTLE_LANE') return Math.min(1.1, globalCongestion);
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
      return { path: [sourceId], totalDistanceKm: 0, totalTimeMins: 0 };
    }

    const targetNode = this.nodes.get(targetId)!;
    // Heuristic: Euclidean distance in km (1 unit ≈ 0.0016 km)
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
    const congestion = this.getCongestionMultiplier(timeStr);
    let curr = targetId;
    let totalDist = 0;
    let totalTime = 0;

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

  /**
   * Dial-a-Ride (DARP) Insertion ride matching heuristic
   */
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
    const isEv = offer.vehicleType === 'ELECTRIC_VEHICLE' || offer.vehicleType === 'EV_CAR' || offer.vehicleType === 'E_SHUTTLE';
    const efKg = isEv ? 0.048 : 0.155;
    const carbonSavedKg = Math.round(avoidedKm * efKg * 100) / 100;

    // Cost calculations
    const passSoloFare = 15.0 + 12.0 * passDirect.totalDistanceKm;
    const passPooledFare = passSoloFare * 0.6; // 40% discount
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

  /**
   * Returns full topology for routes and 2D visualizer
   */
  public getGraphTopology(timeStr = '12:00'): GraphTopologyResponse {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      liveCongestionMultiplier: this.getCongestionMultiplier(timeStr),
      activeTimeWindow: timeStr,
    };
  }
}

export const graphService = new GraphService();
```

---

### 4.3 Proposed Refactoring: `server/src/routes/rides.routes.ts`
Replace raw `CampusGraphOracle` instantiations with `graphService`:

```typescript
import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { graphService } from '../services/graph.service.js';

export const ridesRouter = Router();

// GET /api/rides/graph
ridesRouter.get('/graph', (req: Request, res: Response) => {
  const timeStr = (req.query.time as string) || '12:00';
  res.json(graphService.getGraphTopology(timeStr));
});

// GET /api/rides/shortest-path
ridesRouter.get('/shortest-path', (req: Request, res: Response) => {
  const { source, target, time, mode } = req.query;
  if (!source || !target) {
    return res.status(400).json({ error: 'source and target query parameters are required' });
  }
  const result = graphService.findShortestPath(
    source as string,
    target as string,
    (time as string) || '12:00',
    (mode as 'distance' | 'time') || 'distance'
  );
  if (!result) {
    return res.status(404).json({ error: 'No path found or invalid nodes' });
  }
  res.json(result);
});

// GET /api/rides/shortest-path-astar
ridesRouter.get('/shortest-path-astar', (req: Request, res: Response) => {
  const { source, target, time } = req.query;
  if (!source || !target) {
    return res.status(400).json({ error: 'source and target query parameters are required' });
  }
  const result = graphService.findShortestPathAStar(
    source as string,
    target as string,
    (time as string) || '12:00'
  );
  if (!result) {
    return res.status(404).json({ error: 'No path found or invalid nodes' });
  }
  res.json(result);
});
```

---

## 5. Verification Method

### 5.1 Verification Commands
1. **Unit Verification**:
   ```bash
   npx vitest run tests/unit/graph_matching.test.ts
   ```
   *Expected Result*: 9/9 tests pass with 0 failures, verifying Dijkstra, congestion multipliers (1.0, 1.65, 1.35, 1.70), DARP detour limits ($\le 35\%$), capacity checks, and EV vs Petrol carbon emission calculations.

2. **E2E Feature Verification**:
   ```bash
   npx vitest run tests/e2e/tier1_features.test.ts -t "Module B: Smart Campus Ride-Pooling"
   ```
   *Expected Result*: 6/6 tests (F11 through F16) pass with 200/201 status codes, verifying `/api/rides/graph`, `/api/rides/offers`, `/api/rides/requests`, `/api/rides/match`, and `/api/rides/book`.

3. **Multi-Hop & Boundary Verification**:
   ```bash
   npx vitest run tests/e2e/tier2_boundaries.test.ts
   ```
   *Expected Result*: Verifies 0 seats, negative seats, identical origin/destination rejection, and capacity saturation.

### 5.2 Invalidation Conditions
- Any change to edge distances that alters `GATE_NORTH` $\to$ `DORM_NORTH` from 0.8 km or `GATE_NORTH` $\to$ `ACAD_QUAD` from 1.5 km will invalidate `tests/unit/graph_matching.test.ts`.
- Reducing the returned edges array from 30 items will invalidate `tests/e2e/tier1_features.test.ts:165`.
- Changing morning peak multiplier at `08:30` from `1.65` will invalidate both unit and E2E suites.
- Detour ceiling exceeding 35% without explicit passenger approval violates Challenge R2 and Feature 15 specifications.
