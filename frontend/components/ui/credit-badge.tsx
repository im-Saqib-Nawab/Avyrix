'use client';

import * as React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';

interface CreditBadgeProps {
  credits: number;
  className?: string;
}

export function CreditBadge({ credits, className }: CreditBadgeProps) {
  const getStatusColor = () => {
    if (credits > 50) return 'text-success border-success/20 bg-success/5';
    if (credits >= 20) return 'text-warning border-warning/20 bg-warning/5';
    return 'text-error border-error/20 bg-error/5 animate-pulse';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all cursor-default',
              getStatusColor(),
              className
            )}
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>{credits}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px] bg-float border-default">
          Your available generation credits
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
