'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useAuth } from '@/hooks/useAuth';
import { useCreditSync } from '@/hooks/useCreditSync';
import { clearAuthSession, getAccessToken } from '@/lib/auth-session';
import { disconnectWebSocket } from '@/lib/ws-client';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/error-boundary';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { refreshMe } = useAuth();
  const { sidebarOpen, setSidebarOpen, addToast } = useUIStore();
  const [dismissBanner, setDismissBanner] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);

  useCreditSync();

  React.useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      const me = await refreshMe({ silent: false });
      if (!me) {
        disconnectWebSocket();
        clearAuthSession();
        router.replace('/login');
        return;
      }
      setIsChecking(false);
    };
    void checkAuth();
  }, [refreshMe, router]);

  React.useEffect(() => {
    const syncSidebar = () => {
      setSidebarOpen(window.matchMedia('(min-width: 1024px)').matches);
    };
    syncSidebar();
    window.addEventListener('resize', syncSidebar);
    return () => window.removeEventListener('resize', syncSidebar);
  }, [setSidebarOpen]);

  const getPageTitle = () => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'Dashboard';
    const lastPart = parts[parts.length - 1];
    if (lastPart === 'billing') return 'Billing & Credits';
    if (lastPart === 'settings') return 'Settings';
    if (lastPart === 'generations') return 'My Creations';
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, ' ');
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await api.post('/api/auth/resend-verification');
      addToast({
        title: 'Verification email sent',
        description: 'Check your inbox for the new link.',
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Could not resend email',
        description: getApiErrorMessage(error, 'Please try again later.'),
        type: 'error',
      });
    } finally {
      setIsResending(false);
    }
  };

  const showVerificationBanner = user && !user.is_verified && !dismissBanner;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#0F0F1A] via-[#1A1A2E] to-[#0F0F1A]">
      {isChecking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-base">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-accent-indigo" />
        </div>
      )}

      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="ambient-orb ambient-orb-indigo -left-32 -top-32 h-96 w-96 animate-pulse" />
        <div className="ambient-orb ambient-orb-violet right-0 top-1/4 h-80 w-80 animate-pulse [animation-delay:1s]" />
        <div className="ambient-orb ambient-orb-pink bottom-0 left-1/3 h-72 w-72 animate-pulse [animation-delay:2s]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className={cn(isChecking && 'pointer-events-none select-none')}>
        <Sidebar />

        <div
          className={cn(
            'relative z-10 flex min-w-0 flex-1 flex-col transition-all duration-300 ease-out',
            'md:ml-14',
            sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-14',
          )}
        >
          <Topbar title={getPageTitle()} />

          <AnimatePresence mode="wait">
            {showVerificationBanner && (
              <motion.div
                initial={{ opacity: 0, y: -30, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -30, height: 0 }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                  opacity: { duration: 0.2 },
                }}
                className="relative overflow-hidden"
              >
                <div className="mx-4 mt-4 md:mx-6">
                  <div className="group relative overflow-hidden rounded-xl border border-warning/20 glass-card">
                    <div className="absolute inset-0 bg-gradient-to-r from-warning/0 via-warning/5 to-warning/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative flex flex-col justify-between gap-3 px-4 py-3.5 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-warning/20 blur-xl transition-all duration-300 group-hover:blur-2xl" />
                          <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-warning/30 bg-warning/10 transition-all duration-300 group-hover:border-warning/50">
                            <AlertTriangle className="h-4 w-4 text-warning transition-transform duration-300 group-hover:scale-110" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-warning">Verify Your Email Address</p>
                          <p className="mt-0.5 text-xs text-secondary">
                            Please verify your email to unlock all features and access full capabilities
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleResendVerification}
                          disabled={isResending}
                          variant="secondary"
                          size="sm"
                          className="h-8 px-3 text-xs"
                        >
                          {isResending ? (
                            <>
                              <div className="mr-1.5 h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-transparent" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="mr-1.5 h-3 w-3" />
                              <span>Resend Email</span>
                            </>
                          )}
                        </Button>

                        <button
                          onClick={() => setDismissBanner(true)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-all duration-200 hover:bg-white/10 hover:text-primary"
                          aria-label="Dismiss"
                        >
                          <X className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <main className="flex-1 overflow-x-hidden pb-20 md:pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.25,
                  ease: [0.4, 0, 0.2, 1],
                  opacity: { duration: 0.2 },
                }}
                className="px-4 py-4 md:px-6 md:py-6"
              >
                <ErrorBoundary>{children}</ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </main>

          <MobileNav />
        </div>
      </div>
    </div>
  );
}
