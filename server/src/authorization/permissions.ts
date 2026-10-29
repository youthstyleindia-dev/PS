import { CanonicalRole, Permission, ROLE_PERMISSIONS, LEGACY_ROLE_MAP } from './role.types.js';

export function normalizeRole(role: string): CanonicalRole {
  const clean = (role || '').toLowerCase().trim();
  const normalized = LEGACY_ROLE_MAP[clean];
  if (!normalized) {
    throw new Error(`UNKNOWN_ROLE: Role '${role}' is not a recognized canonical campus role.`);
  }
  return normalized;
}

export function isValidRole(role: string): role is CanonicalRole {
  return role in LEGACY_ROLE_MAP;
}

export function hasPermission(role: CanonicalRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

export function hasAnyPermission(roles: CanonicalRole[], permission: Permission): boolean {
  return roles.some((role) => hasPermission(role, permission));
}

export function getPermissionsForRole(role: CanonicalRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
