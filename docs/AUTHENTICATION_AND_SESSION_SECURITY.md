# UniVerse — Authentication & Session Security Architecture

> **Document Version:** 2.0.0  
> **Security Standards:** RFC 7519 (JWT), NIST SP 800-63B, OWASP ASVS Level 2  

---

## 1. Authentication Topology & Core Architecture

UniVerse implements a hybrid authentication and session management architecture providing stateless JWT verification for low latency alongside stateful server-side revocation tracking.

```
+-----------------------------------------------------------------------------------+
|                                 Client Request                                    |
|              Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...                |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                      Express Middleware: `requireAuth`                             |
|  1. Verify JWT signature using HMAC-SHA256 & system secret                        |
|  2. Check token expiration (`exp`)                                                |
|  3. Compute SHA-256 hash of token string                                          |
|  4. Query `auth_sessions`: verify session exists & `is_revoked = 0`                |
|  5. Attach verified payload to `req.user`                                          |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|               Role & Permission Gates: `requireRole(roles)`                       |
|  1. Check if `req.user.role` matches allowed roles                                |
|  2. If user has multi-role array, check if any `req.user.roles` matches          |
|  3. Enforce resource ownership checks (e.g. `req.user.sub === req.params.userId`) |
+-----------------------------------------------------------------------------------+
```

---

## 2. Token Specification & Claims

JWT tokens are signed using `HMAC-SHA256` with a minimum 256-bit entropy secret key (`JWT_SECRET`).

### Standard Claims Payload
```json
{
  "sub": "usr_student_1",
  "email": "aarav.sharma@campus.edu",
  "name": "Aarav Sharma",
  "role": "student",
  "roles": ["student"],
  "department": "Computer Science & Engineering",
  "iat": 1730248000,
  "exp": 1730852800
}
```

### Claim Definitions
- `sub`: Canonical user ID in the database. Used for all resource ownership checks.
- `role`: The active persona under which the user authenticated for this session.
- `roles`: Comprehensive array of all active roles assigned to this account (`users.role` + active `role_assignments`).
- `iat`: Issued At timestamp (Unix epoch seconds).
- `exp`: Expiration timestamp (7 days = 604,800 seconds).

---

## 3. Stateful Session Security & Revocation

To prevent orphan token misuse upon logout or administrative account suspension:

1. **Token Digest Storage**: When a token is issued, its SHA-256 hash is stored in `auth_sessions`:
   ```sql
   INSERT INTO auth_sessions (id, user_id, token_hash, user_agent, ip_address, expires_at, is_revoked)
   VALUES (?, ?, ?, ?, ?, ?, 0);
   ```
2. **Revocation Check**: Every incoming authenticated request checks if the token hash is marked revoked (`is_revoked = 1`).
3. **Instant Logout (`POST /api/auth/logout`)**: Updates `auth_sessions` setting `is_revoked = 1`, immediately terminating the session across all microservices.

---

## 4. Role-Specific Authentication Entry Points

To ensure strict role separation, UniVerse provides dedicated entry points for each persona:

### Endpoint: `POST /api/auth/login/:roleKey`
- **Supported Role Keys**: `student`, `driver`, `proctor`, `ta_faculty`, `warden`, `admin`.
- **Enforcement Logic**:
  1. Authenticates user email and password against stored bcrypt hash.
  2. Resolves all active roles for the user from `users.role` and `role_assignments`.
  3. Verifies that the requested `:roleKey` is explicitly assigned to this user.
  4. If assigned, issues a token with `role: roleKey` and `roles: [...]`.
  5. If NOT assigned, rejects with `403 Forbidden` (`FORBIDDEN_ROLE_ACCESS`) and logs an audit failure.

### Example Rejection Response:
```json
{
  "error": {
    "code": "FORBIDDEN_ROLE_ACCESS",
    "message": "User 'aarav.sharma@campus.edu' does not possess verified clearance for role 'proctor'. Your registered roles: [student]."
  }
}
```

---

## 5. Defense Against Privilege Escalation

### Public Registration Hardening
When users self-register via `POST /api/auth/register`:
- Any client-submitted `role` field (e.g. attempting to send `{"role": "admin"}`) is neutralized.
- The server unconditionally assigns `role = 'student'`.
- A single active student role assignment is created in `role_assignments`.
- This completely prevents unauthorized creation of administrator, proctor, or driver accounts.

### Administrative Role Management
Only authenticated users with `role: 'admin'` or `roles: ['admin']` can grant or revoke roles:
- `POST /api/auth/roles/assign`: Assigns a new role key to a user, with audit logging.
- `POST /api/auth/roles/revoke`: Revokes an existing role assignment, triggering audit logging.
