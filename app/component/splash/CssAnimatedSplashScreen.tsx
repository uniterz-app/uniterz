"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { MIN_SPLASH_DURATION_MS } from "@/app/component/splash/splashTiming";
import { nameRajdhani } from "@/lib/fonts";

/**
 * モバイル向け Auth スプラッシュ。WebGL を使わず CSS のみで表示。
 */
export default function CssAnimatedSplashScreen() {
  const [decorationsReady, setDecorationsReady] = useState(false);
  const [loadProgress01, setLoadProgress01] = useState(0);
  const loadRafRef = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  const loadPercent = useMemo(
    () => Math.min(100, Math.round(loadProgress01 * 100)),
    [loadProgress01],
  );

  useEffect(() => {
    const t = setTimeout(() => setDecorationsReady(true), 320);
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
    <div
      className="relative flex h-full min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-app"
      style={{ backgroundColor: "#081116" }}
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 38%, rgba(34,211,238,0.12) 0%, transparent 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        <div className="splash-cyber-grid absolute inset-0 opacity-[0.28]" />
        <div
          className="absolute left-1/2 top-[38%] h-[min(12rem,34vw)] w-[min(12rem,34vw)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80"
          style={{
            background:
              "conic-gradient(from 210deg, rgba(34,211,238,0.35), rgba(52,211,153,0.2), rgba(139,92,246,0.18), rgba(34,211,238,0.35))",
            boxShadow:
              "0 0 48px rgba(34,211,238,0.28), inset 0 0 32px rgba(6,182,212,0.15)",
          }}
        />
        <div
          className="absolute left-1/2 top-[38%] flex h-[min(7.5rem,22vw)] w-[min(7.5rem,22vw)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-cyan-400/35 bg-linear-to-b from-cyan-950/55 to-slate-950/75"
          style={{
            boxShadow: "0 0 28px rgba(34,211,238,0.22)",
          }}
        >
          <span
            className={[
              "bg-linear-to-b from-cyan-50 via-cyan-200 to-cyan-500/90 bg-clip-text text-[clamp(2.5rem,10vw,3.5rem)] font-bold text-transparent",
              "drop-shadow-[0_0_18px_rgba(34,211,238,0.45)]",
            ].join(" ")}
          >
            U
          </span>
        </div>
      </div>

      <div
        className={[
          "pointer-events-none absolute left-1/2 top-[calc(50%+clamp(1.5rem,6.5vh,3.75rem))] z-200 flex w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-[clamp(0.75rem,3.25vh,2rem)] flex-col items-center gap-1.5",
          nameRajdhani.className,
        ].join(" ")}
      >
        {decorationsReady ? (
          <>
            <span
              className={[
                "bg-linear-to-b from-cyan-50 via-cyan-200 to-cyan-500/90 bg-clip-text text-[clamp(1.75rem,6.5vw,2.85rem)] font-semibold uppercase tracking-[0.28em] text-transparent",
                "drop-shadow-[0_0_24px_rgba(34,211,238,0.4)]",
              ].join(" ")}
            >
              Uniterz
            </span>
            <div className="h-px w-[min(10.5rem,68vw)] max-w-full bg-linear-to-r from-transparent via-cyan-400/75 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.45)]" />
          </>
        ) : (
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
              style={{ transform: `scaleX(${loadProgress01})` }}
            />
          </div>
        </div>

        <div className="mt-3 flex w-full max-w-md flex-col items-center gap-2 px-1">
          <div className="flex w-full items-center justify-center gap-3 sm:gap-4">
            <span
              className="h-px flex-1 max-w-14 bg-linear-to-r from-transparent to-cyan-400/55"
              aria-hidden
            />
            <p
              className="splash-loading-caption splash-seven-seg shrink-0 text-center text-[clamp(0.7rem,2.8vw,0.95rem)] font-normal uppercase tracking-[0.14em] text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.55),0_0_22px_rgba(6,182,212,0.2)] sm:tracking-[0.18em]"
              aria-live="polite"
            >
              Loading
            </p>
            <span
              className="h-px flex-1 max-w-14 bg-linear-to-l from-transparent to-cyan-400/55"
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

      {decorationsReady ? (
        <div className="pointer-events-none absolute inset-0 z-10">
          <div
            className="splash-cyber-corner absolute left-4 top-4 h-10 w-10 rounded-tl-md border-l-2 border-t-2 border-cyan-400/55"
          />
          <div
            className="splash-cyber-corner absolute right-4 top-4 h-10 w-10 rounded-tr-md border-r-2 border-t-2 border-cyan-400/55"
          />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-black/50 to-transparent" />
        </div>
      ) : null}
    </div>
  );
}
