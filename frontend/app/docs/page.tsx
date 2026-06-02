'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Code2, 
  HelpCircle, 
  Search,
  MessageSquare,
  Zap,
  ArrowRight,
  ShieldCheck,
  Globe
} from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
  const categories = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of AVYRIX AI and generate your first image.',
      icon: Zap,
      articles: 5
    },
    {
      title: 'Pro Prompting',
      description: 'Master the art of prompt engineering for cinematic results.',
      icon: HelpCircle,
      articles: 12
    },
    {
      title: 'API Reference',
      description: 'Integrate AVYRIX into your own apps with our powerful SDK.',
      icon: Code2,
      articles: 8
    },
    {
      title: 'Billing & Subscriptions',
      description: 'Everything you need to know about credits and invoicing.',
      icon: ShieldCheck,
      articles: 4
    }
  ];

  return (
    <div className="bg-[#0B0D12] min-h-screen text-white selection:bg-accent-indigo/30">
      {/* Search Header */}
      <div className="relative py-24 border-b border-white/5 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(99,102,241,0.15),transparent_70%)]" />
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative">
          <BookOpen className="w-12 h-12 text-accent-indigo mx-auto" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">How can we help?</h1>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input 
              type="text"
              placeholder="Search for documentation, guides, or API endpoints..."
              className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm focus:border-accent-indigo outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <Card key={i} className="p-8 bg-card border-default hover:border-accent-indigo/50 transition-all group cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-accent-indigo/10 flex items-center justify-center text-accent-indigo mb-6 group-hover:scale-110 transition-transform">
                <cat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-3">{cat.title}</h3>
              <p className="text-sm text-secondary mb-6 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
              <div className="flex items-center text-xs font-bold text-accent-indigo uppercase tracking-widest gap-2">
                {cat.articles} Articles
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          ))}
        </div>

        {/* Support Section */}
        <div className="mt-32 p-12 rounded-[2.5rem] bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-12">
           <div className="space-y-4 text-center md:text-left">
              <h2 className="text-3xl font-black">Can&apos;t find what you&apos;re looking for?</h2>
              <p className="text-secondary max-w-md">Our support team is available 24/7 to help you with any questions or technical issues.</p>
           </div>
           <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="h-14 px-8 bg-accent-indigo border-0 font-bold">
                 <MessageSquare className="w-5 h-5 mr-3" />
                 Contact Support
              </Button>
              <Button size="lg" variant="secondary" className="h-14 px-8 bg-white/5 border-white/10 text-white font-bold">
                 <Globe className="w-5 h-5 mr-3" />
                 Community Forum
              </Button>
           </div>
        </div>
      </div>

      {/* Footer Nav */}
      <div className="border-t border-white/5 py-12">
         <div className="max-w-6xl mx-auto px-6 flex justify-between items-center text-xs font-bold text-muted uppercase tracking-[0.2em]">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-2 font-black">
                <div className="w-6 h-6 rounded bg-gradient-primary" />
                AVYRIX Docs
            </Link>
            <div className="flex gap-8">
               <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
               <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
         </div>
      </div>
    </div>
  );
}
