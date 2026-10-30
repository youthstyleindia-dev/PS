# UniVerse Campus OS — Synthetic Seed Dataset Specification

## 1. Overview & Verification Commands
UniVerse provides deterministic, realistic synthetic campus data for demonstration and automated testing. All demo records are tagged with `is_demo = 1` to guarantee complete transparency and isolation from real records.

### Package Commands
```bash
# Seed or reset the full synthetic campus dataset
npm run db:reset:demo

# Deterministically verify all invariants, table counts, and foreign keys
npm run db:verify
```

---

## 2. Demo Personas & Credentials
All demo accounts use password: `universe2026` (or fallback `CampusPass123!`).

| Persona | Role | Email | Profile & Focus |
|---|---|---|---|
| **Aarav Mehta** | `student` | `aarav.mehta@campus.edu` | Year 2 CSE; preparing for summer ML internships and PyTorch projects. |
| **Riya Shah** | `student` (Mentor) | `riya.shah@campus.edu` | Year 4 CSE; Incoming ML Engineer at Google DeepMind; PyTorch & Vision specialist. |
| **Kabir Patel** | `student` (Mentor) | `kabir.patel@campus.edu` | Year 4 CSE; Incoming Systems Engineer at Microsoft; Distributed Systems & Slurm. |
| **Neha Rao** | `student` (Mentor) | `neha.rao@campus.edu` | Year 4 AI & DS; Data Scientist at Amazon AWS; NLP & Transformers. |
| **Diya Patel** | `student` (Mentor) | `diya.patel@campus.edu` | Year 4 CSE; Full-stack & DSA specialist; LeetCode 150 mentor. |
| **Dr. Priya Patel** | `ta_faculty` | `priya.patel@campus.edu` | Faculty Advisor; AI Lab Director; Resource publisher. |
| **Vikram Rao** | `driver` | `vikram.rao@campus.edu` | Transit Driver; EV carpool driver; topological route publisher. |
| **Prof. M. Sundaram** | `proctor` | `m.sundaram@campus.edu` | Exam Integrity Tribunal Chair; Human review supervisor. |
| **Campus Warden** | `warden` | `warden@campus.edu` | Residential Operations & Campus Safety Warden. |
| **IT Administrator** | `admin` | `admin@campus.edu` | System Operations & Root Enclave Administrator. |

---

## 3. Seed Dataset Metrics & Targets

| Metric | Target | Actual (Verified) | Status |
|---|---|---|---|
| **Demo Users** | $\ge 20$ | **29** | PASS |
| **Total Mentors** | $\ge 6$ | **15** | PASS |
| **ML Specialists** | $\ge 3$ | **4** (Riya Shah, Kabir Patel, Neha Rao, Diya Patel) | PASS |
| **Feed Posts** | $\ge 10$ | **10** (Announcements, questions, opportunities) | PASS |
| **Communities** | $\ge 4$ | **6** (AI Club, ACM Chapter, Green Campus, etc.) | PASS |
| **Campus Events** | $\ge 4$ | **5** (AI Hackathon, PyTorch Workshop, Career Meet, etc.) | PASS |
| **Campus Facilities** | $\ge 6$ | **8** (Turing Hall, Library, Slurm Center, Clinic, etc.) | PASS |
| **Foreign Key Violations** | **0** | **0** | PASS |

---

## 4. Reset & Verification Script Architecture
- **Script Location:** `server/src/db/seed_demo_campus.ts`
- **Verification Location:** `server/src/db/verify_demo.ts`
- **Integrity Rule:** `verify_demo.ts` runs `PRAGMA foreign_key_check` and asserts strict inequality constraints. Any schema divergence immediately fails with non-zero exit code.
