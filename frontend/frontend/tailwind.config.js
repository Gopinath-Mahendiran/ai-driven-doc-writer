/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryText: '#f9fafb',
        mutedText: '#9ca3af',
        accentBlue: '#3b82f6',
        accentPurple: '#8b5cf6',
        accentPink: '#ec4899',
        cardBg: '#1f2937',
        borderDim: '#374151',
      },
      backgroundImage: {
    'hyperspace-dark': 'linear-gradient(to bottom, #000000 10%, #0B244A 30%, #2B4877 60%, #5C76A9 85%, #A0BFE0 95%)',
    'hyperspace-radial-dark': 'radial-gradient(circle, #2B4877 30%, #0B244A 60%, #000000 90%)',
      },
    },
  },
  plugins: [],
}