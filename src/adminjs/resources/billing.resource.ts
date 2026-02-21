import type { ResourceOptions, ActionContext } from 'adminjs';
import { withAudit, exportCsv } from '../utils/actions';
import { canManageBilling, isSuperAdmin } from '../utils/permissions';

export const createPaymentResource = (prisma: any, COMPONENTS: any, getModelByName: any) => ({
  resource: { model: getModelByName('Payment'), client: prisma },
  options: {
    navigation: { name: 'Billing', icon: 'CreditCard' },
    properties: {
      id: { isVisible: { edit: false } },
      idempotencyKey: { isVisible: { edit: false } },
      providerTrackId: { isVisible: { list: true, filter: true, show: true, edit: false } },
    },
    actions: {
      isAccessible: (context: ActionContext) => canManageBilling(context),
      exportCsv,
      new: { isAccessible: false },
      delete: {
        ...withAudit('delete', 'Payment'),
        isAccessible: (context: ActionContext) => isSuperAdmin(context),
      },
    },
  } as ResourceOptions,
});
