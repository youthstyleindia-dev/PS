import Database from 'better-sqlite3';
import { graphService, GraphService } from './graph.service.js';
import {
  RideOfferInput,
  RideOfferRecord,
  RideRequestInput,
  RideRequestRecord,
  MatchResult,
  BookingResult,
  VehicleType,
} from '../types/rides.types.js';

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

/**
 * Normalizes vehicle type strings across schema and client formats
 */
export function normalizeVehicleType(vType?: string): 'EV_CAR' | 'CAMPUS_SHUTTLE' | 'PETROL_CAR' | 'E_GOLF_CART' {
  if (!vType) return 'EV_CAR';
  const upper = vType.toUpperCase();
  if (upper === 'ELECTRIC_VEHICLE' || upper === 'EV_CAR') return 'EV_CAR';
  if (upper === 'CAMPUS_SHUTTLE' || upper === 'E_SHUTTLE') return 'CAMPUS_SHUTTLE';
  if (upper === 'PETROL_CAR') return 'PETROL_CAR';
  if (upper === 'E_GOLF_CART') return 'E_GOLF_CART';
  return 'EV_CAR';
}

/**
 * Returns vehicle emission factor in kg CO2e per km
 * - PETROL_CAR: 0.155 kg CO2e / km
 * - EV_CAR / ELECTRIC_VEHICLE: 0.048 kg CO2e / km
 * - CAMPUS_SHUTTLE / E_SHUTTLE: 0.032 kg CO2e / km
 * - E_GOLF_CART: 0.025 kg CO2e / km
 */
export function getVehicleEmissionFactor(vehicleType?: string): number {
  const norm = normalizeVehicleType(vehicleType);
  switch (norm) {
    case 'PETROL_CAR':
      return 0.155;
    case 'EV_CAR':
      return 0.048;
    case 'CAMPUS_SHUTTLE':
      return 0.032;
    case 'E_GOLF_CART':
      return 0.025;
    default:
      return 0.155;
  }
}

export class RideMatchingService {
  private graph: GraphService;

  constructor(graph?: GraphService) {
    this.graph = graph || graphService;
  }

  public getCongestionMultiplier(timeStr: string): number {
    return this.graph.getCongestionMultiplier(timeStr);
  }

  public findShortestPath(sourceId: string, targetId: string, timeStr = '12:00') {
    return this.graph.findShortestPath(sourceId, targetId, timeStr);
  }

