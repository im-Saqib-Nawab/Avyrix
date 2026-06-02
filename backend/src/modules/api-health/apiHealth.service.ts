import { LogLevel } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logToDb } from '@/services/logger.service';
import { pingOpenAI } from '@/services/openai.service';
import * as klingService from '@/services/kling.service';
import * as heygenService from '@/services/heygen.service';
import type { ApiHealthResponse, ProviderHealthStatus } from '@/types/admin.types';

const PROVIDER_CONFIG = [
  { key: 'openai', name: 'OpenAI (DALL·E)' },
  { key: 'kling', name: 'Kling AI' },
  { key: 'heygen', name: 'HeyGen' },
] as const;

function startOfLast24Hours(): Date {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

function deriveStatus(successRate: number): ProviderHealthStatus['status'] {
  if (successRate >= 95) return 'operational';
  if (successRate >= 80) return 'degraded';
  return 'down';
}

async function getProviderMetrics(serviceKey: string): Promise<{
  success_rate: number;
  last_success_at: string | null;
  avg_response_time_ms: number;
}> {
  const since = startOfLast24Hours();

  const logs = await prisma.systemLog.findMany({
    where: {
      service: serviceKey,
      created_at: { gte: since },
    },
    orderBy: { created_at: 'desc' },
    take: 100,
  });

  if (logs.length === 0) {
    return {
      success_rate: 100,
      last_success_at: null,
      avg_response_time_ms: 0,
    };
  }

  const successCount = logs.filter(
    (log) => log.level === LogLevel.info || log.level === LogLevel.debug,
  ).length;
  const success_rate = Math.round((successCount / logs.length) * 1000) / 10;

  const lastSuccess = logs.find(
    (log) => log.level === LogLevel.info || log.level === LogLevel.debug,
  );

  const latencyValues = logs
    .map((log) => {
      if (!log.meta || typeof log.meta !== 'object' || Array.isArray(log.meta)) {
        return null;
      }
      const meta = log.meta as Record<string, unknown>;
      const latency = meta.avg_response_time_ms ?? meta.latency_ms ?? meta.duration_ms;
      return typeof latency === 'number' ? latency : null;
    })
    .filter((value): value is number => value !== null);

  const avg_response_time_ms =
    latencyValues.length > 0
      ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length)
      : 0;

  return {
    success_rate,
    last_success_at: lastSuccess?.created_at.toISOString() ?? null,
    avg_response_time_ms,
  };
}

export async function getApiHealth(): Promise<ApiHealthResponse> {
  const providers: ProviderHealthStatus[] = [];

  for (const provider of PROVIDER_CONFIG) {
    const metrics = await getProviderMetrics(provider.key);
    const status = deriveStatus(metrics.success_rate);
    const checkedAt = new Date().toISOString();
    providers.push({
      name: provider.name,
      provider: provider.name,
      status,
      success_rate: metrics.success_rate,
      last_success_at: metrics.last_success_at,
      last_checked: checkedAt,
      avg_response_time_ms: metrics.avg_response_time_ms,
      latency_ms: metrics.avg_response_time_ms,
    });
  }

  return { providers };
}

async function pingProvider(key: string): Promise<{ ok: boolean; latency_ms: number }> {
  const started = Date.now();

  let ok = false;
  switch (key) {
    case 'openai':
      ok = await pingOpenAI();
      break;
    case 'kling':
      ok = await klingService.pingStatus();
      break;
    case 'heygen':
      ok = await heygenService.pingStatus();
      break;
    default:
      ok = false;
  }

  return { ok, latency_ms: Date.now() - started };
}

export async function refreshApiHealth(): Promise<ApiHealthResponse> {
  for (const provider of PROVIDER_CONFIG) {
    const result = await pingProvider(provider.key);

    await logToDb(
      result.ok ? LogLevel.info : LogLevel.error,
      provider.key,
      result.ok ? 'Provider health check succeeded' : 'Provider health check failed',
      {
        latency_ms: result.latency_ms,
        avg_response_time_ms: result.latency_ms,
      },
    );
  }

  return getApiHealth();
}
