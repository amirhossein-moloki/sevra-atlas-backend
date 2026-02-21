import type { ActionRequest, ActionContext, ResourceOptions } from 'adminjs';
import sanitizeHtml from 'sanitize-html';
import { withAudit, filterSoftDeleted, softDelete, restore } from '../utils/actions';
import { canManageBlog, isModerator } from '../utils/permissions';

const sanitizeOptions = {
  allowedTags: ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br'],
  allowedAttributes: {},
};

export const createPostResource = (prisma: any, COMPONENTS: any, getModelByName: any) => ({
  resource: { model: getModelByName('Post'), client: prisma },
  options: {
    navigation: { name: 'Blog', icon: 'Document' },
    properties: {
      content: { components: { edit: COMPONENTS.RichTextEditor } },
      id: { isVisible: { edit: false } },
    },
    actions: {
      isAccessible: (context: ActionContext) => canManageBlog(context),
      new: {
        before: async (request: ActionRequest) => {
          if (request.payload?.content) {
            request.payload.content = sanitizeHtml(request.payload.content, sanitizeOptions);
          }
          return request;
        },
        ...withAudit('create', 'Post'),
      },
      edit: {
        before: async (request: ActionRequest) => {
          if (request.payload?.content) {
            request.payload.content = sanitizeHtml(request.payload.content, sanitizeOptions);
          }
          return request;
        },
        ...withAudit('update', 'Post'),
      },
      delete: { ...withAudit('delete', 'Post') },
      softDelete,
      restore,
      list: {
        before: async (request: ActionRequest) => {
           return filterSoftDeleted.before(request);
        }
      },
    },
  } as ResourceOptions,
});

export const createPageResource = (prisma: any, COMPONENTS: any, getModelByName: any) => ({
  resource: { model: getModelByName('Page'), client: prisma },
  options: {
    navigation: { name: 'Blog', icon: 'Book' },
    properties: {
      content: { components: { edit: COMPONENTS.RichTextEditor } },
      id: { isVisible: { edit: false } },
    },
    actions: {
      isAccessible: (context: ActionContext) => canManageBlog(context),
      new: {
        before: async (request: ActionRequest) => {
          if (request.payload?.content) {
            request.payload.content = sanitizeHtml(request.payload.content, sanitizeOptions);
          }
          return request;
        },
        ...withAudit('create', 'Page'),
      },
      edit: {
        before: async (request: ActionRequest) => {
          if (request.payload?.content) {
            request.payload.content = sanitizeHtml(request.payload.content, sanitizeOptions);
          }
          return request;
        },
        ...withAudit('update', 'Page'),
      },
      delete: { ...withAudit('delete', 'Page') },
      softDelete,
      restore,
      list: {
        before: async (request: ActionRequest) => {
           return filterSoftDeleted.before(request);
        }
      },
    },
  } as ResourceOptions,
});

export const createCommentResource = (prisma: any, COMPONENTS: any, getModelByName: any) => ({
  resource: { model: getModelByName('Comment'), client: prisma },
  options: {
    navigation: { name: 'Blog', icon: 'Comment' },
    properties: { id: { isVisible: { edit: false } } },
    actions: {
      isAccessible: (context: ActionContext) => isModerator(context),
      delete: { ...withAudit('delete', 'Comment') },
      softDelete,
      restore,
      list: {
        before: async (request: ActionRequest) => {
           return filterSoftDeleted.before(request);
        }
      },
    }
  } as ResourceOptions,
});
