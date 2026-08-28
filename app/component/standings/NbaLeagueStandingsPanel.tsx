"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { nameOxanium, nameBebas, resultStatsMetricNumClass } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import { getMobileTeamName } from "@/lib/team-name-split-mobile";
import { getTeamJerseyPrimaryColor } from "@/lib/team-colors";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import { formatStreakLabel } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import { teamStreakBadgeTheme } from "@/lib/predict/nbaTeamDetailForm";
import { useNbaConferenceStandings } from "@/lib/nba/useNbaConferenceStandings";
import {
  formatStandingsWl,
  formatStandingsWinPct,
  type NbaConferenceStandingsRow,
} from "@/lib/nba/nbaConferenceStandings";
import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";

type Props = {
  language?: "ja" | "en";
  onSelectTeam?: (teamId: string) => void;
};

const teamNameTy = matchCardTeamNameStyle(true);
const rankCellSkew = { transform: "skewX(-10deg)" } as const;
const metricCellSkew = { transform: "skewX(-6deg)" } as const;

const COL = {
  rank: 26,
  team: 108,
  wl: 66,
  pct: 72,
  strk: 68,
  split: 62,
  homeAway: 78,
} as const;

const TABLE_PAD_X = 8;
const TABLE_MIN_W =
  COL.rank +
  COL.team +
  COL.wl +
  COL.pct +
  COL.strk +
  COL.split +
  COL.homeAway * 2 +
  TABLE_PAD_X * 2;
const stickyBg = "rgb(8, 20, 28)";
const stickyHeadBg = "rgb(10, 28, 34)";

function nick(row: NbaConferenceStandingsRow): string {
  return getMobileTeamName("nba", row.teamName).toUpperCase();
}

