import { createQueue } from './base.queue';

export const mediaQueue = createQueue('media');

export const MEDIA_JOBS = {
  PROCESS_IMAGE: 'process-image',
};
