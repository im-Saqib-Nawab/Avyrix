'use client';

import * as React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCredits } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';

interface CreditBadgeProps {
  credits: number;
  className?: string;
  showLabel?: boolean;
}

export function CreditBadge({ credits, className, showLabel = false }: CreditBadgeProps) {
  const low = credits < 20;
  const medium = credits >= 20 && credits <= 50;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'group inline-flex cursor-default items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200',
              'border-accent-indigo/25 bg-gradient-to-r from-accent-indigo/10 via-accent-violet/10 to-accent-cyan/10',
              'hover:border-accent-cyan/40 hover:shadow-glow-cyan hover:scale-[1.02]',
              low && 'border-error/30 from-error/10 to-error/5 animate-pulse',
              medium && !low && 'border-warning/25 from-warning/10 to-warning/5',
              className,
            )}
          >
            <Zap
              className={cn(
                'h-4 w-4 shrink-0 transition-all duration-200 group-hover:text-accent-cyan',
                low ? 'fill-error text-error' : 'fill-accent-cyan text-accent-cyan',
              )}
            />
            <span className="text-primary tabular-nums">{formatCredits(credits)}</span>
            {showLabel && <span className="text-secondary">credits</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="border-default bg-float text-[10px]">
          Your available generation credits
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
