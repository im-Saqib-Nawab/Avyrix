'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/store/auth.store';
import { CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react';

type VerifyState = 'loading' | 'success' | 'expired' | 'invalid';

function normalizeToken(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = normalizeToken(searchParams.get('token'));
  const { user, setUser, isAuthenticated } = useAuthStore();
  const [state, setState] = React.useState<VerifyState>(() => (token ? 'loading' : 'invalid'));
  const [message, setMessage] = React.useState(() =>
    token ? '' : 'Invalid verification link.',
  );
  const [isResending, setIsResending] = React.useState(false);
  const [resendMessage, setResendMessage] = React.useState<string | null>(null);
  const verifyAttemptedRef = React.useRef(false);

  React.useEffect(() => {
    if (!token || verifyAttemptedRef.current) return;
    verifyAttemptedRef.current = true;

    const verify = async () => {
      try {
        const res = await api.post('/api/auth/verify-email', { token });
        const verifiedUser = res.data.data.user;
        if (verifiedUser) {
          setUser(verifiedUser);
        } else if (user) {
          setUser({ ...user, is_verified: true });
        }
        setState('success');
        setMessage(res.data.data.message || 'Email verified successfully.');
      } catch (error) {
        const errMsg = getApiErrorMessage(error, 'Verification failed.');
        const code = getApiErrorCode(error);
        if (code === 'RATE_LIMIT_EXCEEDED') {
          setState('invalid');
          setMessage('Too many requests. Please wait a moment and try again.');
          verifyAttemptedRef.current = false;
          return;
        }
        if (errMsg.toLowerCase().includes('expired')) {
          setState('expired');
        } else if (errMsg.toLowerCase().includes('already verified')) {
          setState('success');
        } else {
          setState('invalid');
        }
        setMessage(errMsg);
      }
    };

    void verify();
  }, [token, setUser, user]);

  const handleResend = async () => {
    if (!isAuthenticated) {
      setResendMessage('Please sign in to resend the verification email.');
      return;
    }
    setIsResending(true);
    setResendMessage(null);
    try {
      const res = await api.post('/api/auth/resend-verification');
      setResendMessage(res.data.data.message || 'Verification email sent. Check your inbox.');
      setState('expired');
      setMessage('A new verification link has been sent to your email.');
    } catch (error) {
      setResendMessage(getApiErrorMessage(error, 'Could not resend verification email.'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border border-default rounded-2xl shadow-card p-8 space-y-6 text-center"
      >
        {state === 'loading' && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-accent-indigo mx-auto" />
            <p className="text-secondary">Verifying your email...</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <h1 className="text-xl font-bold text-primary">Email verified</h1>
            <p className="text-secondary text-sm">{message}</p>
            <Link href="/dashboard">
              <Button variant="primary" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </>
        )}

        {state === 'expired' && (
          <>
            <Mail className="h-12 w-12 text-amber-400 mx-auto" />
            <h1 className="text-xl font-bold text-primary">Link expired</h1>
            <p className="text-secondary text-sm">{message}</p>
            <Button
              variant="primary"
              className="w-full"
              isLoading={isResending}
              onClick={() => void handleResend()}
            >
              Resend verification email
            </Button>
            {resendMessage && <p className="text-xs text-secondary">{resendMessage}</p>}
            <Link href="/login" className="text-sm text-accent-indigo hover:underline block">
              Back to sign in
            </Link>
          </>
        )}

        {state === 'invalid' && (
          <>
            <AlertCircle className="h-12 w-12 text-error mx-auto" />
            <h1 className="text-xl font-bold text-primary">Could not verify</h1>
            <p className="text-secondary text-sm">{message}</p>
            {isAuthenticated && (
              <Button
                variant="primary"
                className="w-full"
                isLoading={isResending}
                onClick={() => void handleResend()}
              >
                Resend verification email
              </Button>
            )}
            {resendMessage && <p className="text-xs text-secondary">{resendMessage}</p>}
            <Link href="/login">
              <Button variant="secondary" className="w-full">
                Back to sign in
              </Button>
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
