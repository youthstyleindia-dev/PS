import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Shield, Clock, FileText, UserCheck, MessageSquare } from 'lucide-react';
import { ObservationRecord, ObservationReviewStatus } from '../types/observations';
import { submitReviewDecision } from '../services/examObservationApi';

interface ReviewerQueueProps {
  observations: ObservationRecord[];
  auditLogs: any[];
  onReviewSubmitted: (observationId: string, newStatus: ObservationReviewStatus, note: string) => void;
}

export const ReviewerQueue: React.FC<ReviewerQueueProps> = ({
  observations,
  auditLogs,
  onReviewSubmitted
}) => {
  const [selectedObsId, setSelectedObsId] = useState<string>(observations[0]?.id || '');
  const [reviewNote, setReviewNote] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredObservations = observations.filter(obs => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'PENDING') return obs.reviewStatus === 'PENDING_REVIEW';
    if (filterStatus === 'RESOLVED') return obs.reviewStatus !== 'PENDING_REVIEW';
    return true;
  });

  const selectedObservation = observations.find(o => o.id === selectedObsId) || filteredObservations[0];

  const handleResolve = async (decision: ObservationReviewStatus) => {
    if (!selectedObservation) return;
    if (!reviewNote || reviewNote.trim().length < 5) {
      setErrorMessage('A meaningful reviewer note (minimum 5 characters) is mandatory for audit compliance.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await submitReviewDecision(selectedObservation.id, decision, reviewNote.trim());
      onReviewSubmitted(selectedObservation.id, decision, reviewNote.trim());
      setReviewNote('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit review decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-on-surface">Proctor Observation Review Queue</h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {filteredObservations.length} Observations
          </span>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'PENDING', 'RESOLVED'].map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                filterStatus === status
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Queue List & Detail Review Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Observation Cards List */}
        <div className="lg:col-span-5 space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredObservations.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-low rounded-xl border border-outline-variant/20 text-on-surface-variant text-xs">
              No observations matching selected filter.
            </div>
          ) : (
            filteredObservations.map(obs => {
              const isSelected = selectedObservation?.id === obs.id;
              const isPending = obs.reviewStatus === 'PENDING_REVIEW';

              return (
                <div
                  key={obs.id}
                  onClick={() => setSelectedObsId(obs.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-surface-container border-primary shadow-md'
                      : 'bg-surface-container-low border-outline-variant/20 hover:border-outline-variant/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-on-surface truncate">
                      {obs.eventType.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isPending ? 'bg-error/15 text-error font-bold' : 'bg-secondary/15 text-secondary'
                    }`}>
                      {obs.reviewStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(obs.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-outline">
                      {obs.provenance}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Observation Triage Workspace */}
        <div className="lg:col-span-7 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-xl space-y-6">
          {selectedObservation ? (
            <>
              {/* Event Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-4">
                <div>
                  <h4 className="text-base font-bold text-on-surface">{selectedObservation.eventType.replace(/_/g, ' ')}</h4>
                  <p className="text-xs font-mono text-outline">
                    ID: <code>{selectedObservation.id}</code> &bull; Time: {selectedObservation.timestamp}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                  selectedObservation.reviewStatus === 'PENDING_REVIEW'
                    ? 'bg-error/15 text-error'
                    : 'bg-secondary/15 text-secondary'
                }`}>
                  {selectedObservation.reviewStatus}
                </span>
              </div>

              {/* Factual Signal Metadata */}
              <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 space-y-2">
                <span className="text-xs font-mono text-primary font-bold uppercase tracking-wider block">
                  Factual Signal Telemetry
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-outline block">Detection Source:</span>
                    <strong className="text-on-surface">{selectedObservation.provenance}</strong>
                  </div>
                  <div>
                    <span className="text-outline block">Model Score:</span>
                    <strong className="text-on-surface">
                      {selectedObservation.confidenceScore !== null ? `${Math.round(selectedObservation.confidenceScore * 100)}%` : 'Null (Rule Derived)'}
                    </strong>
                  </div>
                </div>

                {selectedObservation.metadata?.signalMetadata && (
                  <div className="mt-3 pt-3 border-t border-outline-variant/20 text-xs font-mono text-on-surface-variant space-y-1">
                    {Object.entries(selectedObservation.metadata.signalMetadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-outline">{k.replace(/_/g, ' ')}:</span>
                        <strong className="text-on-surface">{String(v)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ethical Disclaimer */}
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-on-surface-variant leading-relaxed">
                <strong className="text-primary block mb-0.5">Ethical Audit Invariant:</strong>
                Visual observations are neutral behavioural signals requiring context. A student may look down at paper or adjust lighting. Disciplinary conclusions are strictly human decisions.
              </div>

              {/* Proctor Rationale Input */}
              {selectedObservation.reviewStatus === 'PENDING_REVIEW' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5 mb-1.5">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Mandatory Proctor Review Rationale (Minimum 5 characters)
                    </label>
                    <textarea
                      rows={3}
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Enter specific audit justification (e.g. Student looked down at physical exam scratch paper; benign movement confirmed)."
                      className="w-full rounded-xl bg-surface-container border border-outline-variant/30 p-3 text-xs text-on-surface font-mono placeholder:text-outline focus:outline-none focus:border-primary"
                    />
                  </div>

                  {errorMessage && (
                    <p className="text-xs text-error font-mono">{errorMessage}</p>
                  )}

                  {/* Resolution Buttons */}
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleResolve('DISMISS_BENIGN_BEHAVIOR')}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/15 border border-secondary/30 text-secondary hover:bg-secondary/25 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Dismiss (Benign Activity)
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleResolve('DISMISS_FALSE_POSITIVE')}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-outline-variant/20 border border-outline-variant/40 text-on-surface-variant hover:bg-outline-variant/30 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Dismiss (Sensor Artifact)
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleResolve('ESCALATE_TO_INVIGILATOR')}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-error/15 border border-error/30 text-error hover:bg-error/25 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Escalate to Invigilator
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-surface-container-highest/30 border border-outline-variant/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-secondary">
                    <UserCheck className="w-4 h-4" />
                    Resolved by Proctor Audit
                  </div>
                  <p className="text-xs font-mono text-on-surface">
                    Audit Note: "{selectedObservation.proctorNotes || 'Reviewed and dismissed.'}"
                  </p>
                  <p className="text-[10px] font-mono text-outline">
                    Resolved at: {selectedObservation.resolvedAt || 'Recorded'}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-outline text-xs">
              Select an observation from the queue to inspect signals and perform audit review.
            </div>
          )}
        </div>
      </div>

      {/* Immutable Audit Trail Section */}
      {auditLogs.length > 0 && (
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
            <FileText className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface">
              Immutable Proctor Audit Trail (Append-Only SQLite Ledger)
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-outline-variant/20 text-outline">
                  <th className="pb-2">Audit ID</th>
                  <th className="pb-2">Proctor</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Status Delta</th>
                  <th className="pb-2">Justification Note</th>
                  <th className="pb-2">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-surface-container/50">
                    <td className="py-2.5 font-bold text-primary truncate max-w-[100px]">{log.id}</td>
                    <td className="py-2.5">{log.reviewer_name || log.proctor_id}</td>
                    <td className="py-2.5 font-semibold">{log.action}</td>
                    <td className="py-2.5 text-outline">
                      {log.previous_status} &rarr; <strong className="text-on-surface">{log.new_status}</strong>
                    </td>
                    <td className="py-2.5 max-w-xs truncate" title={log.proctor_notes || log.notes}>
                      {log.proctor_notes || log.notes}
                    </td>
                    <td className="py-2.5 text-outline">{log.timestamp_utc || log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
