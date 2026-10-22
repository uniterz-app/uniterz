"use client";

import TeamAbbrBadge from "@/app/component/games/TeamAbbrBadge";
import { nameOxanium } from "@/lib/fonts";
import {
  resolveSeasonAwardsMinePick,
  type SeasonAwardsMarketSnapshot,
  type SeasonAwardsMinePick,
} from "@/lib/predict/seasonPredictMarket";
import { nbaTeamIdFromBracketCode } from "@/lib/nba-bracket-code";
import {
  awardName,
  type NbaAwardCandidate,
  type NbaSeasonAwardsPrediction,
} from "@/lib/predict/nbaSeasonAwardsPredict";
import {
  seasonPredictAwardsMarketHint,
  seasonPredictSubmissionCountLabel,
  seasonPredictYourAwardPickLabel,
  seasonPredictYourAwardPickMissing,
  type SeasonPredictUiLang,
} from "@/lib/predict/seasonPredictUiCopy";

type Props = {
  market: SeasonAwardsMarketSnapshot;
  className?: string;
  language?: SeasonPredictUiLang;
  /** 取得済みの自分の提出。null の prediction は未提出 */
  mine?: {
    prediction: NbaSeasonAwardsPrediction | null;
    candidates?: readonly NbaAwardCandidate[];
  } | null;
};

/** 締切後・アワード予想マーケット（賞ごと Top5） */
function YourPickRow({
  pick,
  label,
}: {
  pick: SeasonAwardsMinePick;
  label: string;
}) {
  const teamId = pick.teamAbbr ? nbaTeamIdFromBracketCode(pick.teamAbbr) : null;
  return (
    <div className="mb-1.5 flex items-center gap-2 border border-cyan-300/40 bg-cyan-300/[0.08] px-2.5 py-1.5">
      <span
        className={[
          nameOxanium.className,
          "shrink-0 text-[9px] font-extrabold uppercase tracking-[0.12em] text-cyan-200",
        ].join(" ")}
      >
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-white/95">
        {pick.name}
      </span>
      {pick.teamAbbr ? (
        <TeamAbbrBadge abbr={pick.teamAbbr} teamId={teamId ?? undefined} />
      ) : null}
    </div>
  );
}

export default function NbaSeasonAwardsMarketPanel({
  market,
  className,
  language = "ja",
  mine,
}: Props) {
  const youLabel = seasonPredictYourAwardPickLabel(language);
  const showMissing = mine != null && mine.prediction == null;
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
        </div>
        <p className="flex items-baseline gap-1.5">
          <span
            className={[
              nameOxanium.className,
              "text-[28px] font-black leading-none tabular-nums text-amber-200/95",
            ].join(" ")}
          >
            {market.submissionCount.toLocaleString()}
          </span>
          <span
            className={[
              nameOxanium.className,
              "text-[12px] font-bold tracking-[0.04em] text-white/60",
            ].join(" ")}
          >
            {seasonPredictSubmissionCountLabel(language)}
          </span>
        </p>
        <p className="text-[11px] leading-relaxed text-white/45">
          {seasonPredictAwardsMarketHint(language)}
        </p>
        {showMissing ? (
          <p className="text-[11px] leading-relaxed text-cyan-200/80">
            {seasonPredictYourAwardPickMissing(language)}
          </p>
        ) : null}
      </header>

      <div className="space-y-4">
        {market.awards.map((block) => {
          const minePick = mine?.prediction
            ? resolveSeasonAwardsMinePick(
                block.awardId,
                block.top,
                mine.prediction,
                mine.candidates ?? []
              )
            : null;
          return (
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
            {minePick ? <YourPickRow pick={minePick} label={youLabel} /> : null}
            <ol className="space-y-1.5">
              {block.top.map((row, i) => {
                const teamId = row.teamAbbr
                  ? nbaTeamIdFromBracketCode(row.teamAbbr)
                  : null;
                const isMine = minePick?.candidateId === row.candidateId;
                return (
                  <li
                    key={`${block.awardId}-${row.candidateId}`}
                    className={[
                      "flex items-center gap-2 border px-2.5 py-1.5",
                      isMine
                        ? "border-cyan-300/45 bg-cyan-300/[0.06]"
                        : "border-white/10 bg-white/[0.02]",
                    ].join(" ")}
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
          );
        })}
      </div>
    </section>
  );
}
