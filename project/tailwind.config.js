/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Creamy white design system
        cream: {
          50: '#fefcf9',
          100: '#fdf8f0', 
          200: '#f9f1e6',
          300: '#f5eadc',
          white: '#faf9f7'
        },
        // Sage green for primary actions
        sage: {
          50: '#f2f7f5',
          100: '#e6efeb',
          200: '#c7ddd2',
          300: '#a8cbb9',
          400: '#6fa088',
          500: '#527a5c',
          600: '#4a6e52',
          700: '#3e5b45',
          800: '#324838',
          900: '#29392e'
        },
        // Slate for text
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [],
};