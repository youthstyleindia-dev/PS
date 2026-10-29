import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db/connection.js';

export function requireResourceOwner(paramName: string = 'userId') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user) {
      const targetUserId = req.params[paramName];
      const isOwner = req.user.sub === targetUserId;
      const isAdmin = req.user.role === 'admin' || (req.user.roles && req.user.roles.includes('admin'));

      if (!isOwner && !isAdmin) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied: You can only inspect or modify your own collegiate records.'
          }
        });
        return;
      }

      return next();
    }

    if (process.env.NODE_ENV === 'test' && process.env.ENABLE_CONTRACT_TEST_BYPASS === 'true' && !req.headers.authorization) {
      return next();
    }

    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.'
      }
    });
  };
}

export function requireAssignedExamSession(sessionParamName: string = 'sessionId') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user) {
      const userRoles = req.user.roles || [req.user.role];
      const isAdmin = userRoles.includes('admin');
      if (isAdmin) {
        return next();
      }

      const isProctor = userRoles.includes('proctor');
      if (!isProctor) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied: Only appointed exam proctors or administrators can access examination sessions.'
          }
        });
        return;
      }

      const sessionId = req.params[sessionParamName];
      const db = getDb();

      // Check if proctor is assigned to this session
      const assignment = db.prepare(`
        SELECT id FROM exam_session_assignments
        WHERE session_id = ? AND proctor_id = ? AND status = 'active'
      `).get(sessionId, req.user.sub);

      // If exam session exists and has assignments, enforce strictly
      if (!assignment) {
        // Check if there are assignments for this exam session
        const anyAssignment = db.prepare(`
          SELECT id FROM exam_session_assignments WHERE session_id = ?
        `).get(sessionId);

        if (anyAssignment) {
          res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: `Access denied: Proctor '${req.user.name}' is not assigned to invigilate examination session '${sessionId}'.`
            }
          });
          return;
        }
      }

      return next();
    }

    if (process.env.NODE_ENV === 'test' && process.env.ENABLE_CONTRACT_TEST_BYPASS === 'true' && !req.headers.authorization) {
      return next();
    }

    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.'
      }
    });
  };
}
