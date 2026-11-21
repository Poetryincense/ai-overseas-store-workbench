import type { NextConfig } from "next";

const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiInternalUrl}/api/v1/:path*`
      }
    ];
  },
  async headers() {
    return [
      {
        source: "/login",
        headers: [{ key: "Cache-Control", value: "no-store" }]
      },
      {
        source: "/dashboard",
        headers: [{ key: "Cache-Control", value: "no-store" }]
      },
      {
        source: "/dashboard/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }]
      }
    ];
  }
};

export default nextConfig;
