import { describe, it, expect, beforeEach } from 'vitest';
import { CampusGraphOracle } from '../fixtures/algorithms/graph_oracle';

describe('Algorithmic Unit Tests — Campus Graph & Ride Matching (Module B)', () => {
  let oracle: CampusGraphOracle;

  beforeEach(() => {
    oracle = new CampusGraphOracle();
  });

  describe('Dijkstra Shortest Path Calculations', () => {
    it('calculates direct single-hop path distance accurately', () => {
      const res = oracle.findShortestPath('GATE_NORTH', 'DORM_NORTH', '10:00');
      expect(res).not.toBeNull();
      expect(res?.path).toEqual(['GATE_NORTH', 'DORM_NORTH']);
      expect(res?.totalDistanceKm).toBe(0.8);
      expect(res?.totalTimeMins).toBe(3.0);
    });

    it('identifies the optimal multi-hop shortest path between distant campus nodes', () => {
      // GATE_NORTH -> ACAD_QUAD:
      // Option 1: GATE_NORTH -> DORM_NORTH (0.8) -> ACAD_QUAD (0.7) = 1.5 km
      // Option 2: GATE_NORTH -> INNOVATION (1.1) -> ACAD_QUAD (0.9) = 2.0 km
      const res = oracle.findShortestPath('GATE_NORTH', 'ACAD_QUAD', '10:00');
      expect(res).not.toBeNull();
      expect(res?.path).toEqual(['GATE_NORTH', 'DORM_NORTH', 'ACAD_QUAD']);
      expect(res?.totalDistanceKm).toBe(1.5);
    });

    it('handles identical origin and destination as a zero-distance path', () => {
      const res = oracle.findShortestPath('ACAD_QUAD', 'ACAD_QUAD', '12:00');
      expect(res).not.toBeNull();
      expect(res?.path).toEqual(['ACAD_QUAD']);
      expect(res?.totalDistanceKm).toBe(0);
      expect(res?.totalTimeMins).toBe(0);
    });

    it('returns null when querying non-existent or invalid node IDs', () => {
      const res = oracle.findShortestPath('NON_EXISTENT_GATE', 'ACAD_QUAD', '12:00');
      expect(res).toBeNull();
    });

    it('applies time-of-day dynamic congestion multipliers correctly', () => {
      // Off-peak (10:00) => 1.0 multiplier
      const offPeak = oracle.findShortestPath('GATE_NORTH', 'DORM_NORTH', '10:00');
      expect(offPeak?.totalTimeMins).toBe(3.0);

      // Morning peak rush (08:30) => 1.65 multiplier
      const morningRush = oracle.findShortestPath('GATE_NORTH', 'DORM_NORTH', '08:30');
      expect(morningRush?.totalTimeMins).toBe(Math.round(3.0 * 1.65 * 10) / 10);

      // Midday shift (12:30) => 1.35 multiplier
      const midday = oracle.findShortestPath('GATE_NORTH', 'DORM_NORTH', '12:30');
      expect(midday?.totalTimeMins).toBe(Math.round(3.0 * 1.35 * 10) / 10);

      // Evening dispersal (17:45) => 1.70 multiplier
      const evening = oracle.findShortestPath('GATE_NORTH', 'DORM_NORTH', '17:45');
      expect(evening?.totalTimeMins).toBe(Math.round(3.0 * 1.7 * 10) / 10);
    });
  });

  describe('DARP Ride Matching Heuristics & Detour Ceilings', () => {
    it('matches compatible passenger on driver route with low detour (< 35%)', () => {
      const offer = {
        id: 'off-1',
        driverId: 'drv-1',
        originNodeId: 'GATE_NORTH',
        destinationNodeId: 'GATE_SOUTH',
        departureTime: '10:00',
        totalSeats: 3,
        availableSeats: 3,
        vehicleType: 'PETROL_CAR' as const,
      };

      const request = {
        id: 'req-1',
        passengerId: 'stu-1',
        originNodeId: 'DORM_NORTH',
        destinationNodeId: 'STUDENT_CTR',
        desiredTime: '10:00',
        seatsNeeded: 1,
        maxDetourRatio: 0.35,
      };

      const match = oracle.matchRide(offer, request);
      expect(match.matched).toBe(true);
      expect(match.detourRatio).toBeLessThanOrEqual(0.35);
      expect(match.sharedKm).toBeGreaterThan(0);
      expect(match.carbonSavedKg).toBeGreaterThan(0);
      expect(match.passengerFareSaved).toBeGreaterThan(0);
      expect(match.driverSubsidy).toBeGreaterThan(0);
    });

    it('rejects match when passenger pickup causes detour ratio > 35%', () => {
      // Driver going from GATE_NORTH to DORM_NORTH (direct 0.8 km)
      // Passenger requesting pickup at SPORTS_CMPLX to GATE_SOUTH
      const offer = {
        id: 'off-short',
        driverId: 'drv-1',
        originNodeId: 'GATE_NORTH',
        destinationNodeId: 'DORM_NORTH',
        departureTime: '10:00',
        totalSeats: 3,
        availableSeats: 3,
        vehicleType: 'PETROL_CAR' as const,
      };

      const request = {
        id: 'req-far',
        passengerId: 'stu-2',
        originNodeId: 'SPORTS_CMPLX',
        destinationNodeId: 'GATE_SOUTH',
        desiredTime: '10:00',
        seatsNeeded: 1,
        maxDetourRatio: 0.35,
      };

      const match = oracle.matchRide(offer, request);
      expect(match.matched).toBe(false);
      expect(match.reason).toBe('DETOUR_LIMIT_EXCEEDED');
      expect(match.detourRatio).toBeGreaterThan(0.35);
    });

    it('rejects pairing when available seats are fewer than seats needed', () => {
      const offer = {
        id: 'off-full',
        driverId: 'drv-1',
        originNodeId: 'GATE_NORTH',
        destinationNodeId: 'GATE_SOUTH',
        departureTime: '10:00',
        totalSeats: 3,
        availableSeats: 1,
        vehicleType: 'PETROL_CAR' as const,
      };

      const request = {
        id: 'req-two-seats',
        passengerId: 'stu-3',
        originNodeId: 'DORM_NORTH',
        destinationNodeId: 'STUDENT_CTR',
        desiredTime: '10:00',
        seatsNeeded: 2, // Requests 2 seats but only 1 available
      };

      const match = oracle.matchRide(offer, request);
      expect(match.matched).toBe(false);
      expect(match.reason).toBe('INSUFFICIENT_SEAT_CAPACITY');
    });

    it('calculates lower avoided carbon for EV compared to petrol vehicle for identical routes', () => {
      const petrolOffer = {
        id: 'off-petrol',
        driverId: 'drv-1',
        originNodeId: 'GATE_NORTH',
        destinationNodeId: 'GATE_SOUTH',
        departureTime: '10:00',
        totalSeats: 3,
        availableSeats: 3,
        vehicleType: 'PETROL_CAR' as const,
      };

      const evOffer = {
        ...petrolOffer,
        id: 'off-ev',
        vehicleType: 'ELECTRIC_VEHICLE' as const,
      };

      const request = {
        id: 'req-shared',
        passengerId: 'stu-1',
        originNodeId: 'DORM_NORTH',
        destinationNodeId: 'STUDENT_CTR',
        desiredTime: '10:00',
        seatsNeeded: 1,
      };

      const petrolMatch = oracle.matchRide(petrolOffer, request);
      const evMatch = oracle.matchRide(evOffer, request);

      expect(petrolMatch.matched).toBe(true);
      expect(evMatch.matched).toBe(true);
      // Petrol avoided emissions (155g/km) > EV avoided emissions (48g/km)
      expect(petrolMatch.carbonSavedKg).toBeGreaterThan(evMatch.carbonSavedKg);
    });
  });

  describe('Production Services Verification (GraphService & RideMatchingService)', () => {
    it('GraphService exports canonical 10 nodes and 30 directed edges matching campus_graph.json', async () => {
      const { graphService } = await import('../../server/src/services/graph.service.js');
      const topology = graphService.getGraphTopology('08:30');
      expect(topology.nodes).toHaveLength(10);
      expect(topology.edges).toHaveLength(30);
      expect(topology.liveCongestionMultiplier).toBe(1.65);
    });

    it('GraphService calculates shortest path via A* heuristic matching Dijkstra', async () => {
      const { graphService } = await import('../../server/src/services/graph.service.js');
      const dijkstraRes = graphService.findShortestPath('GATE_NORTH', 'ACAD_QUAD', '10:00');
      const astarRes = graphService.findShortestPathAStar('GATE_NORTH', 'ACAD_QUAD', '10:00');

      expect(dijkstraRes).not.toBeNull();
      expect(astarRes).not.toBeNull();
      expect(astarRes?.path).toEqual(dijkstraRes?.path);
      expect(astarRes?.totalDistanceKm).toBe(dijkstraRes?.totalDistanceKm);
    });

    it('GraphService normalizes INNOVATION_PARK alias to INNOVATION', async () => {
      const { graphService } = await import('../../server/src/services/graph.service.js');
      const res = graphService.findShortestPath('INNOVATION_PARK', 'ACAD_QUAD', '12:00');
      expect(res).not.toBeNull();
      expect(res?.path[0]).toBe('INNOVATION');
    });

    it('RideMatchingService evaluates all vehicle emission factors correctly with [ESTIMATED METRIC]', async () => {
      const { rideMatchingService, getVehicleEmissionFactor } = await import('../../server/src/services/ride_matching.service.js');
      expect(getVehicleEmissionFactor('PETROL_CAR')).toBe(0.155);
      expect(getVehicleEmissionFactor('EV_CAR')).toBe(0.048);
      expect(getVehicleEmissionFactor('CAMPUS_SHUTTLE')).toBe(0.032);
      expect(getVehicleEmissionFactor('E_GOLF_CART')).toBe(0.025);

      const offer = {
        id: 'off-ev',
        driverId: 'drv-1',
        originNodeId: 'GATE_NORTH',
        destinationNodeId: 'GATE_SOUTH',
        departureTime: '08:30',
        totalSeats: 3,
        availableSeats: 3,
        vehicleType: 'EV_CAR',
      };
      const req = {
        id: 'req-1',
        passengerId: 'stu-1',
        originNodeId: 'DORM_NORTH',
        destinationNodeId: 'STUDENT_CTR',
        desiredTime: '08:30',
        seatsNeeded: 1,
        maxDetourRatio: 0.35,
      };

      const match = rideMatchingService.matchRide(offer, req);
      expect(match.matched).toBe(true);
      expect(match.provenance).toBe('[ESTIMATED METRIC]');
      expect(match.detourRatio).toBeLessThanOrEqual(0.35);
      expect(match.carbonSavedKg).toBeGreaterThan(0);
      expect(match.passengerFareSaved).toBeGreaterThan(0);
    });
  });
});

