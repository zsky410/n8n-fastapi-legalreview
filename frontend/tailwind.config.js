/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17130f",
        muted: "#5c554c",
        "muted-strong": "#454745",
        line: "rgba(23, 19, 15, 0.12)",
        surface: "#e8ebe6",
        brand: {
          50: "#fff4ef",
          100: "#ffe8dd",
          200: "rgba(122, 31, 43, 0.08)",
          500: "#7a1f2b",
          600: "#641923",
          700: "#7a1f2b",
          foreground: "#fffefa",
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
        gold: "#b38a2e",
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
        card: "14px",
        "card-md": "20px",
        "card-lg": "28px",
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
