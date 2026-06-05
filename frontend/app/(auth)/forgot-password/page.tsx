'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [email, setEmail] = React.useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
    } catch {
      // security: always show success
    } finally {
      setIsSubmitted(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-card border border-default rounded-2xl shadow-card overflow-hidden animate-fade-up"
      >
        <div className="p-8 space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gradient-primary inline-block">AVYRIX AI</h1>
            {!isSubmitted ? (
              <>
                <h2 className="text-2xl font-bold text-primary">Reset password</h2>
                <p className="text-secondary text-sm">Enter your email and we&apos;ll send you a link to reset your password.</p>
              </>
            ) : (
              <>
                <div className="flex justify-center py-2">
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-primary">Check your email</h2>
                <p className="text-secondary text-sm">We&apos;ve sent a password reset link to your email address.</p>
              </>
            )}
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-secondary px-0.5">Email address</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" variant="primary" className="w-full h-11 min-w-[160px]" isLoading={isLoading}>
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <button 
                onClick={() => setIsSubmitted(false)}
                className="w-full text-center text-sm text-accent-indigo hover:underline font-medium"
              >
                Try another email
              </button>
            </div>
          )}

          <div className="pt-2 text-center">
             <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
             </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
