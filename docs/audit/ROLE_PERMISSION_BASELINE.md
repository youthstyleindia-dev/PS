# UniVerse Campus OS — Role & Permission Baseline

**Audited:** 2026-10-30  
**Authority:** Multi-Role Server RBAC Registry (`server/src/authorization/`)

---

## 1. Supported Canonical Roles

UniVerse enforces strict role authorization driven by server-side verification. The active role must be verified by the backend for every request.

| Canonical Role | System Identifier | Approved Workspace | Multi-Role Capable | Default Landing |
|---|---|---|---|---|
| **Student** | `student` | Student Scholar Hub | Yes | `/app` |
| **Senior Mentor** | `senior_mentor` / `student` | Senior Mentor Portal | Yes (Extends Student) | `/app` (with Mentor tab) |
| **TA / Faculty** | `ta_faculty` / `faculty` / `ta` | Academic Faculty & TA Enclave | Yes | `/app` |
| **Warden** | `warden` / `campus_staff` | Residential Operations & Safety | Yes | `/app` |
| **Transit Driver** | `driver` / `transit_driver` | Transit Dispatch & Route Controls | Yes | `/app` |
| **Exam Proctor** | `proctor` / `exam_proctor` | Responsible Exam Review Tribunal | Yes | `/app` |
| **System Admin** | `admin` / `system_admin` | Central Administration & Audit | Yes | `/app` |

---

## 2. Cross-Role Isolation & Invariants

1. **Student Isolation:**
   - A student can only view, edit, or delete their own placement milestones, focus sessions, and ride requests.
   - A student cannot access the exam review tribunal (`/exams`), the driver trip dispatch (`/driver/trips`), the facility maintenance queue of unassigned hostels (`/facilities`), or the admin enclave (`/admin`).

2. **Mentor Boundary:**
   - A mentor account extends a student account. Mentors can view incoming mentorship requests directed to them and engage in 1-on-1 conversations only after accepting a request.
   - Mentors do not possess administrative permissions, nor can they view private student academic transcripts or browsing histories.

3. **Driver Boundary:**
   - A driver can publish ride offers, inspect bookings made against their vehicle, and update transit states (start, pickup, drop-off, complete).
   - Drivers cannot inspect student grades, mentorship conversations, or exam incident queues.

4. **Proctor Non-Punitive Boundary:**
   - A proctor reviews observation flags (e.g. head pose deviation, gaze away, unauthorized person) for assigned exams.
   - Observations are strictly non-punitive evidence tokens requiring human adjudication; AI detections never directly penalize a student.
   - Proctors cannot access unrelated student wellbeing data or driver route histories.

5. **Warden Scope:**
   - Wardens inspect facility defects and safety advisories for campus residential blocks.
   - Wardens cannot view private browsing events or unassigned examination sessions.

6. **System Admin Accountability:**
   - Admin operations (role assignment, revocation, account suspension, moderation) are logged to `auth_audit_log` with actor IP, timestamp, and justification.
   - Administrators cannot bypass end-to-end encryption or silently view private wellbeing focus data.

---

## 3. Server Permission Matrix (Code Level)

```typescript
ROLE_PERMISSIONS: Record<CanonicalRole, Permission[]> = {
  student: [
    'identity.profile.read_own',
    'identity.profile.update_own',
    'academic.profile.read_own',
    'academic.milestones.manage_own',
    'academic.mentors.search',
    'academic.mentorship.request_create',
    'academic.mentorship.manage_own',
    'academic.resources.read',
    'academic.resources.rate',
    'mobility.rides.search',
    'mobility.requests.create',
    'mobility.requests.manage_own',
    'mobility.bookings.create',
    'mobility.bookings.cancel_own',
    'wellbeing.sessions.manage_own',
    'wellbeing.rules.manage_own',
    'wellbeing.data.inspect_own',
    'wellbeing.data.delete_own',
    'wellbeing.cohort.read_anonymized'
  ],
  driver: [
    'identity.profile.read_own',
    'mobility.rides.search',
    'mobility.rides.create_as_driver',
    'mobility.rides.manage_own',
    'mobility.bookings.review_as_driver',
    'mobility.graph.read',
    'sustainability.metrics.read'
  ],
  proctor: [
    'identity.profile.read_own',
    'exam.sessions.read_assigned',
    'exam.observations.read_assigned',
    'exam.observations.review_assigned',
    'exam.audit.read_assigned'
  ],
  ta_faculty: [
    'identity.profile.read_own',
    'academic.mentors.search',
    'academic.resources.read',
    'academic.resources.publish',
    'sustainability.metrics.read',
    'sustainability.simulation.view'
  ],
  warden: [
    'identity.profile.read_own',
    'warden.transit.overview',
    'warden.facilities.read',
    'warden.advisories.publish'
  ],
  admin: [
    // Complete administrative supervision minus private data exposure
    'admin.users.read',
    'admin.users.manage',
    'admin.roles.assign',
    'admin.roles.revoke',
    'admin.system.diagnostics',
    'admin.demo.reset',
    'security.audit.read'
  ]
}
```
