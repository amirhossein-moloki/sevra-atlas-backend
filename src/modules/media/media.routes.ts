import { Router } from 'express';
import { MediaController } from './media.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createMediaSchema, updateMediaSchema } from './media.validators';
import multer from 'multer';
import { registry, z } from '../../shared/openapi/registry';

const router = Router();
const controller = new MediaController();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authMiddleware, controller.listMedia);

router.post(
  '/',
  authMiddleware,
  validate(createMediaSchema),
  controller.createMedia
);

registry.registerPath({
  method: 'post',
  path: '/media/upload',
  summary: 'Upload and optimize an image',
  tags: ['Media'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              file: { type: 'string', format: 'binary' },
            },
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Image uploaded and optimized',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
            url: z.string(),
            variants: z.any(),
          }),
        },
      },
    },
  },
});

router.post(
  '/upload',
  authMiddleware,
  upload.single('file'),
  controller.uploadAndOptimize
);

router.get('/:id', controller.getMedia);

router.patch(
  '/:id',
  authMiddleware,
  validate(updateMediaSchema),
  controller.updateMedia
);

router.get('/:id/download', controller.downloadMedia);

router.delete('/:id', authMiddleware, controller.deleteMedia);

export default router;
