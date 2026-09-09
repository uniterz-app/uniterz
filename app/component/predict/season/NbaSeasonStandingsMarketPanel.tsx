"use client";

import { useMemo, useState } from "react";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";
import { getNbaTeamNicknameById } from "@/lib/nba-team-names";
import { nameOxanium } from "@/lib/fonts";
import {
  buildStandingsCrowdBoard,
  standingsDetailBandWidths,
  type SeasonStandingsCrowdBoardRow,
  type SeasonStandingsMarketSnapshot,
} from "@/lib/predict/seasonPredictMarket";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "@/lib/team-colors";
import {
  seasonPredictStandingsMarketHint,
  type SeasonPredictUiLang,
} from "@/lib/predict/seasonPredictUiCopy";

type Props = {
  market: SeasonStandingsMarketSnapshot;
  className?: string;
  language?: SeasonPredictUiLang;
};

type Band = "straight" | "playin" | "out";

function bandForRank(rank: number): Band {
  if (rank <= 6) return "straight";
  if (rank <= 10) return "playin";
  return "out";
}

function bandAccent(band: Band): { bar: string; rank: string } {
  if (band === "straight") return { bar: "#00E5FF", rank: "text-white" };
  if (band === "playin") return { bar: "#2DFF6E", rank: "text-[#2DFF6E]" };
  return { bar: "rgba(255,255,255,0.18)", rank: "text-white/35" };
}

function DetailBands({
  row,
  language = "ja",
}: {
  row: SeasonStandingsCrowdBoardRow;
  language?: SeasonPredictUiLang;
}) {
  const bands = standingsDetailBandWidths(row.detailBandPct);
  return (
    <div className="mt-2 space-y-1.5 border-t border-white/8 pt-2">
      <p
        className={[
          nameOxanium.className,
          "text-[8px] font-bold uppercase tracking-[0.12em] text-white/35",
        ].join(" ")}
      >
        Predicted rank bands
      </p>
      <div
        className="flex h-2 w-full overflow-hidden rounded-[1px] bg-white/5"
        aria-hidden
      >
        {bands.map((b) =>
          b.pct > 0 ? (
            <span
              key={b.id}
              style={{ width: `${b.pct}%`, backgroundColor: b.color }}
            />
          ) : null
        )}
      </div>
      <ul className="grid grid-cols-5 gap-1">
        {bands.map((b) => (
          <li
            key={b.id}
            className="border border-white/8 bg-black/40 px-1 py-1 text-center"
          >
            <p
              className={[
                nameOxanium.className,
                "text-[8px] font-bold uppercase tracking-[0.06em] text-white/40",
              ].join(" ")}
            >
              {language === "en" ? b.labelEn : b.labelJa}
            </p>
            <p
              className={[
                nameOxanium.className,
                "text-[11px] font-extrabold tabular-nums text-white/90",
              ].join(" ")}
            >
              {b.pct.toFixed(0)}
              <span className="text-[8px] text-white/40">%</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamListRow({
  row,
  expanded,
  onToggle,
  language = "ja",
}: {
  row: SeasonStandingsCrowdBoardRow;
  expanded: boolean;
  onToggle: () => void;
  language?: SeasonPredictUiLang;
}) {
  const band = bandForRank(row.boardRank);
  const accent = bandAccent(band);
  const name = (
    getNbaTeamNicknameById(row.teamId) ?? row.teamId
  ).toUpperCase();

  return (
    <li className="border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition hover:bg-white/[0.03] active:bg-white/[0.05]"
      >
        <span className="relative flex h-8 w-7 shrink-0 items-center justify-center">
          <span
            aria-hidden
            className="absolute bottom-0 left-0 top-0 w-[3px]"
            style={{ background: accent.bar }}
          />
          <span
            className={[
              nameOxanium.className,
              "text-[12px] font-black tabular-nums",
              accent.rank,
            ].join(" ")}
          >
            {row.boardRank}
          </span>
        </span>
        <HalftoneJerseyMark
          accent={getTeamJerseyPrimaryColor("nba", row.teamId)}
          accentEnd={getTeamJerseySecondaryColor("nba", row.teamId)}
          className="h-8 w-8 shrink-0"
          glow="none"
          density="coarse"
        />
        <div className="min-w-0 flex-1">
          <p
            className={[
              nameOxanium.className,
              "truncate text-[12px] font-extrabold uppercase tracking-[0.04em] text-white",
            ].join(" ")}
          >
            {name}
          </p>
          <p
            className={[
              nameOxanium.className,
              "text-[11px] font-bold uppercase tracking-[0.08em] text-white/45",
            ].join(" ")}
          >
            avg {row.avgRank.toFixed(1)} · tap for bands
          </p>
        </div>
        <span
          className={[
            nameOxanium.className,
            "shrink-0 text-[10px] font-extrabold tracking-[0.1em] text-cyan-300/60",
          ].join(" ")}
        >
          {expanded ? "▲" : "▼"}
        </span>
      </button>
      {expanded ? (
        <div className="px-2.5 pb-2.5">
          <DetailBands row={row} language={language} />
        </div>
      ) : null}
    </li>
  );
}

/** 締切後・順位マーケット — フル表 + 行タップで帯% */
export default function NbaSeasonStandingsMarketPanel({
  market,
  className,
  language = "ja",
}: Props) {
  const [conference, setConference] = useState<NbaConferenceId>("east");
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const teamRows = conference === "east" ? market.east : market.west;
  const board = useMemo(
    () => buildStandingsCrowdBoard(teamRows),
    [teamRows]
  );

  return (
    <section
      className={[
        "rounded-[2px] border border-cyan-300/20 bg-[rgba(6,10,16,0.96)] p-3",
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
              "text-[13px] font-extrabold uppercase tracking-[0.14em] text-cyan-200",
            ].join(" ")}
          >
            Standings market · {market.season}
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
          {seasonPredictStandingsMarketHint(language)}
        </p>
      </header>

      <div className="mb-3">
        <CyberSlantedTabBar fill aria-label="Conference">
          <CyberSlantedTab
            role="tab"
            label="EAST"
            active={conference === "east"}
            onClick={() => {
              setConference("east");
              setExpandedTeamId(null);
            }}
            compact
            fontWeight={900}
          />
          <CyberSlantedTab
            role="tab"
            label="WEST"
            active={conference === "west"}
            onClick={() => {
              setConference("west");
              setExpandedTeamId(null);
            }}
            compact
            fontWeight={900}
          />
        </CyberSlantedTabBar>
      </div>

      <ol className="space-y-1.5">
        {board.map((row) => (
          <TeamListRow
            key={row.teamId}
            row={row}
            expanded={expandedTeamId === row.teamId}
            onToggle={() =>
              setExpandedTeamId((cur) =>
                cur === row.teamId ? null : row.teamId
              )
            }
            language={language}
          />
        ))}
      </ol>
    </section>
  );
}
