# UniVerse Module E: Known Limitations & Edge-Case Disclosures

In accordance with strict responsible AI disclosure principles, this document outlines known operational boundaries, environmental sensitivities, and edge-case behaviors of the vision monitoring module.

---

## 1. Computer Vision & Sensor Boundaries

### 1.1 Downward Gaze vs. Physical Scratch Paper
- **Observation:** When candidates work out mathematical equations or coding sketches on physical rough paper on their desk, their head tilts downward ($\Delta \text{Pitch} < -20^\circ$).
- **System Behavior:** If maintained across several distinct turns, this can register a `repeated_head_orientation_change` observation.
- **Safeguard:** The observation is explicitly tagged `PENDING_REVIEW` with note: *"Context awaiting proctor review"*. Human proctors can observe candidate desk context and dismiss the flag with code `DISMISS_BENIGN_BEHAVIOR`.

### 1.2 Extreme Glare & Backlighting
- **Observation:** Direct sunlight behind the candidate (e.g. unshaded window) can cause high-contrast silhouetting, making facial landmarks difficult to detect.
- **System Behavior:** MediaPipe Face Landmarker drops confidence below the 0.5 threshold and reports `quality: 'NO_FACE'`.
- **Safeguard:** The rule engine strictly suppresses head-turn events when tracking quality is `'NO_FACE'`. It treats this as `insufficient_visual_data`, preventing false alerts.

### 1.3 Spectacles & Heavy Frames
- **Observation:** Thick rim glasses or heavy anti-reflective coatings under oblique lighting angles may cause slight pitch jitter ($\pm 3^\circ$).
- **System Behavior:** Handled cleanly by the $\pm 20^\circ$ pitch deadband and median smoothing window.

### 1.4 Roommates and Hallway Traffic
- **Observation:** In campus dormitories, a roommate returning to pick up keys can briefly walk through the camera frustum.
- **System Behavior:** Triggers `additional_person_detected` if the person remains in view for $>1.2\text{s}$.
- **Safeguard:** Proctors review the timestamp and context, dismissing benign co-presence without academic penalty.

---

## 2. Hardware & Network Resilience

### 2.1 Low-Power CPU Execution
- On low-end dual-core laptops without dedicated GPU acceleration, MediaPipe gracefully runs via the WebAssembly CPU delegate.
- To maintain UI fluidity, the frame scheduler automatically drops frames if inference takes $>130\text{ms}$, capping inference throughput to ~6–8 FPS without UI thread freezing.

### 2.2 Network Disconnects & Offline Operation
- If network connectivity to the Express server is lost mid-exam, the browser-side MediaPipe inference continues uninterrupted.
- Up to 20 observation records are buffered in client memory. Upon network restoration, the queue flushes automatically with idempotency keys preventing duplicates.
