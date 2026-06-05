import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        success: 'border-success/30 bg-success/10 text-success badge-glow-success',
        error: 'border-error/30 bg-error/10 text-error badge-glow-error',
        warning: 'border-warning/30 bg-warning/10 text-warning badge-glow-warning',
        info: 'border-accent-indigo/30 bg-accent-indigo/10 text-accent-indigo badge-glow-info',
        neutral: 'border-white/10 bg-white/5 text-muted',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
