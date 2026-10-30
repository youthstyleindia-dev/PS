import { ExamObservationInput, ObservationSource, NormalizedRoi } from '../types/observations';
import { HeadOrientationAngles, PersonDetectionBox } from '../types/vision';
import { RoiGeometryEngine, RoiIntersectionResult } from './roiGeometry';

export interface HeadTurnRuleConfig {
  yawThresholdDegrees: number;
  pitchThresholdDegrees: number;
  minDwellSeconds: number;
  windowSeconds: number;
  qualifyingCount: number;
  cooldownSeconds: number;
}

export interface RestrictedRegionRuleConfig {
  minDetectionScore: number;
  minDwellSeconds: number;
  cooldownSeconds: number;
}

export const DEFAULT_HEAD_TURN_CONFIG: HeadTurnRuleConfig = {
  yawThresholdDegrees: 25.0,
  pitchThresholdDegrees: 20.0,
  minDwellSeconds: 0.6,
  windowSeconds: 20.0,
  qualifyingCount: 3,
  cooldownSeconds: 30.0
};

export const DEFAULT_RESTRICTED_REGION_CONFIG: RestrictedRegionRuleConfig = {
  minDetectionScore: 0.50,
  minDwellSeconds: 1.0,
  cooldownSeconds: 30.0
};

interface QualifyingTurnEvent {
  timestamp: number;
  direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';
  maxAbsYaw: number;
  maxAbsPitch: number;
}

/**
 * Deterministic, tested temporal observation rule engine.
 * Converts raw frame-level vision outputs into high-confidence, factual observations.
 * NEVER infers intent, cheating, or dishonesty.
 */
export class ObservationRuleEngine {
  private sessionId: string;
  private headTurnConfig: HeadTurnRuleConfig;
  private regionConfig: RestrictedRegionRuleConfig;

  // Head Turn State
  private rollingYawSamples: number[] = [];
  private rollingPitchSamples: number[] = [];
  private currentTurnStartTime: number | null = null;
  private currentTurnDirection: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | null = null;
  private currentTurnMaxYaw = 0;
  private currentTurnMaxPitch = 0;
  private completedQualifyingTurns: QualifyingTurnEvent[] = [];
  private lastHeadTurnAlertTime = -1e9;

  // Restricted Region State
  private incursionStartTime: number | null = null;
  private lastIncursionAlertTime = -1e9;
  private lastIncursionResult: RoiIntersectionResult | null = null;

  // Additional Person State
  private multiPersonStartTime: number | null = null;
  private lastMultiPersonAlertTime = -1e9;

  constructor(
    sessionId: string,
    headTurnConfig: Partial<HeadTurnRuleConfig> = {},
    regionConfig: Partial<RestrictedRegionRuleConfig> = {}
  ) {
    this.sessionId = sessionId;
    this.headTurnConfig = { ...DEFAULT_HEAD_TURN_CONFIG, ...headTurnConfig };
    this.regionConfig = { ...DEFAULT_RESTRICTED_REGION_CONFIG, ...regionConfig };
  }

  public setSessionId(id: string): void {
    this.sessionId = id;
    this.resetState();
  }

  public resetState(): void {
    this.rollingYawSamples = [];
    this.rollingPitchSamples = [];
    this.currentTurnStartTime = null;
    this.currentTurnDirection = null;
    this.currentTurnMaxYaw = 0;
    this.currentTurnMaxPitch = 0;
    this.completedQualifyingTurns = [];
    this.incursionStartTime = null;
    this.lastIncursionResult = null;
    this.multiPersonStartTime = null;
    this.lastHeadTurnAlertTime = -1e9;
    this.lastIncursionAlertTime = -1e9;
    this.lastMultiPersonAlertTime = -1e9;
  }

