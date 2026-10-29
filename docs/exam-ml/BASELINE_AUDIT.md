# UniVerse Module E: Responsible Examination Monitoring — Baseline Audit

**Date of Audit:** October 30, 2026  
**Auditor:** Senior ML/CV Architect & Application Security Engineer  
**Workspace:** `/Users/divya/Documents/Problem statement `  
**Branch / State:** Clean baseline, all tests passing.

---

## 1. Executive Summary & Existing Stack Verification

An exhaustive baseline audit of the existing UniVerse codebase was conducted prior to making any modifications.

| System Layer | Verified Technology & Version | Status |
| :--- | :--- | :---: |
| **Frontend Runtime** | React 19.0.0, TypeScript 5.8.2, Vite 6.2.0 | Verified |
| **CSS & Design System** | Tailwind CSS v4, Lucide Icons, Recharts 2.15 | Verified |
| **Backend Framework** | Node.js (v20+), Express 5.3.0, TypeScript via `tsx` | Verified |
| **Database Persistence** | SQLite 3 via `better-sqlite3` 13.0.3 with WAL mode and foreign keys enabled | Verified |
| **Identity & Security** | Bcrypt salted password hashing, HMAC-SHA256 JWT, 6 Canonical Roles | Verified |
| **Testing Harness** | Vitest 3.2.7 + Supertest 7.3.1 | Verified |

### Baseline Test Execution Results (Prior to Changes)
- **Command Run:** `npm test`
- **Result:** `Test Files 14 passed (14) | Tests 229 passed (229)`
- **Duration:** 5.83s
- **Existing Failing Tests:** **0 (Zero)**. All existing unit, adversarial, security, boundary, and integration tests passed cleanly.
- **Build Status:** Both `npm run build:server` (`tsc -p server/tsconfig.json`) and `npm run build:client` (`tsc -b && vite build`) completed with 0 errors.

---

## 2. Existing Examination Architecture & Artifacts

### 2.1 Database Schema (`server/src/db/schema.sql`)
The database contains the following existing tables relating to examinations:
- `exam_sessions`: Holds exam title, student ID, course ID, scheduled start/end, and candidate station zone.
- `exam_session_assignments`: Links `session_id` and `proctor_id` with active status.
- `observation_events`: Records event ID, session ID, timestamp, event type, confidence score, frame snapshot URL, provenance (`ACTUAL_INFERENCE`, `SIMULATED_EVENT`, `ESTIMATED_METRIC`), review status (`PENDING_REVIEW`, `DISMISS_FALSE_POSITIVE`, `DISMISS_BENIGN_BEHAVIOR`, `ESCALATE_TO_INVIGILATOR`), proctor notes, and reviewer ID.
- `exam_audit_log`: Append-only audit trail logging proctor review actions with previous/new status, proctor ID, and timestamp.

### 2.2 Server Routes (`server/src/routes/exams.routes.ts`)
- `GET /api/exams/sessions`: Proctor/admin restricted list of all exam sessions.
- `POST /api/exams/sessions`: Create new scheduled session.
- `POST /api/exams/events`: Ingest observation event with provenance validation and automatic proctor notification.
- `GET /api/exams/pending-reviews`: Proctor/admin review queue filtering for `PENDING_REVIEW`.
- `GET /api/exams/events/:sessionId`: Scoped session events for assigned proctors/owners.
- `PATCH /api/exams/events/:eventId/review`: Proctor review resolution requiring mandatory non-empty proctor notes and writing to `exam_audit_log`.
- `GET /api/exams/audit-log/:sessionId`: Audit trail retrieval.

### 2.3 Client Implementation (`client/src/pages/ExamMonitorPage.tsx`)
- Displays three tabs: `TRIBUNAL_QUEUE`, `VISUAL_INFERENCE_DOCK`, and `BROWSER_SESSION_DOCK`.
- Visual preview contains an HTML5 video element with `getUserMedia` stream request.
- Canvas runner draws a synthetic student silhouette pattern (`ctx.arc(...)`) and a static top-left restricted zone box.
- Simulated action buttons allow manual injection of `RESTRICTED_ZONE_INCURSION` and `MULTIPLE_OCCUPANTS_DETECTED`.

---

## 3. Gaps & Deficiencies Identified in Existing Baseline

1. **Synthetic Rather Than Real Model Inference in UI**:
   The current canvas draws fixed 2D vector shapes rather than feeding live camera video through real neural networks.
2. **Missing MediaPipe Vision Models**:
   Neither `@mediapipe/tasks-vision` nor pretrained model bundles (`face_landmarker.task`, `efficientdet_lite0.tflite`) were integrated.
3. **Lack of Mathematical Head Pose Estimation**:
   No facial transformation matrix decomposition or 3D landmark geometric calculations exist to determine real yaw/pitch/roll.
4. **Lack of Real Object Detection & ROI Intersection**:
   No person class detection or polygon/bounding box IoU calculation exists; zone entry was triggered via a manual button.
5. **No Structured Vision Consent Workflow**:
   Camera permission was requested directly without a formal multi-step explanatory consent dialog detailing processing scope, storage guarantees, and the right to stop.
6. **No Local Model Registry or Provenance Integrity**:
   Model artifact hashes and version registries were not tracked in SQLite.
7. **Potential Video Payload Ingestion**:
   The existing `frame_snapshot_url` schema column could theoretically accept base64 or remote image URLs; strict server-side validation to reject all image/frame payloads was not fully enforced.

---

## 4. Planned Integration Roadmap

1. **Model Assets & WASM**:
   - Install official `@mediapipe/tasks-vision` package (v1.2.0).
   - Place official `face_landmarker.task` and `efficientdet_lite0.tflite` model bundles in `client/public/models/`.
   - Host MediaPipe WASM runtime files locally in `client/public/wasm/` for zero third-party CDN reliance.
2. **Vision Model Runtime Architecture (`client/src/modules/exam-monitor/`)**:
   - `createVisionTasks.ts`: Local singleton loader for FaceLandmarker and ObjectDetector using local WASM.
   - `headPoseEstimator.ts`: Decomposes facial transformation matrix into yaw, pitch, and roll in degrees with neutral calibration.
   - `roiGeometry.ts`: Calculates normalized bounding-box coordinates and intersection with configured restricted regions.
   - `observationRules.ts`: Temporal state machine applying smoothing, hysteresis, dwell time, and cooldowns.
   - `observationEmitter.ts`: Transmits metadata-only payloads to the backend (zero frames or biometric signatures).
3. **Database Schema Enhancements**:
   - Add `exam_vision_consents`, `vision_model_registry`, and `exam_vision_rule_versions` tables without disrupting existing data.
4. **API Endpoints**:
   - Implement `GET /api/exam-monitor/capabilities`, `POST /api/exam-sessions/:sessionId/vision-consent`, `POST /api/exam-sessions/:sessionId/observations`, `GET /api/proctor/exams/:examId/observations`, and `GET /api/exam-monitor/health`.
5. **Testing Suite**:
   - Unit tests for head pose decomposition, ROI geometry, temporal rule engine, model adapters.
   - Integration tests verifying candidate session isolation, proctor role gates, image payload rejection, and mandatory audit notes.
