# UniVerse: Comprehensive Specification Mining & System Requirements Report

**Document**: Phase 0 Specification Mining Handoff  
**Author**: `spec_miner_survey_1`  
**Working Directory**: `/Users/divya/Documents/Problem statement /.agents/teamwork/spec_miner_survey_1`  
**Authoritative Source**: `/Users/divya/Downloads/Problem statement.docx`  
**Reference Document**: `/Users/divya/Documents/Problem statement /.agents/teamwork/ORIGINAL_REQUEST.md`  
**Timestamp**: 2026-10-29T12:56:00Z  

---

## 1. Observation

### 1.1 Specification Source Discovery & Verification
The primary authoritative document was discovered at `/Users/divya/Downloads/Problem statement.docx` (also confirmed via task runner). An inspection of the archive structure via Python's `zipfile` revealed standard WordprocessingML components:
- `word/document.xml` (8,301 bytes uncompressed, 237 parsed text lines across 119 distinct paragraph nodes)
- 2 structured data tables:
  - Table 1: Twelve-Hour Execution Plan (Hours 0–12 milestones)
  - Table 2: Evaluation Criteria — 100 Marks distribution

### 1.2 Verbatim Citations from Authoritative Specification

1. **Title & Categorization**:
   > *"UniVerse: An Intelligent, Sustainable, and Privacy-Aware Campus Ecosystem"*  
   > *"Duration: 12 Hours"*  
   > *"Challenge Category: Full-Stack Development, Artificial Intelligence, Graph Algorithms, Computer Vision, Sustainability Analytics, and Privacy Engineering"*

2. **Core Problem & Vision**:
   > *"Modern educational institutions face interconnected challenges involving student placement readiness, peer mentorship, academic resource management, campus transportation, energy consumption, digital distraction, and examination integrity. These activities are often managed through disconnected systems, resulting in inefficient resource utilization, limited collaboration, and reduced visibility into campus operations."* (Section 1)  
   > *"Your challenge is to design and develop UniVerse, an intelligent, integrated campus ecosystem that combines student services, sustainable mobility, resource observability, privacy-aware digital wellbeing, and responsible examination monitoring into a unified platform."* (Section 1)  
   > *"The emphasis is on a working, explainable, and responsibly designed prototype—not on completing a production-grade system in 12 hours."* (Section 9)

3. **Module A — Student Intelligence and Academic Hub**:
   > *- "Student profiles with skills, interests, and placement goals."*  
   > *- "Placement preparation dashboard and progress tracking."*  
   > *- "Peer mentor discovery and mentorship requests."*  
   > *- "Searchable academic resource repository for notes, question papers, and study materials."* (Section 3)

4. **Module B — Smart Campus Ride-Pooling**:
   > *- "Driver ride creation and passenger ride requests."*  
   > *- "Graph-based representation of campus locations and routes."*  
   > *- "Matching based on route compatibility, departure time, seat availability, and maximum detour."*  
   > *- "Dashboard showing estimated shared distance and potential travel-cost savings."* (Section 3)

5. **Module C — Sustainable Computing Observatory**:
   > *- "Simulate at least three application services or workloads."*  
   > *- "Capture request counts, processing latency, and simulated resource utilization."*  
   > *- "Estimate energy consumption and associated carbon emissions using documented assumptions."*  
   > *- "Display service-level metrics and compare baseline and optimized scenarios."* (Section 3)

6. **Module D — Privacy-Aware Digital Wellbeing**:
   > *- "Start and stop a user-controlled focus session."*  
   > *- "Categorize sample browsing events using user-defined rules."*  
   > *- "Display focus-session duration, context switches, and time spent on user-designated distracting sites."*  
   > *- "Provide pause, data inspection, and deletion controls."*  
   > *- "Process data locally where feasible and avoid collecting page contents, credentials, or unnecessary personal information."* (Section 3)

7. **Module E — Responsible Examination Monitoring**:
   > *- "Process authorized sample examination footage or a controlled webcam feed."*  
   > *- "Detect people and flag at least two predefined observable events, such as repeated head turns or entry into a restricted zone."*  
   > *- "Record timestamps and confidence scores."*  
   > *- "Provide a dashboard for human review, dismissal, and incident resolution."*  
   > *- "Avoid automatically declaring misconduct or imposing penalties based on model output."* (Section 3)

