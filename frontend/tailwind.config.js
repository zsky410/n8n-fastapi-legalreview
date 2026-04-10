/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef3ff",
          100: "#dce7ff",
          400: "#4f73ff",
          500: "#2f55e7",
          700: "#16308b",
          800: "#10256f",
          900: "#0b1e5d",
        },
        ink: "#0c0f14",
        muted: "#5c6370",
        line: "#e6e8ec",
        gold: "#b8860b",
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["EB Garamond", "Georgia", "serif"],
        body: ["Lato", "Inter", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 14px 34px rgba(15, 23, 42, 0.08)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};
