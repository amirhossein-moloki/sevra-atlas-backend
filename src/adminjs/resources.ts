import { ResourceOptions } from 'adminjs';
import { prisma } from '../shared/db/prisma';
import bcrypt from 'bcrypt';
import sanitizeHtml from 'sanitize-html';
import { COMPONENTS } from './component-loader';

const sanitizeOptions = {
  allowedTags: ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br'],
  allowedAttributes: {
    // We can allow some basic classes if Tiptap uses them,
    // but for now let's keep it very strict.
  },
};

export const userResource = {
  resource: { model: prisma.user, client: prisma },
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
        before: async (request: any) => {
          if (request.payload.password) {
            request.payload.password = await bcrypt.hash(request.payload.password, 10);
          }
          return request;
        },
      },
      edit: {
        before: async (request: any) => {
          if (request.payload.password) {
            request.payload.password = await bcrypt.hash(request.payload.password, 10);
          } else {
            delete request.payload.password;
          }
          return request;
        },
      },
    },
  },
};

export const postResource = {
  resource: { model: prisma.post, client: prisma },
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
        before: async (request: any) => {
          if (request.payload.content) {
            request.payload.content = sanitizeHtml(request.payload.content, sanitizeOptions);
          }
          return request;
        },
      },
      edit: {
        before: async (request: any) => {
          if (request.payload.content) {
            request.payload.content = sanitizeHtml(request.payload.content, sanitizeOptions);
          }
          return request;
        },
      },
    },
  },
};

export const pageResource = {
  resource: { model: prisma.page, client: prisma },
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
        before: async (request: any) => {
          if (request.payload.content) {
            request.payload.content = sanitizeHtml(request.payload.content, sanitizeOptions);
          }
          return request;
        },
      },
      edit: {
        before: async (request: any) => {
          if (request.payload.content) {
            request.payload.content = sanitizeHtml(request.payload.content, sanitizeOptions);
          }
          return request;
        },
      },
    },
  },
};

export const commentResource = {
  resource: { model: prisma.comment, client: prisma },
  options: {
    navigation: { name: 'Blog', icon: 'Comment' },
    properties: {
      id: { isVisible: { edit: false } },
    },
  },
};
