import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Initialize Cloudflare for dev environment
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  output: 'standalone',

  // Enable React Compiler (stable in Next.js 16)
  reactCompiler: true,

  // Enable Cache Components (new caching model)
  cacheComponents: true,

  // Enable Turbopack file system caching (beta)
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
