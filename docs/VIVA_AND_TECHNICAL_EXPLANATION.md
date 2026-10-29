# UniVerse: Complete Technical Report & Viva Defense Guide
**An Intelligent, Sustainable, and Privacy-Aware Campus Ecosystem**  
*Comprehensive System Explanation, Mathematical Models, Architecture, and Exhaustive Technical Q&A*

---

## Part 1: High-Level System Architecture & Operating Mechanics

### 1.1 What is UniVerse?
UniVerse is a unified, full-stack campus operating platform designed to solve the critical operational fragmentation found across modern universities. Instead of running disconnected platforms for placements, campus transport, computing infrastructure, student wellness, and proctored examinations, UniVerse brings all five domains under a single high-performance modular monolith with shared relational data persistence, centralized role-based access control (RBAC), and mathematical/algorithmic oracles.

### 1.2 Technology Stack
- **Frontend**: React 19, TypeScript (Strict), Vite 6, Tailwind CSS v4, Lucide Icons, Recharts, React Router v7.
- **Backend**: Node.js, Express v5, TypeScript (TSX), Modular Route Architecture.
- **Database**: SQLite 3 using `better-sqlite3` in Write-Ahead Logging (`WAL`) mode with foreign key constraints enabled.
- **Security & Identity**: Bcrypt password hashing (salt factor 10), JSON Web Tokens (JWT) with HMAC-SHA256, fine-grained RBAC with 6 canonical roles and 35+ scoped permissions.
- **Testing**: Vitest 3.2.7 and Supertest 7.3.1 (190 automated tests across 12 suites, 100% pass rate in ~1.7s).
- **Zero Cloud Dependencies**: 100% locally portable without any paid third-party APIs or cloud subscriptions.

---

## Part 2: Module-by-Module Technical Deep Dive

### 2.1 Module A: Student Intelligence & Academic Hub (`/hub` or `/academic`)
#### What Happens Under the Hood:
1. **Dynamic Placement Readiness**:
   - When a student views their profile, the backend retrieves completed milestone records (`placement_milestones`) and computes a weighted readiness score ($R \in [0, 100\%]$):
     $$R = \frac{\sum_{i \in \text{Completed}} w_i}{\sum_{j \in \text{All}} w_j} \times 100$$
   - The client renders a dynamic 6-axis SVG skill radar chart mapped along Core CS, System Design, Algorithms, Problem Solving, Communication, and Project Portfolio.
   - Toggling a milestone executes an atomic SQLite transaction, updates the milestone status, recalculates the readiness score, and appends an entry to the campus `activity_log`.
2. **Peer Mentorship Discovery & Booking Lifecycle**:
   - Mentors are senior students who have cleared top-tier tech placements (e.g., Google, Amazon, Microsoft).
   - When a student initiates a request, the server inserts a record into `mentorship_requests` with status `PENDING`.
   - Mentors can accept or reject requests. Acceptance decrements available booking slots and issues a real-time notification to the student mentee.
3. **Academic Resource Repository with Community Scoring**:
   - Past exam papers, lecture notes, and lab manuals are categorized by course code (`CS101`, `CS201`, etc.) and document type.
   - Ratings ($1 \le r \le 5$) are tracked in `resource_ratings` with a database `CHECK` constraint. Average scores are recalculated as the exact arithmetic mean on every submission.

---

### 2.2 Module B: Smart Campus Ride-Pooling (`/rides`)
#### What Happens Under the Hood:
1. **10-Node Topological Campus Graph**:
   - Represented as a directed weighted graph $G = (V, E)$ with 10 nodes (Gate North, Academic Quad, Central Library, Sports Complex, Tech Park, etc.) and 30 directed edges.
   - Edges store physical distance in kilometers ($d \ge 0$) and base travel time in minutes.
2. **Dijkstra Shortest Path with Time-Varying Congestion Multiplier**:
   - Standard edge cost is adjusted by time-of-day traffic multiplier $c(t)$:
     $$c(t) = \begin{cases} 
     1.65 & \text{if } 08:15 \le t \le 09:30 \quad (\text{Morning Rush}) \\
     1.35 & \text{if } 12:00 \le t \le 13:30 \quad (\text{Lunch Migration}) \\
     1.70 & \text{if } 17:00 \le t \le 18:30 \quad (\text{Evening Dispersal}) \\
     1.00 & \text{otherwise (Free-Flow)}
     \end{cases}$$
   - Dynamic travel time: $T(u, v, t) = t_{\text{base}}(u, v) \times c(t)$.
   - Complexity: $\mathcal{O}((V + E) \log V)$ using binary min-heap priority queue.
