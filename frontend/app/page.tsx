'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  ImageIcon,
  Star,
  Video,
  Zap,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  ArrowUpRight,
  Clock,
  Shield,
  Mail,
  Send,
  CheckCircle,
  Users,
  Info,
  Loader2,
  AlertCircle
} from 'lucide-react';

// ============================================================================
// CUSTOM ICONS (since some lucide-react icons might not exist)
// ============================================================================

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.771-.773 1.771-1.729V1.729C24 .774 23.206 0 22.225 0z" />
    </svg>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025.8-.223 1.65-.334 2.5-.334.85 0 1.7.111 2.5.334 1.91-1.294 2.75-1.025 2.75-1.025.545 1.376.201 2.393.099 2.646.64.698 1.03 1.591 1.03 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

// ============================================================================
// DATA
// ============================================================================

const GALLERY_IMAGES = [
  {
    id: 'gal_01',
    prompt: 'Ethereal forest with bioluminescent mushrooms glowing in the mist',
    thumbnail_url: 'https://images.unsplash.com/photo-1763321402439-41eb2a0c7e7b?q=80&w=696&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Nature',
    likes: 1243,
  },
  {
    id: 'gal_02',
    prompt: 'Abstract liquid metal sculpture with rainbow iridescence',
    thumbnail_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80',
    category: 'Abstract',
    likes: 892,
  },
  {
    id: 'gal_03',
    prompt: 'Cyberpunk city street at night with neon reflections',
    thumbnail_url: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600&q=80',
    category: 'Urban',
    likes: 2156,
  },
  {
    id: 'gal_04',
    prompt: 'Serene mountain lake at golden hour with mist',
    thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    category: 'Landscape',
    likes: 1678,
  },
  {
    id: 'gal_05',
    prompt: 'Futuristic AI neural network visualization',
    thumbnail_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80',
    category: 'Tech',
    likes: 3045,
  },
  {
    id: 'gal_06',
    prompt: 'Dreamlike surreal landscape with floating islands',
    thumbnail_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
    category: 'Fantasy',
    likes: 1432,
  },
];

const FEATURES = [
  {
    title: 'AI Image Generation',
    description: 'Create stunning, photorealistic images from text prompts with advanced AI models. Support for 4K resolution, style transfer, and inpainting.',
    icon: ImageIcon,
    color: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-400',
    benefits: ['4K Resolution', 'Style Transfer', 'Inpainting', 'Batch Generation'],
    detailedFeatures: [
      'Text-to-image generation with 50+ art styles',
      'Image-to-image transformation',
      'Background removal and replacement',
      'Upscaling up to 8K resolution'
    ],
    link: '/features/image-generation'
  },
  {
    title: 'AI Video Generation',
    description: 'Turn text descriptions into cinematic videos with smooth motion, consistent characters, and stunning visual effects.',
    icon: Video,
    color: 'from-violet-500/20 to-purple-500/20',
    iconColor: 'text-violet-400',
    benefits: ['Smooth Motion', 'Multiple Ratios', 'HD Quality', 'Text-to-Video'],
    detailedFeatures: [
      'Text-to-video generation up to 60 seconds',
      'Frame interpolation for smooth motion',
      'Multiple aspect ratios (16:9, 9:16, 1:1)',
      'Style and mood presets'
    ],
    link: '/features/video-generation'
  },
  {
    title: 'Smart Credit System',
    description: 'Flexible pay-as-you-go credits with real-time balance tracking, usage analytics, and transparent pricing.',
    icon: CreditCard,
    color: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-400',
    benefits: ['No Subscription', 'Usage History', 'Real-time Balance', 'Bulk Discounts'],
    detailedFeatures: [
      '1 credit = 1 standard generation',
      'Volume discounts for creators',
      'Monthly rollover options',
      'Team sharing capabilities'
    ],
    link: '/pricing'
  },
] as const;

