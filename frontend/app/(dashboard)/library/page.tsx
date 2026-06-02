'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import type { Generation } from '@/types';
import {
  Download,
  ExternalLink,
  FolderOpen,
  ImageIcon,
  Search,
  Trash2,
  Video,
  Grid3x3,
  List,
  ArrowUpDown,
  Calendar,
  CreditCard,
  Heart,
  Share2,
  MoreVertical,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadMediaUrl } from '@/lib/download';
import { useUIStore } from '@/store/ui.store';

type TypeTab = 'all' | 'image' | 'video';
type DateFilter = 'all' | '7d' | '30d' | '90d';
type SortOption = 'newest' | 'oldest' | 'credits_desc' | 'credits_asc';
type ViewMode = 'grid' | 'list';

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function matchesDateFilter(createdAt: string, filter: DateFilter): boolean {
  if (filter === 'all') return true;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const days = filter === '7d' ? 7 : filter === '30d' ? 30 : 90;
  return created >= now - days * 24 * 60 * 60 * 1000;
}

function sortGenerations(items: Generation[], sort: SortOption): Generation[] {
  const copy = [...items];
  switch (sort) {
    case 'oldest':
      return copy.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case 'credits_desc':
      return copy.sort((a, b) => b.credits_used - a.credits_used);
    case 'credits_asc':
      return copy.sort((a, b) => a.credits_used - b.credits_used);
    case 'newest':
    default:
      return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

const selectClassName =
  'h-10 rounded-xl border border-white/10 bg-input px-3 text-sm text-primary outline-none focus:border-accent-indigo focus:ring-2 focus:ring-accent-indigo/20';

export default function LibraryPage() {
  const { addToast } = useUIStore();
  const [isLoading, setIsLoading] = React.useState(true);
  const [generations, setGenerations] = React.useState<Generation[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [activeTab, setActiveTab] = React.useState<TypeTab>('all');
  const [search, setSearch] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState<DateFilter>('all');
  const [sortBy, setSortBy] = React.useState<SortOption>('newest');
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [selectedAssets, setSelectedAssets] = React.useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);

  const fetchGenerations = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 12,
      };
      if (activeTab !== 'all') params.type = activeTab;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/api/generations', { params });
      setGenerations(res.data.data as Generation[]);
      setTotalPages(res.data.pagination?.totalPages ?? 1);
    } catch {
      addToast({
        title: 'Failed to load library',
        description: getApiErrorMessage(undefined),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, addToast, page, search]);

  React.useEffect(() => {
    const debounce = window.setTimeout(() => {
      void fetchGenerations();
    }, 300);
    return () => window.clearTimeout(debounce);
  }, [fetchGenerations]);

  const filteredAssets = React.useMemo(() => {
    const base = generations.filter((asset) => matchesDateFilter(asset.created_at, dateFilter));
    return sortGenerations(base, sortBy);
  }, [generations, dateFilter, sortBy]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/generations/${id}`);
      setGenerations((prev) => prev.filter((g) => g.id !== id));
      addToast({ title: 'Generation deleted', type: 'success' });
    } catch (error) {
      addToast({
        title: 'Delete failed',
        description: getApiErrorMessage(error),
        type: 'error',
      });
    }
  };

  const handleSelectAsset = (id: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAssets(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedAssets.size === filteredAssets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(filteredAssets.map(a => a.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssets.size === 0) return;
    const ids = [...selectedAssets];
    try {
      await Promise.all(ids.map((id) => api.delete(`/api/generations/${id}`)));
      setGenerations((prev) => prev.filter((g) => !selectedAssets.has(g.id)));
      addToast({
        title: `${ids.length} asset${ids.length === 1 ? '' : 's'} deleted`,
        type: 'success',
      });
      setSelectedAssets(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      addToast({
        title: 'Bulk delete failed',
        description: getApiErrorMessage(error),
        type: 'error',
      });
    }
  };

  const tabs: { id: TypeTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: 'All', icon: <FolderOpen className="h-3.5 w-3.5" />, count: filteredAssets.length },
    { id: 'image', label: 'Images', icon: <ImageIcon className="h-3.5 w-3.5" />, count: filteredAssets.filter(a => a.type === 'image').length },
    { id: 'video', label: 'Videos', icon: <Video className="h-3.5 w-3.5" />, count: filteredAssets.filter(a => a.type === 'video').length },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            My Library
          </h1>
          <p className="text-secondary">
            Browse and manage your generated assets
          </p>
        </div>
        
        {isSelectionMode && selectedAssets.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{selectedAssets.size} selected</span>
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              Delete Selected
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
              setIsSelectionMode(false);
              setSelectedAssets(new Set());
            }}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton
              key={i}
              variant="thumbnail"
              className="aspect-[4/3] rounded-xl border border-white/5 bg-white/5"
            />
          ))}
        </div>
      ) : (
        <>
          {/* Filter bar */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'rounded-lg p-2 transition-colors',
                      viewMode === 'grid' ? 'bg-accent-indigo text-white' : 'text-muted hover:bg-white/10'
                    )}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'rounded-lg p-2 transition-colors',
                      viewMode === 'list' ? 'bg-accent-indigo text-white' : 'text-muted hover:bg-white/10'
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                  className={selectClassName}
                  aria-label="Filter by date"
                >
                  <option value="all">All dates</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className={selectClassName}
                  aria-label="Sort assets"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="credits_desc">Most credits</option>
                  <option value="credits_asc">Least credits</option>
                </select>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    placeholder="Search by prompt..."
                    className="h-10 pl-10"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>

                {filteredAssets.length > 0 && !isSelectionMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSelectionMode(true)}
                  >
                    Select
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Assets grid/list */}
          {filteredAssets.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filteredAssets.map((asset) => (
                    <article
                      key={asset.id}
                      className={cn(
                        "group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-card transition-all duration-300 hover:border-accent-indigo/30 hover:shadow-glow-indigo",
                        isSelectionMode && "cursor-pointer",
                        selectedAssets.has(asset.id) && "border-accent-indigo ring-2 ring-accent-indigo"
                      )}
                      onClick={() => isSelectionMode && handleSelectAsset(asset.id)}
                    >
                      {/* Selection checkbox */}
                      {isSelectionMode && (
                        <div className="absolute left-2 top-2 z-20">
                          <div className={cn(
                            "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors",
                            selectedAssets.has(asset.id) 
                              ? "bg-accent-indigo border-accent-indigo" 
                              : "border-white/30 bg-black/50"
                          )}>
                            {selectedAssets.has(asset.id) && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                      )}

                      {/* Thumbnail */}
                      <div className="absolute inset-0">
                        {asset.status === 'processing' ? (
                          <Skeleton className="h-full w-full rounded-none" />
                        ) : asset.thumbnail_url ? (
                          <Image
                            src={asset.thumbnail_url}
                            alt={asset.prompt}
                            fill
                            className={cn(
                              'object-cover transition-transform duration-500 group-hover:scale-110',
                              asset.status === 'failed' && 'grayscale opacity-60'
                            )}
                            sizes="(max-width: 768px) 50vw, 25vw"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-input">
                            {asset.type === 'video' ? (
                              <Video className="h-10 w-10 text-muted/40" />
                            ) : (
                              <ImageIcon className="h-10 w-10 text-muted/40" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status overlays */}
                      <div className="absolute left-2 top-2 z-10">
                        {asset.status === 'processing' && (
                          <Badge variant="info" className="capitalize text-[10px]">
                            Processing
                          </Badge>
                        )}
                        {asset.status === 'failed' && (
                          <Badge variant="error" className="capitalize text-[10px]">
                            Failed
                          </Badge>
                        )}
                      </div>

                      {/* Video play icon overlay */}
                      {asset.type === 'video' && asset.status === 'completed' && asset.thumbnail_url && (
                        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/50 backdrop-blur-sm">
                            <div className="ml-1 h-0 w-0 border-b-[6px] border-l-[10px] border-t-[6px] border-b-transparent border-l-white border-t-transparent" />
                          </div>
                        </div>
                      )}

                      {/* Bottom info strip */}
                      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-3 pb-3 pt-8">
                        <Badge variant="neutral" className="capitalize text-[10px]">
                          {asset.type}
                        </Badge>
                        <span className="text-[10px] text-white/80 flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {formatDate(asset.created_at)}
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold text-white flex items-center gap-0.5">
                          <CreditCard className="h-2.5 w-2.5" />
                          {asset.credits_used}
                        </span>
                      </div>

                      {/* Hover overlay actions */}
                      {!isSelectionMode && (
                        <div className="absolute inset-0 z-20 flex flex-col justify-between bg-black/80 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <p className="line-clamp-3 text-xs leading-relaxed text-white">
                            {asset.prompt}
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20 hover:scale-110"
                              aria-label="Download"
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = asset.media_url ?? asset.thumbnail_url;
                                if (url) {
                                  void downloadMediaUrl(url, `${asset.id}.${asset.type === 'video' ? 'mp4' : 'png'}`);
                                }
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20 hover:scale-110"
                              aria-label="Share"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToast({ title: 'Share link copied', type: 'success' });
                              }}
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-all hover:bg-error/80 hover:border-error hover:scale-110"
                              aria-label="Delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDelete(asset.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <Link
                              href={
                                asset.type === 'video'
                                  ? `/generate/video?reuse=${asset.id}`
                                  : `/generate/image?reuse=${asset.id}`
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20 hover:scale-110"
                              aria-label="Reuse"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
              </div>
            ) : (
              // List view
              <div className="space-y-2">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border border-white/10 bg-card p-3 transition-all hover:border-accent-indigo/30",
                      isSelectionMode && "cursor-pointer",
                      selectedAssets.has(asset.id) && "border-accent-indigo bg-accent-indigo/10"
                    )}
                    onClick={() => isSelectionMode && handleSelectAsset(asset.id)}
                  >
                    {isSelectionMode && (
                      <div className={cn(
                        "h-5 w-5 rounded-md border-2 flex items-center justify-center",
                        selectedAssets.has(asset.id) 
                          ? "bg-accent-indigo border-accent-indigo" 
                          : "border-white/30"
                      )}>
                        {selectedAssets.has(asset.id) && <Check className="h-3 w-3 text-white" />}
                      </div>
                    )}
                    
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-input">
                      {asset.thumbnail_url ? (
                        <Image src={asset.thumbnail_url} alt="" fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          {asset.type === 'video' ? <Video className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                        </div>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm text-primary">{asset.prompt}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="neutral" className="text-[10px]">{asset.type}</Badge>
                        <span className="text-[10px] text-muted">{formatDate(asset.created_at)}</span>
                        <span className="text-[10px] text-muted">{asset.credits_used} credits</span>
                      </div>
                    </div>
                    
                    {!isSelectionMode && (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => addToast({ title: 'Downloaded', type: 'success' })}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Link href={asset.type === 'video' ? `/generate/video?reuse=${asset.id}` : `/generate/image?reuse=${asset.id}`}>
                          <Button variant="ghost" size="icon-sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-card p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-input">
                <FolderOpen className="h-10 w-10 text-muted" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-primary">No assets found</h3>
                <p className="max-w-sm text-sm text-secondary">
                  {search || dateFilter !== 'all' || activeTab !== 'all'
                    ? "Try adjusting your filters to see more results"
                    : "Start generating images and videos to build your library"}
                </p>
              </div>
              {(search || dateFilter !== 'all' || activeTab !== 'all') ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setDateFilter('all');
                    setActiveTab('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Link href="/generate/image">
                  <Button variant="primary" leftIcon={<ImageIcon className="h-4 w-4" />}>
                    Start Generating
                  </Button>
                </Link>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-secondary">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}