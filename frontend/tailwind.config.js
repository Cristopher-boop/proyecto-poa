/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EFF4FC", 100: "#D7E4F7", 200: "#AECAEF", 300: "#7DABE4", 400: "#4A7FCC",
          500: "#19499C", 600: "#263E69", 700: "#1E2736", 800: "#272B33", 900: "#2B2E33",
        },
        accent: {
          50: "#FFFBE5", 100: "#FFF4B8", 200: "#FFE88A", 300: "#FFDD5C", 400: "#FFD52E",
          500: "#FFCD05", 600: "#CCAC2D", 700: "#998740", 800: "#665E3F", 900: "#33312A",
        },
        triad: {
          rose: { 50: "#FCF0F4", 100: "#F7D7E3", 500: "#9C1949", 600: "#7A1439" }, 
          green: { 50: "#F3FCF0", 100: "#E3F7D7", 500: "#499C19", 600: "#3A7A14" }, 
        },
        theme: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          sidebar: "var(--bg-sidebar)",
          border: "var(--border)",
          main: "var(--text-main)",
          muted: "var(--text-muted)",
          primary: "var(--theme-primary)",
          primaryHover: "var(--theme-primary-hover)",
          primaryText: "var(--theme-primary-text)",
        }
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(0,0,0,0.05), 0 8px 24px -12px rgba(0,0,0,0.08)",
        "panel-dark": "0 1px 2px rgba(0,0,0,0.2), 0 8px 24px -12px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};
