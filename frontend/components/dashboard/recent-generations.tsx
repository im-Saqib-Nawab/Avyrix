'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import type { Generation } from '@/types';
import { ArrowRight, Image as ImageIcon, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatGenerationDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

function formatParameters(gen: Generation): string {
  const p = gen.parameters;
  const parts: string[] = [];
  if (p.size) parts.push(`Size: ${p.size}`);
  if (p.quality) parts.push(`Quality: ${p.quality}`);
  if (p.style) parts.push(`Style: ${p.style}`);
  if (p.duration) parts.push(`Duration: ${p.duration}`);
  if (p.aspect_ratio) parts.push(`Aspect: ${p.aspect_ratio}`);
  return parts.join(' · ') || '—';
}

function StatusBadge({ status }: { status: Generation['status'] }) {
  if (status === 'processing') {
    return (
      <Badge variant="info" className="flex items-center gap-1.5 capitalize">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-indigo opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-indigo" />
        </span>
        Processing
      </Badge>
    );
  }

  if (status === 'failed') {
    return (
      <Badge variant="error" className="capitalize">
        Failed
      </Badge>
    );
  }

  if (status === 'completed') {
    return (
      <Badge variant="success" className="capitalize">
        Completed
      </Badge>
    );
  }

  return <Badge variant="neutral" className="capitalize">{status}</Badge>;
}

export function RecentGenerations() {
  const { data, isLoading } = useDashboardSummary();
  const recent = data?.recent ?? [];
  const [selected, setSelected] = React.useState<Generation | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Recent Creations</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (recent.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Recent Creations</h2>
        <p className="text-sm text-secondary">No generations yet. Create your first image or video!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-primary">Recent Creations</h2>
        <Link
          href="/library"
          className="group flex items-center text-sm text-secondary transition-colors hover:text-primary"
        >
          View All
          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recent.map((gen) => (
          <Card
            key={gen.id}
            hover
            role="button"
            tabIndex={0}
            onClick={() => setSelected(gen)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelected(gen);
              }
            }}
            className="flex h-full cursor-pointer flex-col overflow-hidden border-default bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="relative aspect-video w-full bg-input">
              {gen.thumbnail_url && gen.status !== 'failed' ? (
                <Image
                  src={gen.thumbnail_url}
                  alt={gen.prompt}
                  fill
                  className={cn('object-cover', gen.status === 'processing' && 'opacity-60')}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted">
                  {gen.type === 'video' ? (
                    <Video className="h-8 w-8 opacity-20" />
                  ) : (
                    <ImageIcon className="h-8 w-8 opacity-20" />
                  )}
                </div>
              )}

              <div className="absolute left-2 top-2">
                <Badge variant="neutral" className="border-white/10 bg-black/60 text-[10px] uppercase tracking-wider backdrop-blur-md">
                  {gen.type}
                </Badge>
              </div>

              <div className="absolute right-2 top-2">
                <StatusBadge status={gen.status} />
              </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <p className="mb-auto line-clamp-2 text-sm leading-relaxed text-primary">{gen.prompt}</p>
              <span className="mt-3 text-xs text-secondary">{formatGenerationDate(gen.created_at)}</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Generation Details"
        className="max-w-lg"
      >
        {selected && (
          <div className="space-y-4 p-6 pt-2">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-secondary">Prompt</p>
              <p className="text-sm leading-relaxed text-primary">{selected.prompt}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-secondary">Parameters</p>
                <p className="mt-1 text-primary">{formatParameters(selected)}</p>
              </div>
              <div>
                <p className="text-xs text-secondary">Provider</p>
                <p className="mt-1 capitalize text-primary">{selected.api_provider}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
