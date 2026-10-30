# UniVerse Module E: Technical Evaluator Demonstration Script (Live Walkthrough)

This script provides an exact step-by-step guide for hackathon judges and evaluators to test and verify the responsible examination computer-vision capability.

---

## ⚡ Setup & Verification Commands

```bash
# 1. Start application (Client on :5173, Server on :3001)
npm run dev
```

Open your browser to: **`http://localhost:5173/exam-monitor`** (or `/exams`).

---

## 🎬 8-Step Evaluator Walkthrough

### Step 1: Preflight Privacy & Voluntary Consent Screen
- **What to Observe:**
  - Notice the **Responsible Examination Vision Assistant** preflight banner.
  - Review the explicit disclosures: 100% Local In-Browser Processing, Zero Audio Monitoring Guarantee, and Zero Automated Penalties.
  - Notice that the webcam is **NOT** activated until you explicitly click the action button.

### Step 2: Granting Consent & Camera Activation
- **Action:** Check the acknowledgment box and click **"Enable Camera for this Session"**.
- **What to Observe:**
  - The browser requests **Camera Permission ONLY** (Microphone access is explicitly disabled).
  - The live video preview mounts with a green status indicator: `LIVE BROWSER CAMERA` &bull; `PROVENANCE: LIVE_MODEL_INFERENCE`.

### Step 3: Local Model Readiness & Diagnostics HUD
- **What to Observe:**
  - Look at the diagnostics bar below the preview:
    - **Models Loaded:** `Face Landmarker (ready) • EfficientDet-Lite0 (ready)`
    - **Real-Time Telemetry:** Displays live measured FPS (~6–8 FPS), inference latency (~40–80 ms), and 0 dropped frames.
  - Look at the live HUD overlay in the bottom left:
    - Displays real-time Euler angles: **Yaw**, **Pitch**, and **Quality status**.

### Step 4: Neutral Head Calibration
- **Action:** Look directly at the screen in your natural resting posture and click **"Calibrate Neutral Head"**.
- **What to Observe:**
  - The button updates to **"Recalibrate Neutral"**.
  - The HUD instantly shifts to calibrated deltas ($\Delta \text{Yaw} = 0^\circ, \Delta \text{Pitch} = 0^\circ$).

### Step 5: Real-Time Model Inference & Rule Triggering
- **Action Option A (Webcam):** Turn your head to the right or left ($\ge 25^\circ$) for 1 second, return to center, and repeat 3 times.
- **Action Option B (Controlled Evaluator Triggers):** In the right panel, click **"+ Staged Head Orientation Change"** or **"+ Staged Restricted Region Incursion"**.
- **What to Observe:**
  - The observation event is instantly emitted and persists to SQLite.
  - Notice the badge on the event: `LIVE_MODEL_INFERENCE` (or `SAMPLE_DEMO`).
  - Notice the ethical disclaimer: *"OBSERVABLE EVENT RECORDED FOR HUMAN REVIEW ONLY. ZERO AUTOMATED DISCIPLINARY PENALTY."*

### Step 6: Virtual Restricted Zone Visualizer
- **What to Observe:**
  - Notice the transparent blue dashed perimeter box in the top-left of the preview: `RESTRICTED REGION`.
  - When an object/person detection box enters that quadrant for $>1.0\text{s}$, the box flashes red: `! RESTRICTED ZONE INCURSION`.

### Step 7: Proctor Adjudication Queue
- **Action:** Click the top tab **"02 // PROCTOR ADJUDICATION QUEUE"**.
- **What to Observe:**
  - The newly recorded observation appears in the queue with status `PENDING_REVIEW`.
  - Inspect the factual signal telemetry: exact degrees of deviation, dwell duration, and model scores.
  - Attempt to submit a review without notes: notice the system **strictly blocks resolution** without written proctor notes.
  - Enter a note: *"Student was looking down at paper; benign activity confirmed"*.
  - Click **"Dismiss (Benign Activity)"**.
  - The event status instantly updates to `DISMISS_BENIGN_BEHAVIOR`.

### Step 8: Immutable SQLite Audit Ledger
- **What to Observe:**
  - Scroll down to the **"Immutable Proctor Audit Trail"** table.
  - An append-only record is visible showing: Audit ID, Proctor ID, Previous Status (`PENDING_REVIEW`), New Status (`DISMISS_BENIGN_BEHAVIOR`), and the exact written justification note with UTC timestamp.