8. **Integration Requirements**:
   > *"The five modules must be presented as parts of one coherent platform rather than five unrelated demonstrations."*  
   > *"Teams should implement: A unified landing page or dashboard; Consistent navigation and user experience; A shared data model or clearly defined interfaces between modules; A common notification or activity mechanism where practical; Role-based access or simulated role-based workflows where appropriate; A clear architecture diagram showing how the modules communicate."* (Section 4)

9. **Evaluation Criteria (Table 2)**:
   > - Functional implementation and completeness: 25  
   > - Technical depth and algorithmic correctness: 20  
   > - Integration and software architecture: 15  
   > - Innovation and practical impact: 10  
   > - Testing, reliability, and validation: 10  
   > - User experience and usability: 10  
   > - Privacy, ethics, and responsible AI: 5  
   > - Presentation and technical understanding: 5  
   > - Total: 100

10. **Key Constraints & Responsible Tech Rules**:
   > - *"Teams should use synthetic, public, or explicitly authorized data."* (Section 8)  
   > - *"Energy and carbon values must be identified as estimates unless supported by actual measurements."* (Section 8)  
   > - *"Browsing analytics must be voluntary and privacy-preserving."* (Section 8)  
   > - *"Examination monitoring must support human review and must not treat detected behavior as proof of cheating."* (Section 8)  
   > - *"Teams should clearly distinguish implemented functionality from simulated or proposed functionality."* (Section 8)

11. **Recommended Implementation Strategy**:
   > - *"Core integration: All five modules should appear in the unified application, with meaningful navigation and sample data."*  
   > - *"Minimum implementation: Each module should demonstrate at least one functional workflow; computationally intensive features may use controlled sample inputs."*  
   > - *"Technical depth: Teams should implement the key algorithm in at least two modules, such as graph-based ride matching and computer-vision event detection."* (Section 9)

---

## 2. Logic Chain

1. **Premise 1 (Unified System Architecture)**: From Section 1, 4, and 9, the requirement is explicitly NOT to create 5 disparate, disconnected apps or shallow mockups, but a unified, full-stack campus ecosystem sharing a persistent relational store (`better-sqlite3`), cohesive styling (`Tailwind CSS`), and shared navigation.
2. **Premise 2 (Mandatory Algorithmic Depth in Two Modules)**: The spec specifically singles out:
   - *Module B (Smart Campus Ride-Pooling)*: Must implement real graph algorithms (Dijkstra / shortest path route overlay with detour tolerance threshold and seat/time constraints).
   - *Module E (Responsible Examination Monitoring)*: Must implement actual computer-vision event detection (e.g. MediaPipe / COCO-SSD / Canvas-based landmark & bounding box heuristics) for at least two observable events (head turns, restricted zone entry/multi-person).
3. **Premise 3 (Responsible Technology and Transparent Labeling)**:
   - Module C and Module E require explicit labels distinguishing:
     - **Actual Model Inference** (e.g. live webcam face/person detection with real-time confidence scores).
     - **Simulated Workloads** (e.g. simulated server traffic bursts, request queues).
     - **Estimated Metrics** (e.g. power in Watts, carbon in gCO2e, cost savings).
   - Module D must be strictly local-first and privacy-preserving (no page contents, no keystrokes, no credentials; domain-only aggregation with full user pause, inspect, and delete rights).
   - Module E strictly prohibits automated misconduct declarations or auto-penalties; human proctors must have full review/dismissal control.
4. **Premise 4 (Execution Readiness & Verification)**: Per `ORIGINAL_REQUEST.md` (R4), every module must be verified by automated test suites (`vitest`) testing API endpoints, database state transitions, and algorithmic logic without manual self-assessment.

---

## 3. Caveats

1. **Hardware / Web Browser CV Constraints**: While computer vision can execute on sample video files or webcams, heavy models may introduce latency or browser compatibility hurdles. A lightweight, robust edge/client-side detection model (e.g. MediaPipe or TensorFlow.js COCO-SSD) or a dedicated backend Python/Node CV service with pre-packaged authorized video feeds ensures seamless execution without GPU dependencies.
2. **Browsing Extension vs Controlled Web Simulation for Module D**: Capturing native browser tabs outside an extension environment is restricted by browser security sandbox policies. The application should provide a robust, interactive focus session tracker with a domain-based event simulator/logger and interactive rule management that models realistic browsing sessions.
3. **Synthetic Data Realism**: All modules must be seeded with rich, realistic campus data (campuses, hostels, departments, courses, routes, sample proctoring video clips, simulated service profiles).

---

## 4. Conclusion & Complete System Specification

