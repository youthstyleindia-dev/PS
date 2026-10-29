import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { UserRole } from '../types/common.types.js';

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
