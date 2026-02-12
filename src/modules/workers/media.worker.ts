import { Worker, Job } from 'bullmq';
import os from 'os';
import { redisQueue } from '../../shared/redis/redis';
import { prisma } from '../../shared/db/prisma';
import { processImage } from '../../shared/utils/image';
import { getStorageProvider } from '../../shared/storage';
import { MediaStatus } from '@prisma/client';
import { logger } from '../../shared/logger/logger';

const storage = getStorageProvider();

export const mediaWorker = new Worker('media', async (job: Job) => {
  const { mediaId, storageKey } = job.data;
  const mId = BigInt(mediaId);

  // 1. Idempotency Check: Verify current DB state
  const media = await prisma.media.findUnique({ where: { id: mId } });
  if (!media) {
    logger.warn(`Media ${mediaId} not found. Job failed.`);
    throw new Error(`Media ${mediaId} not found`);
  }

  if (media.status === MediaStatus.COMPLETED) {
    logger.info(`Media ${mediaId} already processed. Skipping.`);
    return;
  }

  try {
    // Update status to PROCESSING
    await prisma.media.update({
      where: { id: mId },
      data: { status: MediaStatus.PROCESSING }
    });

    // 2. Fetch original buffer from storage
    const buffer = await storage.get(storageKey);
    if (!buffer) throw new Error(`Original buffer not found for ${storageKey}`);

    // 3. Process Variants
    const { variants } = await processImage(buffer);

    const variantUrls: any = {};
    for (const [key, variant] of Object.entries(variants)) {
       const ext = variant.mime.split('/')[1];
       const variantKey = `${storageKey}_${key}.${ext}`;
       const url = await storage.save(variantKey, variant.buffer, variant.mime);

       variantUrls[key] = {
         url,
         mime: variant.mime,
         width: variant.width,
         height: variant.height,
         sizeBytes: variant.sizeBytes,
       };
    }

    // 4. Update DB
    await prisma.media.update({
      where: { id: mId },
      data: {
        variants: variantUrls,
        status: MediaStatus.COMPLETED
      }
    });

    logger.info(`Successfully processed media ${mediaId}`);
  } catch (error) {
    logger.error(`Failed to process media ${mediaId}:`, error);
    await prisma.media.update({
      where: { id: mId },
      data: { status: MediaStatus.FAILED }
    });
    throw error; // Let BullMQ handle retry
  }
}, {
  connection: redisQueue,
  // Adaptive concurrency: 1 worker per 2 cores for CPU-heavy Sharp tasks, minimum 1
  concurrency: Math.max(1, Math.floor(os.cpus().length / 2)),
  limiter: {
    max: 10,
    duration: 1000
  }
});
