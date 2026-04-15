/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0e0f0c",
        muted: "#868685",
        "muted-strong": "#454745",
        line: "rgba(14, 15, 12, 0.12)",
        surface: "#e8ebe6",
        brand: {
          50: "#e2f6d5",
          100: "#cdffad",
          200: "rgba(22, 51, 0, 0.08)",
          500: "#9fe870",
          600: "#9fe870",
          700: "#163300",
          foreground: "#163300",
        },
        wise: {
          lime: "#9fe870",
          forest: "#163300",
          mint: "#e2f6d5",
          pastel: "#cdffad",
          positive: "#054d28",
          danger: "#d03238",
          warning: "#ffd11a",
          orange: "#ffc091",
        },
        warm: {
          50: "#e8ebe6",
          300: "#868685",
          900: "#0e0f0c",
        },
        gold: "#9fe870",
      },
      fontFamily: {
        sans: ["Inter", "Helvetica", "Arial", "sans-serif"],
        display: ["Wise Sans", "Inter", "Helvetica", "Arial", "sans-serif"],
      },
      fontSize: {
        "display-hero": ["6rem", { lineHeight: "0.85", letterSpacing: "0", fontWeight: "900" }],
        "display-section": ["4rem", { lineHeight: "0.85", letterSpacing: "0", fontWeight: "900" }],
        "display-sub": ["2.5rem", { lineHeight: "0.85", letterSpacing: "0", fontWeight: "900" }],
      },
      boxShadow: {
        ring: "rgba(14, 15, 12, 0.12) 0px 0px 0px 1px",
        "ring-inset-input": "rgb(134, 134, 133) 0px 0px 0px 1px inset",
        deep: "rgba(14, 15, 12, 0.12) 0px 0px 0px 1px",
      },
      borderRadius: {
        card: "16px",
        "card-md": "30px",
        "card-lg": "40px",
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
