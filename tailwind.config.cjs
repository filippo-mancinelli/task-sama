/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'roboto': ['"Roboto Mono"']
      }
    },
  },
  plugins: [
    require("daisyui"),
    require('@tailwindcss/typography')
  ],
}