function rankNumberClass(rank: number): string {
  if (rank <= 6) return "text-emerald-300";
  if (rank <= 10) return "text-amber-300";
  return "text-red-300/80";
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return `rgba(0,245,255,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function Separator({ kind }: { kind: "playoff" | "playin" }) {
  const color = kind === "playoff" ? "rgba(52,211,153,0.55)" : "rgba(251,191,36,0.5)";
  return (
    <div
      className="h-px w-full"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

function MetricCol({
  children,
  width,
  className,
  style,
}: {
  children: ReactNode;
  width: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={[
        "relative shrink-0 text-center",
        "border-l border-dashed border-[rgba(0,245,255,0.24)]",
        className ?? "",
      ].join(" ")}
      style={{ ...metricCellSkew, width, ...style }}
    >
      {children}
    </span>
  );
}

export default function NbaLeagueStandingsPanel({
  language = "ja",
  onSelectTeam,
}: Props) {
  const isJa = language === "ja";
  const { board, asOfLabel, loading } = useNbaConferenceStandings();
  const [conference, setConference] = useState<NbaConferenceId>("east");
  const rows = conference === "east" ? board.east : board.west;

  const head = useMemo(
    () => [
      { key: "wl", label: isJa ? "成績" : "W-L", w: COL.wl },
      { key: "pct", label: "W%", w: COL.pct, accent: true },
      { key: "strk", label: isJa ? "連勝" : "STRK", w: COL.strk },
      { key: "l10", label: "L10", w: COL.split },
      { key: "h", label: "HOME", w: COL.homeAway },
      { key: "a", label: "AWAY", w: COL.homeAway },
    ],
    [isJa]
  );

  return (
    <div
      className={[
        "flex h-[calc(100svh-13rem)] min-h-[28rem] flex-col text-white",
        loading ? "pointer-events-none opacity-60" : "",
      ].join(" ")}
    >
      <header className="mb-2 shrink-0 space-y-1.5 px-0.5">
        <p
          className={`${nameOxanium.className} text-right text-[9px] font-bold uppercase tracking-[0.16em] text-[#00F5FF]/45`}
        >
          {asOfLabel}
        </p>
        <CyberSlantedTabBar fill aria-label="Conference">
          <CyberSlantedTab
            label="EAST"
            active={conference === "east"}
            onClick={() => setConference("east")}
            compact
            fontWeight={700}
          />
          <CyberSlantedTab
            label="WEST"
            active={conference === "west"}
            onClick={() => setConference("west")}
            compact
            fontWeight={700}
          />
        </CyberSlantedTabBar>
      </header>

      <div className="min-h-0 flex-1 overflow-auto pb-24">
        <div
          className="rounded-[2px] border border-[rgba(0,245,255,0.12)] bg-[rgba(4,16,24,0.35)]"
          style={{ minWidth: TABLE_MIN_W }}
        >
          <div
            className={`${nameOxanium.className} flex items-center border-b border-[rgba(0,245,255,0.12)] bg-[rgba(0,245,255,0.06)] py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/50`}
            style={{ paddingLeft: TABLE_PAD_X, paddingRight: TABLE_PAD_X }}
          >
            <span
              className="sticky z-[1] text-white/50"
              style={{
                width: COL.rank,
                left: 0,
                backgroundColor: stickyHeadBg,
              }}
            >
              #
            </span>
            <span
              className="sticky z-[1] truncate text-white/50"
              style={{
                width: COL.team,
                left: COL.rank,
                backgroundColor: stickyHeadBg,
                boxShadow: "8px 0 10px -8px rgba(0,0,0,0.7)",
              }}
            >
              {isJa ? "チーム" : "Team"}
            </span>
            {head.map((h) => (
              <MetricCol
                key={h.key}
                width={h.w}
                className={h.accent ? "text-[#00F5FF]" : ""}
              >
                {h.label}
              </MetricCol>
            ))}
          </div>

          {rows.map((row) => {
            const primary = getTeamJerseyPrimaryColor("nba", row.teamId);
            const streakTheme = teamStreakBadgeTheme(row.streak);
            const stickyFill = `linear-gradient(90deg, ${hexToRgba(primary, 0.28)} 0%, ${stickyBg} 70%)`;
            return (
              <div key={row.teamId}>
                {row.rank === 7 ? <Separator kind="playoff" /> : null}
                {row.rank === 11 ? <Separator kind="playin" /> : null}
                <button
                  type="button"
                  onClick={() => onSelectTeam?.(row.teamId)}
                  className="group relative flex w-full cursor-pointer items-center overflow-visible border-t border-[rgba(0,245,255,0.08)] py-3 text-left transition duration-100 ease-out hover:bg-white/[0.03] active:scale-[0.99] motion-reduce:active:scale-100"
                  style={{
                    paddingLeft: TABLE_PAD_X,
                    paddingRight: TABLE_PAD_X,
                    backgroundImage: `linear-gradient(90deg, ${hexToRgba(primary, 0.18)} 0%, ${hexToRgba(primary, 0.08)} 36%, transparent 100%)`,
                  }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-transparent transition-colors duration-75 group-active:bg-[rgba(0,245,255,0.16)]"
                  />
                  <span
                    className={[
                      resultStatsMetricNumClass,
                      "sticky z-[1] text-[18px] font-black tabular-nums",
                      rankNumberClass(row.rank),
                    ].join(" ")}
                    style={{
                      ...rankCellSkew,
                      width: COL.rank,
                      left: 0,
                      backgroundImage: stickyFill,
                      backgroundColor: stickyBg,
                    }}
                  >
                    {row.rank}
                  </span>
                  <span
                    className={`${nameBebas.className} sticky z-[1] truncate pr-1 text-[18px] leading-none text-white/94`}
                    style={{
                      ...teamNameTy,
                      width: COL.team,
                      left: COL.rank,
                      backgroundImage: stickyFill,
                      backgroundColor: stickyBg,
                      boxShadow: "8px 0 12px -8px rgba(0,0,0,0.75)",
                    }}
                  >
                    {nick(row)}
                  </span>
                  <MetricCol
                    width={COL.wl}
                    className={`${nameOxanium.className} text-[15px] font-bold tabular-nums text-white/88`}
                  >
                    {formatStandingsWl({ wins: row.wins, losses: row.losses })}
                  </MetricCol>
                  <MetricCol
                    width={COL.pct}
                    className={`${nameOxanium.className} text-[16px] font-extrabold tabular-nums text-[#00F5FF]`}
                  >
                    {formatStandingsWinPct(row.winPct)}
                  </MetricCol>
                  <MetricCol
                    width={COL.strk}
                    className={`${nameOxanium.className} text-[15px] font-extrabold tabular-nums`}
                    style={{ color: streakTheme.headlineColor }}
                  >
                    {formatStreakLabel(row.streak)}
                  </MetricCol>
                  <MetricCol
                    width={COL.split}
                    className={`${nameOxanium.className} text-[15px] font-bold tabular-nums text-white/78`}
                  >
                    {formatStandingsWl(row.last10)}
                  </MetricCol>
                  <MetricCol
                    width={COL.homeAway}
                    className={`${nameOxanium.className} text-[15px] font-bold tabular-nums text-white/78`}
                  >
                    {formatStandingsWl(row.home)}
                  </MetricCol>
                  <MetricCol
                    width={COL.homeAway}
                    className={`${nameOxanium.className} text-[15px] font-bold tabular-nums text-white/78`}
                  >
                    {formatStandingsWl(row.away)}
                  </MetricCol>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
