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
        /**
         * Liberty Logistics & Trading — a deliberately three-part system:
         *   navy   → primary brand ink & dark surfaces (trust, depth)
         *   brand  → royal-blue action colour (links, buttons, focus)
         *   gold   → premium signature accent (the "torch", used sparingly)
         * The three are tuned to sit together: brand-950 ≈ navy, and gold is a
         * warm honey that contrasts cleanly on both navy and white.
         */
        // Primary brand colour is gold (the eagle + all actions). Tuned so
        // brand-600 keeps AA contrast with white text on buttons.
        brand: {
          50: "#fbf7ea",
          100: "#f6edc7",
          200: "#eed892",
          300: "#e2c155",
          400: "#d2a32c", // bright metallic gold (accents, logo)
          500: "#b6881a",
          600: "#946c12", // primary buttons (white text, ~4.6:1)
          700: "#785811",
          800: "#634914",
          900: "#543c16",
          950: "#301f07",
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
          100: "#f6ecca",
          200: "#ecd594",
          300: "#e3bd5e",
          400: "#d9a738",
          500: "#c2851d",
          600: "#a4661f",
          700: "#84501f",
          800: "#6e4220",
          900: "#5f3a1f",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 27 61 / 0.04), 0 1px 3px 0 rgb(16 27 61 / 0.08)",
        "card-hover":
          "0 10px 24px -6px rgb(16 27 61 / 0.14), 0 4px 8px -4px rgb(16 27 61 / 0.10)",
        // Premium lift for hero media, floating panels and feature cards.
        lift: "0 24px 60px -20px rgb(10 18 48 / 0.45)",
        // Soft gold glow for signature accents on dark surfaces.
        glow: "0 0 0 1px rgb(217 167 56 / 0.25), 0 8px 28px -8px rgb(217 167 56 / 0.30)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.8s ease-out both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
