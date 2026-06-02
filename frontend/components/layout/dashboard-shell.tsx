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
    <div className="relative min-h-screen bg-gradient-to-br from-gray-950 via-gray-950 to-black">
      {isChecking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0D12]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
        </div>
      )}

      <div className={cn(isChecking && 'pointer-events-none select-none')}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        <Sidebar />

        <div
          className={cn(
            'relative z-10 flex min-w-0 flex-1 flex-col transition-all duration-300 ease-out',
            'md:ml-14',
            sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-14',
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
                  <div className="group relative overflow-hidden rounded-xl border border-gray-800/50 bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-gray-900/80 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl group-hover:blur-2xl transition-all duration-300" />
                          <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-amber-500/10 to-amber-600/10 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500/40 transition-all duration-300">
                            <AlertTriangle className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-amber-400">
                            Verify Your Email Address
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Please verify your email to unlock all features and access full
                            capabilities
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleResendVerification}
                          disabled={isResending}
                          variant="secondary"
                          size="sm"
                          className={cn(
                            'group/btn relative h-8 px-3 text-xs font-medium',
                            'border-gray-700 bg-gray-800/30 text-gray-300',
                            'hover:border-gray-600 hover:bg-gray-800/50 hover:text-gray-100',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'transition-all duration-200',
                          )}
                        >
                          {isResending ? (
                            <>
                              <div className="h-3 w-3 mr-1.5 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3 mr-1.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                              <span>Resend Email</span>
                            </>
                          )}
                        </Button>

                        <button
                          onClick={() => setDismissBanner(true)}
                          className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center',
                            'text-gray-500 hover:text-gray-300',
                            'hover:bg-gray-800/50',
                            'transition-all duration-200',
                            'focus:outline-none focus:ring-2 focus:ring-gray-700',
                          )}
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
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-900/0 via-gray-900/0 to-gray-900/0 pointer-events-none" />
                  <ErrorBoundary>{children}</ErrorBoundary>
                </div>
              </motion.div>
            </AnimatePresence>
          </main>

          <MobileNav />
        </div>
      </div>
    </div>
  );
}
