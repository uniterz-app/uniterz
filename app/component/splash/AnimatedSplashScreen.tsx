"use client";

import { useEffect, useState } from "react";
import UniterzLogo3DBackground from "@/app/component/background/UniterzLogo3DBackground";
import { nameRajdhani } from "@/lib/fonts";

/**
 * 初回は WebGL の3Dロゴのみ（上に HTML を重ねない）。
 * 初回描画後にワードマークとサイバー HUD を重ねる。
 */
export default function AnimatedSplashScreen() {
  const [decorationsReady, setDecorationsReady] = useState(false);

  useEffect(() => {
    // WebGL 失敗時も永久に真っ暗にならないようフォールバック
    const t = setTimeout(() => setDecorationsReady(true), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative flex h-full min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-app">
      <div className="pointer-events-none absolute inset-0 z-0 -translate-y-[clamp(0.75rem,3.25vh,2rem)]">
        <UniterzLogo3DBackground
          variant="splash"
          onFirstFrame={() => setDecorationsReady(true)}
        />
      </div>

      {decorationsReady && (
        <>
          {/* 3D ロゴ（画面中央付近）のすぐ下 */}
          <div
            className={[
              "pointer-events-none absolute left-1/2 top-[calc(50%+clamp(1.5rem,6.5vh,3.75rem))] z-20 flex -translate-x-1/2 -translate-y-[clamp(0.75rem,3.25vh,2rem)] flex-col items-center gap-1.5",
              nameRajdhani.className,
            ].join(" ")}
          >
            <span
              className={[
                "bg-gradient-to-b from-cyan-50 via-cyan-200 to-cyan-500/90 bg-clip-text text-[clamp(1.75rem,6.5vw,2.85rem)] font-semibold uppercase tracking-[0.28em] text-transparent",
                "drop-shadow-[0_0_24px_rgba(34,211,238,0.4)]",
              ].join(" ")}
            >
              Uniterz
            </span>
            <div className="h-px w-[min(10.5rem,68vw)] max-w-full bg-gradient-to-r from-transparent via-cyan-400/75 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.45)]" />
          </div>

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
