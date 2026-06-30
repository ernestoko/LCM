/**
 * Security headers applied to every response. CSP is pragmatic (allows the
 * inline scripts Next.js and our JSON-LD emit, plus Firebase, Turnstile and the
 * local emulator) — it restricts sources, blocks framing/clickjacking, forbids
 * plugins, and pins base-uri/form-action. The rest are the standard hardening
 * set (nosniff, referrer policy, locked-down permissions, HSTS).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://*.googleapis.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://firebasestorage.googleapis.com https://challenges.cloudflare.com http://127.0.0.1:* http://localhost:* ws://127.0.0.1:*",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework / version to attackers.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
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
