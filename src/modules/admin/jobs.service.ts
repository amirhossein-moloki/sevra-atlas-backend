import { mediaQueue } from '../../shared/queues/media.queue';
import { ApiError } from '../../shared/errors/ApiError';

const queues: Record<string, any> = {
  media: mediaQueue,
};

export class JobsService {
  async getQueuesHealth() {
    const health: Record<string, any> = {};
    for (const [name, queue] of Object.entries(queues)) {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);
      health[name] = { waiting, active, completed, failed, delayed };
    }
    return health;
  }

  async getJobStatus(queueName: string, jobId: string) {
    const queue = queues[queueName];
    if (!queue) throw new ApiError(400, `Queue '${queueName}' not found`);

    const job = await queue.getJob(jobId);
    if (!job) throw new ApiError(404, `Job '${jobId}' not found in queue '${queueName}'`);

    return {
      id: job.id,
      name: job.name,
      status: await job.getState(),
      progress: job.progress,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
      finishedOn: job.finishedOn,
      data: job.data,
      returnValue: job.returnvalue,
    };
  }
}