  /**
   * Evaluate a sample frame for repeated head orientation changes.
   */
  public evaluateHeadOrientation(
    pose: HeadOrientationAngles,
    timestamp: number = Date.now(),
    source: ObservationSource = 'LIVE_MODEL_INFERENCE'
  ): ExamObservationInput | null {
    // If no face or uncertain tracking, abort to avoid false positive
    if (pose.quality !== 'GOOD') {
      this.currentTurnStartTime = null;
      this.currentTurnDirection = null;
      this.rollingYawSamples = [];
      this.rollingPitchSamples = [];
      return null;
    }

    // Cooldown check
    if (timestamp - this.lastHeadTurnAlertTime < this.headTurnConfig.cooldownSeconds * 1000) {
      return null;
    }

    const currentYaw = pose.calibratedYawDelta ?? pose.yawDegrees;
    const currentPitch = pose.calibratedPitchDelta ?? pose.pitchDegrees;

    const absYaw = Math.abs(currentYaw);
    const absPitch = Math.abs(currentPitch);

    let activeDirection: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | null = null;
    if (absYaw >= this.headTurnConfig.yawThresholdDegrees) {
      activeDirection = currentYaw > 0 ? 'RIGHT' : 'LEFT';
    } else if (absPitch >= this.headTurnConfig.pitchThresholdDegrees) {
      activeDirection = currentPitch > 0 ? 'UP' : 'DOWN';
    }

    // If currently deviating from baseline
    if (activeDirection) {
      if (this.currentTurnDirection !== activeDirection) {
        // New deviation started
        this.currentTurnDirection = activeDirection;
        this.currentTurnStartTime = timestamp;
        this.currentTurnMaxYaw = absYaw;
        this.currentTurnMaxPitch = absPitch;
      } else {
        // Continuing deviation
        this.currentTurnMaxYaw = Math.max(this.currentTurnMaxYaw, absYaw);
        this.currentTurnMaxPitch = Math.max(this.currentTurnMaxPitch, absPitch);
      }
    } else {
      // Returned to neutral posture: check if the previous deviation qualified
      if (this.currentTurnStartTime && this.currentTurnDirection) {
        const dwellSeconds = (timestamp - this.currentTurnStartTime) / 1000;
        if (dwellSeconds >= this.headTurnConfig.minDwellSeconds) {
          this.completedQualifyingTurns.push({
            timestamp,
            direction: this.currentTurnDirection,
            maxAbsYaw: Math.round(this.currentTurnMaxYaw * 10) / 10,
            maxAbsPitch: Math.round(this.currentTurnMaxPitch * 10) / 10
          });
        }
      }
      this.currentTurnStartTime = null;
      this.currentTurnDirection = null;
    }

    // Prune qualifying turns outside rolling window
    const windowStart = timestamp - this.headTurnConfig.windowSeconds * 1000;
    this.completedQualifyingTurns = this.completedQualifyingTurns.filter(t => t.timestamp >= windowStart);

    // If threshold count reached within window
    if (this.completedQualifyingTurns.length >= this.headTurnConfig.qualifyingCount) {
      this.lastHeadTurnAlertTime = timestamp;
      const count = this.completedQualifyingTurns.length;
      const maxYaw = Math.max(...this.completedQualifyingTurns.map(t => t.maxAbsYaw));
      const maxPitch = Math.max(...this.completedQualifyingTurns.map(t => t.maxAbsPitch));
      const directions = Array.from(new Set(this.completedQualifyingTurns.map(t => t.direction))).join(', ');

      this.completedQualifyingTurns = []; // Reset after trigger

      return {
        eventId: `obs_head_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        sessionId: this.sessionId,
        eventType: 'repeated_head_orientation_change',
        source,
        occurredAt: new Date(timestamp).toISOString(),
        modelKey: 'face_landmarker',
        modelVersion: '1.0.0',
        modelScore: null, // Head turn is rule-derived from geometry; score is null with explicit metadata
        ruleKey: 'rule_head_turn_v1',
        ruleVersion: '1.0.0',
        signalMetadata: {
          window_seconds: this.headTurnConfig.windowSeconds,
          qualifying_turn_count: count,
          observed_directions: directions,
          max_abs_yaw_delta_degrees: maxYaw,
          max_abs_pitch_delta_degrees: maxPitch,
          tracking_quality_status: pose.quality,
          calibration_status: 'calibrated_active'
        }
      };
    }

    return null;
  }

  /**
   * Evaluate detected bounding boxes for restricted region incursion and multiple persons.
   */
  public evaluateObjectDetections(
    detections: PersonDetectionBox[],
    roi: NormalizedRoi = RoiGeometryEngine.DEFAULT_RESTRICTED_ROI,
    timestamp: number = Date.now(),
    source: ObservationSource = 'LIVE_MODEL_INFERENCE'
  ): ExamObservationInput | null {
    const analysis = RoiGeometryEngine.evaluateAll(detections, roi);

    // 1. Check Multiple Persons Event
    if (analysis.personCount >= 2) {
      if (!this.multiPersonStartTime) {
        this.multiPersonStartTime = timestamp;
      } else {
        const dwell = (timestamp - this.multiPersonStartTime) / 1000;
        if (dwell >= 1.2 && timestamp - this.lastMultiPersonAlertTime > 30000) {
          this.lastMultiPersonAlertTime = timestamp;
          this.multiPersonStartTime = null;

          return {
            eventId: `obs_multiperson_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            sessionId: this.sessionId,
            eventType: 'additional_person_detected',
            source,
            occurredAt: new Date(timestamp).toISOString(),
            modelKey: 'person_detector',
            modelVersion: '1.0.0',
            modelScore: Math.round((detections[1]?.score || 0.75) * 100) / 100,
            ruleKey: 'rule_additional_person_v1',
            ruleVersion: '1.0.0',
            signalMetadata: {
              detected_person_count: analysis.personCount,
              dwell_seconds: Math.round(dwell * 10) / 10,
              highest_confidence_score: Math.max(...detections.map(d => d.score))
            }
          };
        }
      }
    } else {
      this.multiPersonStartTime = null;
    }

    // 2. Check Restricted Region Incursion
    if (analysis.incursions.length > 0) {
      const highestIncursion = analysis.incursions.sort((a, b) => b.score - a.score)[0];
      if (highestIncursion.score >= this.regionConfig.minDetectionScore) {
        if (!this.incursionStartTime) {
          this.incursionStartTime = timestamp;
          this.lastIncursionResult = highestIncursion;
        } else {
          const dwell = (timestamp - this.incursionStartTime) / 1000;
          if (
            dwell >= this.regionConfig.minDwellSeconds &&
            timestamp - this.lastIncursionAlertTime > this.regionConfig.cooldownSeconds * 1000
          ) {
            this.lastIncursionAlertTime = timestamp;
            this.incursionStartTime = null;

            return {
              eventId: `obs_region_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
              sessionId: this.sessionId,
              eventType: 'person_detected_in_restricted_region',
              source,
              occurredAt: new Date(timestamp).toISOString(),
              modelKey: 'person_detector',
              modelVersion: '1.0.0',
              modelScore: Math.round(highestIncursion.score * 100) / 100,
              ruleKey: 'rule_restricted_region_v1',
              ruleVersion: '1.0.0',
              signalMetadata: {
                region_id: roi.id,
                region_name: roi.name,
                intersection_ratio: highestIncursion.intersectionRatio,
                dwell_seconds: Math.round(dwell * 10) / 10,
                normalized_bbox_left: highestIncursion.boundingBox.originX,
                normalized_bbox_top: highestIncursion.boundingBox.originY,
                normalized_bbox_width: highestIncursion.boundingBox.width,
                normalized_bbox_height: highestIncursion.boundingBox.height
              }
            };
          }
        }
      }
    } else {
      this.incursionStartTime = null;
      this.lastIncursionResult = null;
    }

    return null;
  }

  private median(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
}
