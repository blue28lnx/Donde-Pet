/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: '#10b981',
          'emerald-dark': '#059669',
          'emerald-light': '#d1fae5',
          orange: '#fb923c',
          'orange-dark': '#f97316',
          'orange-soft': '#ffedd5',
          ink: '#1f2937',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
