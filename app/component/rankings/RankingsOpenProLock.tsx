"use client";

/**
 * PRO LEAGUE の Pro ゲート表示。
 */

import Link from "next/link";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  language?: Language;
  subscribeHref?: string;
};

export default function RankingsOpenProLock({
  language = "ja",
  subscribeHref = "/mobile/pro/subscribe",
}: Props) {
  const m = t(language).rankings;

  return (
    <div className="mx-1 rounded-sm border border-cyan-400/30 bg-gradient-to-b from-cyan-500/10 to-black/60 px-4 py-8 text-center">
      <p className="text-[10px] font-bold tracking-[0.2em] text-cyan-300/80">
        PRO ONLY
      </p>
      <h2 className="mt-2 text-lg font-bold tracking-wide text-white">
        {m.divisionOpenTitle ?? "PRO LEAGUE"}
      </h2>
      <p className="mt-2 text-[13px] leading-5 text-white/65">
        {m.divisionOpenLockBody ??
          "全試合の成績で競う Pro 限定ランキングです。参加・閲覧には Pro プランが必要です。"}
      </p>
      <Link
        href={subscribeHref}
        className="mt-5 inline-flex items-center justify-center rounded-sm bg-cyan-400 px-4 py-2.5 text-[12px] font-bold tracking-wide text-[#050508]"
      >
        {m.divisionOpenCta ?? "Pro を見る"}
      </Link>
    </div>
  );
}
