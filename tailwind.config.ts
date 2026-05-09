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
        navy: '#071a33',
        gold: '#d4af37',
      },
      boxShadow: {
        executive: '0 12px 32px rgba(7, 26, 51, 0.16)',
      },
    },
  },
  plugins: [],
};

export default config;
