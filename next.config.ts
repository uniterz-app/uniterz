// next.config.ts
import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

// 🔥 元の設定を保持したベース config
const baseConfig: NextConfig = {
  reactStrictMode: true,

  // 🔥 Turbopック設定（そのまま）
  experimental: {
    turbo: {
      rules: {},
    },
  },

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

  // SVG loader（そのまま）
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

// 🔥 dev では PWA 無効 / build・production だけ有効
export default isProd
  ? withPWA({
      dest: "public",
      register: true,
      skipWaiting: true,
    })(baseConfig)
  : baseConfig;
