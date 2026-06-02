import type { NextConfig } from 'next';

function apiRemotePatterns(): NonNullable<NextConfig['images']>['remotePatterns'] {
  const patterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
    { protocol: 'https', hostname: 'images.unsplash.com' },
    { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/uploads/**' },
    { protocol: 'https', hostname: '**.amazonaws.com' },
    { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
  ];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiUrl) return patterns;

  try {
    const parsed = new URL(apiUrl);
    const protocol = parsed.protocol.replace(':', '') as 'http' | 'https';
    patterns.push({
      protocol,
      hostname: parsed.hostname,
      ...(parsed.port ? { port: parsed.port } : {}),
      pathname: '/uploads/**',
    });
  } catch {
    // ignore invalid API URL
  }

  return patterns;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: apiRemotePatterns(),
  },
};

export default nextConfig;
