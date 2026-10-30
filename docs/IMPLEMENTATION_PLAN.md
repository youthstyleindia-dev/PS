# UniVerse Campus OS — Implementation Plan

**Objective:** Extend the existing UniVerse application into a fully connected campus operating system with a functional campus community feed, a cloud-powered generative AI assistant (Campus Copilot), a searchable senior/ML mentorship network, realistic synthetic demo data, role-specific portals, and reliable end-to-end workflows.

---

## Architecture & Work Breakdown Structure

```
                                  +------------------------------------+
                                  |       UniVerse Campus OS Shell     |
                                  |   (Role-Aware Nav & Public Pages)  |
                                  +-----------------+------------------+
                                                    |
             +--------------------+-----------------+--------------------+--------------------+
             |                    |                 |                    |                    |
             v                    v                 v                    v                    v
   +-------------------+ +----------------+ +---------------+ +--------------------+ +-------------------+
   |    Campus Feed    | | Senior Mentors | | Cloud Copilot | |  Campus Directory  | | Original Modules  |
   |   & Discussions   | |  & ML Network  | | (Gemini+Tools)| |  & Events/Clubs    | | (A, B, C, D, E)   |
   +-------------------+ +----------------+ +---------------+ +--------------------+ +-------------------+
```

---

## Phase 1: Database Schema Expansion & Reversible Migrations
**Target:** Create relational tables with strict constraints, indexes, and WAL configuration.
- Feed: `feed_posts`, `feed_comments`, `feed_reactions`, `feed_bookmarks`, `feed_reports`, `feed_follows`.
- Community & Events: `communities`, `community_memberships`, `campus_events`, `event_registrations`, `campus_locations`, `campus_announcements`.
- Mentorship Workflows: `mentorship_conversations`, `mentorship_messages`.
- AI Assistant: `assistant_conversations`, `assistant_messages`, `assistant_action_confirmations`.
- Ensure idempotence in `initDb()` and `server/src/db/schema.sql`.

## Phase 2: Public Navigation & Role Isolation Corrections
**Target:** Ensure zero leakage across roles and flawless public navigation.
- Decouple `/architecture` from `RoleGate` so it is publicly accessible.
- Support "Explore Console" redirect logic (redirect to login with return target).
- Update role navigation mappings (`client/src/navigation/navigationByRole.ts`) so student sees:
  - Campus Feed (`/feed`)
  - Senior Mentors (`/mentors`)
  - Campus Copilot (`/assistant`)
  - Academic Hub (`/academic`)
  - Ride Pooling (`/rides`)
  - Digital Wellbeing (`/wellbeing`)
  - Events & Communities (`/events`)
- Role isolation: student cannot access `/exams`, `/exam-monitor`, driver dispatch, warden controls, or admin panel.

## Phase 3: Campus Feed & Community Backend & Frontend
**Target:** Interactive community feed with structured post types, deterministic ranking, filtering, and moderation.
- Post types: `discussion`, `question`, `project_update`, `opportunity`, `event`, `announcement`, `resource_share`, `ride_share`, `poll`.
- Backend endpoints:
  - `GET /api/feed` (filters: tab, tags, query, department, sort)
  - `POST /api/feed/posts` (role permission checks)
  - `GET /api/feed/posts/:postId`
  - `PATCH /api/feed/posts/:postId`
  - `DELETE /api/feed/posts/:postId`
  - `POST /api/feed/posts/:postId/reactions` (toggle reaction, unique constraint)
  - `POST /api/feed/posts/:postId/comments`
  - `POST /api/feed/posts/:postId/bookmarks`
  - `POST /api/feed/posts/:postId/reports`
- UI: `/feed` page with category chips ("For You", "Questions", "Projects", "Opportunities", "Events", "Announcements", "Resources", "Rides", "Clubs & Communities"), post composer, reactive liking/bookmarking, and moderation/reporting.

## Phase 4: Senior Mentorship Discovery & Explainable ML Matching
**Target:** First-class mentorship experience for finding experienced seniors in Machine Learning, AI, Data Science, Web Dev, etc.
- Explainable matching engine: scores candidates based on skill overlap, topic alignment, and availability.
- Backend endpoints:
  - `GET /api/mentors` (query, skill filters, explainable match breakdown)
  - `GET /api/mentors/:mentorId`
  - `POST /api/mentorship/requests`
  - `GET /api/mentorship/requests`
  - `PATCH /api/mentorship/requests/:requestId`
  - `GET /api/mentorship/conversations/:conversationId`
  - `POST /api/mentorship/conversations/:conversationId/messages`
- UI: `/mentors` page with search, ML tag pills, mentor cards, advice request modal, and mentor workspace for managing incoming requests and active chat conversations.

## Phase 5: Cloud Generative AI (UniVerse AI / Campus Copilot)
**Target:** Real cloud-powered generative assistant with grounded campus retrieval and server-owned tool execution.
- Provider Adapter: Official `@google/genai` SDK using `GEMINI_API_KEY` and `GEMINI_MODEL` (fallback to demo offline mode if key absent).
- Grounded Retrieval Layer: queries SQLite database for verified mentor profiles, feed posts, events, academic resources, and rides.
- Controlled Tool Allowlist:
  - Read tools: `search_mentors`, `search_feed`, `search_events`, `search_academic_resources`, `search_campus_directory`, `search_available_rides`.
  - Mutating tools: `create_mentorship_request`, `create_feed_post`, `register_for_event`, `request_ride_seat` -> produces confirmation proposal card; requires user confirmation via `/api/assistant/actions/:actionId/confirm`.
- UI: `/assistant` page and floating copilot drawer with conversation history, suggested prompt chips, source citation cards, and action confirmation modals.

## Phase 6: Campus Directory, Events & Communities
**Target:** Rich campus environment with physical nodes, student clubs, and workshop registrations.
- Backend endpoints:
  - `GET /api/campus/directory`
  - `GET /api/events` & `POST /api/events/:eventId/rsvp`
  - `GET /api/communities` & `POST /api/communities/:communityId/join`
- Integration with Campus Feed and Academic Hub.

## Phase 7: Deterministic Synthetic Demo Dataset
**Target:** Seed the application with 30+ students, 10+ mentors (with 4+ ML specialists), 40+ feed posts, 10+ events, 6 communities, and physical locations.
- Package scripts: `db:seed:demo`, `db:reset:demo`, `db:verify`.
- Explicit `is_demo = 1` tagging on all synthetic records.

## Phase 8: Testing & Verification
**Target:** Complete test suite covering all tiers.
- Unit & integration tests for Feed, Mentorship, AI Copilot, Role Isolation, and Crash Resistance.
- Verify existing 229 tests continue passing.

## Phase 9: Documentation & Live Demonstration Script
**Target:** Deliver all required documentation files and the step-by-step 10–12 minute demo script in `docs/FULL_CAMPUS_DEMO_SCRIPT.md`.
