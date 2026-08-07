import path from 'node:path';
import { Worker, type Job } from 'bullmq';
import { prisma } from '../src/lib/prisma';
import { redis } from '../src/lib/redis';
import { transcodeQueue, type TranscodeJobData } from '../src/lib/queue';
import {
  generateThumbnail,
  probeFile,
  transcodeToHls,
} from '../src/lib/media';
import {
  ensureUploadDirs,
  hlsRelativePath,
  resolveUploadPath,
  thumbRelativePath,
  toPublicUrl,
} from '../src/lib/storage';

async function processVideo(job: Job<TranscodeJobData>) {
  const { assetId, userId, originalPath, outputDir } = job.data;
  const absInput = resolveUploadPath(originalPath);

  const probe = await probeFile(absInput);
  const absOutput = resolveUploadPath(outputDir);

  await transcodeToHls(absInput, absOutput, probe, (p) =>
    job.updateProgress({ stage: 'transcode', percent: p }),
  );

  const thumbRel = thumbRelativePath(userId, assetId);
  const absThumb = resolveUploadPath(thumbRel);
  await generateThumbnail(absInput, absThumb);

  const masterUrl = toPublicUrl(path.join(outputDir, 'master.m3u8'));
  const thumbUrl = toPublicUrl(thumbRel);

  await prisma.mediaAsset.update({
    where: { id: assetId },
    data: {
      status: 'READY',
      width: probe.width,
      height: probe.height,
      durationSeconds: probe.durationSeconds,
      hlsPlaylistPath: path.join(outputDir, 'master.m3u8'),
      thumbnailPath: thumbRel,
      hlsUrl: masterUrl,
      thumbnailUrl: thumbUrl,
    },
  });

  await job.updateProgress({ stage: 'done', percent: 100 });
}

async function processImage(job: Job<TranscodeJobData>) {
  const { assetId, userId, originalPath } = job.data;
  const thumbRel = thumbRelativePath(userId, assetId, 'jpg');
  try {
    const absInput = resolveUploadPath(originalPath);
    await generateThumbnail(absInput, resolveUploadPath(thumbRel));
    await prisma.mediaAsset.update({
      where: { id: assetId },
      data: { status: 'READY', thumbnailUrl: toPublicUrl(thumbRel) },
    });
  } catch {
    await prisma.mediaAsset.update({
      where: { id: assetId },
      data: { status: 'READY' },
    });
  }
}

async function handler(job: Job<TranscodeJobData>) {
  const isVideo = job.data.mime.startsWith('video/');
  if (isVideo) {
    await processVideo(job);
  } else {
    await processImage(job);
  }
}

async function main() {
  await ensureUploadDirs();
  const worker = new Worker<TranscodeJobData>('transcode', handler, {
    connection: redis,
    concurrency: Number(process.env.TRANSCODE_CONCURRENCY ?? 1),
  });

  console.log('[worker] transcode worker started');
  worker.on('failed', (job, err) => {
    console.error(`[worker] job ${job?.id} failed:`, err.message);
    if (job?.data.assetId) {
      prisma.mediaAsset
        .update({
          where: { id: job.data.assetId },
          data: { status: 'FAILED' },
        })
        .catch(() => {});
    }
  });

  const shutdown = async () => {
    console.log('[worker] shutting down...');
    await worker.close();
    await transcodeQueue.close();
    await redis.quit();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[worker] fatal:', err);
  process.exit(1);
});
