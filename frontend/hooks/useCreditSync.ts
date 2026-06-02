'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useCreditsStore } from '@/store/credits.store';
import { wsClient } from '@/lib/ws-client';

export function useCreditSync() {
  const setBalance = useCreditsStore((s) => s.setBalance);
  const setUser = useAuthStore((s) => s.setUser);
  const userId = useAuthStore((s) => s.user?.id);
  const userRef = useRef(useAuthStore.getState().user);

  useEffect(() => {
    userRef.current = useAuthStore.getState().user;
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const applyBalance = (balance: number) => {
      setBalance(balance);
      const currentUser = userRef.current;
      if (currentUser) {
        setUser({ ...currentUser, credit_balance: balance });
      }
    };

    const sync = async () => {
      try {
        const res = await api.get('/api/credits/balance');
        applyBalance(res.data.data.balance as number);
      } catch {
        // balance poll is best-effort; WebSocket updates take precedence
      }
    };

    void sync();
    const interval = window.setInterval(sync, 60_000);

    const unsubscribe = wsClient.subscribe((msg) => {
      if (msg.type === 'CREDITS_UPDATED' && typeof msg.balance === 'number') {
        applyBalance(msg.balance);
      }
    });

    return () => {
      window.clearInterval(interval);
      unsubscribe();
    };
  }, [setBalance, setUser, userId]);
}
