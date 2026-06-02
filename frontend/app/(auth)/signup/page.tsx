'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DUMMY_GENERATIONS } from '@/lib/dummy-data';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';
import { 
  AlertCircle, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle, 
  Zap,
  Camera,
  Shield,
  Star,
  Users,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function SignupPage() {
  const { register } = useAuth();
  const { addToast } = useUIStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  
  const previewImages = DUMMY_GENERATIONS.filter((item) => item.thumbnail_url).slice(0, 6);

  // Expanded stats for left panel
  

  const benefits = [
    '100 free credits on signup',
    'Access to 20+ AI models',
    'Commercial usage rights',
    'Cancel anytime',
  ];

  const calculatePasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-600' };
    
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    // Normalize to 1-4 range
    const normalizedScore = Math.min(Math.max(Math.ceil(score / 1.5), 1), 4);
    
    const strengthMap: Record<number, { label: string; color: string }> = {
      1: { label: 'Weak', color: 'bg-red-500' },
      2: { label: 'Fair', color: 'bg-orange-500' },
      3: { label: 'Good', color: 'bg-yellow-500' },
      4: { label: 'Strong', color: 'bg-emerald-500' },
    };
    
    return { score: normalizedScore, ...strengthMap[normalizedScore] };
  };

  const passwordStrength = calculatePasswordStrength(password);
  
  const getPasswordRequirements = () => {
    const requirements = [
      { text: 'At least 8 characters', met: password.length >= 8 },
      { text: 'Uppercase letter', met: /[A-Z]/.test(password) },
      { text: 'Lowercase letter', met: /[a-z]/.test(password) },
      { text: 'Number', met: /[0-9]/.test(password) },
    ];
    return requirements;
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter';
        if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain a number';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const pass = formData.get('password') as string;
    const confirmPass = formData.get('confirmPassword') as string;

    // Validate all fields
    const newErrors: Record<string, string> = {};
    const fullNameErr = validateField('fullName', fullName);
    const emailErr = validateField('email', email);
    const passwordErr = validateField('password', pass);
    const confirmErr = validateField('confirmPassword', confirmPass);
    if (fullNameErr) newErrors.fullName = fullNameErr;
    if (emailErr) newErrors.email = emailErr;
    if (passwordErr) newErrors.password = passwordErr;
    if (confirmErr) newErrors.confirmPassword = confirmErr;
    if (!acceptedTerms) newErrors.terms = 'You must accept the terms';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      await register({ fullName, email, password: pass, confirmPassword: confirmPass });
      addToast({
        title: 'Welcome to AVYRIX AI!',
        description: 'Your account is ready. You received 100 welcome credits!',
        type: 'success',
      });
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Registration failed.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-gradient-to-br from-[#0A0F1E] via-[#070B17] to-[#030614]">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[130px] animate-pulse" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[150px] animate-pulse delay-700" />
        <div className="absolute top-[50%] left-[40%] w-[350px] h-[350px] bg-fuchsia-500/8 rounded-full blur-[100px]" />
      </div>

      {/* Left Panel - Rich Decorative Showcase with Benefits */}
      <div className="hidden lg:flex w-1/2 relative bg-[#060B17]/80 items-center justify-center p-10 overflow-hidden border-r border-white/5 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.1)_0%,transparent_70%)]" />
        
        <div className="relative z-10 w-full max-w-xl space-y-10">
          {/* Brand Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-2"
          >
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-4 py-2 rounded-full border border-white/10">
              <span className="text-sm font-semibold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                ✨ Join 10,000+ creators
              </span>
            </div>
          </motion.div>

          {/* Hero Quote */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                Start creating stunning<br />visuals in seconds
              </span>
            </h2>
            <p className="text-gray-400 mt-3 text-lg">
              No credit card required • 7-day free trial
            </p>
          </motion.div>

          {/* Creative Grid Gallery - Enhanced */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-4 gap-2 auto-rows-[100px]"
          >
            {previewImages.map((item, index) => {
              // Dynamic sizing for artistic layout
              let className = "relative rounded-xl overflow-hidden shadow-xl group cursor-pointer";
              if (index === 0) className += " col-span-2 row-span-2";
              if (index === 2) className += " col-span-1 row-span-1";
              if (index === 3) className += " col-span-1 row-span-1";
              if (index === 4) className += " col-span-2 row-span-1";
              if (index === 5) className += " col-span-1 row-span-1";
              
              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, zIndex: 10, transition: { duration: 0.2 } }}
                  className={className}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                  <Image 
                    src={item.thumbnail_url as string}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute bottom-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/60 backdrop-blur rounded-full p-1">
                      <Sparkles className="h-2.5 w-2.5 text-indigo-300" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>



          {/* Benefits List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl p-4 border border-white/10"
          >
            <p className="text-xs font-semibold text-indigo-300 mb-2 text-center">✨ FREE TRIAL INCLUDES</p>
            <div className="flex flex-wrap justify-center gap-3">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-300">
                  <CheckCircle className="h-3 w-3 text-emerald-400" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Enhanced Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[130px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 0.86, 0.39, 0.96] }}
          className="w-full max-w-md space-y-6 relative z-10"
        >
          {/* Logo + Title Section */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full" />
                <div className="relative flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">AVYRIX AI</span>
                </div>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-gray-100 via-indigo-200 to-purple-200 bg-clip-text text-transparent">Create account</span>
            </h2>
            <p className="text-gray-400 text-sm">Start your creative journey — free for 7 days</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-1">
                Full name <span className="text-red-400">*</span>
              </label>
              <Input 
                name="fullName" 
                placeholder="Alex Morgan" 
                required 
                disabled={isLoading}
                onBlur={(e) => handleBlur('fullName', e.target.value)}
                className={cn(
                  "bg-[#0F1425]/80 border-white/15 focus:border-indigo-500/50 h-11 rounded-xl backdrop-blur-sm transition-all",
                  errors.fullName && touched.fullName && "border-red-500/50 focus:border-red-500"
                )}
              />
              <AnimatePresence>
                {errors.fullName && touched.fullName && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.fullName}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-1">
                Email address <span className="text-red-400">*</span>
              </label>
              <Input 
                name="email" 
                type="email" 
                placeholder="hello@avyrix.com" 
                required 
                disabled={isLoading}
                onBlur={(e) => handleBlur('email', e.target.value)}
                className={cn(
                  "bg-[#0F1425]/80 border-white/15 focus:border-indigo-500/50 h-11 rounded-xl backdrop-blur-sm",
                  errors.email && touched.email && "border-red-500/50"
                )}
              />
              <AnimatePresence>
                {errors.email && touched.email && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password Field with Strength Indicator */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-1">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Create a strong password" 
                  required 
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) handleBlur('password', e.target.value);
                  }}
                  onBlur={(e) => handleBlur('password', e.target.value)}
                  className={cn(
                    "bg-[#0F1425]/80 border-white/15 focus:border-indigo-500/50 h-11 rounded-xl backdrop-blur-sm pr-10",
                    errors.password && touched.password && "border-red-500/50"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Strength Bar */}
              {password && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div 
                        key={level} 
                        className={cn(
                          "flex-1 rounded-full transition-all duration-300",
                          passwordStrength.score >= level ? passwordStrength.color : "bg-white/10"
                        )} 
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Strength: <span className={cn("font-medium", passwordStrength.color.replace('bg-', 'text-'))}>{passwordStrength.label || '—'}</span>
                    </span>
                    {passwordStrength.score >= 4 && <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
                    {getPasswordRequirements().map((req, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        {req.met ? (
                          <CheckCircle className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-500" />
                        )}
                        <span className={cn("text-[11px]", req.met ? "text-gray-300" : "text-gray-500")}>{req.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <AnimatePresence>
                {errors.password && touched.password && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-1">
                Confirm password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Input 
                  name="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm your password" 
                  required 
                  disabled={isLoading}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (touched.confirmPassword) handleBlur('confirmPassword', e.target.value);
                  }}
                  onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
                  className={cn(
                    "bg-[#0F1425]/80 border-white/15 focus:border-indigo-500/50 h-11 rounded-xl backdrop-blur-sm pr-10",
                    errors.confirmPassword && touched.confirmPassword && "border-red-500/50"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white transition"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.confirmPassword && touched.confirmPassword && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.confirmPassword}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setAcceptedTerms(!acceptedTerms)}
                className={cn(
                  "mt-0.5 w-4 h-4 rounded border transition-all flex items-center justify-center",
                  acceptedTerms ? "bg-indigo-500 border-indigo-500" : "border-white/30 bg-transparent hover:border-indigo-400"
                )}
              >
                {acceptedTerms && <CheckCircle className="h-3 w-3 text-white" />}
              </button>
              <label className="text-xs text-gray-400 leading-relaxed cursor-pointer" onClick={() => setAcceptedTerms(!acceptedTerms)}>
                I agree to the <Link href="/terms" className="text-indigo-400 hover:text-indigo-300">Terms of Service</Link> and 
                {' '}<Link href="/privacy" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-xs text-red-400 flex items-center gap-1 -mt-1">
                <AlertCircle className="h-3 w-3" /> {errors.terms}
              </p>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              variant="primary" 
              className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center gap-2"
              isLoading={isLoading}
            >
              {!isLoading && <span>Start creating free</span>}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-all inline-flex items-center gap-1 group">
              Sign in
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </p>

          {/* Trust Badge */}
          <div className="flex justify-center gap-4 pt-2">
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="text-[11px] text-gray-500">4.9/5 from 10k+ reviews</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Status */}
      <div className="fixed bottom-6 left-6 hidden lg:flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[11px] text-gray-300 z-50">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
        Free trial • No credit card
      </div>
    </div>
  );
}