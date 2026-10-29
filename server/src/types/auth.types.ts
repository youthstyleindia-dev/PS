import { UserRole, CanonicalRole } from './common.types.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles?: UserRole[];
  avatar?: string;
  department?: string;
  year_of_study?: number;
  bio?: string;
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
}

export interface JwtTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  roles?: UserRole[];
  name: string;
  department?: string;
  iat?: number;
  exp?: number;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  department?: string;
  year_of_study?: number;
  bio?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: string;
  isRevoked: boolean;
  createdAt: string;
  isCurrent?: boolean;
}

export interface AuthResponse {
  token: string;
  expiresIn: number; // in seconds
  user: AuthUser;
  session?: {
    id: string;
    expiresAt: string;
    userId?: string;
    isRevoked?: boolean;
    createdAt?: string;
  };
}

export type AuthEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_CHANGE'
  | 'REGISTER'
  | 'REGISTER_SUCCESS'
  | 'ROLE_DENIED'
  | 'TOKEN_REVOKED'
  | 'ROLE_GRANTED'
  | 'ROLE_REVOKED'
  | 'SESSION_REVOKED'
  | (string & {});

export type AuthAuditLogItem = AuthAuditEntry;

export interface AuthAuditEntry {
  id: string;
  userId?: string;
  email: string;
  eventType: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
