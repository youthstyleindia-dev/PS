import React from 'react';
import { VideoOff, Compass, Crosshair, ShieldCheck, AlertTriangle } from 'lucide-react';
import { HeadOrientationAngles, VisionDiagnostics, ModelRuntimeState } from '../types/vision';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  runtimeState: ModelRuntimeState;
  currentPose: HeadOrientationAngles;
  diagnostics: VisionDiagnostics;
  isCalibrated: boolean;
  inRestrictedRegion: boolean;
  personCount: number;
  onStopCamera: () => void;
  onCalibrate: () => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  videoRef,
  canvasRef,
  isCameraActive,
  runtimeState,
  currentPose,
  diagnostics,
  isCalibrated,
  inRestrictedRegion,
  personCount,
  onStopCamera,
  onCalibrate
}) => {
  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Header Bar */}
      <div className="px-5 py-3.5 bg-surface-container border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isCameraActive ? 'bg-secondary animate-pulse' : 'bg-outline'}`} />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface">
            {isCameraActive ? 'LIVE BROWSER CAMERA' : 'CAMERA INACTIVE'}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
            PROVENANCE: LIVE_MODEL_INFERENCE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCalibrate}
            disabled={!isCameraActive || currentPose.quality !== 'GOOD'}
            className="px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-mono hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
          >
            <Compass className="w-3.5 h-3.5" />
            {isCalibrated ? 'Recalibrate Neutral' : 'Calibrate Neutral Head'}
          </button>
          <button
            type="button"
            onClick={onStopCamera}
            className="px-3 py-1.5 rounded-lg bg-error/10 border border-error/30 text-error text-xs font-mono hover:bg-error/20 flex items-center gap-1.5 transition"
          >
            <VideoOff className="w-3.5 h-3.5" />
            Stop Camera
          </button>
        </div>
      </div>

      {/* Video & Canvas Viewport */}
      <div className="relative aspect-[4/3] max-h-[440px] bg-black flex items-center justify-center overflow-hidden">
        {/* Hidden HTML5 Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Overlay Canvas for real-time bounding boxes and ROI */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100"
        />

        {/* Camera Off / Unloaded State Placeholder */}
        {!isCameraActive && (
          <div className="text-center p-8 text-on-surface-variant flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-surface-container">
              <VideoOff className="w-8 h-8 text-outline" />
            </div>
            <p className="text-sm font-medium">Camera is currently stopped.</p>
            <p className="text-xs text-outline max-w-xs">Click Enable Camera in preflight to resume local browser visual monitoring.</p>
          </div>
        )}

        {/* Live HUD Badges on Preview */}
        {isCameraActive && (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Pose Orientation HUD */}
            <div className="bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-mono flex items-center gap-3 text-on-surface">
              <span className="flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5 text-primary" />
                Yaw: <strong>{currentPose.calibratedYawDelta ?? currentPose.yawDegrees}&deg;</strong>
              </span>
              <span>
                Pitch: <strong>{currentPose.calibratedPitchDelta ?? currentPose.pitchDegrees}&deg;</strong>
              </span>
              <span>
                Quality: <strong className={currentPose.quality === 'GOOD' ? 'text-secondary' : 'text-error'}>{currentPose.quality}</strong>
              </span>
            </div>

            {/* Incursion / Multi-occupant Alert HUD */}
            {inRestrictedRegion && (
              <div className="bg-error/90 text-on-error px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse shadow-lg">
                <AlertTriangle className="w-3.5 h-3.5" />
                RESTRICTED ZONE INCURSION
              </div>
            )}
            {personCount > 1 && (
              <div className="bg-primary/90 text-on-primary px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                {personCount} PERSONS DETECTED
              </div>
            )}
          </div>
        )}
      </div>

      {/* Diagnostics Bar */}
      <div className="px-5 py-3 bg-surface-container-lowest border-t border-outline-variant/20 flex flex-wrap items-center justify-between text-xs font-mono text-on-surface-variant gap-4">
        <div>
          Model Status:{' '}
          <span className="text-secondary font-semibold">
            Face Landmarker ({diagnostics.faceTaskStatus}) &bull; EfficientDet-Lite0 ({diagnostics.personTaskStatus})
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Inference: <strong>{diagnostics.fps} FPS</strong></span>
          <span>Latency: <strong>{diagnostics.inferenceLatencyMs} ms</strong></span>
          <span>Dropped: <strong>{diagnostics.droppedFrames}</strong></span>
        </div>
      </div>
    </div>
  );
};