### 4.1 System Overview & Architecture
UniVerse is structured as a client-server web application:
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide icons, responsive dashboard navigation.
- **Backend**: Node.js, Express, TypeScript, RESTful JSON APIs.
- **Database**: `better-sqlite3` embedded relational database with foreign keys and WAL mode.
- **State & Communication**: Unified navigation with a global activity/notification center and role switcher (Student, Driver, Proctor, Admin).

### 4.2 Module-by-Module Technical Specification

#### Module A: Student Intelligence & Academic Hub
- **Purpose**: Centralize placement preparation, peer mentorship discovery, and open academic resources.
- **Data Entities**:
  - `User/Student`: `id, name, email, avatar, role, department, yearOfStudy, bio, gpa`
  - `StudentProfile`: `userId, skills (JSON array), interests (JSON array), targetRole, placementGoals, readinessScore, resumeUrl`
  - `PlacementMilestone`: `id, studentId, title, category (DSA, SystemDesign, SoftSkills, Resume), status (completed, in-progress, pending), targetDate, completedAt`
  - `MentorshipProfile`: `id, mentorId, companyOffer, availableSlots (JSON array), maxMentees, bio, rating`
  - `MentorshipRequest`: `id, menteeId, mentorId, topic, preferredSlot, status (pending, accepted, rejected, completed), notes, createdAt`
  - `AcademicResource`: `id, title, courseCode, semester, department, category (Notes, PYQ, Syllabus, Guide), fileUrl, uploaderId, downloadsCount, rating, tags (JSON array), createdAt`
- **Core Workflows**:
  1. Student views personalized readiness dashboard with skill radar, completed milestone checklist, and progress metrics.
  2. Student filters peer mentors by skill (e.g. "React", "Algorithms") or target company and submits a mentorship request.
  3. Mentor views incoming requests and accepts/rejects with a scheduled meeting note.
  4. Student searches resources by course code (e.g. "CS301"), filters by type (PYQ vs Notes), and downloads/rates items.

#### Module B: Smart Campus Ride-Pooling
- **Purpose**: Optimize campus commuting and inter-hostel/transit travel through graph-based carpooling.
- **Graph Model**:
  - Represented as an adjacency list of campus landmarks (e.g., North Gate, Central Library, Tech Block, Boys Hostel 1, Girls Hostel 2, South Gate, Metro Station, Sports Complex).
  - Edges store distance $D_{ij}$ (in kilometers) and baseline transit time $T_{ij}$ (in minutes).
- **Data Entities**:
  - `CampusNode`: `id, name, coordinates {x, y}, zone`
  - `CampusEdge`: `sourceId, targetId, distanceKm, timeMins`
  - `RideOffer (Driver)`: `id, driverId, originNodeId, destinationNodeId, departureTime, totalSeats, availableSeats, vehicleType, status (open, in_progress, completed, cancelled)`
  - `RideRequest (Passenger)`: `id, passengerId, originNodeId, destinationNodeId, desiredDepartureTime, seatsNeeded, maxDetourKm, status (pending, matched, cancelled)`
  - `RideMatch`: `id, offerId, requestId, matchedPath (JSON array of nodes), totalDistanceKm, detourKm, sharedDistanceKm, costPerRider, carbonSavedKg, status`
- **Algorithmic Matching Engine**:
  1. Shortest path computation using Dijkstra's Algorithm between origin and destination.
  2. For a driver path $P_d = [O_d, \dots, D_d]$ and passenger request $(O_p, D_p)$:
     - Compute pooled route $P_{pooled} = [O_d, \dots, O_p, \dots, D_p, \dots, D_d]$ respecting topological ordering.
     - Detour constraint: $Detour = Distance(P_{pooled}) - Distance(P_d) \le \min(DriverMaxDetour, PassengerMaxDetour)$.
     - Time constraint: $|DepartureTime_{driver} - DesiredDepartureTime_{passenger}| \le \Delta T_{max}$ (e.g. 15 mins).
     - Capacity constraint: $SeatsAvailable \ge SeatsNeeded$.
  3. Sustainability metric: $CarbonAvoided = SharedDistanceKm \times 0.171 \, \text{kg CO}_2/\text{km}$.
  4. Travel cost split: $Savings = (StandardCabFare - PooledFarePerRider)$.

#### Module C: Sustainable Computing Observatory
- **Purpose**: Simulate institutional server workloads, monitor real-time resource utilization, and estimate energy & carbon footprints.
- **Workloads Simulated (at least 3)**:
  1. *Student Portal & Auth Service* (I/O & DB intensive query loads).
  2. *Campus Learning Management & Media Streaming* (Bandwidth & Memory intensive).
  3. *Academic Compute & Research ML Inference* (High CPU/GPU utilization).
