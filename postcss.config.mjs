/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Tailwind CSS v4 ships its own PostCSS plugin; it handles @import and
    // vendor-prefixing (via Lightning CSS) internally, so autoprefixer is gone.
    "@tailwindcss/postcss": {},
  },
};

export default config;
