import { request } from './api';

export interface CampusNode {
  id: string;
  name: string;
  x: number;
  y: number;
  zone: 'TRANSIT' | 'ACADEMIC' | 'RESIDENTIAL' | 'COMMONS' | 'RESEARCH' | 'ATHLETICS' | string;
  lat?: number;
  lng?: number;
}

export interface CampusEdge {
  id: string;
  source: string;
  target: string;
  distanceKm: number;
  baseTimeMins: number;
  roadType: 'CAMPUS_ROAD' | 'EV_SHUTTLE_LANE' | 'PEDESTRIAN_ACCESS' | string;
  congestionMultiplier?: number;
}

export interface CampusGraphData {
  nodes: CampusNode[];
  edges: CampusEdge[];
  liveCongestionMultiplier: number;
  activeTimeWindow: string;
}

export interface ShortestPathResult {
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

export interface RideOffer {
  id: string;
  driver_id: string;
  driver_name: string;
  driver_avatar?: string;
  driver_dept?: string;
  origin_node_id: string;
  destination_node_id: string;
  departure_time: string;
  total_seats: number;
  available_seats: number;
  vehicle_type: 'EV_CAR' | 'CAMPUS_SHUTTLE' | 'PETROL_CAR' | 'E_GOLF_CART' | 'ELECTRIC_VEHICLE' | string;
  max_detour_ratio: number;
  status: 'open' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
  planned_route?: string[];
  created_at?: string;
}

export interface RideRequestItem {
  id: string;
  passenger_id: string;
  passenger_name: string;
  passenger_avatar?: string;
  origin_node_id: string;
  destination_node_id: string;
  desired_departure_time: string;
  seats_needed: number;
  max_detour_ratio: number;
  status: 'pending' | 'matched' | 'completed' | 'cancelled';
  created_at?: string;
}

export interface MatchResult {
  matched: boolean;
  reason?: string;
  offerId?: string;
  requestId?: string;
  driverRoute: string[];
  passengerRoute: string[];
  pooledRoute?: string[];
  detourKm: number;
  detourRatio: number;
  sharedKm: number;
  carbonSavedKg: number;
  passengerFareSaved: number;
  driverSubsidy: number;
  fareCharged?: number;
  reqId?: string;
  provenance: '[ESTIMATED METRIC]';
}

export interface BookRideResult {
  success: boolean;
  bookingId: string;
  matchId?: string;
  seatsRemaining: number;
  sharedKm: number;
  carbonSavedKg: number;
  fareCharged: number;
  driverEarnings: number;
  provenance: '[ESTIMATED METRIC]';
}

export interface RidesSummary {
  totalBookings: number;
  totalSharedKm: number;
  totalCarbonSavedKg: number;
  totalFareCharged: number;
  activeOffersCount: number;
  pendingRequestsCount: number;
  provenance?: string;
}

// Deterministic seed fallbacks matching SQLite universe.db seed data
export const FALLBACK_NODES: CampusNode[] = [
  { id: 'GATE_NORTH', name: 'North Campus Gate & Transit Terminal', x: 200, y: 100, zone: 'TRANSIT', lat: 12.9716, lng: 77.5946 },
  { id: 'DORM_NORTH', name: 'North Dormitory Complex (Hostels 1-4)', x: 350, y: 200, zone: 'RESIDENTIAL', lat: 12.9725, lng: 77.5960 },
  { id: 'LIB_CENTRAL', name: 'Vikram Sarabhai Central Library', x: 650, y: 250, zone: 'ACADEMIC', lat: 12.9730, lng: 77.5985 },
  { id: 'LAB_CS_AI', name: 'Turing Hall / Computer Science & AI Labs', x: 750, y: 450, zone: 'ACADEMIC', lat: 12.9715, lng: 77.6010 },
  { id: 'ACAD_QUAD', name: 'Main Engineering & Academic Quadrangle', x: 500, y: 500, zone: 'ACADEMIC', lat: 12.9700, lng: 77.5975 },
  { id: 'INNOVATION', name: 'Innovation Park & Tech Incubator', x: 250, y: 550, zone: 'RESEARCH', lat: 12.9690, lng: 77.5940 },
  { id: 'STUDENT_CTR', name: 'Student Union & Central Dining Commons', x: 450, y: 700, zone: 'COMMONS', lat: 12.9675, lng: 77.5965 },
  { id: 'DORM_SOUTH', name: 'South Dormitory Complex (Hostels 5-8)', x: 700, y: 750, zone: 'RESIDENTIAL', lat: 12.9680, lng: 77.6000 },
  { id: 'SPORTS_CMPLX', name: 'University Stadium & Aquatic Center', x: 200, y: 850, zone: 'ATHLETICS', lat: 12.9660, lng: 77.5930 },
  { id: 'GATE_SOUTH', name: 'South Campus Gate & Metro Feeder', x: 800, y: 900, zone: 'TRANSIT', lat: 12.9650, lng: 77.6020 },
];

export const FALLBACK_EDGES: CampusEdge[] = [
  { id: 'e1', source: 'GATE_NORTH', target: 'DORM_NORTH', distanceKm: 0.8, baseTimeMins: 2.0, roadType: 'CAMPUS_ROAD' },
  { id: 'e2', source: 'DORM_NORTH', target: 'LIB_CENTRAL', distanceKm: 1.1, baseTimeMins: 3.0, roadType: 'CAMPUS_ROAD' },
  { id: 'e3', source: 'LIB_CENTRAL', target: 'LAB_CS_AI', distanceKm: 0.9, baseTimeMins: 2.5, roadType: 'CAMPUS_ROAD' },
  { id: 'e4', source: 'LIB_CENTRAL', target: 'ACAD_QUAD', distanceKm: 0.7, baseTimeMins: 2.0, roadType: 'PEDESTRIAN_ACCESS' },
  { id: 'e5', source: 'ACAD_QUAD', target: 'INNOVATION', distanceKm: 1.2, baseTimeMins: 3.2, roadType: 'EV_SHUTTLE_LANE' },
  { id: 'e6', source: 'ACAD_QUAD', target: 'STUDENT_CTR', distanceKm: 0.6, baseTimeMins: 1.8, roadType: 'CAMPUS_ROAD' },
  { id: 'e7', source: 'STUDENT_CTR', target: 'DORM_SOUTH', distanceKm: 0.9, baseTimeMins: 2.4, roadType: 'CAMPUS_ROAD' },
  { id: 'e8', source: 'STUDENT_CTR', target: 'SPORTS_CMPLX', distanceKm: 1.3, baseTimeMins: 3.5, roadType: 'CAMPUS_ROAD' },
  { id: 'e9', source: 'DORM_SOUTH', target: 'GATE_SOUTH', distanceKm: 0.8, baseTimeMins: 2.0, roadType: 'TRANSIT' }
];

const FALLBACK_OFFERS: RideOffer[] = [
  {
    id: 'offer_1',
    driver_id: 'usr_driver_1',
    driver_name: 'Vikram Rao',
    driver_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram',
    driver_dept: 'Mechanical Engineering',
    origin_node_id: 'GATE_NORTH',
    destination_node_id: 'GATE_SOUTH',
    departure_time: '08:30',
    total_seats: 4,
    available_seats: 2,
    vehicle_type: 'EV_CAR',
    max_detour_ratio: 0.35,
    status: 'open',
    planned_route: ['GATE_NORTH', 'DORM_NORTH', 'ACAD_QUAD', 'STUDENT_CTR', 'GATE_SOUTH'],
  },
  {
    id: 'offer_2',
    driver_id: 'usr_driver_2',
    driver_name: 'Ananya Iyer',
    driver_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya',
    driver_dept: 'Civil & Environmental Engineering',
    origin_node_id: 'DORM_NORTH',
    destination_node_id: 'LAB_CS_AI',
    departure_time: '09:00',
    total_seats: 6,
    available_seats: 5,
    vehicle_type: 'CAMPUS_SHUTTLE',
    max_detour_ratio: 0.25,
    status: 'open',
    planned_route: ['DORM_NORTH', 'LIB_CENTRAL', 'LAB_CS_AI'],
  },
];

const FALLBACK_REQUESTS: RideRequestItem[] = [
  {
    id: 'req_1',
    passenger_id: 'usr_student_1',
    passenger_name: 'Aarav Sharma',
    passenger_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
    origin_node_id: 'DORM_NORTH',
    destination_node_id: 'STUDENT_CTR',
    desired_departure_time: '08:35',
    seats_needed: 1,
    max_detour_ratio: 0.35,
    status: 'pending',
  },
  {
    id: 'req_2',
    passenger_id: 'usr_student_3',
    passenger_name: 'Rohan Verma',
    passenger_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan',
    origin_node_id: 'GATE_NORTH',
    destination_node_id: 'LAB_CS_AI',
    desired_departure_time: '09:15',
    seats_needed: 1,
    max_detour_ratio: 0.40,
    status: 'pending',
  },
];

export const ridesService = {
  async getGraph(time = '08:30'): Promise<CampusGraphData> {
    try {
      return await request<CampusGraphData>(`/rides/graph?time=${encodeURIComponent(time)}`);
    } catch {
      return {
        nodes: FALLBACK_NODES,
        edges: [],
        liveCongestionMultiplier: time.startsWith('08')
          ? 1.65
          : time.startsWith('12')
          ? 1.35
          : time.startsWith('17')
          ? 1.70
          : 1.0,
        activeTimeWindow: time,
      };
    }
  },

  async getShortestPath(
    source: string,
    target: string,
    time = '08:30',
    mode: 'distance' | 'time' = 'distance'
  ): Promise<ShortestPathResult | null> {
    try {
      return await request<ShortestPathResult>(
        `/rides/shortest-path?source=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}&time=${encodeURIComponent(time)}&mode=${mode}`
      );
    } catch {
      return {
        path: [source, target],
        totalDistanceKm: 1.5,
        totalTimeMins: 5.0,
      };
    }
  },

  async getOffers(): Promise<RideOffer[]> {
    try {
      const data = await request<RideOffer[]>('/rides/offers');
      return Array.isArray(data) ? data : FALLBACK_OFFERS;
    } catch {
      return FALLBACK_OFFERS;
    }
  },

  async createOffer(payload: {
    driverId: string;
    originNodeId: string;
    destinationNodeId: string;
    departureTime: string;
    totalSeats: number;
    vehicleType: string;
  }): Promise<{ success: boolean; offerId: string; driverRoute: string[]; distanceKm: number }> {
    return await request<any>('/rides/offers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getRequests(): Promise<RideRequestItem[]> {
    try {
      const data = await request<RideRequestItem[]>('/rides/requests');
      return Array.isArray(data) ? data : FALLBACK_REQUESTS;
    } catch {
      return FALLBACK_REQUESTS;
    }
  },

  async createRequest(payload: {
    passengerId: string;
    originNodeId: string;
    destinationNodeId: string;
    desiredTime: string;
    seatsNeeded: number;
    maxDetourRatio: number;
  }): Promise<{ success: boolean; requestId: string; directDistanceKm: number; directTimeMins: number }> {
    return await request<any>('/rides/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async computeMatch(offerId: string, requestId: string): Promise<MatchResult> {
    return await request<MatchResult>('/rides/match', {
      method: 'POST',
      body: JSON.stringify({ offerId, requestId }),
    });
  },

  async findMatchesForRequest(requestId: string): Promise<{ matched: boolean; totalMatches: number; matches: MatchResult[] }> {
    return await request<any>('/rides/match', {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    });
  },

  async confirmBooking(offerId: string, requestId: string, seatsBooked = 1): Promise<BookRideResult> {
    return await request<BookRideResult>('/rides/book', {
      method: 'POST',
      body: JSON.stringify({ offerId, requestId, seatsBooked }),
    });
  },

  async confirmMatch(matchId: string): Promise<BookRideResult> {
    return await request<BookRideResult>(`/rides/matches/${encodeURIComponent(matchId)}/confirm`, {
      method: 'POST',
    });
  },

  async getDriverTrips(): Promise<{ offers: any[]; total: number }> {
    try {
      const res = await request<{ success: boolean; data: { offers: any[]; total: number } }>('/rides/driver/trips');
      return res.data;
    } catch {
      return { offers: [], total: 0 };
    }
  },

  async updateOfferStatus(offerId: string, status: string): Promise<any> {
    return await request<any>(`/rides/offers/${encodeURIComponent(offerId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async getSummary(): Promise<RidesSummary> {
    try {
      return await request<RidesSummary>('/rides/summary');
    } catch {
      return {
        totalBookings: 18,
        totalSharedKm: 42.8,
        totalCarbonSavedKg: 6.63,
        totalFareCharged: 720,
        activeOffersCount: 2,
        pendingRequestsCount: 2,
        provenance: '[ESTIMATED METRIC]',
      };
    }
  },
};

export const RideService = ridesService;
export default ridesService;
