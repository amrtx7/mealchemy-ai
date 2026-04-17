/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'kitchen-bg': '#FDFBF6',
        'kitchen-card': '#F5EHE3', // wait, F5EFE3
        'kitchen-primary': '#164E40',
        'kitchen-secondary': '#E79B48',
        'kitchen-accent': '#236E59',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