const PRICING_PLANS = [
  {
    name: 'Starter',
    price: 9,
    period: 'month',
    credits: 100,
    features: [
      '100 AI credits per month',
      'Standard image generation',
      'Basic video generation (15s max)',
      'Email support',
      'Community access'
    ],
    recommended: false,
    buttonText: 'Get Started',
    buttonVariant: 'outline' as const,
    link: '/signup?plan=starter'
  },
  {
    name: 'Pro',
    price: 29,
    period: 'month',
    credits: 500,
    features: [
      '500 AI credits per month',
      'Priority processing',
      'HD video generation (60s max)',
      '4K image upscaling',
      'Priority support',
      'API access'
    ],
    recommended: true,
    buttonText: 'Start Free Trial',
    buttonVariant: 'default' as const,
    link: '/signup?plan=pro'
  },
  {
    name: 'Enterprise',
    price: 99,
    period: 'month',
    credits: 2500,
    features: [
      '2500 AI credits per month',
      'Custom AI model training',
      'Unlimited video length',
      'Dedicated account manager',
      'SLA guarantee',
      'On-premise deployment'
    ],
    recommended: false,
    buttonText: 'Contact Sales',
    buttonVariant: 'outline' as const,
    link: '/signup?plan=enterprise'
  },
];

const NAV_LINKS = [
  { name: 'Features', href: '/#features', hash: 'features' },
  { name: 'Pricing', href: '/#pricing', hash: 'pricing' },
  { name: 'Showcase', href: '/#showcase', hash: 'showcase' },
];

const FOOTER_LINKS = {
  Product: [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Updates', href: '/updates' },
    { name: 'Roadmap', href: '/roadmap' },
  ],
  Resources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'Guides', href: '/guides' },
    { name: 'Help Center', href: '/help' },
    { name: 'Community', href: '/community' },
  ],
  Company: [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact', href: '/contact' },
    { name: 'Privacy Policy', href: '/privacy' },
  ],
};

const STATS = [
  { value: '50K+', label: 'Active Creators', icon: Users, description: 'Trusted by creators worldwide' },
  { value: '2M+', label: 'Images Generated', icon: ImageIcon, description: 'And counting every day' },
  { value: '99.9%', label: 'Uptime', icon: Shield, description: 'Reliable service guaranteed' },
  { value: '24/7', label: 'Support', icon: Clock, description: 'Always here to help' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah Johnson',
    role: 'Digital Artist',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    content: 'AVYRIX has completely transformed my creative workflow. The AI generates stunning results that would take hours to create manually.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Video Editor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    content: 'The video generation capabilities are mind-blowing. I can create professional-looking animations in minutes instead of days.',
    rating: 5,
  },
  {
    name: 'Emma Davis',
    role: 'Marketing Director',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
    content: "Best investment for our creative team. The credit system is flexible and the quality is consistently impressive.",
    rating: 5,
  },
];

const FAQS = [
  {
    question: 'How do AI credits work?',
    answer: 'AI credits are our universal currency for generations. Each image generation costs 1 credit, while video generation costs 5 credits per second. Credits roll over monthly and never expire.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel or change your plan at any time. There are no long-term contracts or hidden fees.',
  },
  {
    question: 'What formats do you support?',
    answer: 'We support PNG, JPEG, WebP for images and MP4, WebM for videos. Images can be generated up to 8K resolution.',
  },
  {
    question: 'Is there an API available?',
    answer: 'Yes! Pro and Enterprise plans include API access with comprehensive documentation and SDKs for Python, JavaScript, and more.',
  },
];

// Helper component for social icons
function SocialIcon({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-violet-600/20 transition-all duration-200"
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </Link>
  );
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] as const }
});

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

