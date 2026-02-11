import { UserRole } from '@prisma/client';

/**
 * Centralized role definitions and groupings to avoid heterogeneity in RBAC.
 */

export const Roles = UserRole;

export const STAFF_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.MODERATOR];
export const ADMIN_ONLY: UserRole[] = [UserRole.ADMIN];

export const isStaff = (role?: UserRole): boolean => {
  return !!role && STAFF_ROLES.includes(role);
};

export const isAdmin = (role?: UserRole): boolean => {
  return role === UserRole.ADMIN;
};

export const isModerator = (role?: UserRole): boolean => {
  return role === UserRole.MODERATOR;
};
