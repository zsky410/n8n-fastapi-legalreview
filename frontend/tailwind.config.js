/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        muted: "#5b6576",
        "muted-strong": "#334155",
        line: "rgba(15, 23, 42, 0.12)",
        surface: "#eef3f8",
        brand: {
          50: "#eef4ff",
          100: "#dfe9ff",
          200: "rgba(30, 58, 138, 0.12)",
          500: "#1e3a8a",
          600: "#183173",
          700: "#122756",
          foreground: "#f8fbff",
        },
        wise: {
          lime: "#b6d17a",
          forest: "#123524",
          mint: "#e6f5ec",
          pastel: "#eff7cf",
          positive: "#166534",
          danger: "#b42318",
          warning: "#f59e0b",
          orange: "#f4c56f",
        },
        warm: {
          50: "#f5f0e8",
          300: "#958b7a",
          900: "#111827",
        },
        gold: "#b88936",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "Helvetica", "Arial", "sans-serif"],
        serif: ["Lora", "Georgia", "serif"],
        display: ["Lora", "Georgia", "serif"],
      },
      fontSize: {
        "display-hero": ["6rem", { lineHeight: "0.88", letterSpacing: "-0.04em", fontWeight: "700" }],
        "display-section": ["4rem", { lineHeight: "0.92", letterSpacing: "-0.04em", fontWeight: "700" }],
        "display-sub": ["2.5rem", { lineHeight: "0.96", letterSpacing: "-0.035em", fontWeight: "700" }],
      },
      boxShadow: {
        ring: "0 0 0 1px rgba(15, 23, 42, 0.08)",
        "ring-inset-input": "inset 0 1px 1px rgba(255,255,255,0.82), 0 0 0 1px rgba(15,23,42,0.08)",
        deep: "0 30px 80px rgba(15, 23, 42, 0.10), 0 1px 0 rgba(255,255,255,0.5)",
      },
      borderRadius: {
        card: "16px",
        "card-md": "24px",
        "card-lg": "32px",
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
