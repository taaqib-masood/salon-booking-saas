/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: 'var(--color-primary, #D4AF37)',
        'gold-light': '#F3E5AB',
        cream: '#FAF9F6',
        charcoal: '#1A1A1A',
        rose: '#B76E79',
        neutral: '#6B6B6B',
        primary: 'var(--color-primary, #D4AF37)',
        card: '#FFFFFF',
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Cormorant Garamond"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 10px 40px rgba(0, 0, 0, 0.07)',
        'glow': '0 0 24px rgba(212, 175, 55, 0.35)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in': 'fadeIn 1s ease-out forwards',
        'shimmer': 'shimmer 1.6s infinite linear',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        luxury: {
          "primary": "#D4AF37",
          "secondary": "#B76E79",
          "accent": "#F3E5AB",
          "neutral": "#1A1A1A",
          "base-100": "#FAF9F6",
        },
      },
    ],
  },
}
