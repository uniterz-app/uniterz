// next.config.ts
import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

// 🔥 ここに turbopack を追加！！
const baseConfig: NextConfig = {
  reactStrictMode: true,

  // Turbopack の空設定 → “Turbopack を使うが設定は空” と認識され矛盾が消える
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

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgo: true,
            titleProp: true,
            ref: true,
          },
        },
      ],
    });
    return config;
  },
};

export default isProd
  ? withPWA({
      dest: "public",
      register: true,
      skipWaiting: true,
    })(baseConfig)
  : baseConfig;
