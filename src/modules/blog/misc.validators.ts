import { z } from 'zod';

export const addReactionSchema = z.object({
  body: z.object({
    reaction: z.string(),
    contentTypeId: z.number(),
    objectId: z.coerce.number(),
  }),
});
