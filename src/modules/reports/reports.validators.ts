import { z } from 'zod';
import { EntityType, ReportStatus } from '@prisma/client';

export const createReportSchema = z.object({
  body: z.object({
    targetType: z.nativeEnum(EntityType),
    targetId: z.coerce.number(),
    reason: z.string(),
    details: z.string().optional(),
  }),
});

export const updateReportStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ReportStatus),
  }),
});
