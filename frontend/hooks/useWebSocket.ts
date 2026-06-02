'use client';

import { useEffect, useRef } from 'react';
import { wsClient, type WSMessage } from '@/lib/ws-client';

export type { WSMessage };

export function useWebSocket(onMessage: (msg: WSMessage) => void, enabled = true) {
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) return;

    return wsClient.subscribe((msg) => {
      onMessageRef.current(msg);
    });
  }, [enabled]);
}
