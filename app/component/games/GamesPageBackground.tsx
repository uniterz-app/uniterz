"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import RisingMotesLayer from "@/app/component/games/RisingMotesLayer";

type GamesPageBackgroundProps = {
  lite?: boolean;
};

/**
 * ページ遷移などで本コンポーネントが再マウントされても背景の位相が
 * リセットされないよう、モジュール読込時刻を共通の時計として使う。
 */
const BG_CLOCK_START_MS =
  typeof performance !== "undefined" ? performance.now() : 0;

function bgElapsedSec(): number {
  if (typeof performance === "undefined") return 0;
  return (performance.now() - BG_CLOCK_START_MS) / 1000;
}

function cssResumeDelay(baseDelaySec: number): string {
  return `${(baseDelaySec - bgElapsedSec()).toFixed(2)}s`;
}

/**
 * 共通サイバー背景
 * - カラーオーロラ4層のクロスフェード（色相循環）は維持
 * - 上昇バーティクル（モート）は維持
 * - 3D 地形／ストリーク／スキャン帯は廃止し、暗い深層フィールド＋ビネットに刷新
 */
export default function GamesPageBackground({
  lite = false,
}: GamesPageBackgroundProps) {
  const reduceMotion = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  /** SSR / 初回クライアント描画は固定値に揃え、ハイドレーション後に位相を再開 */
  const phase = useMemo(
    () => ({
      aurora: hydrated ? cssResumeDelay(0) : "0s",
      field: hydrated ? cssResumeDelay(0) : "0s",
    }),
    [hydrated],
  );

  const auroraCycleSec = lite ? 42 : 28;
  const auroraAnim = (name: string): React.CSSProperties =>
    reduceMotion
      ? {}
      : {
          animation: `${name} ${auroraCycleSec}s ease-in-out infinite`,
          animationDelay: phase.aurora,
        };

  const auroraA = lite ? 0.2 : 0.27;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* ベース：ダークグリーンの闇 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #021208 0%, #020e09 52%, #010805 100%)",
        }}
      />

      {/* ベース色相シフト（オーロラと同期） */}
      {!reduceMotion && (
        <>
          <div
            className="absolute inset-0"
            style={{
              willChange: "opacity",
              background:
                "linear-gradient(180deg, #031810 0%, #02140c 48%, #020a07 100%)",
              ...auroraAnim("gamesBaseTintGreen"),
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              willChange: "opacity",
              opacity: 0.12,
              background:
                "linear-gradient(180deg, #021018 0%, #031228 52%, #020814 100%)",
              ...auroraAnim("gamesBaseTintBlue"),
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              willChange: "opacity",
              opacity: 0.1,
              background:
                "linear-gradient(180deg, #08051a 0%, #0c0818 52%, #060410 100%)",
              ...auroraAnim("gamesBaseTintViolet"),
            }}
          />
        </>
      )}

      {/*
        深層フィールド：微細ドット＋フラットグリッド（3D 地形の代替）
      */}
      <div
        className="absolute inset-0"
        style={{
          opacity: lite ? 0.42 : 0.55,
          backgroundImage: `
            radial-gradient(circle, rgba(134,210,180,0.18) 0.55px, transparent 0.65px)
          `,
          backgroundSize: "18px 18px",
        }}
      />
      <div
        className="absolute inset-[-12%]"
        style={{
          opacity: lite ? 0.16 : 0.22,
          backgroundImage: `
            linear-gradient(rgba(100,150,130,0.11) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,150,130,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          ...(reduceMotion
            ? {}
            : {
                willChange: "transform",
                animation: `gamesFieldDrift ${lite ? 28 : 20}s linear infinite`,
                animationDelay: phase.field,
              }),
        }}
      />
      {/* 中央に向かう薄い深度線 */}
      <div
        className="absolute inset-0"
        style={{
          opacity: lite ? 0.24 : 0.32,
          background: `
            repeating-linear-gradient(
              180deg,
              transparent 0px,
              transparent 47px,
              rgba(40,70,60,0.06) 48px,
              transparent 49px
            )
          `,
          WebkitMaskImage:
            "radial-gradient(ellipse 88% 72% at 50% 42%, black 0%, transparent 78%)",
          maskImage:
            "radial-gradient(ellipse 88% 72% at 50% 42%, black 0%, transparent 78%)",
        }}
      />

      {/*
        カラーオーロラ：緑・青・紫・琥珀の4層クロスフェード（維持）
      */}
      <div
        className="absolute inset-0"
        style={{
          willChange: "opacity",
          background: `
            radial-gradient(ellipse 68% 50% at 14% 4%, rgba(52,211,153,${auroraA}) 0%, transparent 66%),
            radial-gradient(ellipse 58% 46% at 88% 18%, rgba(132,204,22,${lite ? 0.12 : 0.17}) 0%, transparent 68%),
            radial-gradient(ellipse 80% 44% at 50% 108%, rgba(45,212,191,${lite ? 0.15 : 0.2}) 0%, transparent 70%)
          `,
          ...auroraAnim("gamesAuroraGreen"),
        }}
      />
      {!reduceMotion && (
        <>
          <div
            className="absolute inset-0"
            style={{
              willChange: "opacity",
              opacity: 0.03,
              background: `
                radial-gradient(ellipse 68% 50% at 14% 4%, rgba(34,211,238,${auroraA}) 0%, transparent 66%),
                radial-gradient(ellipse 58% 46% at 88% 18%, rgba(59,130,246,${lite ? 0.11 : 0.15}) 0%, transparent 68%),
                radial-gradient(ellipse 80% 44% at 50% 108%, rgba(14,165,233,${lite ? 0.13 : 0.17}) 0%, transparent 70%)
              `,
              ...auroraAnim("gamesAuroraBlue"),
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              willChange: "opacity",
              opacity: 0.03,
              background: `
                radial-gradient(ellipse 68% 50% at 14% 4%, rgba(168,85,247,${lite ? 0.16 : 0.21}) 0%, transparent 66%),
                radial-gradient(ellipse 58% 46% at 88% 18%, rgba(217,70,239,${lite ? 0.1 : 0.13}) 0%, transparent 68%),
                radial-gradient(ellipse 80% 44% at 50% 108%, rgba(139,92,246,${lite ? 0.12 : 0.15}) 0%, transparent 70%)
              `,
              ...auroraAnim("gamesAuroraViolet"),
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              willChange: "opacity",
              opacity: 0.03,
              background: `
                radial-gradient(ellipse 68% 50% at 14% 4%, rgba(251,191,36,${lite ? 0.13 : 0.16}) 0%, transparent 66%),
                radial-gradient(ellipse 58% 46% at 88% 18%, rgba(245,158,11,${lite ? 0.09 : 0.11}) 0%, transparent 68%),
                radial-gradient(ellipse 80% 44% at 50% 108%, rgba(251,146,60,${lite ? 0.11 : 0.14}) 0%, transparent 70%)
              `,
              ...auroraAnim("gamesAuroraAmber"),
            }}
          />
        </>
      )}

      {/* 上空の淡いハイライト */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -8%, rgba(187,247,208,0.06) 0%, transparent 70%)",
        }}
      />

      {/* 周辺を軽く落とすビネット */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 95% 88% at 50% 44%, transparent 0%, rgba(0,0,0,0.22) 68%, rgba(0,0,0,0.48) 100%)
          `,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, transparent 24%, transparent 72%, rgba(0,0,0,0.38) 100%)",
        }}
      />

      {/* ビネットより手前に描画してモートの視認性を確保 */}
      <RisingMotesLayer lite={lite} />
    </div>
  );
}
