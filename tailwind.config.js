/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./test-ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ["var(--font-noto)", "ui-sans-serif", "system-ui"],
        lilita:["var(--font-lilita)", "sans-serif"],
        acme:  ["var(--font-acme)", "sans-serif"],
        alfa:  ["var(--font-alfa)", "serif"],

        team: [
          "Hiragino Kaku Gothic Std", "ヒラギノ角ゴ Std",
          "Hiragino Kaku Gothic ProN", "Hiragino Kaku Gothic Pro",
          "Meiryo", "Noto Sans JP", "sans-serif",
        ],
        score: [
          "Impact", "Anton", "Arial Black", "Inter",
          "ui-sans-serif", "system-ui", "sans-serif",
        ],
      },
      colors: {
        app:  "#0a3b47",
        card: "#12444D",
      },
    },
  },
  plugins: [],
};
