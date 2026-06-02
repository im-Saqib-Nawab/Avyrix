import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="animate-in fade-in space-y-8 duration-300">
      <div className="space-y-3">
        <SkeletonText className="h-8 w-64 bg-white/5" />
        <SkeletonText className="h-4 w-48 bg-white/5" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard
            key={i}
            className="h-28 rounded-xl border border-white/5 bg-white/5"
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton
            key={i}
            variant="thumbnail"
            className="rounded-xl border border-white/5 bg-white/5"
          />
        ))}
      </div>
    </div>
  );
}
