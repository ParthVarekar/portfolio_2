import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.parthvarekar.in" }],
        destination: "https://parthvarekar.in/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "parthvarekar.vercel.app" }],
        destination: "https://parthvarekar.in/:path*",
        permanent: true,
      },
      { source: "/projects", destination: "/work", permanent: true },
      { source: "/projects/:slug", destination: "/work/:slug", permanent: true },
      { source: "/project/:slug", destination: "/work/:slug", permanent: true },
      { source: "/portfolio", destination: "/work", permanent: true },
      { source: "/approach", destination: "/", permanent: true },
      { source: "/resume", destination: "/about", permanent: true },
      { source: "/about-me", destination: "/about", permanent: true },
      { source: "/contact-me", destination: "/contact", permanent: true },
      { source: "/home", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
