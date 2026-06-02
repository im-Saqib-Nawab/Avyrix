import Bull from 'bull';
import { getQueueRedisUrl } from '@/config';
import { logger } from '@/services/logger.service';

export let imageGenerationQueue: Bull.Queue | null = null;
export let videoGenerationQueue: Bull.Queue | null = null;

const QUEUE_READY_TIMEOUT_MS = 5000;

async function probeRedisForBull(redisUrl: string): Promise<boolean> {
  let testQueue: Bull.Queue | null = null;
  try {
    testQueue = new Bull('avyrix-redis-probe', {
      redis: redisUrl,
      settings: { retryProcessDelay: 5000 },
    });

    await Promise.race([
      testQueue.isReady(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Bull probe timeout')), QUEUE_READY_TIMEOUT_MS);
      }),
    ]);

    return true;
  } catch (error) {
    logger.warn('Bull Redis probe failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  } finally {
    if (testQueue) {
      await testQueue.close().catch(() => undefined);
    }
  }
}

function attachQueueErrorHandler(queue: Bull.Queue, name: string): void {
  let errorLogged = false;
  queue.on('error', (error) => {
    if (!errorLogged) {
      logger.warn(`Bull queue "${name}" error`, {
        message: error instanceof Error ? error.message : String(error),
      });
      errorLogged = true;
    }
  });
}

export async function initQueues(): Promise<void> {
  const redisUrl = getQueueRedisUrl();
  if (!redisUrl) {
    imageGenerationQueue = null;
    videoGenerationQueue = null;
    logger.warn(
      '⚠️ Bull queues disabled — no REDIS_URL/UPSTASH_REDIS_URL. Using in-process generation fallback.',
    );
    return;
  }

  const canUseRedis = await probeRedisForBull(redisUrl);
  if (!canUseRedis) {
    imageGenerationQueue = null;
    videoGenerationQueue = null;
    logger.warn(
      '⚠️ Bull queues disabled — Redis not available. Using synchronous generation fallback.',
    );
    return;
  }

  try {
    imageGenerationQueue = new Bull('image-generation', {
      redis: redisUrl,
      settings: { retryProcessDelay: 5000 },
    });
    videoGenerationQueue = new Bull('video-generation', {
      redis: redisUrl,
      settings: { retryProcessDelay: 5000 },
    });

    await Promise.race([
      Promise.all([imageGenerationQueue.isReady(), videoGenerationQueue.isReady()]),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Bull queue ready timeout')), QUEUE_READY_TIMEOUT_MS);
      }),
    ]);

    attachQueueErrorHandler(imageGenerationQueue, 'image-generation');
    attachQueueErrorHandler(videoGenerationQueue, 'video-generation');

    logger.info('✅ Bull queues initialized');
  } catch (error) {
    imageGenerationQueue = null;
    videoGenerationQueue = null;
    logger.warn('⚠️ Bull queues disabled — Redis not available. Using synchronous fallback.', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
