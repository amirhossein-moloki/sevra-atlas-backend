import type { ResourceOptions, ActionRequest, ActionResponse, ActionContext } from 'adminjs';
import bcrypt from 'bcrypt';
import { config } from '../../config';
import { withAudit, exportCsv, softDelete, restore, filterSoftDeleted } from '../utils/actions';
import { isAdmin, isSuperAdmin, canManageUsers } from '../utils/permissions';

export const createUserResource = (prisma: any, COMPONENTS: any, getModelByName: any) => {
  const model = getModelByName('User');

  const commonUserProperties = {
    password: {
      type: 'password',
      isVisible: {
        list: false, edit: true, filter: false, show: false,
      },
    },
    id: { isVisible: { edit: false } },
    email: { label: 'Email' },
    status: {
      availableValues: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'SUSPENDED', label: 'Suspended' },
        { value: 'DELETED', label: 'Deleted' },
      ],
    },
    role: {
      availableValues: [
        { value: 'USER', label: 'User' },
        { value: 'SALON', label: 'Salon' },
        { value: 'ARTIST', label: 'Artist' },
        { value: 'AUTHOR', label: 'Author' },
        { value: 'MODERATOR', label: 'Moderator' },
        { value: 'ADMIN', label: 'Admin' },
        { value: 'SUPER_ADMIN', label: 'Super Admin' },
      ],
      isVisible: {
        edit: (context: any) => isSuperAdmin(context),
        list: true, show: true, filter: true
      },
    },
    createdAt: { isVisible: { edit: false, list: true, show: true, filter: true } },
    updatedAt: { isVisible: { edit: false, list: false, show: true, filter: true } },
    deletedAt: { isVisible: { edit: false, list: false, show: true, filter: true } },
  };

  const commonUserActions = {
    isAccessible: (context: ActionContext) => canManageUsers(context),
    new: {
      before: async (request: ActionRequest) => {
        if (request.payload?.password) {
          request.payload.password = await bcrypt.hash(request.payload.password, config.security.bcryptRounds);
        }
        return request;
      },
      ...withAudit('create', 'User'),
    },
    edit: {
      before: async (request: ActionRequest) => {
        if (request.payload?.password) {
          request.payload.password = await bcrypt.hash(request.payload.password, config.security.bcryptRounds);
        } else if (request.payload) {
          delete request.payload.password;
        }
        return request;
      },
      ...withAudit('update', 'User'),
    },
    delete: {
      ...withAudit('delete', 'User'),
      isAccessible: (context: ActionContext) => isSuperAdmin(context),
    },
    softDelete,
    restore,
    setPassword: {
      actionType: 'record' as const,
      icon: 'Password',
      isAccessible: (context: ActionContext) => {
        const { currentAdmin, record } = context;
        if (isSuperAdmin(context)) return true;
        if (isAdmin(context) && record?.params.role !== 'ADMIN' && record?.params.role !== 'SUPER_ADMIN') return true;
        return false;
      },
      handler: async (request: ActionRequest, response: ActionResponse, context: ActionContext) => {
        const { record, resource, currentAdmin } = context;
        if (!record) throw new Error('Record not found');
        if (request.method === 'get') return { record: record.toJSON(currentAdmin) };

        const { password } = request.payload || {};
        if (!password || password.length < 6) {
          return {
            record: record.toJSON(currentAdmin),
            notice: { message: 'Password must be at least 6 characters long', type: 'error' },
          };
        }
        const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);
        await record.update({ password: hashedPassword });
        return {
          record: record.toJSON(currentAdmin),
          notice: { message: 'Password updated successfully', type: 'success' },
          redirectUrl: (resource as any).href({ actionName: 'show', recordId: record.id() }),
        };
      },
      component: COMPONENTS.SetPassword,
    },
  };

  return {
    resource: { model, client: prisma },
    options: {
      id: 'Users',
      navigation: { name: 'User Management', icon: 'User' },
      properties: commonUserProperties,
      actions: {
        ...commonUserActions,
        exportCsv,
        bulkActivate: {
          actionType: 'bulk',
          icon: 'Check',
          handler: async (request: ActionRequest, response: ActionResponse, context: ActionContext) => {
            const { records, resource } = context;
            if (!records || !records.length) return { notice: { message: 'No records selected', type: 'error' } };
            await Promise.all(records.map((record: any) => record.update({ status: 'ACTIVE' })));
            return {
              notice: { message: `Activated ${records.length} users`, type: 'success' },
              redirectUrl: (resource as any).href({ actionName: 'list' }),
            };
          },
        },
        bulkSuspend: {
          actionType: 'bulk',
          icon: 'Stop',
          handler: async (request: ActionRequest, response: ActionResponse, context: ActionContext) => {
            const { records, resource } = context;
            if (!records || !records.length) return { notice: { message: 'No records selected', type: 'error' } };
            await Promise.all(records.map((record: any) => record.update({ status: 'SUSPENDED' })));
            return {
              notice: { message: `Suspended ${records.length} users`, type: 'success' },
              redirectUrl: (resource as any).href({ actionName: 'list' }),
            };
          },
        },
        list: {
          before: async (request: ActionRequest) => {
            const query = request.query || {};
            if (!Object.keys(query).some(k => k.startsWith('filter.role'))) {
              request.query = { ...query, 'filter.role': 'USER' };
            }
            return filterSoftDeleted.before(request);
          },
        },
      },
    } as any,
  };
};

export const createAdminResource = (prisma: any, COMPONENTS: any, getModelByName: any) => {
  const userResource = createUserResource(prisma, COMPONENTS, getModelByName);
  return {
    ...userResource,
    options: {
      ...userResource.options,
      id: 'Admins',
      actions: {
        ...userResource.options.actions,
        list: {
          before: async (request: ActionRequest) => {
            if (!request.query || !Object.keys(request.query).some(k => k.startsWith('filter.'))) {
              request.query = { ...request.query, 'filter.role': 'ADMIN' };
            }
            return request;
          },
        },
      },
    },
  };
};
