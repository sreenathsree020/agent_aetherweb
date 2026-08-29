/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#09090b',
        'zinc-card': '#121215',
        'zinc-border': 'rgba(255, 255, 255, 0.08)',
        'zinc-hover': 'rgba(255, 255, 255, 0.04)',
        accent: {
          primary: '#ffffff',
          secondary: '#10b981',
          muted: '#71717a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'minimal': '0 4px 20px 0 rgba(0, 0, 0, 0.7)',
        'card': '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'glow-subtle': '0 0 15px rgba(255, 255, 255, 0.08)',
      },
    },
  },
  plugins: [],
}
