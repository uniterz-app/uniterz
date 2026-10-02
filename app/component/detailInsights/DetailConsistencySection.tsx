"use client";

import type { PlayerConsistencyInsight } from "@/lib/nba/detailInsights/detailInsightTypes";
import { volatilityLabel } from "@/lib/nba/detailInsights/buildPlayerDetailInsights";
import { DETAIL_CONSISTENCY_HINT } from "@/lib/nba/detailInsights/detailConsistencyCopy";
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { nameOxanium } from "@/lib/fonts";

const CELL_SKEW = { transform: "skewX(-6deg)" } as const;

type Props = {
  data: PlayerConsistencyInsight;
  accent: string;
  language?: string;
};

export function DetailConsistencySection({ data, accent, language }: Props) {
  const lang = resolveLocalizedLang(language);
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h2
          className={`${nameOxanium.className} text-[13px] font-bold uppercase tracking-[0.12em] text-white/70`}
        >
          CONSISTENCY
        </h2>
        <p
          className={`${nameOxanium.className} text-[11px] font-semibold leading-snug text-white/40`}
        >
          {L(lang, DETAIL_CONSISTENCY_HINT)}
        </p>
      </div>
      <div
        className={`${nameOxanium.className} space-y-2 border bg-black/40 px-3 py-3 text-[14px] font-bold tabular-nums`}
        style={{ borderColor: `${accent}66` }}
      >
        {data.milestones.map((m) => (
          <div key={m.label} className="flex justify-between gap-2">
            <span className="inline-block text-white/50" style={CELL_SKEW}>
              {m.label}
            </span>
            <span className="inline-block text-white/90" style={CELL_SKEW}>
              {m.count}/{m.games} ({m.pct}%)
            </span>
          </div>
        ))}
        <div className="flex justify-between gap-2 border-t border-white/10 pt-2">
          <span className="inline-block text-white/50" style={CELL_SKEW}>
            L10 PTS
          </span>
          <span className="inline-block text-white/90" style={CELL_SKEW}>
            LOW {data.last10PtsMin} · HIGH {data.last10PtsMax} ·{" "}
            {volatilityLabel(data.volatility)}
          </span>
        </div>
      </div>
    </section>
  );
}
