import { createServer } from 'http';
import { app } from './app';
import { config } from './config';
import { disconnectDatabase } from './config/database';
import { initWebSocketServer, shutdownWebSocketServer } from './services/websocket.service';
import { logger } from './services/logger.service';
import { bootstrap, shutdownServices } from './bootstrap';

const server = createServer(app);
const wss = initWebSocketServer(server);

async function start(): Promise<void> {
  await bootstrap();

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

  await shutdownServices();
  await disconnectDatabase();

  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

if (!process.env.VERCEL) {
  void start();
}
