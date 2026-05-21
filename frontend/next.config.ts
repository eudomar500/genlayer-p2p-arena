import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["genlayer-js", "@tanstack/react-query"],
  },
};

export default nextConfig;
