import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { CampusService, FacilityIssue, CampusLocation } from '../services/campus.service';

export const FacilityIssuesPage: React.FC = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<FacilityIssue[]>([]);
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // New Issue Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('electrical');
  const [urgency, setUrgency] = useState('medium');
  const [locationId, setLocationId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Resolution Modal / Action
  const [selectedIssue, setSelectedIssue] = useState<FacilityIssue | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isWardenOrAdmin = user?.role === 'warden' || user?.role === 'admin' || user?.roles?.some(r => r === 'warden' || r === 'admin');

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await CampusService.getFacilityIssues(statusFilter !== 'all' ? statusFilter : undefined);
      setIssues(data.issues || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load facility issues');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchLocations = async () => {
    try {
      const data = await CampusService.getDirectory();
      setLocations(data.locations || []);
      if (data.locations?.length > 0 && !locationId) {
        setLocationId(data.locations[0].id);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await CampusService.reportFacilityIssue({
        title: title.trim(),
        description: description.trim(),
        category,
        urgency,
        location_id: locationId || undefined
      });
      setModalOpen(false);
      setTitle('');
      setDescription('');
      fetchIssues();
    } catch (err: any) {
      alert(err?.message || 'Failed to report issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (issueId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      await CampusService.updateFacilityIssueStatus(issueId, newStatus, resolutionNotes || undefined);
      setSelectedIssue(null);
      setResolutionNotes('');
      fetchIssues();
    } catch (err: any) {
      alert(err?.message || 'Failed to update issue status');
    } finally {
      setActionLoading(false);
    }
  };

  const urgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-error-container text-on-error-container border-error font-bold';
      case 'high':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'medium':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-surface-container text-on-surface-variant border-outline-variant';
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-amber-900/30 text-amber-300 border-amber-500/50';
      case 'in_progress':
        return 'bg-primary/20 text-primary border-primary/50';
      case 'resolved':
        return 'bg-emerald-900/30 text-emerald-300 border-emerald-500/50';
      case 'rejected':
        return 'bg-surface-container-high text-outline border-outline-variant';
      default:
        return 'bg-surface-container text-on-surface';
    }
  };

  return (
    <div className="space-y-6 font-body-md text-on-surface">
      {/* Editorial Header */}
      <div className="p-6 md:p-8 bg-surface-container-lowest border border-outline-variant shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-secondary font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>RESIDENTIAL &amp; CAMPUS FACILITIES // WARDEN OPERATIONS</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Campus Infrastructure &amp; Maintenance Triage
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1">
            Real-time residential defect monitoring, rapid hostel maintenance routing, and double-signed resolution verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-primary text-on-primary font-mono text-xs uppercase font-bold hover:bg-secondary transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">build</span>
            <span>Report Defect</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="p-4 bg-surface border border-outline-variant flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant uppercase font-bold">STATUS FILTER:</span>
          {(['all', 'open', 'in_progress', 'resolved', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 font-bold uppercase transition-all ${
                statusFilter === st
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="text-outline text-right">
          TOTAL DEFECT TICKETS: <span className="font-bold text-primary">{issues.length}</span>
        </div>
      </div>

      {/* Issues Queue */}
      {loading ? (
        <div className="p-12 text-center font-mono text-sm text-on-surface-variant">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          LOADING FACILITIES DATABASE RECORDS...
        </div>
      ) : issues.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-outline-variant font-mono text-sm text-on-surface-variant">
          NO DEFECT TICKETS FOUND FOR THE CURRENT FILTER.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="p-6 bg-surface-container-lowest border border-outline-variant shadow-sm hover:border-primary/50 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-6 font-mono text-xs"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 border text-[11px] font-bold uppercase ${statusBadge(issue.status)}`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2.5 py-0.5 border text-[11px] font-bold uppercase ${urgencyBadge(issue.urgency)}`}>
                    {issue.urgency} urgency
                  </span>
                  <span className="px-2 py-0.5 bg-surface-container border border-outline-variant text-[11px] uppercase text-outline">
                    CAT: {issue.category}
                  </span>
                  {issue.location_name && (
                    <span className="flex items-center gap-1 text-secondary font-bold text-[11px]">
                      <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                      {issue.location_name}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold font-sans">
                    {issue.title}
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface font-sans mt-1 leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/50">
                  <span>Reported by: <strong className="text-on-surface">{issue.reporter_name || 'Campus Student'}</strong></span>
                  <span>Ticket ID: <code>{issue.id}</code></span>
                  <span>Date: {new Date(issue.created_at).toLocaleDateString()}</span>
                  {issue.resolution_notes && (
                    <div className="w-full mt-2 p-2.5 bg-surface-container-low border border-outline-variant text-on-surface">
                      <strong className="text-secondary uppercase">Resolution Note:</strong> {issue.resolution_notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls for Warden / Admin */}
              {isWardenOrAdmin && (
                <div className="flex flex-col gap-2 shrink-0 md:w-48 pt-2 md:pt-0">
                  <span className="text-[10px] uppercase font-bold text-outline">WARDEN TRIAGE CONTROLS</span>
                  {issue.status === 'open' && (
                    <button
                      onClick={() => handleUpdateStatus(issue.id, 'in_progress')}
                      className="px-3 py-1.5 bg-primary text-on-primary hover:bg-secondary font-bold uppercase transition-all shadow-sm"
                    >
                      Assign / Progress
                    </button>
                  )}
                  {issue.status !== 'resolved' && (
                    <button
                      onClick={() => setSelectedIssue(issue)}
                      className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold uppercase transition-all shadow-sm"
                    >
                      Resolve Defect
                    </button>
                  )}
                  {issue.status === 'open' && (
                    <button
                      onClick={() => handleUpdateStatus(issue.id, 'rejected')}
                      className="px-3 py-1.5 border border-outline hover:bg-surface-container font-bold uppercase text-outline transition-all"
                    >
                      Reject Ticket
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report Defect Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="bg-surface border border-outline max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold font-sans">
                Report Campus Defect or Maintenance Issue
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-outline hover:text-on-surface font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <label className="block uppercase font-bold text-on-surface-variant mb-1">
                  Issue Summary / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken water heater in Block A 2nd floor"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase font-bold text-on-surface-variant mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-secondary"
                  >
                    <option value="electrical">Electrical</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="hvac">HVAC / Cooling</option>
                    <option value="structural">Structural</option>
                    <option value="cleanliness">Cleanliness</option>
                    <option value="safety">Safety / Security</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase font-bold text-on-surface-variant mb-1">
                    Urgency
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-secondary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block uppercase font-bold text-on-surface-variant mb-1">
                  Campus Location
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-secondary"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.building})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block uppercase font-bold text-on-surface-variant mb-1">
                  Detailed Description
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide details regarding the location, impact, and safety risks..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-secondary font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-outline hover:bg-surface-container uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary text-on-primary hover:bg-secondary font-bold uppercase transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Dispatch Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Notes Modal for Warden */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="bg-surface border border-outline max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold font-sans">
                Sign-off &amp; Resolve Defect
              </h3>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-outline hover:text-on-surface font-bold text-base"
              >
                ✕
              </button>
            </div>

            <p className="font-sans text-body-md text-on-surface">
              Resolving ticket: <strong>{selectedIssue.title}</strong>
            </p>

            <div>
              <label className="block uppercase font-bold text-on-surface-variant mb-1">
                Resolution Actions Taken
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Plumber replaced seal on valve #4. Inspected and verified water pressure."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-secondary font-sans"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setSelectedIssue(null)}
                className="px-4 py-2 border border-outline hover:bg-surface-container uppercase font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedIssue.id, 'resolved')}
                disabled={actionLoading}
                className="px-6 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold uppercase transition-all shadow-sm"
              >
                {actionLoading ? 'Saving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilityIssuesPage;
