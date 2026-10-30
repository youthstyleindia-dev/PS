import { describe, it, expect, beforeEach } from 'vitest';
import { HeadPoseEstimator } from '../../client/src/modules/exam-monitor/vision/headPoseEstimator';
import { RoiGeometryEngine } from '../../client/src/modules/exam-monitor/vision/roiGeometry';
import { ObservationRuleEngine } from '../../client/src/modules/exam-monitor/vision/observationRules';
import { NormalizedRoi } from '../../client/src/modules/exam-monitor/types/observations';
import { PersonDetectionBox } from '../../client/src/modules/exam-monitor/types/vision';

describe('Unit Test Suite: Module E Computer Vision & Observation Algorithms', () => {
  // ---------------------------------------------------------------------------
  // 1. HeadPoseEstimator Unit Tests
  // ---------------------------------------------------------------------------
  describe('1. HeadPoseEstimator: Euler Decomposition & Calibration', () => {
    let estimator: HeadPoseEstimator;

    beforeEach(() => {
      estimator = new HeadPoseEstimator();
    });

    it('returns NO_FACE quality when matrix and landmarks are empty or undefined', () => {
      const pose = estimator.estimatePose(null, null);
      expect(pose.quality).toBe('NO_FACE');
      expect(pose.yawDegrees).toBe(0);
      expect(pose.pitchDegrees).toBe(0);
      expect(pose.rollDegrees).toBe(0);
    });

    it('decomposes identity transformation matrix into 0-degree neutral yaw/pitch/roll', () => {
      // 4x4 identity matrix (column-major)
      const identityMatrix = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ];

      const pose = estimator.estimatePose(identityMatrix, null);
      expect(pose.quality).toBe('GOOD');
      expect(pose.yawDegrees).toBeCloseTo(0, 0);
      expect(pose.pitchDegrees).toBeCloseTo(0, 0);
      expect(pose.rollDegrees).toBeCloseTo(0, 0);
    });

    it('decomposes rotated matrix with 30-degree yaw rotation accurately', () => {
      const rad30 = (30 * Math.PI) / 180;
      const cos30 = Math.cos(rad30);
      const sin30 = Math.sin(rad30);

      // Rotation around Y-axis (Yaw = +30 deg)
      // R = [ [cos, 0, sin], [0, 1, 0], [-sin, 0, cos] ]
      // In column-major 4x4:
      // col0: [cos, 0, -sin, 0]
      // col1: [0, 1, 0, 0]
      // col2: [sin, 0, cos, 0]
      // col3: [0, 0, 0, 1]
      const yawMatrix = [
        cos30, 0, -sin30, 0,
        0, 1, 0, 0,
        sin30, 0, cos30, 0,
        0, 0, 0, 1
      ];

      const pose = estimator.estimatePose(yawMatrix, null);
      expect(pose.quality).toBe('GOOD');
      expect(Math.abs(pose.yawDegrees)).toBeGreaterThanOrEqual(28);
      expect(Math.abs(pose.yawDegrees)).toBeLessThanOrEqual(32);
      expect(pose.pitchDegrees).toBeCloseTo(0, 0);
    });

    it('handles neutral head calibration and calculates calibrated delta', () => {
      // Set neutral baseline at (yaw = 10, pitch = -5, roll = 0)
      estimator.setBaseline(10, -5, 0);
      const baseline = estimator.getBaseline();
      expect(baseline.isCalibrated).toBe(true);
      expect(baseline.yawBaseline).toBe(10);
      expect(baseline.pitchBaseline).toBe(-5);

      // If current pose is yaw = 35, calibrated delta should be 35 - 10 = +25 degrees
      const rad35 = (35 * Math.PI) / 180;
      const yaw35Matrix = [
        Math.cos(rad35), 0, -Math.sin(rad35), 0,
        0, 1, 0, 0,
        Math.sin(rad35), 0, Math.cos(rad35), 0,
        0, 0, 0, 1
      ];

      const pose = estimator.estimatePose(yaw35Matrix, null);
      expect(pose.calibratedYawDelta).toBeCloseTo(25, 0);
    });

    it('clamps extreme/infinite values and handles NaN safely', () => {
      const corruptMatrix = [NaN, Infinity, -Infinity, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const pose = estimator.estimatePose(corruptMatrix, null);
      expect(isNaN(pose.yawDegrees)).toBe(false);
      expect(isNaN(pose.pitchDegrees)).toBe(false);
      expect(pose.yawDegrees).toBeGreaterThanOrEqual(-90);
      expect(pose.yawDegrees).toBeLessThanOrEqual(90);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. RoiGeometryEngine Unit Tests
  // ---------------------------------------------------------------------------
  describe('2. RoiGeometryEngine: Normalized Bounding Box & ROI Incursion', () => {
    const testRoi: NormalizedRoi = {
      id: 'restricted_zone_top_left',
      name: 'Restricted Top Left Frustum',
      x: 0.05,
      y: 0.05,
      width: 0.35,
      height: 0.35
    };

    it('ignores non-person detections even if intersecting ROI', () => {
      const chairDetection: PersonDetectionBox = {
        category: 'chair',
        score: 0.95,
        box: { originX: 0.1, originY: 0.1, width: 0.2, height: 0.2 }
      };

      const result = RoiGeometryEngine.evaluateIntersection(chairDetection, testRoi);
      expect(result.hasIntersection).toBe(false);
      expect(result.intersectionRatio).toBe(0);
    });

    it('detects valid person bounding box clearly inside restricted ROI', () => {
      const personInRoi: PersonDetectionBox = {
        category: 'person',
        score: 0.88,
        box: { originX: 0.10, originY: 0.10, width: 0.20, height: 0.25 }
      };

      const result = RoiGeometryEngine.evaluateIntersection(personInRoi, testRoi);
      expect(result.hasIntersection).toBe(true);
      expect(result.intersectionRatio).toBeGreaterThan(0.50);
      expect(result.score).toBe(0.88);
    });

    it('reports no intersection when person is completely outside ROI', () => {
      const personOutside: PersonDetectionBox = {
        category: 'person',
        score: 0.92,
        box: { originX: 0.60, originY: 0.50, width: 0.25, height: 0.40 } // Bottom right
      };

      const result = RoiGeometryEngine.evaluateIntersection(personOutside, testRoi);
      expect(result.hasIntersection).toBe(false);
      expect(result.intersectionRatio).toBe(0);
    });

    it('safely handles detections extending beyond normalized image boundaries [0, 1]', () => {
      const edgePerson: PersonDetectionBox = {
        category: 'person',
        score: 0.80,
        box: { originX: -0.05, originY: -0.05, width: 0.20, height: 0.20 }
      };

      const result = RoiGeometryEngine.evaluateIntersection(edgePerson, testRoi);
      expect(result.boundingBox.originX).toBeGreaterThanOrEqual(0);
      expect(result.boundingBox.originY).toBeGreaterThanOrEqual(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. ObservationRuleEngine Unit Tests
  // ---------------------------------------------------------------------------
  describe('3. ObservationRuleEngine: Temporal State Machine, Dwell & Cooldowns', () => {
    let ruleEngine: ObservationRuleEngine;
    const testSessionId = 'session-test-cv-101';

    beforeEach(() => {
      ruleEngine = new ObservationRuleEngine(testSessionId, {
        yawThresholdDegrees: 25.0,
        minDwellSeconds: 0.5,
        windowSeconds: 10.0,
        qualifyingCount: 3,
        cooldownSeconds: 20.0
      });
    });

    it('emits no event when head orientation remains stable neutral', () => {
      const neutralPose = {
        yawDegrees: 2.0,
        pitchDegrees: 1.0,
        rollDegrees: 0.0,
        quality: 'GOOD' as const,
        calibratedYawDelta: 2.0,
        calibratedPitchDelta: 1.0
      };

      for (let t = 0; t < 5; t++) {
        const obs = ruleEngine.evaluateHeadOrientation(neutralPose, 1000 + t * 200);
        expect(obs).toBeNull();
      }
    });

    it('emits no event for a single brief turn (under dwell threshold)', () => {
      const turnPose = {
        yawDegrees: 35.0,
        pitchDegrees: 0.0,
        rollDegrees: 0.0,
        quality: 'GOOD' as const,
        calibratedYawDelta: 35.0,
        calibratedPitchDelta: 0.0
      };

      // Turn starts at 1000ms and ends at 1200ms (dwell = 200ms < 500ms required)
      ruleEngine.evaluateHeadOrientation(turnPose, 1000);
      ruleEngine.evaluateHeadOrientation(turnPose, 1100);

      const neutralPose = { ...turnPose, yawDegrees: 0, calibratedYawDelta: 0 };
      const obs = ruleEngine.evaluateHeadOrientation(neutralPose, 1200);
      expect(obs).toBeNull();
    });

    it('triggers repeated_head_orientation_change after qualifying count of sustained turns', () => {
      let t = 1000;
      const turnRight = { yawDegrees: 35.0, pitchDegrees: 0, rollDegrees: 0, quality: 'GOOD' as const, calibratedYawDelta: 35.0, calibratedPitchDelta: 0 };
      const turnLeft = { yawDegrees: -35.0, pitchDegrees: 0, rollDegrees: 0, quality: 'GOOD' as const, calibratedYawDelta: -35.0, calibratedPitchDelta: 0 };
      const neutral = { yawDegrees: 0, pitchDegrees: 0, rollDegrees: 0, quality: 'GOOD' as const, calibratedYawDelta: 0, calibratedPitchDelta: 0 };

      // Qualifying Turn 1: Right turn for 600ms
      ruleEngine.evaluateHeadOrientation(turnRight, t);
      t += 600;
      ruleEngine.evaluateHeadOrientation(neutral, t);
      t += 200;

      // Qualifying Turn 2: Left turn for 600ms
      ruleEngine.evaluateHeadOrientation(turnLeft, t);
      t += 600;
      ruleEngine.evaluateHeadOrientation(neutral, t);
      t += 200;

      // Qualifying Turn 3: Right turn for 600ms
      ruleEngine.evaluateHeadOrientation(turnRight, t);
      t += 600;
      const obs = ruleEngine.evaluateHeadOrientation(neutral, t);

      expect(obs).not.toBeNull();
      expect(obs?.eventType).toBe('repeated_head_orientation_change');
      expect(obs?.modelScore).toBeNull(); // Strictly null for rule-derived geometric events
      expect(obs?.signalMetadata.qualifying_turn_count).toBeGreaterThanOrEqual(3);
    });

    it('enforces cooldown preventing duplicate alerts within cooldown window', () => {
      let t = 1000;
      const turn = { yawDegrees: 40.0, pitchDegrees: 0, rollDegrees: 0, quality: 'GOOD' as const, calibratedYawDelta: 40.0, calibratedPitchDelta: 0 };
      const neutral = { yawDegrees: 0, pitchDegrees: 0, rollDegrees: 0, quality: 'GOOD' as const, calibratedYawDelta: 0, calibratedPitchDelta: 0 };

      // Trigger 3 turns to activate first alert
      for (let i = 0; i < 3; i++) {
        ruleEngine.evaluateHeadOrientation(turn, t);
        t += 600;
        ruleEngine.evaluateHeadOrientation(neutral, t);
        t += 200;
      }

      // Next immediate deviation within cooldown (20 seconds) must be ignored
      const immediateTurn = ruleEngine.evaluateHeadOrientation(turn, t + 1000);
      expect(immediateTurn).toBeNull();
    });

    it('suppresses head-turn events if face tracking quality is NO_FACE or UNCERTAIN', () => {
      const lostFacePose = {
        yawDegrees: 45.0,
        pitchDegrees: 0,
        rollDegrees: 0,
        quality: 'NO_FACE' as const,
        calibratedYawDelta: 45.0,
        calibratedPitchDelta: 0
      };

      const obs = ruleEngine.evaluateHeadOrientation(lostFacePose, 1000);
      expect(obs).toBeNull();
    });

    it('triggers person_detected_in_restricted_region only after dwell threshold is satisfied', () => {
      const personInRoi: PersonDetectionBox[] = [{
        category: 'person',
        score: 0.85,
        box: { originX: 0.10, originY: 0.10, width: 0.20, height: 0.20 }
      }];

      // First detection at t=1000ms: dwell = 0, should be null
      const obs1 = ruleEngine.evaluateObjectDetections(personInRoi, undefined, 1000);
      expect(obs1).toBeNull();

      // Detection at t=1500ms (dwell = 500ms < 1000ms): should still be null
      const obs2 = ruleEngine.evaluateObjectDetections(personInRoi, undefined, 1500);
      expect(obs2).toBeNull();

      // Detection at t=2100ms (dwell = 1100ms >= 1000ms): triggers observation!
      const obs3 = ruleEngine.evaluateObjectDetections(personInRoi, undefined, 2100);
      expect(obs3).not.toBeNull();
      expect(obs3?.eventType).toBe('person_detected_in_restricted_region');
      expect(obs3?.modelScore).toBe(0.85); // Preserves genuine model score
    });
  });
});
