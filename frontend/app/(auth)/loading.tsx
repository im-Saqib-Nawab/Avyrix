import { SkeletonCard, SkeletonText } from '@/components/ui/skeleton';

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0D12] p-6">
      <div className="w-full max-w-md space-y-6">
        <SkeletonText className="mx-auto h-8 w-40 bg-white/5" />
        <SkeletonCard className="h-80 rounded-2xl border border-white/5 bg-white/5" />
      </div>
    </div>
  );
}
