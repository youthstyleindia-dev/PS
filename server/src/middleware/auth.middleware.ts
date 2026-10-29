import { Request, Response, NextFunction } from 'express';
import { JwtTokenPayload } from '../types/auth.types.js';
import { CanonicalRole, Permission } from '../authorization/role.types.js';
import {
  authenticate,
  requireAuth
} from '../authorization/require-auth.js';
import { requireRole } from '../authorization/require-role.js';
import { requirePermission } from '../authorization/require-permission.js';
import {
  requireResourceOwner,
  requireAssignedExamSession
} from '../authorization/resource-scope.js';

// Extend Express Request interface to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: JwtTokenPayload;
      rawToken?: string;
    }
  }
}

export {
  authenticate,
  requireAuth,
  requireRole,
  requirePermission,
  requireResourceOwner,
  requireAssignedExamSession
};
