export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: ApiError;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ApiHealth {
  provider: string;
  status: 'operational' | 'degraded' | 'down';
  success_rate: number;
  avg_latency_ms: number;
}
