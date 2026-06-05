'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvyrixLogoProps {
  href?: string;
  expanded?: boolean;
  showTagline?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AvyrixLogo({
  href = '/',
  expanded = true,
  showTagline = false,
  onClick,
  className,
}: AvyrixLogoProps) {
  const content = (
    <>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-indigo to-accent-violet',
          expanded ? 'h-9 w-9' : 'h-8 w-8',
        )}
      >
        <Sparkles className={cn('text-white', expanded ? 'h-5 w-5' : 'h-4 w-4')} />
      </span>
      {expanded && (
        <span className="min-w-0">
          <span
            className={cn(
              'block font-bold tracking-tight text-gradient-primary',
              className ?? 'text-lg',
            )}
          >
            AVYRIX AI
          </span>
          {showTagline && (
            <span className="block truncate text-xs text-secondary">Premium AI Creative Platform</span>
          )}
        </span>
      )}
    </>
  );

  const wrapperClass = cn(
    'flex items-center gap-2.5 transition-opacity hover:opacity-90',
    !expanded && 'justify-center',
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={wrapperClass}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={wrapperClass}>
      {content}
    </Link>
  );
}
