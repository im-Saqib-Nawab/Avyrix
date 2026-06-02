export type UserRole = 'user' | 'admin';

export type SubscriptionStatus = 'active' | 'free' | 'cancelled' | 'past_due';

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  credit_balance: number;
  subscription_status: SubscriptionStatus;
  is_verified: boolean;
  avatar_initials: string;
}

export interface AuthTokensResponse {
  user: AuthUser;
  accessToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}
