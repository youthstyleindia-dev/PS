# UniVerse Campus OS — End-to-End Live Demonstration Script

**Format:** 10–12 Minute Evaluator Walkthrough  
**Persona Set:** Aarav Mehta (Student), Riya Shah (Senior Mentor), Dr. Priya Patel (Faculty), Vikram Rao (Driver), Prof. Sundaram (Proctor), IT Admin (Admin).

---

## Part 1: Public Discovery & Open Architecture (Minutes 00:00 – 01:30)

### Action
1. Open the browser to `http://localhost:5173/` (or production landing).
2. Point out the editorial warm paper (`#FAF9F5`) and deep ink typography.
3. Click the navigation links: **Platform**, **How It Works**, **Impact**, **Principles**.
4. Click **Architecture**:
   - Point out that `/architecture` loads directly without redirecting to login.
   - Show the interactive **Dijkstra Topology Sandbox**, **SPECpower Carbon Formula Sandbox**, and **Laplace Differential Privacy ($\varepsilon=0.8$) Sandbox**.
   - Show the Component-Reuse Audit evaluating past prototypes.

### Talking Points
> *"UniVerse is built on a transparent, local-first foundation. The public architecture and algorithmic models are openly accessible without requiring credentials. Every mathematical formula—from Dijkstra's time-dependent routing to Laplace noise generation—is publicly verifiable."*

---

## Part 2: Explore Console & Role-Aware Enclave Entry (Minutes 01:30 – 02:45)

### Action
1. Click **Explore Console** (or **Sign In**).
2. Notice the URL redirects seamlessly to `/login` with return target preserved.
3. Select the **Aarav Mehta** demo persona (or enter `aarav.mehta@campus.edu` / `universe2026`).
4. Click **Enter Collegiate Enclave**.

### Talking Points
> *"Notice the post-login landing: Aarav lands in the Scholar Workspace. The sidebar reflects strict role authorization. As a student, Aarav sees Scholar Workspace, Campus Feed, Senior Mentors, Campus Copilot, Carpooling, and Wellbeing. He cannot access proctor tribunals, driver transit dispatch, or root admin configurations."*

---

## Part 3: Connected Campus Feed (`/feed`) (Minutes 02:45 – 04:00)

### Action
1. Click **Campus Feed** in the sidebar.
2. Filter through categories: **Academic**, **Mobility**, **Sustainability**, **Announcements**.
3. Point out the official announcement banner published by Faculty.
4. Compose a new post:
   - Select type: `question`.
   - Body: *"Looking for 2 teammates for the upcoming AI Hackathon working on PyTorch model optimization."*
   - Add tags: `PyTorch`, `Hackathon`.
   - Click **Publish Post**.
5. Like and bookmark an existing discussion post:
   - Click the heart icon: counter increments in real time. Click again: decrements cleanly.
   - Click the bookmark icon: adds post to personal saved ledger.
6. Open comments on an announcement and leave a peer comment:
   - Type *"Will the Slurm cluster queue be paused during the update?"* and submit.

### Talking Points
> *"The campus feed brings together official faculty announcements, questions, project updates, and hackathon teams in one unified stream. Moderation reporting and role-based announcement privileges prevent misinformation."*

---

## Part 4: Senior Mentorship Network & Explainable Matching (`/mentors`) (Minutes 04:00 – 05:30)

### Action
1. Click **Find Senior Mentors** in the sidebar (`/mentors`).
2. Type in the search box: *"Machine Learning PyTorch"*.
3. Click the **PyTorch** skill chip.
4. Notice **Riya Shah** ranked at the top:
   - Explainable Match Pill: **95% MATCH • via PyTorch & ML**.
   - Hover over match badge to show the explainability breakdown (verified skills, published GitHub repos, open available slots).
5. Click **Request Advice**:
   - Modal opens showing Riya's available slots (`Tuesday 17:00 - 18:00`).
   - Select topic: *Machine Learning Internship Preparation*.
   - Add note: *"Preparing for ML research interviews. Would love your feedback on my CNN benchmark project."*
   - Click **Send Request**.
6. Switch to the **My Mentorship** tab:
   - Show the newly created request in the **Sent Requests** queue with status `pending`.

### Talking Points
> *"Finding senior guidance is grounded in transparent peer signals, not popularity or arbitrary algorithms. Underclassmen see exactly why a senior was matched to their specific questions."*

---

## Part 5: Mentor Workspace & Private Discussion (Minutes 05:30 – 06:45)

### Action
1. Click user avatar in the top right, select **Sign Out**.
2. Sign in as **Riya Shah** (`riya.shah@campus.edu` / `universe2026`).
3. Navigate to **Senior Mentors** (`/mentors`) and switch to **My Mentorship**:
   - Point out the **Incoming Guidance Requests** section displaying Aarav Mehta's request.
