# UniVerse API Contracts & Schema Specification

> **Base URL**: `http://localhost:3001/api`  
> **Protocol**: HTTP/1.1 REST + JSON  
> **Authentication**: `Authorization: Bearer <JWT>`  

---

## 1. Global Response & Error Convention

### Standard Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Standard Error Envelope
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Detailed safe error explanation",
    "details": [ ... ]
  }
}
```

Standard Error Codes: `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `BAD_REQUEST` (400), `INTERNAL_SERVER_ERROR` (500).

---

## 2. Authentication & Node Identity (`/api/auth`)

| Method | Endpoint | Access | Request Body | Response Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | `{ name, email, password, role, department, year_of_study }` | 201 Created; returns JWT token + user profile |
| `POST` | `/api/auth/login` | Public | `{ email, password }` | 200 OK; returns JWT token + session object |
| `POST` | `/api/auth/demo-login` | Public | `{ role: 'student' \| 'driver' \| 'proctor' \| 'admin' }` | 200 OK; instant authenticated persona access |
| `GET` | `/api/auth/me` | Bearer Token | None | 200 OK; authenticated user profile & permissions |
| `PUT` | `/api/auth/profile` | Bearer Token | `{ name?, department?, year_of_study?, bio? }` | 200 OK; updated user profile record |
| `POST` | `/api/auth/change-password` | Bearer Token | `{ currentPassword, newPassword }` | 200 OK; verifies hash and updates password |
| `POST` | `/api/auth/logout` | Bearer Token | None | 200 OK; revokes session token in database |
| `GET` | `/api/auth/sessions` | Bearer Token | None | 200 OK; array of active sessions for user |
| `DELETE` | `/api/auth/sessions/:sessionId` | Bearer Token | None | 200 OK; revokes specific active session |
| `GET` | `/api/auth/audit` | Bearer Token | None (Admin gets all, user gets own) | 200 OK; recent security audit events |

---

## 3. Module A: Academic Hub (`/api/hub`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/hub/skills` | Returns list of campus technical competencies & prerequisite chains |
| `GET` | `/api/hub/skills/:studentId` | Returns skill masteries and ratings for a student |
| `POST` | `/api/hub/placement/tasks` | Create new milestone placement task (`resume`, `coding`, `interview`, `core`) |
| `GET` | `/api/hub/placement/tasks/:studentId`| Fetch student placement tasks and progress metrics |
| `PATCH`| `/api/hub/placement/tasks/:taskId` | Toggle task completion (`is_completed`) or update status |
| `GET` | `/api/hub/mentors` | Search available peer mentors by skills, department, or keyword |
| `POST` | `/api/hub/mentorship-requests` | Dispatch mentorship invitation to a peer mentor |
| `PATCH`| `/api/hub/mentorship-requests/:id` | Transition request status (`PENDING` → `ACCEPTED` / `DECLINED`) |
| `GET` | `/api/hub/resources` | Query sovereign curriculum archive with category & subject filters |

---

## 4. Module B: Campus Ride-Pooling (`/api/rides`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/rides/graph` | Returns 10-node campus topological network with live congestion multiplier |
| `POST` | `/api/rides/shortest-path` | Executes Dijkstra algorithm: returns path, distance (km), and travel time (min) |
| `POST` | `/api/rides/offers` | Driver publishes new ride offer with origin, destination, seats, departure |
| `GET` | `/api/rides/offers` | Fetch active driver ride offers with capacity |
| `POST` | `/api/rides/requests` | Passenger submits ride pool request |
| `POST` | `/api/rides/match` | Evaluates candidate rides; enforces $\le 35\%$ detour and seat availability |
| `POST` | `/api/rides/book` | Confirms pooled booking; atomically decrements available seats |
| `GET` | `/api/rides/summary` | Campus transit summary statistics (active rides, carpools, emissions saved) |

---

## 5. Module C: Sustainable Computing (`/api/sustainability`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/sustainability/services` | Telemetry for modeled services with $P(U)$ power calculations |
| `GET` | `/api/sustainability/scenarios`| Returns baseline vs. eco-optimized scenario comparison |
| `POST` | `/api/sustainability/mode` | Toggles cluster optimization mode (Standard vs. Eco Mode) |
| `POST` | `/api/sustainability/jobs` | Submits batch Slurm compute job; checks solar window (10:00-14:00) |
| `GET` | `/api/sustainability/metrics` | System-wide energy draw (kWh), carbon emissions (gCO₂e), and PUE |

---

## 6. Module D: Digital Wellbeing (`/api/wellbeing`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/wellbeing/sessions/start` | Initiates new focus session with duration and optional category |
| `POST` | `/api/wellbeing/sessions/:id/pause`| Pauses active focus session timer |
| `POST` | `/api/wellbeing/sessions/:id/resume`| Resumes paused focus session |
| `POST` | `/api/wellbeing/sessions/:id/stop` | Finalizes focus session; derives Deep Work Index |
| `POST` | `/api/wellbeing/events` | Logs browsing event; sanitizes URL to pure hostname (no path/query) |
| `GET` | `/api/wellbeing/cohort-aggregate` | Returns cohort focus statistics perturbed with Laplace noise ($\epsilon = 0.8$) |
| `DELETE`| `/api/wellbeing/purge` | GDPR Right-to-Erasure: permanently deletes student focus logs |

---

## 7. Module E: Examination Monitoring (`/api/exams`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/exams/sessions` | Lists scheduled and active examination sessions |
| `POST` | `/api/exams/sessions` | Provisions a new examination session |
| `POST` | `/api/exams/events` | Ingests observable event with mandatory provenance tag & notice |
| `GET` | `/api/exams/pending-reviews`| Fetches observation events awaiting human proctor review |
| `GET` | `/api/exams/events/:sessionId` | Retrieves all timestamped incidents for an exam session |
| `PATCH`| `/api/exams/events/:id/review`| Proctor submits written justification and adjudicates incident |
| `GET` | `/api/exams/audit-log/:sessionId`| Returns immutable audit log of all proctor actions and decisions |

