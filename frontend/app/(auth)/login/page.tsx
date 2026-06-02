'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DUMMY_GENERATIONS } from '@/lib/dummy-data';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import { AlertCircle, Sparkles, Eye, EyeOff, ArrowRight, Zap, Shield, Camera, Video } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoginPending } = useAuth();
  const { addToast } = useUIStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const previewImages = DUMMY_GENERATIONS.filter(item => item.thumbnail_url).slice(0, 6);

  // Enhanced stats data
  const stats = [
    { value: '10K+', label: 'Active Creators', icon: Zap },
    { value: '1M+', label: 'Images Generated', icon: Camera },
    { value: '99.9%', label: 'Uptime', icon: Shield },
    { value: '24/7', label: 'Support', icon: Sparkles },
  ];

  const features = [
    { title: '4K Generation', description: 'Crystal clear outputs', icon: Camera },
    { title: 'Video Synthesis', description: 'Cinematic AI videos', icon: Video },
    { title: 'Real-time Edit', description: 'Instant adjustments', icon: Zap },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password to continue.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      addToast({
        title: 'Welcome back!',
        description: 'Successfully signed into your workspace.',
        type: 'success',
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Invalid credentials. Please check your email and password.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-gradient-to-br from-[#0A0F1E] via-[#070B17] to-[#030614]">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-fuchsia-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Left Panel - Rich Decorative Showcase */}
      <div className="hidden lg:flex w-1/2 relative bg-[#060B17] items-center justify-center p-8 overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12)_0%,transparent_70%)]" />
        
        <div className="relative z-10 w-full max-w-xl space-y-10">
          {/* Brand + Tagline */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 justify-center"
          >
            <Sparkles className="h-6 w-6 text-indigo-400" />
            <span className="text-sm font-medium tracking-wide text-indigo-300/80 uppercase">AI Studio v3.0</span>
          </motion.div>

          {/* Masonry style creative grid with enhanced hover effects */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-3 gap-3 auto-rows-[140px]"
          >
            {previewImages.map((item, index) => {
              // Dynamic sizing for artistic layout
              let rowSpan = 'row-span-1';
              let colSpan = 'col-span-1';
              let rotation = 0;
              let translateY = 0;
              
              if (index === 0) { rowSpan = 'row-span-2'; colSpan = 'col-span-2'; rotation = -2; translateY = -4; }
              else if (index === 1) { rowSpan = 'row-span-1'; colSpan = 'col-span-1'; rotation = 3; translateY = 6; }
              else if (index === 2) { rowSpan = 'row-span-1'; colSpan = 'col-span-1'; rotation = -1; translateY = -2; }
              else if (index === 3) { rowSpan = 'row-span-1'; colSpan = 'col-span-1'; rotation = 2; translateY = 4; }
              else if (index === 4) { rowSpan = 'row-span-1'; colSpan = 'col-span-2'; rotation = -3; translateY = -3; }
              else { rowSpan = 'row-span-1'; colSpan = 'col-span-1'; rotation = 1; translateY = 2; }
              
              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.03, 
                    rotate: 0, 
                    zIndex: 20,
                    transition: { duration: 0.2 }
                  }}
                  className={`relative ${rowSpan} ${colSpan} rounded-xl overflow-hidden shadow-2xl group cursor-pointer`}
                  style={{ 
                    transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                  <Image 
                    src={item.thumbnail_url as string}
                    alt={`Creative preview ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute bottom-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-medium bg-black/50 backdrop-blur px-2 py-0.5 rounded-full text-white/90">AI Gen</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Inspiring quote + stats preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="space-y-6"
          >
            <p className="text-xl md:text-2xl font-semibold leading-relaxed text-center bg-gradient-to-r from-gray-100 to-indigo-200 bg-clip-text text-transparent">
              “Where imagination meets <br />infinite creation”
            </p>
            
            <div className="flex justify-center gap-6 flex-wrap">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center backdrop-blur-sm bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                  <p className="text-lg font-bold text-indigo-300">{stat.value}</p>
                  <p className="text-[11px] uppercase tracking-wider text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Feature badges */}
          <div className="flex justify-center gap-3 pt-4">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
                <feat.icon className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-xs font-medium">{feat.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Enhanced Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[130px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 0.86, 0.39, 0.96] }}
          className="w-full max-w-md space-y-8 relative z-10"
        >
          {/* Logo + Title Section */}
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full" />
                <div className="relative flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">AVYRIX AI</span>
                </div>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-gray-100 via-indigo-200 to-purple-200 bg-clip-text text-transparent">Welcome back</span>
            </h2>
            <p className="text-gray-400 text-base">Sign in to continue your creative journey</p>
          </div>

          
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  role="alert"
                  className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-red-300 text-sm backdrop-blur-sm"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-1">
                  <span>Email address</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <Input 
                    name="email" 
                    type="email" 
                    placeholder="hello@avyrix.com" 
                    required 
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-[#0F1425]/80 border-white/15 focus:border-indigo-500/50 h-12 rounded-xl backdrop-blur-sm transition-all"
                  />
                </div>
              </div>

              {/* Password Field with toggle */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-300">Password</label>
                  <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <Input 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="········" 
                    required 
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-[#0F1425]/80 border-white/15 focus:border-indigo-500/50 h-12 rounded-xl backdrop-blur-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center gap-2"
              isLoading={isLoading}
            >
              {!isLoading && <span>Sign In</span>}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {/* Signup link + terms */}
          <div className="space-y-5 text-center">
            <p className="text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-all inline-flex items-center gap-1 group">
                Get started free
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
            <div className="text-[11px] text-gray-500 flex justify-center gap-4">
              <Link href="/terms" className="hover:text-gray-300 transition">Terms</Link>
              <Link href="/privacy" className="hover:text-gray-300 transition">Privacy</Link>
              <Link href="/security" className="hover:text-gray-300 transition">Security</Link>
            </div>
          </div>

          {/* Trust badge row (visible only on mobile) */}
          <div className="lg:hidden flex justify-center gap-3 pt-2 text-[11px] text-gray-500">
            <span>⚡ 10K+ creators</span>
            <span>🎨 1M+ images</span>
            <span>🛡️ 99.9% uptime</span>
          </div>
        </motion.div>
      </div>

      {/* floating decorative element */}
      <div className="fixed bottom-6 left-6 hidden lg:flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[11px] text-gray-300 z-50">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
        System operational
      </div>
    </div>
  );
}