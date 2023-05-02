/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
    'node_modules/flowbite-vue/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      fontFamily: {
        'roboto': ['"Roboto Mono"']
      },
      backgroundImage: (theme) => ({
        'background-image': "url('/src/assets/background.jpg')",
      }),
    },
  },
  plugins: [
    require("daisyui"),
    require('flowbite/plugin'),
    require('@tailwindcss/typography')
  ],
}
