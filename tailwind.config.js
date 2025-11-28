/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
    "./public/static/js/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        'igp-blue': '#1e40af',
        'igp-orange': '#ea580c',
        'igp-red': '#dc2626',
        'igp-blue-light': '#3b82f6',
        'igp-blue-dark': '#1e3a8a',
        'igp-green': '#10b981',
        'igp-yellow': '#f59e0b',
      },
    },
  },
  plugins: [],
}
