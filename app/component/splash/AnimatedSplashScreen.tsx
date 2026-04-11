"use client";

import "@fontsource/dseg14-classic";
import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import UniterzLogo3DBackground from "@/app/component/background/UniterzLogo3DBackground";
import { MIN_SPLASH_DURATION_MS } from "@/app/component/splash/splashTiming";
import { nameRajdhani } from "@/lib/fonts";

/**
 * 初回は WebGL の3Dロゴのみ（上に HTML を重ねない）。
 * 初回描画後にワードマークとサイバー HUD を重ねる。
 */
export default function AnimatedSplashScreen() {
  const [decorationsReady, setDecorationsReady] = useState(false);
  /** 0〜1。バー（scaleX）と数字（%）の単一ソース */
  const [loadProgress01, setLoadProgress01] = useState(0);
  const loadRafRef = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  const loadPercent = useMemo(
    () => Math.min(100, Math.round(loadProgress01 * 100)),
    [loadProgress01],
  );

  useEffect(() => {
    // WebGL 失敗時も永久に真っ暗にならないようフォールバック
    const t = setTimeout(() => setDecorationsReady(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setLoadProgress01(1);
      return;
    }

    setLoadProgress01(0);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / MIN_SPLASH_DURATION_MS);
      setLoadProgress01(t);
      if (t < 1) {
        loadRafRef.current = requestAnimationFrame(tick);
      } else {
        loadRafRef.current = null;
      }
    };
    loadRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (loadRafRef.current != null) {
        cancelAnimationFrame(loadRafRef.current);
      }
    };
  }, [reduceMotion]);

  return (
    <div className="relative flex h-full min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-app">
      <div className="pointer-events-none absolute inset-0 z-0 -translate-y-[clamp(0.75rem,3.25vh,2rem)]">
        <UniterzLogo3DBackground
          variant="splash"
          onFirstFrame={() => setDecorationsReady(true)}
        />
      </div>

      {/* ワードマーク＋ローディングバー（名前の少し下にバー。装飾前も同じ縦帯でバーだけ表示） */}
      <div
        className={[
          "pointer-events-none absolute left-1/2 top-[calc(50%+clamp(1.5rem,6.5vh,3.75rem))] z-[200] flex w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-[clamp(0.75rem,3.25vh,2rem)] flex-col items-center gap-1.5",
          nameRajdhani.className,
        ].join(" ")}
      >
        {decorationsReady ? (
          <>
            <span
              className={[
                "bg-gradient-to-b from-cyan-50 via-cyan-200 to-cyan-500/90 bg-clip-text text-[clamp(1.75rem,6.5vw,2.85rem)] font-semibold uppercase tracking-[0.28em] text-transparent",
                "drop-shadow-[0_0_24px_rgba(34,211,238,0.4)]",
              ].join(" ")}
            >
              Uniterz
            </span>
            <div className="h-px w-[min(10.5rem,68vw)] max-w-full bg-gradient-to-r from-transparent via-cyan-400/75 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.45)]" />
          </>
        ) : (
          /* タイトル未表示時もバー位置が大きく跳ばないよう高さを確保 */
          <div
            className="flex w-full flex-col items-center gap-1.5 opacity-0"
            aria-hidden
          >
            <span className="text-[clamp(1.75rem,6.5vw,2.85rem)] font-semibold uppercase tracking-[0.28em]">
              Uniterz
            </span>
            <div className="h-px w-[min(10.5rem,68vw)] max-w-full" />
          </div>
        )}
        <div className="mt-2 w-full max-w-md px-1">
          <div
            className="splash-loading-track w-full"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={loadPercent}
            aria-valuetext={`${loadPercent}%`}
            aria-label="Loading"
          >
            <div
              className="splash-loading-fill"
              style={{
                transform: `scaleX(${loadProgress01})`,
              }}
            />
          </div>
        </div>

        <div className="mt-3 flex w-full max-w-md flex-col items-center gap-2 px-1">
          <div className="flex w-full items-center justify-center gap-3 sm:gap-4">
            <span
              className="h-px flex-1 max-w-[3.5rem] bg-gradient-to-r from-transparent to-cyan-400/55"
              aria-hidden
            />
            <p
              className="splash-loading-caption splash-seven-seg shrink-0 text-center text-[clamp(0.7rem,2.8vw,0.95rem)] font-normal uppercase tracking-[0.14em] text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.55),0_0_22px_rgba(6,182,212,0.2)] sm:tracking-[0.18em]"
              aria-live="polite"
            >
              Loading
            </p>
            <span
              className="h-px flex-1 max-w-[3.5rem] bg-gradient-to-l from-transparent to-cyan-400/55"
              aria-hidden
            />
          </div>
          <span
            className="splash-seven-seg splash-loading-caption text-[clamp(1.05rem,4.2vw,1.55rem)] font-normal tabular-nums tracking-[0.22em] text-cyan-200/90 drop-shadow-[0_0_14px_rgba(34,211,238,0.45)] sm:tracking-[0.28em]"
            aria-hidden
          >
            {String(loadPercent).padStart(3, "0")}
          </span>
        </div>
      </div>

      {decorationsReady && (
        <>
          {/* サイバー風オーバーレイ */}
          <div className="pointer-events-none absolute inset-0 z-10">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 85% 55% at 50% 38%, rgba(34,211,238,0.09) 0%, transparent 50%, rgba(0,0,0,0.5) 100%)",
              }}
            />

            <div
              className="absolute inset-0 opacity-70"
              style={{
                background:
                  "linear-gradient(125deg, rgba(6,182,212,0.12) 0%, transparent 38%, transparent 62%, rgba(139,92,246,0.08) 100%)",
              }}
            />

            <div className="splash-cyber-grid absolute inset-0 opacity-[0.38]" />

            <div className="splash-cyber-scanlines absolute inset-0 mix-blend-overlay opacity-45" />

            <div
              className="splash-cyber-beam absolute left-[5%] right-[5%] top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-cyan-300/90 to-transparent shadow-[0_0_24px_rgba(34,211,238,0.85),0_0_48px_rgba(34,211,238,0.25)]"
            />

            <div
              className="splash-cyber-corner absolute left-4 top-4 h-10 w-10 rounded-tl-md border-l-2 border-t-2 border-cyan-400/55"
              style={{ animationDelay: "0s" }}
            />
            <div
              className="splash-cyber-corner absolute right-4 top-4 h-10 w-10 rounded-tr-md border-r-2 border-t-2 border-cyan-400/55"
              style={{ animationDelay: "0.35s" }}
            />
            <div
              className="splash-cyber-corner absolute bottom-4 left-4 h-10 w-10 rounded-bl-md border-b-2 border-l-2 border-cyan-400/55"
              style={{ animationDelay: "0.7s" }}
            />
            <div
              className="splash-cyber-corner absolute bottom-4 right-4 h-10 w-10 rounded-br-md border-b-2 border-r-2 border-cyan-400/55"
              style={{ animationDelay: "1.05s" }}
            />

            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-5 left-6 right-6 h-px bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent" />
            <div
              className="absolute bottom-6 left-6 right-6 h-3 opacity-40"
              style={{
                backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 5px,
              rgba(34,211,238,0.35) 5px,
              rgba(34,211,238,0.35) 6px
            )`,
                maskImage:
                  "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
              }}
            />

            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E")`,
                backgroundSize: "180px 180px",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
