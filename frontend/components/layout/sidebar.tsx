'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ImageIcon,
  Video,
  FolderOpen,
  Clock,
  CreditCard,
  Settings,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import { CreditBadge } from '@/components/ui/credit-badge';
import { AvyrixLogo } from '@/components/brand/avyrix-logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Generate Image', icon: ImageIcon, href: '/generate/image' },
  { label: 'Generate Video', icon: Video, href: '/generate/video' },
  { label: 'My Library', icon: FolderOpen, href: '/library' },
  { label: 'History', icon: Clock, href: '/history' },
  { label: 'Billing', icon: CreditCard, href: '/billing' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Platform Users', icon: UserIcon, href: '/admin/users' },
  { label: 'API Health', icon: ShieldCheck, href: '/admin/api-health' },
];

const ICON_CLASS = 'h-5 w-5 shrink-0';

function SidebarItem({
  item,
  isActive,
  expanded,
}: {
  item: NavItem;
  isActive: boolean;
  expanded: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={!expanded ? item.label : undefined}
      className={cn(
        'group relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
        isActive
          ? 'border border-accent-indigo/25 bg-gradient-to-r from-accent-indigo/20 via-accent-violet/10 to-transparent text-primary shadow-glow-indigo/20'
          : 'border border-transparent text-secondary hover:border-white/5 hover:bg-white/5 hover:text-primary',
      )}
    >
      {isActive && (
        <>
          <div className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-accent-violet via-accent-indigo to-accent-cyan shadow-glow-cyan" />
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-accent-violet/5 to-accent-cyan/5" />
        </>
      )}
      <item.icon
        className={cn(
          ICON_CLASS,
          'transition-all duration-200',
          isActive
            ? 'text-accent-cyan drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'
            : 'text-muted group-hover:text-accent-indigo group-hover:drop-shadow-[0_0_6px_rgba(99,102,241,0.35)]',
        )}
        strokeWidth={2}
      />
      <span
        className={cn(
          'relative whitespace-nowrap transition-all duration-300',
          expanded ? 'lg:inline-block lg:opacity-100' : 'lg:hidden lg:opacity-0',
        )}
      >
        {item.label}
      </span>
      {item.badge && expanded && (
        <span className="relative ml-auto rounded-full bg-accent-indigo/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent-indigo">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { sidebarOpen } = useUIStore();
  const expanded = sidebarOpen;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-white/10 glass-surface transition-all duration-300 md:flex',
        'before:absolute before:inset-y-0 before:right-0 before:w-px before:bg-gradient-to-b before:from-accent-indigo/50 before:via-accent-violet/30 before:to-accent-pink/20',
        expanded ? 'w-[280px]' : 'w-14',
      )}
    >
      <div className="flex h-14 min-h-[56px] items-center border-b border-white/5 px-3">
        <AvyrixLogo href="/dashboard" expanded={expanded} showTagline={expanded} />
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-2 py-6">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            expanded={expanded}
          />
        ))}

        {user?.role === 'admin' && (
          <div className="space-y-1.5 pt-6">
            <div
              className={cn(
                'mb-3 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted transition-opacity',
                expanded ? 'opacity-100' : 'opacity-0',
              )}
            >
              <span className="text-gradient-primary">Administration</span>
            </div>
            {ADMIN_ITEMS.map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                isActive={pathname.startsWith(item.href)}
                expanded={expanded}
              />
            ))}
          </div>
        )}
      </nav>

      <div className="space-y-4 border-t border-white/5 p-3">
        <div className="flex justify-center">
          {expanded ? (
            <CreditBadge credits={user?.credit_balance ?? 0} showLabel className="w-full justify-between" />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent-indigo/20 bg-gradient-to-br from-accent-indigo/15 to-accent-cyan/15 text-accent-cyan transition-all duration-200 hover:scale-110 hover:shadow-glow-cyan"
              title={`${user?.credit_balance ?? 0} credits`}
            >
              <Zap className="h-5 w-5 fill-current" strokeWidth={2} />
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition-all duration-200 hover:border-white/5 hover:bg-white/5 hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-violet via-accent-indigo to-accent-cyan text-sm font-bold text-white shadow-glow-indigo">
                {user?.avatar_initials || 'AM'}
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-section bg-success" />
              </div>
              <div
                className={cn(
                  'min-w-0 flex-1 transition-all duration-300',
                  expanded ? 'block opacity-100' : 'hidden opacity-0',
                )}
              >
                <p className="truncate text-sm font-semibold text-primary">
                  {user?.full_name || 'Alex Morgan'}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted">{user?.role || 'user'}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="right"
            sideOffset={12}
            className="w-56 border border-white/10 glass-card shadow-2xl"
          >
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-white/10 focus:bg-white/10">
              <Link href="/settings" className="flex w-full items-center gap-2 text-sm text-secondary">
                <UserIcon className="h-4 w-4" strokeWidth={2} />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void logout()}
              className="mt-1 cursor-pointer rounded-lg p-2 text-error transition-colors hover:bg-error/10 hover:text-error focus:bg-error/10 focus:text-error"
            >
              <LogOut className="mr-2 h-4 w-4" strokeWidth={2} />
              <span className="text-sm font-medium">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
