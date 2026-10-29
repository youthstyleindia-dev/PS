# UniVerse Module E: Third-Party & Model Provenance Record

**Date of Audit:** October 30, 2026  
**Auditing Engineer:** Senior ML / Application Security Engineer  

---

## 1. Reference Repository Inspection: Proctora

- **Repository Source:** `https://github.com/amaanwarsi/Proctora`
- **Audit Target Workspace:** Temporary directory `/tmp/reference-proctora`
- **Exact Git Commit SHA:** `e286613ac0c64db07f2b23e175c85df44a8d9e88`
- **Commit Date:** Tue Apr 7 20:02:14 2026 +0530
- **Author:** Amaan Warsi (`62051960+amaanwarsi@users.noreply.github.com`)
- **Verified License:** **MIT License** (Copyright (c) 2026). Verified directly from `/tmp/reference-proctora/LICENSE`.

### 1.1 Technical Assessment of Proctora Codebase
The reference repository is a monolithic Python/Flask application combining OpenCV webcam capture with legacy MediaPipe Python utilities (`mp.solutions.face_detection`).

#### Reused / Adapted Concepts:
1. **Event State Machine Concepts**: Adapted the concept of tracking consecutive frame counts (`no_face_counter`) and per-event cooldown windows (`ALERT_COOLDOWN_SECONDS`) into our TypeScript-native event engine.
2. **Neutral Event Nomenclature**: Reimplemented status transitions avoiding pejorative labels.

#### Explicitly Rejected & Omitted Portions (Ethical & Architectural Boundaries):
1. **Audio Monitoring (`sounddevice`)**: REJECTED. Proctora attempts to record audio levels via microphone. This directly violates UniVerse Non-Negotiable Rule #6 (Zero audio monitoring or microphone permissions).
2. **OS Active-Window Snooping (`pygetwindow`)**: REJECTED. Proctora polls OS window titles. This violates privacy and client-sandboxing principles.
3. **VM Environment Snooping (`powershell` / `dmidecode`)**: REJECTED. Invasive OS inspection is prohibited.
4. **Server-Side Video Streaming (`generate_video_feed`)**: REJECTED. Proctora captures video via OpenCV on the server and streams MJPEG frames over HTTP. UniVerse strictly enforces local-browser inference with zero raw frames or video streams sent to the backend.
5. **Python/Flask Stack**: REJECTED. UniVerse preserves its canonical React 19 + Express 5 TypeScript stack rather than creating an uncoordinated secondary Python process.

---

## 2. Official MediaPipe Machine Learning Models & Runtime

UniVerse integrates official, tested model bundles from the Google AI Edge MediaPipe ecosystem.

### 2.1 MediaPipe Tasks Vision Web Package
- **Package Name:** `@mediapipe/tasks-vision`
- **Installed Version:** `1.2.0`
- **Location:** `client/node_modules/@mediapipe/tasks-vision`
- **Local WASM Runtime Directory:** `client/public/wasm/`
  - `vision_wasm_internal.js` (326 KB)
  - `vision_wasm_internal.wasm` (14 MB)
  - `vision_wasm_nosimd_internal.wasm` (12 MB)
- **Deployment Strategy:** Hosted locally within `client/public/wasm/`. Zero third-party CDN calls at runtime.

### 2.2 Model Artifact 1: Face Landmarker
- **Artifact Filename:** `face_landmarker.task`
- **Local Storage Path:** `client/public/models/face_landmarker.task`
- **Upstream Source URL:** `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task`
- **Official Model Card:** `https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker`
- **File Size:** 3,747,381 bytes (3.6 MB)
- **Verified SHA-256 Checksum:**  
  `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`
- **License / Terms:** Apache 2.0 / Google Edge AI MediaPipe Terms of Service
- **Output Signals Used:** 478 3D facial landmarks and 4x4 facial transformation matrix (`facialTransformationMatrixes`). Used exclusively for head orientation decomposition (yaw, pitch, roll) in volatile browser RAM. Discarded immediately after inference.

### 2.3 Model Artifact 2: Person Object Detector (EfficientDet-Lite0)
- **Artifact Filename:** `efficientdet_lite0.tflite`
- **Local Storage Path:** `client/public/models/efficientdet_lite0.tflite`
- **Upstream Source URL:** `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/latest/efficientdet_lite0.tflite`
- **Official Model Card:** `https://developers.google.com/edge/mediapipe/solutions/vision/object_detector`
- **Architecture:** EfficientDet-Lite0 (320 × 320 input tensor, COCO category classes)
- **File Size:** 7,184,818 bytes (6.9 MB)
- **Verified SHA-256 Checksum:**  
  `4b59100025bea1235a84c1038879a6cccc9f6c49f5e41144e91e74d99e780993`
- **License / Terms:** Apache 2.0 / Google Edge AI MediaPipe Terms of Service
- **Class Filtering:** Filtered exclusively to COCO class `person` (`categoryName === 'person'`). All non-person objects are filtered out.
- **Output Signals Used:** Normalized bounding box coordinates `[originX, originY, width, height]` and genuine detection score `[0.0, 1.0]`. Used strictly for restricted region intersection geometry and multi-occupant counting.

---

## 3. Ultralytics YOLO Licensing Decision
Ultralytics YOLO was evaluated and **formally excluded** from this implementation:
- **Reason:** Ultralytics distributes YOLOv8 under the GNU Affero General Public License v3.0 (AGPL-3.0), which imposes copyleft network-use obligations, or requires expensive commercial licensing.
- **Decision:** Google MediaPipe Tasks Vision (Apache 2.0) was selected as the compliant, lightweight, and legally unencumbered vision framework.
