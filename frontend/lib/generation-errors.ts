import type { GenerationErrorCode } from '@/lib/error-messages';
import { getGenerationErrorMessage } from '@/lib/error-messages';

type ApiErrorCode =
  | GenerationErrorCode
  | 'CONTENT_POLICY_VIOLATION'
  | 'SERVICE_UNAVAILABLE'
  | 'INSUFFICIENT_CREDITS';

const API_CODE_MAP: Record<string, GenerationErrorCode> = {
  CONTENT_POLICY_VIOLATION: 'content_policy',
  content_policy: 'content_policy',
  SERVICE_UNAVAILABLE: 'api_unavailable',
  api_unavailable: 'api_unavailable',
  INSUFFICIENT_CREDITS: 'insufficient_credits',
  insufficient_credits: 'insufficient_credits',
};

export function resolveGenerationErrorMessage(
  code: ApiErrorCode | string
): string {
  const mapped = API_CODE_MAP[code] ?? 'unknown';
  return getGenerationErrorMessage(mapped);
}

export { getGenerationErrorMessage };
