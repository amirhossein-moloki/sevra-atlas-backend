import type { ActionRequest } from 'adminjs';
import bcrypt from 'bcrypt';
import sanitizeHtml from 'sanitize-html';
import { config } from '../config';

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
export const createResources = (prisma: any, COMPONENTS: any, getModelByName: any) => {
  return {
    userResource: {
      resource: { model: getModelByName('User'), client: prisma },
      options: {
        navigation: { name: 'Users', icon: 'User' },
        properties: {
          password: {
            type: 'password',
            isVisible: {
              list: false, edit: true, filter: false, show: false,
            },
          },
          id: { isVisible: { edit: false } },
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
        },
        actions: {
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
            handler: async (request, response, context) => {
              const { record, resource, currentAdmin } = context;
              if (request.method === 'get') {
                return { record: record.toJSON(currentAdmin) };
              }
              const { password } = request.payload;
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
                redirectUrl: resource.href({ actionName: 'show', recordId: record.id() }),
              };
            },
            component: COMPONENTS.SetPassword,
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
  };
};
