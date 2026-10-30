# UniVerse: Role-to-Permission Matrix
**Specification Version**: 2.0.0  
**Enforcement Layer**: Server Authorization Middleware (`requirePermission`, `requireRole`)  

---

## 1. Granular Permission Catalog

```typescript
export type Permission =
  // Identity & Profile
  | 'identity.profile.read_own'
  | 'identity.profile.update_own'
  | 'identity.sessions.manage_own'
  // Academic & Hub
  | 'academic.profile.read_own'
  | 'academic.profile.update_own'
  | 'academic.milestones.manage_own'
  | 'academic.mentors.search'
  | 'academic.mentorship.request_create'
  | 'academic.mentorship.manage_own'
  | 'academic.mentorship.review_assigned'
  | 'academic.resources.read'
  | 'academic.resources.publish'
  | 'academic.resources.rate'
  // Campus Mobility & Transit
  | 'mobility.rides.search'
  | 'mobility.rides.create_as_driver'
  | 'mobility.rides.manage_own'
  | 'mobility.requests.create'
  | 'mobility.requests.manage_own'
  | 'mobility.bookings.create'
  | 'mobility.bookings.cancel_own'
  | 'mobility.bookings.review_as_driver'
  | 'mobility.graph.read'
  // Sustainability & Computing
  | 'sustainability.metrics.read'
  | 'sustainability.simulation.view'
  | 'sustainability.simulation.configure'
  | 'sustainability.workloads.scale'
  // Digital Wellbeing (Sovereign & Private)
  | 'wellbeing.sessions.manage_own'
  | 'wellbeing.rules.manage_own'
  | 'wellbeing.data.inspect_own'
  | 'wellbeing.data.delete_own'
  | 'wellbeing.cohort.read_anonymized'
  // Responsible Examination Review
  | 'exam.sessions.read_assigned'
  | 'exam.observations.read_assigned'
  | 'exam.observations.review_assigned'
  | 'exam.audit.read_assigned'
  // Campus Operations & Wardens
  | 'warden.transit.overview'
  | 'warden.facilities.read'
  | 'warden.advisories.publish'
  // System Administration
  | 'admin.users.read'
  | 'admin.users.manage'
  | 'admin.roles.assign'
  | 'admin.roles.revoke'
  | 'admin.system.diagnostics'
  | 'admin.demo.reset'
  // Security Audit
  | 'security.audit.read'
  // Campus Feed & Moderation
  | 'feed.posts.read'
  | 'feed.posts.create'
  | 'feed.posts.moderate'
  | 'feed.comments.create'
  // Senior Mentorship
  | 'mentorship.directory.search'
  | 'mentorship.request.create'
  | 'mentorship.request.review'
  | 'mentorship.messages.exchange'
  // Campus Copilot & Cloud AI
  | 'assistant.chat.access'
  | 'assistant.actions.execute'
  // Campus Operations & Events
  | 'campus.events.rsvp'
  | 'campus.communities.join'
  | 'campus.facilities.report'
  | 'campus.facilities.resolve';
```

---

## 2. Role-to-Permission Mapping Matrix

