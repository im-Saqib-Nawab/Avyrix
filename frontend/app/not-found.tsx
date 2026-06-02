import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0D12] p-6 text-center">
      <h1 className="mb-4 bg-gradient-hero-text bg-clip-text text-8xl font-black text-transparent">
        404
      </h1>
      <h2 className="mb-3 text-2xl font-bold text-primary">Page not found</h2>
      <p className="mb-10 max-w-sm text-secondary">
        The page you are looking for does not exist or may have been moved.
      </p>

      <Link href="/dashboard">
        <Button variant="primary" className="h-12 min-h-[44px] px-8 font-bold">
          Go to Dashboard
        </Button>
      </Link>
    </div>
  );
}
