// Test stub for the `server-only` import marker.
//
// In the Next.js build, `server-only` is a real module that throws if a
// server-only file is ever bundled into client code. There's no equivalent in
// the vitest (node) environment, so we alias the bare specifier to this empty
// module — letting us unit-test server libraries (OTP, verification helpers)
// directly. See vitest.config.ts `resolve.alias`.
export {};
