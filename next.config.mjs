const isDev = process.env.NODE_ENV !== "production";

/**
 * Security headers applied to every response. CSP is pragmatic (allows the
 * inline scripts Next.js and our JSON-LD emit, plus Firebase, Turnstile and the
 * local emulator) — it restricts sources, blocks framing/clickjacking, forbids
 * plugins, and pins base-uri/form-action. The rest are the standard hardening
 * set (nosniff, referrer policy, locked-down permissions, HSTS).
 *
 * In development the CSP is relaxed for two things the Next.js dev runtime
 * needs but production never does: `'unsafe-eval'` (webpack's eval-based module
 * evaluation / source maps) and a localhost WebSocket source (Hot Module
 * Replacement). Without these, every client bundle throws `EvalError`, React
 * never hydrates, and JS-gated content (e.g. motion reveals) stays hidden.
 * The production CSP keeps `script-src` free of `'unsafe-eval'`.
 */
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  isDev && "'unsafe-eval'",
  "https://challenges.cloudflare.com",
]
  .filter(Boolean)
  .join(" ");

const connectSrc = [
  "'self'",
  "https://*.googleapis.com",
  "https://*.firebaseio.com",
  "wss://*.firebaseio.com",
  "https://firebasestorage.googleapis.com",
  "https://challenges.cloudflare.com",
  // Local Firebase Emulator Suite + Next.js dev HMR (both 127.0.0.1 and localhost).
  "http://127.0.0.1:*",
  "http://localhost:*",
  "ws://127.0.0.1:*",
  "ws://localhost:*",
]
  .filter(Boolean)
  .join(" ");

const CSP = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://*.googleapis.com",
  "font-src 'self' data:",
  `connect-src ${connectSrc}`,
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // HTTPS upgrade only matters in production; in dev it would break http://localhost.
  !isDev && "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

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
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        // Marketing photos and icons change rarely — let browsers/CDN cache them
        // for a month (with a day of stale-while-revalidate) so repeat visits
        // don't re-download them.
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/:file(favicon.svg|icon-maskable.svg)",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }],
      },
    ];
  },
  // Don't ship browser source maps to users — smaller, faster production build.
  productionBrowserSourceMaps: false,
  // Note: Turbopack (the Next 16 default) tree-shakes barrel imports
  // automatically, so the old experimental `optimizePackageImports` list is no
  // longer needed (and broke Turbopack's page-data collection).
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
