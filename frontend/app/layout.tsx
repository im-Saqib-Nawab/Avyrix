import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: {
    default: 'AVYRIX AI | Premium AI Creative Platform',
    template: '%s | AVYRIX AI'
  },
  description: 'Unleash your creativity with AVYRIX AI. Generate high-fidelity images and cinematic videos with the world’s most advanced AI creative engine.',
  keywords: ['AI Image Generation', 'AI Video Generation', 'Creative Tools', 'Artificial Intelligence', 'SaaS'],
  authors: [{ name: 'AVYRIX Team' }],
  creator: 'AVYRIX',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen bg-base text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
