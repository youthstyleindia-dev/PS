# UniVerse Campus Feed & Content Moderation Architecture

## 1. Overview & Principles

The UniVerse Campus Feed (`/feed`) provides an integrated, non-commercial communication commons for students, mentors, faculty, and administrative staff. Unlike commercial ad-driven social feeds, the UniVerse feed prioritizes:

- **Zero Algorithmic Manipulation**: No engagement-bait ranking. Feeds are sorted strictly by chronological timestamp (`recent`) or verifiable community upvotes (`top`).
- **Cryptographic Author Ownership**: Content authors retain sole authority to modify or permanently purge their publications.
- **Hierarchical Governance**: System administrators and campus staff possess scoped moderation controls to flag or purge code-of-conduct violations with audit logs.
- **Auditable Reporting**: Any community member may submit an incident report with mandatory classification reasons.

---

## 2. Feed Taxonomy & Content Streams

The feed is partitioned into clean functional channels:

| Tab / Stream | Description | Permitted Roles | Target Post Types |
|---|---|---|---|
| `for_you` | Aggregated multi-module updates and peer discussions | All | All |
| `following` | Posts from mentors and peers followed by the user | Student, Faculty | All |
| `communities` | Updates originating inside campus student clubs | All | `discussion`, `project_update` |
| `questions` | Technical questions and academic problem-solving | Student, Faculty | `question` |
| `projects` | Open-source repos, hackathon teams, and project showcases | Student, Mentor | `project_update`, `resource_share` |
| `events` | Official campus conferences, hackathons, and seminars | All | `event` |
| `announcements` | High-priority institutional broadcasts from Dean / Warden | Warden, Faculty, Admin | `announcement` |

---

## 3. Data Model & Integrity Constraints

All feed records are persisted within SQLite WAL-mode tables with foreign key cascades:

```sql
CREATE TABLE IF NOT EXISTS feed_posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campus_id TEXT NOT NULL DEFAULT 'campus_main',
  post_type TEXT NOT NULL CHECK(post_type IN ('discussion', 'question', 'project_update', 'opportunity', 'event', 'announcement', 'resource_share', 'ride_share', 'poll')),
  title TEXT,
  body TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
  visibility TEXT NOT NULL DEFAULT 'campus' CHECK(visibility IN ('public', 'campus', 'community', 'faculty_only', 'role_only')),
  target_roles TEXT DEFAULT '[]',
  target_community_id TEXT REFERENCES communities(id) ON DELETE SET NULL,
  attachment_metadata TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft', 'published', 'flagged', 'hidden', 'archived')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  bookmarks_count INTEGER NOT NULL DEFAULT 0,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Moderation & Negative Authorization Rules

1. **Delete Protection**:
   - `DELETE /api/feed/posts/:id`
   - Allowed: Post author (`post.author_id === req.user.sub`) OR System Admin (`req.user.role === 'admin'`).
   - Rejected: Any other user attempting deletion receives HTTP `403 Forbidden`.
2. **Comment Integrity**:
   - `DELETE /api/feed/comments/:commentId`
   - Allowed: Comment author OR Post author OR System Admin.
3. **Report Escalation**:
   - `POST /api/feed/posts/:id/reports`
   - Creates an entry in `feed_reports`. Upon reaching $\ge 3$ unique reports, post status transitions to `'flagged'` and appears in the admin moderation dashboard.
