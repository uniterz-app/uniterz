"use client";

import { useMemo, useState } from "react";
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
import { getTeamJerseyPrimaryColor } from "@/lib/team-colors";
import {
  seasonPredictPredictedRankBandsHeading,
  seasonPredictStandingsBandLabel,
  seasonPredictStandingsMarketHint,
  seasonPredictSubmissionCountLabel,
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

function bandRankClass(band: Band): string {
  if (band === "straight") return "text-white";
  if (band === "playin") return "text-[#2DFF6E]";
  return "text-white/35";
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return `rgba(0,245,255,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
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
        {seasonPredictPredictedRankBandsHeading(language)}
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
            className="border border-white/8 bg-black/40 px-1 py-1.5 text-center"
          >
            <p
              className={[
                nameOxanium.className,
                "text-[9px] font-bold uppercase tracking-[0.06em] text-white/40",
              ].join(" ")}
            >
              {seasonPredictStandingsBandLabel(language, b)}
            </p>
            <p
              className={[
                nameOxanium.className,
                "mt-0.5 text-[16px] font-extrabold tabular-nums text-white/90",
              ].join(" ")}
            >
              {b.pct.toFixed(0)}
              <span className="text-[10px] text-white/40">%</span>
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
  isLast,
}: {
  row: SeasonStandingsCrowdBoardRow;
  expanded: boolean;
  onToggle: () => void;
  language?: SeasonPredictUiLang;
  isLast: boolean;
}) {
  const band = bandForRank(row.boardRank);
  const primary = getTeamJerseyPrimaryColor("nba", row.teamId);
  const name = (
    getNbaTeamNicknameById(row.teamId) ?? row.teamId
  ).toUpperCase();

  return (
    <li className={!isLast ? "border-b border-white/[0.06]" : ""}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="grid w-full grid-cols-[36px_minmax(0,1fr)] text-left transition hover:bg-white/[0.03] active:bg-white/[0.05]"
      >
        <span className="flex items-center justify-center border-r border-white/[0.1] py-2">
          <span
            className={[
              nameOxanium.className,
              "text-[12px] font-black tabular-nums tracking-wide",
              bandRankClass(band),
            ].join(" ")}
          >
            {row.boardRank}
          </span>
        </span>
        <span
          className="flex min-w-0 items-center gap-2 px-2 py-2"
          style={{
            background: `linear-gradient(90deg, ${hexToRgba(primary, 0.38)} 0%, ${hexToRgba(primary, 0.18)} 45%, rgba(0,0,0,0) 100%)`,
          }}
        >
          <span
            className={[
              nameOxanium.className,
              "min-w-0 flex-1 truncate text-[12px] font-extrabold uppercase tracking-[0.02em] text-white",
            ].join(" ")}
            style={{ transform: "skewX(-6deg)" }}
          >
            {name}
          </span>
          <span
            className={[
              nameOxanium.className,
              "shrink-0 text-[10px] font-bold uppercase tabular-nums tracking-[0.06em] text-white/45",
            ].join(" ")}
          >
            avg {row.avgRank.toFixed(1)}
          </span>
          <span
            className={[
              nameOxanium.className,
              "shrink-0 text-[10px] font-extrabold tracking-[0.1em] text-cyan-300/60",
            ].join(" ")}
          >
            {expanded ? "▲" : "▼"}
          </span>
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
        </div>
        <p className="flex items-baseline gap-1.5">
          <span
            className={[
              nameOxanium.className,
              "text-[28px] font-black leading-none tabular-nums text-cyan-200",
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

      <ol className="overflow-hidden rounded-[2px] border border-cyan-300/20 bg-black">
        {board.map((row, i) => (
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
            isLast={i === board.length - 1}
          />
        ))}
      </ol>
    </section>
  );
}
