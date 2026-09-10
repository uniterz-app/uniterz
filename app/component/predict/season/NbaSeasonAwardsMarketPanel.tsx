"use client";

import TeamAbbrBadge from "@/app/component/games/TeamAbbrBadge";
import { nameOxanium } from "@/lib/fonts";
import type { SeasonAwardsMarketSnapshot } from "@/lib/predict/seasonPredictMarket";
import { nbaTeamIdFromBracketCode } from "@/lib/nba-bracket-code";
import { awardName } from "@/lib/predict/nbaSeasonAwardsPredict";
import {
  seasonPredictAwardsMarketHint,
  type SeasonPredictUiLang,
} from "@/lib/predict/seasonPredictUiCopy";

type Props = {
  market: SeasonAwardsMarketSnapshot;
  className?: string;
  language?: SeasonPredictUiLang;
};

/** 締切後・アワード予想マーケット（賞ごと Top5） */
export default function NbaSeasonAwardsMarketPanel({
  market,
  className,
  language = "ja",
}: Props) {
  return (
    <section
      className={[
        "rounded-[2px] border border-amber-300/25 bg-[rgba(6,10,16,0.96)] p-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="mb-3 space-y-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            className={[
              nameOxanium.className,
              "text-[13px] font-extrabold uppercase tracking-[0.14em] text-amber-200/90",
            ].join(" ")}
          >
            Awards market · {market.season}
          </h2>
          <p
            className={[
              nameOxanium.className,
              "text-[9px] font-bold uppercase tracking-[0.12em] text-white/40",
            ].join(" ")}
          >
            {market.submissionCount.toLocaleString()} submissions
          </p>
        </div>
        <p className="text-[11px] leading-relaxed text-white/45">
          {seasonPredictAwardsMarketHint(language)}
        </p>
      </header>

      <div className="space-y-4">
        {market.awards.map((block) => (
          <div key={block.awardId}>
            <div className="mb-1.5 flex items-baseline gap-2">
              <span
                className={[
                  nameOxanium.className,
                  "text-[11px] font-extrabold uppercase tracking-[0.12em] text-amber-200/85",
                ].join(" ")}
              >
                {block.labelEn}
              </span>
              <span className="text-[10px] text-white/35">
                {awardName(language, block)}
              </span>
            </div>
            <ol className="space-y-1.5">
              {block.top.map((row, i) => {
                const teamId = row.teamAbbr
                  ? nbaTeamIdFromBracketCode(row.teamAbbr)
                  : null;
                return (
                  <li
                    key={`${block.awardId}-${row.candidateId}`}
                    className="flex items-center gap-2 border border-white/10 bg-white/[0.02] px-2.5 py-1.5"
                  >
                    <span
                      className={[
                        nameOxanium.className,
                        "w-4 shrink-0 text-[10px] font-extrabold tabular-nums text-white/35",
                      ].join(" ")}
                    >
                      {i + 1}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className="truncate text-[12px] font-semibold text-white/90">
                        {row.name}
                      </span>
                      {row.teamAbbr ? (
                        <TeamAbbrBadge
                          abbr={row.teamAbbr}
                          teamId={teamId ?? undefined}
                          size="sm"
                        />
                      ) : null}
                    </div>
                    <span
                      className={[
                        nameOxanium.className,
                        "shrink-0 text-[12px] font-extrabold tabular-nums text-amber-100/90",
                      ].join(" ")}
                    >
                      {row.pct.toFixed(1)}%
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
