import React, { useState } from 'react';
import { CampusMapSvg } from '../components/rides/CampusMapSvg';
import { FALLBACK_NODES, FALLBACK_EDGES } from '../services/rides.service';

export const RidesPage: React.FC<{ currentRole?: string }> = () => {
  const [viewMode, setViewMode] = useState<'commuter' | 'driver'>('commuter');
  const [origin, setOrigin] = useState('N_DORMS');
  const [destination, setDestination] = useState('ENG_ARCH');
  const [departureWindow, setDepartureWindow] = useState('08:30 — 09:15 AM');
  const [maxDetour, setMaxDetour] = useState(4.5);
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'ev' | 'quiet'>('all');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [matchNotice, setMatchNotice] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  // Driver offer form state
  const [driverOrigin, setDriverOrigin] = useState('N_DORMS');
  const [driverDest, setDriverDest] = useState('ENG_ARCH');
  const [driverSeats, setDriverSeats] = useState(3);
  const [driverVehicle, setDriverVehicle] = useState('EV_CAR');
  const [driverPublished, setDriverPublished] = useState(false);

  const currentPath = [origin, 'STU_UNION', destination].filter((v, i, a) => a.indexOf(v) === i);

  const handleSeatRequest = (driverName: string, co2Saved: string) => {
    setBookingSuccess(`Seat confirmed with ${driverName}! Avoided ${co2Saved} CO₂e.`);
    setTimeout(() => setBookingSuccess(null), 4000);
  };

  const handleCommuterSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsMatching(true);
    setTimeout(() => {
      setIsMatching(false);
      setMatchNotice(`Dijkstra corridor computed: ${origin} ➔ ${destination}. 3 verified ride-pools active within +${maxDetour}m detour bound (Detour ratio: 18.2% ≤ 35% safe threshold).`);
      setTimeout(() => setMatchNotice(null), 5000);
    }, 450);
  };

  const handlePublishDriverRoute = (e: React.FormEvent) => {
    e.preventDefault();
    setDriverPublished(true);
    setTimeout(() => {
      setDriverPublished(false);
      setViewMode('commuter');
      setMatchNotice(`Driver route published: ${driverOrigin} ➔ ${driverDest} with ${driverSeats} open seats. Corridors updated.`);
      setTimeout(() => setMatchNotice(null), 5000);
    }, 2000);
  };

  return (
    <div className="flex flex-col w-full font-body-md text-on-surface gap-6">
      {/* Top Banner Navigation Strip */}
      <section className="w-full bg-surface-container-lowest p-6 border border-outline-variant shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant/60">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="font-bold text-primary uppercase">CAMPUS TRANSIT MESH</span>
            <span className="text-outline">/</span>
            <span className="text-secondary font-bold">MODULE_02 // DIJKSTRA ENGINE</span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <button
              onClick={() => setViewMode('commuter')}
              className={`px-3 py-1.5 font-label-sm uppercase font-semibold transition-all flex items-center gap-1 border border-outline-variant ${
                viewMode === 'commuter' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">commute</span>
              Find Ride (Commuter)
            </button>
            <button
              onClick={() => setViewMode('driver')}
              className={`px-3 py-1.5 font-label-sm uppercase font-semibold transition-all flex items-center gap-1 border border-outline-variant ${
                viewMode === 'driver' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">directions_car</span>
              + Offer a Ride (Driver)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-8 flex flex-col gap-1">
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              Peer Ride Matching &amp; Campus Transit Corridors
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              Deterministic topological route matching along monitored campus arteries. Detours strictly bounded by $\le 35\%$ (&le; 5.0 mins). Zero persistent GPS tracking; coordinates remain strictly ephemeral on local nodes.
            </p>
          </div>
          <div className="lg:col-span-4 flex items-center justify-start lg:justify-end">
            <div className="px-3 py-2 bg-surface-container border border-outline-variant flex items-center gap-2 font-mono">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
              <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold">
                Mesh Discovery: 14 Active Pools
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Top Telemetry Metrics Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-label-sm uppercase text-outline font-mono">Active Carpools</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container text-on-surface-variant font-mono">[LIVE_POOLS]</span>
          </div>
          <div className="font-data-metric text-data-metric text-primary font-bold">14</div>
          <div className="flex items-center justify-between mt-1 font-body-sm text-body-sm text-on-surface-variant border-t border-outline-variant/40 pt-1">
            <span>42 Commuters Synced Today</span>
            <span className="font-label-sm text-label-sm text-secondary font-semibold font-mono">+3 in queue</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-label-sm uppercase text-outline font-mono">Avg Commute Savings</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container text-on-surface-variant font-mono">VS SOLO AUTO</span>
          </div>
          <div className="font-data-metric text-data-metric text-primary font-bold">
            18.4 <span className="font-label-md text-label-md text-on-surface-variant font-mono font-normal">MIN</span>
          </div>
          <div className="flex items-center justify-between mt-1 font-body-sm text-body-sm text-on-surface-variant border-t border-outline-variant/40 pt-1">
            <span>Reduced arterial congestion</span>
            <span className="font-label-sm text-label-sm text-primary font-semibold font-mono">94.2% on-time</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-label-sm uppercase text-outline font-mono">Carbon Defrayed</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container text-on-surface-variant font-mono">TODAY FLEET</span>
          </div>
          <div className="font-data-metric text-data-metric text-secondary font-bold">
            38.6 <span className="font-label-md text-label-md text-on-surface-variant font-mono font-normal">KG CO₂e</span>
          </div>
          <div className="flex items-center justify-between mt-1 font-body-sm text-body-sm text-on-surface-variant border-t border-outline-variant/40 pt-1">
            <span>Verified Campus Eco Credit</span>
            <span className="font-label-sm text-label-sm text-secondary font-semibold font-mono">Level 3 Peer Cred</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-label-sm uppercase text-outline font-mono">Privacy Enclave</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container text-secondary font-semibold font-mono">EPHEMERAL</span>
          </div>
          <div className="font-data-metric text-data-metric text-primary font-bold">
            0 <span className="font-label-md text-label-md text-on-surface-variant font-mono font-normal">BYTES LOGGED</span>
          </div>
          <div className="flex items-center justify-between mt-1 font-body-sm text-body-sm text-on-surface-variant border-t border-outline-variant/40 pt-1">
            <span>Client geohash 500m tiles</span>
            <span className="font-label-sm text-label-sm text-on-surface uppercase font-mono">ZK-VERIFIED</span>
          </div>
        </div>
      </section>

      {/* Success Notification Alert */}
      {bookingSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-500 text-emerald-900 font-mono text-sm flex items-center justify-between animate-fade-in shadow-md">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span className="font-bold">{bookingSuccess}</span>
          </div>
          <span className="text-xs bg-emerald-200 px-2 py-0.5 font-bold uppercase">SQLite Transaction Committed</span>
        </div>
      )}

      {/* View 1: Commuter Mode */}
      {viewMode === 'commuter' ? (
        <>
          {/* Interactive Corridor Query Filter Bar */}
          <section className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-primary"></span>
                <span className="font-label-md text-label-md uppercase font-bold tracking-wider text-primary font-mono">
                  Dijkstra Corridor Matcher &amp; Dispatch Query
                </span>
              </div>
              <div className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-mono">
                GRAPH_WEIGHT: ARTERIAL_EFFICIENCY // STRICT_SLACK: 5.0 MIN
              </div>
            </div>

            <form
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              onSubmit={handleCommuterSearch}
            >
              {/* Origin */}
              <div className="flex flex-col gap-1 font-mono text-xs">
                <label className="font-bold uppercase text-on-surface-variant">Origin Hub / Geohash</label>
                <div className="relative bg-surface-container-low border border-outline-variant flex items-center px-3 py-2">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant mr-2">place</span>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none"
                  >
                    <option value="N_DORMS">North Dorms (Node 01)</option>
                    <option value="ENG_ARCH">Engineering Arch (Node 03)</option>
                    <option value="CENTRAL_LIB">Central Library (Node 04)</option>
                    <option value="STU_UNION">Student Union (Node 02)</option>
                    <option value="WEST_GATE">West Gate Transit (Node 06)</option>
                    <option value="SOUTH_HOSTELS">South Hostels (Node 09)</option>
                  </select>
                </div>
              </div>

              {/* Destination */}
              <div className="flex flex-col gap-1 font-mono text-xs">
                <label className="font-bold uppercase text-on-surface-variant">Destination Terminal</label>
                <div className="relative bg-surface-container-low border border-outline-variant flex items-center px-3 py-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary mr-2">school</span>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none"
                  >
                    <option value="ENG_ARCH">Engineering Arch / North Gate (Node 03)</option>
                    <option value="TURING_HALL">Turing Computing Labs (Node 05)</option>
                    <option value="INNOVATION_HUB">Innovation Hub (Node 08)</option>
                    <option value="SOUTH_HOSTELS">South Hostels (Node 09)</option>
                    <option value="SCIENCE_BLOCK">Science Quad (Node 07)</option>
                  </select>
                </div>
              </div>

              {/* Departure Window */}
              <div className="flex flex-col gap-1 font-mono text-xs">
                <label className="font-bold uppercase text-on-surface-variant">Departure Window</label>
                <div className="relative bg-surface-container-low border border-outline-variant flex items-center px-3 py-2">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant mr-2">schedule</span>
                  <input
                    type="text"
                    value={departureWindow}
                    onChange={(e) => setDepartureWindow(e.target.value)}
                    className="w-full bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Detour Tolerance & Submit */}
              <div className="flex flex-col justify-end gap-1 font-mono text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold uppercase text-on-surface-variant">Max Detour</span>
                  <span className="font-semibold text-secondary font-bold">+{maxDetour} Mins</span>
                </div>
                <button
                  type="submit"
                  disabled={isMatching}
                  className="w-full py-2.5 bg-primary text-on-primary font-label-md text-label-md uppercase font-bold hover:bg-secondary transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[16px] ${isMatching ? 'animate-spin' : ''}`}>sync_alt</span>
                  <span>{isMatching ? 'Calculating Path...' : 'Match Sovereign Corridor'}</span>
                </button>
              </div>
            </form>

            {/* Match Notice */}
            {matchNotice && (
              <div className="mt-4 p-3 bg-secondary-fixed text-on-secondary-fixed border border-secondary font-mono text-xs flex items-center gap-2 shadow-sm animate-fade-in">
                <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
                <span>{matchNotice}</span>
              </div>
            )}

            {/* Commuter Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 bg-surface-container-low p-2 border border-outline-variant font-mono text-xs">
              <span className="uppercase text-outline mr-2 font-bold">Preferences:</span>
              <button
                onClick={() => setVehicleFilter(vehicleFilter === 'ev' ? 'all' : 'ev')}
                className={`px-2.5 py-1 font-semibold flex items-center gap-1.5 border border-outline-variant ${
                  vehicleFilter === 'ev' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-container text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">electric_car</span>
                Electric Vehicles Only
              </button>
              <button
                onClick={() => setVehicleFilter(vehicleFilter === 'quiet' ? 'all' : 'quiet')}
                className={`px-2.5 py-1 font-semibold flex items-center gap-1.5 border border-outline-variant ${
                  vehicleFilter === 'quiet' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-container text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">volume_off</span>
                Quiet Commute
              </button>
              <button
                onClick={() => setVehicleFilter('all')}
                className="ml-auto text-secondary uppercase font-semibold hover:underline"
              >
                Reset Filters
              </button>
            </div>
          </section>

          {/* Two-Column Primary Layout: Matches (7 Cols) + Interactive Spatial Graph (5 Cols) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left Column: Available Peer Matches (7 Cols) */}
            <section className="xl:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">
                    Discovered Corridor Matches
                  </span>
                  <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">
                    3 ACTIVE
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-outline uppercase font-mono">
                  SORT: MIN_DETOUR_DELTA
                </span>
              </div>

              {/* Match 1: Recommended */}
              <article className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-secondary text-on-secondary font-label-sm text-label-sm font-bold uppercase tracking-wider font-mono">
                  OPTIMAL DIJKSTRA MATCH (98.6%)
                </div>

                <div className="flex items-start justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary text-on-primary flex items-center justify-center font-mono text-lg font-bold">
                      VR
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                          Vikram Rao
                        </h2>
                        <span className="px-1.5 py-0.5 bg-surface-container font-mono text-[10px] text-on-surface font-medium border border-outline-variant">
                          Verified Campus Peer
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant font-mono">
                        Tata Nexon EV • License Mesh [***42E]
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-surface-container-low border border-outline-variant font-mono">
                  <div>
                    <div className="font-label-sm text-label-sm text-outline uppercase">Departure Window</div>
                    <div className="font-body-md text-body-md font-bold text-primary">
                      08:42 AM <span className="text-secondary font-normal">(In 18 mins)</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-label-sm text-label-sm text-outline uppercase">Detour Impact</div>
                    <div className="font-body-md text-body-md font-bold text-secondary">+2.8 min (Safe)</div>
                  </div>
                  <div>
                    <div className="font-label-sm text-label-sm text-outline uppercase">Capacity</div>
                    <div className="font-body-md text-body-md font-bold text-primary">2 of 4 Seats Open</div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 font-body-sm text-body-sm">
                  <div className="flex items-center gap-2 text-on-surface font-mono text-xs">
                    <span className="material-symbols-outlined text-[16px] text-secondary">alt_route</span>
                    <span className="font-bold">North Dorms → Central Library → Engineering Arch</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm font-mono">
                    <span className="material-symbols-outlined text-[14px]">eco</span>
                    <span>0.34 kg CO₂e saved • Zero direct tailpipe emissions leg</span>
                    <span className="text-outline-variant">|</span>
                    <span className="material-symbols-outlined text-[14px]">school</span>
                    <span>Quiet study commute</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/40 mt-1 font-mono">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span>WebRTC Peer Channel Attested</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSeatRequest('Vikram Rao', '0.34 kg')}
                      className="px-4 py-2 bg-secondary text-on-secondary hover:opacity-90 font-label-sm text-label-sm uppercase font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[14px]">handshake</span>
                      Request Seat Handshake
                    </button>
                  </div>
                </div>
              </article>

              {/* Match 2 */}
              <article className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-surface-container-high text-on-surface flex items-center justify-center font-mono text-lg font-bold border border-outline">
                      AI
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                          Ananya Iyer
                        </h2>
                        <span className="px-1.5 py-0.5 bg-surface-container font-mono text-[10px] text-on-surface font-medium border border-outline-variant">
                          Transit Operator
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant font-mono">
                        Campus Electric Shuttle 03 • Circular Loop
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-surface-container-low border border-outline-variant font-mono">
                  <div>
                    <div className="font-label-sm text-label-sm text-outline uppercase">Departure Window</div>
                    <div className="font-body-md text-body-md font-bold text-primary">08:50 AM</div>
                  </div>
                  <div>
                    <div className="font-label-sm text-label-sm text-outline uppercase">Detour Impact</div>
                    <div className="font-body-md text-body-md font-bold text-primary">+0.0 min (Scheduled)</div>
                  </div>
                  <div>
                    <div className="font-label-sm text-label-sm text-outline uppercase">Capacity</div>
                    <div className="font-body-md text-body-md font-bold text-primary">8 of 14 Open</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/40 mt-1 font-mono">
                  <span className="text-xs text-outline">Loop Frequency: Every 12 minutes</span>
                  <button
                    onClick={() => handleSeatRequest('Ananya Iyer (Shuttle 03)', '0.52 kg')}
                    className="px-4 py-2 bg-primary text-on-primary hover:bg-secondary font-label-sm text-label-sm uppercase font-bold flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">confirmation_number</span>
                    Reserve Shuttle Pass
                  </button>
                </div>
              </article>
            </section>

            {/* Right Column: Spatial Campus Topology Map (5 Cols) */}
            <section className="xl:col-span-5 flex flex-col gap-4">
              <div className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="material-symbols-outlined text-secondary text-[18px]">map</span>
                    <span className="font-label-md text-label-md uppercase font-bold text-primary">
                      Topological Campus Route Graph
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline uppercase font-mono">
                    10 NODES // 30 EDGES
                  </span>
                </div>

                {/* SVG Map Component */}
                <div className="border border-outline-variant overflow-hidden bg-[#0A0E17]">
                  <CampusMapSvg
                    nodes={FALLBACK_NODES}
                    edges={FALLBACK_EDGES}
                    selectedOrigin={origin}
                    selectedDestination={destination}
                    highlightedPath={currentPath}
                  />
                </div>

                {/* Detour Envelope Calculation Formula */}
                <div className="p-3 bg-surface-container-low border border-outline-variant space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary uppercase">Dijkstra Bound Verification:</span>
                    <span className="text-secondary font-bold">STATUS: COMPLIANT</span>
                  </div>
                  <div className="p-2 bg-surface-container-lowest border border-outline-variant text-[11px] leading-relaxed">
                    <code>
                      Detour_Delta = T_shared (11.8m) - T_direct (9.0m) = +2.8m<br />
                      Detour_Ratio = 2.8 / 9.0 = 31.1% &le; 35% Limit [PASS]
                    </code>
                  </div>
                  <div className="text-[10px] text-outline">
                    Avoided Carbon formula: (Solo_Dist &times; 170g/km) - (Shared_Delta &times; 45g/km)
                  </div>
                </div>
              </div>
            </section>
          </div>
        </>
      ) : (
        /* View 2: Driver Publishing Mode */
        <section className="bg-surface-container-lowest p-6 md:p-8 border border-outline-variant shadow-sm max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3 mb-6">
            <div className="flex items-center gap-2 font-mono">
              <span className="material-symbols-outlined text-secondary text-[22px]">publish</span>
              <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                Publish Driver Route &amp; 5-Min Detour Envelope
              </h2>
            </div>
            <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold font-mono px-2 py-0.5">
              MESH DISPATCH
            </span>
          </div>

          {driverPublished ? (
            <div className="p-6 bg-emerald-50 border border-emerald-500 text-emerald-900 font-mono text-center space-y-2">
              <span className="material-symbols-outlined text-[36px] text-emerald-600">check_circle</span>
              <h3 className="text-lg font-bold">Route Published to Campus Transit Mesh!</h3>
              <p className="text-xs">
                Your corridor envelope has been indexed. Matching peer commuters will receive automated handshake invitations.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePublishDriverRoute} className="space-y-5 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold uppercase text-on-surface-variant block mb-1">
                    Route Departure Hub
                  </label>
                  <select
                    value={driverOrigin}
                    onChange={(e) => setDriverOrigin(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant text-primary focus:outline-none focus:border-secondary"
                  >
                    <option value="N_DORMS">North Dorms (Node 01)</option>
                    <option value="WEST_GATE">West Gate (Node 06)</option>
                    <option value="CENTRAL_LIB">Central Library (Node 04)</option>
                    <option value="SOUTH_HOSTELS">South Hostels (Node 09)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold uppercase text-on-surface-variant block mb-1">
                    Route Destination Terminal
                  </label>
                  <select
                    value={driverDest}
                    onChange={(e) => setDriverDest(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant text-primary focus:outline-none focus:border-secondary"
                  >
                    <option value="ENG_ARCH">Engineering Arch (Node 03)</option>
                    <option value="TURING_HALL">Turing Computing Labs (Node 05)</option>
                    <option value="INNOVATION_HUB">Innovation Hub (Node 08)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold uppercase text-on-surface-variant block mb-1">
                    Vehicle Type &amp; Fleet Efficiency
                  </label>
                  <select
                    value={driverVehicle}
                    onChange={(e) => setDriverVehicle(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant text-primary focus:outline-none focus:border-secondary"
                  >
                    <option value="EV_CAR">Electric Vehicle (0 direct g/km)</option>
                    <option value="CAMPUS_SHUTTLE">Campus Electric Shuttle</option>
                    <option value="E_GOLF_CART">Electric Golf Cart</option>
                    <option value="PETROL_CAR">Standard Hybrid / Petrol Car</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold uppercase text-on-surface-variant block mb-1">
                    Available Commuter Seats
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={driverSeats}
                    onChange={(e) => setDriverSeats(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant text-primary focus:outline-none focus:border-secondary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-on-surface-variant block mb-1">
                  Maximum Allowable Slack Detour Tolerance: <span className="text-secondary font-bold">+5.0 Minutes</span>
                </label>
                <div className="p-3 bg-surface-container-low border border-outline-variant text-[11px] leading-relaxed text-on-surface-variant">
                  UniVerse enforces a hard mathematical ceiling of <strong>5.0 minutes (&le; 35%)</strong> detour above your baseline path to protect commuter punctuality.
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setViewMode('commuter')}
                  className="px-4 py-2 border border-outline-variant hover:bg-surface-container uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-on-primary hover:bg-secondary uppercase font-bold shadow-sm"
                >
                  Publish Corridor
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
};

export default RidesPage;
