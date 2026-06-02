'use client';

import * as React from 'react';
import { Menu, Bell, Sparkles, ChevronRight } from 'lucide-react';
import { CreditBadge } from '@/components/ui/credit-badge';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TopbarProps {
  title?: string;
  breadcrumb?: { label: string; href?: string }[];
}

export function Topbar({ title, breadcrumb }: TopbarProps) {
  const { user } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const [showNotifications, setShowNotifications] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 min-h-[56px] items-center justify-between border-b border-white/10 bg-base/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-secondary transition-all duration-200 hover:bg-white/10 hover:text-primary hover:scale-110 lg:flex"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {title && (
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-primary truncate md:text-base">
              {title}
            </h1>
            {breadcrumb && breadcrumb.length > 0 && (
              <div className="hidden items-center gap-2 text-sm text-muted md:flex">
                <ChevronRight className="h-4 w-4" />
                {breadcrumb.map((item, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight className="h-3 w-3" />}
                    <span className={cn(
                      'text-muted',
                      idx === breadcrumb.length - 1 && 'text-primary font-medium'
                    )}>
                      {item.label}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Create Button */}
        <button className="hidden items-center gap-2 rounded-lg bg-gradient-to-r from-accent-indigo/10 to-accent-violet/10 px-3 py-2 text-sm font-medium text-accent-indigo transition-all hover:scale-105 hover:shadow-glow-indigo sm:flex">
          <Sparkles className="h-4 w-4" />
          <span>Quick Create</span>
        </button>

        <CreditBadge 
          credits={user?.credit_balance ?? 0} 
          className="hidden sm:flex rounded-xl border border-accent-indigo/20 bg-gradient-to-r from-accent-indigo/10 to-accent-violet/10"
        />
        
        <div className="relative">
          <button 
            className="relative rounded-md p-2 text-muted transition-all duration-200 hover:bg-white/10 hover:text-primary hover:scale-110"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-accent-indigo to-accent-cyan ring-2 ring-base" />
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl"
              >
                <div className="p-4">
                  <p className="text-sm font-semibold text-primary">Notifications</p>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10">
                      <p className="text-xs text-secondary">Your image generation is complete!</p>
                      <p className="mt-1 text-[10px] text-muted">2 min ago</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10">
                      <p className="text-xs text-secondary">Credit balance is running low</p>
                      <p className="mt-1 text-[10px] text-muted">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-indigo via-accent-violet to-accent-cyan text-[10px] font-bold text-white shadow-glow-indigo transition-all hover:scale-110 md:hidden">
          {user?.avatar_initials || 'AM'}
        </div>
      </div>
    </header>
  );
}