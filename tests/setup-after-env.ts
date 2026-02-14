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
    await mediaWorker.close(true);
    await mediaQueue.close();

    // 2. Clear all pending timers/intervals if possible (Jest handles this mostly but ioredis/bullmq might have some)

    // 3. Disconnect Database
    await prisma.$disconnect();

    // 4. Close Redis connections last
    await closeRedisConnections(true);

    // Give it a small window for everything to settle
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    // Silent fail in teardown
    console.error('Error during global teardown:', error);
  }
});
