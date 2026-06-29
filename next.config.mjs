/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't ship browser source maps to users — smaller, faster production build.
  productionBrowserSourceMaps: false,
  // Tree-shake big icon/util/animation libraries so only what's used is bundled.
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "framer-motion"],
  },
  images: {
    // Serve pre-sized local marketing photos directly (no server-side `sharp`
    // optimizer dependency). next/image still provides lazy-loading and layout
    // stability; our public/images assets are already export-sized.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Allow the production build to succeed even if a feature module still has
  // lint/type warnings — the CI `typecheck` script enforces correctness separately.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