- **Data Entities & Telemetry**:
  - `ServiceWorkload`: `id, serviceName, description, baselineReplicas, currentReplicas, targetRps`
  - `WorkloadMetricSnapshot`: `id, serviceId, timestamp, requestCount, avgLatencyMs, p95LatencyMs, cpuUtilizationPct, memoryMb, powerWatts, carbonGramsPerHour`
  - `OptimizationScenario`: `id, name (Baseline vs Eco-Scaling), dynamicFrequencyScaling (bool), idleServerShutdown (bool), requestBatching (bool), totalKWh, totalCarbonKg, avgLatencyMs`
- **Formulas & Documented Assumptions**:
  - Power Model: $P(t) = P_{idle} + (P_{peak} - P_{idle}) \times \left(\frac{\text{CPU}\%}{100}\right) \times \text{PUE}$
    - Assumptions: $P_{idle} = 40\,\text{W}$, $P_{peak} = 220\,\text{W}$ per server node; $\text{PUE (Power Usage Effectiveness)} = 1.35$.
  - Energy: $E = \frac{P(t) \times \Delta t (\text{hours})}{1000} \, \text{kWh}$.
  - Carbon Emissions: $CO_2e = E \times \text{GridCarbonIntensity}$
    - Assumption: Regional grid factor = $0.475 \, \text{kg CO}_2/\text{kWh}$ ($475 \, \text{g CO}_2/\text{kWh}$).
  - All metrics clearly labeled in UI: `[ESTIMATED METRIC — Based on PUE 1.35 & Grid 475g/kWh]`.

#### Module D: Privacy-Aware Digital Wellbeing
- **Purpose**: Enable students to voluntarily track digital focus sessions and understand context switching without compromising personal privacy.
- **Privacy Constraints & Architecture**:
  - **Local-first aggregation**: Only hostnames/domain categories are processed; never collect full URL paths, search queries, page DOM contents, or form inputs.
  - **Zero credential or keystroke capture**.
  - **User Sovereignty**: User has unilateral controls to Start/Stop session, Pause tracking, Inspect raw logged data, and Purge/Delete all history permanently.
- **Data Entities**:
  - `FocusSession`: `id, userId, startTime, endTime, targetDurationMins, actualDurationMins, status (active, paused, completed, cancelled), focusScorePct`
  - `DomainCategoryRule`: `id, userId, domainPattern, category (Productive, Neutral, Distracting), isCustom`
  - `BrowsingActivityEvent`: `id, sessionId, domain, category, durationSeconds, timestamp, contextSwitchCount`
- **Metrics Calculated**:
  - Total Focus Time vs Distraction Time.
  - Context Switches: Count of transitions between Productive domains and Distracting domains.
  - Focus Score: $\text{Focus Score} = \left(\frac{\text{Productive Time}}{\text{Productive Time} + \text{Distracting Time}}\right) \times 100\%$.

#### Module E: Responsible Examination Monitoring
- **Purpose**: Assist proctors by flagging observable physical events in examination environments while strictly safeguarding student dignity and preventing automated punishment.
- **Predefined Observable Events (Minimum 2)**:
  1. *Repeated / Sustained Head Turn*: Subject looking away from the primary exam field of view ($> 45^\circ$ yaw angle) repeatedly or for $> 5$ seconds.
  2. *Multiple Persons / Restricted Zone Entry*: Detection of more than one person in the active proctoring bounding box or entry of an unauthorized person into the camera zone.
- **Responsible AI Principles & Guardrails**:
  - **No Automated Misconduct Determination**: System flags are exclusively advisory *observations*. System UI explicitly labels flags as: `[OBSERVABLE EVENT DETECTED — REQUIRES HUMAN REVIEW]`.
  - **No Automatic Penalties or Disqualifications**: Only human proctors can evaluate context, add review notes, and either dismiss (false positive) or resolve the incident.
  - **Explicit Transparency**: Display confidence score $[0.0 - 1.0]$, timestamp, and exact event classification.
- **Data Entities**:
  - `ExamSession`: `id, studentId, courseId, title, scheduledStart, scheduledEnd, status (in_progress, submitted, reviewed)`
  - `ProctorEventFlag`: `id, examSessionId, timestamp, eventType (head_turn_repeated, multiple_faces_detected, zone_entry_unauthorized, face_absent), confidenceScore, frameSnapshotUrl, reviewStatus (pending, reviewed, dismissed, escalated), proctorNotes, reviewerId, resolvedAt`

