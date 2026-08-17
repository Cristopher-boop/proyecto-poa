/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        poa: {
          50: "#EFF4FC",
          100: "#DCE7F7",
          200: "#B9CFEF",
          300: "#8FAFDF",
          400: "#5D82C2",
          500: "#19499C",
          600: "#163F87",
          700: "#123572",
          800: "#0E2A5C",
          900: "#0A2046",
        },
        accent: "#FFCD05",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(25, 73, 156, 0.08), 0 8px 24px -12px rgba(25, 73, 156, 0.18)",
      },
    },
  },
  plugins: [],
};
