"use client";

/**
 * NBA ランキングの通常 / 無差別級切替。
 * CyberSlantedTab は凍結対象のため、ここでは単純なセグメント UI を使う。
 */

import type { RankingDivision } from "@/lib/rankings/rankingDivision";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  division: RankingDivision;
  onChange: (next: RankingDivision) => void;
  language?: Language;
};

export default function RankingsDivisionTabs({
  division,
  onChange,
  language = "ja",
}: Props) {
  const m = t(language).rankings;
  const items: Array<{ id: RankingDivision; label: string }> = [
    {
      id: "standard",
      label: m.divisionStandard ?? "Standard",
    },
    {
      id: "open",
      label: m.divisionOpen ?? "PRO LEAGUE",
    },
  ];

  return (
    <div
      className="flex w-full gap-1 rounded-sm border border-cyan-400/25 bg-black/40 p-0.5"
      role="tablist"
      aria-label={m.divisionTabsLabel ?? "Ranking division"}
    >
      {items.map((item) => {
        const active = division === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={
              active
                ? "flex-1 rounded-sm bg-cyan-400 px-2 py-1.5 text-center text-[11px] font-bold tracking-wide text-[#050508]"
                : "flex-1 rounded-sm px-2 py-1.5 text-center text-[11px] font-semibold tracking-wide text-cyan-300/80"
            }
          >
            {item.label}
            {item.id === "open" ? (
              <span className="ml-1 text-[9px] font-bold opacity-80">PRO</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