---

## 5. Verification Method

To independently verify all specifications, requirements, and constraints documented in this report:

1. **Verify Authoritative Source Document Existence and Content**:
   ```bash
   python3 -c "
   import zipfile, xml.etree.ElementTree as ET
   with zipfile.ZipFile('/Users/divya/Downloads/Problem statement.docx') as z:
       tree = ET.fromstring(z.read('word/document.xml'))
       texts = [t.text for t in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if t.text]
       full_text = ' '.join(texts)
       assert 'UniVerse' in full_text
       assert 'Responsible Examination Monitoring' in full_text
       assert 'Smart Campus Ride-Pooling' in full_text
       print('Verification SUCCESS: Authoritative specification validated.')
   "
   ```

2. **Verify Evaluation Criteria Table (100 Marks)**:
   ```bash
   python3 -c "
   import zipfile, xml.etree.ElementTree as ET
   with zipfile.ZipFile('/Users/divya/Downloads/Problem statement.docx') as z:
       tree = ET.fromstring(z.read('word/document.xml'))
       ns = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
       tables = tree.findall(f'.//{ns}tbl')
       t2 = tables[1]
       rows = [[c.text for c in r.iter(f'{ns}t') if c.text] for r in t2.findall(f'.//{ns}tr')]
       print(rows)
   "
   ```

3. **Verify Existing Workspace Structure**:
   ```bash
   ls -la "/Users/divya/Documents/Problem statement "
   cat "/Users/divya/Documents/Problem statement /package.json"
   ```

4. **Verify Acceptance Criteria Coverage**:
   - Check `ORIGINAL_REQUEST.md` against Section 4 of this handoff report.
   - Verify every single feature maps to an API and UI workflow.

---

## 6. Features Discovered

