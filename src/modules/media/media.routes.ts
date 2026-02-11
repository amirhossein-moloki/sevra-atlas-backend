import { Router } from 'express';
import { MediaController } from './media.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { mediaSchema, createMediaSchema, updateMediaSchema } from './media.validators';
import multer from 'multer';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';

const router = Router();
const controller = new MediaController();
const upload = multer({ storage: multer.memoryStorage() });

const tag = 'Media';

registry.registerPath({
  method: 'get',
  path: '/media',
  summary: 'List all media (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of media items',
      content: { 'application/json': { schema: withApiSuccess(z.object({ data: z.array(mediaSchema) })) } },
    },
  },
});
router.get('/', authMiddleware, controller.listMedia);

registry.registerPath({
  method: 'post',
  path: '/media',
  summary: 'Register a media item manually',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createMediaSchema.shape.body } } },
  },
  responses: {
    201: {
      description: 'Media registered',
      content: { 'application/json': { schema: withApiSuccess(mediaSchema) } },
    },
  },
});
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
          schema: withApiSuccess(z.object({
            id: z.string(),
            url: z.string(),
            variants: z.any(),
          })),
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

registry.registerPath({
  method: 'get',
  path: '/media/{id}',
  summary: 'Get media details',
  tags: [tag],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Media details',
      content: { 'application/json': { schema: withApiSuccess(mediaSchema) } },
    },
  },
});
router.get('/:id', controller.getMedia);

registry.registerPath({
  method: 'patch',
  path: '/media/{id}',
  summary: 'Update media metadata',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: updateMediaSchema.shape.body } } },
  },
  responses: {
    200: {
      description: 'Media updated',
      content: { 'application/json': { schema: withApiSuccess(mediaSchema) } },
    },
  },
});
router.patch(
  '/:id',
  authMiddleware,
  validate(updateMediaSchema),
  controller.updateMedia
);

registry.registerPath({
  method: 'get',
  path: '/media/{id}/download',
  summary: 'Download media file',
  tags: [tag],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Media file',
    },
  },
});
router.get('/:id/download', controller.downloadMedia);

registry.registerPath({
  method: 'delete',
  path: '/media/{id}',
  summary: 'Delete media',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Media deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } },
    },
  },
});
router.delete('/:id', authMiddleware, controller.deleteMedia);

export default router;