  /**
   * Dial-a-Ride (DARP) insertion ride matching heuristic
   * Evaluates compatibility between driver ride offer and passenger ride request
   */
  public matchRide(
    offer: RideOfferRecord | RideOfferInput,
    request: RideRequestRecord | RideRequestInput
  ): MatchResult {
    const seatsAvailable = offer.availableSeats ?? offer.totalSeats ?? 1;
    const seatsNeeded = request.seatsNeeded ?? 1;

    // 1. Seat Capacity Constraint
    if (seatsAvailable < seatsNeeded) {
      return {
        matched: false,
        reason: 'INSUFFICIENT_SEAT_CAPACITY',
        offerId: offer.id,
        requestId: request.id,
        driverRoute: [],
        passengerRoute: [],
        detourKm: 0,
        detourRatio: 1.0,
        sharedKm: 0,
        carbonSavedKg: 0,
        passengerFareSaved: 0,
        driverSubsidy: 0,
        provenance: '[ESTIMATED METRIC]',
      };
    }

    const offerTime = offer.departureTime || '12:00';
    const requestTime = request.desiredTime || (request as any).desiredDepartureTime || offerTime;

    // 2. Direct paths
    const driverDirect = this.graph.findShortestPath(offer.originNodeId, offer.destinationNodeId, offerTime);
    const passDirect = this.graph.findShortestPath(request.originNodeId, request.destinationNodeId, requestTime);

    if (!driverDirect || !passDirect) {
      return {
        matched: false,
        reason: 'UNREACHABLE_NODES',
        offerId: offer.id,
        requestId: request.id,
        driverRoute: [],
        passengerRoute: [],
        detourKm: 0,
        detourRatio: 1.0,
        sharedKm: 0,
        carbonSavedKg: 0,
        passengerFareSaved: 0,
        driverSubsidy: 0,
        provenance: '[ESTIMATED METRIC]',
      };
    }

    // 3. Pooled trajectory: Od -> Op -> Dp -> Dd
    const leg1 = this.graph.findShortestPath(offer.originNodeId, request.originNodeId, offerTime);
    const leg2 = this.graph.findShortestPath(request.originNodeId, request.destinationNodeId, offerTime);
    const leg3 = this.graph.findShortestPath(request.destinationNodeId, offer.destinationNodeId, offerTime);

    if (!leg1 || !leg2 || !leg3) {
      return {
        matched: false,
        reason: 'INVALID_POOLED_PATH',
        offerId: offer.id,
        requestId: request.id,
        driverRoute: driverDirect.path,
        passengerRoute: passDirect.path,
        detourKm: 0,
        detourRatio: 1.0,
        sharedKm: 0,
        carbonSavedKg: 0,
        passengerFareSaved: 0,
        driverSubsidy: 0,
        provenance: '[ESTIMATED METRIC]',
      };
    }

    const pooledDist = leg1.totalDistanceKm + leg2.totalDistanceKm + leg3.totalDistanceKm;
    const detourKm = Math.max(0, pooledDist - driverDirect.totalDistanceKm);
    const detourRatio = driverDirect.totalDistanceKm > 0 ? detourKm / driverDirect.totalDistanceKm : 0;
    const maxAllowedDetour = request.maxDetourRatio ?? 0.35;

    // Build seamless node sequence (deduplicating adjacent duplicate nodes)
    const pooledRoute = [
      ...leg1.path,
      ...leg2.path.slice(1),
      ...leg3.path.slice(1),
    ];

    if (detourRatio > maxAllowedDetour) {
      return {
        matched: false,
        reason: 'DETOUR_LIMIT_EXCEEDED',
        offerId: offer.id,
        requestId: request.id,
        driverRoute: driverDirect.path,
        passengerRoute: passDirect.path,
        pooledRoute,
        detourKm: Math.round(detourKm * 100) / 100,
        detourRatio: Math.round(detourRatio * 1000) / 1000,
        sharedKm: 0,
        carbonSavedKg: 0,
        passengerFareSaved: 0,
        driverSubsidy: 0,
        provenance: '[ESTIMATED METRIC]',
      };
    }

    // Shared km is leg2 (passenger segment)
    const sharedKm = leg2.totalDistanceKm;
    const soloSum = driverDirect.totalDistanceKm + passDirect.totalDistanceKm;
    const avoidedKm = Math.max(0, soloSum - pooledDist);

    // Vehicle Emission Factor calculation
    const efKg = getVehicleEmissionFactor(offer.vehicleType);
    const carbonSavedKg = Math.round(avoidedKm * efKg * 100) / 100;

    // Economics: Solo vs Pooled Split
    const passSoloFare = 15.0 + 12.0 * passDirect.totalDistanceKm;
    const passPooledFare = passSoloFare * 0.6; // 40% eco-discount
    const passSavings = Math.round((passSoloFare - passPooledFare) * 100) / 100;
    const driverSubsidy = Math.round(passPooledFare * 0.85 * 100) / 100;

    return {
      matched: true,
      offerId: offer.id,
      requestId: request.id,
      driverRoute: driverDirect.path,
      passengerRoute: passDirect.path,
      pooledRoute,
      detourKm: Math.round(detourKm * 100) / 100,
      detourRatio: Math.round(detourRatio * 1000) / 1000,
      sharedKm: Math.round(sharedKm * 100) / 100,
      carbonSavedKg,
      passengerFareSaved: passSavings,
      driverSubsidy,
      fareCharged: Math.round(passPooledFare * 100) / 100,
      provenance: '[ESTIMATED METRIC]',
    };
  }

  /**
   * Multi-candidate DARP matching: ranks all compatible offers for a passenger request
   */
  public findRankedMatchesForRequest(db: Database.Database, requestId: string): MatchResult[] {
    const request = db.prepare('SELECT * FROM ride_requests WHERE id = ?').get(requestId) as any;
    if (!request) return [];

    const openOffers = db.prepare(`
      SELECT * FROM ride_offers 
      WHERE status = 'open' AND available_seats >= ?
      ORDER BY departure_time ASC
    `).all(request.seats_needed || 1) as any[];

    const results: MatchResult[] = [];
    for (const offer of openOffers) {
      const match = this.matchRide(
        {
          id: offer.id,
          driverId: offer.driver_id,
          originNodeId: offer.origin_node_id,
          destinationNodeId: offer.destination_node_id,
          departureTime: offer.departure_time,
          totalSeats: offer.total_seats,
          availableSeats: offer.available_seats,
          vehicleType: offer.vehicle_type,
        },
        {
          id: request.id,
          passengerId: request.passenger_id,
          originNodeId: request.origin_node_id,
          destinationNodeId: request.destination_node_id,
          desiredTime: request.desired_departure_time || request.desired_time || '08:30',
          seatsNeeded: request.seats_needed,
          maxDetourRatio: request.max_detour_ratio,
        }
      );

      if (match.matched) {
        results.push(match);
      }
    }

    // Rank by detour ratio ascending, then carbon saved descending
    return results.sort((a, b) => a.detourRatio - b.detourRatio || b.carbonSavedKg - a.carbonSavedKg);
  }

