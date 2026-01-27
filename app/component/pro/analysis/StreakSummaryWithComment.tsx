// app/component/pro/analysis/StreakSummaryCard.tsx
"use client";

import { Flame, CloudRain } from "lucide-react";
import { Alfa_Slab_One } from "next/font/google";
import { useEffect, useRef, useState } from "react";

const alfa = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
});

type Props = {
  maxWinStreak: number;
  maxLoseStreak: number;
  periodLabel?: string;
  lastMaxWinStreak?: number;
  lastMaxLoseStreak?: number;
};

function buildComment(maxWin: number, maxLose: number): string {
  if (maxWin >= 6 && maxWin > maxLose) {
    return "大きな連勝を作れた月。流れと市場判断が噛み合い、精度の高い選択が続きました。";
  }
  if (maxLose >= 6 && maxLose > maxWin) {
    return "連敗が目立った月。流れを外した後の修正が遅れ、判断が噛み合わない場面が続きました。";
  }
  if (maxWin >= 4 && maxLose >= 4) {
    return "連勝と連敗を繰り返した波の大きい月。ハマる場面と外す場面がはっきり分かれました。";
  }
  if (maxWin >= 3 && maxLose <= 2) {
    return "大きく崩れず安定した月。無理をしない判断で、堅実な推移を維持できています。";
  }
  if (maxWin <= 2 && maxLose <= 2) {
    return "目立った連勝・連敗のない静かな月。慎重なスタンスで様子を見る判断が中心でした。";
  }
  return "大きな波はなく平均的な月。安定感はあるため、勝負所の見極めが次の課題です。";
}

export default function StreakSummaryCard({
  maxWinStreak,
  maxLoseStreak,
  periodLabel,
  lastMaxWinStreak,
  lastMaxLoseStreak,
}: Props) {
  const comment = buildComment(maxWinStreak, maxLoseStreak);

  return (
    <div className="rounded-2xl bg-[#050814]/80 p-3 border border-white/10 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
      {/* タイトル */}
      <div className="mb-2 text-[11px] text-white/60">
        {periodLabel ? `${periodLabel} の連勝 / 連敗` : "今月の連勝 / 連敗"}
      </div>

      {/* 数値 */}
      <div className="grid grid-cols-2 gap-2">
        {/* 最大連勝 */}
        <div className="rounded-xl bg-[#050814]/60 p-3 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-black/60 flex items-center justify-center ring-1 ring-white/10">
              <Flame className="h-3.5 w-3.5 text-yellow-400" />
            </div>
            <div className="text-xs text-white/70">最大連勝</div>
          </div>

          <div
            className={[
              alfa.className,
              "mt-2 text-3xl tabular-nums text-yellow-400",
            ].join(" ")}
          >
            {maxWinStreak}
          </div>

          {lastMaxWinStreak !== undefined && (
            <div className="mt-0.5 text-[11px] text-white/45">
              先月 {lastMaxWinStreak}
            </div>
          )}
        </div>

        {/* 最大連敗 */}
        <div className="rounded-xl bg-[#050814]/60 p-3 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-black/60 flex items-center justify-center ring-1 ring-white/10">
              <CloudRain className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <div className="text-xs text-white/70">最大連敗</div>
          </div>

          <div
            className={[
              alfa.className,
              "mt-2 text-3xl tabular-nums text-rose-500",
            ].join(" ")}
          >
            {maxLoseStreak}
          </div>

          {lastMaxLoseStreak !== undefined && (
            <div className="mt-0.5 text-[11px] text-white/45">
              先月 {lastMaxLoseStreak}
            </div>
          )}
        </div>
      </div>

      {/* コメント */}
      <div className="mt-2 rounded-xl bg-white/5 border border-white/10 p-2">
        <p className="text-xs leading-relaxed text-white/75">{comment}</p>
      </div>
    </div>
  );
}