---

## 8. Module F: Campus Community Feed (`/api/feed`)

| Method | Endpoint | Access | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/feed` | Bearer Token | Query: `category`, `search`, `limit`, `offset` | Lists campus feed posts with author profiles, reaction counts, and user interaction states |
| `POST` | `/api/feed/posts` | Bearer Token | `{ title?, content, category, tags? }` | Publishes new campus post or notice (`general`, `announcement`, `question`, `event`, `opportunity`) |
| `GET` | `/api/feed/posts/:postId` | Bearer Token | None | Retrieves post details, comments tree, and current user reaction state |
| `PATCH` | `/api/feed/posts/:postId` | Bearer Token | `{ title?, content?, category?, tags? }` | Updates post content (enforces author ownership or admin role) |
| `DELETE` | `/api/feed/posts/:postId` | Bearer Token | None | Deletes post (enforces author ownership or admin role) |
| `POST` | `/api/feed/posts/:postId/reactions` | Bearer Token | `{ reaction_type: 'like' \| 'insightful' \| 'celebrate' }` | Toggles reaction on post; updates reaction aggregates atomically |
| `GET` | `/api/feed/posts/:postId/comments` | Bearer Token | None | Lists comments with nested author metadata |
| `POST` | `/api/feed/posts/:postId/comments` | Bearer Token | `{ content, parent_comment_id? }` | Adds top-level or reply comment |
| `POST` | `/api/feed/posts/:postId/bookmarks` | Bearer Token | None | Toggles post bookmark state for authenticated user |
| `POST` | `/api/feed/posts/:postId/reports` | Bearer Token | `{ reason, details? }` | Flags post for moderation review (`spam`, `harassment`, `misinformation`) |

---

## 9. Module G: Senior Mentorship Network (`/api/mentors` & `/api/mentorship`)

| Method | Endpoint | Access | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/mentors` | Bearer Token | Query: `query`, `domain`, `skill`, `limit` | Searches seniors and returns profiles with explainable match scores |
| `GET` | `/api/mentors/:mentorId` | Bearer Token | None | Detailed mentor profile with past advice history, active status, and capacity |
| `GET` | `/api/mentorship/requests` | Bearer Token | Query: `role: 'student' \| 'mentor'` | Lists outgoing guidance requests (student) or incoming guidance queue (mentor) |
| `POST` | `/api/mentorship/requests` | Bearer Token | `{ mentor_id, topic, message, priority? }` | Submits structured guidance request to a verified senior mentor |
| `PATCH` | `/api/mentorship/requests/:requestId` | Bearer Token | `{ status: 'ACCEPTED' \| 'DECLINED', notes? }` | Mentor adjudicates request; acceptance provisions private conversation automatically |
| `GET` | `/api/mentorship/conversations/:id` | Bearer Token | None | Retrieves private mentorship chat thread (enforces student/mentor participant isolation) |
| `POST` | `/api/mentorship/conversations/:id/messages` | Bearer Token | `{ content }` | Sends private message within active mentorship thread |

---

## 10. Module H: Campus Copilot & Cloud AI (`/api/assistant`)

| Method | Endpoint | Access | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/assistant/conversations` | Bearer Token | None | Lists user's past conversational threads with Copilot |
| `POST` | `/api/assistant/conversations` | Bearer Token | `{ title? }` | Initializes a fresh conversational session |
| `GET` | `/api/assistant/conversations/:id` | Bearer Token | None | Retrieves conversation message history with grounded source citations |
| `DELETE` | `/api/assistant/conversations/:id` | Bearer Token | None | Clears conversational session and associated chat context |
| `POST` | `/api/assistant/conversations/:id/messages` | Bearer Token | `{ message }` | Sends user query; invokes `@google/genai` with grounded SQLite context; returns streaming-ready response and proposed action cards |
| `POST` | `/api/assistant/actions/:actionId/confirm` | Bearer Token | None | User confirms proposed mutating action (e.g. submit mentorship request, register for event) |

---

## 11. Module I: Campus Directory, Events, Communities & Facilities (`/api/campus`)

| Method | Endpoint | Access | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/campus/directory` | Bearer Token | Query: `query`, `department`, `role` | Searches campus directory (students, faculty, mentors, staff) |
| `GET` | `/api/campus/events` | Bearer Token | Query: `upcoming`, `category` | Retrieves upcoming campus workshops, hackathons, seminars, and club meets |
| `POST` | `/api/campus/events/:id/rsvp` | Bearer Token | None | Toggles RSVP registration status for authenticated student |
| `GET` | `/api/campus/communities` | Bearer Token | None | Lists official student clubs, research groups, and interest communities |
| `POST` | `/api/campus/communities/:id/join` | Bearer Token | None | Toggles membership in campus community |
| `GET` | `/api/campus/announcements` | Bearer Token | Query: `urgency` | Retrieves official institutional notices and campus advisories |
| `GET` | `/api/campus/facilities/issues` | Bearer Token | Query: `status` | Lists reported campus defects (wardens/admins get all; students get own) |
| `POST` | `/api/campus/facilities/issues` | Bearer Token | `{ title, description, category, location_id?, urgency? }` | Submits facility defect or repair ticket |
| `PATCH` | `/api/campus/facilities/issues/:id` | Bearer Token | `{ status: 'INVESTIGATING' \| 'RESOLVED', resolution_notes? }` | Warden/Admin updates issue resolution status |
