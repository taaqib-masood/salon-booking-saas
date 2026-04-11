/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: '#0B0B0F',
        gold: '#D4AF37',
        'gold-light': '#F4E2A1',
        'gold-dark': '#C9A24C',
        pearl: '#F8F8F8',
        emerald: '#0F3D3E',
        beige: '#E8D8C3',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        cairo: ['Cairo', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C9A24C, #F4E2A1)',
        'dark-gradient': 'linear-gradient(180deg, #0B0B0F 0%, #111116 100%)',
      },
      boxShadow: {
        gold: '0 4px 24px rgba(212,175,55,0.15)',
        'gold-lg': '0 8px 40px rgba(212,175,55,0.25)',
        glass: '0 8px 32px rgba(0,0,0,0.4)',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
};
