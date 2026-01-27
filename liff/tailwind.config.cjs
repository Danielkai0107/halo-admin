/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 使用 _variables.scss 中的顏色
        primary: {
          DEFAULT: '#4ecdc4',
          50: '#e0f7f6',
          100: '#b3ede9',
          200: '#80e2dc',
          300: '#4dd7cf',
          400: '#26cfc5',
          500: '#4ecdc4',
          600: '#3db8b0',
          700: '#2c9a93',
          800: '#1b7c76',
          900: '#0a5e59',
        },
        secondary: {
          DEFAULT: '#ffc107',
          500: '#ffc107',
          600: '#ffb300',
        },
        // 守望點類型顏色
        'school-zone': '#ff6a95',
        'safe-zone': '#4ecdc4',
        'observe-zone': '#00ccea',
        'inactive-zone': '#c4c4c4',
      },
      borderRadius: {
        'app': '12px',
        'app-sm': '8px',
        'app-lg': '16px',
      },
      boxShadow: {
        'app-sm': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'app-md': '0 4px 8px rgba(0, 0, 0, 0.15)',
        'app-lg': '0 8px 16px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