| Permission Identifier | `student` | `driver` | `proctor` | `ta_faculty` | `warden` | `admin` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`identity.profile.read_own`** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`identity.profile.update_own`** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`identity.sessions.manage_own`** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`academic.profile.read_own`** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ (Support) |
| **`academic.profile.update_own`** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`academic.milestones.manage_own`** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`academic.mentors.search`** | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **`academic.mentorship.request_create`** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`academic.mentorship.manage_own`** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`academic.mentorship.review_assigned`**| ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **`academic.resources.read`** | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **`academic.resources.publish`** | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **`academic.resources.rate`** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **`mobility.rides.search`** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **`mobility.rides.create_as_driver`** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **`mobility.rides.manage_own`** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **`mobility.requests.create`** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **`mobility.requests.manage_own`** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **`mobility.bookings.create`** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **`mobility.bookings.cancel_own`** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **`mobility.bookings.review_as_driver`**| ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **`mobility.graph.read`** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **`sustainability.metrics.read`** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **`sustainability.simulation.view`** | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **`sustainability.simulation.configure`**| ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **`sustainability.workloads.scale`** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **`wellbeing.sessions.manage_own`** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`wellbeing.rules.manage_own`** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`wellbeing.data.inspect_own`** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`wellbeing.data.delete_own`** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`wellbeing.cohort.read_anonymized`** | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **`exam.sessions.read_assigned`** | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ (Roster) |
| **`exam.observations.read_assigned`** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **`exam.observations.review_assigned`**| ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **`exam.audit.read_assigned`** | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ (Audit) |
| **`warden.transit.overview`** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **`warden.facilities.read`** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **`warden.advisories.publish`** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **`admin.users.read`** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **`admin.users.manage`** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **`admin.roles.assign`** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **`admin.roles.revoke`** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **`admin.system.diagnostics`** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **`admin.demo.reset`** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (Dev only) |
| **`security.audit.read`** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **`feed.posts.read`** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`feed.posts.create`** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`feed.posts.moderate`** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **`feed.comments.create`** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`mentorship.directory.search`** | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **`mentorship.request.create`** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`mentorship.request.review`** | ❌ (Mentor) | ❌ | ❌ | ✅ | ❌ | ❌ |
| **`mentorship.messages.exchange`** | ✅ (Participant) | ❌ | ❌ | ✅ (Participant) | ❌ | ❌ |
| **`assistant.chat.access`** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`assistant.actions.execute`** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`campus.events.rsvp`** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **`campus.communities.join`** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **`campus.facilities.report`** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`campus.facilities.resolve`** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 3. Resource Scope & Multi-Tenant Isolation Invariants

In addition to coarse role checks, the server enforces strict **Resource Scope Checks**:

1. **Academic Scoping**:
   - `GET /api/hub/profile/:studentId`: Only allowed if `req.user.id === studentId` OR `req.user.role === 'admin'`.
   - `PUT /api/hub/profile/:studentId`: Strictly `req.user.id === studentId`.
2. **Transit Scoping**:
   - `POST /api/rides/offers`: Driver ID is derived from `req.user.id`; client cannot spoof another driver ID.
   - `PATCH /api/rides/offers/:offerId`: Must be owned by `req.user.id`.
3. **Wellbeing Scoping**:
   - `GET /api/wellbeing/sessions/user/:userId`: Strictly `req.user.id === userId`.
   - `DELETE /api/wellbeing/history/:userId`: Strictly `req.user.id === userId`.
4. **Examination Scoping**:
   - `GET /api/exams/events/:sessionId`: Proctor must be assigned to `sessionId` via `exam_session_assignments` OR be `admin`.
   - `PATCH /api/exams/events/:eventId/review`: Proctor must be assigned to the associated session. Reviewer ID is derived from `req.user.id`.
5. **Feed & Moderation Scoping**:
   - `PATCH /api/feed/posts/:postId` and `DELETE /api/feed/posts/:postId`: Only original post author (`author_id === req.user.id`) or `admin`.
   - `POST /api/feed/posts/:postId/reports`: Any authenticated user can submit a report; moderation queue restricted to admins.
6. **Senior Mentorship Scoping**:
   - `PATCH /api/mentorship/requests/:id`: Only the assigned mentor (`mentor_user_id === req.user.id`) can accept or decline.
   - `GET/POST /api/mentorship/conversations/:id`: Participant check strictly enforces `student_id === req.user.id || mentor_user_id === req.user.id`. Third parties receive 403 Forbidden.
7. **Assistant Action Scoping**:
   - `POST /api/assistant/actions/:actionId/confirm`: User confirmation token bound strictly to `req.user.id`. Third-party execution is rejected with HTTP 403.
8. **Campus Facilities Scoping**:
   - `GET /api/campus/facilities/issues`: Normal users see their own reported issues; wardens and admins receive campus-wide aggregate issues.
   - `PATCH /api/campus/facilities/issues/:id`: Status transitions restricted to wardens and administrators.
