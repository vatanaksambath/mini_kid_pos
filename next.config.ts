import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Turbopack options
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
