/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          black: "#020205",
          dark: "#101018",
          darkcard: "#181824",
          cyan: "#00E5FF",
          magenta: "#FF007F",
          gold: "#FFD700",
          purple: "#9D00FF",
        },
        light: {
          bg: "#FAFAFA",
          card: "#F0F0F5",
          cobalt: "#1E40AF",
          violet: "#7C3AED",
          text: "#121214",
          subtext: "#4B5563"
        }
      },
      fontFamily: {
        sans: ['System', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
