/**
 * Reset password page.
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/ui.store';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [errors, setErrors] = React.useState<{ password?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!password) next.password = 'Password is required.';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (!confirmPassword) next.confirmPassword = 'Please confirm your password.';
    else if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      addToast({
        title: 'Password updated',
        description: 'You can now sign in with your new password.',
        type: 'success',
      });
      router.replace('/login');
    } catch {
      addToast({
        title: 'Reset failed',
        description: 'Please try again later.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border border-default rounded-2xl shadow-card overflow-hidden"
      >
        <div className="p-8 space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gradient-primary inline-block">AVYRIX AI</h1>
            <h2 className="text-2xl font-bold text-primary">New password</h2>
            <p className="text-secondary text-sm">Create a secure password for your account.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-secondary px-0.5">New Password</label>
                <Input 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  type="password" 
                  placeholder="••••••••"
                  required 
                  disabled={isLoading}
                  error={errors.password}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-secondary px-0.5">Confirm Password</label>
                <Input 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  type="password" 
                  placeholder="••••••••"
                  required 
                  disabled={isLoading}
                  error={errors.confirmPassword}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11" isLoading={isLoading}>
              Update password
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
