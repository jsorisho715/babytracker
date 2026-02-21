/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfcf8',
          100: '#faf7f0',
          200: '#f5ede0',
          300: '#ede0cc',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e6ede6',
          200: '#c8d9c8',
          300: '#a3bfa3',
          400: '#7a9f7a',
          500: '#5a7f5a',
          600: '#456445',
        },
        rose: {
          baby: '#f4a7b9',
          light: '#fce4ec',
          medium: '#e991aa',
        },
        warm: {
          gray: '#8a8078',
          light: '#f0ece8',
          card: '#ffffff',
        },
      },
      fontFamily: {
        display: ['Nunito', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 2px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.1)',
        soft: '0 1px 8px rgba(0,0,0,0.04)',
      },
      animation: {
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.25s ease-out',
        'score-pop': 'scorePop 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'check-pop': 'checkPop 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scorePop: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '50%': { transform: 'translateY(-20px) scale(1.3)', opacity: '1' },
          '100%': { transform: 'translateY(-40px) scale(1)', opacity: '0' },
        },
        checkPop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
