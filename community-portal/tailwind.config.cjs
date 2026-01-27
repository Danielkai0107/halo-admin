/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfc',
          100: '#ccfbf6',
          200: '#99f6ec',
          300: '#5eeade',
          400: '#2dd4c7',
          500: '#1FC0B4',  // 主色
          600: '#19a89d',  // 深色（hover）
          700: '#148a81',
          800: '#126e66',
          900: '#115b54',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
