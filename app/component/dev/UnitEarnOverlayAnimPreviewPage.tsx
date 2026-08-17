"use client";

/**
 * /mobile/unit-earn-anim-preview · /dev/unit-earn-anim-preview
 * Unit 獲得オーバーレイ入場アニメ案プレビュー。
 */
import { useCallback, useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { jp, nameOxanium } from "@/lib/fonts";
import {
  UNIT_EARN_OVERLAY_ANIM_SAMPLE,
  UNIT_EARN_OVERLAY_ANIM_VARIANTS,
  type UnitEarnOverlayAnimId,
} from "@/lib/units/unitEarnOverlayAnimPreview";
import { formatUnitEarnRankOrdinal } from "@/lib/units/formatUnitEarnRank";
import { UNIT_EARN_EASE } from "@/lib/units/unitEarnMotion";

const SAMPLE_RANK = 8;

function Coin({ size = 40 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "conic-gradient(from 210deg, #f9d576, #b8860b 40%, #f6c344 70%, #8a6410)",
        boxShadow: "inset 0 0 3px rgba(0,0,0,0.45)",
      }}
    >
      <span
        className="grid place-items-center rounded-full font-extrabold text-[#241902]"
        style={{
          width: size * 0.72,
          height: size * 0.72,
          fontSize: size * 0.32,
          background:
            "radial-gradient(circle at 35% 30%, #ffedb0, #d9a125 70%)",
        }}
      >
        U
      </span>
    </span>
  );
}

type DemoProps = {
  animId: UnitEarnOverlayAnimId;
  playKey: number;
  isJa: boolean;
};