4. Click **Accept & Open Chat**:
   - System updates status to `accepted` and auto-provisions a private conversation.
5. In the chat dialog, type:
   - *"Hi Aarav! Send over your model training script and validation curves—I'll review them tonight."*
   - Click **Send**.
6. Demonstrate that the message appears immediately in the immutable conversation ledger.

### Talking Points
> *"Acceptance triggers automatic conversation provisioning. Only the designated mentor and mentee have cryptographic access to the thread; third parties receive a strict 403 Forbidden."*

---

## Part 6: Cloud Generative AI Campus Copilot (`/assistant`) (Minutes 06:45 – 08:15)

### Action
1. Log back in as **Aarav Mehta**.
2. Click **Campus Copilot** in the sidebar (or toggle the floating **Campus Copilot** pill in the bottom right).
3. Point out the model status indicator:
   - With `GEMINI_API_KEY`: *"Google Gemini 2.5 Flash • Live Campus Grounding"*.
   - Without key: *"Local Offline Grounding (Honest Demo Fallback)"*.
4. Ask a grounded question:
   - *"Who are the senior mentors in Machine Learning and PyTorch?"*
5. Show the response:
   - Model names Riya Shah and Kabir Patel with their exact verified company offers (Google DeepMind, Microsoft).
   - Show the **Grounded Campus Sources** card citing verified SQLite database records.
6. Ask an actionable question:
   - *"Can you register me for the upcoming AI Hackathon?"*
7. Observe the **Action Proposal Confirmation Card**:
   - Banner: **Action Proposal: Explicit Confirmation Required**.
   - Summary: *"Register Aarav Mehta for ACM Campus AI Hackathon 2026"*.
   - Click **Confirm & Execute**.
   - Observe immediate green checkmark: *"Action executed successfully in institutional records."*

### Talking Points
> *"UniVerse Copilot never hallucinates campus entities and never takes unilateral action. All sensitive state mutations generate explicit confirmation cards that require user confirmation before touching the database."*

---

## Part 7: Campus Events, Communities & Transit (Minutes 08:15 – 09:30)

### Action
1. Navigate to **Events & Communities** (`/events`).
2. Under **Events**, toggle **RSVP Now** on the *PyTorch Workshop*. Notice attendee count updates in real time.
3. Switch to **Communities** tab, click **Join Guild** on *UniVerse AI & Deep Learning Society*.
4. Switch to **Campus Directory** tab, search for *"Turing Hall"*, view coordinates and lab hours.
5. Navigate to **Campus Mobility** (`/rides`):
   - Show Dijkstra route calculation with congestion multiplier ($1.65\times$ during peak morning hours).
   - View carpool match and avoided carbon savings ($1.82\text{ kg CO}_2$).

### Talking Points
> *"All modules share the same unified institutional graph. Joining a guild, RSVPing to a workshop, and sharing a carpool to the same venue are interconnected operations."*

---

## Part 8: Sovereign Wellbeing & Ethical Exam Review (Minutes 09:30 – 10:45)

### Action
1. Navigate to **Digital Wellbeing** (`/wellbeing`):
   - Start a 25-minute Pomodoro focus session.
   - Point out that browsing telemetry strips all query strings and URLs down to bare hostnames.
   - Show the cohort differential privacy aggregate ($\varepsilon=0.8$) guaranteeing individual mathematical privacy.
2. Sign out and sign in as **Prof. M. Sundaram** (`proctor`):
   - Open **Examination Tribunal** (`/exams`).
   - Review pending observation: *Temporary Browser Blur Event*.
   - Emphasize the Ethical AI principle: No automatic disqualification. The proctor must provide a written rationale before resolving the incident.

### Talking Points
> *"Human-in-the-loop governance is non-negotiable. Algorithms observe and record; only accountable humans make academic decisions."*

---

## Part 9: Release Verification & Test Matrix (Minutes 10:45 – 12:00)

### Action
1. Open the terminal.
2. Run the deterministic verification command:
   ```bash
   npm run db:verify
   ```
   Show: 29 demo users, 15 mentors (4 ML specialists), 10 posts, 6 communities, 0 foreign key violations.
3. Run the automated test suite:
   ```bash
   npm test
   ```
   Show: **283 / 283 tests passing across 20 suites**.
4. Conclude demonstration.

### Closing Statement
> *"UniVerse Campus OS delivers on the promise: One campus. One connected experience. Grounded AI, explainable senior mentorship, strict role security, and human-in-the-loop integrity."*
