'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  PlusSquare, 
  Library, 
  History, 
  CreditCard 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MOBILE_TABS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Generate', icon: PlusSquare, href: '/generate/image' },
  { label: 'Library', icon: Library, href: '/library' },
  { label: 'History', icon: History, href: '/history' },
  { label: 'Billing', icon: CreditCard, href: '/billing' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-40 flex w-full max-w-[100vw] items-center justify-around border-t border-white/10 glass-surface px-1 pb-[env(safe-area-inset-bottom)] pt-2 min-h-[56px] md:hidden">
      {MOBILE_TABS.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-1 px-1 py-1.5 transition-all',
              isActive ? 'text-accent-indigo drop-shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'text-muted'
            )}
          >
            <tab.icon className={cn("h-5 w-5", isActive && "fill-accent-indigo/10")} />
            <span className={cn("text-[10px] font-medium", isActive ? "text-accent-indigo" : "text-muted")}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
