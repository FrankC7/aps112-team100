import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#dcecff",
          200: "#bedcff",
          300: "#90c4ff",
          400: "#5ca2ff",
          500: "#2f7df6",
          600: "#1e63d1",
          700: "#184ea6",
          800: "#183f82",
          900: "#19386a"
        }
      },
      boxShadow: {
        kiosk: "0 20px 50px rgba(15, 23, 42, 0.08)"
      },
      backgroundImage: {
        "campus-grid":
          "radial-gradient(circle at 1px 1px, rgba(30, 99, 209, 0.1) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;

