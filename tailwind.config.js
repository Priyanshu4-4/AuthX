/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        'primary-dark': '#2563EB',
        boxdark: '#1E2A3B',
        'boxdark-2': '#131E2E',
        stroke: '#2D3A4A',
        strokedark: '#2D3A4A',
        'meta-1': '#DC3545',
        'meta-3': '#10B981',
        'meta-4': '#2D3A4A',
      },
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        default: '0 4px 24px rgba(0,0,0,0.3)',
        card: '0 2px 16px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
}
