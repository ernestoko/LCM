import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Liberty Cargo Movers brand palette — deep navy + cargo gold accents.
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd2ff",
          300: "#8eb4ff",
          400: "#598bff",
          500: "#3463ff",
          600: "#1d40f5",
          700: "#152fe1",
          800: "#1829b6",
          900: "#1a298f",
          950: "#141a57",
        },
        navy: {
          50: "#f3f6fb",
          100: "#e3eaf5",
          200: "#cdd9ec",
          300: "#a9bedd",
          400: "#7e9bca",
          500: "#5e7cb9",
          600: "#4a64a0",
          700: "#3d5283",
          800: "#36476d",
          900: "#0f1b3d",
          950: "#0a1230",
        },
        gold: {
          50: "#fbf8ee",
          100: "#f4eccf",
          200: "#ead79f",
          300: "#dfbc66",
          400: "#d6a541",
          500: "#c78d2c",
          600: "#ab6e23",
          700: "#89521f",
          800: "#724321",
          900: "#623820",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 27 61 / 0.04), 0 1px 3px 0 rgb(16 27 61 / 0.08)",
        "card-hover": "0 4px 12px 0 rgb(16 27 61 / 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
