import type { ActionContext, ActionRequest, ActionResponse } from 'adminjs';
import bcrypt from 'bcrypt';
import sanitizeHtml from 'sanitize-html';
import { config } from '../config';
import { recordAuditLog } from '../shared/utils/audit';

const sanitizeOptions = {
  allowedTags: ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br'],
  allowedAttributes: {
  },
};

/**
 * Creates AdminJS resource definitions.
 * Using a factory function to avoid static imports of ESM-only dependencies
 * and to receive injected components.
 */
/**
 * Helper to wrap an AdminJS action with audit logging.
 */
const withAudit = (actionName: string, resourceId: string) => {
  return {
    after: async (response: ActionResponse, request: ActionRequest, context: ActionContext) => {
      const { currentAdmin, record } = context;
      // We only log successful POST requests (mutations)
      if (request.method === 'post' && response.record && !response.record.errors) {
        // Cast to any because the Express adapter augments ActionRequest with headers and ip at runtime,
        // but these are not present in the base ActionRequest type.
        const req = request as any;
        await recordAuditLog({
          userId: currentAdmin?.id ? BigInt(currentAdmin.id) : undefined,
          action: actionName.toUpperCase(),
          entityType: resourceId,
          entityId: record?.id()?.toString(),
          payload: request.payload,
          ip: req.headers?.['x-forwarded-for']?.toString() || req.ip,
          userAgent: req.headers?.['user-agent']?.toString(),
        });
      }
      return response;
    },
  };
};

