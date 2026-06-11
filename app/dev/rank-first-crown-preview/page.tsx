"use client";

/**
 * /dev/rank-first-crown-preview
 * 1位マーク — 王冠の代替案プレビュー（本番未接続）
 */

import { nameBebas, nameOxanium } from "@/lib/fonts";
import { RankFirstBorderEdgeScan } from "@/app/component/rankings/RankFirstBorderEdgeScan";
import {
  RANK_FIRST_MARK_LABELS,
  RankFirstMarkSlot,
  RankFirstPlaceMark,
  type RankFirstMarkVariant,
} from "@/app/component/rankings/RankFirstPlaceMark";

const BG = "#06080F";
const CYAN = "#00F5FF";

const VARIANTS: RankFirstMarkVariant[] = [
  "crown-current",
  "no1-badge",
  "hex-medal",
  "chevron-stack",
  "diamond-crown",
  "hud-wings",
];

function MockRankColumn({ variant }: { variant: RankFirstMarkVariant }) {
  return (
    <div className="relative w-[58px] shrink-0 pt-1">
      <RankFirstMarkSlot variant={variant} />
      <span
        className={[nameBebas.className, "block tabular-nums leading-none"].join(" ")}
        style={{
          fontSize: "2.55rem",
          transform: "skewX(-12deg)",
          display: "inline-block",
          color: "#FFFBEB",
          WebkitTextStroke: "1.2px #F59E0B",
          paintOrder: "stroke fill",
          filter:
            "drop-shadow(0 0 12px rgba(251,191,36,0.82)) drop-shadow(0 0 24px rgba(255,214,90,0.38))",
        }}
      >
        01
      </span>
    </div>
  );
}

function MockFirstRow({ variant }: { variant: RankFirstMarkVariant }) {
  return (
    <article
      className="relative flex min-h-[72px] items-stretch overflow-hidden"
      style={{
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 42%, rgba(0,0,0,0.12) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <RankFirstBorderEdgeScan />
      <span
        aria-hidden
        className="relative z-10 w-[3px] shrink-0"
        style={{
          background: "#FFD65A",
          boxShadow: "0 0 12px rgba(255,214,90,0.72)",
        }}
      />
      <div className="relative z-10 flex flex-1 items-center gap-3 px-3 py-2.5">
        <MockRankColumn variant={variant} />
        <div
          className="h-11 w-11 shrink-0 rounded-sm"
          style={{
            border: "1px solid rgba(184,255,60,0.55)",
            background: "rgba(255,255,255,0.06)",
            boxShadow: "0 0 12px rgba(184,255,60,0.2)",
          }}
        />
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-sm font-bold uppercase tracking-wider"
            style={{ color: CYAN, textShadow: "0 0 12px rgba(0,245,255,0.35)" }}
          >
            CHAMPION
          </div>
          <div className="mt-2 flex max-w-[168px] gap-[3px]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-[5px] flex-1 rounded-[1px]"
                style={{
                  background:
                    i < 9 ? "rgba(34,211,238,0.92)" : "rgba(255,255,255,0.07)",
                }}
              />
            ))}
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ color: "#FFD65A", textShadow: "0 0 10px rgba(255,214,90,0.55)" }}
          >
            9,984
          </div>
          <div
            className={[nameOxanium.className, "mt-1 text-[8px] font-bold tracking-[0.2em]"].join(
              " "
            )}
            style={{ color: "#FF2BD6" }}
          >
            PTS
          </div>
        </div>
      </div>
    </article>
  );
}

export default function RankFirstCrownPreviewPage() {
  return (
    <div
      className="min-h-svh px-3 py-8 text-white sm:px-6"
      style={{ background: BG }}
    >
      <div className="mx-auto max-w-lg space-y-8">
        <header className="space-y-2">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.28em]",
            ].join(" ")}
            style={{ color: "rgba(0,245,255,0.65)" }}
          >
            Dev Preview · Rank #1 Mark
          </p>
          <h1 className="text-lg font-black tracking-tight">
            1位マーク — 王冠の代替案
          </h1>
          <p className="text-xs leading-relaxed text-white/45">
            順位「01」の上に載る装飾。現状の Lucide 王冠 + サイバー HUD 風 5 案。
            本番未接続 — 気に入った案を選んでください。
          </p>
        </header>

        {/* マーク単体比較 */}
        <section className="space-y-3">
          <h2
            className={[nameOxanium.className, "text-[11px] font-bold uppercase tracking-[0.14em]"].join(
              " "
            )}
            style={{ color: CYAN }}
          >
            マーク単体
          </h2>
          <div
            className="grid grid-cols-3 gap-3 rounded-sm border border-white/10 bg-black/30 p-4 sm:grid-cols-6"
          >
            {VARIANTS.map((v) => (
              <div key={v} className="flex flex-col items-center gap-2">
                <RankFirstPlaceMark variant={v} />
                <span className="text-[9px] text-white/40">
                  {v === "crown-current" ? "現状" : v.replace("-", " ")}
                </span>
              </div>
            ))}
          </div>
        </section>

        {VARIANTS.map((v) => {
          const meta = RANK_FIRST_MARK_LABELS[v];
          return (
            <section key={v} className="space-y-2">
              <div>
                <h2
                  className={[nameOxanium.className, "text-[11px] font-bold uppercase tracking-[0.14em]"].join(
                    " "
                  )}
                  style={{ color: CYAN }}
                >
                  {meta.title}
                </h2>
                <p className="mt-0.5 text-[11px] text-white/45">{meta.subtitle}</p>
              </div>
              <div className="cyber-rank-list-panel overflow-hidden">
                <MockFirstRow variant={v} />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
