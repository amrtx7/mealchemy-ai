/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'kitchen-bg': '#FDFBF6',
        'kitchen-card': '#F5EFE3',
        'kitchen-primary': '#164E40',
        'kitchen-secondary': '#E79B48',
        'kitchen-accent': '#236E59',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        serif: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        script: ['"Caveat"', 'cursive'],
      },
      boxShadow: {
        neo: '4px 4px 0 0 #000000',
        'neo-sm': '3px 3px 0 0 #000000',
        'neo-lg': '6px 6px 0 0 #000000',
      },
      borderWidth: {
        brutal: '3px',
      },
    },
  },
  plugins: [],
};