3. **Dial-a-Ride Problem (DARP) Insertion Matching**:
   - Evaluates whether driver trajectory $O_d \to D_d$ can accommodate passenger $O_p \to D_p$:
     - Baseline Driver Distance: $D_{\text{driver}} = \text{Dijkstra}(O_d, D_d)$.
     - Pooled Distance: $D_{\text{pooled}} = \text{Dijkstra}(O_d, O_p) + \text{Dijkstra}(O_p, D_p) + \text{Dijkstra}(D_p, D_d)$.
     - Detour: $\Delta D = D_{\text{pooled}} - D_{\text{driver}}$.
     - Detour Ratio: $\delta = \frac{\Delta D}{D_{\text{driver}}}$.
   - Match is approved if and only if:
     1. $\text{seats}_{\text{available}} \ge \text{seats}_{\text{needed}}$
     2. $\delta \le \text{Max Detour Ratio}$ (strictly $\le 0.35$ or $35\%$)
     3. $|\text{time}_{\text{driver}} - \text{time}_{\text{passenger}}| \le 20\text{ minutes}$
4. **Environmental & Financial Accounting**:
   - Avoided Carbon Emissions:
     $$\Delta \text{CO}_2 (\text{kg}) = (\text{Dist}_{\text{solo, driver}} + \text{Dist}_{\text{solo, passenger}} - \text{Dist}_{\text{pooled}}) \times \text{EF}$$
     where $\text{EF} = 0.155\text{ kg CO}_2\text{e/km}$ (petrol) or $0.048\text{ kg CO}_2\text{e/km}$ (EV).
   - Passenger fare discount: $40\%$ discount on shared journey leg.
   - Driver subsidy: $85\%$ of collected passenger fare paid to driver.

---

### 2.3 Module C: Sustainable Computing Observatory (`/sustainability`)
#### What Happens Under the Hood:
1. **Three Core Campus Microservices**:
   - Workload telemetry is continuously simulated for:
     - `academic-portal`: CPU-intensive student traffic.
     - `ride-routing-service`: Memory- and graph-intensive matching queries.
     - `ai-resource-indexer`: GPU-intensive semantic embeddings and video analysis.
2. **Non-Linear Server Power Modeling**:
   - Server power is not linear; power increases convexly with utilization:
     $$P(U) = P_{\text{idle}} + (P_{\text{max}} - P_{\text{idle}}) \times \left(\frac{U}{100}\right)^\gamma$$
     - CPU Node: $P_{\text{idle}} = 95.0\text{ W}$, $P_{\text{max}} = 340.0\text{ W}$, $\gamma = 1.25$.
     - GPU Node: $P_{\text{idle}} = 145.0\text{ W}$, $P_{\text{max}} = 680.0\text{ W}$, $\gamma = 1.35$.
3. **Facility Power & PUE Scaling**:
   - Auxiliary cooling and UPS power losses are modeled via Power Usage Effectiveness ($\text{PUE}$):
     $$P_{\text{facility}} = P(U) \times \text{PUE} \times \text{replicas}$$
     - Legacy Baseline: $\text{PUE} = 1.75$ (chiller cooling).
     - Eco-Optimized: $\text{PUE} = 1.20$ (free-air cooling, dynamic core idling).
4. **Diurnal Regional Grid Carbon Factor**:
   - Indian regional grid carbon intensity varies based on solar production vs coal peakers:
     - 10:00 - 15:00: Solar peak ($190\text{ g CO}_2\text{e/kWh}$).
     - 18:00 - 22:00: Thermal peaker peak ($680\text{ g CO}_2\text{e/kWh}$).
     - Night / Shoulder: $410 - 475\text{ g CO}_2\text{e/kWh}$.
5. **Eco-Optimization Savings**:
   - Switching from Baseline to Eco-Optimized demonstrates a mathematically verified $-45.9\%$ power reduction and financial savings calculated at ₹9.50/kWh.