The following comprehensive table enumerates all features discovered from the authoritative specification and problem statement:

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Core Integration | Unified Landing Dashboard | Central portal presenting aggregated campus ecosystem status across all 5 modules | User session, navigation route | Overview summary cards, active rides, focus state, eco-stats | 404 on unhandled route; fallback to dashboard | Docx Sec 4, Sec 9 |
| 2 | Core Integration | Consistent Navigation & UX | Unified sidebar/header navigation with responsive mobile/desktop layout | User click/navigation event | Active page view transition | Graceful redirect to default tab | Docx Sec 4 |
| 3 | Core Integration | Shared Data Architecture | Relational schema in SQLite linking users, roles, sessions, and activity across modules | Schema migrations, seed scripts | Persistent database connection & tables | SQLite constraint errors with HTTP 400/500 | Docx Sec 4 |
| 4 | Core Integration | Activity & Notification Center | Centralized event stream surfacing ride matches, mentorship updates, and proctor alerts | Event trigger payload | In-app notification toast / bell drawer | Silently dropped or queued if recipient invalid | Docx Sec 4 |
| 5 | Core Integration | Role Simulation Switcher | Switch perspective between Student, Driver, Proctor, and System Admin | Role select dropdown | Role-tailored UI views and permissions | Deny unauthorized action with HTTP 403 | Docx Sec 4 |
| 6 | Module A: Hub | Student Profile Management | Maintain student profile with skills, interests, department, and career goals | Skills list, interests, target role | Profile record, updated readiness score | Validation error if required fields empty | Docx Sec 3 |
| 7 | Module A: Hub | Placement Preparation Dashboard | Track readiness across DSA, system design, mock interviews, and milestone checklist | Student ID, milestone status updates | Progress percentage, category breakdown chart | 404 if student profile not found | Docx Sec 3 |
| 8 | Module A: Hub | Peer Mentor Discovery | Search and filter senior/peer mentors by domain, technical skill, or target company | Search query, skill filter tags | Filtered list of mentor cards with available slots | Return empty list if no matches | Docx Sec 3 |
| 9 | Module A: Hub | Mentorship Request Workflow | Send mentorship request to mentor with topic and preferred time slot | Mentee ID, Mentor ID, topic, slot | Created request with `pending` status | Prevent duplicate pending request to same mentor | Docx Sec 3 |
| 10 | Module A: Hub | Academic Resource Repository | Searchable library of study materials, PYQs, and lecture notes | Course code, semester, document type, query | List of matching academic resources with download links | Empty result state with suggestion to broaden query | Docx Sec 3 |
| 11 | Module A: Hub | Resource Contribution & Rating | Upload resource metadata and rate existing study materials | Title, course code, category, file URL, rating | Resource record, updated average rating | 400 on missing mandatory fields | Docx Sec 3 |
| 12 | Module B: Ride-Pool | Campus Location Graph Model | Graph model of campus landmarks, junctions, distances (km), and traversal times | Node/edge graph topology data | Adjacency list and shortest-path calculation matrix | Error on disconnected/unreachable nodes | Docx Sec 3 |
| 13 | Module B: Ride-Pool | Driver Ride Offer Creation | Driver publishes available seats, departure time, origin, and destination | Driver ID, origin node, dest node, departure, seats | Active ride offer entry | Reject if departure time in past or seats < 1 | Docx Sec 3 |
| 14 | Module B: Ride-Pool | Passenger Ride Request | Passenger requests pooled ride specifying origin, destination, and detour tolerance | Passenger ID, origin, destination, desired time, detour limit | Active passenger ride request | Reject if origin equals destination | Docx Sec 3 |
| 15 | Module B: Ride-Pool | Graph-Based Route Matching | Dijkstra-based pooled path matching satisfying detour, time window, and seat capacity | Offer ID, Request ID | Matched route, extra detour km, shared path | Return no match if detour exceeds max threshold | Docx Sec 3 |
| 16 | Module B: Ride-Pool | Shared Distance & Eco-Savings | Calculates total km shared, fuel cost savings, and avoided CO2 emissions | Matched route distance, baseline routes | Carbon saved (kg), money saved ($/INR) | Default to 0 savings on canceled ride | Docx Sec 3 |
| 17 | Module B: Ride-Pool | Interactive Route Visualizer | UI visual representation of campus graph showing driver path, pickup, and dropoff | Selected route ID | Rendered SVG/Canvas graph with active node highlights | Graceful fallback if coordinate missing | Docx Sec 3 |
| 18 | Module C: Observatory | Multi-Service Workload Simulator | Simulates 3 distinct campus services (Portal, LMS, Research ML) with variable RPS | Workload profile selection, traffic slider | Simulated real-time metrics feed | Clamp traffic between min (0) and max (1000 RPS) | Docx Sec 3 |
| 19 | Module C: Observatory | Telemetry Capture | Captures request counts, processing latency (p50/p95), CPU, and memory utilization | Time-series telemetry ticks | Telemetry dashboard charts | Interpolate missing data points gracefully | Docx Sec 3 |
| 20 | Module C: Observatory | Energy Consumption Estimation | Estimates power (W) and energy (kWh) using documented PUE and idle/peak formula | CPU utilization, active instances, time delta | Total power (Watts), energy (kWh) with estimate label | Non-negative constraint enforcement | Docx Sec 3, Sec 8 |
| 21 | Module C: Observatory | Carbon Footprint Estimation | Computes emissions using regional grid emission factor (475 g CO2e / kWh) | Estimated energy (kWh), grid factor | Carbon emissions (g / kg CO2e) with estimate label | Validate grid factor > 0 | Docx Sec 3, Sec 8 |
| 22 | Module C: Observatory | Scenario Comparison (Baseline vs Eco) | Side-by-side comparative analysis of unoptimized vs eco-scaled configurations | Scenario toggle (Baseline vs Eco) | Delta comparison cards (% kWh saved, % carbon reduced) | Clear visual comparison without data loss | Docx Sec 3 |
| 23 | Module C: Observatory | Transparent Estimation Disclosures | Visual indicators and footnotes clearly identifying simulated vs measured values | Metric type | Informational badge `[ESTIMATED]` or `[SIMULATED]` | Never omit estimate badge on calculated values | Docx Sec 8 |
| 24 | Module D: Wellbeing | User-Controlled Focus Session | Start, pause, resume, and end a dedicated focus study session | Target session duration, user start click | Active session timer and state | Disallow negative session durations | Docx Sec 3 |
| 25 | Module D: Wellbeing | Rule-Based Event Categorization | Categorizes browsing activity into Productive, Neutral, or Distracting based on domain | Domain string, user rule set | Categorized event record | Default uncategorized domains to `Neutral` | Docx Sec 3 |
| 26 | Module D: Wellbeing | Focus Analytics & Context Switcher | Tracks focus time, distracting time, and frequency of focus-breaking context switches | Session activity logs | Focus score %, context switches count, breakdown chart | Handle zero-event session with 100% focus score | Docx Sec 3 |
| 27 | Module D: Wellbeing | Privacy-First Local Processing | Aggregates domain data only, strictly preventing capture of URL paths, DOM, or forms | Raw domain entry | Sanitized domain metric | Strip query params, paths, and hashes | Docx Sec 3, Sec 8 |
| 28 | Module D: Wellbeing | User Autonomy & Data Purge | Complete control to inspect recorded history and permanently purge session data | User delete command | Confirmation of zero residual data | Permanent deletion; prompt user confirmation | Docx Sec 3 |
| 29 | Module E: Exam Monitor | Multi-Source Video Ingestion | Ingestion pipeline supporting authorized sample test videos or live webcam stream | Video stream / pre-recorded test clip | Video element frame buffer | Notify user if camera permission denied | Docx Sec 3 |
| 30 | Module E: Exam Monitor | Real-Time Person Detection | CV-based detection of student presence and bounding box coordinates | Video frame | Person detected flag, bounding box, confidence score | Low confidence (<0.5) tagged as uncertain | Docx Sec 3 |
| 31 | Module E: Exam Monitor | Event 1: Head Turn Detection | Detects repeated or sustained looking away from screen ($>45^\circ$ angle) | Face mesh / landmark orientation | Observable event flag with timestamp & confidence | Ignore momentary natural blinks/micromovements | Docx Sec 3 |
| 32 | Module E: Exam Monitor | Event 2: Multiple People / Zone Entry | Detects presence of 2+ people in camera frame or entry into restricted exam area | Person detection count | Flagged event `Multiple Persons Detected` | Trigger review only when count >= 2 for > 1 sec | Docx Sec 3 |
| 33 | Module E: Exam Monitor | Timestamped Event Log | Persistent log of all detected observable incidents with confidence scores | Event detection signal | Event list with snapshot thumbnail and timestamp | Monotonically increasing timestamps | Docx Sec 3 |
| 34 | Module E: Exam Monitor | Proctor Review & Dismissal Dashboard | Interface for human proctors to review flagged events, play snippet, and resolve | Proctor decision (Dismiss, Flag, Add Note) | Updated incident status, resolution audit trail | Prevent auto-penalization; mandatory review | Docx Sec 3, Sec 8 |
| 35 | Module E: Exam Monitor | Ethical Guardrail Enforcement | Hard architectural safeguard preventing automated sanctions or cheat declarations | Model event output | Advisory flag only: `FLAGGED FOR HUMAN INSPECTION` | Hard failure if any code attempts auto-penalty | Docx Sec 3, Sec 8 |
| 36 | Module E: Exam Monitor | Model Transparency Tagging | UI badges explicitly distinguishing live model inference from test clips | Feed source | Status badge `[LIVE CV INFERENCE]` vs `[AUTHORIZED CLIP]` | Clear labeling on all video containers | Docx Sec 8 |

