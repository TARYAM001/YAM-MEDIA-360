import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          900: '#7c2d12',
        },
        dark: {
          50:  '#f8fafc',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body:    ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
  // ─── Tailwind Production Optimizations ────────────────────────────
  safelist: [
    // Safelist dynamic classes from loops
    { pattern: /^(grid-cols-)/ },
  ],
  // ─── Tree-shake unused styles ──────────────────────────────────────
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    mode: 'layers',
  },
};

export default config;
