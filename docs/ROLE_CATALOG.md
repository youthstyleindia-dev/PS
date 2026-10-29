# UniVerse: Canonical Role Catalog & Identity Taxonomy
**Document Version**: 2.0.0  
**Status**: Canonical Standard  
**Scope**: All Services, Routing, Middlewares, Database Schemas, and User Interfaces

---

## 1. Canonical Role Registry

The following six roles constitute the **complete, immutable, and canonical role registry** for the UniVerse Campus Operating Ecosystem. No other role keys are permitted.

```typescript
export type CanonicalRole = 
  | 'student'          // Collegiate Scholar & Academic Learner
  | 'driver'           // Campus Transit Partner & Route Operator
  | 'proctor'          // Examination Reviewer & Integrity Ombudsman
  | 'ta_faculty'       // Teaching Assistant, Faculty Member & Mentor
  | 'warden'           // Residential Warden & Campus Operations Staff
  | 'admin';           // System Administrator & Enclave Operator
```

---

## 2. Role Profiles & Operational Boundaries

### 2.1 `student` (Student / Scholar)
- **Description**: Standard undergraduate and postgraduate students enrolled at the university.
- **Allowed Capabilities**:
  - View and edit own student profile, skills, placement milestones, and resume URL.
  - Discover peer mentors, submit mentorship requests, and track request status.
  - Search approved academic resources, download study materials, and submit 1-5 star ratings.
  - Search available carpool routes, create passenger ride requests, and view/cancel own bookings.
  - Start, pause, resume, and terminate personal focus sessions; inspect own focus analytics.
  - Purge own wellbeing and browsing history via 1-click GDPR/DPDP Right to Erasure.
- **Strict Prohibitions**:
  - Cannot publish driver route offers or modify vehicle capacity unless separately assigned the `driver` role.
  - Cannot access examination observation queues, view student exam video telemetry, or access proctor audit logs.
  - Cannot view another student's private profile, focus session records, or mentorship applications.
  - Cannot access system configuration, database health diagnostics, or user role management.

### 2.2 `driver` (Transit Driver / Commuter Partner)
- **Description**: Authorized campus drivers (students, staff, or shuttle operators) offering verified micro-transit rides across the 10-node campus graph.
- **Allowed Capabilities**:
  - Maintain driver vehicle profile, license verification status, and seat capacity.
  - Publish driver ride offers with departure time, origin node, destination node, and max detour ratio.
  - View passenger ride requests matched to their route itinerary with minimum required passenger details.
  - Accept or decline incoming passenger booking requests; update ride lifecycle status (`SCHEDULED` $\to$ `ACTIVE` $\to$ `COMPLETED` $\to$ `CANCELLED`).
  - View personal trip history and accumulated carbon offset metrics.
- **Strict Prohibitions**:
  - Cannot access academic skill trees, placement readiness checklists, or mentor applications.
  - Cannot inspect private student wellbeing telemetry or focus sessions.
  - Cannot access examination review tribunals or audit logs.
  - Cannot view or modify rides owned by other drivers.
  - Cannot access the administrative user/role management console.

### 2.3 `proctor` (Exam Proctor / Reviewer)
- **Description**: Faculty invigilators and integrity ombudsmen authorized to review automated observation events during active examination sessions.
- **Allowed Capabilities**:
  - View assigned examination sessions and anonymized student rosters.
  - Inspect flagged observation event cues (`HEAD_POSE_DEVIATION`, `RESTRICTED_ZONE_INCURSION`, `MULTIPLE_OCCUPANTS_DETECTED`, `BROWSER_TAB_BLUR`, `FULLSCREEN_DEPARTURE`).
  - Review contextual frame snapshots and timestamp offsets within the examination review queue.
  - Submit mandatory written audit rationales and formal review determinations (`DISMISS_FALSE_POSITIVE`, `DISMISS_BENIGN_BEHAVIOR`, `ESCALATE_TO_INVIGILATOR`).
  - Inspect immutable proctor audit logs for assigned examination sessions.
- **Strict Prohibitions**:
  - **Zero Automated Discipline**: Cannot impose automated punitive sanctions, cancel examinations, or assign disciplinary flags without human tribunal consensus.
  - Cannot view private student wellbeing, browsing history, or placement tasks.
  - Cannot access campus transit driver management or carpool dispatch controls.
  - Cannot modify system configuration, alter database schemas, or assign roles.

