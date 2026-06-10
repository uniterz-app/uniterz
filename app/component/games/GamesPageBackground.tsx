"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

type GamesPageBackgroundProps = {
  lite?: boolean;
};

/**
 * ページ遷移などで本コンポーネントが再マウントされても背景の位相が
 * リセットされないよう、モジュール読込時刻を共通の時計として使う。
 * （SPA 内ではモジュールは一度しか評価されないため遷移を跨いで保持される）
 */
const BG_CLOCK_START_MS =
  typeof performance !== "undefined" ? performance.now() : 0;

function bgElapsedSec(): number {
  if (typeof performance === "undefined") return 0;
  return (performance.now() - BG_CLOCK_START_MS) / 1000;
}

/**
 * CSS アニメーション用：経過時間ぶん進んだ位置から再生する animation-delay。
 * 負の delay は CSS 仕様で「その秒数だけ進んだ状態で開始」が保証されている
 */
function cssResumeDelay(baseDelaySec: number): string {
  return `${(baseDelaySec - bgElapsedSec()).toFixed(2)}s`;
}

/**
 * framer-motion 用（ストリーク）：負の delay は環境により効かないことがあるため、
 * 過ぎてしまった分は「次の周期の頭」まで正の delay で繰り上げる
 */
function continuedDelay(baseDelaySec: number, cycleSec: number): number {
  const d = baseDelaySec - bgElapsedSec();
  if (d >= 0) return d;
  return cycleSec + (d % cycleSec);
}

/** 上昇する発光モート（データの粒）。SSR と一致させるため固定値 */
const RISING_MOTES = [
  { left: "7%", size: 2.5, duration: 22, delay: 0, drift: 18 },
  { left: "16%", size: 2, duration: 26, delay: 7, drift: -14 },
  { left: "27%", size: 3, duration: 19, delay: 3, drift: 12 },
  { left: "38%", size: 2, duration: 28, delay: 11, drift: -20 },
  { left: "52%", size: 2.5, duration: 21, delay: 5, drift: 16 },
  { left: "63%", size: 2, duration: 25, delay: 14, drift: -10 },
  { left: "72%", size: 3, duration: 20, delay: 1.5, drift: 22 },
  { left: "81%", size: 2, duration: 27, delay: 9, drift: -16 },
  { left: "90%", size: 2.5, duration: 23, delay: 4.5, drift: 12 },
  { left: "96%", size: 2, duration: 24, delay: 12.5, drift: -12 },
] as const;

/** 時折斜めに横切る光のストリーク（データビーム） */
const LIGHT_STREAKS = [
  { top: "16%", width: "26vw", angle: -7, duration: 1.7, delay: 2, repeatDelay: 9 },
  { top: "42%", width: "20vw", angle: -5, duration: 1.5, delay: 7.5, repeatDelay: 12 },
  { top: "68%", width: "30vw", angle: -8, duration: 1.9, delay: 13, repeatDelay: 15 },
] as const;

/**
 * 試合一覧ページ用背景（マトリックス緑基調）
 * ダークグリーンのベース + カラーオーロラ + ワイヤーフレーム地形 + スキャンライン。
 * 緑系／青系オーロラ2層の長周期クロスフェードで色相がゆっくり循環して見える
 * （filter: hue-rotate は全面再合成でカクつくため不使用）。
 */
