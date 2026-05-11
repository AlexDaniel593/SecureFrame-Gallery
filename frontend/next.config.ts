import type { NextConfig } from "next";

const MINIO_HOST = process.env.MINIO_ENDPOINT || "localhost:9000";
const BACKEND_HOST = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: new URL(`http://${MINIO_HOST.replace(/^https?:\/\//, "")}`).hostname,
        port: new URL(`http://${MINIO_HOST.replace(/^https?:\/\//, "")}`).port || undefined,
        pathname: "/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `img-src 'self' data: blob: http://${MINIO_HOST.replace(/^https?:\/\//, "")} https://${MINIO_HOST.replace(/^https?:\/\//, "")}`,
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "frame-src 'self'",
              "connect-src 'self'",
              "media-src 'self'",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
