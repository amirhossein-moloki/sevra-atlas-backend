import { prisma } from '../db/prisma';
import { logger } from '../logger/logger';

export interface AuditLogData {
  userId?: bigint;
  action: string;
  entityType?: string;
  entityId?: string;
  payload?: any;
  ip?: string;
  userAgent?: string;
}

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'cookie', 'authorization'];

/**
 * Redacts sensitive fields from a payload.
 */
function redact(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const newObj = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key in newObj) {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      newObj[key] = '[REDACTED]';
    } else if (typeof newObj[key] === 'object') {
      newObj[key] = redact(newObj[key]);
    }
  }
  return newObj;
}

/**
 * Records an administrative action in the AuditLog table.
 */
export async function recordAuditLog(data: AuditLogData) {
  try {
    const redactedPayload = redact(data.payload);

    await (prisma as any).auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        payload: redactedPayload || {},
        ip: data.ip,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    logger.error('Failed to record audit log:', error);
    // We don't throw here to avoid breaking the main action
  }
}
