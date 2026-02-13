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
    await mediaWorker.close();
    await mediaQueue.close();
    await prisma.$disconnect();
    await closeRedisConnections();
  } catch (error) {
    // Silent fail in teardown
  }
});
