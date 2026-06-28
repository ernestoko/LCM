"use client";

import { useEffect } from "react";

/**
 * Top-level error boundary. Catches errors thrown in the root layout itself,
 * so it must render its own <html>/<body>. The app's CSS may be unavailable in
 * this fallback, so styles are kept inline and dependency-free.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f6fb",
          padding: "48px 16px",
          fontFamily:
            'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          color: "#0f1b3d",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: "#ffffff",
            border: "1px solid #e3eaf5",
            borderRadius: 16,
            padding: 32,
            textAlign: "center",
            boxShadow: "0 1px 3px 0 rgba(16,27,61,0.08)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <svg width={32} height={32} viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect width="48" height="48" rx="11" fill="#0f1b3d" />
              <path d="M9 30h30l-3 6H12l-3-6Z" fill="#c78d2c" />
              <rect x="14" y="14" width="20" height="14" rx="2" fill="#fff" />
              <path d="M14 19h20M19 14v14M24 14v14M29 14v14" stroke="#0f1b3d" strokeWidth="1.4" />
              <path d="M8 24h4M36 24h4" stroke="#598bff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f1b3d" }}>
              Liberty Cargo Movers
            </span>
          </div>

          <h1 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#5e7cb9",
              margin: "0 auto",
              maxWidth: 320,
              lineHeight: 1.5,
            }}
          >
            The application ran into an unexpected error. Reloading usually
            resolves it.
          </p>

          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 24,
              height: 40,
              padding: "0 20px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#1d40f5",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>

          {error.digest && (
            <p
              style={{
                marginTop: 24,
                fontSize: 11,
                color: "#7e9bca",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
