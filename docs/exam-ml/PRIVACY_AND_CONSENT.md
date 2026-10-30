# UniVerse Module E: Privacy, Ethics & Voluntary Consent Framework

**Core Policy:** Privacy-by-Design, Local-First In-Browser Processing, and Zero Automated Penalties  

---

## 1. Ethical AI Principles & Product Safeguards

Modern proctoring solutions often suffer from invasive surveillance practices, biased algorithms, and opaque "cheating scores". UniVerse establishes non-negotiable boundaries:

1. **Observable Cues $\ne$ Misconduct:**
   A head orientation change or momentary absence from a desk is never treated as proof of cheating. It is recorded as a neutral visual observation requiring contextualized human interpretation.
2. **Zero Automated Discipline:**
   The software cannot terminate an exam, fail a candidate, deduct points, or alter academic records. All disciplinary authority resides exclusively with human invigilators.
3. **Zero Audio Monitoring:**
   UniVerse does not request microphone access. No background audio, acoustic classification, or voice activity detection is ever implemented.
4. **Zero Cloud Video Ingestion:**
   Webcam frames are analyzed exclusively inside volatile client-side browser memory via WebAssembly. Neither raw frames, image crops, face meshes, nor biometric identity embeddings are ever transmitted across the network or stored on central servers.
5. **No Biometric Identification:**
   The system does not perform face recognition, identity verification, demographic profiling (age, race, gender), emotion recognition, or gaze/attention estimation.

---

## 2. Voluntary Consent Lifecycle

Camera activation is governed by an explicit preflight consent workflow:

```text
[PREFLIGHT EXPLANATION]
          ↓
[User clicks 'Enable Camera for this Session']
          ↓
[POST /api/exam-sessions/:sessionId/vision-consent ('granted')]
          ↓
[navigator.mediaDevices.getUserMedia({ video: true, audio: false })]
          ↓
[ACTIVE MONITORING WITH VISIBLE 'STOP CAMERA' CONTROL]
          ↓
(User clicks 'Stop Camera' OR Route Changes OR Unmount)
          ↓
[All MediaStreamTracks stopped; video.srcObject = null; models disposed]
```

### 2.1 Candidate Rights & Decline Alternative
- If a student declines camera consent or if their device hardware lacks a compatible camera, the system does not crash or penalize the student.
- The exam session degrades gracefully to a manual in-person or proctor-assisted verification path.

---

## 3. Data Governance & Metadata Minimization

The only visual monitoring data transmitted to the backend is compact, structured JSON metadata:

```json
{
  "eventId": "obs_head_1730248800_1245",
  "sessionId": "exam-101",
  "eventType": "repeated_head_orientation_change",
  "source": "LIVE_MODEL_INFERENCE",
  "occurredAt": "2026-10-30T04:45:00.000Z",
  "modelScore": null,
  "signalMetadata": {
    "window_seconds": 20,
    "qualifying_turn_count": 3,
    "max_abs_yaw_delta_degrees": 28.4,
    "tracking_quality_status": "GOOD"
  }
}
```

### 3.1 Strict Server-Side Payload Inspection
The server inspects all incoming observation requests and rejects any payload containing raw images, base64 strings, or video blobs with HTTP 400 (`PRIVACY_VIOLATION`).
