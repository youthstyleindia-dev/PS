export interface HeadOrientationAngles {
  yawDegrees: number;    // negative = looking left, positive = looking right
  pitchDegrees: number;  // negative = looking down, positive = looking up
  rollDegrees: number;   // tilt left/right
  quality: 'GOOD' | 'UNCERTAIN' | 'NO_FACE';
  calibratedYawDelta?: number;
  calibratedPitchDelta?: number;
}

export interface PersonDetectionBox {
  category: string;
  score: number;
  box: {
    originX: number; // 0.0 to 1.0
    originY: number; // 0.0 to 1.0
    width: number;   // 0.0 to 1.0
    height: number;  // 0.0 to 1.0
  };
}

export type ModelRuntimeState =
  | 'uninitialized'
  | 'loading'
  | 'ready'
  | 'partially_ready'
  | 'error'
  | 'stopped';

export interface VisionDiagnostics {
  fps: number;
  inferenceLatencyMs: number;
  droppedFrames: number;
  lastProcessedTimestamp: number;
  faceTaskStatus: 'ready' | 'unavailable' | 'running';
  personTaskStatus: 'ready' | 'unavailable' | 'running';
}
