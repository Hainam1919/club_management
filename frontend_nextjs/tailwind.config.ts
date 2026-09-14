import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
          light: '#818cf8',
          50: '#eef2ff',
          100: '#e0e7ff',
        },
        secondary: {
          DEFAULT: '#ec4899',
          dark: '#db2777',
        },
        accent: '#14b8a6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        surface: {
          DEFAULT: '#ffffff',
          light: '#ffffff',
          dark: '#131a3f',
          hover: '#f8fafc',
        },
        bg: {
          light: '#fafbff',
          dark: '#0a0e27',
          soft: '#f3f4f9',
          mute: '#e8eaf2',
        },
        text: {
          DEFAULT: '#0f172a',
          soft: '#475569',
          mute: '#94a3b8',
        },
        border: {
          DEFAULT: '#e2e8f0',
          soft: '#eef2f7',
        },
      },
      backgroundImage: {
        'gradient-ai': 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgb(99, 102, 241) 0px, transparent 50%), radial-gradient(at 80% 0%, rgb(236, 72, 153) 0px, transparent 50%), radial-gradient(at 0% 50%, rgb(20, 184, 166) 0px, transparent 50%), radial-gradient(at 80% 80%, rgb(245, 158, 11) 0px, transparent 50%)',
      },
      borderRadius: {
        'xs': '6px',
        'sm': '10px',
        'DEFAULT': '14px',
        'lg': '22px',
        'xl': '28px',
        '2xl': '36px',
      },
      boxShadow: {
        'glow': '0 0 30px rgba(99, 102, 241, 0.4)',
        'glow-pink': '0 0 40px rgba(236, 72, 153, 0.35)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
