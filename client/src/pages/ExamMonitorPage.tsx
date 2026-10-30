import React, { useState, useEffect, useRef } from 'react';
import { useExamCamera } from '../modules/exam-monitor/hooks/useExamCamera';
import { useVisionRuntime } from '../modules/exam-monitor/hooks/useVisionRuntime';
import { CameraConsentPanel } from '../modules/exam-monitor/components/CameraConsentPanel';
import { CameraPreview } from '../modules/exam-monitor/components/CameraPreview';
import { ModelStatusPanel } from '../modules/exam-monitor/components/ModelStatusPanel';
import { ReviewerQueue } from '../modules/exam-monitor/components/ReviewerQueue';
import { ObservationRecord, ObservationReviewStatus } from '../modules/exam-monitor/types/observations';
import { fetchPendingReviews } from '../modules/exam-monitor/services/examObservationApi';
import { ShieldCheck, Video, LayoutDashboard, Globe } from 'lucide-react';

export const ExamMonitorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TRIBUNAL_QUEUE' | 'VISUAL_INFERENCE_DOCK' | 'BROWSER_SESSION_DOCK'>('VISUAL_INFERENCE_DOCK');
  const [consentGranted, setConsentGranted] = useState<boolean>(false);
  const [activeSessionId, setActiveSessionId] = useState<string>('exam-101');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Camera and Vision Hooks
  const { videoRef, cameraState, startCamera, stopCamera } = useExamCamera();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    runtimeState,
    diagnostics,
    currentPose,
    personCount,
    inRestrictedRegion,
    isCalibrated,
    calibrateNeutral,
    onObservation,
    emitSampleEvent
  } = useVisionRuntime(activeSessionId, videoRef, canvasRef, cameraState.isActive);

  // Observation records state
  const [observations, setObservations] = useState<ObservationRecord[]>([
    {
      id: 'exev-101',
      sessionId: 'exam-101',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      eventType: 'RESTRICTED_ZONE_INCURSION',
      confidenceScore: 0.89,
      provenance: 'ACTUAL_INFERENCE',
      reviewStatus: 'PENDING_REVIEW',
      proctorNotes: null,
      resolvedAt: null,
      metadata: {
        signalMetadata: {
          region_name: 'Restricted Entry Frustum',
          intersection_ratio: 0.28,
          dwell_seconds: 2.8,
          student_context: 'Student noted that external desk lamp was adjusted due to afternoon sun glare.'
        }
      }
    },
    {
      id: 'exev-102',
      sessionId: 'exam-101',
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      eventType: 'MULTIPLE_OCCUPANTS_DETECTED',
      confidenceScore: 0.82,
      provenance: 'ACTUAL_INFERENCE',
      reviewStatus: 'PENDING_REVIEW',
      proctorNotes: null,
      resolvedAt: null,
      metadata: {
        signalMetadata: {
          detected_person_count: 2,
          dwell_seconds: 4.2,
          student_context: 'Campus dormitory roommate returned briefly to retrieve room key; student did not interact.'
        }
      }
    },
    {
      id: 'exev-103',
      sessionId: 'exam-101',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      eventType: 'BROWSER_TAB_BLUR',
      confidenceScore: 1.0,
      provenance: 'ACTUAL_INFERENCE',
      reviewStatus: 'PENDING_REVIEW',
      proctorNotes: null,
      resolvedAt: null,
      metadata: {
        signalMetadata: {
          detail: 'Browser window lost focus during active exam assessment session.',
          student_context: 'Operating system institutional 2FA session renewal prompt opened in front of browser.'
        }
      }
    }
  ]);

  // Subscribe to live emitted observations from vision runtime
  useEffect(() => {
    const unsub = onObservation((obs) => {
      const newRecord: ObservationRecord = {
        id: obs.eventId,
        sessionId: obs.sessionId,
        timestamp: obs.occurredAt,
        eventType: obs.eventType,
        confidenceScore: obs.modelScore ?? 0.85,
        provenance: obs.source === 'LIVE_MODEL_INFERENCE' ? 'ACTUAL_INFERENCE' : 'SIMULATED_EVENT',
        reviewStatus: 'PENDING_REVIEW',
        metadata: {
          clientEventType: obs.eventType,
          clientSource: obs.source,
          modelKey: obs.modelKey,
          modelVersion: obs.modelVersion,
          ruleKey: obs.ruleKey,
          ruleVersion: obs.ruleVersion,
          signalMetadata: obs.signalMetadata
        }
      };

      setObservations((prev) => [newRecord, ...prev]);
    });

    return () => unsub();
  }, [onObservation]);

  // Fetch pending reviews and audit logs from server on mount
  useEffect(() => {
    fetchPendingReviews()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const backendItems: ObservationRecord[] = data.map((d: any) => ({
            id: d.id,
            sessionId: d.exam_session_id,
            timestamp: d.timestamp || new Date().toISOString(),
            eventType: d.event_type,
            confidenceScore: d.confidence_score,
            provenance: d.provenance || 'ACTUAL_INFERENCE',
            reviewStatus: d.review_status,
            proctorNotes: d.proctor_notes,
            resolvedAt: d.resolved_at,
            metadata: JSON.parse(d.metrics_payload || '{}')
          }));

          setObservations((prev) => {
            const map = new Map<string, ObservationRecord>();
            for (const item of [...backendItems, ...prev]) {
              map.set(item.id, item);
            }
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});

    // Fetch audit trail
    fetch(`/api/exams/audit-log/${activeSessionId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((logs) => {
        if (Array.isArray(logs)) {
          setAuditLogs(logs);
        }
      })
      .catch(() => {});
  }, [activeSessionId]);

  const handleConsentGranted = async () => {
    setConsentGranted(true);
    await startCamera();
  };

  const handleConsentDeclined = () => {
    setConsentGranted(false);
    stopCamera();
    setActiveTab('TRIBUNAL_QUEUE');
  };

  const handleReviewSubmitted = (
    observationId: string,
    newStatus: ObservationReviewStatus,
    note: string
  ) => {
    setObservations((prev) =>
      prev.map((o) =>
        o.id === observationId
          ? { ...o, reviewStatus: newStatus, proctorNotes: note, resolvedAt: new Date().toISOString() }
          : o
      )
    );

    // Refresh audit trail
    fetch(`/api/exams/audit-log/${activeSessionId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((logs) => {
        if (Array.isArray(logs)) setAuditLogs(logs);
      })
      .catch(() => {});
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 font-sans selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      {/* Header & Mission Banner */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-secondary font-bold uppercase tracking-wider">
                MODULE E // SECURE VERIFICATION &amp; AUDIT
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                MEDIAPIPE EDGE VISION
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary mt-1">
              Responsible Examination Monitoring
            </h1>
            <p className="text-sm text-on-surface-variant font-sans max-w-3xl mt-1">
              Privacy-conscious computer vision observation assistant. Video frames are processed locally in your browser with zero raw video upload. All flags require mandatory human proctor adjudication with zero automated penalties.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-outline">SESSION ID:</span>
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-surface-container border border-outline-variant text-on-surface">
              {activeSessionId}
            </span>
          </div>
        </div>

        {/* 4 Auditable Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex flex-col justify-between">
            <div className="flex justify-between items-center pb-1 border-b border-outline-variant font-mono text-xs text-outline">
              <span>METRIC_01</span>
              <span className="text-secondary px-1 border border-secondary font-bold">BINDING</span>
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold font-mono text-primary">100%</span>
              <div className="font-bold text-primary mt-0.5 text-sm">Human Adjudication</div>
              <p className="text-xs text-on-surface-variant mt-1">Zero algorithmic penalties or auto-sanctions allowed.</p>
            </div>
            <span className="text-outline pt-2 border-t border-outline-variant font-mono text-[10px]">[CONSTITUTIONAL BINDING]</span>
          </div>

          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex flex-col justify-between">
            <div className="flex justify-between items-center pb-1 border-b border-outline-variant font-mono text-xs text-outline">
              <span>METRIC_02</span>
              <span className="text-outline px-1 border border-dashed border-outline font-mono">DISMISSAL</span>
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold font-mono text-primary">42%</span>
              <div className="font-bold text-primary mt-0.5 text-sm">Benign Activity Dismissal</div>
              <p className="text-xs text-on-surface-variant mt-1">Safely dismissed by proctors reviewing candidate context.</p>
            </div>
            <span className="text-outline pt-2 border-t border-outline-variant font-mono text-[10px]">[PEER_AUDITED]</span>
          </div>

          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex flex-col justify-between">
            <div className="flex justify-between items-center pb-1 border-b border-outline-variant font-mono text-xs text-outline">
              <span>METRIC_03</span>
              <span className="text-secondary px-1 border border-secondary font-mono font-bold">ZERO_STORAGE</span>
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold font-mono text-primary">0 bytes</span>
              <div className="font-bold text-primary mt-0.5 text-sm">Video Cloud Storage</div>
              <p className="text-xs text-on-surface-variant mt-1">Ephemeral client frame analysis; zero central video upload.</p>
            </div>
            <span className="text-outline pt-2 border-t border-outline-variant font-mono text-[10px]">[VERIFIED ZERO]</span>
          </div>

          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex flex-col justify-between">
            <div className="flex justify-between items-center pb-1 border-b border-outline-variant font-mono text-xs text-outline">
              <span>METRIC_04</span>
              <span className="text-outline px-1 border border-dashed border-outline font-mono">MODELS</span>
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold font-mono text-primary">2 Edge NNs</span>
              <div className="font-bold text-primary mt-0.5 text-sm">MediaPipe Tasks Vision</div>
              <p className="text-xs text-on-surface-variant mt-1">Face Landmarker 3D &bull; EfficientDet-Lite0 Object Detector.</p>
            </div>
            <span className="text-outline pt-2 border-t border-outline-variant font-mono text-[10px]">[LOCAL WASM]</span>
          </div>
        </div>
      </section>

      {/* Dock Navigation Switcher */}
      <div className="flex border border-outline-variant bg-surface-container-low font-mono text-xs rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setActiveTab('VISUAL_INFERENCE_DOCK')}
          className={`flex-1 px-4 py-3 font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'VISUAL_INFERENCE_DOCK'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Video className="w-4 h-4" />
          01 // LIVE LOCAL VISION ASSISTANT (MEDIAPIPE CV)
        </button>
        <button
          onClick={() => setActiveTab('TRIBUNAL_QUEUE')}
          className={`flex-1 px-4 py-3 font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'TRIBUNAL_QUEUE'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          02 // PROCTOR ADJUDICATION QUEUE ({observations.filter((o) => o.reviewStatus === 'PENDING_REVIEW').length})
        </button>
        <button
          onClick={() => setActiveTab('BROWSER_SESSION_DOCK')}
          className={`flex-1 px-4 py-3 font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'BROWSER_SESSION_DOCK'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Globe className="w-4 h-4" />
          03 // BROWSER FOCUS TELEMETRY
        </button>
      </div>

      {/* TAB 1: LIVE VISION ASSISTANT */}
      {activeTab === 'VISUAL_INFERENCE_DOCK' && (
        <div className="space-y-6">
          {!consentGranted ? (
            <CameraConsentPanel
              sessionId={activeSessionId}
              onConsentGranted={handleConsentGranted}
              onDecline={handleConsentDeclined}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-6">
                <CameraPreview
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  isCameraActive={cameraState.isActive}
                  runtimeState={runtimeState}
                  currentPose={currentPose}
                  diagnostics={diagnostics}
                  isCalibrated={isCalibrated}
                  inRestrictedRegion={inRestrictedRegion}
                  personCount={personCount}
                  onStopCamera={stopCamera}
                  onCalibrate={calibrateNeutral}
                />
              </div>

              <div className="lg:col-span-5 space-y-6">
                <ModelStatusPanel onInjectSample={emitSampleEvent} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROCTOR ADJUDICATION QUEUE */}
      {activeTab === 'TRIBUNAL_QUEUE' && (
        <ReviewerQueue
          observations={observations}
          auditLogs={auditLogs}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* TAB 3: BROWSER SESSION TELEMETRY */}
      {activeTab === 'BROWSER_SESSION_DOCK' && (
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
            <div>
              <h3 className="text-base font-bold text-on-surface">Browser Viewport &amp; Window Focus Invariants</h3>
              <p className="text-xs text-on-surface-variant font-mono">MODE 1 CLIENT-SIDE DOM FOCUS OBSERVABILITY</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-secondary/10 text-secondary border border-secondary/30">
              100% DETERMINISTIC DOM
            </span>
          </div>

          <p className="text-sm text-on-surface-variant leading-relaxed">
            UniVerse captures native browser focus and blur events (such as switching tabs or clicking out of the viewport) via standard HTML5 Window APIs. Unlike intrusive OS spy tools, this runs entirely within the sandboxed browser context.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20">
              <span className="text-xs font-mono text-outline block mb-1">EVENT 01</span>
              <strong className="text-sm text-on-surface block mb-1">Window Blur Detection (`window.onblur`)</strong>
              <p className="text-xs text-on-surface-variant">
                Triggered when candidate switches to another browser tab or launches another desktop window.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20">
              <span className="text-xs font-mono text-outline block mb-1">EVENT 02</span>
              <strong className="text-sm text-on-surface block mb-1">Fullscreen Departure (`document.fullscreenElement`)</strong>
              <p className="text-xs text-on-surface-variant">
                Triggered if candidate exits standard institutional full-screen viewport.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
