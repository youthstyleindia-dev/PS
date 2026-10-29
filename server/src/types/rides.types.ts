export interface CampusNode {
  id: string;
  name: string;
  x: number;
  y: number;
  zone: 'TRANSIT' | 'ACADEMIC' | 'RESIDENTIAL' | 'COMMONS' | 'RESEARCH' | 'ATHLETICS' | string;
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
  roadType: 'CAMPUS_ROAD' | 'EV_SHUTTLE_LANE' | 'PEDESTRIAN_ACCESS' | string;
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

export type VehicleType =
  | 'EV_CAR'
  | 'CAMPUS_SHUTTLE'
  | 'PETROL_CAR'
  | 'E_GOLF_CART'
  | 'ELECTRIC_VEHICLE'
  | 'E_SHUTTLE'
  | string;

export interface RideOfferInput {
  id?: string;
  driverId: string;
  originNodeId: string;
  destinationNodeId: string;
  departureTime: string;
  totalSeats: number;
  availableSeats?: number;
  vehicleType?: VehicleType;
  maxDetourRatio?: number;
  status?: string;
  plannedRoute?: string[];
}

export interface RideOfferRecord {
  id: string;
  driverId: string;
  originNodeId: string;
  destinationNodeId: string;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  vehicleType: VehicleType;
  maxDetourRatio?: number;
  status?: string;
  plannedRoute?: string[];
  driverName?: string;
  driverAvatar?: string;
  driverDept?: string;
}

export interface RideRequestInput {
  id?: string;
  passengerId: string;
  originNodeId: string;
  destinationNodeId: string;
  desiredTime?: string;
  desiredDepartureTime?: string;
  seatsNeeded?: number;
  maxDetourRatio?: number;
  status?: string;
}

export interface RideRequestRecord {
  id: string;
  passengerId: string;
  originNodeId: string;
  destinationNodeId: string;
  desiredTime: string;
  seatsNeeded: number;
  maxDetourRatio?: number;
  status?: string;
  passengerName?: string;
  passengerAvatar?: string;
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
  provenance: '[ESTIMATED METRIC]';
}

export interface BookingResult {
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

export interface GraphTopologyResponse {
  nodes: CampusNode[];
  edges: CampusEdge[];
  liveCongestionMultiplier: number;
  activeTimeWindow: string;
}
