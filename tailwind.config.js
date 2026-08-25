/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        buzz: {
          orange: '#E68228',
          lightOrange: '#E69650',
          sandyOrange: '#FABE8C',
          darkBlue: '#125876',
          grey: '#969696',
          darkGrey: '#5F5F5F',
          deepGrey: '#333333',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Montserrat', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
