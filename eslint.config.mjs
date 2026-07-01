import nextPlugin from "@next/eslint-plugin-next";

// ESLint 9 flat config. Next 16 removed the `next lint` wrapper, so we run
// ESLint directly (`eslint .`). We use the Next plugin's native flat config
// (`core-web-vitals`) rather than the legacy shareable config through
// FlatCompat, which currently crashes on serialization under ESLint 9.
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  nextPlugin.configs["core-web-vitals"],
  {
    rules: {
      // We use next/image where it helps, but plain <img> is fine for our
      // pre-sized static assets and data-URI previews.
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
