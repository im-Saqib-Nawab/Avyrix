'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  ImageIcon,
  Users,
  Video,
  Zap,
  Layers,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STAT_CARDS = [
  { key: 'total_users', label: 'Total Users', icon: Users, color: 'text-gray-400' },
  { key: 'active_users_today', label: 'Active Today', icon: TrendingUp, color: 'text-gray-400' },
  { key: 'total_generations_today', label: 'Generations Today', icon: Layers, color: 'text-gray-400' },
  { key: 'image_generations_today', label: 'Images Today', icon: ImageIcon, color: 'text-gray-400' },
  { key: 'video_generations_today', label: 'Videos Today', icon: Video, color: 'text-gray-400' },
  { key: 'credits_consumed_today', label: 'Credits Used', icon: Zap, color: 'text-gray-400' },
] as const;

type ApiHealthRow = {
  provider: string;
  status: string;
  success_rate: number;
};

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'h-2 w-2 rounded-full',
        status === 'operational' ? 'bg-emerald-500' : 'bg-amber-500',
      )}
    />
  );
}

export default function AdminOverviewPage() {
  const { addToast } = useUIStore();
  const [stats, setStats] = React.useState<Record<string, number>>({});
  const [health, setHealth] = React.useState<ApiHealthRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, healthRes] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/api-health'),
        ]);
        setStats(statsRes.data.data as Record<string, number>);
        const raw = (healthRes.data.data.providers ?? healthRes.data.data) as Array<
          Record<string, unknown>
        >;
        setHealth(
          raw.map((row) => ({
            provider: String(row.provider ?? row.name ?? 'Unknown'),
            status: String(row.status ?? 'down'),
            success_rate: Number(row.success_rate ?? 0),
          })),
        );
      } catch (error) {
        addToast({
          title: 'Failed to load admin stats',
          description: getApiErrorMessage(error),
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };
    void fetchData();
  }, [addToast]);

  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-white">Overview</h1>
        <Badge variant="warning" className="bg-white/[0.08] text-gray-300 border-none text-[10px] font-medium">
          Admin View
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_CARDS.map((card) => (
          <Card key={card.key} className="border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-3">
              <card.icon className={cn('h-5 w-5', card.color)} />
              <p className="text-sm text-gray-400">{card.label}</p>
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">
              {isLoading ? '—' : (stats[card.key] ?? 0)}
            </p>
          </Card>
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">API Health</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {health.map((api) => (
            <Card key={api.provider} className="border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2">
                <StatusDot status={api.status} />
                <h3 className="font-medium text-white text-sm">{api.provider}</h3>
              </div>
              <p
                className={cn(
                  'mt-2 text-sm font-medium',
                  api.status === 'operational' ? 'text-emerald-500' : 'text-amber-500',
                )}
              >
                {api.status === 'operational' ? 'Operational' : 'Degraded'}
              </p>
              <p className="mt-2 text-sm text-gray-400">{api.success_rate}% success rate</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
