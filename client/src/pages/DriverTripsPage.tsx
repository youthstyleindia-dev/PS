import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { RideService } from '../services/rides.service';

const CANONICAL_NODES = [
  { id: 'GATE_NORTH', name: 'North Main Gate (Node 01)' },
  { id: 'DORM_NORTH', name: 'North Dormitories (Node 02)' },
  { id: 'LIB_CENTRAL', name: 'Central University Library (Node 03)' },
  { id: 'LAB_CS_AI', name: 'Turing Computer Science & AI Labs (Node 04)' },
  { id: 'ACAD_QUAD', name: 'Academic Quadrangle (Node 05)' },
  { id: 'INNOVATION_PARK', name: 'Research & Innovation Park (Node 06)' },
  { id: 'SPORTS_CMPLX', name: 'Athletics & Gymnasium Complex (Node 07)' },
  { id: 'STUDENT_CTR', name: 'Student Union & Dining Commons (Node 08)' },
  { id: 'DORM_SOUTH', name: 'South Residential Towers (Node 09)' },
  { id: 'GATE_SOUTH', name: 'South Highway Interchange (Node 10)' }
];

export const DriverTripsPage: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // New Route Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [origin, setOrigin] = useState('GATE_NORTH');
  const [destination, setDestination] = useState('GATE_SOUTH');
  const [departureTime, setDepartureTime] = useState('08:30');
  const [totalSeats, setTotalSeats] = useState(3);
  const [vehicleType, setVehicleType] = useState('EV_CAR');
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await RideService.getDriverTrips();
      setTrips(data.offers || []);
    } catch (err) {
      console.error('Failed to load driver trips:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleStatusChange = async (offerId: string, newStatus: string) => {
    setActionLoadingId(offerId);
    try {
      await RideService.updateOfferStatus(offerId, newStatus);
      await fetchTrips();
    } catch (err: any) {
      alert(err?.message || 'Failed to update trip status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePublishRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    setPublishSuccess(null);
    try {
      const res = await RideService.createOffer({
        driverId: user?.id || 'usr_driver_1',
        originNodeId: origin,
        destinationNodeId: destination,
        departureTime,
        totalSeats,
        vehicleType
      });
      setPublishSuccess(`Corridor published! Computed route: ${res.driverRoute.join(' → ')} (${res.distanceKm} km).`);
      setShowCreateModal(false);
      fetchTrips();
    } catch (err: any) {
      alert(err?.message || 'Failed to publish route');
    } finally {
      setPublishing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-emerald-900/30 text-emerald-300 border-emerald-500/50';
      case 'in_progress':
        return 'bg-primary/20 text-primary border-primary/50 animate-pulse';
      case 'completed':
        return 'bg-surface-container-high text-outline border-outline-variant';
      case 'cancelled':
        return 'bg-error-container text-on-error-container border-error';
      default:
        return 'bg-surface-container text-on-surface';
    }
  };

  return (
    <div className="space-y-6 font-body-md text-on-surface">
      {/* Header Banner */}
      <div className="p-6 md:p-8 bg-surface-container-lowest border border-outline-variant shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-secondary font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>TRANSIT OPERATIONS // DRIVER ROSTER &amp; DISPATCH</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Campus Transit Fleet &amp; Trip Dispatch
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1">
            Real-time itinerary execution, passenger manifest verification, and zero-tax avoided carbon tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-primary text-on-primary font-mono text-xs uppercase font-bold hover:bg-secondary transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_road</span>
            <span>Publish New Corridor</span>
          </button>
        </div>
      </div>

      {publishSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500 text-emerald-200 font-mono text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400">check_circle</span>
            <span>{publishSuccess}</span>
          </div>
          <button onClick={() => setPublishSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Fleet Telemetry Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-surface border border-outline-variant font-mono">
          <div className="text-[11px] text-outline uppercase font-bold">TOTAL ASSIGNED TRIPS</div>
          <div className="text-2xl font-bold text-primary mt-1">{trips.length}</div>
        </div>
        <div className="p-4 bg-surface border border-outline-variant font-mono">
          <div className="text-[11px] text-outline uppercase font-bold">ACTIVE / OPEN TRIPS</div>
          <div className="text-2xl font-bold text-secondary mt-1">
            {trips.filter(t => t.status === 'open' || t.status === 'in_progress').length}
          </div>
        </div>
        <div className="p-4 bg-surface border border-outline-variant font-mono">
          <div className="text-[11px] text-outline uppercase font-bold">COMPLETED ITINERARIES</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {trips.filter(t => t.status === 'completed').length}
          </div>
        </div>
        <div className="p-4 bg-surface border border-outline-variant font-mono">
          <div className="text-[11px] text-outline uppercase font-bold">FLEET EFFICIENCY (CO₂e)</div>
          <div className="text-2xl font-bold text-primary mt-1">0 direct g/km</div>
        </div>
      </div>

      {/* Trips Manifest Queue */}
      {loading ? (
        <div className="p-12 text-center font-mono text-sm text-on-surface-variant">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          SYNCING DRIVER DISPATCH LOGS...
        </div>
      ) : trips.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-outline-variant font-mono text-sm text-on-surface-variant">
          NO TRIPS REGISTERED FOR THIS DRIVER ENCLAVE YET.
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => {
            const plannedRoute = Array.isArray(trip.planned_route)
              ? trip.planned_route
              : (typeof trip.planned_route === 'string' ? JSON.parse(trip.planned_route || '[]') : []);

            return (
              <div
                key={trip.id}
                className="p-6 bg-surface-container-lowest border border-outline-variant shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 font-mono text-xs"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 border text-[11px] font-bold uppercase ${getStatusBadge(trip.status)}`}>
                      {trip.status.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 bg-surface-container border border-outline-variant text-[11px] uppercase text-outline">
                      VEHICLE: {trip.vehicle_type}
                    </span>
                    <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold uppercase">
                      SEATS: {trip.available_seats} OPEN / {trip.total_seats} TOTAL
                    </span>
                    <span className="text-outline text-[11px]">
                      DEPARTURE: <strong>{trip.departure_time}</strong>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold font-sans">
                      {trip.origin_node_id} ➔ {trip.destination_node_id}
                    </h3>
                    {plannedRoute.length > 0 && (
                      <p className="text-[11px] text-secondary mt-1 font-bold">
                        Dijkstra Topological Corridor: {plannedRoute.join(' ➔ ')}
                      </p>
                    )}
                  </div>

                  {/* Passenger Manifest Roster */}
                  <div className="p-3 bg-surface-container-low border border-outline-variant space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-outline uppercase font-bold">
                      <span>Confirmed Passenger Manifest ({trip.passengers?.length || 0})</span>
                      <span>Max Detour Tolerance: {Math.round(trip.max_detour_ratio * 100)}%</span>
                    </div>

                    {!trip.passengers || trip.passengers.length === 0 ? (
                      <div className="text-[11px] text-outline italic">No passengers boarded yet. Corridors open for matching.</div>
                    ) : (
                      <div className="space-y-1">
                        {trip.passengers.map((p: any) => (
                          <div key={p.booking_id} className="flex items-center justify-between p-1.5 bg-surface border border-outline-variant">
                            <span className="font-bold text-on-surface">{p.passenger_name} ({p.passenger_department || 'Student'})</span>
                            <span className="text-secondary">{p.pickup_node} ➔ {p.dropoff_node} ({p.seats_booked} seat)</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Driver Lifecycle Controls */}
                <div className="flex flex-col gap-2 shrink-0 md:w-48 pt-2 md:pt-0">
                  <span className="text-[10px] uppercase font-bold text-outline">TRIP CONTROLS</span>
                  {trip.status === 'open' && (
                    <button
                      onClick={() => handleStatusChange(trip.id, 'in_progress')}
                      disabled={actionLoadingId === trip.id}
                      className="px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold uppercase transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                      <span>Start Trip</span>
                    </button>
                  )}

                  {trip.status === 'in_progress' && (
                    <button
                      onClick={() => handleStatusChange(trip.id, 'completed')}
                      disabled={actionLoadingId === trip.id}
                      className="px-3 py-2 bg-primary text-on-primary hover:bg-secondary font-bold uppercase transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Complete Trip</span>
                    </button>
                  )}

                  {(trip.status === 'open' || trip.status === 'in_progress') && (
                    <button
                      onClick={() => handleStatusChange(trip.id, 'cancelled')}
                      disabled={actionLoadingId === trip.id}
                      className="px-3 py-1.5 border border-outline hover:bg-surface-container font-bold uppercase text-outline transition-all disabled:opacity-50"
                    >
                      Cancel Offer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Publish Route Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="bg-surface border border-outline max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold font-sans">
                Publish Transit Route &amp; Topological Corridor
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-outline hover:text-on-surface font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishRoute} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase font-bold text-on-surface-variant mb-1">
                    Departure Hub
                  </label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-secondary"
                  >
                    {CANONICAL_NODES.map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block uppercase font-bold text-on-surface-variant mb-1">
                    Destination Terminal
                  </label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-secondary"
                  >
                    {CANONICAL_NODES.map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block uppercase font-bold text-on-surface-variant mb-1">
                    Departure Time
                  </label>
                  <input
                    type="time"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-secondary font-mono"
                  />
                </div>

                <div>
                  <label className="block uppercase font-bold text-on-surface-variant mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-secondary"
                  >
                    <option value="EV_CAR">EV Car</option>
                    <option value="CAMPUS_SHUTTLE">Campus Shuttle</option>
                    <option value="E_GOLF_CART">Electric Cart</option>
                    <option value="PETROL_CAR">Petrol / Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase font-bold text-on-surface-variant mb-1">
                    Total Seats
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-secondary font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-surface-container-low border border-outline-variant text-[11px] text-on-surface-variant leading-relaxed">
                Corridor routes are solved via min-priority Dijkstra over the 10 canonical campus junctions. Commuters within a maximum 35% detour envelope will be matched dynamically.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-outline hover:bg-surface-container uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="px-6 py-2 bg-primary text-on-primary hover:bg-secondary font-bold uppercase transition-all shadow-sm disabled:opacity-50"
                >
                  {publishing ? 'Computing Route...' : 'Publish Corridor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverTripsPage;
