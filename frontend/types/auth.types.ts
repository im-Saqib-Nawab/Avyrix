export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'admin';
  credit_balance: number;
  subscription_status: 'active' | 'free' | 'cancelled' | 'past_due';
  is_verified: boolean;
  avatar_initials: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload extends LoginPayload {
  full_name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