---

### 2.4 Module D: Privacy-Aware Digital Wellbeing (`/wellbeing`)
#### What Happens Under the Hood:
1. **User-Controlled Sovereign Focus Sessions**:
   - Students control session start, pause, resume, and stop.
   - Uses real wall-clock timestamps ($t_{\text{now}} - t_{\text{start}} - t_{\text{paused}}$), ensuring accuracy even if the browser background tab is throttled.
2. **Local Hostname Sanitization (Zero-Telemetry Invariant)**:
   - Client parses raw URLs and completely strips query strings, auth tokens, paths, and fragments before logging:
     `https://leetcode.com/problems/two-sum?token=secret123#solution` $\to$ `leetcode.com`.
3. **Deep Work Index (DWI) & Context Switch Rate (CSR)**:
   - Context switches are logged when a user rapidly transitions between `PRODUCTIVE` and `DISTRACTING` domains.
   - $\text{CSR} = \frac{\text{Switch Count}}{\text{Active Focus Hours}}$.
   - Deep Work Index:
     $$\text{DWI} = \text{clamp}\left(0, 100, 100 \times (0.5 \times \text{AFR} + 0.3 \times \text{Switch Penalty} - 0.2 \times \text{Distraction Ratio})\right)$$
4. **Differential Privacy via Laplace Mechanism**:
   - Departmental focus averages are aggregated without deanonymizing individual students.
   - **$k$-Anonymity Suppression**: If class cohort size $n < 3$, query returns `isSuppressed: true`.
   - **Global Sensitivity**: $\Delta f = \frac{480\text{ minutes}}{n}$.
   - **Calibrated Laplace Noise**: With privacy budget $\epsilon = 0.8$:
     $$\text{Scale } b = \frac{\Delta f}{\epsilon} = \frac{480}{n \times 0.8}$$
     $$\tilde{\mu} = \max\left(0, \mu_{\text{raw}} + \text{Lap}(b)\right)$$
     where $\text{Lap}(b) = -b \cdot \text{sgn}(u) \cdot \ln(1 - 2|u|)$ for $u \in (-0.5, 0.5)$.
5. **GDPR Right to Erasure**:
   - One-click permanent purge (`DELETE /api/wellbeing/history/:userId`) cascades through SQLite tables, permanently wiping all sessions and domain records.

---

### 2.5 Module E: Responsible Examination Monitoring (`/exams`)
#### What Happens Under the Hood:
1. **Strict Ethical Invariant (Zero Automated Penalties)**:
   - System design strictly separates computer-vision observation from disciplinary action. An algorithm never declares cheating or penalizes a student.
2. **Dual-Mode Video Processing**:
   - **Mode A (Demo Feed)**: Deterministic, repeatable stream of simulated behavioral cues (`HEAD_POSE_DEVIATION`, `RESTRICTED_ZONE_INCURSION`, `MULTIPLE_OCCUPANTS_DETECTED`).
   - **Mode B (Live Camera PoC)**: Local in-browser webcam stream using HTML5 canvas boundary detection. Zero frames or video data are ever uploaded to cloud servers or saved to disk.
3. **Human-in-the-Loop Proctor Audit Queue**:
   - Flagged observations enter the queue with status `PENDING_REVIEW`.
   - Human proctor reviews the context and must select an action:
     - `DISMISS_FALSE_POSITIVE` (e.g., lighting glitch, reflection).
     - `DISMISS_BENIGN_BEHAVIOR` (e.g., student looking down at physical scratch paper).
     - `ESCALATE_TO_INVIGILATOR` (manual verification required).
4. **Mandatory Proctor Justification & Immutable Audit Log**:
   - Backend rejects review submissions if `proctorNotes` is empty or missing.
   - Every resolution generates an append-only row in `exam_audit_log` recording event ID, session ID, proctor ID, timestamp, prior status, new status, and proctor justification.

---

## Part 3: Cross-Cutting Architectural Innovations

### 3.1 3-Tier Provenance Badging System
To ensure complete transparency and prevent deceptive AI claims:
- `[ACTUAL_INFERENCE]`: Deterministic algorithmic outputs or local client-side computer vision inference.
- `[SIMULATED_EVENT]`: Controlled synthetic events injected to illustrate edge cases without invasive surveillance.
- `[ESTIMATED_METRIC]`: Values calculated using transparent, published mathematical models (such as server power curves and CEA carbon factors).

