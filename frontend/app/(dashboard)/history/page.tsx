'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import type { Generation, GenerationStatus } from '@/types';
import { 
  ImageIcon, 
  RotateCcw, 
  Video, 
  CheckCircle, 
  XCircle, 
  Clock,
  Filter,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TypeTab = 'all' | 'image' | 'video';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

type HistoryItem = Generation & { listKey: string };

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }
}

function StatusBadge({ status }: { status: GenerationStatus }) {
  if (status === 'processing') {
    return (
      <Badge variant="info" className="flex items-center gap-1.5 capitalize">
        <div className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-indigo opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-indigo" />
        </div>
        Processing
      </Badge>
    );
  }

  if (status === 'failed') {
    return (
      <Badge variant="error" className="flex items-center gap-1.5 capitalize">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }

  if (status === 'completed') {
    return (
      <Badge variant="success" className="flex items-center gap-1.5 capitalize">
        <CheckCircle className="h-3 w-3" />
        Completed
      </Badge>
    );
  }

  return (
    <Badge variant="neutral" className="flex items-center gap-1.5 capitalize">
      <Clock className="h-3 w-3" />
      {status}
    </Badge>
  );
}

function toHistoryItems(generations: Generation[]): HistoryItem[] {
  return generations.map((gen) => ({
    ...gen,
    listKey: gen.id,
  }));
}

function filterByTime(items: HistoryItem[], filter: TimeFilter): HistoryItem[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  switch (filter) {
    case 'today':
      return items.filter(item => new Date(item.created_at) >= today);
    case 'week':
      return items.filter(item => new Date(item.created_at) >= weekAgo);
    case 'month':
      return items.filter(item => new Date(item.created_at) >= monthAgo);
    default:
      return items;
  }
}

export default function HistoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<TypeTab>('all');
  const [timeFilter, setTimeFilter] = React.useState<TimeFilter>('all');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [generations, setGenerations] = React.useState<Generation[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params: Record<string, string | number> = { page, limit: 20 };
        if (activeTab !== 'all') params.type = activeTab;
        if (searchQuery.trim()) params.search = searchQuery.trim();
        const res = await api.get('/api/generations', { params });
        setGenerations(res.data.data as Generation[]);
        setTotalPages(res.data.pagination?.totalPages ?? 1);
      } catch (error) {
        setGenerations([]);
        setError(getApiErrorMessage(error, 'Failed to load history.'));
      } finally {
        setIsLoading(false);
      }
    };
    const debounce = window.setTimeout(() => void fetchHistory(), 300);
    return () => window.clearTimeout(debounce);
  }, [activeTab, page, searchQuery]);

  const filteredItems = React.useMemo(() => {
    return filterByTime(toHistoryItems(generations), timeFilter);
  }, [generations, timeFilter]);

  const handleUseAgain = (gen: HistoryItem) => {
    const path =
      gen.type === 'video'
        ? `/generate/video?reuse=${gen.id}`
        : `/generate/image?reuse=${gen.id}`;
    router.push(path);
  };

  const tabs: { id: TypeTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: 'All', icon: <Filter className="h-3.5 w-3.5" />, count: filteredItems.length },
    { id: 'image', label: 'Images', icon: <ImageIcon className="h-3.5 w-3.5" />, count: filteredItems.filter(i => i.type === 'image').length },
    { id: 'video', label: 'Videos', icon: <Video className="h-3.5 w-3.5" />, count: filteredItems.filter(i => i.type === 'video').length },
  ];

  const timeFilters: { id: TimeFilter; label: string }[] = [
    { id: 'all', label: 'All time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This week' },
    { id: 'month', label: 'This month' },
  ];

  // Group items by date for better organization
  const groupedItems = React.useMemo(() => {
    const groups: { [key: string]: HistoryItem[] } = {};
    filteredItems.forEach(item => {
      const date = new Date(item.created_at);
      const key = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filteredItems]);

  const totalCreditsUsed = filteredItems.reduce((sum, item) => sum + item.credits_used, 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
          Generation History
        </h1>
        <p className="text-secondary">
          Review, reuse, and track your past AI generations
        </p>
      </div>

      {/* Stats summary */}
      {!isLoading && filteredItems.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-card p-4">
            <p className="text-xs text-muted uppercase tracking-wider">Total Generations</p>
            <p className="mt-1 text-2xl font-bold text-primary">{filteredItems.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card p-4">
            <p className="text-xs text-muted uppercase tracking-wider">Total Credits Used</p>
            <p className="mt-1 text-2xl font-bold text-accent-indigo">{totalCreditsUsed}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card p-4">
            <p className="text-xs text-muted uppercase tracking-wider">Images</p>
            <p className="mt-1 text-2xl font-bold text-primary">
              {filteredItems.filter(i => i.type === 'image').length}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card p-4">
            <p className="text-xs text-muted uppercase tracking-wider">Videos</p>
            <p className="mt-1 text-2xl font-bold text-primary">
              {filteredItems.filter(i => i.type === 'video').length}
            </p>
          </div>
        </div>
      )}

      {/* Filters bar */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      <div className="space-y-4">
        {/* Search and filter toggle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by prompt..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-white/10 bg-input py-2.5 pl-10 pr-4 text-sm text-primary placeholder:text-muted focus:border-accent-indigo focus:outline-none focus:ring-1 focus:ring-accent-indigo"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-input px-4 py-2.5 text-sm text-secondary transition-colors hover:border-accent-indigo/40 hover:text-primary sm:hidden"
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronRight className={cn("h-4 w-4 transition-transform", showFilters && "rotate-90")} />
          </button>
        </div>

        {/* Filters content */}
        <div className={cn("space-y-4", !showFilters && "hidden sm:block")}>
          {/* Type tabs */}
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-input p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-accent-indigo to-accent-violet text-white shadow-glow-indigo'
                    : 'text-secondary hover:text-primary'
                )}
              >
                {tab.icon}
                {tab.label}
                <span className={cn(
                  'ml-1 rounded-full px-1.5 py-0.5 text-[10px]',
                  activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Time filter chips */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 text-xs text-muted mr-2">
              <Calendar className="h-3 w-3" />
              Time:
            </span>
            {timeFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  setTimeFilter(filter.id);
                  setPage(1);
                }}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs transition-all',
                  timeFilter === filter.id
                    ? 'bg-accent-indigo text-white'
                    : 'bg-input text-secondary hover:bg-white/10'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card p-4"
            >
              <Skeleton variant="avatar" className="h-14 w-14 rounded-xl bg-white/5" />
              <div className="flex-1 space-y-2">
                <SkeletonText className="h-4 w-3/4 bg-white/5" />
                <SkeletonText className="h-3 w-1/3 bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([date, items], groupIdx) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIdx * 0.05 }}
            >
              <h3 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wider">
                {date}
              </h3>
              <div className="space-y-3">
                {items.map((gen) => (
                  <div
                    key={gen.listKey}
                    className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-card p-4 transition-all hover:border-accent-indigo/30 hover:bg-float hover:shadow-lg sm:flex-row sm:items-center"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-input">
                      {gen.thumbnail_url && gen.status !== 'failed' ? (
                        <Image
                          src={gen.thumbnail_url}
                          alt=""
                          fill
                          className={cn(
                            'object-cover transition-transform duration-300 group-hover:scale-110',
                            gen.status === 'processing' && 'opacity-50'
                          )}
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted">
                          {gen.type === 'video' ? (
                            <Video className="h-6 w-6" />
                          ) : (
                            <ImageIcon className="h-6 w-6" />
                          )}
                        </div>
                      )}
                      {gen.type === 'video' && gen.status === 'completed' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                            <div className="ml-0.5 h-0 w-0 border-b-[5px] border-l-[8px] border-t-[5px] border-b-transparent border-l-white border-t-transparent" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Center: prompt + badges */}
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="line-clamp-2 text-sm font-medium leading-relaxed text-primary group-hover:text-white transition-colors">
                        {gen.prompt}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="neutral" className="text-[10px] uppercase">
                          {gen.type}
                        </Badge>
                        <StatusBadge status={gen.status as GenerationStatus} />
                        <span className="text-[11px] text-muted flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(gen.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Right: credits + Use Again */}
                    <div className="flex shrink-0 flex-row items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                      <div className="text-right">
                        {gen.status === 'failed' && gen.credits_refunded ? (
                          <span className="text-sm font-semibold text-success flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Refunded
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-primary">
                            {gen.credits_used} credits
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-10 shrink-0 px-5 transition-all hover:scale-105"
                        onClick={() => handleUseAgain(gen)}
                        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                      >
                        Use Again
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
          
          {/* Load more button */}
          {page < totalPages && (
            <div className="flex justify-center pt-4">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setPage((p) => p + 1)}
                className="px-8"
                leftIcon={<ChevronRight className="h-4 w-4" />}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-card p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-input">
            <Filter className="h-10 w-10 text-muted" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-primary">No history found</h3>
            <p className="max-w-sm text-sm text-secondary">
              {searchQuery || timeFilter !== 'all' || activeTab !== 'all'
                ? "Try adjusting your filters to see more results"
                : "Start generating images and videos to see them here"}
            </p>
          </div>
          {(searchQuery || timeFilter !== 'all' || activeTab !== 'all') ? (
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery('');
                setTimeFilter('all');
                setActiveTab('all');
              }}
            >
              Clear filters
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => router.push('/generate/image')}
              leftIcon={<ImageIcon className="h-4 w-4" />}
            >
              Start Creating
            </Button>
          )}
        </div>
      )}
    </div>
  );
}