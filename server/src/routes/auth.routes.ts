import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { UserRole } from '../types/common.types.js';
import { getDb } from '../db/connection.js';

export const authRouter = Router();

/**
 * Helper to extract client IP and User Agent for security logging
 */
function getClientMeta(req: Request) {
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';
  return { ipAddress, userAgent };
}

/**
 * POST /api/auth/register
 * Create a new user account with secure password hashing and profile provisioning
 */
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const meta = getClientMeta(req);
    const result = await AuthService.register(req.body, meta);
    res.status(201).json({
      success: true,
      data: result,
      message: 'Account registered successfully'
    });
  } catch (err: any) {
    const isConflict = err.message && err.message.includes('already exists');
    res.status(isConflict ? 409 : 400).json({
      error: {
        code: isConflict ? 'CONFLICT' : 'BAD_REQUEST',
        message: err.message || 'Registration failed'
      }
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate with email and password, returning JWT access token
 */
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const meta = getClientMeta(req);
    const result = await AuthService.login(req.body, meta);
    res.status(200).json({
      success: true,
      data: result,
      message: 'Logged in successfully'
    });
  } catch (err: any) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: err.message || 'Invalid credentials'
      }
    });
  }
});

/**
 * POST /api/auth/login/:roleKey
 * Authenticate with email and password specifically for a role entry point.
 * Verifies password AND verifies the account actually has that role assigned.
 */
authRouter.post('/login/:roleKey', async (req: Request, res: Response): Promise<void> => {
  try {
    const meta = getClientMeta(req);
    const targetRole = req.params.roleKey as UserRole;
    const result = await AuthService.loginWithRole(req.body, targetRole, meta);
    res.status(200).json({
      success: true,
      data: result,
      message: `Logged in to ${targetRole} workspace successfully`
    });
  } catch (err: any) {
    if (err.code === 'ROLE_NOT_ASSIGNED') {
      res.status(403).json({
        error: {
          code: 'ROLE_NOT_ASSIGNED',
          message: err.message || 'Account is not assigned to the requested workspace'
        }
      });
      return;
    }
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: err.message || 'Invalid credentials'
      }
    });
  }
});

/**
 * POST /api/auth/demo-login
 * Direct authenticated persona login for hackathon evaluators
 */
authRouter.post('/demo-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const meta = getClientMeta(req);
    const role: UserRole = req.body.role || 'student';
    const result = await AuthService.demoLogin(role, meta);
    res.status(200).json({
      success: true,
      data: result,
      message: `Signed in as ${role} demo persona`
    });
  } catch (err: any) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: err.message || 'Demo login failed'
      }
    });
  }
});

/**
 * GET /api/auth/me
 * Fetch authenticated user details, permissions matrix, and profile
 */
authRouter.get('/me', requireAuth, (req: Request, res: Response): void => {
  try {
    const user = AuthService.getMe(req.user!.sub);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err: any) {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: err.message || 'User profile not found'
      }
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update profile details (department, cohort, focus goals, bio)
 */
authRouter.put('/profile', requireAuth, (req: Request, res: Response): void => {
  try {
    const updatedUser = AuthService.updateProfile(req.user!.sub, req.body);
    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (err: any) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: err.message || 'Failed to update profile'
      }
    });
  }
});

/**
 * POST /api/auth/logout
 * Revoke active session token
 */
authRouter.post('/logout', requireAuth, (req: Request, res: Response): void => {
  try {
    const meta = getClientMeta(req);
    AuthService.logout(req.user!.sub, req.rawToken, meta);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Logout failed'
      }
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change password after verifying current password
 */
authRouter.post('/change-password', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const meta = getClientMeta(req);
    await AuthService.changePassword(req.user!.sub, req.body, meta);
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err: any) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: err.message || 'Password change failed'
      }
    });
  }
});

/**
 * GET /api/auth/sessions
 * List active sessions for the authenticated user
 */
authRouter.get('/sessions', requireAuth, (req: Request, res: Response): void => {
  try {
    const sessions = AuthService.getUserSessions(req.user!.sub, req.rawToken);
    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Failed to retrieve sessions'
      }
    });
  }
});

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke a specific session
 */
authRouter.delete('/sessions/:sessionId', requireAuth, (req: Request, res: Response): void => {
  try {
    AuthService.revokeSession(req.user!.sub, String(req.params.sessionId));
    res.status(200).json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Failed to revoke session'
      }
    });
  }
});

/**
 * GET /api/auth/audit
 * Fetch recent security audit events
 */
