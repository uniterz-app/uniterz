"use client";

import {
  NBA_SEASON_AWARD_DEFS,
  awardCandidateLabel,
  type NbaAwardCandidate,
  type NbaSeasonAwardsPrediction,
} from "@/lib/predict/nbaSeasonAwardsPredict";
import {
  AWARDS_PREVIEW_COACHES,
  AWARDS_PREVIEW_PLAYERS,
} from "@/lib/predict/nbaSeasonAwardsPreviewMocks";
import { nameOxanium } from "@/lib/fonts";
import { nbaTeamIdFromBracketCode } from "@/lib/nba-bracket-code";
import {
  getTeamJerseyPrimaryColor,
  softenTeamUiColor,
} from "@/lib/team-colors";

type Props = {
  prediction: NbaSeasonAwardsPrediction;
  /** candidateId → 公式受賞者（将来） */
  officialByAward?: Partial<Record<string, string | null>> | null;
  className?: string;
  catalog?: readonly NbaAwardCandidate[];
};

function resolveCandidate(
  id: string | null | undefined,
  catalog: readonly NbaAwardCandidate[]
): NbaAwardCandidate | null {
  if (!id) return null;
  return catalog.find((c) => c.id === id) ?? null;
}

function TeamAbbrBadge({ abbr }: { abbr: string }) {
  const teamId = nbaTeamIdFromBracketCode(abbr);
  const fill = teamId
    ? softenTeamUiColor(getTeamJerseyPrimaryColor("nba", teamId))
    : "#5B8CFF";

  return (
    <span
      className={[
        nameOxanium.className,
        "relative grid h-[22px] min-w-[2.35rem] shrink-0 place-items-center overflow-hidden px-2 text-[9px] font-black uppercase tracking-[0.08em]",
      ].join(" ")}
      style={{
        backgroundColor: fill,
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px, transparent 1px, transparent 3px)",
        color: "#050508",
        transform: "skewX(-14deg)",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)",
      }}
      aria-hidden
    >
      <span style={{ transform: "skewX(14deg)" }}>
        {abbr.slice(0, 3).toUpperCase()}
      </span>
    </span>
  );
}

/** 提出済みアワード予想 — YOUR AWARDS・1行レイアウト（単一カード） */
export default function NbaSeasonAwardsViewPanel({
  prediction,
  officialByAward = null,
  className,
  catalog,
}: Props) {
  const list =
    catalog ??
    ([...AWARDS_PREVIEW_PLAYERS, ...AWARDS_PREVIEW_COACHES] as NbaAwardCandidate[]);

  return (
    <div className={["relative w-full", className].filter(Boolean).join(" ")}>
      <header className="mb-3 text-center">
        <h2
          className={[
            nameOxanium.className,
            "text-[14px] font-extrabold uppercase tracking-[0.2em] text-white",
          ].join(" ")}
        >
          Your awards
        </h2>
        <p
          className={[
            nameOxanium.className,
            "mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35",
          ].join(" ")}
        >
          {prediction.season}
        </p>
      </header>

      <ul className="overflow-hidden rounded-[2px] border border-amber-300/20 bg-[rgba(4,9,16,0.97)]">
        {NBA_SEASON_AWARD_DEFS.map((def, index) => {
          const picked = resolveCandidate(prediction.picks[def.id], list);
          const officialId = officialByAward?.[def.id];
          const hit =
            officialId != null && officialId !== "" && picked
              ? officialId === picked.id
              : null;
          const isLast = index === NBA_SEASON_AWARD_DEFS.length - 1;

          return (
            <li
              key={def.id}
              className={[
                "flex items-center gap-2 px-2.5 py-[7px]",
                !isLast ? "border-b border-white/[0.06]" : "",
              ].join(" ")}
            >
              <span
                className={[
                  nameOxanium.className,
                  "w-[3.25rem] shrink-0 text-[10px] font-extrabold uppercase tracking-[0.1em] text-amber-200/85",
                ].join(" ")}
              >
                {def.labelEn}
              </span>

              {picked ? (
                <>
                  <p
                    className={[
                      nameOxanium.className,
                      "min-w-0 flex-1 truncate text-[12px] font-extrabold uppercase tracking-[0.03em] text-white",
                    ].join(" ")}
                  >
                    {awardCandidateLabel(picked)}
                  </p>
                  {picked.teamAbbr ? (
                    <TeamAbbrBadge abbr={picked.teamAbbr} />
                  ) : (
                    <span className="h-[22px] w-[2.35rem] shrink-0" aria-hidden />
                  )}
                </>
              ) : (
                <span className="flex-1 text-[11px] text-white/30">—</span>
              )}

              {hit != null ? (
                <span
                  className={[
                    nameOxanium.className,
                    "shrink-0 text-[8px] font-extrabold uppercase tracking-[0.1em]",
                    hit ? "text-[#2DFF6E]/85" : "text-[#FF8AB4]/70",
                  ].join(" ")}
                >
                  {hit ? "HIT" : "MISS"}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
