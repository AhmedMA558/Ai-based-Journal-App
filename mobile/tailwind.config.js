/** @type {import('tailwindcss').Config} */
// Color values ported from frontend/src/index.css's :root block, so Mindora
// (this app) starts from the same "v1" web palette instead of Expo defaults.
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#090d16',
        'bg-secondary': '#0f172a',
        'panel-bg': 'rgba(15, 23, 42, 0.65)',
        'panel-border': 'rgba(255, 255, 255, 0.08)',
        'panel-glow': 'rgba(99, 102, 241, 0.15)',
        'text-primary': '#f8fafc',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
        'accent-indigo': '#6366f1',
        'accent-purple': '#a855f7',
        'accent-pink': '#ec4899',
        'accent-cyan': '#38bdf8',
        'accent-emerald': '#10b981',
        'accent-amber': '#f59e0b',
        'accent-rose': '#f43f5e',
      },
    },
  },
  plugins: [],
};
