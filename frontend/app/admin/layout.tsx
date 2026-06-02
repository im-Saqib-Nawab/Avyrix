'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { clearAuthSession, getAccessToken } from '@/lib/auth-session';
import { LayoutDashboard, Users, Activity, ArrowLeft, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { id: 'overview', label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { id: 'users', label: 'Users', href: '/admin/users', icon: Users },
  { id: 'health', label: 'API Health', href: '/admin/api-health', icon: Activity },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const checkAdmin = async () => {
      const token = getAccessToken();
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        const res = await api.get('/api/auth/me');
        const role = res.data.data.user.role as string;
        if (role !== 'admin') {
          router.replace('/dashboard');
          return;
        }
        setIsAdmin(true);
      } catch {
        clearAuthSession();
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    };
    void checkAdmin();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0B0D12] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-[#090B10]">
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0C0F15] lg:flex">
        <div className="p-5">
          <div className="mb-6 space-y-2 border-b border-white/[0.06] pb-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/[0.05] flex items-center justify-center">
                <Shield className="h-4 w-4 text-gray-400" />
              </div>
              <h2 className="text-base font-semibold text-white">AVYRIX Admin</h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning" className="text-[10px] font-medium tracking-wide bg-white/[0.08] text-gray-300 border-none">
                Admin Access
              </Badge>
            </div>
            <p className="text-[11px] text-gray-500">System management panel</p>
          </div>

          <nav className="space-y-1">
            {ADMIN_NAV.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-gray-400 hover:bg-white/[0.04] hover:text-white',
                  )}
                >
                  <item.icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-gray-500')} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-5 pt-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] px-3 py-2.5 text-sm text-gray-400 transition-all hover:bg-white/[0.04] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="p-5 md:p-7">{children}</div>
      </main>
    </div>
  );
}
