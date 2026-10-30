import React from 'react';
import { Cpu, FileText, CheckCircle2, Shield, Info, PlayCircle } from 'lucide-react';
import { VISION_MODEL_MANIFEST } from '../vision/modelManifest';

interface ModelStatusPanelProps {
  onInjectSample: (eventType: string) => void;
}

export const ModelStatusPanel: React.FC<ModelStatusPanelProps> = ({ onInjectSample }) => {
  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold tracking-tight text-on-surface">Verified Vision Model Registry</h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary/15 text-secondary border border-secondary/30">
          LOCAL WASM DEPLOYMENT
        </span>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Face Landmarker */}
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface">MediaPipe Face Landmarker</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">Apache-2.0</span>
          </div>
          <p className="text-xs text-on-surface-variant font-mono">
            Artifact: <code>face_landmarker.task</code> (3.6 MB)
          </p>
          <p className="text-[10px] text-outline font-mono truncate" title={VISION_MODEL_MANIFEST.face_landmarker.sha256}>
            SHA-256: {VISION_MODEL_MANIFEST.face_landmarker.sha256.substring(0, 20)}...
          </p>
          <p className="text-xs text-on-surface-variant">
            Decomposes 4x4 facial transformation matrix into real-time yaw, pitch, and roll in degrees with neutral calibration.
          </p>
        </div>

        {/* Object Detector */}
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface">EfficientDet-Lite0</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">Apache-2.0</span>
          </div>
          <p className="text-xs text-on-surface-variant font-mono">
            Artifact: <code>efficientdet_lite0.tflite</code> (6.9 MB)
          </p>
          <p className="text-[10px] text-outline font-mono truncate" title={VISION_MODEL_MANIFEST.person_detector.sha256}>
            SHA-256: {VISION_MODEL_MANIFEST.person_detector.sha256.substring(0, 20)}...
          </p>
          <p className="text-xs text-on-surface-variant">
            Filtered exclusively to class <code>person</code>. Evaluates normalized bounding box intersection against configured restricted ROI.
          </p>
        </div>
      </div>

      {/* Controlled Evaluator Sample Triggers */}
      <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20">
        <div className="flex items-center gap-2 mb-2">
          <PlayCircle className="w-4 h-4 text-secondary" />
          <span className="text-xs font-bold text-on-surface">Controlled Sample Demonstration Triggers</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary-fixed/20 text-on-secondary-fixed">
            LABEL: SAMPLE_DEMO
          </span>
        </div>
        <p className="text-xs text-on-surface-variant mb-3">
          For technical evaluators without webcam access, inject deterministic sample events explicitly tagged with <code>SAMPLE_DEMO</code> provenance:
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onInjectSample('repeated_head_orientation_change')}
            className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-mono text-on-surface hover:bg-surface-container-highest transition"
          >
            + Staged Head Orientation Change
          </button>
          <button
            type="button"
            onClick={() => onInjectSample('person_detected_in_restricted_region')}
            className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-mono text-on-surface hover:bg-surface-container-highest transition"
          >
            + Staged Restricted Region Incursion
          </button>
          <button
            type="button"
            onClick={() => onInjectSample('additional_person_detected')}
            className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-mono text-on-surface hover:bg-surface-container-highest transition"
          >
            + Staged Additional Person Detected
          </button>
        </div>
      </div>

      {/* Detector Limitations & Fairness Disclosure */}
      <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-xs text-on-surface-variant space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-on-surface">
          <Info className="w-3.5 h-3.5 text-secondary" />
          Limitations &amp; False-Positive Handling Disclosures
        </div>
        <p>
          Head orientation deviation may occur due to reading physical exam scratch paper, glare from windows, or stretching.
          Missing faces may stem from backlighting or laptop tilt. Restricted zone incursions may be an authorized roving invigilator.
          Human proctor review is mandatory prior to any action.
        </p>
      </div>
    </div>
  );
};
