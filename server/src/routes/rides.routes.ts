import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { graphService } from '../services/graph.service.js';
import { requireRole } from '../middleware/auth.middleware.js';
import {
  rideMatchingService,
  normalizeVehicleType,
} from '../services/ride_matching.service.js';

export const ridesRouter = Router();

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

// ============================================================================
// 1. TOPOLOGY, CONGESTION & PATHFINDING ENDPOINTS
// ============================================================================

/**
 * GET /api/rides/graph
 * Returns 10 canonical campus nodes, 30 road edges, and dynamic congestion multiplier
 */
ridesRouter.get('/graph', (req: Request, res: Response) => {
  const timeStr = (req.query.time as string) || '12:00';
  const topology = graphService.getGraphTopology(timeStr);
  res.json(topology);
});

/**
 * GET /api/rides/shortest-path
 * Computes shortest path via Dijkstra minimizing distance or travel time
 */
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

/**
 * GET /api/rides/shortest-path-astar
 * Computes shortest path via A* heuristic
 */
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

// ============================================================================
// 2. DRIVER RIDE OFFERS
// ============================================================================

/**
 * GET /api/rides/offers
 * Lists all active open driver ride offers with driver profile and route
 */
ridesRouter.get('/offers', (_req: Request, res: Response) => {
  const db = getDb();
  const offers = db.prepare(`
    SELECT ro.*, u.name as driver_name, u.avatar as driver_avatar, u.department as driver_dept
    FROM ride_offers ro
    JOIN users u ON ro.driver_id = u.id
    WHERE ro.status = 'open' AND ro.available_seats > 0
    ORDER BY ro.departure_time ASC
  `).all() as any[];

  const parsed = offers.map((o) => {
    let route = [];
    try {
      route = typeof o.planned_route === 'string' ? JSON.parse(o.planned_route) : o.planned_route || [];
    } catch {
      route = [];
    }
    return {
      ...o,
      planned_route: route,
    };
  });

  res.json(parsed);
});

/**
 * POST /api/rides/offers
 * Driver publishes a scheduled ride offer along campus graph
 */
