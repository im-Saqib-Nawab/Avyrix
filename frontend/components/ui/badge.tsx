import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        success: 'border-transparent bg-success/10 text-success border border-success/20',
        error: 'border-transparent bg-error/10 text-error border border-error/20',
        warning: 'border-transparent bg-warning/10 text-warning border border-warning/20',
        info: 'border-transparent bg-accent-indigo/10 text-accent-indigo border border-accent-indigo/20',
        neutral: 'border-transparent bg-white/5 text-muted border border-white/10',
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
