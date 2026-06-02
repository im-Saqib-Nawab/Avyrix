import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 bg-white/5" />
          <Skeleton className="h-4 w-48 bg-white/5" />
        </div>
        <Skeleton className="h-10 w-32 bg-white/5" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full bg-white/5 border border-white/5 rounded-xl" />
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full bg-white/5 border border-white/5 rounded-xl" />
      </div>
    </div>
  );
}
