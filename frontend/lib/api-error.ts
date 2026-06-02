import type { AxiosError } from 'axios';

type ApiErrorBody = {
  error?: { message?: string; code?: string };
  message?: string;
};

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!error) return fallback;

  if (error instanceof Error && !('isAxiosError' in error && (error as AxiosError).isAxiosError)) {
    return error.message || fallback;
  }

  const err = error as AxiosError<ApiErrorBody>;
  const apiMessage = err.response?.data?.error?.message ?? err.response?.data?.message;
  if (apiMessage) return apiMessage;

  if (!err.response) {
    return 'Cannot reach the server. Make sure the backend is running on port 3001.';
  }

  return fallback;
}

export function getApiErrorCode(error: unknown): string | undefined {
  const err = error as AxiosError<ApiErrorBody>;
  return err.response?.data?.error?.code;
}
