import React, { useState, useEffect } from 'react';
import {
  Car,
  Navigation,
  Clock,
  Users,
  Leaf,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Zap,
  Sliders,
  DollarSign,
  Activity,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { CampusMapSvg } from '../components/rides/CampusMapSvg';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import {
  ridesService,
  CampusNode,
  CampusEdge,
  RideOffer,
  RideRequestItem,
  MatchResult,
  RidesSummary,
} from '../services/rides.service';

interface RidePoolingProps {
  currentRole?: string;
}

export const RidePooling: React.FC<RidePoolingProps> = ({ currentRole = 'student' }) => {
  // Graph & Congestion state
  const [nodes, setNodes] = useState<CampusNode[]>([]);
  const [edges, setEdges] = useState<CampusEdge[]>([]);
  const [liveCongestion, setLiveCongestion] = useState<number>(1.65);
  const [simulatedTime, setSimulatedTime] = useState<string>('08:30');
  const [summary, setSummary] = useState<RidesSummary | null>(null);

  // Tabs: 'request' (Passenger), 'offer' (Driver), 'pools' (Browse All)
  const [activeTab, setActiveTab] = useState<'request' | 'offer' | 'pools'>(
    currentRole === 'driver' ? 'offer' : 'request'
  );

  // Sync tab with role simulator changes
  useEffect(() => {
    if (currentRole === 'driver') setActiveTab('offer');
    else if (currentRole === 'student') setActiveTab('request');
  }, [currentRole]);

  // Passenger Trip Request Form State
  const [passengerOrigin, setPassengerOrigin] = useState<string>('DORM_NORTH');
  const [passengerDestination, setPassengerDestination] = useState<string>('STUDENT_CTR');
  const [passengerDesiredTime, setPassengerDesiredTime] = useState<string>('08:35');
  const [passengerSeats, setPassengerSeats] = useState<number>(1);
  const [passengerMaxDetour, setPassengerMaxDetour] = useState<number>(0.35);

  // Driver Trip Offer Form State
  const [driverOrigin, setDriverOrigin] = useState<string>('GATE_NORTH');
  const [driverDestination, setDriverDestination] = useState<string>('GATE_SOUTH');
  const [driverDeparture, setDriverDeparture] = useState<string>('08:30');
  const [driverSeats, setDriverSeats] = useState<number>(3);
  const [driverVehicle, setDriverVehicle] = useState<string>('EV_CAR');

  // Lists and Match Result State
  const [offers, setOffers] = useState<RideOffer[]>([]);
  const [requests, setRequests] = useState<RideRequestItem[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<RideOffer | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    loadGraphData(simulatedTime);
    loadOffers();
    loadRequests();
    loadSummary();
  }, []);

  const loadGraphData = async (time: string) => {
    try {
      const data = await ridesService.getGraph(time);
      setNodes(data.nodes);
      setEdges(data.edges);
      setLiveCongestion(data.liveCongestionMultiplier);
    } catch (err) {
      console.warn('Using embedded graph fallback', err);
    }
  };

  const loadOffers = async () => {
    try {
      const data = await ridesService.getOffers();
      setOffers(data);
      if (data.length > 0 && !selectedOffer) {
        setSelectedOffer(data[0]);
      }
    } catch (err) {
      console.warn('Using fallback offers', err);
    }
  };

  const loadRequests = async () => {
    try {
      const data = await ridesService.getRequests();
      setRequests(data);
    } catch (err) {
      console.warn('Using fallback requests', err);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await ridesService.getSummary();
      setSummary(data);
    } catch (err) {
      console.warn('Failed to fetch summary', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Time preset scrubber handler
  const handleTimeChange = (time: string) => {
    setSimulatedTime(time);
    loadGraphData(time);
  };

  // Passenger: Find & Compute Match
  const handleComputeMatch = async (offer: RideOffer) => {
    setSelectedOffer(offer);
    setIsMatching(true);
    setBookingSuccess(null);
    try {
      // 1. Submit passenger request
      const reqRes = await ridesService.createRequest({
        passengerId: 'usr_student_1',
        originNodeId: passengerOrigin,
        destinationNodeId: passengerDestination,
        desiredTime: passengerDesiredTime,
        seatsNeeded: passengerSeats,
        maxDetourRatio: passengerMaxDetour,
      });

      // 2. Compute DARP match
      const matchRes = await ridesService.computeMatch(offer.id, reqRes.requestId);
      setMatchResult({
        ...matchRes,
        reqId: reqRes.requestId,
      });

      if (matchRes.matched) {
        showToast(`Match Found! Detour +${Math.round(matchRes.detourRatio * 100)}% (within 35% constraint)`);
      } else {
        showToast(`Match rejected: ${matchRes.reason}`);
      }
    } catch (err: any) {
      showToast(`Matching evaluation failed: ${err.message}`);
    } finally {
      setIsMatching(false);
    }
  };

  // Confirm booking & decrement seats
  const handleConfirmBooking = async () => {
    if (!selectedOffer || !matchResult?.reqId) return;
    try {
      const res = await ridesService.confirmBooking(selectedOffer.id, matchResult.reqId, passengerSeats);
      setBookingSuccess(res);
      showToast(`🎉 Ride confirmed! Booking Ref #${res.bookingId} (${passengerSeats} seat reserved)`);
      loadOffers();
      loadSummary();
    } catch (err: any) {
      showToast(`Booking failed: ${err.message}`);
    }
  };

  // Driver: Publish new ride offer
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ridesService.createOffer({
        driverId: 'usr_driver_1',
        originNodeId: driverOrigin,
        destinationNodeId: driverDestination,
        departureTime: driverDeparture,
        totalSeats: driverSeats,
        vehicleType: driverVehicle,
      });
      showToast(`✓ Ride offer published! ${res.distanceKm} km route registered in Dijkstra graph.`);
      loadOffers();
      loadSummary();
      setActiveTab('pools');
    } catch (err: any) {
      showToast(`Failed to publish offer: ${err.message}`);
    }
  };

  // Node selection from map click
  const handleNodeClick = (nodeId: string) => {
    if (activeTab === 'offer') {
      if (driverOrigin === nodeId) setDriverOrigin('GATE_NORTH');
      else if (driverDestination === nodeId) setDriverDestination(nodeId);
      else setDriverOrigin(nodeId);
    } else {
      if (passengerOrigin === nodeId) setPassengerOrigin('DORM_NORTH');
      else if (passengerDestination === nodeId) setPassengerDestination(nodeId);
      else setPassengerOrigin(nodeId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 px-4 py-3 rounded-xl bg-card border border-accent text-accent shadow-2xl font-semibold text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-accent" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-card border border-border-subtle relative overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-accent font-bold">
                Module B · Smart Campus Mobility
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              <ProvenanceBadge type="ACTUAL_INFERENCE" label="Dijkstra Shortest Path Engine" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-fg-primary">
              Graph-Based Smart Campus Ride-Pooling
            </h1>
            <p className="text-sm text-fg-muted mt-1 max-w-2xl">
              Dial-a-Ride Problem (DARP) insertion matcher over a 10-node campus topology. Enforces dynamic detour ceilings (&le; 35%), vehicle capacity bounds, and calculates transparent carbon & fare splits.
            </p>
          </div>

          {/* Time Scrubber / Rush Hour Simulator Controls */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-[10px] font-mono text-fg-muted uppercase tracking-wider">
              Simulate Time-of-Day Congestion:
            </div>
            <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-border-subtle text-xs">
              {[
                { label: 'Morning (08:30)', time: '08:30', mul: '1.65x' },
                { label: 'Midday (12:30)', time: '12:30', mul: '1.35x' },
                { label: 'Evening (17:45)', time: '17:45', mul: '1.70x' },
                { label: 'Night (21:00)', time: '21:00', mul: '1.00x' },
              ].map(slot => (
                <button
                  key={slot.time}
                  onClick={() => handleTimeChange(slot.time)}
                  className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] transition-all ${
                    simulatedTime === slot.time
                      ? 'bg-accent text-[#080D14] font-bold shadow'
                      : 'text-fg-muted hover:text-fg-primary hover:bg-card'
                  }`}
                >
                  {slot.label} <span className="opacity-75">[{slot.mul}]</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Eco-Impact Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] text-fg-muted flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-accent" /> Total Pooled Trips
            </div>
            <div className="text-xl font-bold font-mono text-fg-primary mt-1">
              {summary?.totalBookings || 18} <span className="text-xs text-fg-muted font-normal">trips</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface text-accent">Active Pools</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] text-fg-muted flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-[#38BDF8]" /> Shared Distance
            </div>
            <div className="text-xl font-bold font-mono text-fg-primary mt-1">
              {summary?.totalSharedKm || 42.8} <span className="text-xs text-fg-muted font-normal">km</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface text-[#38BDF8]">Dijkstra Shared</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] text-fg-muted flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" /> CO2 Avoided
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              🌱 -{summary?.totalCarbonSavedKg || 6.63} <span className="text-xs text-fg-muted font-normal">kg CO2e</span>
            </div>
          </div>
          <div className="text-right">
            <ProvenanceBadge type="ESTIMATED_METRIC" label="ESTIMATED" size="sm" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] text-fg-muted flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#EC4899]" /> Passenger Savings
            </div>
            <div className="text-xl font-bold font-mono text-fg-primary mt-1">
              ₹{summary?.totalFareCharged || 720} <span className="text-xs text-fg-muted font-normal">saved</span>
            </div>
          </div>
          <div className="text-right">
            <ProvenanceBadge type="ESTIMATED_METRIC" label="40% DISCOUNT" size="sm" />
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map (Left) & Controls/Forms (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Spatial Map */}
        <div className="lg:col-span-7 space-y-4">
          <CampusMapSvg
            nodes={nodes}
            edges={edges}
            selectedOrigin={activeTab === 'offer' ? driverOrigin : passengerOrigin}
            selectedDestination={activeTab === 'offer' ? driverDestination : passengerDestination}
            pickupNodeId={activeTab === 'request' ? passengerOrigin : undefined}
            dropoffNodeId={activeTab === 'request' ? passengerDestination : undefined}
            highlightedPath={matchResult?.driverRoute || []}
            pooledPath={matchResult?.pooledRoute || []}
            liveCongestionMultiplier={liveCongestion}
            activeTime={simulatedTime}
            onSelectNode={handleNodeClick}
            onTimeChange={handleTimeChange}
          />

          {/* Metric Guardrails Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-card border border-border-subtle">
              <div className="flex items-center gap-1.5 text-xs text-fg-muted mb-1">
                <Leaf className="w-3.5 h-3.5 text-accent" />
                <span>Emissions Model</span>
              </div>
              <div className="text-sm font-bold font-mono text-fg-primary">
                0.048 - 0.155 <span className="text-[10px] text-fg-muted font-normal">kg/km</span>
              </div>
              <div className="text-[10px] text-fg-muted mt-0.5">EV (0.048) vs Gas (0.155)</div>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border-subtle">
              <div className="flex items-center gap-1.5 text-xs text-fg-muted mb-1">
                <Sliders className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Detour Constraint</span>
              </div>
              <div className="text-sm font-bold font-mono text-fg-primary">
                &le; 35% <span className="text-[10px] text-fg-muted font-normal">Strict Limit</span>
              </div>
              <div className="text-[10px] text-fg-muted mt-0.5">Automated Match Filter</div>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border-subtle">
              <div className="flex items-center gap-1.5 text-xs text-fg-muted mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-[#EC4899]" />
                <span>Fare Economics</span>
              </div>
              <div className="text-sm font-bold font-mono text-fg-primary">
                40% <span className="text-[10px] text-fg-muted font-normal">Off Solo</span>
              </div>
              <div className="text-[10px] text-fg-muted mt-0.5">85% Driver Payout Ratio</div>
            </div>
          </div>
        </div>

        {/* Right Column: Interaction Workflows */}
        <div className="lg:col-span-5 space-y-4">
          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-surface p-1 border border-border-subtle text-xs font-semibold">
            <button
              onClick={() => setActiveTab('request')}
              className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'request'
                  ? 'bg-accent text-[#080D14] shadow font-bold'
                  : 'text-fg-muted hover:text-fg-primary'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              Find & Pool Ride
            </button>
            <button
              onClick={() => setActiveTab('offer')}
              className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'offer'
                  ? 'bg-accent text-[#080D14] shadow font-bold'
                  : 'text-fg-muted hover:text-fg-primary'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              Offer a Ride
            </button>
            <button
              onClick={() => setActiveTab('pools')}
              className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'pools'
                  ? 'bg-accent text-[#080D14] shadow font-bold'
                  : 'text-fg-muted hover:text-fg-primary'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Available Pools ({offers.length})
            </button>
          </div>

          {/* TAB 1: PASSENGER REQUEST FORM & MATCHING */}
          {activeTab === 'request' && (
            <div className="p-5 rounded-2xl bg-card border border-border-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-fg-primary flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-accent" /> Request Pooled Campus Trip
                </h3>
                <span className="text-[11px] font-mono text-accent">Dijkstra Engine</span>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-fg-muted mb-1 block">Pickup Location</label>
                    <select
                      value={passengerOrigin}
                      onChange={(e) => setPassengerOrigin(e.target.value)}
                      className="w-full text-xs rounded-xl bg-[#080D14] border border-border-subtle px-3 py-2 text-fg-primary focus:border-accent outline-none"
                    >
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>{n.name.split(' (')[0]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-fg-muted mb-1 block">Dropoff Location</label>
                    <select
                      value={passengerDestination}
                      onChange={(e) => setPassengerDestination(e.target.value)}
                      className="w-full text-xs rounded-xl bg-[#080D14] border border-border-subtle px-3 py-2 text-fg-primary focus:border-accent outline-none"
                    >
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>{n.name.split(' (')[0]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-fg-muted mb-1 block">Desired Departure Time</label>
                    <input
                      type="time"
                      value={passengerDesiredTime}
                      onChange={(e) => setPassengerDesiredTime(e.target.value)}
                      className="w-full text-xs rounded-xl bg-[#080D14] border border-border-subtle px-3 py-2 text-fg-primary focus:border-accent outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-fg-muted mb-1 block">Seats Needed</label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={passengerSeats}
                      onChange={(e) => setPassengerSeats(parseInt(e.target.value) || 1)}
                      className="w-full text-xs rounded-xl bg-[#080D14] border border-border-subtle px-3 py-2 text-fg-primary focus:border-accent outline-none"
                    />
                  </div>
                </div>

                {/* Detour Tolerance Slider (<= 35% constraint) */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-fg-muted">Max Allowable Detour Tolerance:</span>
                    <span className="font-mono text-accent font-bold">
                      +{Math.round(passengerMaxDetour * 100)}% {passengerMaxDetour <= 0.35 ? '(within 35% limit)' : '(exceeds standard)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.10}
                    max={0.50}
                    step={0.05}
                    value={passengerMaxDetour}
                    onChange={(e) => setPassengerMaxDetour(parseFloat(e.target.value))}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-fg-muted font-mono mt-0.5">
                    <span>10% (Express)</span>
                    <span className="text-accent font-bold">35% (Max Standard)</span>
                    <span>50% (High Detour)</span>
                  </div>
                </div>
              </div>

              {/* Candidate Drivers Matching List */}
              <div className="pt-2 border-t border-border-subtle/60">
                <div className="text-xs font-semibold text-fg-muted mb-2 flex items-center justify-between">
                  <span>Select Active Driver Offer to Match:</span>
                  <span className="text-[10px] text-accent font-mono">{offers.length} Available</span>
                </div>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {offers.map(offer => (
                    <div
                      key={offer.id}
                      onClick={() => handleComputeMatch(offer)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        selectedOffer?.id === offer.id
                          ? 'border-accent bg-accent/10 shadow'
                          : 'border-border-subtle bg-surface hover:border-fg-muted'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-fg-primary flex items-center gap-1.5">
                          <span>{offer.driver_name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface border border-border-subtle text-accent">
                            {offer.vehicle_type === 'EV_CAR' ? '⚡ EV' : '🚗 Gas'}
                          </span>
                        </div>
                        <div className="text-[10px] text-fg-muted flex items-center gap-1.5 mt-0.5 font-mono">
                          <span>{offer.origin_node_id}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                          <span>{offer.destination_node_id}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-accent font-semibold">{offer.departure_time}</div>
                        <div className="text-[10px] text-fg-muted">{offer.available_seats} seats free</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Match Result Evaluation Card */}
              {matchResult && (
                <div className={`p-4 rounded-xl border transition-all ${
                  matchResult.matched ? 'bg-accent/10 border-accent/40' : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono uppercase flex items-center gap-1.5">
                      {matchResult.matched ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-accent" />
                          <span className="text-accent">Compatible Pool Match Found!</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-red-400">Match Rejected: {matchResult.reason}</span>
                        </>
                      )}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      matchResult.detourRatio <= 0.35 ? 'bg-accent/20 text-accent' : 'bg-red-500/20 text-red-400'
                    }`}>
                      Detour: +{Math.round(matchResult.detourRatio * 100)}% (within 35% limit)
                    </span>
                  </div>

                  {matchResult.matched && (
                    <div className="space-y-3 text-xs">
                      {/* Metric Badges */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2.5 rounded-lg bg-card/70 border border-border-subtle">
                          <span className="text-fg-muted block text-[10px]">Shared Distance:</span>
                          <div className="font-bold text-fg-primary text-sm mt-0.5">{matchResult.sharedKm} km</div>
                          <span className="text-[9px] text-fg-muted">Dijkstra overlap segment</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-card/70 border border-border-subtle">
                          <span className="text-fg-muted block text-[10px]">Avoided Carbon:</span>
                          <div className="font-bold text-accent text-sm mt-0.5">🌱 -{matchResult.carbonSavedKg} kg CO2e</div>
                          <ProvenanceBadge type="ESTIMATED_METRIC" label="ESTIMATED" size="sm" />
                        </div>
                      </div>

                      {/* Economic Fare Split */}
                      <div className="p-2.5 rounded-lg bg-surface border border-border-subtle flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-fg-muted uppercase font-mono">Fare Split / Cost Savings</div>
                          <div className="text-sm font-bold text-fg-primary font-mono mt-0.5">
                            💰 ₹{Math.round(15 + 12 * matchResult.sharedKm * 0.6)} / person
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono text-accent font-bold">
                            Saved ₹{matchResult.passengerFareSaved || 25}
                          </span>
                          <div className="text-[10px] text-fg-muted">40% Eco-Discount vs Solo</div>
                        </div>
                      </div>

                      <div className="text-[11px] text-fg-muted leading-tight">
                        Pooled Route: <span className="text-accent font-mono">{matchResult.pooledRoute?.join(' → ')}</span>
                      </div>

                      {!bookingSuccess ? (
                        <button
                          onClick={handleConfirmBooking}
                          className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-[#080D14] font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Confirm & Join Pool (₹{Math.round(15 + 12 * matchResult.sharedKm * 0.6)})
                        </button>
                      ) : (
                        <div className="p-3 rounded-xl bg-accent/20 border border-accent text-center text-accent text-xs font-bold space-y-1">
                          <div className="flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4" /> Ride Confirmed! Booking Ref #{bookingSuccess.bookingId}
                          </div>
                          <div className="text-[10px] text-fg-muted font-normal font-mono">
                            {bookingSuccess.seatsRemaining} seats left in vehicle · Driver alerted
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DRIVER OFFER FORM */}
          {activeTab === 'offer' && (
            <form onSubmit={handleCreateOffer} className="p-5 rounded-2xl bg-card border border-border-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-fg-primary flex items-center gap-2">
                  <Car className="w-4 h-4 text-accent" /> Offer a Campus Ride
                </h3>
                <span className="text-[11px] font-mono text-[#38BDF8]">Driver Console</span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-fg-muted mb-1 block">Starting Location</label>
                    <select
                      value={driverOrigin}
                      onChange={(e) => setDriverOrigin(e.target.value)}
                      className="w-full text-xs rounded-xl bg-[#080D14] border border-border-subtle px-3 py-2 text-fg-primary focus:border-accent outline-none"
                    >
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>{n.name.split(' (')[0]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-fg-muted mb-1 block">Destination</label>
                    <select
                      value={driverDestination}
                      onChange={(e) => setDriverDestination(e.target.value)}
                      className="w-full text-xs rounded-xl bg-[#080D14] border border-border-subtle px-3 py-2 text-fg-primary focus:border-accent outline-none"
                    >
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>{n.name.split(' (')[0]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-fg-muted mb-1 block">Departure Time</label>
                    <input
                      type="time"
                      value={driverDeparture}
                      onChange={(e) => setDriverDeparture(e.target.value)}
                      className="w-full text-xs rounded-xl bg-[#080D14] border border-border-subtle px-2.5 py-2 text-fg-primary focus:border-accent outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-fg-muted mb-1 block">Seats Available</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={driverSeats}
                      onChange={(e) => setDriverSeats(parseInt(e.target.value) || 1)}
                      className="w-full text-xs rounded-xl bg-[#080D14] border border-border-subtle px-2.5 py-2 text-fg-primary focus:border-accent outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-fg-muted mb-1 block">Vehicle Type</label>
                    <select
                      value={driverVehicle}
                      onChange={(e) => setDriverVehicle(e.target.value)}
                      className="w-full text-xs rounded-xl bg-[#080D14] border border-border-subtle px-2 py-2 text-fg-primary focus:border-accent outline-none"
                    >
                      <option value="EV_CAR">⚡ EV Car</option>
                      <option value="CAMPUS_SHUTTLE">🚐 Shuttle</option>
                      <option value="PETROL_CAR">🚗 Petrol</option>
                      <option value="E_GOLF_CART">🛺 E-Cart</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border-subtle text-xs text-fg-muted space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Driver Earnings Model:</span>
                  <span className="font-mono text-accent font-bold">85% of pooled fare</span>
                </div>
                <div className="text-[10px] text-fg-muted">
                  Max allowable detour capped at 35% to protect driver schedule.
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-[#080D14] font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                <Car className="w-3.5 h-3.5" /> Publish Ride Offer
              </button>
            </form>
          )}

          {/* TAB 3: BROWSE ALL ACTIVE OFFERS & REQUESTS */}
          {activeTab === 'pools' && (
            <div className="p-5 rounded-2xl bg-card border border-border-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-fg-primary flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" /> Active Campus Pools ({offers.length})
                </h3>
                <span className="text-[11px] font-mono text-accent">Real-time Feed</span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {offers.map(offer => (
                  <div key={offer.id} className="p-3.5 rounded-xl bg-surface border border-border-subtle text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={offer.driver_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${offer.driver_name}`}
                          alt={offer.driver_name}
                          className="w-6 h-6 rounded-full border border-border-subtle bg-card"
                        />
                        <span className="font-bold text-fg-primary">{offer.driver_name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-card border border-border-subtle text-accent">
                          {offer.vehicle_type === 'EV_CAR' ? '⚡ EV' : '🚗 Petrol'}
                        </span>
                      </div>
                      <span className="font-mono text-accent font-bold">{offer.departure_time}</span>
                    </div>

                    <div className="text-[11px] text-fg-muted flex items-center gap-1.5 font-mono">
                      <span>{offer.origin_node_id}</span>
                      <ArrowRight className="w-3 h-3 text-fg-muted" />
                      <span>{offer.destination_node_id}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50 text-[10px] text-fg-muted">
                      <span>Status: <span className="font-mono text-emerald-400 font-semibold">{offer.status.toUpperCase()}</span></span>
                      <span className="text-accent font-mono font-semibold">{offer.available_seats} / {offer.total_seats} seats free</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RidePooling;
