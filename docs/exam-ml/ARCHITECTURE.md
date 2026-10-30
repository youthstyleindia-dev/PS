# UniVerse Module E: Responsible Examination Vision Assistant — Architecture & Design

**Target Module:** Module E — Responsible Examination Monitoring  
**System Architecture:** Local-First Edge AI with In-Browser MediaPipe Tasks Vision + Express 5 Metadata Ingestion + SQLite WAL Persistence  
**Design Principle:** Responsible, Non-Punitive Visual Observability with Zero Cloud Frame Transmission  

---

## 1. High-Level Architectural Diagram

```mermaid
flowchart TD
    subgraph Browser ["Client Presentation Tier (Browser Sandbox)"]
        User["Candidate / Examinee"]
        ConsentUI["CameraConsentPanel (Preflight & Privacy Terms)"]
        WebCam["HTML5 MediaDevices (Video Only / No Audio)"]
        
        subgraph MediaPipeRuntime ["Local MediaPipe Tasks Vision (WebAssembly)"]
            WASM["Local Fileset (/wasm/)"]
            FaceTask["Face Landmarker 3D (face_landmarker.task)"]
            ObjTask["EfficientDet-Lite0 (efficientdet_lite0.tflite)"]
        end
        
        subgraph LocalGeometry ["Local Mathematical & Geometric State Machines"]
            PoseEst["HeadPoseEstimator (Matrix Decomposition & Calibration)"]
            RoiEng["RoiGeometryEngine (Normalized BBox Intersection)"]
            RuleEng["ObservationRuleEngine (Smoothing, Dwell, Cooldown)"]
        end
        
        CanvasOverlay["Overlay Canvas HUD (Transparent Visual Coordinates)"]
        Emitter["ObservationEmitter (Strict Zero-Frame Metadata Serializer)"]
    end

    subgraph Backend ["Server Service Tier (Node.js + Express 5)"]
        RouterConsent["POST /api/exam-sessions/:sessionId/vision-consent"]
        RouterObs["POST /api/exam-sessions/:sessionId/observations"]
        RouterProctor["GET /api/proctor/exams/:examId/observations & POST /review"]
        
        subgraph ValidationGuards ["Server-Side Authorization & Privacy Guards"]
            AuthGuard["requireAuth / requireRole / Candidate Session Check"]
            PrivacyGuard["Payload Inspection (Rejects Image/Video/Base64/Blobs)"]
            RateLimitGuard["Sliding Window Rate Limiter (Max 15 obs/min)"]
            IdempotencyGuard["Unique Event ID & Idempotency Key Handler"]
        end
    end

    subgraph Persistence ["Persistence Tier (SQLite via better-sqlite3 / WAL Mode)"]
        T_Consent["exam_vision_consents"]
        T_Registry["vision_model_registry"]
        T_Rules["exam_vision_rule_versions"]
        T_Events["observation_events"]
        T_Audit["exam_audit_log & exam_observation_audit (Immutable)"]
    end

    User --> ConsentUI
    ConsentUI -- User clicks Enable Camera --> WebCam
    ConsentUI -- Persist Choice --> RouterConsent --> T_Consent
    WebCam --> MediaPipeRuntime
    WASM --> FaceTask
    WASM --> ObjTask
    FaceTask --> PoseEst
    ObjTask --> RoiEng
    PoseEst --> RuleEng
    RoiEng --> RuleEng
    RuleEng --> CanvasOverlay
    RuleEng -- Qualified Observation Event --> Emitter
    Emitter -- Compact JSON Metadata Only --> RouterObs
    RouterObs --> PrivacyGuard --> AuthGuard --> RateLimitGuard --> IdempotencyGuard
    IdempotencyGuard --> T_Events
    IdempotencyGuard --> T_Audit

    RouterProctor --> T_Events
    RouterProctor --> T_Audit
```

---

## 2. Core Architectural Pillars

### 2.1 Pillar 1: Zero Cloud Video / Frame Transmission
- Video frames remain entirely inside the client’s volatile browser RAM.
- Neither full frames, image crops, face meshes, nor biometric embeddings are ever transmitted across the network to the backend or saved to disk.
- The browser transmits only compact, structured, non-biometric JSON metadata (such as timestamps, observed angle deltas, qualifying event counts, and rule IDs).

### 2.2 Pillar 2: Zero Audio Monitoring Guarantee
- Camera access requests strictly specify `{ video: true, audio: false }`.
- Microphone permissions are never requested. Voice recording, speaker identification, and background noise monitoring are strictly forbidden at the architectural level.

### 2.3 Pillar 3: Human-in-the-Loop Adjudication (Zero Automated Penalties)
- Visual cues (e.g., repeated head turns or restricted region entry) are classified as **observable events**, never as proof of cheating or dishonesty.
- The system defaults every detected event to `PENDING_REVIEW`.
- The system cannot terminate an exam, alter scores, or issue disciplinary sanctions. All resolution authority resides exclusively with human invigilators through an immutable, auditable review process.

### 2.4 Pillar 4: Model & Provenance Transparency
- All UI displays explicitly declare whether an event was derived from `LIVE_MODEL_INFERENCE`, `AUTHORIZED_VIDEO_INFERENCE`, or `SAMPLE_DEMO`.
- Pretrained model bundles have locally pinned SHA-256 checksums registered in the SQLite database.