  /**
   * Atomic ride confirmation and seat decrement transaction
   */
  public confirmAndBookRide(
    db: Database.Database,
    offerId: string,
    requestId: string,
    seatsBooked?: number
  ): BookingResult {
    const offer = db.prepare('SELECT * FROM ride_offers WHERE id = ?').get(offerId) as any;
    const request = db.prepare('SELECT * FROM ride_requests WHERE id = ?').get(requestId) as any;
    if (!offer || !request) {
      throw new Error('Offer or request not found');
    }

    const seats = seatsBooked || request.seats_needed || 1;
    if (offer.available_seats < seats) {
      throw new Error('Not enough available seats (Insufficient available seats)');
    }

    const match = this.matchRide(
      {
        id: offer.id,
        driverId: offer.driver_id,
        originNodeId: offer.origin_node_id,
        destinationNodeId: offer.destination_node_id,
        departureTime: offer.departure_time,
        totalSeats: offer.total_seats,
        availableSeats: offer.available_seats,
        vehicleType: offer.vehicle_type,
      },
      {
        id: request.id,
        passengerId: request.passenger_id,
        originNodeId: request.origin_node_id,
        destinationNodeId: request.destination_node_id,
        desiredTime: request.desired_departure_time || request.desired_time || '09:00',
        seatsNeeded: seats,
        maxDetourRatio: request.max_detour_ratio,
      }
    );

    if (!match.matched) {
      throw new Error(`Ride match failed detour constraints: ${match.reason}`);
    }

    const matchId = genId('match');
    const bookingId = genId('bk');
    const newSeats = offer.available_seats - seats;

    const executeBooking = db.transaction(() => {
      // 1. Decrement available seats in offer
      db.prepare('UPDATE ride_offers SET available_seats = ? WHERE id = ?').run(newSeats, offerId);

      // 2. Update request status to completed / booked
      db.prepare("UPDATE ride_requests SET status = 'completed' WHERE id = ?").run(requestId);

      const soloFare = 15.0 + 12.0 * (match.sharedKm || 1.0);
      const farePaid = Math.round(soloFare * 0.6 * 100) / 100;
      const driverEarnings = Math.round(farePaid * 0.85 * 100) / 100;

      // 3. Check schema columns to support both universe.db and test fixtures
      const bookingCols = db.prepare('PRAGMA table_info(ride_bookings)').all().map((c: any) => c.name);

      if (bookingCols.includes('match_id')) {
        // universe.db schema
        db.prepare(`
          INSERT INTO ride_matches (
            id, offer_id, request_id, matched_path, driver_solo_distance_km, passenger_solo_distance_km,
            pooled_distance_km, shared_distance_km, detour_distance_km, detour_ratio, carbon_saved_kg,
            driver_earnings, passenger_fare, passenger_savings, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
        `).run(
          matchId, offerId, requestId, JSON.stringify(match.pooledRoute || []),
          match.sharedKm, match.sharedKm, (match.sharedKm + match.detourKm),
          match.sharedKm, match.detourKm, match.detourRatio, match.carbonSavedKg,
          driverEarnings, farePaid, (soloFare - farePaid)
        );

        db.prepare(`
          INSERT INTO ride_bookings (id, match_id, passenger_id, seats_booked, fare_paid)
          VALUES (?, ?, ?, ?, ?)
        `).run(bookingId, matchId, request.passenger_id, seats, farePaid);
      } else {
        // contract test schema
        db.prepare(`
          INSERT INTO ride_bookings (id, offer_id, request_id, seats_booked, shared_km, detour_km, carbon_saved_kg, fare_charged, driver_earnings)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(bookingId, offerId, requestId, seats, match.sharedKm, match.detourKm, match.carbonSavedKg, farePaid, driverEarnings);
      }

      // 4. Central Activity log entry with [ESTIMATED METRIC] provenance tag
      const actId = genId('act');
      db.prepare(`
        INSERT INTO activity_log (id, user_id, module, action, details)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        actId,
        request.passenger_id,
        'rides',
        'RIDE_BOOKED',
        `Booked pooled ride with ${match.carbonSavedKg}kg CO2e avoided [ESTIMATED METRIC]`
      );

      return {
        bookingId,
        matchId,
        newSeats,
        farePaid,
        driverEarnings,
      };
    });

    const booked = executeBooking();

    return {
      success: true,
      bookingId: booked.bookingId,
      matchId: booked.matchId,
      seatsRemaining: booked.newSeats,
      sharedKm: match.sharedKm,
      carbonSavedKg: match.carbonSavedKg,
      fareCharged: booked.farePaid,
      driverEarnings: booked.driverEarnings,
      provenance: '[ESTIMATED METRIC]',
    };
  }
}

export const rideMatchingService = new RideMatchingService();
