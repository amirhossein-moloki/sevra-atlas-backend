import { Queue, QueueOptions, DefaultJobOptions } from 'bullmq';
import { redisQueue } from '../redis/redis';

export const defaultJobOptions: DefaultJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000, // Start with 2s
  },
  removeOnComplete: { age: 3600 }, // 1 hour
  removeOnFail: { age: 24 * 3600 * 7 }, // 7 days
};

export const createQueue = (name: string, options?: QueueOptions) => {
  return new Queue(name, {
    connection: redisQueue,
    defaultJobOptions,
    ...options,
  });
};
