import { Queue } from 'bullmq';
import { redis } from '@/lib/redis';

export type TranscodeJobData = {
  assetId: string;
  userId: string;
  originalPath: string;
  outputDir: string;
  mime: string;
};

export const transcodeQueue = new Queue<TranscodeJobData>('transcode', {
  connection: redis,
});

export async function enqueueTranscode(job: TranscodeJobData) {
  return transcodeQueue.add('transcode-clip', job, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 3600 * 24 },
  });
}