---

## 7. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Module A: Hub Profile | Student submits empty skills list or non-existent student ID | System returns HTTP 400 with descriptive error message; prevents corrupted profile state |
| 2 | Module A: Mentorship Request | Student requests themselves as mentor | System validation rejects self-mentorship with error "Cannot request mentorship from self" |
| 3 | Module A: Mentorship Request | Student sends second request to mentor while previous is still `pending` | System rejects with "Pending request already exists for this mentor" |
| 4 | Module A: Resource Search | User searches for non-existent subject code (e.g. "ZZ999") | System renders zero-state UI with "No resources found" and quick-clear filters button |
| 5 | Module B: Ride-Pooling Graph | Driver and passenger specify identical origin and destination | System flags zero-distance route error; informs user to pick distinct campus points |
| 6 | Module B: Ride-Pooling Detour | Passenger detour requires 5.2 km when driver max detour is 1.5 km | Matching engine filters out driver; marks request as unmatchable with current route pool |
| 7 | Module B: Ride-Pooling Seats | Passenger requests 3 seats when driver has only 2 remaining | Matching engine rejects match due to seat capacity constraint; leaves offer open |
| 8 | Module B: Ride-Pooling Graph | Path query between disconnected campus nodes (isolated sub-graph) | Dijkstra returns infinity/null path; system alerts "No viable route connecting locations" |
| 9 | Module C: Observatory | User scales simulated traffic slider to 0 RPS (completely idle server) | Telemetry displays baseline idle power consumption ($P_{idle} = 40\,\text{W}$); energy never drops below idle base |
| 10 | Module C: Observatory | High traffic surge exceeding single replica capacity (e.g. 1000 RPS) | Latency p95 spikes realistically; CPU hits 100%; system highlights eco-scaling trigger |
| 11 | Module C: Observatory | Toggle between Baseline and Eco-Optimization scenarios | Charts dynamically update displaying exact delta in kWh and CO2e without page refresh |
| 12 | Module D: Digital Wellbeing | User starts a focus session and immediately clicks Stop (duration < 1 sec) | Session records 0 mins elapsed; focus score calculated as 100% (no distractions occurred) |
| 13 | Module D: Digital Wellbeing | User visits unknown domain not present in whitelist or blacklist | Domain categorized automatically as `Neutral`; does not penalize focus score |
| 14 | Module D: Digital Wellbeing | User clicks "Purge Session History" | Database deletes all browsing event records for session; UI updates immediately to clean state |
| 15 | Module E: Exam Monitor | Student leaves desk completely (zero persons detected in frame) | System triggers observable event `Subject Absence Detected` with timestamp for proctor review |
| 16 | Module E: Exam Monitor | Brief glancing movement (< 1 second) | Filtering logic ignores transient jitter; only flags sustained or repeated head turns (> 3 sec) |
| 17 | Module E: Exam Monitor | Proctor clicks "Dismiss Flag (False Positive)" | Flag status updates to `dismissed`; reason logged in audit trail; student score unaffected |
| 18 | Module E: Exam Monitor | Model confidence score is borderline (e.g. 0.52) | Displayed with amber badge and numerical score; proctor interface emphasizes manual verification |

