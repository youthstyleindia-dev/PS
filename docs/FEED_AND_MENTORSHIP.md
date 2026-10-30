# UniVerse Campus Feed & Senior Mentorship Network Specification

## 1. Campus Feed Architecture (`/feed`)

The Campus Feed provides a unified, real-time community stream combining official institutional notices, student questions, project updates, hackathon calls, and general collegiate discussions.

### Feed Taxonomy
- **Post Types:**
  - `announcement`: Official notices from Faculty, Wardens, or Administrators.
  - `event`: Scheduled campus gatherings, workshops, or club meets.
  - `question`: Technical or collegiate questions seeking peer answers.
  - `discussion`: Open conversational topics across disciplines.
  - `project_update`: Progress logs, GitHub repos, and research preprints.
  - `opportunity`: Research assistant openings, internships, and hackathon teams.
- **Categories:** `all`, `academic`, `mobility`, `wellbeing`, `sustainability`, `exams`, `general`.

### Server-Side Role Enforcement
- **Student Authorization:** Students can publish `question`, `discussion`, `project_update`, `opportunity`, and `event` posts.
- **Announcement Privilege:** Only users holding `ta_faculty`, `warden`, or `admin` roles can publish posts with `post_type = 'announcement'`. Attempts by students to publish announcements are rejected with `403 FORBIDDEN`.

### Interaction Features
- **Reactions (Likes):** Stored in `feed_reactions`. Toggling is idempotent; clicking like on an already liked post decrements the count and removes the record.
- **Nested Comments:** Stored in `feed_comments` with support for `parent_id` hierarchy.
- **Bookmarks:** Stored in `feed_bookmarks`, isolated per user for quick personal retrieval.
- **Moderation Flagging:** Stored in `feed_reports` with reasons (`spam`, `harassment`, `commercial_solicitation`).

---

## 2. Senior Mentorship Network (`/mentors`)

### Purpose
To empower underclassmen to connect with experienced seniors and alumni in high-demand specializations (Machine Learning, PyTorch, Distributed Systems, Cloud Architecture, DSA, and Research).

### Explainable Matching Scoring Engine
When a student searches the mentor directory, mentors are ranked using an explainable, deterministic scoring model:

$$\text{Score} = \text{Base} + \text{QueryRelevance} + \text{SkillMatch} + \text{TopicMatch} + \text{AvailabilityBonus} + \text{RatingBonus}$$

| Component | Points | Description |
|---|---|---|
| **Base Score** | +40 | Approved, verified senior mentor status |
| **Query Relevance** | +35 | Direct match on mentor name or primary domain |
| **Skill Overlap** | +25 | Match against verified skills (e.g. PyTorch, Machine Learning) |
| **Topic Overlap** | +15 | Match against offered guidance topics |
| **Availability Bonus** | +10 | Mentor currently has open capacity (`active_mentees < max_mentees`) |
| **Peer Rating Bonus** | Up to +10 | Weighted by verified review score ($(\text{rating} - 3.0) \times 5$) |
| **Cap** | 99% | Match percentage capped at 99% for modesty and realism |

### Mentorship Request State Machine
```
[Pending]
   │
   ├── Mentor Accepts ──► [Accepted] ──► Auto-provisions private conversation
   │
   ├── Mentor Declines ─► [Rejected]
   │
   └── Mentorship Concluded ──► [Completed]
```

### Guidance Workflow:
1. **Discovery:** Mentee browses `/mentors` with quick skill chips (`Machine Learning`, `PyTorch`, `DSA`, etc.).
2. **Submission:** Mentee chooses a topic, preferred slot, and submits questions via `POST /api/mentorship/requests`.
3. **Duplicate Prevention:** A mentee cannot submit multiple pending requests to the same mentor (`409 CONFLICT`).
4. **Acceptance & Conversation Provisioning:** When the mentor accepts via `PATCH /api/mentorship/requests/:id`, the system automatically provisions an entry in `mentorship_conversations`.
5. **Private Communication:** Mentee and mentor communicate in real time via `GET/POST /api/mentorship/conversations/:id/messages`.
6. **Privacy Boundary:** Any third party attempting to read a private conversation receives `403 FORBIDDEN`.
