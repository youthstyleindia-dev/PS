# UniVerse Relational Data Model & SQLite WAL Schema

> **Storage Engine**: `better-sqlite3` v13.0.3  
> **Database File**: `server/data/universe.db`  
> **Journal Mode**: `WAL` (Write-Ahead Logging)  
> **Foreign Keys**: `PRAGMA foreign_keys = ON`  

---

## 1. Schema Architecture & Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ AUTH_SESSIONS : "holds"
    USERS ||--o{ AUTH_AUDIT_LOG : "records"
    USERS ||--o{ STUDENT_PROFILES : "has"
    USERS ||--o{ STUDENT_SKILLS : "masters"
    USERS ||--o{ PLACEMENT_TASKS : "manages"
    USERS ||--o{ MENTORSHIP_REQUESTS : "sends/receives"
    USERS ||--o{ RIDES : "drives"
    USERS ||--o{ RIDE_REQUESTS : "passengers"
    USERS ||--o{ FOCUS_SESSIONS : "focuses"
    USERS ||--o{ EXAM_SESSIONS : "takes"
    
    SKILLS ||--o{ STUDENT_SKILLS : "classified_in"
    CAMPUS_LOCATIONS ||--o{ CAMPUS_EDGES : "connects"
    CAMPUS_LOCATIONS ||--o{ RIDES : "origin/dest"
    
    EXAM_SESSIONS ||--o{ OBSERVATION_EVENTS : "observes"
    OBSERVATION_EVENTS ||--o{ EXAM_AUDIT_LOG : "audits"
    WORKLOAD_SERVICES ||--o{ WORKLOAD_MEASUREMENTS : "telemetry"
```

---

## 2. Table Directory (28 Relational Entities)

### Group 1: Core Node Identity & Cryptographic Security
1. `users`: Master node identity (`id`, `name`, `email`, `password_hash`, `role`, `department`, `year_of_study`, `bio`, `is_active`, `last_login`, `created_at`, `updated_at`).
2. `auth_sessions`: Active cryptographic session tokens (`id`, `user_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `is_revoked`, `last_active_at`, `created_at`).
3. `auth_audit_log`: Security audit trail (`id`, `user_id`, `email`, `event_type`, `ip_address`, `user_agent`, `metadata`, `created_at`).

### Group 2: Module A — Academic Placement & Mentorship Hub
4. `student_profiles`: Student academic metadata (`id`, `user_id`, `target_role`, `placement_goals`, `readiness_score`, `gpa`, `created_at`).
5. `skills`: Campus technical competency catalog (`id`, `name`, `category`, `prerequisite_skill_id`, `created_at`).
6. `student_skills`: Verified student skill proficiencies (`id`, `user_id`, `skill_id`, `rating`, `updated_at`).
7. `placement_tasks`: Placement readiness checklists (`id`, `user_id`, `title`, `category`, `is_completed`, `due_date`, `created_at`).
8. `mentor_profiles`: Peer mentor availability and focus areas (`id`, `user_id`, `specialty`, `hourly_capacity`, `affinity_vector`).
9. `mentorship_requests`: Peer mentorship invitation lifecycle (`id`, `student_id`, `mentor_id`, `topic`, `status`, `notes`, `created_at`).
10. `curriculum_resources`: Sovereign academic course archive (`id`, `course_code`, `title`, `subject`, `file_format`, `download_url`, `created_at`).

### Group 3: Module B — Campus Transit & Ride-Pooling
11. `campus_locations`: 10 topological nodes (`id`, `name`, `code`, `coord_x`, `coord_y`, `hub_type`).
12. `campus_edges`: 30 directed graph connections (`id`, `origin_id`, `destination_id`, `distance_km`, `base_travel_time_min`, `weight`).
13. `rides`: Active driver itineraries (`id`, `driver_id`, `origin_id`, `destination_id`, `departure_time`, `total_seats`, `available_seats`, `max_detour_percent`, `status`, `created_at`).
14. `ride_requests`: Commuter ride pool requests (`id`, `passenger_id`, `origin_id`, `destination_id`, `pickup_time`, `status`, `created_at`).
15. `ride_matches`: Algorithmically matched rides (`id`, `ride_id`, `request_id`, `detour_distance_km`, `detour_time_min`, `detour_ratio`, `status`, `created_at`).

### Group 4: Module C — Sustainable Computing Observatory
16. `workload_services`: The 3 modeled campus services (`id`, `name`, `service_code`, `base_idle_power_w`, `peak_power_w`, `power_model_exponent`).
17. `simulation_runs`: Recorded benchmark scenarios (`id`, `scenario_name`, `mode`, `pue_applied`, `grid_intensity_g_kwh`, `created_at`).
18. `workload_measurements`: Time-series power and carbon telemetry (`id`, `service_id`, `simulation_id`, `utilization_percent`, `power_draw_w`, `energy_kwh`, `carbon_emissions_g`).
19. `batch_jobs`: Simulated Slurm HPC job queue (`id`, `job_name`, `estimated_runtime_hours`, `required_power_w`, `is_solar_window`, `scheduled_at`).

### Group 5: Module D — Privacy-Aware Digital Wellbeing
20. `focus_sessions`: Student focus intervals (`id`, `user_id`, `target_duration_mins`, `actual_duration_seconds`, `status`, `started_at`, `stopped_at`, `deep_work_index`).
21. `focus_events`: Sanitized browsing entries (`id`, `session_id`, `sanitized_domain`, `category`, `duration_seconds`, `created_at`).
22. `focus_rules`: User domain classification rules (`id`, `user_id`, `domain_pattern`, `category`, `is_blocked`).
23. `dp_cohort_aggregates`: Differential privacy cache records (`id`, `cohort_identifier`, `true_mean`, `perturbed_mean`, `epsilon`, `sensitivity`, `created_at`).

### Group 6: Module E — Responsible Examination Review
24. `exam_sessions`: Scheduled examinations (`id`, `course_id`, `title`, `student_id`, `scheduled_start`, `scheduled_end`, `status`).
25. `observation_events`: Flagged exam incidents (`id`, `exam_session_id`, `event_type`, `confidence_score`, `provenance`, `frame_snapshot_url`, `review_status`, `proctor_notes`, `reviewer_id`, `timestamp`, `resolved_at`).
26. `exam_audit_log`: Append-only proctor adjudication ledger (`id`, `event_id`, `exam_session_id`, `proctor_id`, `previous_status`, `new_status`, `action`, `reason_code`, `proctor_notes`, `timestamp_utc`).

### Group 7: Shared Cross-Module Activity & System Telemetry
27. `activity_log`: Global campus activity feed (`id`, `user_id`, `module`, `action`, `details`, `timestamp`).
28. `system_settings`: Node-level configuration parameters (`key`, `value`, `updated_at`).

### Group 8: Campus Community & Feed Ecosystem
29. `feed_posts`: Unified campus posts, announcements, questions, and opportunities (`id`, `author_id`, `title`, `content`, `category`, `tags`, `likes_count`, `comments_count`, `is_pinned`, `is_demo`, `created_at`, `updated_at`).
30. `feed_comments`: Threaded comments on feed posts (`id`, `post_id`, `author_id`, `parent_comment_id`, `content`, `likes_count`, `is_demo`, `created_at`).
31. `feed_reactions`: User reactions on posts (`id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `UNIQUE(post_id, user_id)`).
32. `feed_bookmarks`: Saved campus posts for authenticated users (`id`, `post_id`, `user_id`, `created_at`, `UNIQUE(post_id, user_id)`).
33. `feed_follows`: Follow relationships between campus users (`id`, `follower_id`, `following_id`, `created_at`).
34. `feed_reports`: Moderation reports for flagged content (`id`, `post_id`, `reporter_id`, `reason`, `details`, `status`, `created_at`).
35. `communities`: Official campus student clubs and interest groups (`id`, `name`, `slug`, `description`, `category`, `member_count`, `avatar_url`, `created_at`).
36. `community_memberships`: User memberships in campus communities (`id`, `community_id`, `user_id`, `role`, `joined_at`, `UNIQUE(community_id, user_id)`).
37. `campus_events`: Campus seminars, workshops, and hackathons (`id`, `title`, `description`, `category`, `location_id`, `location_name`, `start_time`, `end_time`, `organizer_id`, `capacity`, `registered_count`, `is_demo`, `created_at`).
38. `event_registrations`: Student RSVPs for campus events (`id`, `event_id`, `user_id`, `status`, `registered_at`, `UNIQUE(event_id, user_id)`).
39. `campus_announcements`: Official institutional campus alerts (`id`, `title`, `content`, `urgency`, `department`, `author_id`, `is_active`, `created_at`).

### Group 9: Senior Mentorship Conversations
40. `mentorship_conversations`: Direct guidance chat channels (`id`, `request_id`, `student_id`, `mentor_user_id`, `created_at`, `updated_at`).
41. `mentorship_messages`: End-to-end messages between mentor and student (`id`, `conversation_id`, `sender_id`, `content`, `read_at`, `created_at`).

### Group 10: Campus Copilot & Cloud AI
42. `assistant_conversations`: Conversational history with the Campus Copilot (`id`, `user_id`, `title`, `created_at`, `updated_at`).
43. `assistant_messages`: Copilot queries and grounded replies (`id`, `conversation_id`, `sender_type`, `content`, `sources_json`, `created_at`).
44. `assistant_action_confirmations`: Proposed two-phase mutating operations awaiting human approval (`id`, `conversation_id`, `user_id`, `action_type`, `action_payload_json`, `status`, `expires_at`, `created_at`).
45. `assistant_usage_daily`: Quota and rate-limiting tracking per user (`id`, `user_id`, `date`, `request_count`, `tokens_used`).

### Group 11: Facilities & Campus Operations
46. `facility_issues`: Campus maintenance and repair defect tracking (`id`, `reporter_id`, `location_id`, `title`, `description`, `category`, `urgency`, `status`, `resolution_notes`, `is_demo`, `created_at`, `updated_at`).

---

## 3. SQLite WAL Configuration & Performance Tuning

UniVerse configures SQLite via `server/src/db/connection.ts` on startup:
```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA temp_store = MEMORY;
PRAGMA cache_size = -64000; -- 64MB memory cache
```
- **Concurrency**: WAL allows concurrent readers to proceed without blocking writers, and writers do not block readers.
- **Atomicity**: Multi-entity bookings (e.g., matching a ride and updating seat capacity) execute inside strict `db.transaction()` closures.
