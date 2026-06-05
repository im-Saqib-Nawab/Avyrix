'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ImageIcon, Video, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function WelcomePanel() {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.full_name?.split(' ')[0] ?? 'Creator';
  const credits = user?.credit_balance ?? 0;

  return (
    <div className="card-gradient-top relative overflow-hidden rounded-3xl border border-white/10 glass-card p-8 shadow-card">
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 rounded-full bg-accent-indigo/15 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent-pink/10 blur-[80px]" />

      <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gradient-hero md:text-4xl">
              {getTimeGreeting()}, {firstName}!
            </h1>
            <p className="text-lg text-secondary">What will you create today?</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/30 bg-gradient-to-r from-accent-indigo/10 to-accent-cyan/10 px-3 py-1.5 animate-glow-pulse">
            <Zap className="h-4 w-4 fill-accent-cyan text-accent-cyan" />
            <span className="text-sm font-medium text-primary">{credits} credits remaining</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/generate/image">
            <Button size="lg" className="h-12 w-full px-8 sm:w-auto">
              <ImageIcon className="mr-2 h-5 w-5" />
              Generate Image
            </Button>
          </Link>
          <Link href="/generate/video">
            <Button variant="secondary" size="lg" className="h-12 w-full px-8 sm:w-auto">
              <Video className="mr-2 h-5 w-5" />
              Generate Video
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
