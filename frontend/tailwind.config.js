/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: '#fa8072',
        lightcoral: '#f08080',
        lightpink: '#ffb6c1',
        indianred: '#cd5c5c',
      },
      fontFamily: {
        fredoka: ['"Fredoka One"', 'cursive'],
        neuton: ['"Neuton"', 'serif'],
        patrick: ['"Patrick Hand SC"', 'cursive'],
        alegreya: ['"Alegreya Sans SC"', 'sans-serif'],
        ntr: ['"NTR"', 'sans-serif'],
        raleway: ['"Raleway"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