export const createResources = (prisma: any, COMPONENTS: any, getModelByName: any) => {
  const userModel = getModelByName('User');

  const commonUserProperties = {
    password: {
      type: 'password',
      isVisible: {
        list: false, edit: true, filter: false, show: false,
      },
    },
    id: { isVisible: { edit: false } },
    email: { label: 'Email' },
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
        edit: ({ currentAdmin }: any) => currentAdmin?.role === 'SUPER_ADMIN',
        list: true, show: true, filter: true
      },
    },
  };

  const commonUserActions = {
    new: {
      before: async (request: ActionRequest) => {
        if (request.payload?.password) {
          request.payload.password = await bcrypt.hash(request.payload.password, config.security.bcryptRounds);
        }
        return request;
      },
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
    },
    setPassword: {
      actionType: 'record',
      icon: 'Password',
      isAccessible: ({ currentAdmin, record }: any) => {
        // Super admin can change anyone's password
        if (currentAdmin?.role === 'SUPER_ADMIN') return true;
        // Admin can change non-admin/non-superadmin passwords
        if (currentAdmin?.role === 'ADMIN' && record?.params.role !== 'ADMIN' && record?.params.role !== 'SUPER_ADMIN') return true;
        return false;
      },
      handler: async (request: ActionRequest, response: ActionResponse, context: ActionContext) => {
        const { record, resource, currentAdmin } = context;
        if (!record) {
          throw new Error('Record not found');
        }
        if (request.method === 'get') {
          return { record: record.toJSON(currentAdmin) };
        }
        const payload = request.payload || {};
        const { password } = payload;
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
    userResource: {
      resource: { model: userModel, client: prisma },
      options: {
        id: 'Users',
        navigation: { name: 'User Management', icon: 'User' },
        properties: commonUserProperties,
        actions: {
          ...commonUserActions,
          new: { ...commonUserActions.new, ...withAudit('create', 'User') },
          edit: { ...commonUserActions.edit, ...withAudit('update', 'User') },
          delete: { ...withAudit('delete', 'User') },
          list: {
            before: async (request: ActionRequest) => {
              // Default to regular users if no filter is applied
              if (!request.query || !Object.keys(request.query).some(k => k.startsWith('filter.'))) {
                request.query = {
                  ...request.query,
                  'filter.role': 'USER',
                };
              }
              return request;
            },
          },
        },
      },
    },

    adminResource: {
      resource: { model: userModel, client: prisma },
      options: {
        id: 'Admins',
        navigation: { name: 'User Management', icon: 'User' },
        properties: commonUserProperties,
        actions: {
          ...commonUserActions,
          new: { ...commonUserActions.new, ...withAudit('create', 'Admin') },
          edit: { ...commonUserActions.edit, ...withAudit('update', 'Admin') },
          delete: { ...withAudit('delete', 'Admin') },
          list: {
            before: async (request: ActionRequest) => {
              // Default to admins if no filter is applied
              if (!request.query || !Object.keys(request.query).some(k => k.startsWith('filter.'))) {
                request.query = {
                  ...request.query,
                  'filter.role': 'ADMIN',
                };
              }
              return request;
            },
          },
        },
      },
    },

    postResource: {
      resource: { model: getModelByName('Post'), client: prisma },
      options: {
        navigation: { name: 'Blog', icon: 'Document' },
        properties: {
          content: {
            components: {
              edit: COMPONENTS.RichTextEditor,
            },
          },
          id: { isVisible: { edit: false } },
        },
        actions: {
          new: {
            before: async (request: ActionRequest) => {
              if (request.payload?.content) {
                request.payload.content = sanitizeHtml(request.payload.content, sanitizeOptions);
              }
              return request;
            },
          },
          edit: {
            before: async (request: ActionRequest) => {
              if (request.payload?.content) {
                request.payload.content = sanitizeHtml(request.payload.content, sanitizeOptions);
              }
              return request;
            },
          },
        },
      },
    },

    pageResource: {
      resource: { model: getModelByName('Page'), client: prisma },
      options: {
        navigation: { name: 'Blog', icon: 'Book' },
        properties: {
          content: {
            components: {
              edit: COMPONENTS.RichTextEditor,
            },
          },
          id: { isVisible: { edit: false } },
        },
        actions: {
          new: {
            before: async (request: ActionRequest) => {
              if (request.payload?.content) {
                request.payload.content = sanitizeHtml(request.payload.content, sanitizeOptions);
              }
              return request;
            },
          },
          edit: {
            before: async (request: ActionRequest) => {
              if (request.payload?.content) {
                request.payload.content = sanitizeHtml(request.payload.content, sanitizeOptions);
              }
              return request;
            },
          },
        },
      },
    },

    commentResource: {
      resource: { model: getModelByName('Comment'), client: prisma },
      options: {
        navigation: { name: 'Blog', icon: 'Comment' },
        properties: {
          id: { isVisible: { edit: false } },
        },
      },
    },

    salonResource: {
      resource: { model: getModelByName('Salon'), client: prisma },
      options: {
        navigation: { name: 'Directory', icon: 'Home' },
        properties: {
          id: { isVisible: { edit: false } },
          visibilityScore: { isVisible: { edit: false } },
          avgRating: { isVisible: { edit: false } },
          reviewCount: { isVisible: { edit: false } },
        },
        actions: {
          new: { ...withAudit('create', 'Salon') },
          edit: { ...withAudit('update', 'Salon') },
          delete: { ...withAudit('delete', 'Salon') },
        },
      },
    },

    artistResource: {
      resource: { model: getModelByName('Artist'), client: prisma },
      options: {
        navigation: { name: 'Directory', icon: 'UserCheck' },
        properties: {
          id: { isVisible: { edit: false } },
          visibilityScore: { isVisible: { edit: false } },
          avgRating: { isVisible: { edit: false } },
          reviewCount: { isVisible: { edit: false } },
        },
        actions: {
          new: { ...withAudit('create', 'Artist') },
          edit: { ...withAudit('update', 'Artist') },
          delete: { ...withAudit('delete', 'Artist') },
        },
      },
    },

    paymentResource: {
      resource: { model: getModelByName('Payment'), client: prisma },
      options: {
        navigation: { name: 'Billing', icon: 'CreditCard' },
        properties: {
          id: { isVisible: { edit: false } },
          idempotencyKey: { isVisible: { edit: false } },
          providerTrackId: { isVisible: { list: true, filter: true, show: true, edit: false } },
        },
        actions: {
          new: { isAccessible: false },
          delete: {
            ...withAudit('delete', 'Payment'),
            isAccessible: ({ currentAdmin }: any) => currentAdmin?.role === 'SUPER_ADMIN',
          },
        },
      },
    },

    verificationResource: {
      resource: { model: getModelByName('VerificationRequest'), client: prisma },
      options: {
        navigation: { name: 'Directory', icon: 'CheckSquare' },
        properties: {
          id: { isVisible: { edit: false } },
        },
        actions: {
          new: { ...withAudit('create', 'VerificationRequest') },
          edit: { ...withAudit('update', 'VerificationRequest') },
          delete: { ...withAudit('delete', 'VerificationRequest') },
        },
      },
    },
  };
};