export default function GamesPageBackground({
  lite = false,
}: GamesPageBackgroundProps) {
  const reduceMotion = useReducedMotion();

  /**
   * マウント時に一度だけ各レイヤーの再開位置を確定する。
   * 再レンダーで delay が変わるとアニメが再スタートするため useMemo で固定
   */
  const phase = useMemo(
    () => ({
      aurora: cssResumeDelay(0),
      terrain: cssResumeDelay(0),
      scanline: cssResumeDelay(0),
      motes: RISING_MOTES.map((m) => cssResumeDelay(m.delay)),
      streaks: LIGHT_STREAKS.map((s) =>
        continuedDelay(s.delay, s.duration + s.repeatDelay),
      ),
    }),
    [],
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ perspective: "1200px" }}
      aria-hidden
    >
      {/* ベース：純黒ではなく緑みを含んだ闇 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #031208 0%, #02100a 52%, #020a06 100%)",
        }}
      />

      {/*
        カラーオーロラ：緑系と青系の2層を長周期でクロスフェードして
        色相がゆっくり巡るように見せる（filter: hue-rotate は全面再合成で
        重いため不使用。opacity のみ＝GPU 合成だけで済む）
      */}
      <div
        className="absolute inset-0"
        style={{
          willChange: "opacity",
          background: `
            radial-gradient(ellipse 58% 42% at 14% 4%, rgba(52,211,153,${lite ? 0.12 : 0.16}) 0%, transparent 68%),
            radial-gradient(ellipse 52% 40% at 88% 18%, rgba(132,204,22,${lite ? 0.07 : 0.10}) 0%, transparent 70%),
            radial-gradient(ellipse 72% 38% at 50% 108%, rgba(45,212,191,${lite ? 0.09 : 0.12}) 0%, transparent 72%)
          `,
          ...(reduceMotion
            ? {}
            : {
                animation: `gamesAuroraDim ${lite ? 80 : 50}s ease-in-out infinite`,
                animationDelay: phase.aurora,
              }),
        }}
      />
      {!reduceMotion && (
        <div
          className="absolute inset-0"
          style={{
            willChange: "opacity",
            opacity: 0,
            background: `
              radial-gradient(ellipse 58% 42% at 14% 4%, rgba(34,211,238,${lite ? 0.12 : 0.16}) 0%, transparent 68%),
              radial-gradient(ellipse 52% 40% at 88% 18%, rgba(59,130,246,${lite ? 0.07 : 0.10}) 0%, transparent 70%),
              radial-gradient(ellipse 72% 38% at 50% 108%, rgba(99,102,241,${lite ? 0.09 : 0.12}) 0%, transparent 72%)
            `,
            animation: `gamesAuroraGlow ${lite ? 80 : 50}s ease-in-out infinite`,
            animationDelay: phase.aurora,
          }}
        />
      )}

      {/* 奥のワイヤーフレーム（淡いグリーン） */}
      <div
        className="absolute inset-[-30%]"
        style={{
          opacity: lite ? 0.18 : 0.22,
          backgroundImage: `
            linear-gradient(rgba(134,239,172,0.11) 1px, transparent 1px),
            linear-gradient(90deg, rgba(134,239,172,0.07) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          transform: "perspective(1400px) translateZ(-80px) scale(1.1)",
        }}
      />

      {/*
        手前のワイヤーフレーム地形（ネオングリーン・流れるアニメ）
        background-position は毎フレーム再ペイントで重いため、
        内側レイヤーの transform（translateY）で流す
      */}
      <div
        className="absolute inset-[-45%] overflow-hidden"
        style={{
          opacity: lite ? 0.3 : 0.38,
          transform: "rotateX(68deg) translateY(-18%)",
          transformOrigin: "top center",
          transformStyle: "preserve-3d",
          WebkitMaskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.95) 38%, rgba(0,0,0,0.35) 72%, rgba(0,0,0,0) 100%)",
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.95) 38%, rgba(0,0,0,0.35) 72%, rgba(0,0,0,0) 100%)",
        }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 top-[-56px]"
          style={{
            willChange: "transform",
            backgroundImage: `
              linear-gradient(rgba(74,222,128,0.20) 1px, transparent 1px),
              linear-gradient(90deg, rgba(74,222,128,0.13) 1px, transparent 1px)
            `,
            backgroundSize: "56px 56px",
            ...(reduceMotion
              ? {}
              : {
                  animation: `gamesTerrainFlow ${lite ? 20 : 14}s linear infinite`,
                  animationDelay: phase.terrain,
                }),
          }}
        />
      </div>

      {/* 地形が最も濃く見える帯に重ねるネオン地平線グロー */}
      <div
        className="absolute inset-x-0"
        style={{
          top: "28%",
          height: "22%",
          opacity: lite ? 0.5 : 0.65,
          background:
            "radial-gradient(ellipse 80% 56% at 50% 50%, rgba(74,222,128,0.13) 0%, rgba(45,212,191,0.05) 55%, transparent 75%)",
          filter: "blur(2px)",
        }}
      />

      {/* スキャンライン：ゆっくり降下する走査帯（lite では省略） */}
      {!lite && !reduceMotion && (
        <div
          className="absolute inset-x-0 top-0 h-[16vh]"
          style={{
            willChange: "transform",
            transform: "translateY(-18vh)",
            background: `
              linear-gradient(180deg,
                transparent 0%,
                rgba(74,222,128,0.030) 40%,
                rgba(187,247,208,0.075) 50%,
                rgba(74,222,128,0.030) 60%,
                transparent 100%
              )
            `,
            animation: "gamesScanlineSweep 15s linear infinite",
            animationDelay: phase.scanline,
          }}
        />
      )}

      {/* 上昇する発光モート：transform/opacity のみで負荷を抑える */}
      {!reduceMotion &&
        (lite ? RISING_MOTES.slice(0, 5) : RISING_MOTES).map((mote, i) => (
          <span
            key={mote.left}
            className="absolute rounded-full"
            style={
              {
                left: mote.left,
                bottom: -8,
                width: mote.size,
                height: mote.size,
                opacity: 0,
                willChange: "transform, opacity",
                background: "rgba(187,247,208,0.9)",
                boxShadow: "0 0 6px rgba(74,222,128,0.8)",
                "--mote-drift": `${mote.drift}px`,
                animation: `gamesMoteRise ${mote.duration}s linear infinite`,
                animationDelay: phase.motes[i],
              } as React.CSSProperties
            }
          />
        ))}

      {/* 時折斜めに横切る光のストリーク（lite では省略） */}
      {!lite &&
        !reduceMotion &&
        LIGHT_STREAKS.map((streak, i) => (
          <motion.div
            key={streak.top}
            className="absolute left-0 h-px"
            style={{
              top: streak.top,
              width: streak.width,
              willChange: "transform, opacity",
              rotate: streak.angle,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(74,222,128,0.25) 30%, rgba(220,252,231,0.85) 78%, rgba(255,255,255,0.95) 100%)",
              boxShadow: "0 0 8px rgba(110,231,183,0.5)",
            }}
            initial={{ x: "-35vw", opacity: 0 }}
            animate={{
              x: ["-35vw", "135vw"],
              opacity: [0, 0.85, 0.85, 0],
            }}
            transition={{
              duration: streak.duration,
              delay: phase.streaks[i],
              ease: [0.3, 0, 0.7, 1],
              repeat: Infinity,
              repeatDelay: streak.repeatDelay,
            }}
          />
        ))}

      {/* 上空のハイライト（淡い発光グリーン） */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -8%, rgba(187,247,208,0.08) 0%, transparent 70%)",
        }}
      />

      {/* 下端のフェード */}
      <div
        className="absolute inset-x-0 bottom-0 h-[32vh]"
        style={{
          background:
            "linear-gradient(180deg, rgba(2,8,5,0) 0%, rgba(2,8,5,0.5) 100%)",
        }}
      />
    </div>
  );
}