// ============================================================================
// CUSTOM TOAST COMPONENT
// ============================================================================

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="h-4 w-4 text-emerald-400" />,
    error: <AlertCircle className="h-4 w-4 text-red-400" />,
    info: <Info className="h-4 w-4 text-blue-400" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-[#1A1A2A] border border-white/10 shadow-xl p-4 min-w-[280px]"
    >
      {icons[toast.type]}
      <span className="text-sm text-white flex-1">{toast.message}</span>
      <button onClick={onClose} className="text-gray-500 hover:text-white">
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [hoveredFeature, setHoveredFeature] = React.useState<number | null>(null);
  const [activeGalleryFilter, setActiveGalleryFilter] = React.useState('All');
  const [isGeneratingDemo, setIsGeneratingDemo] = React.useState(false);
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [emailInput, setEmailInput] = React.useState('');
  const toastCounterRef = React.useRef(0);
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.5]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  // Scroll to section handler
  const scrollToSection = (hash: string) => {
    if (hash && typeof window !== 'undefined') {
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
      }
    }
  };

  // Navigation handler
  const handleNavigation = (href: string, hash?: string) => {
    if (href.startsWith('/#')) {
      // Internal section link
      if (hash) {
        scrollToSection(hash);
      }
    } else if (href.startsWith('/')) {
      // Internal page link - use router
      router.push(href);
    } else {
      // External link
      window.open(href, '_blank');
    }
    setMobileMenuOpen(false);
  };

  // Feature button handler
  const handleFeatureClick = (feature: typeof FEATURES[number]) => {
    addToast(`✨ ${feature.title}`, 'success');
  };

  // Pricing button handler
  const handlePricingClick = (plan: typeof PRICING_PLANS[number]) => {
    addToast(`🎉 ${plan.name} plan selected! Redirecting to checkout...`, 'success');
    setTimeout(() => {
      router.push(plan.link);
    }, 500);
  };

  // Newsletter signup
  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes('@')) {
      addToast('Please enter a valid email address', 'error');
      return;
    }
    addToast(`📧 Thanks for subscribing! We'll send updates to ${emailInput}`, 'success');
    setEmailInput('');
  };

  // Add toast notification
  const addToast = (message: string, type: ToastType = 'info') => {
    toastCounterRef.current += 1;
    const id = `toast-${toastCounterRef.current}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  // Remove toast
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Demo generation effect
  const handleDemoGenerate = () => {
    setIsGeneratingDemo(true);
    addToast('🎨 Starting AI generation...', 'info');
    setTimeout(() => {
      setIsGeneratingDemo(false);
      addToast('✨ Generation complete! Check the showcase for examples.', 'success');
    }, 2000);
  };

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Filter gallery images
  const filteredGallery = React.useMemo(() => {
    if (activeGalleryFilter === 'All') return GALLERY_IMAGES;
    return GALLERY_IMAGES.filter(img => img.category === activeGalleryFilter);
  }, [activeGalleryFilter]);

  const galleryCategories = ['All', ...new Set(GALLERY_IMAGES.map(img => img.category))];

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#0A0A0F] via-[#0F0F1A] to-[#0A0A0F] text-white selection:bg-violet-500/30">
      
      {/* Toast Notifications */}
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastNotification key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>

      {/* Animated Background Grid */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Navbar */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          scrolled
            ? 'bg-[#0A0A0F]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/30'
            : 'bg-transparent backdrop-blur-none'
        )}
      >
        <div className="mx-auto flex h-16 md:h-20 items-center justify-between px-4 md:px-8 lg:px-12 max-w-7xl">
          {/* Logo */}
          <button 
            onClick={() => scrollToSection('hero')}
            className="group relative flex items-center gap-2 text-2xl font-bold focus:outline-none"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-emerald-600 rounded-lg blur opacity-0 group-hover:opacity-50 transition duration-500" />
            <span className="relative bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">
              AVYRIX
            </span>
            <span className="relative text-sm font-medium text-violet-400 hidden sm:inline">AI</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavigation(link.href, link.hash)}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5"
              >
                {link.name}
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/10"
            >
              Log in
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-500 hover:to-emerald-500 text-white rounded-lg shadow-lg shadow-violet-600/25 transition-all duration-200"
            >
              Get Started
              <ChevronRight className="ml-1 h-4 w-4 inline" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 text-white"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-[#0A0A0F]/95 backdrop-blur-xl border-b border-white/10"
            >
              <div className="flex flex-col p-4 space-y-2">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleNavigation(link.href, link.hash)}
                    className="px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {link.name}
                  </button>
                ))}
                <div className="h-px bg-white/10 my-2" />
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => router.push('/signup')}
                  className="px-4 py-3 text-center bg-gradient-to-r from-violet-600 to-emerald-600 text-white rounded-lg"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section id="hero" className="relative px-4 pt-32 pb-20 md:pt-40 md:pb-28 lg:pt-48 lg:pb-32 overflow-hidden">
          <motion.div 
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="relative mx-auto max-w-5xl flex flex-col items-center text-center"
          >
            {/* Badge */}
            <motion.div {...fadeUp(0)} className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-xs font-medium text-gray-300">
                  AI-powered creative studio
                </span>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h1 
              {...fadeUp(0.1)} 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
            >
              <span className="bg-gradient-to-r from-white via-violet-300 to-emerald-300 bg-clip-text text-transparent">
                Create stunning
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                images & videos with AI
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p 
              {...fadeUp(0.2)} 
              className="mt-6 max-w-2xl text-base sm:text-lg text-gray-400 leading-relaxed"
            >
              Generate high-fidelity visuals in seconds. One workspace for images, video, and
              credit-based billing built for modern creators.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              {...fadeUp(0.3)} 
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <button
              onClick={() => router.push('/signup')}
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-500 hover:to-emerald-500 text-white rounded-lg shadow-lg shadow-violet-600/25 transition-all duration-200"
            >
              Get Started
              <ChevronRight className="ml-1 h-4 w-4 inline" />
            </button>
              <button
                onClick={() => scrollToSection('showcase')}
                className="h-12 px-8 border border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                View Showcase
              </button>
            </motion.div>

            {/* Rating */}
            <motion.div {...fadeUp(0.4)} className="mt-10 flex items-center gap-3">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-gray-400">
                Rated <span className="text-white font-semibold">4.9/5</span> by 10,000+ creators
              </span>
            </motion.div>

            {/* Stats Row */}
            <motion.div 
              {...fadeUp(0.5)} 
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-3xl border-t border-white/10 pt-8"
            >
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center group cursor-pointer" onClick={() => addToast(`📊 ${stat.label}: ${stat.value} - ${stat.description}`, 'info')}>
                  <div className="flex justify-center mb-2">
                    <stat.icon className="h-5 w-5 text-violet-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative px-4 py-20 md:py-28">
          <div className="mx-auto max-w-7xl">
            {/* Section Header */}
            <div className="text-center mb-12 md:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 mb-4"
              >
                <Zap className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-xs font-medium text-violet-400">Features</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold"
              >
                Everything you need to{' '}
                <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
                  create at scale
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="mt-4 text-gray-400 max-w-2xl mx-auto"
              >
                Powerful AI tools that adapt to your workflow, from concept to final render.
              </motion.p>
            </div>

            {/* Features Grid */}
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {FEATURES.map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  variants={fadeUp(idx * 0.1)}
                  onHoverStart={() => setHoveredFeature(idx)}
                  onHoverEnd={() => setHoveredFeature(null)}
                  className="group relative"
                >
                  <div className={cn(
                    "absolute -inset-0.5 bg-gradient-to-r rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur",
                    feature.color
                  )} />
                  <Card className="relative bg-[#11111A]/80 backdrop-blur-sm border-white/10 p-6 md:p-8 rounded-2xl hover:border-white/20 transition-all duration-300 h-full cursor-pointer"
                    onClick={() => handleFeatureClick(feature)}
                  >
                    <div className={cn(
                      "mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br transition-all duration-300 group-hover:scale-110",
                      feature.color
                    )}>
                      <feature.icon className={cn("h-6 w-6", feature.iconColor)} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">{feature.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {feature.benefits.map((benefit) => (
                        <span key={benefit} className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-300">
                          {benefit}
                        </span>
                      ))}
                    </div>
                    <button className="text-violet-400 text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Learn more
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="relative px-4 py-20 md:py-28 bg-white/5">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 mb-4"
              >
                <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Pricing</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold"
              >
                Simple,{' '}
                <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
                  transparent pricing
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="mt-4 text-gray-400"
              >
                Choose the plan that fits your creative needs
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
            >
              {PRICING_PLANS.map((plan) => (
                <Card
                  key={plan.name}
                  className={cn(
                    "relative bg-[#11111A]/80 backdrop-blur-sm border-white/10 p-6 rounded-2xl transition-all duration-300 hover:scale-105",
                    plan.recommended && "border-violet-500/50 shadow-lg shadow-violet-500/10"
                  )}
                >
                  {plan.recommended && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-emerald-600 text-white border-none">
                      Most Popular
                    </Badge>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-white">${plan.price}</span>
                      <span className="text-gray-400">/{plan.period}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">{plan.credits} credits per month</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handlePricingClick(plan)}
                    className={cn(
                      "w-full py-2 rounded-lg font-medium transition-all duration-200",
                      plan.buttonVariant === 'default'
                        ? "bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-500 hover:to-emerald-500 text-white"
                        : "border border-white/20 bg-white/5 text-white hover:bg-white/10"
                    )}
                  >
                    {plan.buttonText}
                  </button>
                </Card>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Gallery Section */}
        <section id="showcase" className="relative px-4 py-20 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 mb-4"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Showcase</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold"
              >
                Made with{' '}
                <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
                  AVYRIX AI
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="mt-4 text-gray-400"
              >
                Real outputs from community prompts
              </motion.p>
            </div>

            {/* Gallery Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-wrap justify-center gap-2 mb-8"
            >
              {galleryCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveGalleryFilter(category)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    activeGalleryFilter === category
                      ? "bg-gradient-to-r from-violet-600 to-emerald-600 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  )}
                >
                  {category}
                </button>
              ))}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
              {filteredGallery.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-[#1A1A2A] cursor-pointer"
                  onClick={() => addToast(`🖼️ Image: ${item.prompt.substring(0, 50)}... - ${item.likes} likes`, 'info')}
                >
                  <Image
                    src={item.thumbnail_url}
                    alt={item.prompt}
                    fill
                    priority={idx < 3}
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-xs text-white/90 line-clamp-2">{item.prompt}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-300">{item.category}</span>
                        <span className="text-xs text-yellow-400">❤️ {item.likes}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="relative px-4 py-20 md:py-28 bg-white/5">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 mb-4"
              >
                <Users className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-xs font-medium text-violet-400">Testimonials</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold"
              >
                Loved by{' '}
                <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
                  creators worldwide
                </span>
              </motion.h2>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {TESTIMONIALS.map((testimonial, idx) => (
                <Card
                  key={testimonial.name}
                  className="bg-[#11111A]/80 backdrop-blur-sm border-white/10 p-6 rounded-2xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 40px, 64px"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{testimonial.name}</h4>
                      <p className="text-xs text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{testimonial.content}</p>
                </Card>
              ))}
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="relative px-4 py-20 md:py-28">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 mb-4"
              >
                <Info className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-medium text-blue-400">FAQ</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold"
              >
                Frequently asked{' '}
                <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
                  questions
                </span>
              </motion.h2>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              {FAQS.map((faq, idx) => (
                <Card
                  key={idx}
                  className="bg-[#11111A]/80 backdrop-blur-sm border-white/10 p-6 rounded-2xl cursor-pointer hover:border-white/20 transition-all"
                  onClick={() => addToast(`📖 FAQ: ${faq.question.substring(0, 40)}...`, 'info')}
                >
                  <h3 className="font-semibold text-white mb-2">{faq.question}</h3>
                  <p className="text-sm text-gray-400">{faq.answer}</p>
                </Card>
              ))}
            </motion.div>
          </div>
        </section>


      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/10 bg-[#0A0A0F]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Brand Column */}
            <div className="md:col-span-4">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-2xl font-bold bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent"
              >
                AVYRIX AI
              </button>
              <p className="mt-4 text-sm text-gray-400 max-w-xs">
                Empowering creators with next-gen AI tools to imagine, create and inspire the world.
              </p>
              <div className="flex gap-4 mt-6">
                <SocialIcon href="https://twitter.com" icon={TwitterIcon} label="Twitter" />
                <SocialIcon href="https://github.com" icon={GithubIcon} label="GitHub" />
                <SocialIcon href="https://linkedin.com" icon={LinkedinIcon} label="LinkedIn" />
                <SocialIcon href="https://instagram.com" icon={InstagramIcon} label="Instagram" />
                <SocialIcon href="mailto:hello@avyrix.ai" icon={Mail} label="Email" />
              </div>
            </div>

            {/* Links Columns */}
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category} className="md:col-span-2">
                <h3 className="font-semibold text-white mb-4">{category}</h3>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.name}>
                      <button
                        onClick={() => handleNavigation(link.href, '')}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter */}
            <div className="md:col-span-2">
              <h3 className="font-semibold text-white mb-4">Stay in the loop</h3>
              <p className="text-sm text-gray-400 mb-4">
                Get the latest updates and tips delivered to your inbox.
              </p>
              <form onSubmit={handleNewsletterSignup} className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  required
                />
                <button type="submit" className="p-2 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} AVYRIX AI. All rights reserved.
            </p>
            <div className="flex gap-6">
              <button onClick={() => router.push('/terms')} className="text-xs text-gray-500 hover:text-gray-400">
                Terms of Service
              </button>
              <button onClick={() => router.push('/privacy')} className="text-xs text-gray-500 hover:text-gray-400">
                Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper utility for className merging
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}