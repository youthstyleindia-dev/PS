# Architecture Decision Records (ADRs) & Engineering Assumptions

> **Project:** UniVerse Campus OS  
> **Status:** Active & Implemented  
> **Directive Reference:** Rule 15 — "Record significant assumptions in `docs/DECISIONS.md`."

---

## ADR 001: Cloud Generative AI Adapter & Grounding Architecture

### Context
UniVerse requires an integrated Campus Copilot capable of answering questions about campus seniors, events, resources, academic courses, and rides. Furthermore, the copilot must support proposing actionable tasks (e.g., requesting mentorship or registering for events).

### Decisions & Safe Defaults
1. **Official SDK Integration**: Adopted `@google/genai` (v2.32.0) with model `gemini-2.5-flash` for cloud synthesis.
2. **Deterministic Retrieval Grounding**: The backend implements `CampusRetrievalService`, which runs parameterized multi-keyword SQL queries across SQLite (`mentors`, `users`, `campus_events`, `curriculum_resources`, `feed_posts`, `rides`) matching the user's intent. Grounded facts are injected strictly into the system instruction block before generation.
3. **Prompt Injection Shielding**: User input is wrapped in explicit `<user_input>` boundary tags. The system prompt instructs the model to ignore any directives inside the user query attempting to override safety or campus policies.
4. **Transparent Offline Fallback**: If `GEMINI_API_KEY` is omitted or unconfigured, the system does not produce fake simulated AI answers. It serves a transparent response citing verified database facts, clearly decorated with `offline_fallback: true` and the metadata notice `[Demo/Offline Mode — Unconfigured Cloud Key]`.
5. **Two-Phase Action Confirmations**: The AI model proposes mutating actions formatted as structured tokens (`<<<PROPOSED_ACTION:{"action_type": "...", ...}>>>`). The server parses this, inserts a pending record in `assistant_action_confirmations`, and renders an explicit interactive confirmation card in the client UI. No mutating database operation executes without explicit user interaction on the confirmation card.

---

## ADR 002: Senior Mentorship Network Discovery & Explainable Scoring

### Context
Students need to search and match with experienced seniors across domains such as Machine Learning, Systems, Web Development, and Competitive Programming.

### Decisions & Safe Defaults
1. **Explainable Scoring Heuristic**: Rather than a black-box opaque ranker, matching scores ($0-100\%$) are deterministically derived via a weighted formula:
   $$\text{Score} = 40\% \cdot \text{Skill Overlap} + 25\% \cdot \text{Domain Match} + 15\% \cdot \text{Department Match} + 10\% \cdot \text{Rating / 5} + 10\% \cdot \text{Active Capacity}$$
   Each mentor result returns an `explainable_breakdown` object explaining why they matched (e.g. `Matching Skills: Machine Learning, PyTorch (+32%)`).
2. **Mentorship Request Lifecycle & Private Conversation Auto-Provisioning**:
   - Statuses: `PENDING`, `ACCEPTED`, `DECLINED`, `COMPLETED`.
   - When a mentor accepts a request (`PATCH /api/mentorship/requests/:id`), the backend atomically provisions a row in `mentorship_conversations` and initializes an introductory system message.
   - Privacy Invariant: Endpoints enforce participant membership (`student_id === req.user.id || mentor_user_id === req.user.id`). Third-party students or faculty cannot read or write to private mentorship threads.

---

## ADR 003: Campus Feed Architecture & Moderation Defense

### Context
A unified campus feed is needed for announcements, discussions, questions, events, and opportunities.

### Decisions & Safe Defaults
1. **Category Taxonomy**: `general`, `announcement`, `question`, `event`, `opportunity`.
2. **Interaction Aggregates**:
   - `feed_reactions`: Tracks unique `(post_id, user_id)` to allow idempotent toggles of `like`, `insightful`, `celebrate`.
   - `feed_bookmarks`: User-specific saved bookmarks.
   - `feed_comments`: Threaded comments supporting optional `parent_comment_id`.
3. **Authorization & Deletion Guards**:
   - Post authors can edit or delete their own posts.
   - System administrators have global moderation rights to delete posts.
   - Any user can submit a report (`feed_reports`) with reasons (`spam`, `harassment`, `misinformation`).

---

## ADR 004: Role Navigation & Public Architecture Access

### Context
Navigation must enforce role separation while preserving public exploration pages.

### Decisions & Safe Defaults
1. **Public Architecture & Landing**:
   - `/architecture`, `/`, `/how-it-works`, `/impact`, `/principles`, and `/login` are publicly accessible without authentication.
   - In `AppLayout.tsx`, if the user is unauthenticated and visits `/architecture`, the layout renders a public navigation header rather than redirecting to login.
   - "Explore Console" links pass target routes through `location.state.from` so that users are automatically returned to their intended destination post-login.
2. **Role-Specific Shells**:
   - Each active role (`student`, `driver`, `proctor`, `ta_faculty`, `warden`, `admin`) displays a tailored sidebar navigation matching their assigned permissions.
   - Route guards (`RoleGate`) strictly reject unauthorized paths and display an informative Access Denied screen.

---

## ADR 005: Deterministic Seed Data & Synthetic Content Guardrails

### Context
The environment requires realistic synthetic demo data across all campus domains that can be reliably reseeded and verified.

### Decisions & Safe Defaults
1. **Deterministic Tagging**: Every synthetic post, comment, event, and facility issue includes `is_demo = 1`.
2. **Idempotency**: All seed inserts use SQLite `INSERT INTO ... ON CONFLICT DO UPDATE` or key resolution queries (`uid(email)`) to guarantee zero unique constraint failures or orphan rows upon repeated runs.
3. **Verification Command**: `npm run db:verify` deterministically checks 7 invariants:
   - User count $\ge 20$ (Current: 29)
   - Total mentors $\ge 6$ (Current: 15)
   - ML mentors $\ge 3$ (Current: 4)
   - Feed posts $\ge 10$ (Current: 10)
   - Communities $\ge 4$ (Current: 6)
   - Campus events $\ge 4$ (Current: 5)
   - Foreign key integrity violations: Exactly 0.
