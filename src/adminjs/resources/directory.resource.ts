import type { ResourceOptions, ActionContext } from 'adminjs';
import { withAudit, exportCsv, softDelete, restore, filterSoftDeleted } from '../utils/actions';
import { canManageDirectory, isSuperAdmin } from '../utils/permissions';

export const createSalonResource = (prisma: any, COMPONENTS: any, getModelByName: any) => ({
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
      isAccessible: (context: ActionContext) => canManageDirectory(context),
      exportCsv,
      new: { ...withAudit('create', 'Salon') },
      edit: { ...withAudit('update', 'Salon') },
      delete: {
        ...withAudit('delete', 'Salon'),
        isAccessible: (context: ActionContext) => isSuperAdmin(context),
      },
      softDelete,
      restore,
      list: filterSoftDeleted,
    },
  } as ResourceOptions,
});

export const createArtistResource = (prisma: any, COMPONENTS: any, getModelByName: any) => ({
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
      isAccessible: (context: ActionContext) => canManageDirectory(context),
      exportCsv,
      new: { ...withAudit('create', 'Artist') },
      edit: { ...withAudit('update', 'Artist') },
      delete: {
        ...withAudit('delete', 'Artist'),
        isAccessible: (context: ActionContext) => isSuperAdmin(context),
      },
      softDelete,
      restore,
      list: filterSoftDeleted,
    },
  } as ResourceOptions,
});

export const createVerificationResource = (prisma: any, COMPONENTS: any, getModelByName: any) => ({
  resource: { model: getModelByName('VerificationRequest'), client: prisma },
  options: {
    navigation: { name: 'Directory', icon: 'CheckSquare' },
    properties: {
      id: { isVisible: { edit: false } },
      status: {
        availableValues: [
          { value: 'NONE', label: 'None' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'VERIFIED', label: 'Verified' },
          { value: 'REJECTED', label: 'Rejected' },
        ],
      },
    },
    actions: {
      isAccessible: (context: ActionContext) => canManageDirectory(context),
      new: { ...withAudit('create', 'VerificationRequest') },
      edit: { ...withAudit('update', 'VerificationRequest') },
      delete: {
        ...withAudit('delete', 'VerificationRequest'),
        isAccessible: (context: ActionContext) => isSuperAdmin(context),
      },
      bulkApprove: {
        actionType: 'bulk',
        icon: 'Check',
        isVisible: true,
        handler: async (request, response, context) => {
          const { records, resource } = context;
          if (!records || !records.length) return { notice: { message: 'No records selected', type: 'error' } };
          await Promise.all(records.map(record => record.update({ status: 'VERIFIED' })));
          return {
            notice: { message: `Successfully approved ${records.length} requests`, type: 'success' },
            redirectUrl: (resource as any).href({ actionName: 'list' }),
          };
        },
      },
      bulkReject: {
        actionType: 'bulk',
        icon: 'X',
        isVisible: true,
        handler: async (request, response, context) => {
          const { records, resource } = context;
          if (!records || !records.length) return { notice: { message: 'No records selected', type: 'error' } };
          await Promise.all(records.map(record => record.update({ status: 'REJECTED' })));
          return {
            notice: { message: `Successfully rejected ${records.length} requests`, type: 'success' },
            redirectUrl: (resource as any).href({ actionName: 'list' }),
          };
        },
      },
    },
  } as ResourceOptions,
});