authRouter.get('/audit', requireAuth, (req: Request, res: Response): void => {
  try {
    const isAdmin = req.user!.role === 'admin';
    const logs = AuthService.getAuthAuditLogs(isAdmin ? undefined : req.user!.sub, 25);
    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Failed to retrieve audit log'
      }
    });
  }
});

/**
 * POST /api/auth/roles/assign
 * Administrator endpoint to grant a canonical role to a user
 */
authRouter.post('/roles/assign', requireAuth, (req: Request, res: Response): void => {
  if (req.user!.role !== 'admin' && !(req.user!.roles && req.user!.roles.includes('admin'))) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Administrative clearance required to assign roles.'
      }
    });
    return;
  }

  const { userId, roleKey, reason } = req.body;
  if (!userId || !roleKey) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'userId and roleKey are required.' } });
    return;
  }

  const validRoles = ['student', 'driver', 'proctor', 'ta_faculty', 'warden', 'admin'];
  if (!validRoles.includes(roleKey)) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Invalid roleKey '${roleKey}'. Must be one of [${validRoles.join(', ')}].` } });
    return;
  }

  const db = getDb();
  const assignmentId = `ra_${userId}_${roleKey}_${Date.now()}`;
  db.prepare(`
    INSERT INTO role_assignments (id, user_id, role_key, status, granted_by_user_id, reason)
    VALUES (?, ?, ?, 'active', ?, ?)
    ON CONFLICT(user_id, role_key) DO UPDATE SET status = 'active', revoked_at = NULL, granted_at = CURRENT_TIMESTAMP
  `).run(assignmentId, userId, roleKey, req.user!.sub, reason || 'Granted by administrator');

  AuthService.logAuthEvent('ROLE_GRANTED' as any, req.user!.email, {
    userId,
    metadata: { assignedRole: roleKey, grantedBy: req.user!.sub, reason }
  });

  res.status(200).json({
    success: true,
    message: `Role '${roleKey}' successfully assigned to user '${userId}'.`
  });
});

/**
 * POST /api/auth/roles/revoke
 * Administrator endpoint to revoke a role assignment
 */
authRouter.post('/roles/revoke', requireAuth, (req: Request, res: Response): void => {
  if (req.user!.role !== 'admin' && !(req.user!.roles && req.user!.roles.includes('admin'))) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Administrative clearance required to revoke roles.'
      }
    });
    return;
  }

  const { userId, roleKey } = req.body;
  if (!userId || !roleKey) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'userId and roleKey are required.' } });
    return;
  }

  const db = getDb();
  db.prepare(`
    UPDATE role_assignments
    SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND role_key = ?
  `).run(userId, roleKey);

  AuthService.logAuthEvent('ROLE_REVOKED' as any, req.user!.email, {
    userId,
    metadata: { revokedRole: roleKey, revokedBy: req.user!.sub }
  });

  res.status(200).json({
    success: true,
    message: `Role '${roleKey}' successfully revoked from user '${userId}'.`
  });
});

/**
 * GET /api/auth/users
 * Administrator user directory search & management
 */
authRouter.get('/users', requireAuth, (req: Request, res: Response): void => {
  if (req.user!.role !== 'admin' && !(req.user!.roles && req.user!.roles.includes('admin'))) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Administrative clearance required to inspect user directory.'
      }
    });
    return;
  }

  const { query, role, limit = '50' } = req.query as Record<string, string>;
  const db = getDb();
  const numLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

  const conditions: string[] = [];
  const params: any[] = [];

  if (role) {
    conditions.push('u.role = ?');
    params.push(role);
  }

  if (query && query.trim()) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.department LIKE ?)');
    const wild = `%${query.trim()}%`;
    params.push(wild, wild, wild);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT u.id, u.name, u.email, u.avatar, u.role, u.department, u.year_of_study, u.is_active, u.created_at,
           GROUP_CONCAT(ra.role_key) as assigned_roles
    FROM users u
    LEFT JOIN role_assignments ra ON u.id = ra.user_id AND ra.status = 'active'
    ${whereClause}
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT ?
  `;
  params.push(numLimit);

  const users = db.prepare(sql).all(...params) as any[];

  res.status(200).json({
    success: true,
    data: {
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        role: u.role,
        assignedRoles: u.assigned_roles ? Array.from(new Set(u.assigned_roles.split(','))) : [u.role],
        department: u.department,
        yearOfStudy: u.year_of_study,
        isActive: Boolean(u.is_active),
        createdAt: u.created_at
      })),
      total: users.length
    }
  });
});
