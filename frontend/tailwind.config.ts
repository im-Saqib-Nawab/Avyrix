import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        section: 'var(--bg-section)',
        card: 'var(--bg-card)',
        float: 'var(--bg-float)',
        input: 'var(--bg-input)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        disabled: 'var(--text-disabled)',
        'accent-indigo': 'var(--accent-indigo)',
        'accent-violet': 'var(--accent-violet)',
        'accent-pink': 'var(--accent-pink)',
        'accent-cyan': 'var(--accent-cyan)',
        success: 'var(--success)',
        error: 'var(--error)',
        warning: 'var(--warning)',
      },
      borderColor: {
        default: 'var(--border-default)',
        hover: 'var(--border-hover)',
        focus: 'var(--border-focus)',
        glow: 'var(--border-glow)',
      },
      backgroundImage: {
        'gradient-brand': 'var(--gradient-brand)',
        'gradient-subtle': 'var(--gradient-subtle)',
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-hero-text': 'var(--gradient-hero-text)',
        'gradient-page': 'var(--gradient-page-bg)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        card: '1rem',
        button: '0.75rem',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
        'orb-pulse': 'orb-pulse 3s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'fade-up': 'fade-up 0.4s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(79, 70, 229, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(124, 58, 237, 0.45)' },
        },
        'orb-pulse': {
          '0%, 100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.08)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'glow-indigo': '0 0 30px rgba(79, 70, 229, 0.3)',
        'glow-violet': '0 0 30px rgba(124, 58, 237, 0.35)',
        'glow-pink': '0 0 30px rgba(236, 72, 153, 0.3)',
        'glow-cyan': '0 0 30px rgba(6, 182, 212, 0.25)',
        'glow-success': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-warning': '0 0 20px rgba(245, 158, 11, 0.3)',
        card: '0 10px 40px rgba(0, 0, 0, 0.35)',
        'card-hover': '0 20px 60px rgba(79, 70, 229, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
