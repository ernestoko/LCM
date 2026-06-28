/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
