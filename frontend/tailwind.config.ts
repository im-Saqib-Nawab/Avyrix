import type { Config } from 'tailwindcss';

/**
 * Tailwind v4 uses CSS-first configuration via @theme in globals.css.
 * This file only declares content paths for class detection.
 */
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
};

export default config;
