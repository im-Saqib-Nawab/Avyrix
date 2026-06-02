import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { verifyAccessToken } from '@/lib/jwt';
import { buildBalanceResponse } from '@/services/credits.service';
import { logger } from './logger.service';
import type {
  WSServerMessage,
  WSClientMessage,
} from '@/types/websocket.types';
import { toCreditsUpdatedEvent } from '@/types/websocket.types';

export type { WSEventType } from '@/types/websocket.types';
export type {
  WSServerMessage,
  WSClientMessage,
  WSConnectedEvent,
  WSGenerationStatusEvent,
  WSGenerationCompleteEvent,
  WSGenerationFailedEvent,
  WSProviderFallbackEvent,
  WSCreditsUpdatedEvent,
} from '@/types/websocket.types';

interface AliveWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
}

const userConnections = new Map<string, Set<AliveWebSocket>>();

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

function registerConnection(userId: string, ws: AliveWebSocket): void {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId)!.add(ws);
}

function unregisterConnection(userId: string, ws: AliveWebSocket): void {
  userConnections.get(userId)?.delete(ws);
  if (userConnections.get(userId)?.size === 0) {
    userConnections.delete(userId);
  }
}

function parseClientMessage(raw: Buffer | ArrayBuffer | Buffer[]): WSClientMessage | null {
  try {
    const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
    const parsed = JSON.parse(text) as { type?: string };
    if (parsed.type === 'PING') {
      return { type: 'PING' };
    }
    return null;
  } catch {
    return null;
  }
}

export function sendToUser(userId: string, payload: WSServerMessage): void {
  const connections = userConnections.get(userId);
  if (!connections || connections.size === 0) {
    return;
  }

  const message = JSON.stringify(payload);
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

export function sendCreditsUpdated(userId: string, balance: number): void {
  sendToUser(userId, toCreditsUpdatedEvent(buildBalanceResponse(balance)));
}

export function getActiveConnectionCount(userId?: string): number {
  if (userId) {
    return userConnections.get(userId)?.size ?? 0;
  }

  let total = 0;
  userConnections.forEach((set) => {
    total += set.size;
  });
  return total;
}

export function initWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    const aliveWs = ws as AliveWebSocket;
    const host = req.headers.host ?? 'localhost';
    const url = new URL(req.url ?? '/', `http://${host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      aliveWs.close(1008, 'Unauthorized');
      return;
    }

    let userId: string;
    try {
      const payload = verifyAccessToken(token);
      userId = payload.userId;
    } catch {
      aliveWs.close(1008, 'Invalid token');
      return;
    }

    aliveWs.userId = userId;
    registerConnection(userId, aliveWs);

    aliveWs.isAlive = true;

    aliveWs.on('pong', () => {
      aliveWs.isAlive = true;
    });

    aliveWs.on('message', (data) => {
      const clientMessage = parseClientMessage(data);
      if (clientMessage?.type === 'PING' && aliveWs.readyState === WebSocket.OPEN) {
        aliveWs.send(JSON.stringify({ type: 'PONG' }));
      }
    });

    aliveWs.on('error', (error) => {
      logger.warn('WebSocket client error', {
        userId,
        message: error.message,
      });
    });

    aliveWs.on('close', () => {
      if (aliveWs.userId) {
        unregisterConnection(aliveWs.userId, aliveWs);
      }
    });

    sendToUser(userId, {
      type: 'CONNECTED',
      message: 'WebSocket connected.',
    });

    logger.debug('WebSocket client connected', { userId });
  });

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      const aliveClient = client as AliveWebSocket;
      if (!aliveClient.isAlive) {
        aliveClient.terminate();
        return;
      }
      aliveClient.isAlive = false;
      aliveClient.ping();
    });
  }, 30000);

  wss.on('close', () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  });

  logger.info('WebSocket server initialized on path /ws');

  return wss;
}

export function shutdownWebSocketServer(wss: WebSocketServer): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  userConnections.clear();
  wss.close();
}
