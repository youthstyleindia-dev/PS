# UniVerse Module E: REST API Contracts & Specifications

All examination vision monitoring endpoints are served over `/api` with strict JWT authentication, role guards, and JSON schemas.

---

## 1. System Capabilities & Health

### 1.1 `GET /api/exam-monitor/capabilities`
Returns public feature flags, registered ML models, and active rule configurations. No private data.

**Response (200 OK):**
```json
{
  "status": "ACTIVE",
  "mode": "local-browser",
  "localInferenceOnly": true,
  "audioMonitoringEnabled": false,
  "videoRetentionEnabled": false,
  "models": [
    {
      "model_key": "face_landmarker",
      "model_name": "MediaPipe Face Landmarker (Float16)",
      "model_version": "1.0.0",
      "runtime_package": "@mediapipe/tasks-vision",
      "runtime_package_version": "1.2.0",
      "enabled": 1
    },
    {
      "model_key": "person_detector",
      "model_name": "MediaPipe EfficientDet-Lite0 Object Detector (Float16)",
      "model_version": "1.0.0",
      "runtime_package": "@mediapipe/tasks-vision",
      "runtime_package_version": "1.2.0",
      "enabled": 1
    }
  ],
  "privacyGuarantees": [
    "Zero audio or microphone permissions requested",
    "Zero video frame uploads to backend",
    "Local-browser ML inference via WebAssembly",
    "Voluntary candidate vision consent lifecycle",
    "Zero automated penalties; human-in-the-loop audit only"
  ]
}
```

### 1.2 `GET /api/exam-monitor/health`
Returns runtime health and database connectivity.

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "UniVerse Responsible Exam Vision Assistant",
  "timestamp": "2026-10-30T04:55:00.000Z",
  "modelsRegistered": 2,
  "rulesRegistered": 2,
  "inferencePipeline": "browser-edge-mediapipe"
}
```

---

## 2. Candidate Exam Session & Observation Ingestion

### 2.1 `POST /api/exam-sessions/:sessionId/vision-consent`
Records explicit candidate consent choice. Scoped to the session owner.

**Headers:** `Authorization: Bearer <Candidate_JWT>`  
**Request Body:**
```json
{
  "consentStatus": "granted",
  "explanationVersion": "v1.0",
  "consentVersion": "v1.0"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "consentId": "vcon-1730248800000-123456",
  "sessionId": "exam-101",
  "consentStatus": "granted",
  "updatedAt": "2026-10-30T04:55:00.000Z"
}
```

### 2.2 `POST /api/exam-sessions/:sessionId/observations`
Ingests compact observation metadata. Strictly rejects any binary frame, image, or video payload.

**Headers:** `Authorization: Bearer <Candidate_JWT>`  
**Request Body:**
```json
{
  "eventId": "obs_head_1730248800_9021",
  "eventType": "repeated_head_orientation_change",
  "source": "LIVE_MODEL_INFERENCE",
  "occurredAt": "2026-10-30T04:55:12.000Z",
  "modelKey": "face_landmarker",
  "modelVersion": "1.0.0",
  "modelScore": null,
  "ruleKey": "rule_head_turn_v1",
  "ruleVersion": "1.0.0",
  "signalMetadata": {
    "window_seconds": 20,
    "qualifying_turn_count": 3,
    "max_abs_yaw_delta_degrees": 28.5,
    "tracking_quality_status": "GOOD"
  }
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "eventId": "obs_head_1730248800_9021",
  "eventType": "HEAD_POSE_DEVIATION",
  "reviewStatus": "PENDING_REVIEW",
  "provenance": "ACTUAL_INFERENCE",
  "ethicalDisclaimer": "OBSERVABLE EVENT RECORDED FOR HUMAN REVIEW ONLY. ZERO AUTOMATED DISCIPLINARY PENALTY."
}
```

---

## 3. Proctor Review & Adjudication

### 3.1 `GET /api/proctor/exams/:examId/observations`
Retrieves observations for an assigned exam session. Restricted to `proctor` and `admin` roles.

### 3.2 `POST /api/proctor/observations/:observationId/review`
Submits a human proctor adjudication decision. A meaningful written review note ($\ge 5$ characters) is mandatory.

**Headers:** `Authorization: Bearer <Proctor_JWT>`  
**Request Body:**
```json
{
  "decision": "DISMISS_BENIGN_BEHAVIOR",
  "reviewNote": "Student was adjusting desk lamp due to window glare; confirmed benign movement."
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "observationId": "obs_head_1730248800_9021",
  "previousStatus": "PENDING_REVIEW",
  "newStatus": "DISMISS_BENIGN_BEHAVIOR",
  "auditLogId": "aud-1730248800000-654321",
  "resolvedAt": "2026-10-30T04:56:00.000Z"
}
```

### 3.3 `GET /api/exams/audit-log/:sessionId`
Retrieves the immutable, append-only review log for that exam session.
