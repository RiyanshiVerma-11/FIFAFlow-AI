/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fifa: {
          gold: "#F4A261",
          emerald: "#2A9D8F",
          navy: "#1D3557",
          crimson: "#E63946",
          dark: "#0F172A",
          glass: "rgba(30, 41, 59, 0.4)",
        }
      },
      fontFamily: {
        dyslexic: ["Comic Sans MS", "sans-serif"],
      },
      boxShadow: {
        'glow-gold': '0 0 15px rgba(244, 162, 97, 0.4)',
        'glow-emerald': '0 0 15px rgba(42, 157, 143, 0.4)',
        'glow-crimson': '0 0 15px rgba(230, 57, 70, 0.4)',
      }
    },
  },
  plugins: [],
}
