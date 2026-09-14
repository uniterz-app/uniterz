"use client";

/**
 * 連勝枠の光 — ランキング1位エッジ光 vs 現行 My Rank conic sweep の比較プレビュー。
 * /dev/streak-frame-preview · /mobile/streak-frame-preview
 */
import { useMemo, useState } from "react";
import { CyberRankingListRow } from "@/app/component/rankings/CyberRankingListParts";
import { RankFirstBorderEdgeScan } from "@/app/component/rankings/RankFirstBorderEdgeScan";
import { nameOxanium } from "@/lib/fonts";
import { RANK_FIRST_EDGE_DIM_BORDER } from "@/lib/rankings/rankFirstBorderEdgeScan";

type FxMode = "none" | "conic" | "edge";

function DemoCard({
  label,
  note,
  streak,
  fx,
}: {
  label: string;
  note: string;
  streak: number;
  fx: FxMode;
}) {
  return (
    <section className="space-y-2">
      <div>
        <p
          className={[
            nameOxanium.className,
            "text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/80",
          ].join(" ")}
        >
          {label}
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-white/45">{note}</p>
      </div>
      <div
        className="relative overflow-hidden rounded-sm"
        style={{
          border: `1px solid ${
            fx === "edge" ? RANK_FIRST_EDGE_DIM_BORDER : "rgba(255,255,255,0.12)"
          }`,
          background:
            "linear-gradient(165deg, rgba(12,16,22,0.98), rgba(5,8,12,1))",
          minHeight: 88,
        }}
      >
        {fx === "conic" ? (
          <div
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden result-card-streak-sweep"
            aria-hidden
          >
            <div className="result-card-streak-sweep__spin" />
          </div>
        ) : null}
        {fx === "edge" ? <RankFirstBorderEdgeScan /> : null}

        <div className="relative z-10 flex items-center gap-3 px-3.5 py-3.5">
          <div
            className={[
              nameOxanium.className,
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border text-[13px] font-extrabold tabular-nums",
            ].join(" ")}
            style={{
              borderColor:
                streak >= 5
                  ? "rgba(0,245,255,0.45)"
                  : "rgba(255,255,255,0.18)",
              color: streak >= 5 ? "#67e8f9" : "rgba(255,255,255,0.7)",
              background:
                streak >= 5
                  ? "rgba(0,245,255,0.08)"
                  : "rgba(255,255,255,0.04)",
            }}
          >
            {streak}W
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={[
                nameOxanium.className,
                "text-[10px] font-bold uppercase tracking-[0.14em] text-white/40",
              ].join(" ")}
            >
              Win streak · demo
            </p>
            <p
              className={[
                nameOxanium.className,
                "mt-0.5 text-[15px] font-extrabold uppercase tracking-[0.08em] text-white",
              ].join(" ")}
            >
              {streak >= 5 ? "Hot run" : streak >= 3 ? "Building" : "Quiet"}
            </p>
          </div>
          <p
            className={[
              nameOxanium.className,
              "shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-white/35",
            ].join(" ")}
          >
            fx: {fx}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function StreakFramePreviewPage() {
  const [streak, setStreak] = useState(5);
  const edgeOn = streak >= 5;
  const conicOn = streak >= 3;

  const steps = useMemo(() => [0, 3, 4, 5, 6, 7, 10], []);

  return (
    <div className="min-h-screen bg-[#050508] px-4 py-6 text-white">
      <div className="mx-auto max-w-lg space-y-6">
        <header className="space-y-2">
          <h1
            className={[
              nameOxanium.className,
              "text-sm font-extrabold uppercase tracking-[0.16em]",
            ].join(" ")}
          >
            Streak frame FX preview
          </h1>
          <p className="text-[13px] leading-relaxed text-white/55">
            採用案 B: リザルト連勝枠は conic スイープ。7連勝から光、10で金。
          </p>
        </header>

        <div className="flex flex-wrap gap-1.5">
          {steps.map((n) => {
            const on = n === streak;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setStreak(n)}
                className={[
                  nameOxanium.className,
                  "rounded-md border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition",
                  on
                    ? "border-cyan-400/55 bg-cyan-400/14 text-cyan-100"
                    : "border-white/12 bg-white/4 text-white/55 hover:border-white/25",
                ].join(" ")}
              >
                {n}W
              </button>
            );
          })}
        </div>

        <DemoCard
          label="A · Reference — Rank #1 edge"
          note="ランキングリスト1位の枠光（RankFirstBorderEdgeScan）"
          streak={streak}
          fx="edge"
        />

        <section className="space-y-2">
          <p
            className={[
              nameOxanium.className,
              "text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/80",
            ].join(" ")}
          >
            A2 · Real list row #1
          </p>
          <div className="overflow-hidden rounded-sm border border-white/10 bg-black/40">
            <CyberRankingListRow
              rank={1}
              displayName="ACE PLAYER"
              metric="streak"
              metricTag="STREAK"
              scoreSlot={
                <span
                  className={[
                    nameOxanium.className,
                    "text-[22px] font-extrabold tabular-nums text-[#FFD65A]",
                  ].join(" ")}
                >
                  {Math.max(streak, 1)}
                </span>
              }
              showFirstPlaceFrame
              compact
            />
          </div>
        </section>

        <DemoCard
          label="B · Current — My Rank conic sweep"
          note={`いまの My Rank（STREAK_SWEEP_MIN=3）。${conicOn ? "ON" : "OFF"} @ ${streak}W`}
          streak={streak}
          fx={conicOn ? "conic" : "none"}
        />

        <DemoCard
          label="C · Proposed — edge from 5W"
          note={`1位と同じエッジ光を 5連勝〜。${edgeOn ? "ON" : "OFF"} @ ${streak}W`}
          streak={streak}
          fx={edgeOn ? "edge" : "none"}
        />

        <DemoCard
          label="D · Hybrid idea — conic 3–4 / edge 5+"
          note={
            streak >= 5
              ? "5+: edge（格上げ）"
              : streak >= 3
                ? "3–4: conic（現行）"
                : "0–2: なし"
          }
          streak={streak}
          fx={streak >= 5 ? "edge" : streak >= 3 ? "conic" : "none"}
        />

        <footer className="rounded-sm border border-white/10 bg-white/[0.03] px-3.5 py-3 text-[12px] leading-relaxed text-white/50">
          <p className="font-semibold text-white/70">所見</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4">
            <li>
              5連勝スタートは既存 Result の platinum 帯（5–6）と揃って分かりやすい。
            </li>
            <li>
              My Rank はすでに 3W から conic があるので、5W でもう一本同じ系を足すと
              うるさい。5+ で edge に切り替える D 案が一番きれい。
            </li>
            <li>
              リスト行の「連勝メトリク」全体に毎行走らせると1位特権が薄まるので、
              まずは My Rank / 自分の連勝カードに限定が安全。
            </li>
          </ul>
        </footer>
      </div>
    </div>
  );
}
