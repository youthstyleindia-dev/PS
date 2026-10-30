import React, { useState } from 'react';
import { ShieldCheck, Video, Lock, AlertCircle, EyeOff, CheckCircle } from 'lucide-react';

interface CameraConsentPanelProps {
  sessionId: string;
  onConsentGranted: () => void;
  onDecline: () => void;
}

export const CameraConsentPanel: React.FC<CameraConsentPanelProps> = ({
  sessionId,
  onConsentGranted,
  onDecline
}) => {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGrantConsent = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`/api/exam-sessions/${sessionId}/vision-consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('universe_token')
            ? { Authorization: `Bearer ${localStorage.getItem('universe_token')}` }
            : {})
        },
        body: JSON.stringify({ consentStatus: 'granted', explanationVersion: 'v1.0' })
      });
      onConsentGranted();
    } catch {
      // Allow proceeding even if server record is offline
      onConsentGranted();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-on-surface">Responsible Examination Vision Assistant</h2>
          <p className="text-xs text-on-surface-variant font-mono">ETHICAL AI FRAMEWORK &bull; VOLUNTARY CONSENT PREFLIGHT</p>
        </div>
      </div>

      <div className="space-y-4 mb-6 text-sm text-on-surface-variant leading-relaxed">
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex gap-3">
          <EyeOff className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-on-surface block mb-1">100% Local In-Browser Frame Processing</strong>
            Video frames are processed entirely in your browser's local memory via WebAssembly. Zero video recordings, images, or face meshes are uploaded to the cloud or saved to disk.
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex gap-3">
          <Lock className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-on-surface block mb-1">Zero Audio Monitoring Guarantee</strong>
            Camera access is strictly limited to video. Microphone and audio access are never requested. No sound is ever recorded or analyzed.
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex gap-3">
          <AlertCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-on-surface block mb-1">Zero Automated Disciplinary Penalties</strong>
            Observable cues (such as head turns or person presence) are factual signals routed to a human proctor for context. An algorithm never penalizes, stops, or alters your exam.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-container-highest/40 border border-outline-variant/30 mb-6">
        <input
          type="checkbox"
          id="consentCheckbox"
          checked={hasAcknowledged}
          onChange={(e) => setHasAcknowledged(e.target.checked)}
          className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
        />
        <label htmlFor="consentCheckbox" className="text-xs text-on-surface cursor-pointer select-none">
          I understand that visual observations are processed locally and only compact, non-biometric metadata will be submitted for human proctor review.
        </label>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
        <button
          type="button"
          onClick={onDecline}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-outline-variant/40 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-sm font-medium transition"
        >
          Decline &amp; Use Manual Verification
        </button>
        <button
          type="button"
          disabled={!hasAcknowledged || isSubmitting}
          onClick={handleGrantConsent}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transition"
        >
          <Video className="w-4 h-4" />
          {isSubmitting ? 'Starting...' : 'Enable Camera for this Session'}
        </button>
      </div>
    </div>
  );
};
