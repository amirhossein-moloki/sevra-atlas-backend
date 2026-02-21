import type { ActionContext } from 'adminjs';

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  AUTHOR = 'AUTHOR',
  USER = 'USER',
}

export const hasRole = (context: ActionContext, roles: string[]) => {
  const { currentAdmin } = context;
  return currentAdmin && roles.includes(currentAdmin.role);
};

export const isSuperAdmin = (context: ActionContext) => hasRole(context, [Role.SUPER_ADMIN]);
export const isAdmin = (context: ActionContext) => hasRole(context, [Role.SUPER_ADMIN, Role.ADMIN]);
export const isModerator = (context: ActionContext) => hasRole(context, [Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR]);

export const canManageUsers = (context: ActionContext) => isAdmin(context);
export const canManageBilling = (context: ActionContext) => isAdmin(context);
export const canManageSystem = (context: ActionContext) => isSuperAdmin(context);
export const canManageDirectory = (context: ActionContext) => isModerator(context);
export const canManageBlog = (context: ActionContext) => hasRole(context, [Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR, Role.AUTHOR]);
