# UniVerse: Live Hackathon Demonstration Script (8-Step Judge Walkthrough)

> **Execution Time**: ~5 Minutes  
> **Target Audience**: Technical Evaluators, Hackathon Judges, and Architecture Reviewers  
> **Prerequisites**: Node.js v18+, zero external cloud accounts or paid API keys required  

---

## ⚡ Quick Start Commands

```bash
# 1. Start full-stack application (Client on :5173, Server on :3001)
npm run dev

# 2. Run automated test suite in separate terminal (190 tests across 12 suites in ~1.7s)
npm test
```

Open your browser to: **`http://localhost:5173`**

---

## 🎬 8-Step Verification Walkthrough

### Step 1: Public Manifesto & 1-Click Sandbox Sign-In
- **Action**: Open `http://localhost:5173/` and click **"Launch Sandbox"** (or go to `/login`).
- **What to Observe**:
  - The editorial brutalist typography (Epilogue, Geist, JetBrains Mono) with Warm Paper (`#faf9f5`) and Cobalt (`#003fe1`).
  - Under **"Quick Sandbox Access (1-Click Personas)"**, click **"Student"** (Aarav Sharma) or **"Proctor"** (Dr. Meenakshi Sundaram).
  - Observe instant JWT issuance and redirection to the authenticated dashboard without needing to remember passwords!

---

### Step 2: Integrated Dashboard Command Center (`/app`)
- **Action**: Navigate to `http://localhost:5173/app`.
- **What to Observe**:
  - The unified command center displaying live cross-module telemetry: Placement Readiness (`81%`), Active Rides (`2`), Green Computing Power (`480W`, `-45.9%`), Deep Work Focus (`84.5%`), and Proctor Reviews Pending (`2`).
  - Strict **Provenance Badges** (`[ACTUAL INFERENCE]`, `[SIMULATED EVENT]`, `[ESTIMATED METRIC]`) attached to all telemetry cards.
  - Persona switcher in the top header and left navigation allowing seamless role toggling on the fly.

---

### Step 3: Student Intelligence & Placement Readiness (`/academic`)
- **Action**: Click **"Academic Hub"** in the sidebar (or navigate to `/academic`).
- **What to Observe**:
  - Inspect student profile for *Aarav Sharma* (Computer Science & Engineering, 4th Year).
  - Under **"Placement Milestones"**, click any milestone toggle checkbox (e.g., *"Solve 150 LeetCode Questions"*). Notice that the student's **Readiness Score dynamically recalculates** in real time!
  - Switch to the **"Peer Mentorship Commons"** tab: filter mentors by *"System Design"*, click **"Request Mentorship"** on *Diya Patel* (Incoming SDE at Google), enter a mock interview note, and click submit. Notice instant SQLite persistence and status set to `PENDING`.
  - Switch to **"Sovereign Curriculum Archive"** to view verified academic resources and course syllabi.

---

### Step 4: Graph-Based Smart Campus Ride-Pooling (`/rides`)
- **Action**: Click **"Ride Pooling & Matcher"** in the sidebar (or navigate to `/rides`).
- **What to Observe**:
  - The **Interactive 10-Node Campus Map** (`CampusMapSvg`) displaying all campus waypoints and road segments with live congestion scaling (`1.65x` during morning peak).
  - Click on an active driver offer. Observe the **Dijkstra & Dial-a-Ride Matching Calculation**:
    - **Driver Solo Route**: `DORM_NORTH → GATE_SOUTH`
    - **Pooled Route**: `DORM_NORTH → LIB_CENTRAL → DORM_SOUTH → GATE_SOUTH` (highlighted on the map!)
    - **Detour Bound Check**: Proves relative detour is strictly within the $35\%$ ceiling (`+18% detour`).
    - **Avoided Carbon**: Displays `+0.22 kg CO2e` avoided and passenger fare discount.
  - Click **"Confirm Shared Booking"**: verify seat count decrements and booking is persisted.

---

### Step 5: Sustainable Computing Observatory (`/sustainability`)
- **Action**: Click **"Slurm Carbon Sync & Obs."** in the sidebar (or navigate to `/sustainability`).
- **What to Observe**:
  - Telemetry snapshots for 3 core services: *Academic API*, *Ride Routing Service*, and *Resource Search*.
  - Observe the **Diurnal Solar vs Grid Carbon Intensity SVG Curve** showing solar peak (10:00–14:00) carbon displacement.
  - In the **Workload Scaling Sandbox**, drag the request slider from `150 req/s` to `500 req/s`. Watch server power draw and hourly carbon recalculate live via the non-linear power formula:
    $$P(U) = P_{\text{idle}} + (P_{\text{max}} - P_{\text{idle}}) \times (U/100)^{1.25}$$
  - Toggle between baseline (PUE 1.75) and eco-optimized (PUE 1.20) and observe instant facility energy reduction.

---

### Step 6: Privacy-Aware Digital Wellbeing (`/wellbeing`)
- **Action**: Click **"Focus & Wellbeing (DP)"** in the sidebar (or navigate to `/wellbeing`).
- **What to Observe**:
  - The circular breathing Focus Timer. Click **"Start Focus Session"** (45m preset). Notice true elapsed interval tracking across pause/resume cycles.
  - Inspect the **Local Domain Rules Manager**: notice all query strings, tokens, and URL paths are stripped locally via regex (`new URL().hostname`) before logging.
  - Inspect the **Differential Privacy Cohort Card**: displays departmental mean focus time with Laplace noise ($\epsilon = 0.8$, $\Delta f = 1.0$) and $k$-anonymity suppression ($k \ge 3$).
  - Click **"Purge All History"** to verify GDPR Right-to-Erasure permanent deletion from SQLite.

---

### Step 7: Responsible Examination Review (`/exams`)
- **Action**: Click **"Exam Review Tribunal"** in the sidebar (or navigate to `/exams`).
- **What to Observe**:
  - Prominent **Constitutional Ethics Disclaimer**: *"Observations support human review; they are not proof of misconduct. Zero automated penalties."*
  - Switch to **"02 // MODE 2: LOCAL VISUAL-EVENT ADAPTER"**:
    - Toggle consented camera or inspect the local canvas contour runner.
    - Click **"Trigger Zone Incursion Event"** (`RESTRICTED_ZONE_INCURSION`) or **"Trigger Multi-Occupant Event"** (`MULTIPLE_OCCUPANTS_DETECTED`).
  - Switch to **"01 // TRIBUNAL ADJUDICATION QUEUE"**:
    - Select the flagged event. Notice that proctor notes are **mandatory** for audit compliance.
    - Enter notes: *"Verified physical scratchbook notes on desk ledger; student was calculating derivative. Benign activity."*
    - Click **"Dismiss as False Positive"** and observe instant audit log creation in `exam_audit_log`.

---

### Step 8: Architecture & Open-Source Reuse Audit (`/architecture`)
- **Action**: Click **"Algorithm Sandbox & Docs"** in the sidebar (or navigate to `/architecture`).
- **What to Observe**:
  - **Tab 1: REUSE AUDIT**: Inspect the detailed evaluation of the 5 open-source repositories (ScholarOS, Proctora, Cloud Carbon Footprint, Focuser, ExMAS) with license checks, reused patterns, and rejected elements.
  - **Tab 2: ALGO SANDBOX**: Test live custom Dijkstra campus routing, run the Cloud Carbon Footprint formula calculator, and sample Laplace DP perturbation noise directly on the page.
  - **Tab 3: SYSTEM SPEC**: Inspect the 3-layer architecture, SQLite WAL engine specifications, and the 190/190 passing automated test matrix.
