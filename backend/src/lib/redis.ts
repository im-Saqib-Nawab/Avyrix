import Redis from 'ioredis';
import { getQueueRedisUrl } from '@/config';
import { logger } from '@/services/logger.service';

let redis: Redis | null = null;
let redisErrorLogged = false;

export let redisAvailable = false;

function getOrCreateClient(): Redis | null {
  const url = getQueueRedisUrl();
  if (!url) return null;

  if (!redis) {
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 500, 2000);
      },
    });

    redis.on('error', () => {
      if (!redisErrorLogged) {
        logger.warn('Redis connection failed — running without Redis queues');
        redisErrorLogged = true;
      }
    });

    redis.on('connect', () => {
      redisErrorLogged = false;
    });
  }

  return redis;
}

export async function tryConnectRedis(): Promise<boolean> {
  const client = getOrCreateClient();
  if (!client) {
    redisAvailable = false;
    return false;
  }

  if (client.status === 'ready') {
    redisAvailable = true;
    return true;
  }

  try {
    await client.connect();
    await client.ping();
    redisAvailable = true;
    return true;
  } catch {
    redisAvailable = false;
    try {
      client.disconnect();
    } catch {
      // ignore
    }
    redis = null;
    return false;
  }
}

export async function safeDisconnectRedis(): Promise<void> {
  if (!redis) return;
  if (redis.status === 'end' || redis.status === 'wait') {
    redis = null;
    return;
  }
  try {
    await redis.quit();
  } catch {
    redis.disconnect();
  }
  redis = null;
  redisAvailable = false;
}
