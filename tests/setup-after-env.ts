import jestOpenAPI from 'jest-openapi';
import path from 'path';
import * as fs from 'fs';
import { prisma } from '../src/shared/db/prisma';
import { UserRole } from '@prisma/client';
import { closeRedisConnections } from '../src/shared/redis/redis';
import { mediaWorker } from '../src/modules/workers/media.worker';
import { mediaQueue } from '../src/shared/queues/media.queue';
import { billingWorker, billingQueue } from '../src/modules/workers/billing.worker';

const openapiPath = path.join(process.cwd(), 'openapi.json');

let isGlobalSeeded = false;

beforeAll(async () => {
  if (isGlobalSeeded) return;

  // Ensure test users exist for authentication in dynamic tests
  // We use fixed IDs if possible, or at least common ones used in test-utils.ts
  const testUsers = [
    { id: 1, role: UserRole.ADMIN, username: 'test_admin', email: 'admin@example.com' },
    { id: 2, role: UserRole.USER, username: 'test_user', email: 'user@example.com' },
    { id: 3, role: UserRole.ARTIST, username: 'test_artist', email: 'artist@example.com' },
    { id: 4, role: UserRole.SALON, username: 'test_salon_owner', email: 'salon@example.com' },
    { id: 5, role: UserRole.AUTHOR, username: 'test_author', email: 'author@example.com' },
    { id: 6, role: UserRole.MODERATOR, username: 'test_moderator', email: 'moderator@example.com' },
  ];

  for (const user of testUsers) {
    await prisma.user.upsert({
      where: { id: BigInt(user.id) },
      update: {
        role: user.role,
        isActive: true,
        deletedAt: null,
      },
      create: {
        id: BigInt(user.id),
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: true,
        firstName: 'Test',
        lastName: user.role.toLowerCase(),
        isStaff: user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR,
        phoneNumber: `+98900000000${user.id}`,
        referralCode: `TEST${user.id}`,
      },
    });
  }

  // Sync sequences to avoid collisions with future auto-increments
  const tablesToSync = [
    { table: 'users_user', sequence: 'users_user_id_seq' },
    { table: 'Province', sequence: 'Province_id_seq' },
    { table: 'City', sequence: 'City_id_seq' },
    { table: 'Salon', sequence: 'Salon_id_seq' },
    { table: 'Artist', sequence: 'Artist_id_seq' },
    { table: 'blog_post', sequence: 'blog_post_id_seq' },
    { table: 'blog_category', sequence: 'blog_category_id_seq' },
    { table: 'ServiceCategory', sequence: 'ServiceCategory_id_seq' },
    { table: 'ServiceDefinition', sequence: 'ServiceDefinition_id_seq' },
    { table: 'payments', sequence: 'payments_id_seq' },
    { table: 'billing_plan', sequence: 'billing_plan_id_seq' },
  ];

  for (const item of tablesToSync) {
    try {
      // Use $queryRawUnsafe to check if table is empty first to avoid errors with MAX(id)
      const result = await prisma.$queryRawUnsafe<{ max: bigint }[]>(`SELECT MAX(id) as max FROM "${item.table}";`);
      const maxId = result[0]?.max;
      if (maxId) {
        await prisma.$executeRawUnsafe(`SELECT setval('${item.sequence}', ${maxId});`);
      }
    } catch (e) {
      console.warn(`Failed to sync sequence for ${item.table}:`, e);
    }
  }

  isGlobalSeeded = true;
});

console.log(`--- Initializing jest-openapi with spec: ${openapiPath} ---`);
if (fs.existsSync(openapiPath)) {
  jestOpenAPI(openapiPath);
  console.log('--- jest-openapi initialized successfully ---');
} else {
  console.warn(`!!! openapi.json not found at ${openapiPath}, toSatisfyApiSpec() will fail !!!`);
}

afterAll(async () => {
  // Global cleanup to prevent open handles in tests
  console.log('--- Starting Global Teardown ---');
  try {
    // 1. Close workers
    const workers = [mediaWorker, billingWorker].filter(Boolean);
    await Promise.all(
      workers.map(async (worker) => {
        try {
          console.log(`Closing Worker ${worker.name}...`);
          // Use force=true to ensure immediate closure
          await worker.close(true);
        } catch (e) {
          console.warn(`Error closing worker ${worker.name}:`, e);
        }
      })
    );

    // 2. Close queues
    const queues = [mediaQueue, billingQueue].filter(Boolean);
    await Promise.all(
      queues.map(async (queue) => {
        try {
          console.log(`Closing Queue ${queue.name}...`);
          await queue.close();
        } catch (e) {
          console.warn(`Error closing queue ${queue.name}:`, e);
        }
      })
    );

    // 3. Disconnect Database
    if (prisma) {
      console.log('Disconnecting Prisma...');
      await prisma.$disconnect();
    }

    // 4. Close Redis connections last
    console.log('Closing Redis connections...');
    await closeRedisConnections(true);

    // 5. Clear metrics interval if any
    try {
      const promClient = await import('prom-client');
      promClient.register.clear();
      // Stop default metrics collection if it was started
      if ((promClient as any).defaultMetrics && typeof (promClient as any).defaultMetrics.stop === 'function') {
        (promClient as any).defaultMetrics.stop();
      }
    } catch (_e) {
      // Ignore if prom-client is not available
    }

    // Give it a small window for everything to settle
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log('--- Teardown Complete ---');
  } catch (error) {
    console.error('Error during global teardown:', error);
  }
});
