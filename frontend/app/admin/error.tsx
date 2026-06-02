'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { ERROR_MESSAGES } from '@/lib/error-messages';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 rounded-full bg-rose-500/10 p-4 text-rose-500">
        <AlertCircle className="h-12 w-12" />
      </div>

      <h1 className="mb-2 text-2xl font-bold text-white">
        Something went wrong
      </h1>
      <p className="mb-8 max-w-md text-secondary">{ERROR_MESSAGES.GENERIC}</p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button
          onClick={() => reset()}
          className="bg-white font-bold text-black hover:bg-white/90"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Link href="/admin">
          <Button
            variant="secondary"
            className="border-white/5 bg-white/5 text-white hover:bg-white/10"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
        </Link>
      </div>
    </div>
  );
}
