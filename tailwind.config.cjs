/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'roboto': ['"Roboto Mono"']
      },
      backgroundImage: (theme) => ({
        'background-image': "url('/src/assets/background.jpg')",
      }),
      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [
    require("daisyui"),
    require('@tailwindcss/typography')
  ],
}
