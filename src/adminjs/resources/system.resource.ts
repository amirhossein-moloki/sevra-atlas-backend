import type { ResourceOptions, ActionContext } from 'adminjs';
import { canManageSystem, isSuperAdmin } from '../utils/permissions';

export const createAuditLogResource = (prisma: any, COMPONENTS: any, getModelByName: any) => ({
  resource: { model: getModelByName('AuditLog'), client: prisma },
  options: {
    navigation: { name: 'System', icon: 'Settings' },
    properties: {
      id: { isVisible: { edit: false } },
      payload: { type: 'mixed', isVisible: { list: false, filter: false, show: true, edit: false } },
      createdAt: { isVisible: { edit: false, list: true, show: true, filter: true } },
    },
    actions: {
      isAccessible: (context: ActionContext) => canManageSystem(context),
      new: { isAccessible: false },
      edit: { isAccessible: false },
      delete: { isAccessible: (context: ActionContext) => isSuperAdmin(context) },
    },
  } as ResourceOptions,
});
