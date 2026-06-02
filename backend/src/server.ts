import { createServer } from 'http';
import { app } from './app';
import { config, getQueueRedisUrl } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { initWebSocketServer, shutdownWebSocketServer } from './services/websocket.service';
import { logger } from './services/logger.service';
import { initQueues, imageGenerationQueue, videoGenerationQueue } from '@/lib/bull';
import { ensureCoreUsers } from '@/lib/ensureCoreUsers';
import { startImageGenerationWorker } from '@/workers/imageGeneration.worker';
import { startVideoGenerationWorker } from '@/workers/videoGeneration.worker';

const server = createServer(app);
const wss = initWebSocketServer(server);

async function start(): Promise<void> {
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
  logger.info('✅ WebSocket server running on /ws');

  const port = Number(config.PORT) || 3001;
  server.listen(port, '0.0.0.0', () => {
    logger.info(`AVYRIX AI Backend running on port ${port}`, {
      nodeEnv: config.NODE_ENV,
      frontendUrl: config.FRONTEND_URL,
    });
  });
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully`);

  server.close();
  shutdownWebSocketServer(wss);

  await Promise.allSettled([
    imageGenerationQueue?.close(),
    videoGenerationQueue?.close(),
    disconnectRedis(),
    disconnectDatabase(),
  ]);

  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

void start();
