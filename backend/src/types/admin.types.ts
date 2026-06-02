export interface AdminStatsResponse {
  total_users: number;
  active_users_today: number;
  total_generations: number;
  total_generations_today: number;
  image_generations: number;
  image_generations_today: number;
  video_generations: number;
  video_generations_today: number;
  credits_consumed_today: number;
  total_revenue: number;
}

export interface AdminUserListItem {
  id: string;
  full_name: string;
  email: string;
  role: string;
  credit_balance: number;
  subscription_status: string;
  created_at: string;
  generation_count: number;
}

export interface ProviderHealthStatus {
  name: string;
  provider: string;
  status: 'operational' | 'degraded' | 'down' | 'online' | 'offline';
  success_rate: number;
  last_success_at: string | null;
  last_checked: string;
  avg_response_time_ms: number;
  latency_ms: number;
}

export interface ApiHealthResponse {
  providers: ProviderHealthStatus[];
}
