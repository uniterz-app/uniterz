"use client";

/** PRO LEAGUE ランキング行カードのすぐ下に出すひとこと吹き出し（カードの外・国旗の列に揃える） */
import { jp } from "@/lib/fonts";

/** 行の国旗の左端に合わせる（DailyScoreRankRow / CyberRankingListRow の左列幅） */
const ALIGN_CLASS = {
  daily: "pl-[101px]",
  list: "pl-[132px] sm:pl-[150px]",
  listCompact: "pl-[102px]",
} as const;

export type RankingRowCommentAlign = keyof typeof ALIGN_CLASS;

export default function RankingRowComment({
  comment,
  align,
}: {
  comment?: string | null;
  align: RankingRowCommentAlign;
}) {
  const text = comment?.trim();
  if (!text) return null;
  return (
    <div className={`${ALIGN_CLASS[align]} mb-2 mt-1.5 pr-3`}>
      <p
        className={`${jp.className} relative inline-block max-w-full rounded-lg border border-[#00F5FF]/30 bg-[#0B1216] px-2.5 py-1 text-[11px] leading-4 text-white/85`}
      >
        <span
          aria-hidden
          className="absolute -top-[4.5px] left-2.5 h-2 w-2 rotate-45 border-l border-t border-[#00F5FF]/30 bg-[#0B1216]"
        />
        <span className="relative block truncate">{text}</span>
      </p>
    </div>
  );
}
