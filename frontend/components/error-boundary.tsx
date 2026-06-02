'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Home, Mail } from 'lucide-react';
import { ERROR_MESSAGES } from '@/lib/error-messages';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center"
        >
          <div className="mb-6 rounded-full bg-gradient-to-br from-error/20 to-rose-500/20 p-5 shadow-glow-error">
            <AlertCircle className="h-14 w-14 text-error" />
          </div>
          
          <h1 className="mb-3 text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Something went wrong
          </h1>
          
          <p className="mb-2 max-w-md text-secondary">
            {this.state.error?.message || ERROR_MESSAGES.GENERIC}
          </p>
          
          <p className="mb-8 max-w-md text-sm text-muted">
            Our team has been notified. Please try again or contact support if the issue persists.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={this.handleRetry}
              variant="primary"
              size="lg"
              leftIcon={<RefreshCcw className="h-4 w-4" />}
            >
              Try again
            </Button>
            
            <Link href="/dashboard">
              <Button variant="secondary" size="lg" leftIcon={<Home className="h-4 w-4" />}>
                Go to Dashboard
              </Button>
            </Link>
            
            <Link href="/support">
              <Button variant="ghost" size="lg" leftIcon={<Mail className="h-4 w-4" />}>
                Contact Support
              </Button>
            </Link>
          </div>
          
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-8 max-w-lg rounded-lg border border-white/10 bg-error/5 p-4 text-left">
              <p className="text-xs font-mono text-error break-all">
                {this.state.error.stack}
              </p>
            </div>
          )}
        </motion.div>
      );
    }

    return this.props.children;
  }
}