### 3.2 Fine-Grained Role-Based Access Control (RBAC)
- 6 Canonical Roles: `student`, `driver`, `proctor`, `ta_faculty`, `warden`, `admin`.
- Enforced at two layers:
  1. Frontend: React Router `RoleGate` component dynamically hides unauthorized screens and prevents route navigation.
  2. Backend: Express middleware `requireRole`, `requirePermission`, and resource ownership checks (`requireResourceOwner`, `requireAssignedExamSession`).
- Token architecture: Standard JWT with `sub`, `email`, `role`, and `name` signed with HMAC-SHA256. Passwords hashed using `bcryptjs` with salt factor 10.

### 3.3 Database Architecture (28 Relational Tables)
SQLite 3 running with:
- `PRAGMA journal_mode = WAL;` (Write-Ahead Logging permits concurrent reads while a write occurs).
- `PRAGMA foreign_keys = ON;` (Ensures strict referential integrity and cascading deletions).
- 28 relational tables cleanly partitioned across identity, hub, mobility, sustainability, wellbeing, exams, and shared activity.

---

## Part 4: Technical Viva Q&A (Defense-Ready)

### Category 1: System Architecture & Design Choices

#### Q1: Why did you choose a Modular Monolith instead of a Microservices architecture?
**Answer**:
For a 12-hour hackathon MVP and unified campus OS, a modular monolith provides significant architectural advantages:
1. **Zero Network Latency**: Internal service-to-service calls are zero-latency in-process function invocations rather than HTTP or gRPC round-trips.
2. **ACID Transaction Guarantees**: Relational updates across modules (e.g., booking a ride and updating the shared campus activity feed) happen within single atomic SQLite transactions without needing complex distributed two-phase commits (2PC) or Sagas.
3. **Single-Binary Portability**: The entire system runs locally on any laptop with zero paid API keys, zero cloud subscriptions, and zero Docker orchestration overhead.
4. **Clean Domain Separation**: The code is organized into decoupled modules (`/hub`, `/rides`, `/sustainability`, `/wellbeing`, `/exams`) with strict TypeScript interface contracts, allowing any module to be extracted into an independent microservice in the future if campus load requires horizontal scaling.

#### Q2: Why did you select SQLite with `better-sqlite3` rather than PostgreSQL or MongoDB?
**Answer**:
1. **Performance**: `better-sqlite3` is a synchronous, in-process C++ binding for SQLite. It is significantly faster than asynchronous driver round-trips for local databases, executing tens of thousands of queries per second with sub-millisecond latencies.
2. **Write-Ahead Logging (WAL)**: By enabling `PRAGMA journal_mode = WAL`, readers do not block writers, and writers do not block readers. Multiple read operations proceed concurrently alongside background writes.
3. **Zero Configuration**: Eliminates external database installation and network configuration hurdles for judges and evaluators.
4. **Full Relational Integrity**: Unlike NoSQL document stores, SQLite provides full foreign key constraints, `CHECK` constraints (e.g., ensuring ratings are between 1 and 5), and transactional consistency across all 28 tables.

#### Q3: How do you handle concurrency and race conditions (e.g., two passengers attempting to book the last seat simultaneously)?
**Answer**:
1. SQLite WAL mode provides serializable write transactions. Every write transaction obtains an exclusive lock at the database engine level.
2. In `ride_matching.service.ts`, seat booking is wrapped in an atomic transaction:
   ```sql
   UPDATE ride_offers 
   SET available_seats = available_seats - ? 
   WHERE id = ? AND available_seats >= ?;
   ```
3. If two concurrent requests arrive for the last remaining seat, the first transaction decrements `available_seats` to 0. The second transaction finds `available_seats >= ?` false, matches 0 rows, and the API immediately aborts and returns HTTP 409 Conflict with `INSUFFICIENT_SEAT_CAPACITY`.

---

### Category 2: Graph Algorithms & Ride Matching (Module B)

