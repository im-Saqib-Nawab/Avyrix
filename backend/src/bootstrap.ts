import { connectDatabase } from '@/config/database';
import { getQueueRedisUrl } from '@/config';
import { connectRedis, disconnectRedis } from '@/config/redis';
import { ensureCoreUsers } from '@/lib/ensureCoreUsers';
import { initQueues, imageGenerationQueue, videoGenerationQueue } from '@/lib/bull';
import { startImageGenerationWorker } from '@/workers/imageGeneration.worker';
import { startVideoGenerationWorker } from '@/workers/videoGeneration.worker';
import { logger } from '@/services/logger.service';

let bootstrapped = false;
let bootstrapPromise: Promise<void> | null = null;

export async function bootstrap(): Promise<void> {
  if (bootstrapped) return;
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    try {
      await connectDatabase();
      logger.info('✅ Database connected');
    } catch (error) {
      logger.warn('⚠️ Database connection failed — server starting anyway', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      await ensureCoreUsers();
    } catch (error) {
      logger.warn('⚠️ Could not ensure core users', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    if (getQueueRedisUrl()) {
      try {
        await connectRedis();
        logger.info('✅ Redis connected');
      } catch {
        logger.warn('⚠️ Redis unavailable — using in-process generation fallback');
      }
    } else {
      logger.info('ℹ️ No queue Redis URL — using in-process generation fallback');
    }

    await initQueues();
    startImageGenerationWorker();
    startVideoGenerationWorker();

    logger.info('✅ All routes mounted');
    bootstrapped = true;
  })();

  return bootstrapPromise;
}

export async function shutdownServices(): Promise<void> {
  await Promise.allSettled([
    imageGenerationQueue?.close(),
    videoGenerationQueue?.close(),
    disconnectRedis(),
  ]);
}
