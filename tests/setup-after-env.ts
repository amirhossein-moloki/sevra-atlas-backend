import jestOpenAPI from 'jest-openapi';
import path from 'path';
import * as fs from 'fs';
import { prisma } from '../src/shared/db/prisma';
import { closeRedisConnections } from '../src/shared/redis/redis';
import { mediaWorker } from '../src/modules/workers/media.worker';
import { mediaQueue } from '../src/shared/queues/media.queue';
import { billingWorker, billingQueue } from '../src/modules/workers/billing.worker';

const openapiPath = path.join(process.cwd(), 'openapi.json');

if (fs.existsSync(openapiPath)) {
  jestOpenAPI(openapiPath);
} else {
  console.warn('openapi.json not found, toSatisfyApiSpec() will not work.');
}

afterAll(async () => {
  // Global cleanup to prevent open handles in tests
  console.log('--- Starting Global Teardown ---');
  try {
    // 1. Close workers
    const workers = [mediaWorker, billingWorker];
    for (const worker of workers) {
      if (worker) {
        try {
           console.log(`Closing Worker ${worker.name}...`);
           await worker.close(true);
        } catch (e) {
           console.warn(`Error closing worker ${worker?.name}:`, e);
        }
      }
    }

    // 2. Close queues
    const queues = [mediaQueue, billingQueue];
    for (const queue of queues) {
      if (queue) {
        try {
          console.log(`Closing Queue ${queue.name}...`);
          await queue.close();
        } catch (e) {
          console.warn(`Error closing queue ${queue?.name}:`, e);
        }
      }
    }

    // 3. Disconnect Database
    if (prisma) {
      console.log('Disconnecting Prisma...');
      await prisma.$disconnect();
    }

    // 4. Close Redis connections last
    console.log('Closing Redis connections...');
    await closeRedisConnections(true);

    // Give it a small window for everything to settle
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('--- Teardown Complete ---');
  } catch (error) {
    console.error('Error during global teardown:', error);
  }
});