#### Q4: Explain the mathematical model behind the campus ride-pooling match algorithm.
**Answer**:
The ride matching algorithm is a constrained variant of the **Dial-a-Ride Problem (DARP)** implemented on a weighted campus graph $G = (V, E)$:
1. First, we compute the driver's solo shortest path from origin $O_d$ to destination $D_d$ using Dijkstra's algorithm, yielding distance $D_{\text{driver}}$.
2. For a passenger request ($O_p \to D_p$), we evaluate the combined pooled trajectory: $O_d \to O_p \to D_p \to D_d$.
3. We compute the three constituent legs using Dijkstra:
   $$D_{\text{pooled}} = \text{Dijkstra}(O_d, O_p) + \text{Dijkstra}(O_p, D_p) + \text{Dijkstra}(D_p, D_d)$$
4. We calculate the driver's extra detour: $\Delta D = D_{\text{pooled}} - D_{\text{driver}}$, and the detour ratio $\delta = \frac{\Delta D}{D_{\text{driver}}}$.
5. A match is deemed feasible if and only if three invariants hold:
   - Seat constraint: $\text{available\_seats} \ge \text{seats\_needed}$
   - Detour constraint: $\delta \le 0.35$ ($35\%$ ceiling)
   - Temporal constraint: $|\text{departure\_time} - \text{desired\_time}| \le 20\text{ minutes}$.

#### Q5: How does the dynamic congestion multiplier $c(t)$ impact Dijkstra's algorithm?
**Answer**:
Physical road distances remain constant, but edge traversal times vary dynamically based on campus foot and vehicular traffic. We model this using a time-of-day step function $c(t)$:
- Morning Rush (08:15–09:30): $c(t) = 1.65$
- Lunch Migration (12:00–13:30): $c(t) = 1.35$
- Evening Dispersal (17:00–18:30): $c(t) = 1.70$
- Off-Peak: $c(t) = 1.00$
During edge relaxation in Dijkstra, the edge weight for time is evaluated as $T(u, v, t) = t_{\text{base}}(u, v) \times c(t)$. When routing for fastest arrival, the algorithm automatically routes around congested bottlenecks to clear pathways.

#### Q6: How do you compute avoided carbon emissions for pooled trips?
**Answer**:
We calculate total travel distance under two scenarios:
1. Solo Scenario: $\text{Dist}_{\text{solo}} = D_{\text{driver, solo}} + D_{\text{passenger, solo}}$.
2. Pooled Scenario: $\text{Dist}_{\text{pooled}}$.
3. Avoided Vehicle Kilometers: $\Delta K = \max(0, \text{Dist}_{\text{solo}} - \text{Dist}_{\text{pooled}})$.
4. Avoided Carbon: $\Delta \text{CO}_2 = \Delta K \times \text{Emission Factor}$.
We use official Central Electricity Authority (CEA) and Ministry of Road Transport baselines: $0.155\text{ kg CO}_2\text{e/km}$ for internal combustion petrol vehicles and $0.048\text{ kg CO}_2\text{e/km}$ for campus electric vehicles (EVs).

---

### Category 3: Sustainable Computing & Energy Modeling (Module C)

#### Q7: Why is your server power model non-linear, and what is the formula?
**Answer**:
Modern CMOS processors do not scale power linearly with utilization. At idle, dynamic leakage current and standby voltages draw base baseline power ($P_{\text{idle}}$). Under load, dynamic power scales with voltage squared and frequency ($P \propto V^2 f$).
We model this via the standard non-linear power function:
$$P(U) = P_{\text{idle}} + (P_{\text{max}} - P_{\text{idle}}) \times \left(\frac{U}{100}\right)^\gamma$$
Where:
- For standard CPU compute nodes (Intel Xeon): $P_{\text{idle}} = 95\text{ W}$, $P_{\text{max}} = 340\text{ W}$, $\gamma = 1.25$.
- For GPU compute nodes (NVIDIA Tensor Core): $P_{\text{idle}} = 145\text{ W}$, $P_{\text{max}} = 680\text{ W}$, $\gamma = 1.35$.
This accurately models that running two servers at $40\%$ load consumes less total power than running one server at $95\%$ load and one at idle.

