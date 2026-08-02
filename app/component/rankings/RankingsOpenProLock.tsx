"use client";

/**
 * PRO LEAGUE の Pro ゲート表示。
 */

import Link from "next/link";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { PRO_LEAGUE_ATMOSPHERE } from "@/lib/rankings/proLeagueAtmosphere";

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
    <div
      className="mx-1 rounded-sm px-4 py-8 text-center"
      style={{
        border: `1px solid ${PRO_LEAGUE_ATMOSPHERE.panelBorder}`,
        background: `linear-gradient(180deg, rgba(192,132,252,0.14) 0%, rgba(8,5,15,0.85) 100%)`,
        boxShadow: PRO_LEAGUE_ATMOSPHERE.panelGlow,
      }}
    >
      <p
        className="text-[10px] font-bold tracking-[0.2em]"
        style={{ color: PRO_LEAGUE_ATMOSPHERE.gold }}
      >
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
        className="mt-5 inline-flex items-center justify-center rounded-sm px-4 py-2.5 text-[12px] font-bold tracking-wide"
        style={{
          backgroundColor: PRO_LEAGUE_ATMOSPHERE.gold,
          color: PRO_LEAGUE_ATMOSPHERE.ink,
        }}
      >
        {m.divisionOpenCta ?? "Pro を見る"}
      </Link>
    </div>
  );
}
