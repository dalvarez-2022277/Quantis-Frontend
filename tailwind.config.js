/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  // Clases usadas de forma dinámica en InputField (getInputStyles) para que Tailwind las genere
  safelist: [
    { pattern: /^rounded-full$/ },
    { pattern: /^min-h-\[52px\]$/ },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
