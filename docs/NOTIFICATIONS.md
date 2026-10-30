# UniVerse Notification Engine & Cross-Module Event Bus

## 1. Overview & Channels

UniVerse features a unified, relational notification engine connecting all 5 core modules:
- Module A: Academic Placement & Mentorship
- Module B: Smart Campus Ride-Pooling
- Module C: Sustainable Computing Observatory
- Module D: Privacy-Aware Digital Wellbeing
- Module E: Responsible Examination Tribunal
- Operational: Warden Facilities Triage & System Administration

Notifications alert users to critical operational events, state transitions, and audit milestones.

---

## 2. Relational Schema & Constraints

Notifications are persisted within `server/data/universe.db` with strict module and type categorization:

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  module TEXT NOT NULL CHECK(module IN ('hub', 'rides', 'sustainability', 'wellbeing', 'exams', 'system')),
  type TEXT NOT NULL CHECK(type IN ('info', 'success', 'warning', 'alert', 'academic', 'mobility')),
  is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0, 1)),
  link_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_module ON notifications(module);
```

---

## 3. Automated Event Dispatchers

| Trigger Event | Target Persona | Module | Notification Payload |
|---|---|---|---|
| **Ride Booking Confirmed** | Commuter & Driver | `rides` | "Seat Confirmed: North Dorms ➔ Academic Quad. Driver: Vikram Rao. Avoided 0.34 kg CO₂e." |
| **Driver Starts Trip** | Confirmed Commuters | `rides` | "Transit Update: Your ride is now IN PROGRESS. Boarding at Gate North." |
| **Mentorship Request Accepted** | Junior Scholar | `hub` | "Mentorship Accepted: Diya Patel has accepted your mentorship inquiry. Click to open private chat." |
| **Facility Defect Reported** | Residential Warden | `system` | "New Facility Defect: AC cooling failure in Turing Lab (HIGH urgency)." |
| **Defect Resolved** | Student Reporter | `system` | "Facility Defect Resolved: Fan assembly replaced. Temperature restored." |
| **Proctor Review Assigned** | Exam Proctor | `exams` | "Session Assigned: CS401 Operating Systems Final Examination review queue ready." |
| **Differential Privacy Purge** | Student User | `wellbeing` | "GDPR Privacy Right-to-Erasure: Focus logs permanently redacted." |
