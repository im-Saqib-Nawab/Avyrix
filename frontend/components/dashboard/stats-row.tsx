'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { ImageIcon, Layers, TrendingUp, Video, Zap } from 'lucide-react';

export function StatsRow() {
  const { data, isLoading } = useDashboardSummary();

  const stats = {
    total: data?.total ?? 0,
    images: data?.images ?? 0,
    videos: data?.videos ?? 0,
    creditsUsed: data?.creditsUsedRecent ?? 0,
  };

  const items = [
    { label: 'Total Generations', value: stats.total, icon: Layers },
    { label: 'Images Created', value: stats.images, icon: ImageIcon },
    { label: 'Videos Created', value: stats.videos, icon: Video },
    { label: 'Credits Used', value: stats.creditsUsed, icon: Zap },
  ] as const;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="h-[88px] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 animate-fade-up md:grid-cols-4">
      {items.map((stat) => (
        <Card
          key={stat.label}
          className="flex items-center gap-4 border-default bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-indigo/10 text-accent-indigo">
            <stat.icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-secondary">{stat.label}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <h3 className="text-2xl font-bold text-primary">{stat.value}</h3>
              <TrendingUp className="h-4 w-4 shrink-0 text-success" aria-hidden />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
