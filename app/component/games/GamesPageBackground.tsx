"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import RisingMotesLayer from "@/app/component/games/RisingMotesLayer";
import {
  GAMES_AURORA_CYCLE_LITE_MS,
  GAMES_AURORA_CYCLE_MS,
  GAMES_PAGE_BG_GRADIENT,
  GAMES_PAGE_FIELD,
  gamesAuroraPhaseCss,
  gamesAuroraPhaseStops,
  gamesPageBgTintCss,
  gamesTopHighlightCss,
} from "@/lib/games/gamesPageBackgroundSpec";

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

  const auroraCycleSec = lite
    ? GAMES_AURORA_CYCLE_LITE_MS / 1000
    : GAMES_AURORA_CYCLE_MS / 1000;
  const auroraAnim = (name: string): React.CSSProperties =>
    reduceMotion
      ? {}
      : {
          animation: `${name} ${auroraCycleSec}s ease-in-out infinite`,
          animationDelay: phase.aurora,
        };

  const auroraStops = gamesAuroraPhaseStops(lite);
  const dotOpacity = lite ? GAMES_PAGE_FIELD.dotOpacityLite : GAMES_PAGE_FIELD.dotOpacity;
  const gridOpacity = lite ? GAMES_PAGE_FIELD.gridOpacityLite : GAMES_PAGE_FIELD.gridOpacity;
  const depthOpacity = lite ? GAMES_PAGE_FIELD.depthOpacityLite : GAMES_PAGE_FIELD.depthOpacity;
  const fieldDriftSec = lite
    ? GAMES_PAGE_FIELD.driftMsLite / 1000
    : GAMES_PAGE_FIELD.driftMs / 1000;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-x-hidden overflow-y-visible"
      aria-hidden
    >
      {/* ベース：ダークグリーンの闇 */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${GAMES_PAGE_BG_GRADIENT.top} 0%, ${GAMES_PAGE_BG_GRADIENT.mid} 52%, ${GAMES_PAGE_BG_GRADIENT.bottom} 100%)`,
        }}
      />

      {/* ベース色相シフト（オーロラと同期） */}
      {!reduceMotion && (
        <>
          <div
            className="absolute inset-0"
            style={{
              willChange: "opacity",
              background: gamesPageBgTintCss("green"),
              ...auroraAnim("gamesBaseTintGreen"),
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              willChange: "opacity",
              opacity: 0.12,
              background: gamesPageBgTintCss("blue"),
              ...auroraAnim("gamesBaseTintBlue"),
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              willChange: "opacity",
              opacity: 0.1,
              background: gamesPageBgTintCss("violet"),
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
          opacity: dotOpacity,
          backgroundImage: `
            radial-gradient(circle, rgba(134,210,180,0.18) 0.55px, transparent 0.65px)
          `,
          backgroundSize: "18px 18px",
        }}
      />
      <div
        className="absolute inset-[-12%]"
        style={{
          opacity: gridOpacity,
          backgroundImage: `
            linear-gradient(rgba(100,150,130,0.11) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,150,130,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          ...(reduceMotion
            ? {}
            : {
                willChange: "transform",
                animation: `gamesFieldDrift ${fieldDriftSec}s linear infinite`,
                animationDelay: phase.field,
              }),
        }}
      />
      {/* 中央に向かう薄い深度線 */}
      <div
        className="absolute inset-0"
        style={{
          opacity: depthOpacity,
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
          background: gamesAuroraPhaseCss(auroraStops.green),
          ...auroraAnim("gamesAuroraGreen"),
        }}
      />
      {!reduceMotion && (
        <>
          <div
            className="absolute inset-0"
            style={{
              willChange: "opacity",
              background: gamesAuroraPhaseCss(auroraStops.blue),
              ...auroraAnim("gamesAuroraBlue"),
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              willChange: "opacity",
              background: gamesAuroraPhaseCss(auroraStops.violet),
              ...auroraAnim("gamesAuroraViolet"),
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              willChange: "opacity",
              background: gamesAuroraPhaseCss(auroraStops.amber),
              ...auroraAnim("gamesAuroraAmber"),
            }}
          />
        </>
      )}

      {/* 上空の淡いハイライト */}
      <div
        className="absolute inset-0"
        style={{
          background: gamesTopHighlightCss(),
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
