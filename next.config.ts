// next.config.ts
import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

const baseConfig: NextConfig = {
  reactStrictMode: true,

  // Turbopack を使うときは空オブジェクトで OK（設定不要）
  turbopack: {},

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
    ],
  },
};

// PWA は本番のみ
export default isProd
  ? withPWA({
      dest: "public",
      register: true,
      skipWaiting: true,
    })(baseConfig)
  : baseConfig;
