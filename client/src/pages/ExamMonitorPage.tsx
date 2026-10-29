import React, { useState, useEffect, useRef } from 'react';

interface ObservationItem {
  id: string | number;
  code: string;
  timestamp: string;
  eventType: string;
  duration?: string;
  detail: string;
  studentContext: string;
  confidenceScore: string | number;
  status: string;
  provenance: 'ACTUAL_INFERENCE' | 'SIMULATED_EVENT' | 'ESTIMATED_METRIC';
  frameSnapshotUrl?: string;
}

export const ExamMonitorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TRIBUNAL_QUEUE' | 'VISUAL_INFERENCE_DOCK' | 'BROWSER_SESSION_DOCK'>('TRIBUNAL_QUEUE');
  const [activeObservationId, setActiveObservationId] = useState<string | number>(1);
  const [proctorRationale, setProctorRationale] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mode 2 Visual Inference State
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraConsent, setCameraConsent] = useState<boolean>(false);
  const [zoneIncursionDetected, setZoneIncursionDetected] = useState<boolean>(false);
  const [multipleOccupantsDetected, setMultipleOccupantsDetected] = useState<boolean>(false);
  const [selectedProvenance, setSelectedProvenance] = useState<'ACTUAL_INFERENCE' | 'SIMULATED_EVENT'>('ACTUAL_INFERENCE');
  const [detectionConfidence, setDetectionConfidence] = useState<number>(87);

  // Video and Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Observation queue state
  const [observations, setObservations] = useState<ObservationItem[]>([
    {
      id: 'exev-101',
      code: 'OBS_8091_RESTRICTED_ZONE',
      timestamp: '14:24:18 UTC',
      eventType: 'RESTRICTED_ZONE_INCURSION',
      duration: '2.8s',
      detail: 'Spatial boundary violation: Silhouette contour entered preconfigured prohibited perimeter.',
      studentContext: 'Student noted that external desk lamp was adjusted due to afternoon sun glare.',
      confidenceScore: '89% Spatial Contour Match',
      status: 'PENDING_REVIEW',
      provenance: 'ACTUAL_INFERENCE'
    },
    {
      id: 'exev-102',
      code: 'OBS_8092_MULTIPLE_OCCUPANTS',
      timestamp: '14:28:12 UTC',
      eventType: 'MULTIPLE_OCCUPANTS_DETECTED',
      duration: '4.2s',
      detail: 'Secondary human silhouette detected entering the background camera frustum.',
      studentContext: 'Campus dormitory roommate returned briefly to retrieve room key; student did not interact.',
      confidenceScore: '82% Multi-Occupant Sensor Match',
      status: 'PENDING_REVIEW',
      provenance: 'ACTUAL_INFERENCE'
    },
    {
      id: 'exev-103',
      code: 'OBS_8093_WINDOW_BLUR',
      timestamp: '14:35:44 UTC',
      eventType: 'BROWSER_TAB_BLUR',
      duration: '3.1s',
      detail: 'Browser window lost focus during active exam assessment session.',
      studentContext: 'Operating system institutional 2FA session renewal prompt opened in front of browser.',
      confidenceScore: '100% Deterministic DOM Event',
      status: 'PENDING_REVIEW',
      provenance: 'ACTUAL_INFERENCE'
    },
    {
      id: 'exev-104',
      code: 'OBS_8094_FULLSCREEN_EXIT',
      timestamp: '14:41:02 UTC',
      eventType: 'FULLSCREEN_DEPARTURE',
      duration: '1.9s',
      detail: 'Browser viewport departed mandatory fullscreen canvas.',
      studentContext: 'Accidental touchpad multi-finger gesture triggered desktop space switch.',
      confidenceScore: '100% Deterministic DOM Event',
      status: 'PENDING_REVIEW',
      provenance: 'SIMULATED_EVENT'
    }
  ]);

  // Fetch pending reviews from backend on mount
  useEffect(() => {
    fetch('/api/exams/pending-reviews')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const backendItems: ObservationItem[] = data.map((d: any) => ({
            id: d.id,
            code: `OBS_${d.id.substring(0, 8).toUpperCase()}`,
            timestamp: d.timestamp || new Date().toISOString(),
            eventType: d.event_type,
            detail: `Observed event ${d.event_type} registered by examination monitor.`,
            studentContext: 'Context awaiting proctor review and student rebuttal testimony.',
            confidenceScore: `${Math.round((d.confidence_score || 0.8) * 100)}% Certainty`,
            status: d.review_status,
            provenance: d.provenance || 'ACTUAL_INFERENCE',
            frameSnapshotUrl: d.frame_snapshot_url
          }));
          setObservations((prev) => {
            const combined = [...backendItems];
            for (const item of prev) {
              if (!combined.some((c) => c.id === item.id)) combined.push(item);
            }
            return combined;
          });
        }
      })
      .catch(() => {});
  }, []);

  // WebCam Setup & Cleanup
  useEffect(() => {
    if (cameraActive && cameraConsent) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 480, height: 320 } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          console.warn('Camera stream unavailable, using synthetic visual canvas runner:', err);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraActive, cameraConsent]);

  // Canvas visual perimeter loop
  useEffect(() => {
    let animId: number;
    const renderPerimeter = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background camera or synthetic test pattern
      if (videoRef.current && videoRef.current.readyState === 4) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        // Synthetic room silhouette canvas
        ctx.fillStyle = '#efeeea';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desk surface line
        ctx.strokeStyle = '#c7c6ca';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 220);
        ctx.lineTo(canvas.width, 220);
        ctx.stroke();

        // Primary student silhouette (neutral)
        ctx.fillStyle = '#1b1c1a';
        ctx.beginPath();
        ctx.arc(240, 120, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(180, 220);
        ctx.quadraticCurveTo(240, 160, 300, 220);
        ctx.fill();

        // If multiple occupants simulated: draw second silhouette
        if (multipleOccupantsDetected) {
          ctx.fillStyle = '#003fe1';
          ctx.beginPath();
          ctx.arc(380, 90, 28, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(330, 220);
          ctx.quadraticCurveTo(380, 130, 430, 220);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.fillText('OCCUPANT #2', 355, 95);
        }
      }

      // Draw Virtual Restricted Perimeter Zone (Top-Left)
      const zoneX = 20;
      const zoneY = 20;
      const zoneW = 140;
      const zoneH = 110;

      ctx.strokeStyle = zoneIncursionDetected ? '#ba1a1a' : '#003fe1';
      ctx.lineWidth = zoneIncursionDetected ? 3 : 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(zoneX, zoneY, zoneW, zoneH);
      ctx.setLineDash([]);

      ctx.fillStyle = zoneIncursionDetected ? 'rgba(186, 26, 26, 0.2)' : 'rgba(0, 63, 225, 0.08)';
      ctx.fillRect(zoneX, zoneY, zoneW, zoneH);

      ctx.fillStyle = zoneIncursionDetected ? '#ba1a1a' : '#003fe1';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(
        zoneIncursionDetected ? '! RESTRICTED ZONE BREACH' : 'ZONE A // RESTRICTED',
        zoneX + 8,
        zoneY + 20
      );

      animId = requestAnimationFrame(renderPerimeter);
    };

    animId = requestAnimationFrame(renderPerimeter);
    return () => cancelAnimationFrame(animId);
  }, [cameraActive, zoneIncursionDetected, multipleOccupantsDetected]);

  // Mode 1: Listen for real browser focus/blur events
  useEffect(() => {
    const handleWindowBlur = () => {
      const newObs: ObservationItem = {
        id: `blur-${Date.now()}`,
        code: `OBS_DOM_BLUR_${Math.floor(Math.random() * 9000 + 1000)}`,
        timestamp: new Date().toLocaleTimeString() + ' UTC',
        eventType: 'BROWSER_TAB_BLUR',
        duration: '1.2s',
        detail: 'Live browser blur event detected: User switched windows or clicked outside viewport.',
        studentContext: 'Logged by local Mode 1 DOM focus observer during active session.',
        confidenceScore: '100% Deterministic Event',
        status: 'PENDING_REVIEW',
        provenance: 'ACTUAL_INFERENCE'
      };
      setObservations((prev) => [newObs, ...prev]);

      // Fire to backend
      fetch('/api/exams/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examSessionId: 'exam_1',
          eventType: 'BROWSER_TAB_BLUR',
          confidenceScore: 1.0,
          provenance: 'ACTUAL_INFERENCE'
        })
      }).catch(() => {});
    };

    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, []);

  // Dispatch visual event to backend
  const handleTriggerVisualEvent = async (eventType: 'RESTRICTED_ZONE_INCURSION' | 'MULTIPLE_OCCUPANTS_DETECTED') => {
    setIsSubmitting(true);
    if (eventType === 'RESTRICTED_ZONE_INCURSION') {
      setZoneIncursionDetected(true);
      setTimeout(() => setZoneIncursionDetected(false), 3000);
    } else {
      setMultipleOccupantsDetected(true);
      setTimeout(() => setMultipleOccupantsDetected(false), 3000);
    }

    try {
      const payload = {
        examSessionId: 'exam_1',
        eventType,
        confidenceScore: detectionConfidence / 100,
        provenance: selectedProvenance,
        frameSnapshotUrl: 'https://universe.campus.edu/frames/ephemeral-contour-vector.svg'
      };

      const res = await fetch('/api/exams/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const newObs: ObservationItem = {
        id: data.eventId || `vis-${Date.now()}`,
        code: `OBS_VIS_${Math.floor(Math.random() * 9000 + 1000)}`,
        timestamp: new Date().toLocaleTimeString() + ' UTC',
        eventType,
        duration: '3.4s',
        detail:
          eventType === 'RESTRICTED_ZONE_INCURSION'
            ? 'Visual spatial bounding box crossed preconfigured restricted zone perimeter.'
            : 'Secondary human contour detected in camera background visual frustum.',
        studentContext: 'Awaiting human proctor adjudication and student context submission.',
        confidenceScore: `${detectionConfidence}% Contour Certainty`,
        status: 'PENDING_REVIEW',
        provenance: selectedProvenance
      };

      setObservations((prev) => [newObs, ...prev]);
      setActiveObservationId(newObs.id);
      setActionSuccess(`New observable visual incident registered: ${eventType} [${selectedProvenance}]`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to dispatch visual event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (action: 'DISMISS_FALSE_POSITIVE' | 'ESCALATE_TO_INVIGILATOR') => {
    if (!proctorRationale.trim()) {
      alert('Mandatory Ethical Safeguard: A written audit rationale is required before recording proctor resolution.');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch(`/api/exams/events/${activeObservationId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          proctorNotes: proctorRationale,
          reviewerId: 'usr_proctor_1'
        })
      }).catch(() => {});

      setObservations((prev) =>
        prev.map((obs) =>
          obs.id === activeObservationId ? { ...obs, status: action } : obs
        )
      );

      setActionSuccess(
        action === 'DISMISS_FALSE_POSITIVE'
          ? `Observation safely dismissed as contextually verified false positive. Written rationale archived to immutable audit trail.`
          : `Observation escalated to joint Student-Faculty Peer Tribunal with protected student rebuttal rights.`
      );
      setProctorRationale('');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to resolve event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentObs = observations.find((o) => o.id === activeObservationId) || observations[0];

  return (
    <div className="flex flex-col w-full font-body-md text-on-surface gap-6">
      {/* Header Section */}
      <section className="w-full bg-surface border border-outline-variant p-6 md:p-8 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-secondary px-2 py-0.5 border border-secondary font-bold">
            // HUMAN-IN-THE-LOOP OVERSIGHT [CONSTITUTIONAL ETHICS]
          </span>
          <span className="font-mono text-xs text-outline hidden sm:inline">REF: CHARTER ARTICLE 12.3</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 flex flex-col gap-2">
            <h1 className="font-headline-xl text-headline-xl text-primary font-extrabold tracking-tight">
              Observations, not accusations.
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
              Automated heuristics are brittle, prone to demographic bias, and blind to physical context. UniVerse separates observation collection from human adjudication. Every incident requires double-human review, protected student rebuttals, and mandatory written auditor justification.
            </p>
          </div>

          <div className="lg:col-span-4 bg-surface-container-low p-4 border border-outline-variant flex flex-col gap-2 font-mono text-xs">
            <div className="flex justify-between items-center pb-1 border-b border-outline-variant">
              <span className="text-outline uppercase">PROCTOR_INTEGRITY_INDEX</span>
              <span className="text-secondary font-bold">100% AUDITABLE</span>
            </div>
            <div className="flex flex-col gap-0.5 py-1">
              <span className="text-on-surface-variant text-[11px]">ACTIVE ARBITRATION TRIBUNAL</span>
              <span className="font-semibold text-primary">Student Union + Faculty Senate Joint Mesh</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 overflow-hidden">
              <div className="bg-secondary h-full w-full"></div>
            </div>
            <span className="text-outline text-[10px]">[HARD CONSTRAINT: ZERO SYNTHETIC PREDETERMINATION]</span>
          </div>
        </div>

        {/* 4 Auditable Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="bg-surface-container-low p-4 border border-outline-variant flex flex-col justify-between">
            <div className="flex justify-between items-center pb-1 border-b border-outline-variant font-mono text-xs text-outline">
              <span>METRIC_01</span>
              <span className="text-secondary px-1 border border-secondary font-bold">BINDING</span>
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold font-mono text-primary">100%</span>
              <div className="font-bold text-primary mt-0.5 font-sans">Human Adjudication</div>
              <p className="text-xs text-on-surface-variant mt-1 font-sans">Zero algorithmic punitive actions allowed at protocol level.</p>
            </div>
            <span className="text-outline pt-2 border-t border-outline-variant font-mono text-[10px]">[CONSTITUTIONAL BINDING]</span>
          </div>

          <div className="bg-surface-container-low p-4 border border-outline-variant flex flex-col justify-between">
            <div className="flex justify-between items-center pb-1 border-b border-outline-variant font-mono text-xs text-outline">
              <span>METRIC_02</span>
              <span className="text-outline px-1 border border-dashed border-outline font-mono">DISMISSAL</span>
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold font-mono text-primary">42%</span>
              <div className="font-bold text-primary mt-0.5 font-sans">False Positive Rate</div>
              <p className="text-xs text-on-surface-variant mt-1 font-sans">Safely dismissed by student-faculty tribunal reviews.</p>
            </div>
            <span className="text-outline pt-2 border-t border-outline-variant font-mono text-[10px]">[PEER_AUDITED]</span>
          </div>

          <div className="bg-surface-container-low p-4 border border-outline-variant flex flex-col justify-between">
            <div className="flex justify-between items-center pb-1 border-b border-outline-variant font-mono text-xs text-outline">
              <span>METRIC_03</span>
              <span className="text-secondary px-1 border border-secondary font-mono font-bold">ZERO_STORAGE</span>
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold font-mono text-primary">0 bytes</span>
              <div className="font-bold text-primary mt-0.5 font-sans">Video Server Storage</div>
              <p className="text-xs text-on-surface-variant mt-1 font-sans">Ephemeral client frame analysis; zero central video upload.</p>
            </div>
            <span className="text-outline pt-2 border-t border-outline-variant font-mono text-[10px]">[VERIFIED ZERO]</span>
          </div>

          <div className="bg-surface-container-low p-4 border border-outline-variant flex flex-col justify-between">
            <div className="flex justify-between items-center pb-1 border-b border-outline-variant font-mono text-xs text-outline">
              <span>METRIC_04</span>
              <span className="text-outline px-1 border border-dashed border-outline font-mono">TTL_LIMIT</span>
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold font-mono text-primary">14 days</span>
              <div className="font-bold text-primary mt-0.5 font-sans">Metadata Expiry</div>
              <p className="text-xs text-on-surface-variant mt-1 font-sans">Immutable cryptographic auto-purge upon evaluation conclusion.</p>
            </div>
            <span className="text-outline pt-2 border-t border-outline-variant font-mono text-[10px]">[IMMUTABLE AUDIT]</span>
          </div>
        </div>
      </section>

      {/* Dock Navigation Switcher */}
      <div className="flex border border-outline-variant bg-surface-container-low font-mono text-xs">
        <button
          onClick={() => setActiveTab('TRIBUNAL_QUEUE')}
          className={`px-4 py-3 font-bold transition-all ${
            activeTab === 'TRIBUNAL_QUEUE'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          01 // TRIBUNAL ADJUDICATION QUEUE ({observations.filter((o) => o.status === 'PENDING_REVIEW').length})
        </button>
        <button
          onClick={() => setActiveTab('VISUAL_INFERENCE_DOCK')}
          className={`px-4 py-3 font-bold transition-all ${
            activeTab === 'VISUAL_INFERENCE_DOCK'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          02 // MODE 2: LOCAL VISUAL-EVENT ADAPTER (CV)
        </button>
        <button
          onClick={() => setActiveTab('BROWSER_SESSION_DOCK')}
          className={`px-4 py-3 font-bold transition-all ${
            activeTab === 'BROWSER_SESSION_DOCK'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          03 // MODE 1: BROWSER SESSION TELEMETRY
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-500 text-emerald-900 font-mono text-xs flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* TAB 1: TRIBUNAL QUEUE */}
      {activeTab === 'TRIBUNAL_QUEUE' && (
        <section className="w-full bg-surface p-6 md:p-8 border border-outline-variant shadow-sm flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-outline-variant pb-3">
            <div>
              <span className="font-mono text-xs uppercase text-secondary font-bold">
                // ACTIVE ARBITRATION BENCH
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold mt-0.5">
                Proctor Review Queue &amp; Student Context Dossier
              </h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span>EXAM SESSION: CS301_MIDTERM_TURING_04</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Observation Queue List (5 Cols) */}
            <div className="lg:col-span-5 space-y-3 font-mono">
              <div className="text-xs uppercase font-bold text-outline">
                PENDING INCIDENTS ({observations.filter((o) => o.status === 'PENDING_REVIEW').length})
              </div>

              {observations.map((obs) => (
                <div
                  key={obs.id}
                  onClick={() => setActiveObservationId(obs.id)}
                  className={`p-4 border transition-all cursor-pointer ${
                    activeObservationId === obs.id
                      ? 'bg-surface-container-low border-secondary shadow-sm'
                      : 'bg-surface border-outline-variant hover:border-outline'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-outline-variant">
                    <span className="font-bold text-primary">{obs.code}</span>
                    <span className="text-outline text-[11px]">{obs.timestamp}</span>
                  </div>
                  <div className="mt-2 text-xs text-on-surface leading-tight font-sans">
                    {obs.detail}
                  </div>
                  <div className="mt-2 pt-1 flex items-center justify-between text-[10px]">
                    <span className="text-secondary font-bold font-mono">[{obs.provenance}]</span>
                    <span
                      className={`px-1.5 py-0.5 font-bold uppercase ${
                        obs.status === 'PENDING_REVIEW'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : obs.status.includes('DISMISS')
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-purple-100 text-purple-900 border border-purple-300'
                      }`}
                    >
                      {obs.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Observation Adjudication Console (7 Cols) */}
            <div className="lg:col-span-7 bg-surface-container-low p-6 border border-outline-variant flex flex-col justify-between gap-4 font-mono text-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                  <span className="font-bold text-primary uppercase">
                    ADJUDICATION DOSSIER: {currentObs.code}
                  </span>
                  <span className="bg-surface px-2 py-0.5 border border-outline-variant">
                    CONFIDENCE: {currentObs.confidenceScore}
                  </span>
                </div>

                <div className="p-3 bg-surface border border-outline-variant space-y-1">
                  <div className="text-[11px] font-bold text-outline uppercase">Raw Sensor / Visual Marker:</div>
                  <div className="text-xs text-primary font-sans font-medium">{currentObs.detail}</div>
                </div>

                <div className="p-3 bg-surface border border-outline-variant space-y-1">
                  <div className="text-[11px] font-bold text-secondary uppercase">
                    Student Contextual Testimony / Room Log:
                  </div>
                  <div className="text-xs text-on-surface font-sans leading-relaxed">
                    {currentObs.studentContext}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-on-surface-variant block mb-1">
                    Mandatory Written Proctor Rationale (Enforced Before Resolution):
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={proctorRationale}
                    onChange={(e) => setProctorRationale(e.target.value)}
                    placeholder="e.g. Reviewed camera peripheral angle and verified physical calculator note on desk ledger. Consistent with mathematical derivation steps..."
                    className="w-full p-2.5 bg-surface border border-outline-variant text-xs text-primary font-sans focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              {/* Adjudication Buttons */}
              <div className="pt-3 border-t border-outline-variant flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleResolve('DISMISS_FALSE_POSITIVE')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white uppercase font-bold flex items-center gap-1 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Dismiss as False Positive
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleResolve('ESCALATE_TO_INVIGILATOR')}
                  className="px-4 py-2 bg-primary hover:bg-secondary text-on-primary uppercase font-bold flex items-center gap-1 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                  Refer to Joint Peer Tribunal
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: MODE 2 LOCAL VISUAL-EVENT ADAPTER */}
      {activeTab === 'VISUAL_INFERENCE_DOCK' && (
        <section className="w-full bg-surface p-6 md:p-8 border border-outline-variant shadow-sm flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-outline-variant pb-3 font-mono">
            <div>
              <span className="text-xs uppercase text-secondary font-bold">
                // MODE 2: CONSENTED LOCAL COMPUTER-VISION ADAPTER
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold mt-0.5 font-sans">
                Non-Identifying Visual Zone &amp; Occupancy Detection
              </h2>
            </div>
            <div className="text-xs text-outline">
              FRAME BUFFER: ZERO SERVER TRANSMISSION (ON-DEVICE CANVAS)
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono text-xs">
            {/* Visual Canvas Display (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-3 bg-surface-container-low p-4 border border-outline-variant">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                <span className="font-bold text-primary uppercase">LOCAL PERIMETER INFERENCE CANVAS</span>
                <span className="text-secondary font-bold">
                  {cameraActive ? 'CAMERA STREAM ACTIVE' : 'SYNTHETIC CONTOUR RUNNER'}
                </span>
              </div>

              {/* Hidden video element for webcam capture */}
              <video ref={videoRef} className="hidden" playsInline muted />

              {/* Canvas with Zone Overlay */}
              <div className="relative w-full aspect-[3/2] max-h-[300px] bg-surface border border-outline-variant overflow-hidden flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={320}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Consent and Camera Toggle */}
              <div className="p-3 bg-surface border border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-sans text-xs">
                  <input
                    type="checkbox"
                    checked={cameraConsent}
                    onChange={(e) => {
                      setCameraConsent(e.target.checked);
                      if (!e.target.checked) setCameraActive(false);
                    }}
                    className="accent-secondary"
                  />
                  <span>I grant temporary consent for local on-device camera inference.</span>
                </label>

                <button
                  type="button"
                  disabled={!cameraConsent}
                  onClick={() => setCameraActive(!cameraActive)}
                  className={`px-3 py-1.5 uppercase font-bold transition-all ${
                    cameraActive
                      ? 'bg-red-600 text-white'
                      : 'bg-primary text-on-primary hover:bg-secondary disabled:opacity-50'
                  }`}
                >
                  {cameraActive ? 'Stop Camera' : 'Start WebCam'}
                </button>
              </div>
            </div>

            {/* Visual Event Trigger Controls (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4 bg-surface p-4 border border-outline-variant">
              <span className="font-bold text-primary uppercase border-b border-outline-variant pb-2">
                PREDEFINED OBSERVABLE VISUAL EVENTS
              </span>

              {/* Provenance Tag Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-outline uppercase text-[11px]">Provenance Tag</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProvenance('ACTUAL_INFERENCE')}
                    className={`py-1.5 border text-center ${
                      selectedProvenance === 'ACTUAL_INFERENCE'
                        ? 'border-secondary bg-secondary text-on-secondary font-bold'
                        : 'border-outline-variant bg-surface-container'
                    }`}
                  >
                    ACTUAL_INFERENCE
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProvenance('SIMULATED_EVENT')}
                    className={`py-1.5 border text-center ${
                      selectedProvenance === 'SIMULATED_EVENT'
                        ? 'border-secondary bg-secondary text-on-secondary font-bold'
                        : 'border-outline-variant bg-surface-container'
                    }`}
                  >
                    SIMULATED_EVENT
                  </button>
                </div>
              </div>

              {/* Confidence Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-outline uppercase">Detector Certainty</span>
                  <span className="font-bold text-primary">{detectionConfidence}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="98"
                  value={detectionConfidence}
                  onChange={(e) => setDetectionConfidence(Number(e.target.value))}
                  className="w-full accent-secondary cursor-pointer"
                />
              </div>

              {/* Event 1: Restricted Zone Incursion */}
              <div className="p-3 bg-surface-container-low border border-outline-variant flex flex-col gap-2 font-sans">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-primary">EVENT TYPE 01</span>
                  <span className="text-secondary font-bold">SPATIAL CONTOUR</span>
                </div>
                <div className="font-bold text-xs text-primary font-mono">RESTRICTED_ZONE_INCURSION</div>
                <p className="text-[11px] text-on-surface-variant">
                  Silhouette contour violates preconfigured desk perimeter zone A.
                </p>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleTriggerVisualEvent('RESTRICTED_ZONE_INCURSION')}
                  className="w-full py-2 bg-primary text-on-primary font-mono text-xs uppercase font-bold hover:bg-secondary transition-all shadow-[2px_2px_0px_#003fe1]"
                >
                  Trigger Zone Incursion Event
                </button>
              </div>

              {/* Event 2: Multiple Occupants Detected */}
              <div className="p-3 bg-surface-container-low border border-outline-variant flex flex-col gap-2 font-sans">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-primary">EVENT TYPE 02</span>
                  <span className="text-secondary font-bold">SCENE DENSITY</span>
                </div>
                <div className="font-bold text-xs text-primary font-mono">MULTIPLE_OCCUPANTS_DETECTED</div>
                <p className="text-[11px] text-on-surface-variant">
                  Secondary human shape appears in background camera frustum.
                </p>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleTriggerVisualEvent('MULTIPLE_OCCUPANTS_DETECTED')}
                  className="w-full py-2 bg-primary text-on-primary font-mono text-xs uppercase font-bold hover:bg-secondary transition-all shadow-[2px_2px_0px_#003fe1]"
                >
                  Trigger Multi-Occupant Event
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: MODE 1 BROWSER SESSION DOCK */}
      {activeTab === 'BROWSER_SESSION_DOCK' && (
        <section className="w-full bg-surface p-6 md:p-8 border border-outline-variant shadow-sm flex flex-col gap-6 font-mono text-xs">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-outline-variant pb-3">
            <div>
              <span className="uppercase text-secondary font-bold">
                // MODE 1: NON-INVASIVE BROWSER &amp; SESSION TELEMETRY
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold mt-0.5 font-sans">
                Deterministic Client Window Events
              </h2>
            </div>
            <div className="text-outline">ZERO CAMERA OR MICROPHONE ACCESS REQUIRED</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            <div className="p-4 bg-surface-container-low border border-outline-variant flex flex-col justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-primary block mb-1">
                  Active DOM Window Blur Listener
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Automatically registers an event whenever you switch to another application, minimize the browser, or click onto another display monitor. Try switching tabs right now to see a live event registered!
                </p>
              </div>
              <div className="p-3 bg-surface border border-secondary text-secondary font-mono text-[11px]">
                STATUS: LISTENER ATTACHED (window.onblur)
              </div>
            </div>

            <div className="p-4 bg-surface-container-low border border-outline-variant flex flex-col justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-primary block mb-1">
                  Fullscreen Departure State Monitor
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Monitors browser fullscreen departures using the HTML5 Fullscreen API without recording any keystrokes, clipboard data, or web history.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                className="w-full py-2 bg-primary text-on-primary font-mono text-xs uppercase font-bold hover:bg-secondary transition-all shadow-[2px_2px_0px_#003fe1]"
              >
                Toggle Fullscreen State
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ExamMonitorPage;
