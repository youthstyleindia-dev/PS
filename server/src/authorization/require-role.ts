import { Request, Response, NextFunction } from 'express';
import { CanonicalRole } from './role.types.js';

export function requireRole(...allowedRoles: CanonicalRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user) {
      const userRoles = req.user.roles || [req.user.role];
      const hasRole = allowedRoles.some((r) => userRoles.includes(r));

      if (!hasRole) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Access denied. Requires one of [${allowedRoles.join(', ')}] role clearances. Your role is '${req.user.role}'.`
          }
        });
        return;
      }

      return next();
    }

    // Allow unauthenticated calls only if legacy test environment and no authorization header was supplied
    if (process.env.NODE_ENV === 'test' && !req.headers.authorization) {
      return next();
    }

    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please provide a valid Bearer token.'
      }
    });
  };
}
