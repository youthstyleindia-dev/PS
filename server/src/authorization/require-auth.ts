import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthService } from '../services/auth.service.js';
import { getDb } from '../db/connection.js';
import { CanonicalRole } from './role.types.js';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return next();
  }

  try {
    const payload = AuthService.verifyToken(token);

    // Verify token is not revoked in active database sessions
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const db = getDb();
    const session = db.prepare(`
      SELECT is_revoked FROM auth_sessions
      WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP
    `).get(tokenHash) as { is_revoked: number } | undefined;

    if (session && session.is_revoked === 1) {
      return next();
    }

    // Load active assigned roles for the user
    try {
      const activeRoles = db.prepare(`
        SELECT role_key FROM role_assignments
        WHERE user_id = ? AND status = 'active'
      `).all(payload.sub) as Array<{ role_key: string }>;

      const roles = Array.from(new Set([
        payload.role,
        ...activeRoles.map(r => r.role_key as CanonicalRole)
      ]));

      payload.roles = roles;
    } catch {
      payload.roles = [payload.role];
    }

    req.user = payload;
    req.rawToken = token;
    next();
  } catch {
    next();
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please provide a valid Bearer token.'
      }
    });
    return;
  }
  next();
}
