# Third-Party Dependencies, Open-Source Audits & Licensing Obligations

> **Project**: UniVerse — Intelligent, Sustainable, and Privacy-Aware Campus Ecosystem  
> **Audit Status**: Comprehensive Legal & Technical Verification Completed  

---

## 1. Candidate Open-Source Repositories Audit

| Repository | Evaluated Commit / Version | License Stated | Source URL | Code Action | Legal & Attribution Obligations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. ScholarOS** | Latest `main` (October 2026) | **MIT License** | `https://github.com/Harshit-Mudgal/ScholarOS` | **Adapted Concepts Only** | Preserve MIT copyright attribution where schemas or structures are referenced. No verbatim files copied. |
| **2. Proctora** | Latest `main` (October 2026) | **MIT License** | `https://github.com/amaanwarsi/Proctora` | **Event Taxonomy Adapted; Biometrics Rejected** | MIT copyright notice acknowledged. All facial/eye tracking and audio listening code explicitly excluded. |
| **3. Cloud Carbon Footprint** | v1.15.0 (October 2026) | **Apache License 2.0** | `https://github.com/cloud-carbon-footprint/cloud-carbon-footprint` | **Formulas & Coefficients Adapted** | Apache 2.0 attribution preserved. SPECpower CPU curve and PUE calculation formulas implemented in TypeScript with explicit attribution in code docstrings. |
| **4. Focuser** | v0.4.x (October 2026) | **GPL-3.0 / MIT Dual** | `https://github.com/aadeshrao123/Focuser` | **Independent Pattern Implementation** | URL sanitization pattern (`new URL().hostname`) and Pomodoro timer independently implemented in TypeScript. No Rust/C code copied, avoiding GPL copyleft contagion. |
| **5. ExMAS** | v1.2.0 (TU Delft Research) | **MIT / Research Non-Commercial** | `https://github.com/RafalKucharskiPK/ExMAS` | **Clean-Room Independent Algorithm (Zero Code Copied)** | Academic literature cited (Kucharski & Cats, 2020). Zero lines of ExMAS Python code copied, eliminating non-commercial research licensing liabilities. |

---

## 2. Production Direct Dependencies Audit

| Package Name | Installed Version | License | Purpose in UniVerse | Security & Maintenance Review |
| :--- | :--- | :--- | :--- | :--- |
| **`express`** | `^5.3.0` | MIT | Core HTTP API routing & centralized error handling | Stable Express 5 release; modern native Promise support. |
| **`better-sqlite3`** | `^13.0.3` | MIT | Embedded ACID relational storage in WAL mode | Synchronous, high-throughput, zero-dependency C++ SQLite wrapper. |
| **`bcryptjs`** | `^3.0.3` | MIT | Salted 10-round password hashing | Pure JavaScript implementation of OpenBSD Blowfish password hashing. Zero native compilation issues. |
| **`jsonwebtoken`** | `^9.0.3` | MIT | HMAC-SHA256 JWT access token signing & verification | Industry-standard JWT library with verified expiration claims. |
| **`cors`** | `^2.8.6` | MIT | Cross-Origin Resource Sharing middleware | Enables secure local development between frontend (5173) and backend (3001). |
| **`dotenv`** | `^18.0.9` | BSD-2-Clause | Environment variable management | Loads `.env` configuration securely without external network calls. |

---

## 3. Client Direct Dependencies Audit

| Package Name | Installed Version | License | Purpose in UniVerse |
| :--- | :--- | :--- | :--- |
| **`react`** / **`react-dom`** | `^19.0.0` | MIT | Declarative component UI engine |
| **`react-router-dom`** | `^7.1.5` | MIT | Client-side routing for public portal & authenticated app |
| **`lucide-react`** | `^1.16.0` | ISC | System and technical icons |
| **`recharts`** | `^2.15.0` | MIT | SVG charting library for sustainability & carbon telemetry |
| **`tailwindcss`** | `^4.0.0` | MIT | Utility-first CSS engine powering Google Stitch tokens |
| **`clsx`** / **`tailwind-merge`** | Latest | MIT | Conditional class concatenation |

---

## 4. Legal Compliance & Ethical Boundaries Statement

1. **Clean-Room Independent Implementation**:
   - The Dijkstra algorithm with detour envelope evaluation was designed and coded from first principles using standard textbook computer science data structures (`MinPriorityQueue`, adjacency list graph).
   - No ExMAS Python routines, solvers, or data files were cloned or translated line-by-line.
2. **Rejection of Invasive Biometrics**:
   - UniVerse explicitly rejects facial landmark tracking, eye gaze estimation, and continuous microphone eavesdropping.
   - The platform exclusively records non-invasive client DOM focus events and consented local bounding-box contours.
3. **Data Sovereignty & Local Storage**:
   - Zero commercial analytics tracking pixels, external CDNs with user-tracking beacons, or telemetry aggregators are embedded.
   - All state is stored locally in SQLite (`server/data/universe.db`) with client tokens maintained strictly in browser memory and `localStorage`.
