import { HeadOrientationAngles } from '../types/vision';

export interface CalibrationBaseline {
  yawBaseline: number;
  pitchBaseline: number;
  rollBaseline: number;
  isCalibrated: boolean;
}

/**
 * Decomposes facial transformation matrix or 3D landmarks into Euler angles (Yaw, Pitch, Roll).
 * Follows documented aviation/robotics Euler decomposition convention:
 * - Yaw: rotation about Y-axis (left/right deviation in degrees)
 * - Pitch: rotation about X-axis (up/down nod in degrees)
 * - Roll: rotation about Z-axis (lateral tilt in degrees)
 */
export class HeadPoseEstimator {
  private baseline: CalibrationBaseline = {
    yawBaseline: 0,
    pitchBaseline: 0,
    rollBaseline: 0,
    isCalibrated: false
  };

  /**
   * Set neutral baseline orientation from user calibration step.
   */
  public setBaseline(yaw: number, pitch: number, roll: number): void {
    if (isNaN(yaw) || isNaN(pitch) || isNaN(roll)) return;
    this.baseline = {
      yawBaseline: yaw,
      pitchBaseline: pitch,
      rollBaseline: roll,
      isCalibrated: true
    };
  }

  public getBaseline(): CalibrationBaseline {
    return { ...this.baseline };
  }

  public resetBaseline(): void {
    this.baseline = {
      yawBaseline: 0,
      pitchBaseline: 0,
      rollBaseline: 0,
      isCalibrated: false
    };
  }

  /**
   * Estimate Euler angles from facial transformation matrix or 3D facial landmarks.
   */
  public estimatePose(
    matrixData?: number[] | Float32Array | null,
    landmarks?: Array<{ x: number; y: number; z: number }> | null
  ): HeadOrientationAngles {
    // If no face data is available
    if ((!matrixData || matrixData.length < 16) && (!landmarks || landmarks.length < 400)) {
      return {
        yawDegrees: 0,
        pitchDegrees: 0,
        rollDegrees: 0,
        quality: 'NO_FACE',
        calibratedYawDelta: 0,
        calibratedPitchDelta: 0
      };
    }

    let yaw = 0;
    let pitch = 0;
    let roll = 0;
    let quality: 'GOOD' | 'UNCERTAIN' = 'UNCERTAIN';

    // 1. Primary: 4x4 Facial Transformation Matrix Decomposition
    if (matrixData && matrixData.length >= 16) {
      try {
        const m = matrixData;
        // Standard column-major 4x4 matrix from MediaPipe Tasks Vision:
        // R = [ [m[0], m[4], m[8]], [m[1], m[5], m[9]], [m[2], m[6], m[10]] ]
        const r00 = m[0], r01 = m[4], r02 = m[8];
        const r10 = m[1], r11 = m[5], r12 = m[9];
        const r20 = m[2], r21 = m[6], r22 = m[10];

        // Euler angle extraction (in radians)
        const sy = Math.sqrt(r00 * r00 + r10 * r10);
        const singular = sy < 1e-6;

        let xRad: number, yRad: number, zRad: number;
        if (!singular) {
          xRad = Math.atan2(r21, r22);           // Pitch
          yRad = Math.atan2(-r20, sy);           // Yaw
          zRad = Math.atan2(r10, r00);           // Roll
        } else {
          xRad = Math.atan2(-r12, r11);
          yRad = Math.atan2(-r20, sy);
          zRad = 0;
        }

        const toDeg = 180 / Math.PI;
        pitch = Math.round(xRad * toDeg * 10) / 10;
        yaw = Math.round(yRad * toDeg * 10) / 10;
        roll = Math.round(zRad * toDeg * 10) / 10;

        if (!isNaN(yaw) && !isNaN(pitch) && !isNaN(roll)) {
          quality = 'GOOD';
        }
      } catch {
        quality = 'UNCERTAIN';
      }
    }

    // 2. Secondary fallback / corroboration: 3D Landmark Geometric Triangulation
    if (quality === 'UNCERTAIN' && landmarks && landmarks.length >= 400) {
      try {
        const nose = landmarks[1] || landmarks[4];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const chin = landmarks[152];
        const forehead = landmarks[10];

        if (nose && leftEye && rightEye && chin && forehead) {
          const eyeMidX = (leftEye.x + rightEye.x) / 2;
          const eyeDistX = Math.abs(rightEye.x - leftEye.x);

          if (eyeDistX > 0.02) {
            // Horizontal nose deviation relative to eye width
            const dNoseX = (nose.x - eyeMidX) / eyeDistX;
            yaw = Math.round(Math.asin(Math.max(-0.95, Math.min(0.95, dNoseX * 2.2))) * (180 / Math.PI) * 10) / 10;

            // Pitch calculation from vertical facial proportion
            const faceHeight = Math.abs(chin.y - forehead.y);
            if (faceHeight > 0.05) {
              const expectedNoseY = forehead.y + faceHeight * 0.58;
              const dNoseY = (nose.y - expectedNoseY) / faceHeight;
              pitch = Math.round(Math.asin(Math.max(-0.95, Math.min(0.95, dNoseY * 2.5))) * (180 / Math.PI) * 10) / 10;
            }

            // Roll from eye tilt
            roll = Math.round(Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI) * 10) / 10;
            quality = 'GOOD';
          }
        }
      } catch {
        quality = 'UNCERTAIN';
      }
    }

    // Safe bounds clamping [-90, +90]
    yaw = Math.max(-90, Math.min(90, isNaN(yaw) ? 0 : yaw));
    pitch = Math.max(-90, Math.min(90, isNaN(pitch) ? 0 : pitch));
    roll = Math.max(-90, Math.min(90, isNaN(roll) ? 0 : roll));

    const calibratedYawDelta = this.baseline.isCalibrated
      ? Math.round((yaw - this.baseline.yawBaseline) * 10) / 10
      : yaw;

    const calibratedPitchDelta = this.baseline.isCalibrated
      ? Math.round((pitch - this.baseline.pitchBaseline) * 10) / 10
      : pitch;

    return {
      yawDegrees: yaw,
      pitchDegrees: pitch,
      rollDegrees: roll,
      quality,
      calibratedYawDelta,
      calibratedPitchDelta
    };
  }
}