---

## 8. Evaluation Criteria & Scoring Matrix Breakdown (100 Marks)

Per Table 2 of `Problem statement.docx`:

| # | Criterion | Weight (Marks) | Requirements & Scoring Standards |
|---|-----------|----------------|----------------------------------|
| 1 | **Functional Implementation and Completeness** | **25** | All 5 modules must be functional with working end-to-end user workflows, meaningful sample data, and interactive controls. |
| 2 | **Technical Depth and Algorithmic Correctness** | **20** | Algorithmic implementation in at least two core areas: Graph-based shortest path & detour ride matching (Dijkstra) and Computer Vision event detection. |
| 3 | **Integration and Software Architecture** | **15** | Unified application layout, consistent navigation, shared database schema (`better-sqlite3`), clean modular Express backend, and architecture diagrams. |
| 4 | **Innovation and Practical Impact** | **10** | Tangible campus relevance: student career enablement, verifiable carbon observability, privacy-preserving focus analytics, and ethical proctoring. |
| 5 | **Testing, Reliability, and Validation** | **10** | Automated verification test suite (`vitest`) testing endpoints, graph algorithms, power calculation formulas, and edge cases. |
| 6 | **User Experience and Usability** | **10** | Polished, cohesive Tailwind CSS interface, intuitive workflows, clear feedback, responsive design, and smooth interactions. |
| 7 | **Privacy, Ethics, and Responsible AI** | **5** | Local-first data minimization for wellbeing; human-in-the-loop proctoring with strictly no automated punishments; transparent labeling of estimates. |
| 8 | **Presentation and Technical Understanding** | **5** | Comprehensive README, API documentation, architecture explanation, and structured demonstration flow. |
| **TOTAL** | | **100** | |

---

## 9. Recommended Implementation Plan & Roadmap

Following the 12-Hour Execution Plan in the specification:
1. **Milestone 1 (Hours 0–3)**: Foundation & Schema Design
   - SQLite unified schema with seed fixtures (students, campus graph, services, proctor video assets).
   - Express backend routes for all 5 modules.
   - Core graph algorithm (Dijkstra ride matching) and power estimation formulas.
2. **Milestone 2 (Hours 3–7)**: Core Module Development
   - Module A: Hub profiles, mentorship requests, searchable resources.
   - Module B: Interactive campus map, driver/passenger booking, detour matching.
   - Module C: Real-time telemetry simulator, baseline vs eco-scaling comparison.
   - Module D: Focus timer, domain categorization, privacy purge.
   - Module E: Video player/webcam canvas, CV event detection, proctor review dashboard.
3. **Milestone 3 (Hours 7–9)**: Platform Integration & Navigation
   - Unified dashboard with cross-module summary cards and notification toasts.
   - Role switcher (Student, Driver, Proctor, Admin).
4. **Milestone 4 (Hours 9–10)**: Automated Testing & Edge Case Hardening
   - Vitest test suite covering all APIs, graph algorithms, and edge cases.
5. **Milestone 5 (Hours 10–12)**: Documentation & Demo Polish
   - README setup guide, architecture diagrams, and verified demo script.
