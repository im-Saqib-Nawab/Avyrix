import type { User } from '@prisma/client';
import type { AuthUser, SubscriptionStatus, UserRole } from '@/types/auth.types';

export const REFRESH_COOKIE_NAME = 'refresh_token';

export const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function getAvatarInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function toAuthUser(
  user: Pick<
    User,
    | 'id'
    | 'full_name'
    | 'email'
    | 'role'
    | 'credit_balance'
    | 'subscription_status'
    | 'is_verified'
  >,
): AuthUser {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role as UserRole,
    credit_balance: user.credit_balance,
    subscription_status: user.subscription_status as SubscriptionStatus,
    is_verified: user.is_verified,
    avatar_initials: getAvatarInitials(user.full_name),
  };
}
