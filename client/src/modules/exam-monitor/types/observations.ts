export type ObservationSource =
  | 'LIVE_MODEL_INFERENCE'
  | 'AUTHORIZED_VIDEO_INFERENCE'
  | 'SAMPLE_DEMO'
  | 'MANUAL_REVIEW_NOTE';

export type ExamObservationType =
  | 'repeated_head_orientation_change'
  | 'person_detected_in_restricted_region'
  | 'additional_person_detected'
  | 'HEAD_POSE_DEVIATION'
  | 'RESTRICTED_ZONE_INCURSION'
  | 'MULTIPLE_OCCUPANTS_DETECTED';

export type ObservationReviewStatus =
  | 'PENDING_REVIEW'
  | 'DISMISS_FALSE_POSITIVE'
  | 'DISMISS_BENIGN_BEHAVIOR'
  | 'ESCALATE_TO_INVIGILATOR';

export interface ExamObservationInput {
  eventId: string;
  sessionId: string;
  eventType: ExamObservationType | string;
  source: ObservationSource;
  occurredAt: string;
  modelKey?: 'face_landmarker' | 'person_detector';
  modelVersion?: string;
  modelScore?: number | null;
  ruleKey: string;
  ruleVersion: string;
  signalMetadata: Record<string, string | number | boolean | null>;
}

export interface ObservationRecord {
  id: string;
  sessionId: string;
  timestamp: string;
  eventType: string;
  confidenceScore: number;
  provenance: 'ACTUAL_INFERENCE' | 'SIMULATED_EVENT' | 'ESTIMATED_METRIC';
  reviewStatus: ObservationReviewStatus;
  proctorNotes?: string | null;
  resolvedAt?: string | null;
  metadata?: {
    clientEventType?: string;
    clientSource?: string;
    modelKey?: string | null;
    modelVersion?: string | null;
    ruleKey?: string | null;
    ruleVersion?: string | null;
    signalMetadata?: Record<string, any>;
  };
}

export interface NormalizedRoi {
  id: string;
  name: string;
  x: number;      // 0.0 to 1.0 (top-left)
  y: number;      // 0.0 to 1.0 (top-left)
  width: number;  // 0.0 to 1.0
  height: number; // 0.0 to 1.0
}
