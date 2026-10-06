/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ideator: {
          DEFAULT: '#2457E6',
          50: '#f0f4fe',
          100: '#e4ecfd',
          200: '#cddbfa',
          500: '#2457E6',
          600: '#1d45b8',
          700: '#16358d',
        },
        surface: '#F7F8FA',
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#2457E6',
          600: '#1d45b8',
          700: '#16358d',
        }
      }
    },
  },
  plugins: [],
}