### 2.4 `ta_faculty` (Teaching Assistant / Faculty / Academic Mentor)
- **Description**: Teaching assistants, professors, and peer mentors providing academic guidance and course support.
- **Allowed Capabilities**:
  - Maintain public mentor profile with expertise tags, department affiliation, and available consultation slots.
  - Review and accept/reject incoming student mentorship requests; provide session feedback.
  - Author and publish approved academic resources (lecture notes, exam solutions, lab guides).
  - Inspect anonymized course-level aggregate metrics.
- **Strict Prohibitions**:
  - Cannot view private student wellbeing focus logs or unconsented student data.
  - Cannot access unassigned examination sessions or bypass proctor assignment scope.
  - Cannot access driver route administration or global administrative controls.

### 2.5 `warden` (Warden / Campus Operations Staff)
- **Description**: Residential hall wardens and facilities operations staff monitoring physical campus health and logistics.
- **Allowed Capabilities**:
  - View real-time campus mobility dispatch status, route congestion alerts, and building node states.
  - Inspect facility energy telemetry, solar feed-in metrics, and grid carbon intensity curves.
  - Monitor campus announcements and issue urgent facility/weather advisories.
- **Strict Prohibitions**:
  - Cannot access confidential student grades, placement goals, or resume files.
  - Cannot access private student focus sessions or browsing history.
  - Cannot access examination observation packets or proctor determinations.
  - Cannot grant or revoke system administrator roles.

### 2.6 `admin` (System Administrator / IT Operations)
- **Description**: Authorized IT staff responsible for campus enclave security, database health, and infrastructure.
- **Allowed Capabilities**:
  - View system overview, service status, and API health across all 5 modules.
  - Inspect user accounts, manage role assignments, and issue single-use role invitations.
  - View security audit logs (login attempts, privilege changes, role delegations).
  - Adjust global compute sustainability simulation parameters and PUE optimization benchmarks.
  - Execute database health diagnostics and schema migration verifications.
- **Strict Prohibitions**:
  - Cannot view plain-text user passwords or decrypt private session keys.
  - Cannot inspect private student wellbeing focus logs without a legally audited court/tribunal warrant.
  - Cannot silently modify immutable examination audit records.

---

## 3. Legacy Label Mapping & Disambiguation Table

| Discovered String | Classification | Canonical Target | Action & Resolution Rule |
| :--- | :--- | :--- | :--- |
| `student` | Canonical Role | `student` | Retained as primary student role. |
| `driver` | Canonical Role | `driver` | Retained as primary transit driver role. |
| `proctor` | Canonical Role | `proctor` | Retained as primary exam proctor role. |
| `admin` | Canonical Role | `admin` | Retained as primary administrator role. |
| `transit driver` | Legacy Alias | `driver` | Normalized to `driver`. |
| `exam proctor` | Legacy Alias | `proctor` | Normalized to `proctor`. |
| `system admin` | Legacy Alias | `admin` | Normalized to `admin`. |
| `reviewer` | Functional Attribute | `proctor` | Attribute of `proctor`; mapped to `reviewer_id` in examination tables. |
| `faculty` | Legacy Alias | `ta_faculty` | Normalized to `ta_faculty`. For existing demo accounts (Dr. Meenakshi Sundaram), grants both `ta_faculty` and `proctor` role assignments. |
| `ta` | Legacy Alias | `ta_faculty` | Normalized to `ta_faculty`. |
| `warden` | Canonical Role | `warden` | Initialized as canonical campus operations role. |
| `campus staff` | Legacy Alias | `warden` | Normalized to `warden`. |
| `tax` | **Flagged Non-Role** | **REJECTED** | **Not a user role.** Proven to be economic principle tag `"ECOSYSTEM: ZERO_COMMERCIAL_TAX"` in `AboutPrinciplesPage.tsx`. Any authentication attempt with role `tax` must return `400 BAD_REQUEST: INVALID_ROLE`. |

---

## 4. Multi-Role Account Support Policy

1. **Identity Authority Principle**: Each person possesses **one identity** in the `users` table with a unique, normalized email address.
2. **Explicit Role Assignment**: Privileges are held in `role_assignments` where `(user_id, role_key)` is unique for active grants.
3. **Dedicated Workspace Switching**: When a user possesses multiple roles (e.g. `student` and `driver`), the frontend presents an explicit **"Switch Workspace"** control listing only the roles explicitly granted to that user. Switching workspace resets the navigation, routes, and active token context to that role's scope.
4. **Server Authorization Primacy**: Regardless of what workspace the frontend claims to be displaying, the server evaluates permissions against the active bearer token and verifies the user's role assignment on every request.
