import React, { useState, useEffect, useCallback } from 'react';
import {
  CampusService,
  CampusEvent,
  CampusCommunity,
  CampusLocation
} from '../services/campus.service';

const EVENT_CATEGORIES = ['All', 'Academic', 'Workshop', 'Hackathon', 'Cultural', 'Sports', 'Career'];
const COMMUNITY_CATEGORIES = ['All', 'Technical', 'Research', 'Sustainability', 'Arts', 'Sports'];

export const EventsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'events' | 'communities' | 'directory'>('events');

  // Events state
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [selectedEventCat, setSelectedEventCat] = useState('All');
  const [eventsLoading, setEventsLoading] = useState(true);
  const [rsvpLoadingId, setRsvpLoadingId] = useState<string | null>(null);

  // Communities state
  const [communities, setCommunities] = useState<CampusCommunity[]>([]);
  const [selectedCommCat, setSelectedCommCat] = useState('All');
  const [commLoading, setCommLoading] = useState(false);
  const [joinLoadingId, setJoinLoadingId] = useState<string | null>(null);

  // Directory state
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [dirSearch, setDirSearch] = useState('');
  const [dirLoading, setDirLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const data = await CampusService.getEvents(selectedEventCat !== 'All' ? selectedEventCat : undefined);
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setEventsLoading(false);
    }
  }, [selectedEventCat]);

  const fetchCommunities = useCallback(async () => {
    setCommLoading(true);
    try {
      const data = await CampusService.getCommunities(selectedCommCat !== 'All' ? selectedCommCat : undefined);
      setCommunities(data.communities || []);
    } catch (err) {
      console.error('Failed to load communities', err);
    } finally {
      setCommLoading(false);
    }
  }, [selectedCommCat]);

  const fetchDirectory = useCallback(async () => {
    setDirLoading(true);
    try {
      const data = await CampusService.getDirectory(undefined, dirSearch.trim() || undefined);
      setLocations(data.locations || []);
    } catch (err) {
      console.error('Failed to load directory', err);
    } finally {
      setDirLoading(false);
    }
  }, [dirSearch]);

  useEffect(() => {
    if (activeTab === 'events') fetchEvents();
    if (activeTab === 'communities') fetchCommunities();
    if (activeTab === 'directory') fetchDirectory();
  }, [activeTab, fetchEvents, fetchCommunities, fetchDirectory]);

  const handleToggleRsvp = async (event: CampusEvent) => {
    setRsvpLoadingId(event.id);
    try {
      const res = await CampusService.rsvpEvent(event.id);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? { ...e, hasRsvpd: res.registered, rsvpCount: res.rsvpCount }
            : e
        )
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to update RSVP');
    } finally {
      setRsvpLoadingId(null);
    }
  };

  const handleToggleJoinCommunity = async (comm: CampusCommunity) => {
    setJoinLoadingId(comm.id);
    try {
      const res = await CampusService.joinCommunity(comm.id);
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === comm.id
            ? { ...c, isMember: res.isMember, memberCount: res.memberCount }
            : c
        )
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to join community');
    } finally {
      setJoinLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col w-full font-body-md text-on-surface gap-6">
      {/* Editorial Identification Bar */}
      <section className="w-full bg-surface-container-low px-4 py-2 border border-outline-variant">
        <div className="w-full flex flex-wrap items-center justify-between gap-2 font-label-sm text-label-sm font-mono">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-on-primary px-2 py-0.5 tracking-widest uppercase font-bold">
              CAMPUS_COMMONS_05
            </span>
            <span className="text-on-surface font-semibold tracking-wide uppercase">
              EVENTS, COMMUNITIES &amp; FACILITIES DIRECTORY
            </span>
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <span className="flex items-center gap-1.5 text-secondary font-medium">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              REAL-TIME ENGAGEMENT
            </span>
            <span className="hidden md:inline bg-surface-container-high px-2 py-0.5 text-on-surface-variant font-mono">
              CAMPUS ACCESSIBLE LEDGER
            </span>
          </div>
        </div>
      </section>

      {/* Hero Banner */}
      <section className="w-full bg-surface-container-lowest p-6 md:p-8 border border-outline-variant shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="flex items-center gap-2 text-secondary font-label-md text-label-md uppercase tracking-wider font-mono font-bold">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span>Campus Life &amp; Guilds</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight font-extrabold">
              Be where things happen.
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              RSVP to machine learning workshops, hackathons, and cultural meets. Join active student communities
              and discover key campus facilities, labs, and research hubs.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex border border-outline-variant bg-surface-container p-1 font-mono text-xs">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 font-bold uppercase transition-colors flex items-center gap-2 ${
                activeTab === 'events'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">event</span>
              <span>Events ({events.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('communities')}
              className={`px-4 py-2 font-bold uppercase transition-colors flex items-center gap-2 ${
                activeTab === 'communities'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">groups</span>
              <span>Communities ({communities.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2 font-bold uppercase transition-colors flex items-center gap-2 ${
                activeTab === 'directory'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">map</span>
              <span>Campus Directory</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        {activeTab === 'events' && (
          <div className="mt-6 pt-6 border-t border-outline-variant flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-mono text-outline uppercase mr-2">Category:</span>
            {EVENT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedEventCat(cat)}
                className={`px-3 py-1 text-xs font-mono border transition-all ${
                  selectedEventCat === cat
                    ? 'bg-secondary text-on-secondary border-secondary font-bold'
                    : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'communities' && (
          <div className="mt-6 pt-6 border-t border-outline-variant flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-mono text-outline uppercase mr-2">Guild Focus:</span>
            {COMMUNITY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCommCat(cat)}
                className={`px-3 py-1 text-xs font-mono border transition-all ${
                  selectedCommCat === cat
                    ? 'bg-secondary text-on-secondary border-secondary font-bold'
                    : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'directory' && (
          <div className="mt-6 pt-6 border-t border-outline-variant">
            <div className="relative max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                type="text"
                value={dirSearch}
                onChange={(e) => setDirSearch(e.target.value)}
                placeholder="Search campus buildings, labs, libraries, or zones..."
                className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant text-xs font-sans focus:outline-none focus:border-secondary"
              />
            </div>
          </div>
        )}
      </section>

      {/* Main Tab Content */}
      {activeTab === 'events' && (
        <div>
          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-6 bg-surface-container-lowest border border-outline-variant animate-pulse h-64"></div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant">
              <p className="font-headline-sm text-primary font-bold">No events scheduled in this category</p>
              <button
                onClick={() => setSelectedEventCat('All')}
                className="mt-3 px-4 py-2 bg-primary text-on-primary font-mono text-xs uppercase font-bold"
              >
                Show All Events
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="flex flex-col justify-between bg-surface-container-lowest border border-outline-variant hover:border-outline transition-all p-6 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-surface-container border border-outline-variant text-primary">
                        {evt.category}
                      </span>
                      {evt.isDemo && (
                        <span className="text-[10px] font-mono text-outline uppercase px-1.5 py-0.2 bg-surface-container-high">
                          Demo
                        </span>
                      )}
                    </div>

                    <h3 className="font-title-md text-title-md font-bold text-primary mb-1">
                      {evt.title}
                    </h3>

                    <div className="space-y-1 my-3 text-xs font-mono text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                        <span>{new Date(evt.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span>
                        <span>{evt.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-secondary">person</span>
                        <span>Organized by {evt.organizerName}</span>
                      </div>
                    </div>

                    <p className="text-xs text-on-surface leading-relaxed line-clamp-3">
                      {evt.description}
                    </p>

                    {evt.tags && evt.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {evt.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 text-[10px] font-mono bg-surface-container-low text-on-surface-variant border border-outline-variant"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between gap-3 font-mono text-xs">
                    <span className="text-on-surface-variant">
                      {evt.rsvpCount} / {evt.capacity} Attending
                    </span>

                    <button
                      onClick={() => handleToggleRsvp(evt)}
                      disabled={rsvpLoadingId === evt.id}
                      className={`px-4 py-2 font-bold uppercase transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 ${
                        evt.hasRsvpd
                          ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                          : 'bg-primary text-on-primary hover:bg-secondary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {evt.hasRsvpd ? 'check' : 'event_available'}
                      </span>
                      <span>{evt.hasRsvpd ? 'Attending' : 'RSVP Now'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'communities' && (
        <div>
          {commLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-6 bg-surface-container-lowest border border-outline-variant animate-pulse h-64"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((comm) => (
                <div
                  key={comm.id}
                  className="flex flex-col justify-between bg-surface-container-lowest border border-outline-variant hover:border-outline transition-all p-6 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-surface-container border border-outline-variant text-primary">
                        {comm.category}
                      </span>
                      <span className="text-xs font-mono text-on-surface-variant">
                        {comm.memberCount} Members
                      </span>
                    </div>

                    <h3 className="font-title-md text-title-md font-bold text-primary mb-2">
                      {comm.name}
                    </h3>

                    <p className="text-xs text-on-surface leading-relaxed">
                      {comm.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between gap-3 font-mono text-xs">
                    <span className="text-[11px] text-outline uppercase">
                      Slug: /{comm.slug}
                    </span>

                    <button
                      onClick={() => handleToggleJoinCommunity(comm)}
                      disabled={joinLoadingId === comm.id}
                      className={`px-4 py-2 font-bold uppercase transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 ${
                        comm.isMember
                          ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                          : 'bg-primary text-on-primary hover:bg-secondary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {comm.isMember ? 'done' : 'group_add'}
                      </span>
                      <span>{comm.isMember ? 'Joined Guild' : 'Join Guild'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'directory' && (
        <div className="bg-surface-container-lowest border border-outline-variant p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-sm text-primary font-bold">Campus Facilities &amp; Enclaves</h3>
            <span className="text-xs font-mono text-outline">{locations.length} Locations Identified</span>
          </div>

          {dirLoading ? (
            <div className="p-8 text-center font-mono text-xs text-outline">Loading campus map coordinates...</div>
          ) : (
            <div className="divide-y divide-outline-variant border border-outline-variant">
              {locations.map((loc) => (
                <div key={loc.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-surface-container flex items-center justify-center text-secondary border border-outline-variant shrink-0">
                      <span className="material-symbols-outlined">
                        {loc.category === 'academic' ? 'domain' : loc.category === 'library' ? 'local_library' : loc.category === 'computing' ? 'memory' : 'place'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-primary">{loc.name}</span>
                        <span className="text-xs font-mono px-2 py-0.2 bg-surface-container text-on-surface-variant uppercase">
                          {loc.building} • Zone {loc.zone}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">{loc.description}</p>
                      <div className="flex items-center gap-4 text-[11px] font-mono text-outline mt-1.5">
                        <span>Hours: {loc.hours}</span>
                        <span>Accessibility: {loc.accessibility}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono px-2 py-1 bg-surface-container border border-outline-variant text-primary">
                      Node: {loc.nodeId || 'CAMPUS_CORE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
