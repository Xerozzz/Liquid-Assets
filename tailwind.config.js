/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf6f6',
          100: '#ffeaec',
          200: '#f9d9db',
          300: '#f5cbcb',
          400: '#e8a8a8',
          500: '#d98888',
          600: '#c67676',
          700: '#a85c5c',
          800: '#7a4242',
          900: '#4d2929',
          950: '#2e1818',
        },
      },
    },
  },
  plugins: [],
}