ridesRouter.post('/offers', requireRole('driver', 'admin'), (req: Request, res: Response) => {
  const { driverId, originNodeId, destinationNodeId, departureTime, totalSeats, vehicleType } = req.body;
  const effectiveDriverId = (req.user && req.user.sub) ? req.user.sub : driverId;

  if (!effectiveDriverId || !originNodeId || !destinationNodeId || !departureTime || totalSeats === undefined) {
    return res.status(400).json({ error: 'Missing required ride offer fields' });
  }

  const seatsNum = Number(totalSeats);
  if (isNaN(seatsNum) || seatsNum < 1 || seatsNum > 6) {
    return res.status(400).json({ error: 'Total seats must be between 1 and 6' });
  }

  if (originNodeId === destinationNodeId) {
    return res.status(400).json({ error: 'Origin and destination cannot be identical' });
  }

  const normalizedOrigin = graphService.normalizeNodeId(originNodeId);
  const normalizedDest = graphService.normalizeNodeId(destinationNodeId);

  const path = graphService.findShortestPath(normalizedOrigin, normalizedDest, departureTime);
  if (!path) {
    return res.status(400).json({ error: 'Invalid origin or destination node in campus graph' });
  }

  const normalizedVehicle = normalizeVehicleType(vehicleType);

  const db = getDb();
  const id = genId('offer');

  // Verify campus_nodes row exists for FK satisfaction
  const nodeExists = db.prepare('SELECT id FROM campus_nodes WHERE id = ?').get(normalizedOrigin);
  const dbOrigin = nodeExists ? normalizedOrigin : originNodeId;
  const destExists = db.prepare('SELECT id FROM campus_nodes WHERE id = ?').get(normalizedDest);
  const dbDest = destExists ? normalizedDest : destinationNodeId;

  db.prepare(`
    INSERT INTO ride_offers (
      id, driver_id, origin_node_id, destination_node_id, departure_time,
      total_seats, available_seats, vehicle_type, status, planned_route
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)
  `).run(
    id,
    effectiveDriverId,
    dbOrigin,
    dbDest,
    departureTime,
    seatsNum,
    seatsNum,
    normalizedVehicle,
    JSON.stringify(path.path)
  );

  // Central Activity Log entry
  db.prepare(`
    INSERT INTO activity_log (id, user_id, module, action, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    genId('act'),
    effectiveDriverId,
    'rides',
    'OFFER_CREATED',
    `Offered ride from ${normalizedOrigin} to ${normalizedDest} (${seatsNum} seats)`
  );

  res.status(201).json({
    success: true,
    offerId: id,
    driverId: effectiveDriverId,
    driverRoute: path.path,
    distanceKm: path.totalDistanceKm,
    timeMins: path.totalTimeMins,
    availableSeats: seatsNum,
  });
});

// ============================================================================
// 3. PASSENGER RIDE REQUESTS
// ============================================================================

/**
 * GET /api/rides/requests
 * Lists pending passenger ride requests
 */
ridesRouter.get('/requests', (_req: Request, res: Response) => {
  const db = getDb();
  const requests = db.prepare(`
    SELECT rr.*, u.name as passenger_name, u.avatar as passenger_avatar
    FROM ride_requests rr
    JOIN users u ON rr.passenger_id = u.id
    WHERE rr.status = 'pending'
    ORDER BY rr.desired_departure_time ASC
  `).all();
  res.json(requests);
});

/**
 * POST /api/rides/requests
 * Passenger publishes pooled ride request with detour ceiling tolerance
 */
ridesRouter.post('/requests', (req: Request, res: Response) => {
  const {
    passengerId,
    originNodeId,
    destinationNodeId,
    desiredTime,
    desiredDepartureTime,
    seatsNeeded,
    maxDetourRatio,
  } = req.body;

  let effectivePassengerId = passengerId;
  if (req.user) {
    const isAdmin = req.user.role === 'admin' || (req.user.roles && req.user.roles.includes('admin'));
    if (!isAdmin) {
      if (passengerId && passengerId !== req.user.sub) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Access denied: Cannot submit ride requests on behalf of another passenger ('${passengerId}').`
          }
        });
      }
      effectivePassengerId = req.user.sub;
    }
  }

  const time = desiredDepartureTime || desiredTime;
  if (!effectivePassengerId || !originNodeId || !destinationNodeId || !time) {
    return res.status(400).json({ error: 'Missing required ride request fields' });
  }

  if (originNodeId === destinationNodeId) {
    return res.status(400).json({ error: 'Origin and destination cannot be identical' });
  }

  const normalizedOrigin = graphService.normalizeNodeId(originNodeId);
  const normalizedDest = graphService.normalizeNodeId(destinationNodeId);

  const path = graphService.findShortestPath(normalizedOrigin, normalizedDest, time);
  if (!path) {
    return res.status(400).json({ error: 'Invalid origin or destination node' });
  }

  const db = getDb();
  const id = genId('req');

  const nodeExists = db.prepare('SELECT id FROM campus_nodes WHERE id = ?').get(normalizedOrigin);
  const dbOrigin = nodeExists ? normalizedOrigin : originNodeId;
  const destExists = db.prepare('SELECT id FROM campus_nodes WHERE id = ?').get(normalizedDest);
  const dbDest = destExists ? normalizedDest : destinationNodeId;

  db.prepare(`
    INSERT INTO ride_requests (
      id, passenger_id, origin_node_id, destination_node_id,
      desired_departure_time, seats_needed, max_detour_ratio, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    id,
    effectivePassengerId,
    dbOrigin,
    dbDest,
    time,
    seatsNeeded || 1,
    maxDetourRatio || 0.35
  );

  res.status(201).json({
    success: true,
    requestId: id,
    directDistanceKm: path.totalDistanceKm,
    directTimeMins: path.totalTimeMins,
    status: 'pending',
  });
});

// ============================================================================
// 4. DARP MATCHING ENGINE (Pairwise & Multi-Candidate Ranking)
// ============================================================================

/**
 * POST /api/rides/match
 * Runs DARP matching algorithm:
 * - Pairwise match if offerId & requestId are supplied
 * - Multi-candidate ranking if only requestId is supplied
 */
ridesRouter.post('/match', (req: Request, res: Response) => {
  const { offerId, requestId } = req.body;
  const db = getDb();

  // Multi-candidate ranking for a request
  if (requestId && !offerId) {
    const rankedMatches = rideMatchingService.findRankedMatchesForRequest(db, requestId);
    return res.json({
      matched: rankedMatches.length > 0,
      totalMatches: rankedMatches.length,
      matches: rankedMatches,
      provenance: '[ESTIMATED METRIC]',
    });
  }

  if (!offerId || !requestId) {
    return res.status(400).json({ error: 'offerId and requestId are required for pairwise matching' });
  }

  const offer = db.prepare('SELECT * FROM ride_offers WHERE id = ?').get(offerId) as any;
  const request = db.prepare('SELECT * FROM ride_requests WHERE id = ?').get(requestId) as any;
  if (!offer || !request) {
    return res.status(404).json({ error: 'Offer or request not found' });
  }

  const match = rideMatchingService.matchRide(
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
      seatsNeeded: request.seats_needed,
      maxDetourRatio: request.max_detour_ratio,
    }
  );

  res.json(match);
});

// ============================================================================
// 5. MATCH CONFIRMATION & SEAT BOOKING
// ============================================================================

/**
 * POST /api/rides/matches/:matchId/confirm
 * Confirms a proposed match, updates seats and writes activity log
 */
ridesRouter.post('/matches/:matchId/confirm', (req: Request, res: Response) => {
  const { matchId } = req.params;
  const db = getDb();

  const matchRow = db.prepare('SELECT * FROM ride_matches WHERE id = ?').get(matchId) as any;
  if (!matchRow) {
    return res.status(404).json({ error: 'Match record not found' });
  }

  try {
    const booking = rideMatchingService.confirmAndBookRide(db, matchRow.offer_id, matchRow.request_id);
    res.json(booking);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/rides/book
 * Direct booking confirmation (backward compatibility with E2E test harness)
 */
ridesRouter.post('/book', (req: Request, res: Response) => {
  const { offerId, requestId, seatsBooked } = req.body;
  if (!offerId || !requestId) {
    return res.status(400).json({ error: 'offerId and requestId are required' });
  }

  const db = getDb();
  const offer = db.prepare('SELECT * FROM ride_offers WHERE id = ?').get(offerId) as any;
  const request = db.prepare('SELECT * FROM ride_requests WHERE id = ?').get(requestId) as any;
  if (!offer || !request) {
    return res.status(404).json({ error: 'Offer or request not found' });
  }

  try {
    const booking = rideMatchingService.confirmAndBookRide(db, offerId, requestId, seatsBooked);
    res.status(201).json(booking);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// 6. CAMPUS RIDE-POOLING TELEMETRY SUMMARY
// ============================================================================

/**
 * GET /api/rides/summary
 * Aggregates campus-wide pooled ride metrics with [ESTIMATED METRIC] provenance
 */
ridesRouter.get('/summary', (_req: Request, res: Response) => {
  const db = getDb();
  const stats = db.prepare(`
    SELECT
      COUNT(id) as totalBookings,
      COALESCE(SUM(seats_booked), 0) as totalSeatsBooked,
      COALESCE(SUM(fare_paid), 0) as totalFareCharged
    FROM ride_bookings
  `).get() as any;

  const matchStats = db.prepare(`
    SELECT
      COALESCE(SUM(shared_distance_km), 0) as totalSharedKm,
      COALESCE(SUM(carbon_saved_kg), 0) as totalCarbonSavedKg
    FROM ride_matches
  `).get() as any;

  const openOffers = db.prepare("SELECT COUNT(id) as count FROM ride_offers WHERE status = 'open' AND available_seats > 0").get() as any;
  const pendingRequests = db.prepare("SELECT COUNT(id) as count FROM ride_requests WHERE status = 'pending'").get() as any;

  res.json({
    totalBookings: stats?.totalBookings || 0,
    totalSharedKm: Math.round((matchStats?.totalSharedKm || 0) * 10) / 10,
    totalCarbonSavedKg: Math.round((matchStats?.totalCarbonSavedKg || 0) * 100) / 100,
    totalFareCharged: Math.round(stats?.totalFareCharged || 0),
    activeOffersCount: openOffers?.count || 0,
    pendingRequestsCount: pendingRequests?.count || 0,
    provenance: '[ESTIMATED METRIC]',
  });
});
