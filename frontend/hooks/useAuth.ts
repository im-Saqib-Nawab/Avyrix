'use client';

import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { persistAuthSession, clearAuthSession } from '@/lib/auth-session';
import { disconnectWebSocket } from '@/lib/ws-client';
import { useAuthStore } from '@/store/auth.store';
import { useCreditsStore } from '@/store/credits.store';
import type { User } from '@/types';

type LoginPayload = { email: string; password: string };
type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser, clearAuth, setLoading } = useAuthStore();
  const setBalance = useCreditsStore((s) => s.setBalance);
  const resetCredits = useCreditsStore((s) => s.resetCredits);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: LoginPayload) => {
      try {
        const response = await api.post('/api/auth/login', {
          email: email.trim().toLowerCase(),
          password,
        });
        const { user: nextUser, accessToken } = response.data.data as {
          user: User;
          accessToken: string;
        };
        return { user: nextUser, accessToken };
      } catch (error) {
        throw new Error(
          getApiErrorMessage(
            error,
            'Invalid credentials. Please check your email and password.',
          ),
        );
      }
    },
    onSuccess: ({ user: nextUser, accessToken }) => {
      persistAuthSession(nextUser, accessToken);
      setUser(nextUser);
      setBalance(nextUser.credit_balance);
      router.replace('/dashboard');
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ fullName, email, password, confirmPassword }: RegisterPayload) => {
      try {
        const response = await api.post('/api/auth/register', {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirm_password: confirmPassword,
        });
        const { user: nextUser, accessToken } = response.data.data as {
          user: User;
          accessToken: string;
        };
        return { user: nextUser, accessToken };
      } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Registration failed. Please try again.'));
      }
    },
    onSuccess: ({ user: nextUser, accessToken }) => {
      persistAuthSession(nextUser, accessToken);
      setUser(nextUser);
      setBalance(nextUser.credit_balance);
      router.replace('/dashboard');
    },
  });

  const logout = React.useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // clear local state regardless
    } finally {
      disconnectWebSocket();
      clearAuthSession();
      clearAuth();
      resetCredits();
      router.replace('/login');
    }
  }, [clearAuth, resetCredits, router]);

  const refreshMe = React.useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const res = await api.get('/api/auth/me');
      const nextUser = res.data.data.user as User;
      setUser(nextUser);
      setBalance(nextUser.credit_balance);
      return nextUser;
    } catch {
      disconnectWebSocket();
      clearAuthSession();
      clearAuth();
      return null;
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [clearAuth, setBalance, setLoading, setUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    refreshMe,
    loginError: loginMutation.error ? getApiErrorMessage(loginMutation.error) : null,
    registerError: registerMutation.error ? getApiErrorMessage(registerMutation.error) : null,
    loginStatus: loginMutation.status,
    registerStatus: registerMutation.status,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
  } as const;
}
