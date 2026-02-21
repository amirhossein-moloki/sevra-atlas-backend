import type { ActionContext, ActionRequest, ActionResponse } from 'adminjs';
import { recordAuditLog } from '../../shared/utils/audit';

/**
 * Helper to wrap an AdminJS action with audit logging.
 */
export const withAudit = (actionName: string, resourceId: string) => {
  return {
    after: async (response: ActionResponse, request: ActionRequest, context: ActionContext) => {
      const { currentAdmin, record } = context;
      // We only log successful POST requests (mutations)
      if (request.method === 'post' && response.record && !response.record.errors) {
        // Cast to any because the Express adapter augments ActionRequest with headers and ip at runtime
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

/**
 * Custom action to export records to CSV.
 */
export const exportCsv = {
  actionType: 'resource' as const,
  icon: 'Download',
  isVisible: true,
  handler: async (request: ActionRequest, response: ActionResponse, context: ActionContext) => {
    const { resource } = context;
    const records = await resource.find(new (await (eval('import("adminjs")') as any)).Filter({}, resource), {
      limit: 10000,
    });

    const properties = resource.properties().filter(p => !p.type().includes('reference'));
    const header = properties.map(p => p.name()).join(',');
    const rows = records.map(r => {
      return properties.map(p => {
        const val = r.params[p.name()];
        return val ? `"${String(val).replace(/"/g, '""')}"` : '';
      }).join(',');
    });

    const csv = [header, ...rows].join('\n');

    return {
      downloadUrl: `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`,
      fileName: `${resource.id()}_export_${new Date().toISOString()}.csv`,
    };
  },
};

/**
 * Hook to filter out soft-deleted records by default in list view.
 */
export const filterSoftDeleted = {
  before: async (request: ActionRequest) => {
    if (request.method === 'get') {
      const { query = {} } = request;
      // If no explicit filter for deletedAt, hide deleted records
      if (!Object.keys(query).some(k => k.startsWith('filter.deletedAt'))) {
        request.query = {
          ...query,
          'filter.deletedAt~~null': 'true', // This depends on how the adapter handles null filters
        };
      }
    }
    return request;
  },
};

/**
 * Custom action to soft delete a record.
 */
export const softDelete = {
  actionType: 'record' as const,
  icon: 'Trash2',
  isVisible: true,
  guard: 'Are you sure you want to soft-delete this record?',
  handler: async (request: ActionRequest, response: ActionResponse, context: ActionContext) => {
    const { record, resource } = context;
    if (!record) throw new Error('Record not found');
    await record.update({ deletedAt: new Date() });
    return {
      record: record.toJSON(context.currentAdmin),
      notice: { message: 'Successfully soft-deleted the record', type: 'success' },
      redirectUrl: (resource as any).href({ actionName: 'list' }),
    };
  },
};

/**
 * Custom action to restore a soft-deleted record.
 */
export const restore = {
  actionType: 'record' as const,
  icon: 'RefreshCw',
  isVisible: (context: ActionContext) => !!context.record?.params.deletedAt,
  handler: async (request: ActionRequest, response: ActionResponse, context: ActionContext) => {
    const { record, resource } = context;
    if (!record) throw new Error('Record not found');
    await record.update({ deletedAt: null });
    return {
      record: record.toJSON(context.currentAdmin),
      notice: { message: 'Successfully restored the record', type: 'success' },
      redirectUrl: (resource as any).href({ actionName: 'list' }),
    };
  },
};
