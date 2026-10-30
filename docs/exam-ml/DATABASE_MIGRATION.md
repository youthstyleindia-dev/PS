# UniVerse Module E: Database Schema Migrations & Integrity

This document outlines the SQLite schema additions, foreign key relationships, indexes, and transactional integrity guarantees introduced for Module E.

---

## 1. Migration Overview

All schema enhancements are executed non-destructively through `server/src/db/connection.ts` and `server/src/db/schema.sql`, preserving existing tables, indexes, and user records.

---

## 2. DDL Specifications

```sql
-- 1. Vision Model Registry
CREATE TABLE IF NOT EXISTS vision_model_registry (
  id TEXT PRIMARY KEY,
  model_key TEXT NOT NULL CHECK(model_key IN ('face_landmarker', 'person_detector')),
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  artifact_filename TEXT NOT NULL,
  artifact_sha256 TEXT NOT NULL,
  source_url TEXT NOT NULL,
  license_identifier TEXT NOT NULL,
  model_card_url TEXT NOT NULL,
  runtime_package TEXT NOT NULL,
  runtime_package_version TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Candidate Vision Consents
CREATE TABLE IF NOT EXISTS exam_vision_consents (
  id TEXT PRIMARY KEY,
  exam_session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  candidate_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  consent_status TEXT NOT NULL CHECK(consent_status IN ('granted', 'declined', 'withdrawn')),
  explanation_version TEXT NOT NULL DEFAULT 'v1.0',
  granted_at TEXT,
  withdrawn_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Observation Rule Versions
CREATE TABLE IF NOT EXISTS exam_vision_rule_versions (
  id TEXT PRIMARY KEY,
  rule_key TEXT NOT NULL,
  version TEXT NOT NULL,
  configuration_json TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  effective_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  author TEXT NOT NULL DEFAULT 'SYSTEM',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Observation Lifecycle Audit Trail
CREATE TABLE IF NOT EXISTS exam_observation_audit (
  id TEXT PRIMARY KEY,
  observation_id TEXT NOT NULL REFERENCES observation_events(id) ON DELETE CASCADE,
  exam_session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Referential Integrity & Performance Pragmas

- **Foreign Key Cascades:** `PRAGMA foreign_keys = ON;` ensures that when an exam session is concluded and purged, all associated observations, consents, and temporary metadata are removed cleanly.
- **Write-Ahead Logging:** `PRAGMA journal_mode = WAL;` enables concurrent read operations while writes to `exam_audit_log` execute atomically.
- **Immediate Transactions:** Reviews and audit trail insertions are wrapped in `runInTransaction()` to prevent partial writes.
