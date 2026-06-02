import * as React from 'react';

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-base">
          <p className="text-secondary text-sm">Loading...</p>
        </div>
      }
    >
      {children}
    </React.Suspense>
  );
}
