import jestOpenAPI from 'jest-openapi';
import path from 'path';
import * as fs from 'fs';
import { prisma } from '../src/shared/db/prisma';
import { closeRedisConnections } from '../src/shared/redis/redis';
import { mediaWorker } from '../src/modules/workers/media.worker';
import { mediaQueue } from '../src/shared/queues/media.queue';

const openapiPath = path.join(__dirname, '../openapi.json');

if (fs.existsSync(openapiPath)) {
  jestOpenAPI(openapiPath);
} else {
  console.warn('openapi.json not found, toSatisfyApiSpec() will not work.');
}

afterAll(async () => {
  // Global cleanup to prevent open handles in tests
  try {
    // 1. Close workers and queues
    if (mediaWorker) await mediaWorker.close(true);
    if (mediaQueue) await mediaQueue.close();

    // 2. Disconnect Database
    await prisma.$disconnect();

    // 3. Close Redis connections last (forcing disconnect)
    await closeRedisConnections(true);

    // 4. Clear any remaining timers (best effort)
    // In some environments, BullMQ or ioredis might leave timers.
    // We already passed force=true to closeRedisConnections which calls disconnect()

    // 5. Give it a small window for everything to settle
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (error) {
    // Silent fail in teardown
    console.error('Error during global teardown:', error);
  }
});
