function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function resolveWsBaseUrl(apiBaseUrl: string): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (explicit) {
    return stripTrailingSlash(explicit);
  }
  if (apiBaseUrl.startsWith('https://')) {
    return apiBaseUrl.replace(/^https:\/\//, 'wss://');
  }
  if (apiBaseUrl.startsWith('http://')) {
    return apiBaseUrl.replace(/^http:\/\//, 'ws://');
  }
  return 'ws://localhost:3001';
}

const apiBaseUrl = stripTrailingSlash(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
const wsBaseUrl = resolveWsBaseUrl(apiBaseUrl);

export const config = {
  apiBaseUrl,
  wsUrl: `${wsBaseUrl}/ws`,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
};
