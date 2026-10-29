# UniVerse: Known Technical Limitations & Honest Boundary Disclosures

> **Standard of Truth**: In strict adherence to Non-Negotiable Rule 5 ("Distinguish actual inference, simulated event, estimated metric, sample data, and proposed future functionality"), this document provides transparent disclosure of all model assumptions, operational boundaries, and hackathon scope limits.

---

## 1. Module-by-Module Technical Disclosures

### Module A: Academic Hub & Placement Intelligence
- **Affinity Scoring**: Mentor matching utilizes a normalized skill-overlap and topic vector cosine similarity score. It is an algorithmic heuristic based on self-reported proficiencies—it is **not** an adaptive deep-learning recommendation engine.
- **Resource Downloads**: Syllabus and study resources are local SQLite-stored records with static sample links and verified PDF representations. They do not crawl live campus course portals or sync with Canvas/Blackboard LMS APIs.

### Module B: Smart Campus Ride-Pooling
- **Spatial Representation**: The campus graph represents a **schematic topological network** (10 nodes, 30 directed edges) rather than a dynamic OpenStreetMap road geometry layer with turn-by-turn GPS navigation.
- **Congestion Multiplier**: Peak traffic factors (1.65x for 08:30 morning peak, 1.45x for 17:30 evening rush) are modeled mathematically through sinusoidal time-decay functions rather than live municipal sensor feeds.
- **Detour Bounding Policy**: The algorithm enforces a strict $\le 35\%$ relative detour threshold. While sufficient for campus carpooling, it does not guarantee globally optimal fleet dispatch (NP-hard multi-vehicle dial-a-ride problem).

### Module C: Sustainable Computing Observatory
- **Simulation Environment**: UniVerse does **not** connect directly to physical Slurm clusters or data center hardware sensors. Workloads are realistically simulated based on standard server load profiles.
- **Carbon Grid Intensity**: The baseline emissions factor ($708.0\text{ gCO}_2/\text{kWh}$) represents an illustrative regional average from government emissions registries. In production, this would require integration with live regional marginal carbon APIs (such as WattTime or ElectricityMaps).
- **Power Model Exponent**: The non-linear power curve $P(U) = P_{\text{idle}} + (P_{\text{max}} - P_{\text{idle}})(U/100)^{1.25}$ is derived from SPECpower benchmark empirical literature. The exponent ($\alpha = 1.25$) is an empirical approximation that varies across specific CPU/GPU microarchitectures.

### Module D: Privacy-Aware Digital Wellbeing
- **Browser Event Scope**: In a standard web browser context, JavaScript cannot covertly inspect or log tabs outside its own origin without an installed WebExtension. Browsing logs are populated via voluntary self-import and demo fixtures.
- **Differential Privacy Budget**: The Laplace DP mechanism ($\epsilon = 0.8$, $\Delta f = 1.0$) protects aggregate cohort queries. However, full production DP requires advanced privacy budget composition tracking (Rényi Differential Privacy) over repeated interactive queries to prevent gradual privacy degradation.
- **Right to Erasure**: The "Purge Focus Data" control completely deletes the user's focus sessions and logs from the local SQLite database. It represents a functional local erasure, but does not constitute formal legal GDPR certification across distributed enterprise backups.

### Module E: Responsible Examination Review
- **Mode 1 vs Mode 2 Visual Observations**:
  - Mode 1 provides deterministic browser focus/blur and fullscreen departure logging via standard HTML5 DOM events.
  - Mode 2 provides local on-device canvas contour and bounding-box analysis. It is an opt-in demonstration of spatial zone incursion (`RESTRICTED_ZONE_INCURSION`) and scene density (`MULTIPLE_OCCUPANTS_DETECTED`).
- **Ethical Boundary**: The system explicitly **refuses** to perform facial recognition, emotion analysis, or biometric verification. Observations are non-accusatory flags that strictly require human-in-the-loop proctor adjudication before any decision is made.
- **Audit Log Immutability**: The `exam_audit_log` table is append-only with strict SQLite foreign keys and timestamps. While tamper-evident within the application runtime, it is stored in SQLite rather than a distributed cryptographically signed blockchain ledger.

---

## 2. Authentication, Authorization & Role Security Scope

- **Canonical Role Catalog Decisions**:
  - `tax`: Investigated and confirmed to be an ecosystem economic metric flag (`"ECOSYSTEM: ZERO_COMMERCIAL_TAX"`) located in `client/src/pages/AboutPrinciplesPage.tsx`. It is strictly not a user role; attempts to authenticate with `role: 'tax'` are rejected with HTTP 400.
  - `reviewer`: Not a separate role; it represents a functional attribute of an `exam_proctor` mapping to `reviewer_id` in examination tribunal tables.
  - `ta_faculty`: Formalized canonical combination of TA and Teaching Faculty permissions (`ta_faculty`). Proctors (e.g. Dr. Meenakshi Sundaram) hold dual clearance across both `proctor` and `ta_faculty`.
  - `warden`: Formalized canonical campus residential operations role (`warden`) with residence hall oversight and transit overview permissions.
- **Hackathon Demo Persona Switches vs Production Access**:
  - The authentication system utilizes production-grade 10-round salted Bcrypt password hashing, signed HMAC-SHA256 JWT tokens, and stateful session revocation in `auth_sessions`.
  - For evaluator convenience, six authenticated demo personas (`student`, `driver`, `proctor`, `ta_faculty`, `warden`, `admin`) are provided. In previous revisions, the UI permitted arbitrary persona switching across any role. In this rebuild, the quick persona switcher in the header is strictly restricted to roles explicitly assigned to that user in `role_assignments`.
  - For full institutional production deployment, integration with enterprise SAML 2.0 / Shibboleth Single Sign-On, hardware MFA keys (WebAuthn), and distributed Redis token revocation caches would be required.
- **SQLite Single-Process Concurrency**:
  - SQLite WAL mode enables concurrent readers alongside a serialized writer, ideal for single-node campus deployments. Horizontal multi-node clustering would require PostgreSQL with Row Level Security (RLS) policies matching our Express RBAC middleware.

---

## 3. Environment & Hardware Requirements

- **Local Operation**: 100% runnable offline without external internet access or third-party paid API keys.
- **Browser Compatibility**: Tested on modern Chromium, WebKit (Safari), and Gecko (Firefox) engines. WebCam consent requires an HTTPS or `localhost` context.
