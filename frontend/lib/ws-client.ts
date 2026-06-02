import { config } from '@/lib/config';
import { getAccessToken } from '@/lib/auth-session';

export type WSMessage = {
  type: string;
  generationId?: string;
  [key: string]: unknown;
};

type Listener = (msg: WSMessage) => void;

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_MS = 1000;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.connect();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.ws?.close();
    this.ws = null;
  }

  private connect(): void {
    if (this.listeners.size === 0) return;
    if (this.isConnecting) return;
    if (this.ws?.readyState === WebSocket.OPEN) return;
    if (this.ws?.readyState === WebSocket.CONNECTING) return;

    const token = getAccessToken();
    if (!token) return;

    this.isConnecting = true;
    const ws = new WebSocket(`${config.wsUrl}?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as WSMessage;
        if (data.type === 'CONNECTED' || data.type === 'PONG') return;
        this.listeners.forEach((listener) => listener(data));
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      this.isConnecting = false;
      if (this.ws === ws) {
        this.ws = null;
      }
      if (this.listeners.size === 0) return;

      if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;

      const delay = BASE_RECONNECT_MS * 2 ** this.reconnectAttempts;
      this.reconnectAttempts += 1;
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, delay);
    };

    ws.onerror = () => {
      this.isConnecting = false;
      ws.close();
    };

    this.ws = ws;
  }
}

export const wsClient = new WebSocketClient();

export function disconnectWebSocket(): void {
  wsClient.disconnect();
}
