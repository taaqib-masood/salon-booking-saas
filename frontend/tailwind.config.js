// frontend/tailwind.config.js
import { rose, pink, gold, slate } from 'tailwindcss/colors';
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  purge: ['./src/**/*.{jsx,js}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: rose[500],
        secondary: gold[500],
        neutral: slate[700]
      },
      fontFamily: {
        sans: ['Noto Sans Arabic', ...defaultTheme.fontFamily.sans]
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require('tailwindcss-rtl')],
}