import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /**
         * American Blue - the Buyology secondary colour, and the workhorse of the
         * interface: buttons, active navigation, links and focus rings. The 600
         * step is the exact brand value (#402F75); 200-500 are the four official
         * tints from the guidelines, and 700-950 are darker steps for hovers, the
         * sidebar and other deep surfaces.
         */
        brand: {
          50: '#f5f4f9',
          100: '#e7e4ef',
          200: '#d9d5e3',
          300: '#b3acc8',
          400: '#8c82ac',
          500: '#665991',
          600: '#402f75',
          700: '#372866',
          800: '#2d2153',
          900: '#231941',
          950: '#17102c',
        },
        /**
         * Mikado Yellow - the Buyology primary colour. The guidelines ask for it
         * "sparingly, for impact", so it is reserved for the logo's B-wave and for
         * accents: the active-board indicator, highlights and badges. The 500 step
         * is the exact brand value (#FFBE12) and 100-400 are its official tints.
         */
        accent: {
          50: '#fff9eb',
          100: '#fff2d0',
          200: '#ffe5a0',
          300: '#ffd871',
          400: '#ffcb41',
          500: '#ffbe12',
          600: '#e0a400',
          700: '#b88600',
          800: '#8f6800',
          900: '#6b4e00',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(23,16,44,.04), 0 8px 24px -12px rgba(23,16,44,.14)',
        pop: '0 12px 40px -12px rgba(23,16,44,.28)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .18s ease-out',
        'slide-up': 'slide-up .22s cubic-bezier(.22,1,.36,1)',
        'slide-in': 'slide-in .26s cubic-bezier(.22,1,.36,1)',
      },
    },
  },
  plugins: [],
};

export default config;
