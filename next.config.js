/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Disable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ✅ Updated for Next.js 15+
  serverExternalPackages: [],

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Disable React strict mode for production
  reactStrictMode: false,
};

export default config;
