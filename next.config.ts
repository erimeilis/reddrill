import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Initialize Cloudflare for dev environment
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  output: 'standalone',

  // Enable React Compiler (stable in Next.js 16)
  reactCompiler: true,

  // Disable Cache Components temporarily due to D1 database compatibility issues
  // TODO: Re-enable after resolving prerendering conflicts with D1 queries
  cacheComponents: false,

  // Enable Turbopack file system caching (beta)
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
