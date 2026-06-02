export * from './auth.types';
export * from './generation.types';
export * from './credits.types';
export * from './api.types';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export type ToastInput = Omit<Toast, 'id'> & { duration?: number };
