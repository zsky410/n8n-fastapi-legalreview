/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
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
      },
      boxShadow: {
        card: "0 14px 34px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
}

