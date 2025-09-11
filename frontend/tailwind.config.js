/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'Roboto', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        'primary': {
          50: '#f8fafc',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        'dark': {
          50: '#f8fafc',
          800: '#191820',
          900: '#141525',
        }
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #141525 0%, #191820 100%)',
      }
    },
  },
  plugins: [],
}