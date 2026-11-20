// next.config.ts
import type { NextConfig } from "next";

const baseConfig: NextConfig = {
  reactStrictMode: true,

  // Turbopack を使うときは空オブジェクトで OK（設定不要）
  turbopack: {},

  // LP 動画は同名上書きが多いのでブラウザに長期キャッシュさせない
  async headers() {
    return [
      {
        source: "/lp/:path*.mp4",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },

  // 自分のバケットだけ（他人のバケットの画像で /_next/image の変換枠を使わせない）
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/matchpik-7dbb1.firebasestorage.app/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/matchpik-7dbb1.appspot.com/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/matchpik-7dbb1.firebasestorage.app/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/matchpik-7dbb1.appspot.com/**",
      },
    ],
  },
};

// next-pwa は webpack 用で、Turbopack の `next build` では何もしない（sw.js も生成されていない）
export default baseConfig;
