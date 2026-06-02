'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/ui.store';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { Loader2, RefreshCw, Server, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type HealthRow = {
  provider: string;
  name?: string;
  status: string;
  success_rate: number;
  latency_ms?: number;
  avg_response_time_ms?: number;
  last_checked?: string;
};

export default function AdminApiHealthPage() {
  const { addToast } = useUIStore();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [healthData, setHealthData] = React.useState<HealthRow[]>([]);

  const mapHealthRows = React.useCallback((raw: Array<Record<string, unknown>>) => {
    return raw.map((row) => ({
      provider: String(row.provider ?? row.name ?? 'Unknown'),
      name: row.name as string | undefined,
      status: String(row.status ?? 'down'),
      success_rate: Number(row.success_rate ?? 0),
      latency_ms: Number(row.latency_ms ?? row.avg_response_time_ms ?? 0),
      last_checked: row.last_checked as string | undefined,
    }));
  }, []);

  const fetchHealth = React.useCallback(async () => {
    try {
      const res = await api.get('/api/admin/api-health');
      const raw = (res.data.data.providers ?? res.data.data) as Array<Record<string, unknown>>;
      setHealthData(mapHealthRows(raw));
    } catch (error) {
      addToast({
        title: 'Failed to load API health',
        description: getApiErrorMessage(error),
        type: 'error',
      });
    }
  }, [addToast, mapHealthRows]);

  React.useEffect(() => {
    let cancelled = false;

    const loadHealth = async () => {
      try {
        const res = await api.get('/api/admin/api-health');
        const raw = (res.data.data.providers ?? res.data.data) as Array<Record<string, unknown>>;
        if (!cancelled) {
          setHealthData(mapHealthRows(raw));
        }
      } catch (error) {
        if (!cancelled) {
          addToast({
            title: 'Failed to load API health',
            description: getApiErrorMessage(error),
            type: 'error',
          });
        }
      }
    };

    void loadHealth();
    return () => {
      cancelled = true;
    };
  }, [addToast, mapHealthRows]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.post('/api/admin/api-health/refresh');
      const raw = (res.data.data.providers ?? res.data.data) as Array<Record<string, unknown>>;
      setHealthData(mapHealthRows(raw));
      addToast({ title: 'API status refreshed', type: 'success' });
    } catch (error) {
      addToast({
        title: 'Refresh failed',
        description: getApiErrorMessage(error),
        type: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-gray-500" />
            <h1 className="text-2xl font-semibold text-white">API Health</h1>
          </div>
          <p className="text-sm text-gray-500">Monitor external provider status</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-9 px-4 bg-white/[0.05] border-white/[0.06] text-gray-300 hover:bg-white/[0.1]"
          disabled={isRefreshing}
          onClick={handleRefresh}
        >
          {isRefreshing ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
          <p className="text-xs text-gray-500">Total Providers</p>
          <p className="text-2xl font-semibold text-white mt-1">{healthData.length}</p>
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
          <p className="text-xs text-gray-500">Operational</p>
          <p className="text-2xl font-semibold text-emerald-500 mt-1">
            {healthData.filter(a => a.status === 'operational').length}
          </p>
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
          <p className="text-xs text-gray-500">Avg Success Rate</p>
          <p className="text-2xl font-semibold text-white mt-1">
            {healthData.length
              ? Math.round(healthData.reduce((acc, a) => acc + a.success_rate, 0) / healthData.length)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* API Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {healthData.map((api) => {
          const isOperational = api.status === 'operational';
          return (
            <Card 
              key={api.provider} 
              className="border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.03] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    isOperational ? "bg-emerald-500" : "bg-amber-500"
                  )} />
                  <div>
                    <h3 className="font-medium text-white">{api.provider}</h3>
                    <p className={cn(
                      'text-[10px] font-medium uppercase tracking-wide mt-0.5',
                      isOperational ? 'text-emerald-500' : 'text-amber-500'
                    )}>
                      {isOperational ? 'Operational' : 'Degraded'}
                    </p>
                  </div>
                </div>
                {isOperational ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Success rate</span>
                  <span className="font-medium text-white">{api.success_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Latency</span>
                  <span className="font-medium text-white">
                    {(api.latency_ms ?? api.avg_response_time_ms ?? 0)} ms
                  </span>
                </div>
                {api.last_checked && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last checked</span>
                    <span className="text-gray-300">
                      {new Date(api.last_checked).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isOperational ? 'bg-emerald-500' : 'bg-amber-500'
                    )}
                    style={{ width: `${api.success_rate}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}