#### Q8: What is Power Usage Effectiveness (PUE) and how does it drive your eco-optimization calculation?
**Answer**:
PUE is the industry-standard data center efficiency metric defined as:
$$\text{PUE} = \frac{\text{Total Facility Energy}}{\text{IT Equipment Energy}}$$
In our baseline legacy campus server room, chiller cooling, transformers, and unoptimized UPS units yield $\text{PUE} = 1.75$ (meaning for every 100 W of compute, 75 W is lost to cooling and overhead).
In our eco-optimized scenario, we model free-air cooling, hot-aisle containment, and dynamic core idling, reducing $\text{PUE}$ to $1.20$.
Combined with dynamic server consolidation, this yields a mathematically verified $-45.9\%$ reduction in total facility kWh and carbon emissions.

#### Q9: How does the diurnal grid carbon curve model real-world emissions?
**Answer**:
Grid carbon intensity is not static; it changes hourly depending on regional generation sources:
- 10:00 to 15:00: Solar photovoltaic generation peaks, displacing coal, lowering regional carbon intensity to $190\text{ g CO}_2\text{e/kWh}$.
- 18:00 to 22:00: Solar output drops to zero while residential campus demand surges; thermal coal and gas peaker plants ramp up, driving carbon intensity to $680\text{ g CO}_2\text{e/kWh}$.
- By tracking this curve, UniVerse enables carbon-aware workload scheduling, recommending that heavy batch jobs (such as ML model retraining) execute during peak solar hours.

---

### Category 4: Privacy Engineering & Differential Privacy (Module D)

#### Q10: How does your Differential Privacy mechanism work in Module D?
**Answer**:
When departmental administrators query average student focus minutes:
1. **$k$-Anonymity Suppression**: If fewer than 3 students participated in that department ($n < 3$), the system suppresses the query with an explicit reason code to prevent deanonymization of small groups.
2. **Bounded Sensitivity**: Individual daily focus minutes are strictly bounded in $[0, 480\text{ mins}]$. The global sensitivity of the sample mean is:
   $$\Delta f = \frac{\text{Max} - \text{Min}}{n} = \frac{480}{n}$$
3. **Calibrated Laplace Noise**: We choose a standard privacy budget of $\epsilon = 0.8$. The Laplace noise scale parameter is $b = \frac{\Delta f}{\epsilon} = \frac{480}{0.8 \cdot n}$.
4. **Noise Generation via Inverse CDF**:
   $$\text{Lap}(b) = -b \cdot \text{sgn}(u) \cdot \ln(1 - 2|u|), \quad u \in (-0.5, 0.5)$$
5. The reported mean is $\tilde{\mu} = \max(0, \mu_{\text{raw}} + \text{Lap}(b))$. This guarantees $\epsilon$-differential privacy, mathematically proving that an adversary cannot determine whether any specific student was included in the dataset.

#### Q11: How do you enforce Zero-Telemetry URL sanitization?
**Answer**:
When tracking browsing activity for focus classification:
1. The URL is processed on the client before network transmission.
2. The sanitizer instantiates the browser's native `URL` parser.
3. It extracts only `parsed.hostname` (e.g. `leetcode.com`), converts it to lowercase, and strips `www.` prefixes.
4. It completely discards the pathname, query parameters (`?user=123&token=abc`), URL fragments (`#solution`), and any embedded HTTP basic auth credentials.
5. Even if an untrusted network proxy inspects the payload, no personal search terms, private repository names, or authentication tokens are ever stored or transmitted.

#### Q12: How is the GDPR "Right to Erasure" implemented?
**Answer**:
Under `DELETE /api/wellbeing/history/:userId`:
1. The server executes a database transaction that targets `focus_sessions` and `browsing_events` associated with that user ID.
2. Foreign key cascade deletion (`ON DELETE CASCADE`) ensures that domain classifications, session intervals, and raw timestamps are permanently deleted.
3. This is an irreversible, hard database deletion—not a soft-delete or decorative flag.

---

### Category 5: Responsible AI & Examination Monitoring (Module E)

#### Q13: What is the core ethical principle of your examination monitoring module?
**Answer**:
The core invariant is **Zero Automated Penalties**.
Computer vision models operating on webcams or video feeds are subject to false positives caused by natural human behavior, poor room lighting, physical disabilities, or looking down at rough paper.
Therefore:
1. The system treats head turns or restricted zone entries purely as **observable cues**, never as evidence of academic dishonesty.
2. Ingestion produces status `PENDING_REVIEW` only. The system cannot auto-submit, deduct marks, or disqualify a student.
3. Disciplinary authority belongs exclusively to a certified human proctor who must inspect the context, enter written justification, and choose an appropriate resolution.

