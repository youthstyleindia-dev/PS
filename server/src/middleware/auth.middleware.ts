import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { JwtTokenPayload } from '../types/auth.types.js';
import { UserRole } from '../types/common.types.js';
import { getDb } from '../db/connection.js';
import crypto from 'crypto';

// Extend Express Request interface to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: JwtTokenPayload;
      rawToken?: string;
    }
  }
}

/**
 * Extracts and verifies JWT bearer token if present on request.
 * Does not reject requests without tokens (allows public endpoints).
 */
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
      // Token was explicitly revoked via logout or session kill
      return next();
    }

    req.user = payload;
    req.rawToken = token;
    next();
  } catch (err) {
    // Expired or invalid token; proceed without user so requireAuth can handle consistently
    next();
  }
}

/**
 * Enforces that a valid authenticated session exists.
 * Returns 401 Unauthorized if not authenticated.
 */
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

/**
 * Enforces Role-Based Access Control (RBAC).
 * Returns 403 Forbidden if the authenticated user's role does not match allowed roles.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.'
        }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of [${allowedRoles.join(', ')}] role clearances. Your role is '${req.user.role}'.`
        }
      });
      return;
    }

    next();
  };
}