function AnimDemo({ animId, playKey, isJa }: DemoProps) {
  const reduceMotion = useReducedMotion() === true;
  const [claimReady, setClaimReady] = useState(false);
  const [amount, setAmount] = useState(0);

  const title = isJa
    ? UNIT_EARN_OVERLAY_ANIM_SAMPLE.titleJa
    : UNIT_EARN_OVERLAY_ANIM_SAMPLE.titleEn;
  const subtitle = isJa
    ? UNIT_EARN_OVERLAY_ANIM_SAMPLE.subtitleJa
    : UNIT_EARN_OVERLAY_ANIM_SAMPLE.subtitleEn;
  const claimLabel = isJa ? "獲得する" : "Claim";
  const rankText = formatUnitEarnRankOrdinal(SAMPLE_RANK);

  useEffect(() => {
    setClaimReady(false);
    setAmount(0);
    if (reduceMotion) {
      setAmount(UNIT_EARN_OVERLAY_ANIM_SAMPLE.amount);
      setClaimReady(true);
      return;
    }

    const root = document.querySelector<HTMLElement>(
      `[data-anim-demo="${animId}-${playKey}"]`
    );
    if (!root) return;

    const detail = root.querySelector<HTMLElement>("[data-d=detail]");
    const rank = root.querySelector<HTMLElement>("[data-d=rank]");
    const prize = root.querySelector<HTMLElement>("[data-d=prize]");
    const footer = root.querySelector<HTMLElement>("[data-d=footer]");
    const flash = root.querySelector<HTMLElement>("[data-d=flash]");
    const ring = root.querySelector<HTMLElement>("[data-d=ring]");

    const ctrls: Array<{ stop: () => void }> = [];
    const timers: number[] = [];

    const reset = (el: HTMLElement | null, extra?: string) => {
      if (!el) return;
      el.style.opacity = "0";
      el.style.transform = extra ?? "translateY(10px)";
      el.style.filter = "none";
      el.style.letterSpacing = "";
    };

    reset(detail);
    reset(rank, "translateY(8px)");
    reset(prize, "translateY(12px) scale(0.96)");
    reset(footer, "translateY(8px)");
    if (flash) {
      flash.style.opacity = "0";
      flash.style.background = "transparent";
    }
    if (ring) {
      ring.style.opacity = "0";
      ring.style.transform = "translate(-50%, -50%) scale(0.35)";
      ring.style.borderColor = "rgba(207,250,254,0.35)";
      ring.style.borderWidth = "1px";
    }

    const run = (
      el: HTMLElement | null,
      keyframes: Record<string, number[] | string[]>,
      opts: { duration: number; delay?: number }
    ) => {
      if (!el) return;
      ctrls.push(
        animate(el, keyframes as never, {
          duration: opts.duration,
          delay: opts.delay ?? 0,
          ease: UNIT_EARN_EASE,
        })
      );
    };

    // 上質枠: 跳ね・全画面フラッシュ・巨大スケールなし
    if (animId === "cinema") {
      run(
        detail,
        {
          opacity: [0, 1],
          y: [6, 0],
          filter: ["blur(8px)", "blur(0px)"],
        },
        { duration: 0.55, delay: 0.04 }
      );
      run(
        rank,
        {
          opacity: [0, 1],
          y: [8, 0],
          filter: ["blur(10px)", "blur(0px)"],
        },
        { duration: 0.58, delay: 0.12 }
      );
      run(
        prize,
        {
          opacity: [0, 1],
          y: [10, 0],
          scale: [0.97, 1],
          filter: ["blur(8px)", "blur(0px)"],
        },
        { duration: 0.6, delay: 0.2 }
      );
      run(footer, { opacity: [0, 1], y: [6, 0] }, { duration: 0.4, delay: 0.34 });
    } else if (animId === "lock") {
      run(
        rank,
        {
          opacity: [0, 1],
          scale: [1.04, 1],
          letterSpacing: ["0.18em", "0.02em"],
        },
        { duration: 0.42, delay: 0.02 }
      );
      run(detail, { opacity: [0, 1], y: [8, 0] }, { duration: 0.36, delay: 0.18 });
      run(
        prize,
        { opacity: [0, 1], y: [10, 0], scale: [0.97, 1] },
        { duration: 0.4, delay: 0.28 }
      );
      run(footer, { opacity: [0, 1], y: [6, 0] }, { duration: 0.34, delay: 0.4 });
    } else if (animId === "press") {
      run(
        rank,
        { opacity: [0, 1], y: [-18, 0], scale: [1.03, 1] },
        { duration: 0.36, delay: 0.02 }
      );
      run(detail, { opacity: [0, 1], y: [-8, 0] }, { duration: 0.32, delay: 0.12 });
      run(
        prize,
        { opacity: [0, 1], y: [14, 0], scale: [0.96, 1] },
        { duration: 0.4, delay: 0.2 }
      );
      run(footer, { opacity: [0, 1], y: [8, 0] }, { duration: 0.32, delay: 0.34 });
    } else if (animId === "depth") {
      run(
        detail,
        {
          opacity: [0, 1],
          scale: [0.94, 1],
          filter: ["blur(6px)", "blur(0px)"],
        },
        { duration: 0.5, delay: 0.04 }
      );
      run(
        rank,
        {
          opacity: [0, 1],
          scale: [0.92, 1],
          filter: ["blur(7px)", "blur(0px)"],
        },
        { duration: 0.52, delay: 0.12 }
      );
      run(
        prize,
        {
          opacity: [0, 1],
          scale: [0.9, 1],
          filter: ["blur(6px)", "blur(0px)"],
        },
        { duration: 0.55, delay: 0.2 }
      );
      run(footer, { opacity: [0, 1], scale: [0.97, 1] }, { duration: 0.4, delay: 0.34 });
    } else if (animId === "aperture") {
      if (ring) {
        run(
          ring,
          {
            opacity: [0, 0.55, 0],
            scale: [0.35, 1.35, 1.7],
          },
          { duration: 0.72, delay: 0 }
        );
      }
      run(detail, { opacity: [0, 1], y: [8, 0] }, { duration: 0.38, delay: 0.18 });
      run(rank, { opacity: [0, 1], y: [6, 0] }, { duration: 0.4, delay: 0.26 });
      run(
        prize,
        { opacity: [0, 1], y: [8, 0], scale: [0.97, 1] },
        { duration: 0.42, delay: 0.34 }
      );
      run(footer, { opacity: [0, 1], y: [6, 0] }, { duration: 0.34, delay: 0.46 });
    } else if (animId === "gilt") {
      run(detail, { opacity: [0, 1], y: [8, 0] }, { duration: 0.38, delay: 0.04 });
      run(rank, { opacity: [0, 1], y: [6, 0] }, { duration: 0.38, delay: 0.12 });
      run(
        prize,
        {
          opacity: [0, 1],
          y: [10, 0],
          scale: [0.96, 1],
          filter: [
            "brightness(1)",
            "brightness(1.22)",
            "brightness(1)",
          ],
        },
        { duration: 0.7, delay: 0.18 }
      );
      run(footer, { opacity: [0, 1], y: [6, 0] }, { duration: 0.36, delay: 0.4 });
    } else if (animId === "stagger") {
      run(detail, { opacity: [0, 1], y: [12, 0] }, { duration: 0.34, delay: 0.05 });
      run(rank, { opacity: [0, 1], y: [8, 0] }, { duration: 0.36, delay: 0.13 });
      run(
        prize,
        { opacity: [0, 1], y: [14, 0], scale: [0.96, 1] },
        { duration: 0.34, delay: 0.18 }
      );
      run(footer, { opacity: [0, 1], y: [10, 0] }, { duration: 0.34, delay: 0.28 });
    } else if (animId === "burst") {
      run(
        prize,
        { opacity: [0, 1], scale: [0.94, 1.02, 1] },
        { duration: 0.48, delay: 0.04 }
      );
      run(detail, { opacity: [0, 1], y: [8, 0] }, { duration: 0.34, delay: 0.16 });
      run(rank, { opacity: [0, 1], y: [6, 0] }, { duration: 0.34, delay: 0.24 });
      run(footer, { opacity: [0, 1], y: [8, 0] }, { duration: 0.32, delay: 0.34 });
    } else if (animId === "rise") {
      run(detail, { opacity: [0, 1], y: [20, 0] }, { duration: 0.42, delay: 0.04 });
      run(rank, { opacity: [0, 1], y: [20, 0] }, { duration: 0.42, delay: 0.1 });
      run(prize, { opacity: [0, 1], y: [24, 0] }, { duration: 0.46, delay: 0.16 });
      run(footer, { opacity: [0, 1], y: [18, 0] }, { duration: 0.4, delay: 0.24 });
    } else {
      run(detail, { opacity: [0, 1] }, { duration: 0.45, delay: 0.05 });
      run(rank, { opacity: [0, 1] }, { duration: 0.45, delay: 0.12 });
      run(prize, { opacity: [0, 1] }, { duration: 0.5, delay: 0.18 });
      run(footer, { opacity: [0, 1] }, { duration: 0.45, delay: 0.26 });
    }

    const countStartAt =
      animId === "cinema" || animId === "depth"
        ? 260
        : animId === "soft"
          ? 280
          : animId === "lock" || animId === "press"
            ? 180
            : 220;
    timers.push(
      window.setTimeout(() => {
        const start = performance.now();
        const target = UNIT_EARN_OVERLAY_ANIM_SAMPLE.amount;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 900);
          const eased = 1 - (1 - t) * (1 - t);
          setAmount(Math.floor(target * eased));
          if (t < 1) requestAnimationFrame(tick);
          else {
            setAmount(target);
            setClaimReady(true);
          }
        };
        requestAnimationFrame(tick);
      }, countStartAt)
    );

    return () => {
      ctrls.forEach((c) => c.stop());
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [animId, playKey, reduceMotion]);

  return (
    <div
      data-anim-demo={`${animId}-${playKey}`}
      className="relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-sm bg-black/70 px-4 py-8"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.75)_100%)]" />
      <div
        data-d="flash"
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{ opacity: 0 }}
        aria-hidden
      />
      <div
        data-d="ring"
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100/35"
        style={{ opacity: 0 }}
        aria-hidden
      />
      <div className="relative z-[3] flex w-full max-w-[260px] flex-col items-center text-center">
        <div data-d="detail" style={{ opacity: 0 }}>
          <p
            className={[jp.className, "text-[16px] font-extrabold tracking-[0.08em] text-white/[0.94]"].join(" ")}
          >
            {title}
          </p>
          <p
            className={[jp.className, "mt-1.5 text-[13px] font-semibold text-[rgba(226,246,255,0.78)]"].join(" ")}
          >
            {subtitle}
          </p>
        </div>
        <p
          data-d="rank"
          className={[nameOxanium.className, "mt-3 text-[32px] font-extrabold text-[#cffafe]"].join(" ")}
          style={{ opacity: 0 }}
        >
          {rankText}
        </p>
        <div
          data-d="prize"
          className="mt-4 flex items-center gap-3"
          style={{ opacity: 0 }}
        >
          <Coin size={40} />
          <span
            className={[
              nameOxanium.className,
              "text-[48px] font-extrabold leading-none text-[#ffe9a8]",
            ].join(" ")}
          >
            <span className="text-[#f6c344]">+</span>
            {amount}
          </span>
        </div>

        <div data-d="footer" className="mt-7" style={{ opacity: 0 }}>
          <button
            type="button"
            disabled={!claimReady}
            className={[
              nameOxanium.className,
              "min-w-[160px] border px-7 py-3 text-[12px] font-extrabold uppercase tracking-[0.18em] transition",
              claimReady
                ? "border-cyan-300/90 bg-[#00f5ff] text-[#041018]"
                : "cursor-not-allowed border-cyan-300/25 bg-cyan-400/15 text-cyan-100/40 opacity-55",
            ].join(" ")}
          >
            {claimLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UnitEarnOverlayAnimPreviewPage() {
  const [isJa, setIsJa] = useState(true);
  const [plays, setPlays] = useState<Record<string, number>>({});

  const replay = useCallback((id: UnitEarnOverlayAnimId) => {
    setPlays((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }, []);

  return (
    <main className="min-h-screen bg-[#05080c] px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300/70">
            DEV PREVIEW
          </p>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight">
            Unit 獲得アニメ案
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-white/55">
            上段が上質枠（跳ね・フラッシュなし）。再生で比較。
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setIsJa(true)}
              className={[
                "rounded px-3 py-1.5 text-[12px] font-bold",
                isJa ? "bg-cyan-400 text-black" : "bg-white/10 text-white/70",
              ].join(" ")}
            >
              JA
            </button>
            <button
              type="button"
              onClick={() => setIsJa(false)}
              className={[
                "rounded px-3 py-1.5 text-[12px] font-bold",
                !isJa ? "bg-cyan-400 text-black" : "bg-white/10 text-white/70",
              ].join(" ")}
            >
              EN
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-6">
          {UNIT_EARN_OVERLAY_ANIM_VARIANTS.map((v) => (
            <section
              key={v.id}
              className={[
                "overflow-hidden rounded border bg-[#0a1218]",
                v.premium
                  ? "border-cyan-300/25 shadow-[0_0_20px_rgba(0,245,255,0.06)]"
                  : "border-white/10",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3 px-3 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-extrabold tracking-wide">
                      {isJa ? v.nameJa : v.nameEn}
                    </h2>
                    {v.premium ? (
                      <span className="rounded bg-cyan-400/15 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-100/85">
                        PREMIUM
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-white/50">
                    {isJa ? v.noteJa : v.noteEn}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => replay(v.id)}
                  className="shrink-0 rounded border border-cyan-300/40 bg-cyan-400/15 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-cyan-100"
                >
                  {isJa ? "再生" : "Replay"}
                </button>
              </div>
              <AnimDemo
                animId={v.id}
                playKey={plays[v.id] ?? 0}
                isJa={isJa}
              />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
