import { Request, Response, NextFunction } from 'express';
import { Permission, CanonicalRole } from './role.types.js';
import { hasAnyPermission } from './permissions.js';

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user) {
      const userRoles = (req.user.roles || [req.user.role]) as CanonicalRole[];
      const permitted = hasAnyPermission(userRoles, permission);

      if (!permitted) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Access denied. Missing required permission '${permission}'.`
          }
        });
        return;
      }

      return next();
    }

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
