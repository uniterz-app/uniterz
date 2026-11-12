// next.config.ts
import type { NextConfig } from "next";

const PHASE_PRODUCTION_BUILD = "phase-production-build";

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

// PWA は本番ビルドだけ。next-pwa は読み込んだ瞬間に webpack を require する。
// 開発サーバが next.config.ts を読むたびに落とさないよう、ここでは呼ばない。
export default function nextConfig(phase: string): NextConfig {
  if (phase !== PHASE_PRODUCTION_BUILD) return baseConfig;
  const loaded = require("next-pwa") as
    | ((options: {
        dest: string;
        register: boolean;
        skipWaiting: boolean;
      }) => (config: NextConfig) => NextConfig)
    | {
        default: (options: {
          dest: string;
          register: boolean;
          skipWaiting: boolean;
        }) => (config: NextConfig) => NextConfig;
      };
  const withPWA = typeof loaded === "function" ? loaded : loaded.default;
  return withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
  })(baseConfig);
}
