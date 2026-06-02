'use client';

import * as React from 'react';
import { api } from '@/lib/api';
import type { Generation } from '@/types';

type DashboardSummary = {
  total: number;
  images: number;
  videos: number;
  creditsUsedRecent: number;
  recent: Generation[];
};

let cachedSummary: DashboardSummary | null = null;
let cacheTimestamp = 0;
const CACHE_MS = 30_000;

export function useDashboardSummary() {
  const [data, setData] = React.useState<DashboardSummary | null>(() => {
    const isFresh = cachedSummary && Date.now() - cacheTimestamp < CACHE_MS;
    return isFresh ? cachedSummary : null;
  });
  const [isLoading, setIsLoading] = React.useState(() => {
    const isFresh = cachedSummary && Date.now() - cacheTimestamp < CACHE_MS;
    return !isFresh;
  });
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const now = Date.now();
    if (cachedSummary && now - cacheTimestamp < CACHE_MS) {
      return;
    }

    let cancelled = false;

    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get('/api/generations/summary');
        const summary = res.data.data as DashboardSummary;
        if (!cancelled) {
          cachedSummary = summary;
          cacheTimestamp = Date.now();
          setData(summary);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load dashboard data');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  const invalidate = React.useCallback(() => {
    cachedSummary = null;
    cacheTimestamp = 0;
  }, []);

  return { data, isLoading, error, invalidate };
}
