import { tryConnectRedis, safeDisconnectRedis } from '@/lib/redis';
import { getQueueRedisUrl } from '@/config';
import { logger } from '@/services/logger.service';

export async function connectRedis(): Promise<void> {
  if (!getQueueRedisUrl()) {
    return;
  }

  const connected = await tryConnectRedis();
  if (connected) {
    logger.info('Redis connected');
    return;
  }

  throw new Error('Redis unavailable');
}

export async function disconnectRedis(): Promise<void> {
  await safeDisconnectRedis();
}
