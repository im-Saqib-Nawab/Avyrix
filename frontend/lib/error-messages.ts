export const ERROR_MESSAGES = {
  CONTENT_POLICY:
    'Your prompt was declined by the content safety filter. Please modify and try again.',
  API_UNAVAILABLE:
    'Our AI service is temporarily unavailable. Please try again in a moment.',
  INSUFFICIENT_CREDITS:
    "You don't have enough credits. Purchase more to continue.",
  GENERIC: 'Something went wrong. Please try again.',
} as const;

export type GenerationErrorCode =
  | 'content_policy'
  | 'api_unavailable'
  | 'insufficient_credits'
  | 'unknown';

export function getGenerationErrorMessage(code: GenerationErrorCode): string {
  switch (code) {
    case 'content_policy':
      return ERROR_MESSAGES.CONTENT_POLICY;
    case 'api_unavailable':
      return ERROR_MESSAGES.API_UNAVAILABLE;
    case 'insufficient_credits':
      return ERROR_MESSAGES.INSUFFICIENT_CREDITS;
    default:
      return ERROR_MESSAGES.GENERIC;
  }
}
