/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        /* Đồng bộ với home: ink + gold; brand-* dùng cho CTA / accent nhất quán */
        brand: {
          50: "#faf8f2",
          100: "#f0e9db",
          200: "#e2d4bc",
          300: "#c9a24a",
          400: "#b8860b",
          500: "#1f3158",
          600: "#1b2a4a",
          700: "#172440",
          800: "#14203a",
          900: "#101a31",
        },
        ink: "#1b2a4a",
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
