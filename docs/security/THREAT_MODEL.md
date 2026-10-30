# UniVerse Security Architecture & Threat Model

## 1. Threat Landscape & Security Perimeter

UniVerse operates as an integrated campus operating system managing student academic evaluations, focus wellbeing data, transit pooling, and proctored examination logs. As an on-premise collegiate deployment, it faces distinctive adversarial threats:

1. **Student Horizontal Privilege Escalation**: Students attempting to manipulate peers' academic milestones, alter carpooling manifests, or access confidential mentor messages.
2. **Vertical Privilege Escalation**: Non-administrative users attempting to assign proctor or admin roles by tampering with client storage or request parameters.
3. **Surveillance & Facial Telemetry Misuse**: Commercial proctoring tools abusing webcam feeds.
4. **Differential Privacy Reconstruction Attacks**: Malicious actors querying aggregate focus metrics to infer individual study habits.
5. **Prompt Injection & AI Poisoning**: Students crafting adversarial inputs to trick the Campus Copilot into granting unauthorized permissions.

---

## 2. STRIDE Threat Analysis Matrix

| Threat Category | Specific Attack Vector | System Defense Implemented | Verification Test |
|---|---|---|---|
| **Spoofing Identity** | Attacker crafts forged JWT or alters token payload | HMAC-SHA256 signature verification with ephemeral server secret. Token revocation list on logout. | `tests/unit/auth.test.ts` |
| **Tampering with Data** | Student sends PATCH request to update exam observation resolution | Server RBAC guard (`requireAuth` + `requireRole('proctor', 'admin')`). Client dropdown changes have zero server effect. | `tests/security/role_matrix.test.ts` |
| **Repudiation** | Proctor disqualifies student without written justification | Mandatory written rationale enforced at database constraint level. Dual-signed audit trail. | `tests/integration/exam_monitor_api.test.ts` |
| **Information Disclosure** | Competitor queries raw study durations to de-anonymize student | Laplace Differential Privacy ($\epsilon = 0.80, \Delta f = 1.0$) injected onto focus cohort queries. | `tests/unit/privacy_dp.test.ts` |
| **Denial of Service** | Driver overbooks carpool capacity (sybil request flooding) | Atomic SQLite transaction locking with `CHECK(available_seats >= 0)` capacity constraint. | `tests/adversarial/m2_stress_challenge.test.ts` |
| **Elevation of Privilege** | Student sends `POST /api/auth/register` with `{ role: 'admin' }` | Role parameter strictly filtered: all public registrations default unconditionally to `'student'`. | `tests/security/audit_remediation.test.ts` |

---

## 3. Negative Authorization Test Suite

Security cannot be verified by positive tests alone. UniVerse maintains dedicated negative authorization suites:

- `tests/security/role_matrix.test.ts`: Verifies 25 negative access boundaries across student, driver, proctor, faculty, warden, and admin roles.
- `tests/security/role_isolation_matrix.test.ts`: Verifies workspace boundary isolation ensuring roles cannot query or alter foreign domain records.
- `tests/adversarial/m1_stress_challenge.test.ts`: Stress tests SQL injection, buffer overruns, and malformed inputs.
- `tests/adversarial/m2_stress_challenge.test.ts`: Stress tests Dijkstra edge congestion manipulation and detour ceiling enforcement.