#### Q14: How does the Immutable Proctor Audit Trail work?
**Answer**:
When a proctor reviews an event via `PATCH /api/exams/events/:eventId/review`:
1. The backend verifies that `action`, `proctorNotes`, and `reviewerId` are non-empty. Requests with empty notes are rejected with HTTP 400.
2. The observation event status is updated to `DISMISS_FALSE_POSITIVE`, `DISMISS_BENIGN_BEHAVIOR`, or `ESCALATE_TO_INVIGILATOR`.
3. An immutable entry is written to `exam_audit_log`:
   - Unique audit ID
   - Event ID & Exam Session ID
   - Proctor ID & UTC Timestamp
   - Prior status & New status
   - Action code & Mandatory written notes
This log table has no `UPDATE` or `DELETE` API endpoints, providing an unalterable audit trail for institutional compliance and student appeals.

#### Q15: How does your Live Webcam Mode prevent video exfiltration?
**Answer**:
In Mode B (Live Camera PoC):
1. The browser requests explicit webcam permission using `navigator.mediaDevices.getUserMedia`.
2. The video stream is piped directly into a hidden HTML5 `<video>` element.
3. A client-side canvas context inspects the video frames entirely in local browser RAM to draw workstation bounding boxes and track spatial coordinates.
4. No video buffers, image blobs, or frame snapshots are transmitted across the network to the Express server or any third-party cloud. The network payload contains only high-level metadata (event type, confidence score, and timestamp).

---

### Category 6: Testing, Security & Verification

#### Q16: How did you test your system against adversarial security threats?
**Answer**:
We implemented dedicated adversarial test suites (`tests/adversarial/`):
1. **SQL Injection**: We attacked course search, mentor filters, and resource queries with strings like `' OR '1'='1' --` and `'; DROP TABLE users; --`. Parameterized queries in `better-sqlite3` completely neutralized these attempts without escaping failures.
2. **Input Boundary Stress**: Tested negative seat counts, detour limits exceeding 1.0, out-of-bounds ratings (e.g. rating 0 or 6), and malformed timestamps. All are rejected with HTTP 400.
3. **Self-Mentorship & Business Invariants**: Verified that senior mentors cannot submit mentorship requests to themselves.
4. **State Machine Invariants**: Verified that proctor review decisions cannot be submitted without audit notes, and that suppressed cohorts cannot leak raw mathematical means.

#### Q17: What is the total test coverage across your test harness?
**Answer**:
The test suite consists of **190 tests across 12 test suites**, executing in **~1.7 seconds**:
- `tests/unit/graph_matching.test.ts` (13 tests)
- `tests/unit/energy_carbon.test.ts` (9 tests)
- `tests/unit/privacy_dp.test.ts` (10 tests)
- `tests/unit/auth.test.ts` (12 tests)
- `tests/e2e/tier1_features.test.ts` (33 tests)
- `tests/e2e/tier2_boundaries.test.ts` (18 tests)
- `tests/e2e/tier3_pairwise.test.ts` (8 tests)
- `tests/e2e/tier4_scenarios.test.ts` (4 tests)
- `tests/adversarial/m1_stress_challenge.test.ts` (21 tests)
- `tests/adversarial/m2_stress_challenge.test.ts` (28 tests)
- `tests/adversarial/m2_ride_ui_stress.test.ts` (14 tests)
- `tests/integration/full_ecosystem.test.ts` (20 tests)
**Overall Pass Rate**: 100% (190 / 190 passed).

---

## Part 5: Summary Checklist for Presentation Day

1. **Clean Installation**:
   `npm install && cd client && npm install && cd ..`
2. **Automated Verification**:
   `npm test` (Runs 190 tests in under 2 seconds).
3. **Database Population**:
   `npm run seed` (Generates realistic campus graph, students, mentors, rides, and logs).
4. **Application Launch**:
   `npm run dev` (Runs backend on `:3001` and React client on `:5173`).
5. **Demonstration URL**:
   Open `http://localhost:5173` to walk through the 8-step evaluator script.
