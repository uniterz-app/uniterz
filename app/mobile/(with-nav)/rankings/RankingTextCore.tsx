"use client";

import Link from "next/link";
import type { RankingRow } from "@/lib/rankings/types";

export default function RankingTextCore({
  rows,
  metricLabel,
}: {
  rows: RankingRow[];
  metricLabel: string;
}) {
  if (!rows.length) return null;

  const top = rows[0];
  const rest = rows.slice(1, 5);

  return (
    <div className="min-h-screen bg-[#020b10] px-5 pt-10 pb-24 text-white">

      {/* ===== HEADER ===== */}
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.3em] text-white/40">
          RANKING CORE
        </div>
        <div className="text-sm text-white/70">
          NBA / WEEK
        </div>
      </div>

      {/* ===== TOP ===== */}
      <div className="mb-14 text-center">
        <div className="text-[11px] text-white/40 mb-2">
          #{1}
        </div>

        <div className="text-[44px] font-semibold leading-none text-cyan-300">
          {Math.round((top.winRate ?? 0) * 100)}
        </div>

        <div className="mt-1 text-[10px] tracking-widest text-white/40">
          {metricLabel.toUpperCase()}
        </div>

        <div className="mt-3 text-sm text-white/80">
          {top.displayName}
        </div>
      </div>

      {/* ===== DIVIDER ===== */}
      <div className="h-px bg-white/10 mb-8" />

      {/* ===== LIST ===== */}
      <div className="space-y-4">
        {rest.map((r, i) => (
          <Link
            key={r.uid}
            href={`/mobile/u/${r.handle}`}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-white/30">
                #{i + 2}
              </span>
              <span className="text-[13px] text-white/80">
                {r.displayName}
              </span>
            </div>

            <span className="text-[15px] font-medium text-cyan-300">
              {Math.round((r.winRate ?? 0) * 100)}
            </span>
          </Link>
        ))}
      </div>

    </div>
  );
}
