import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'card' | 'avatar' | 'thumbnail';
}

function Skeleton({
  className,
  variant = 'card',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] rounded-md',
        variant === 'text' && 'h-4 w-full',
        variant === 'card' && 'h-48 w-full',
        variant === 'avatar' && 'h-10 w-10 rounded-full',
        variant === 'thumbnail' && 'aspect-video w-full',
        className
      )}
      {...props}
    />
  );
}

export function SkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton variant="text" className={className} {...props} />;
}

export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton variant="card" className={className} {...props} />;
}

export function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton variant="avatar" className={className} {...props} />;
}

export function SkeletonThumbnail({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton variant="thumbnail" className={className} {...props} />;
}

export { Skeleton };
