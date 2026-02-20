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
