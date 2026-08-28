"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Snowflake } from "lucide-react";
import { nameOxanium, nameBebas } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import { CyberSlantedSegBar } from "@/app/component/rankings/CyberSlantedSegBar";
import { NbaTeamRosterCard } from "@/app/component/predict/NbaRosterPanel";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
  getTeamUiAccentColor,
} from "@/lib/team-colors";
import {
  availabilityStatusColor,
  formatAvailabilityStatus,
  formatSalaryUsd,
} from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import {
  buildFuturePayrollYearsFromLines,
  buildSynchronizedTeamPayrollLines,
  nbaSalaryCapLinesForSeason,
  nbaTwoWaySalaryForSeason,
  resolveApronStatus,
} from "@/lib/nba/teamPayroll/mapBdlToTeamPayroll";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaRosterTeamBlock } from "@/lib/predict/nbaRoster";
import {
  formatStreakLabel,
  getNbaTeamDetailPreview,
  payrollDisplaySlices,
  type NbaApronStatus,
  type NbaTeamFuturePayrollYear,
  type NbaTeamHeadToHeadEntry,
  type NbaTeamInjuryEntry,
  type NbaTeamMetricWithRank,
  type NbaTeamPayroll,
  type NbaTeamDetailPreview,
  type NbaTeamRecentGame,
  type NbaTeamStreak,
  type NbaTeamUpcomingGame,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";
import { getNbaTeamDraftCapital } from "@/lib/nba/draftPicks/nbaDraftCapitalData";
import type {
  NbaDraftPickEntry,
  NbaDraftPickKind,
  NbaTeamDraftCapital,
} from "@/lib/nba/draftPicks/draftPicksTypes";
import { useLeagueTeamStatsBundle } from "@/lib/nba/useLeagueTeamStatsBundle";
import { useNbaTeamDetailLiveOverlay } from "@/lib/nba/teamDetail/useNbaTeamDetailLiveOverlay";
import type { NbaLeagueTeamStatsBundle } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import {
  TEAM_HOW_THEY_PLAY_TABS,
  getTeamHowTheyPlay,
  type TeamHowTheyPlayTab,
} from "@/lib/predict/nbaTeamDetailHowTheyPlay";
import {
  recentFormRecord,
  teamStreakBadgeLabel,
  teamStreakBadgeTheme,
} from "@/lib/predict/nbaTeamDetailForm";
import { playerCardName } from "@/lib/predict/nbaRoster";

type Props = {
  teamId?: string;
  language?: "ja" | "en";
};

const FORM_WIN = "#00F5FF";
const FORM_LOSS = "#FF2D78";
const BAR_OFFENSE = "#5cf0b5";
const METRIC_OFFENSE = "#FF3D5A";
const METRIC_DEFENSE = "#3BA0FF";
const LEAGUE_RANK_SEGMENTS = 6;
const teamNickTy = matchCardTeamNameStyle(true);

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(255,255,255,${alpha})`;
  const n = parseInt(raw, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function ordinal(n: number): string {
  const abs = Math.abs(n);
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (abs % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function leagueRankSegPct(rank: number): number {
  const r = Math.max(1, Math.min(30, rank));
  const bucket = Math.min(LEAGUE_RANK_SEGMENTS - 1, Math.floor((r - 1) / 5));
  return ((LEAGUE_RANK_SEGMENTS - bucket) / LEAGUE_RANK_SEGMENTS) * 100;
}

function winPctLabel(wins: number, losses: number): string {
  const n = wins + losses;
  if (n <= 0) return ".000";
  return (wins / n).toFixed(3).replace(/^0/, "");
}

function SplitCard({
  label,
  wins,
  losses,
  labelColor,
  accent,
}: {
  label: string;
  wins: number;
  losses: number;
  labelColor?: string;
  accent: string;
}) {
  return (
    <div
      className="flex-1 space-y-1 border bg-black/40 px-3 py-2.5"
      style={{ borderColor: hexToRgba(accent, 0.3) }}
    >
      <p
        className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em]`}
        style={{ color: labelColor ?? "rgba(255,255,255,0.75)" }}
      >
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <p
          className={`${nameOxanium.className} text-[18px] font-extrabold tabular-nums`}
          style={{ transform: "skewX(-8deg)" }}
        >
          {wins}-{losses}
        </p>
        <p className={`${nameOxanium.className} text-[12px] font-bold text-white/45`}>
          {winPctLabel(wins, losses)}
        </p>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  accent,
}: {
  title: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <h2
        className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em] text-white/75`}
      >
        {title}
      </h2>
      <div
        className="h-px flex-1"
        style={{ backgroundColor: hexToRgba(accent, 0.35) }}
      />
    </div>
  );
}

function RecentForm({
  games,
  streak,
  accent,
  isJa,
}: {
  games: NbaTeamRecentGame[];
  streak: NbaTeamStreak;
  accent: string;
  isJa: boolean;
}) {
  const results = games.slice(-10).map((g) => g.result);
  const wins = results.filter((r) => r === "W").length;
  const streakWin = streak.kind === "W";
  const emptyCopy = isJa ? "データがありません" : "No data yet";

  return (
    <div className="space-y-2.5">
      <div className="flex w-full items-center gap-2">
        <span
          className={`${nameOxanium.className} flex-1 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-white/75`}
        >
          Recent Form (Last 10)
        </span>
        {results.length > 0 ? (
          <span
            className={`${nameOxanium.className} text-[13px] font-black`}
            style={{
              color: streakWin ? FORM_WIN : FORM_LOSS,
              transform: "skewX(-8deg)",
            }}
          >
            {formatStreakLabel(streak)}
          </span>
        ) : null}
      </div>
      {results.length === 0 ? (
        <p className={`${nameOxanium.className} text-[12px] font-bold text-white/45`}>
          {emptyCopy}
        </p>
      ) : (
        <div className="flex w-full items-center gap-2.5">
          <div className="flex flex-1 gap-px">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex h-4 flex-1 items-center justify-center"
                style={{
                  backgroundColor: r === "W" ? FORM_WIN : FORM_LOSS,
                  opacity:
                    0.34 +
                    (results.length <= 1
                      ? 0.66
                      : (i / (results.length - 1)) * 0.66),
                  transform: "skewX(-12deg)",
                }}
              >
                <span
                  className={`${nameOxanium.className} text-[8px] font-black text-[#050508]`}
                  style={{ transform: "skewX(12deg)" }}
                >
                  {r}
                </span>
              </div>
            ))}
          </div>
          <span className={`${nameOxanium.className} min-w-9 text-right text-[13px] font-extrabold`}>
            {wins}-{results.length - wins}
          </span>
        </div>
      )}
    </div>
  );
}

function TeamHeroStreakBadge({
  streak,
  last10,
  isJa,
}: {
  streak: NbaTeamStreak;
  last10: { wins: number; losses: number };
  isJa: boolean;
}) {
  const badge = teamStreakBadgeLabel(streak, isJa);
  const theme = teamStreakBadgeTheme(streak);

  return (
    <div
      className="flex shrink-0 flex-col items-end gap-1"
      aria-label={
        isJa
          ? `直近 ${last10.wins}勝${last10.losses}敗、${badge.headline}`
          : `Last 10: ${last10.wins}-${last10.losses}, ${badge.headline}`
      }
    >
      <div
        className="flex items-center gap-1.5 border px-2 py-1"
        style={{
          borderColor: theme.borderColor,
          backgroundColor: theme.backgroundColor,
        }}
      >
        {theme.showFireIcon ? (
          <Flame
            className="h-3.5 w-3.5"
            style={{ color: theme.tagColor }}
            aria-hidden
          />
        ) : theme.showColdIcon ? (
          <Snowflake
            className="h-3.5 w-3.5"
            style={{ color: theme.tagColor }}
            aria-hidden
          />
        ) : null}
        <span
          className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em]`}
          style={{ color: theme.tagColor }}
        >
          {badge.tag}
        </span>
        <span
          className={`${nameOxanium.className} text-[15px] font-extrabold tabular-nums`}
          style={{ color: theme.headlineColor, transform: "skewX(-8deg)" }}
        >
          {badge.headline}
        </span>
      </div>
      <span className={`${nameOxanium.className} text-[10px] font-bold tabular-nums text-white/45`}>
        L10 {last10.wins}-{last10.losses}
      </span>
    </div>
  );
}

function HeadToHead({
  rows,
  accent,
  isJa,
}: {
  rows: NbaTeamHeadToHeadEntry[];
  accent: string;
  isJa: boolean;
}) {
  const emptyCopy = isJa ? "データがありません" : "No data yet";
  return (
    <section className="space-y-2.5">
      <SectionTitle title="HEAD-TO-HEAD" accent={accent} />
      <div
        className="overflow-hidden border bg-black/40"
        style={{ borderColor: hexToRgba(accent, 0.3) }}
      >
        {rows.length === 0 ? (
          <div className={`${nameOxanium.className} px-3 py-2.5 text-[12px] font-bold text-white/45`}>
            {emptyCopy}
          </div>
        ) : (
          rows.map((row, i) => (
            <div
              key={row.oppTeamId}
              className="flex items-center justify-between gap-2 px-2.5 py-2.5"
              style={
                i < rows.length - 1
                  ? { borderBottom: `1px solid ${hexToRgba(accent, 0.12)}` }
                  : undefined
              }
            >
              <span className={`${nameOxanium.className} text-[14px] font-bold`}>
                {row.oppAbbr}
              </span>
              <span
                className={`${nameOxanium.className} text-[14px] font-extrabold tabular-nums`}
                style={{ transform: "skewX(-6deg)" }}
              >
                {row.wins}-{row.losses}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}



function GameLogs({
  games,
  accent,
  isJa,
}: {
  games: NbaTeamRecentGame[];
  accent: string;
  isJa: boolean;
}) {
  const list = [...games].slice(-10).reverse();
  const emptyCopy = isJa ? "データがありません" : "No data yet";
  return (
    <section className="space-y-2.5">
      <SectionTitle
        title={list.length > 0 ? `Game Logs (Last ${list.length})` : "Game Logs"}
        accent={accent}
      />
      <div
        className="overflow-hidden border bg-black/40"
        style={{ borderColor: hexToRgba(accent, 0.3) }}
      >
        {list.length === 0 ? (
          <div className={`${nameOxanium.className} px-3 py-2.5 text-[12px] font-bold text-white/45`}>
            {emptyCopy}
          </div>
        ) : (
          <>
            <div
              className="flex items-center gap-1.5 px-2.5 py-2.5"
              style={{ borderBottom: `1px solid ${hexToRgba(accent, 0.12)}` }}
            >
              <span className={`${nameOxanium.className} w-11 text-[11px] font-bold uppercase tracking-wide text-white/40`}>Date</span>
              <span className={`${nameOxanium.className} flex-1 text-[11px] font-bold uppercase tracking-wide text-white/40`}>Game</span>
              <span className={`${nameOxanium.className} text-[11px] font-bold uppercase tracking-wide text-white/40`}>Score</span>
              <span className="w-5" />
            </div>
            {list.map((g, i) => (
              <div
                key={`${g.dateLabel}-${g.oppAbbr}-${i}`}
                className="flex items-center gap-1.5 px-2.5 py-2.5"
                style={
                  i < list.length - 1
                    ? { borderBottom: `1px solid ${hexToRgba(accent, 0.12)}` }
                    : undefined
                }
              >
                <span className={`${nameOxanium.className} w-11 text-[13px] text-white/40`}>
                  {g.dateLabel}
                </span>
                <span className={`${nameOxanium.className} flex-1 truncate text-[14px] font-bold`}>
                  {g.home ? "vs" : "@"} {g.oppAbbr}
                </span>
                <span className={`${nameOxanium.className} text-[14px] font-bold tabular-nums`} style={{ transform: "skewX(-6deg)" }}>
                  {g.teamScore}-{g.oppScore}
                </span>
                <span
                  className={`${nameOxanium.className} w-5 text-right text-[14px] font-extrabold`}
                  style={{ color: g.result === "W" ? FORM_WIN : FORM_LOSS }}
                >
                  {g.result}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}

function Injuries({
  injuries,
  accent,
  isJa,
}: {
  injuries: NbaTeamInjuryEntry[];
  accent: string;
  isJa: boolean;
}) {
  return (
    <section className="space-y-2.5">
      <SectionTitle title="INJURIES" accent={accent} />
      <div
        className="overflow-hidden border bg-black/40"
        style={{ borderColor: hexToRgba(accent, 0.35) }}
      >
        {injuries.length === 0 ? (
          <div className={`${nameOxanium.className} px-3 py-2.5 text-[12px] font-bold text-white/45`}>
            {isJa ? "データがありません" : "No data yet"}
          </div>
        ) : (
          injuries.map((inj, i) => {
            const tone = availabilityStatusColor(inj.status);
            return (
              <div
                key={inj.playerId}
                className="space-y-1 px-3 py-2.5"
                style={
                  i < injuries.length - 1
                    ? { borderBottom: `1px solid ${hexToRgba(accent, 0.12)}` }
                    : undefined
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`${nameOxanium.className} text-[13px] font-extrabold`} style={{ transform: "skewX(-6deg)" }}>
                    {inj.name}
                  </span>
                  <span className={`${nameOxanium.className} text-[11px] font-extrabold tracking-wide`} style={{ color: tone, transform: "skewX(-8deg)" }}>
                    {formatAvailabilityStatus(inj.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`${nameOxanium.className} truncate text-[11px] text-white/55`}>
                    {inj.reason ?? "—"}
                  </span>
                  {inj.returnEstimate ? (
                    <span className={`${nameOxanium.className} text-[10px] font-bold uppercase`} style={{ color: hexToRgba(tone, 0.85) }}>
                      {inj.returnEstimate}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function HowChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        nameOxanium.className,
        "relative min-w-0 flex-1 overflow-hidden rounded-[2px] border px-1 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.04em]",
        active
          ? "border-[#00F5FF] text-[#050508]"
          : "border-[#00F5FF]/26 bg-transparent text-[#00F5FF]",
      ].join(" ")}
      style={
        active
          ? {
              backgroundColor: "#00F5FF",
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 3px)",
            }
          : undefined
      }
    >
      <span className="relative z-[1] inline-block" style={{ transform: "skewX(-6deg)" }}>
        {label}
      </span>
    </button>
  );
}

function rankTone(rank: number): string {
  return rank <= 10 ? "#FFFFFF" : "rgba(255,255,255,0.35)";
}

function HowPtsCol({ display }: { display?: string }) {
  return (
    <span className="flex w-[54px] shrink-0 flex-col items-end leading-none">
      <span className={`${nameOxanium.className} h-[12px] text-[8px] font-bold uppercase tracking-wide text-white/40`}>
        {display ? "pts" : ""}
      </span>
      <span
        className={`${nameOxanium.className} text-[15px] font-extrabold tabular-nums text-white`}
        style={{ transform: "skewX(-8deg)" }}
      >
        {display ?? ""}
      </span>
    </span>
  );
}

function MetricStack({
  display,
  rank,
  accent,
  unit,
}: {
  display: string;
  rank: number;
  accent: string;
  unit?: string;
}) {
  return (
    <span className="flex w-[68px] shrink-0 flex-col items-end leading-none">
      <span
        className={`${nameOxanium.className} h-[12px] text-[10px] font-bold tabular-nums`}
        style={{ color: rankTone(rank) }}
      >
        #{rank}
      </span>
      <span
        className={`${nameOxanium.className} text-[16px] font-extrabold tabular-nums text-white`}
        style={{ transform: "skewX(-8deg)" }}
      >
        {display}
        {unit ? (
          <span className="ml-0.5 text-[9px] font-bold text-white/40">{unit}</span>
        ) : null}
      </span>
    </span>
  );
}

function HowTheyPlayBoard({
  teamId,
  accent,
  isJa,
  bundle,
}: {
  teamId: string;
  accent: string;
  isJa: boolean;
  bundle: NbaLeagueTeamStatsBundle;
}) {
  const board = useMemo(
    () => getTeamHowTheyPlay(teamId, bundle),
    [teamId, bundle]
  );
  const [tab, setTab] = useState<TeamHowTheyPlayTab>("fourFactors");
  const [factorId, setFactorId] = useState("efg");
  const [hustleId, setHustleId] = useState("deflections");
  const [trackId, setTrackId] = useState("drives");
  if (!board) return null;
  const tabMeta = TEAM_HOW_THEY_PLAY_TABS.find((t) => t.id === tab)!;
  const factor =
    board.fourFactors.find((r) => r.id === factorId) ?? board.fourFactors[0]!;
  const hustle =
    board.hustle.find((r) => r.id === hustleId) ?? board.hustle[0]!;
  const tracking =
    board.tracking.find((r) => r.id === trackId) ?? board.tracking[0]!;
  const frame = hexToRgba(accent, 0.4);
  const line = hexToRgba(accent, 0.15);

  return (
    <section className="space-y-2.5">
      <SectionTitle title="HOW THEY PLAY" accent={accent} />
      <div className="grid grid-cols-3 gap-1">
        {TEAM_HOW_THEY_PLAY_TABS.map((t) => (
          <HowChip
            key={t.id}
            active={tab === t.id}
            label={t.short}
            onClick={() => setTab(t.id)}
          />
        ))}
      </div>
      <p className={`${nameOxanium.className} text-[11px] leading-snug text-[#00F5FF]/70`}>
        {isJa ? tabMeta.hintJa : tabMeta.hintEn}
      </p>

      {tab === "fourFactors" ? (
        <div className="overflow-hidden border bg-black/50" style={{ borderColor: frame }}>
          <div
            className={`${nameOxanium.className} grid grid-cols-[52px_1fr_1fr] items-center border-b px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-white/40`}
            style={{ borderColor: line }}
          >
            <span />
            <span className="text-right" style={{ color: METRIC_OFFENSE }}>
              {isJa ? "自分" : "US"}
            </span>
            <span className="text-right" style={{ color: METRIC_DEFENSE }}>
              {isJa ? "相手" : "THEM"}
            </span>
          </div>
          {board.fourFactors.map((row) => {
            const active = row.id === factor.id;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setFactorId(row.id)}
                className="grid w-full grid-cols-[52px_1fr_1fr] items-center px-2.5 py-2.5 text-left"
                style={{
                  borderTop: `1px solid ${line}`,
                  backgroundColor: active ? hexToRgba(accent, 0.08) : undefined,
                }}
              >
                <span
                  className={`${nameOxanium.className} text-[11px] font-extrabold`}
                  style={{ transform: "skewX(-6deg)" }}
                >
                  {row.short}
                </span>
                <span className="text-right">
                  <span
                    className={`${nameOxanium.className} text-[16px] font-extrabold tabular-nums`}
                    style={{ color: METRIC_OFFENSE, transform: "skewX(-8deg)" }}
                  >
                    {row.own.display}
                  </span>
                  <span
                    className={`${nameOxanium.className} ml-1 text-[10px] font-bold tabular-nums`}
                    style={{ color: rankTone(row.own.rank) }}
                  >
                    #{row.own.rank}
                  </span>
                </span>
                <span className="text-right">
                  <span
                    className={`${nameOxanium.className} text-[16px] font-extrabold tabular-nums`}
                    style={{ color: METRIC_DEFENSE, transform: "skewX(-8deg)" }}
                  >
                    {row.opp.display}
                  </span>
                  <span
                    className={`${nameOxanium.className} ml-1 text-[10px] font-bold tabular-nums`}
                    style={{ color: rankTone(row.opp.rank) }}
                  >
                    #{row.opp.rank}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {tab === "fourFactors" ? (
        <p className={`${nameOxanium.className} text-[13px] font-bold leading-snug text-white/85`}>
          {isJa ? factor.hintJa : factor.hintEn}
        </p>
      ) : null}

      {tab === "scoring" ? (
        <div className="space-y-2.5 border bg-black/40 px-3 py-3" style={{ borderColor: frame }}>
            {board.scoring.map((row) => (
              <div key={row.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`${nameOxanium.className} min-w-0 flex-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/55`}>
                    {isJa ? row.labelJa : row.labelEn}
                  </span>
                  <HowPtsCol display={row.pts.display} />
                  <MetricStack
                    display={row.cell.display}
                    rank={row.cell.rank}
                    accent={accent}
                  />
                </div>
                <div className="h-1.5 overflow-hidden bg-white/10">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.max(4, Math.min(100, row.cell.value * 100))}%`,
                    backgroundColor: accent,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "playtype" ? (
        <div className="overflow-hidden border bg-black/50" style={{ borderColor: frame }}>
          {board.playtype.map((row, i) => (
            <div
              key={row.id}
              className="space-y-1.5 px-2.5 py-2.5"
              style={i > 0 ? { borderTop: `1px solid ${line}` } : undefined}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`${nameOxanium.className} min-w-0 flex-1 text-[11px] font-extrabold`}
                  style={{ transform: "skewX(-6deg)" }}
                >
                  {row.short}
                </span>
                <HowPtsCol display={row.pts.display} />
                <MetricStack
                  display={row.ppp.display}
                  rank={row.ppp.rank}
                  accent={accent}
                  unit="PPP"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 min-w-0 flex-1 overflow-hidden bg-white/10">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.max(4, Math.min(100, row.freq.value * 100 * 1.2))}%`,
                      backgroundColor: accent,
                    }}
                  />
                </div>
                <span className={`${nameOxanium.className} w-10 text-right text-[10px] font-bold tabular-nums text-white/55`}>
                  {row.freq.display}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "clutch" ? (
        <div
          className="grid grid-cols-3 overflow-hidden border bg-black/50"
          style={{ borderColor: frame }}
        >
          {board.clutch.map((row) => (
            <div
              key={row.id}
              className="px-2.5 py-3"
              style={{ borderRight: `1px solid ${line}` }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-wider text-white/40`}>
                  {row.short}
                </span>
                <span
                  className={`${nameOxanium.className} text-[12px] font-extrabold tabular-nums`}
                  style={{ color: rankTone(row.cell.rank) }}
                >
                  #{row.cell.rank}
                </span>
              </div>
              <p
                className={`${nameOxanium.className} mt-1 text-[18px] font-extrabold tabular-nums`}
                style={{ transform: "skewX(-8deg)" }}
              >
                {row.cell.display}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "hustle" || tab === "tracking" ? (
        <>
          <div className="overflow-hidden border bg-black/50" style={{ borderColor: frame }}>
            {(tab === "hustle" ? board.hustle : board.tracking).map((row, i) => {
              const selected = tab === "hustle" ? hustle : tracking;
              const active = row.id === selected.id;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() =>
                    tab === "hustle" ? setHustleId(row.id) : setTrackId(row.id)
                  }
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
                  style={{
                    borderTop: i > 0 ? `1px solid ${line}` : undefined,
                    backgroundColor: active ? hexToRgba(accent, 0.08) : undefined,
                  }}
                >
                  <span
                    className={`${nameOxanium.className} min-w-0 flex-1 text-[11px] font-extrabold`}
                    style={{ transform: "skewX(-6deg)" }}
                  >
                    {row.short}
                  </span>
                  <HowPtsCol display={row.pts?.display} />
                  <MetricStack
                    display={row.cell.display}
                    rank={row.cell.rank}
                    accent={accent}
                  />
                </button>
              );
            })}
          </div>
          <p className={`${nameOxanium.className} text-[13px] font-bold leading-snug text-white/85`}>
            {tab === "hustle"
              ? isJa
                ? hustle.hintJa
                : hustle.hintEn
              : isJa
                ? tracking.hintJa
                : tracking.hintEn}
          </p>
        </>
      ) : null}
    </section>
  );
}

function PerformanceMetrics({
  ortg,
  drtg,
  accent,
}: {
  ortg: NbaTeamMetricWithRank | undefined;
  drtg: NbaTeamMetricWithRank | undefined;
  accent: string;
}) {
  if (!ortg && !drtg) return null;
  return (
    <section className="space-y-2.5">
      <SectionTitle title="PERFORMANCE METRICS" accent={accent} />
      <div
        className="space-y-3.5 border bg-black/40 px-3 py-3"
        style={{ borderColor: hexToRgba(accent, 0.4) }}
      >
        {ortg ? (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span
                className={`${nameOxanium.className} text-[12px] font-bold uppercase tracking-wide text-white/88`}
              >
                OFFENSIVE RATING
              </span>
              <span
                className={`${nameOxanium.className} text-[13px] font-extrabold tabular-nums`}
                style={{ color: METRIC_OFFENSE, transform: "skewX(-8deg)" }}
              >
                {ortg.display}{" "}
                <span className="font-bold">({ordinal(ortg.leagueRank)})</span>
              </span>
            </div>
            <CyberSlantedSegBar
              pct={leagueRankSegPct(ortg.leagueRank)}
              segments={LEAGUE_RANK_SEGMENTS}
              compact
              accent={{
                border: METRIC_OFFENSE,
                glow: "rgba(255,61,90,0.34)",
                bg: METRIC_OFFENSE,
              }}
              forceStatic
            />
          </div>
        ) : null}
        {drtg ? (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span
                className={`${nameOxanium.className} text-[12px] font-bold uppercase tracking-wide text-white/88`}
              >
                DEFENSIVE RATING
              </span>
              <span
                className={`${nameOxanium.className} text-[13px] font-extrabold tabular-nums`}
                style={{ color: METRIC_DEFENSE, transform: "skewX(-8deg)" }}
              >
                {drtg.display}{" "}
                <span className="font-bold">({ordinal(drtg.leagueRank)})</span>
              </span>
            </div>
            <CyberSlantedSegBar
              pct={leagueRankSegPct(drtg.leagueRank)}
              segments={LEAGUE_RANK_SEGMENTS}
              compact
              accent={{
                border: METRIC_DEFENSE,
                glow: "rgba(59,160,255,0.34)",
                bg: METRIC_DEFENSE,
              }}
              forceStatic
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Upcoming({
  games,
  accent,
  isJa,
}: {
  games: NbaTeamUpcomingGame[];
  accent: string;
  isJa: boolean;
}) {
  const emptyCopy = isJa ? "データがありません" : "No data yet";
  return (
    <section className="space-y-2.5">
      <SectionTitle title="UPCOMING" accent={accent} />
      <div
        className="overflow-hidden border bg-black/40"
        style={{ borderColor: hexToRgba(accent, 0.3) }}
      >
        {games.length === 0 ? (
          <div className={`${nameOxanium.className} px-3 py-2.5 text-[12px] font-bold text-white/45`}>
            {emptyCopy}
          </div>
        ) : (
          games.map((g, i) => (
          <div
            key={`${g.dateLabel}-${g.oppAbbr}-${i}`}
            className="flex items-center gap-1.5 px-2.5 py-2.5"
            style={
              i < games.length - 1
                ? { borderBottom: `1px solid ${hexToRgba(accent, 0.12)}` }
                : undefined
            }
          >
            <span className={`${nameOxanium.className} w-11 text-[13px] text-white/40`}>
              {g.dateLabel}
            </span>
            <span className={`${nameOxanium.className} flex-1 truncate text-[14px] font-bold`}>
              {g.home ? "vs" : "@"} {g.oppAbbr}
            </span>
            <span
              className={`${nameOxanium.className} text-[14px] font-bold`}
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {g.tipLabel}
            </span>
          </div>
          ))
        )}
      </div>
    </section>
  );
}

function ApronBadgeWeb({
  status,
  isJa,
}: {
  status: NbaApronStatus;
  isJa: boolean;
}) {
  let label = "UNDER CAP";
  let color = "#00F5FF";
  let bg = "rgba(0,245,255,0.12)";
  let border = "rgba(0,245,255,0.45)";

  switch (status) {
    case "under_cap":
      label = isJa ? "CAP以下" : "UNDER CAP";
      color = "#00F5FF";
      bg = "rgba(0,245,255,0.12)";
      border = "rgba(0,245,255,0.45)";
      break;
    case "over_cap":
      label = isJa ? "CAP超過" : "OVER CAP";
      color = "#D8D8D8";
      bg = "rgba(255,255,255,0.08)";
      border = "rgba(255,255,255,0.3)";
      break;
    case "tax_payer":
      label = isJa ? "TAX超過" : "TAX PAYER";
      color = "#FFD000";
      bg = "rgba(255,208,0,0.14)";
      border = "rgba(255,208,0,0.5)";
      break;
    case "first_apron":
      label = isJa ? "1ST APRON超過" : "1ST APRON OVER";
      color = "#FF8A00";
      bg = "rgba(255,138,0,0.16)";
      border = "rgba(255,138,0,0.55)";
      break;
    case "second_apron":
      label = isJa ? "2ND APRON超過" : "2ND APRON OVER";
      color = "#FF2D78";
      bg = "rgba(255,45,120,0.18)";
      border = "rgba(255,45,120,0.6)";
      break;
  }

  return (
    <span
      className={`${nameOxanium.className} inline-flex items-center px-1.5 py-0.5 text-[8px] font-extrabold tracking-wider border rounded-[2px]`}
      style={{
        backgroundColor: bg,
        borderColor: border,
        color,
        transform: "skewX(-8deg)",
      }}
    >
      {label}
    </span>
  );
}

function PayrollCard({
  payroll,
  rosterBlock,
  accent,
  isJa,
}: {
  payroll: NbaTeamPayroll;
  rosterBlock?: NbaRosterTeamBlock | null;
  accent: string;
  isJa: boolean;
}) {
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0);

  const seasonKeys = ["2026-27", "2027-28", "2028-29", "2029-30", "2030-31"];

  const seasonsList = seasonKeys.map((sKey, index) => {
    const capInfo = nbaSalaryCapLinesForSeason(sKey);
    // 将来年のBDLデータが payroll.futureYears にあればそれを参照
    const futureYearData =
      index > 0
        ? (payroll.futureYears ?? []).find((fy) => fy.seasonKey === sKey)
        : null;

    const sourceLines = futureYearData ? futureYearData.lines : payroll.lines;
    const linesRaw = buildSynchronizedTeamPayrollLines(
      rosterBlock?.players,
      sourceLines,
      sKey
    );
    const totalSalary = linesRaw.reduce((s, l) => s + l.salary, 0);
    const lines =
      totalSalary > 0
        ? linesRaw.map((l) => ({ ...l, share: l.salary / totalSalary }))
        : linesRaw;

    return {
      key: sKey,
      label: sKey,
      isCurrent: index === 0,
      totalSalary,
      salaryCap: capInfo.salaryCap,
      taxLine: capInfo.taxLine,
      firstApron: capInfo.firstApron,
      secondApron: capInfo.secondApron,
      capSpace: capInfo.salaryCap - totalSalary,
      taxSpace: capInfo.taxLine - totalSalary,
      firstApronSpace: capInfo.firstApron - totalSalary,
      secondApronSpace: capInfo.secondApron - totalSalary,
      apronStatus: resolveApronStatus(totalSalary, capInfo),
      taxBill: 0,
      guaranteed: totalSalary,
      lines,
      leagueRank: index === 0 ? payroll.leagueRank : null,
    };
  });

  const active = seasonsList[selectedSeasonIdx] ?? seasonsList[0];
  const overCap = active.capSpace < 0;
  const slices = payrollDisplaySlices(active.lines, accent);

  return (
    <section className="space-y-2.5">
      <SectionTitle title="PAYROLL" accent={accent} />

      {/* Year Selection Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {seasonsList.map((s, idx) => {
          const isSelected = idx === selectedSeasonIdx;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setSelectedSeasonIdx(idx)}
              className={`${nameOxanium.className} px-2.5 py-1 text-[10px] font-bold tracking-wider border rounded-[2px] transition-colors`}
              style={{
                borderColor: isSelected ? accent : "rgba(255,255,255,0.12)",
                backgroundColor: isSelected
                  ? hexToRgba(accent, 0.18)
                  : "rgba(8,8,12,0.4)",
                color: isSelected ? accent : "rgba(255,255,255,0.6)",
                transform: "skewX(-8deg)",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="space-y-2 border bg-black/45 p-3.5"
          style={{ borderColor: hexToRgba(accent, 0.45) }}
        >
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p
                  className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em] text-white/40`}
                  style={{ transform: "skewX(-8deg)" }}
                >
                  {active.isCurrent
                    ? isJa
                      ? `総年俸 (${active.label})`
                      : `TOTAL SALARY (${active.label})`
                    : isJa
                    ? `確定年俸 (${active.label})`
                    : `COMMITTED (${active.label})`}
                </p>
                <ApronBadgeWeb status={active.apronStatus} isJa={isJa} />
              </div>
              <p
                className={`${nameOxanium.className} text-[26px] font-extrabold text-white`}
                style={{ transform: "skewX(-8deg)" }}
              >
                {formatSalaryUsd(active.totalSalary)}
              </p>
            </div>
            {active.leagueRank != null && (
              <div className="text-right">
                <p
                  className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em] text-white/40`}
                  style={{ transform: "skewX(-8deg)" }}
                >
                  Rank
                </p>
                <p
                  className={`${nameOxanium.className} text-[22px] font-extrabold text-white`}
                  style={{ transform: "skewX(-8deg)" }}
                >
                  #{active.leagueRank}
                </p>
              </div>
            )}
          </div>

          <p className={`${nameOxanium.className} text-[11px] font-bold uppercase tracking-wide text-white/60`}>
            CAP {formatSalaryUsd(active.salaryCap)} · TAX LINE{" "}
            {formatSalaryUsd(active.taxLine)}
          </p>

          <p className={`${nameOxanium.className} text-[11px] font-bold uppercase tracking-wide`}>
            <span className="text-orange-400">
              1ST APRON {formatSalaryUsd(active.firstApron)}
            </span>
            <span className="text-white/45"> · </span>
            <span className="text-pink-400">
              2ND APRON {formatSalaryUsd(active.secondApron)}
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {active.firstApronSpace != null && (
              <p
                className={`${nameOxanium.className} text-[12px] font-extrabold`}
                style={{
                  color: active.firstApronSpace < 0 ? FORM_LOSS : BAR_OFFENSE,
                  transform: "skewX(-6deg)",
                }}
              >
                {isJa ? "1ST APRON余裕" : "1ST APRON SPACE"}:{" "}
                {active.firstApronSpace >= 0 ? "+" : ""}
                {formatSalaryUsd(active.firstApronSpace)}
              </p>
            )}
            {active.secondApronSpace != null && (
              <p
                className={`${nameOxanium.className} text-[12px] font-extrabold`}
                style={{
                  color: active.secondApronSpace < 0 ? FORM_LOSS : BAR_OFFENSE,
                  transform: "skewX(-6deg)",
                }}
              >
                {isJa ? "2ND APRON余裕" : "2ND APRON SPACE"}:{" "}
                {active.secondApronSpace >= 0 ? "+" : ""}
                {formatSalaryUsd(active.secondApronSpace)}
              </p>
            )}
          </div>

          <p
            className={`${nameOxanium.className} pt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/45`}
            style={{ transform: "skewX(-6deg)" }}
          >
            {isJa
              ? `選手内訳 (${slices.length}名) · % はCAP比`
              : `BY PLAYER (${slices.length}) · % OF CAP`}
          </p>
          <div className="overflow-hidden px-1.5">
            <div
              className="flex h-3.5 gap-px bg-white/[0.06]"
              style={{ transform: "skewX(-14deg)" }}
            >
              {slices.map((s) => (
                <div
                  key={s.key}
                  style={{
                    flexGrow: Math.max(s.share, 0.02),
                    flexBasis: 0,
                    backgroundColor: s.color,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {slices.length === 0 ? (
              <p className={`${nameOxanium.className} text-[12px] font-bold text-white/45`}>
                {isJa ? "データがありません" : "No data yet"}
              </p>
            ) : (
              slices.map((s) => {
                const isTw = s.isTwoWay === true && active.key === CURRENT_NBA_SEASON_KEY;
                const displaySalary = isTw
                  ? nbaTwoWaySalaryForSeason(active.key)
                  : s.salary;
                const capPct =
                  !isTw && s.salary > 0 && active.salaryCap > 0
                    ? ((s.salary / active.salaryCap) * 100).toFixed(1)
                    : null;
                return (
                  <div key={s.key} className="flex items-center gap-2.5 py-0.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-[1px]"
                      style={{
                        backgroundColor: s.color,
                        transform: "skewX(-12deg)",
                      }}
                    />
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span
                        className={`${nameOxanium.className} truncate text-[14px] font-extrabold text-white`}
                        style={{ transform: "skewX(-8deg)" }}
                      >
                        {s.label}
                      </span>
                      {s.option && active.key !== CURRENT_NBA_SEASON_KEY ? (
                        <span
                          className={`${nameOxanium.className} shrink-0 text-[9px] font-extrabold px-1.5 py-0.5 rounded-[2px] tracking-wider`}
                          style={{
                            transform: "skewX(-8deg)",
                            backgroundColor:
                              s.option === "TO"
                                ? "rgba(255,180,0,0.18)"
                                : s.option === "PO"
                                ? "rgba(0,245,255,0.18)"
                                : "rgba(168,85,247,0.18)",
                            color:
                              s.option === "TO"
                                ? "#FFB800"
                                : s.option === "PO"
                                ? "#00F5FF"
                                : "#C084FC",
                          }}
                        >
                          {s.option === "TO"
                            ? "TEAM"
                            : s.option === "PO"
                            ? "PLAYER"
                            : s.option === "MO"
                            ? "MUTUAL"
                            : s.option}
                        </span>
                      ) : null}
                    </div>
                    <span
                      className={`${nameOxanium.className} flex items-center gap-1 text-[13px] font-bold tabular-nums text-white/75`}
                      style={{ transform: "skewX(-8deg)" }}
                    >
                      {isTw ? (
                        <span className="text-[9px] font-extrabold px-1 py-0.2 rounded-[2px] bg-white/10 text-white/60">
                          TW
                        </span>
                      ) : null}
                      {displaySalary > 0 ? formatSalaryUsd(displaySalary) : "—"}
                    </span>
                    <span
                      className={`${nameOxanium.className} w-16 text-right text-[13px] font-extrabold tabular-nums text-white`}
                      style={{ transform: "skewX(-8deg)" }}
                    >
                      {capPct !== null ? (
                        <>
                          {capPct}% <span className="text-[9px] text-white/45 font-bold">CAP</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-white/35 font-bold">—</span>
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Option Badges & Contract Legend */}
          <div className="border-t border-white/10 pt-2.5 mt-3 space-y-1.5">
            <p
              className={`${nameOxanium.className} text-[8px] font-bold uppercase tracking-[0.14em] text-white/40`}
              style={{ transform: "skewX(-6deg)" }}
            >
              {isJa ? "契約オプション / 表記凡例" : "CONTRACT OPTIONS & LEGEND"}
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              <div className="flex items-center gap-1.5">
                <span
                  className={`${nameOxanium.className} shrink-0 text-[8px] font-extrabold px-1.5 py-0.5 rounded-[2px] tracking-wider`}
                  style={{
                    transform: "skewX(-8deg)",
                    backgroundColor: "rgba(255,180,0,0.18)",
                    color: "#FFB800",
                  }}
                >
                  TEAM
                </span>
                <span className="text-[10px] text-white/55 font-medium leading-tight">
                  {isJa ? "チームオプション（球団に行使権）" : "Team Option (Club decision)"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`${nameOxanium.className} shrink-0 text-[8px] font-extrabold px-1.5 py-0.5 rounded-[2px] tracking-wider`}
                  style={{
                    transform: "skewX(-8deg)",
                    backgroundColor: "rgba(0,245,255,0.18)",
                    color: "#00F5FF",
                  }}
                >
                  PLAYER
                </span>
                <span className="text-[10px] text-white/55 font-medium leading-tight">
                  {isJa ? "プレイヤーオプション（選手に行使権）" : "Player Option (Player decision)"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`${nameOxanium.className} shrink-0 text-[8px] font-extrabold px-1.5 py-0.5 rounded-[2px] tracking-wider`}
                  style={{
                    transform: "skewX(-8deg)",
                    backgroundColor: "rgba(168,85,247,0.18)",
                    color: "#C084FC",
                  }}
                >
                  MUTUAL
                </span>
                <span className="text-[10px] text-white/55 font-medium leading-tight">
                  {isJa ? "双方合意オプション（球団・選手両方）" : "Mutual Option (Both agree)"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function DraftPicksCard({
  teamId,
  accent,
  isJa,
}: {
  teamId: string;
  accent: string;
  isJa: boolean;
}) {
  const draftCapital = useMemo(() => getNbaTeamDraftCapital(teamId), [teamId]);
  const { summary } = draftCapital;

  const [selectedPick, setSelectedPick] = useState<NbaDraftPickEntry | null>(null);

  // 柔軟性バッジの色
  const flexColor =
    summary.flexibility === "VERY HIGH" || summary.flexibility === "HIGH"
      ? "#00F5FF"
      : summary.flexibility === "MEDIUM"
      ? "#5CF0B5"
      : "#FF2D78";

  return (
    <section className="space-y-3">
      <SectionTitle
        title={isJa ? "DRAFT ASSETS (ドラフト指名権・資産)" : "DRAFT ASSETS & CAPITAL"}
        accent={accent}
      />

      {/* ① Summary (資産サマリー) */}
      <div
        className="border bg-black/60 p-3.5 space-y-3"
        style={{ borderColor: hexToRgba(accent, 0.4) }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`${nameOxanium.className} text-[11px] font-bold uppercase tracking-wider text-white/50`}
            >
              {isJa ? "ドラフト資産サマリー (2027-2033)" : "ASSETS SUMMARY (7-YEAR HORIZON)"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/40">{isJa ? "柔軟性" : "FLEXIBILITY"}</span>
            <span
              className={`${nameOxanium.className} px-2 py-0.5 text-[10px] font-extrabold border rounded-[2px]`}
              style={{
                backgroundColor: hexToRgba(flexColor, 0.15),
                borderColor: hexToRgba(flexColor, 0.6),
                color: flexColor,
                transform: "skewX(-6deg)",
              }}
            >
              {isJa ? summary.flexibilityJa : summary.flexibility}
            </span>
          </div>
        </div>

        {/* 4カードグリッド */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1巡目 */}
          <div className="bg-white/[0.03] border border-white/10 p-2.5 rounded-[2px] space-y-1">
            <p className="text-[9px] font-bold uppercase text-[#00F5FF]/80 tracking-wider">
              {isJa ? "1巡目指名権" : "1ST ROUND PICKS"}
            </p>
            <div className="flex items-baseline gap-1">
              <span className={`${nameOxanium.className} text-[20px] font-extrabold text-white`}>
                {summary.total1st}
              </span>
              <span className="text-[11px] text-white/50">{isJa ? "本" : "picks"}</span>
            </div>
            <p className="text-[9px] text-white/50">
              {isJa ? (
                <>
                  確定 <strong className="text-white font-bold">{summary.guaranteed1st}</strong> / 条件付{" "}
                  <strong className="text-[#FFB800] font-bold">{summary.conditional1st}</strong>
                </>
              ) : (
                <>
                  Guar <strong className="text-white font-bold">{summary.guaranteed1st}</strong> / Cond{" "}
                  <strong className="text-[#FFB800] font-bold">{summary.conditional1st}</strong>
                </>
              )}
            </p>
          </div>

          {/* 2巡目 */}
          <div className="bg-white/[0.03] border border-white/10 p-2.5 rounded-[2px] space-y-1">
            <p className="text-[9px] font-bold uppercase text-white/70 tracking-wider">
              {isJa ? "2巡目指名権" : "2ND ROUND PICKS"}
            </p>
            <div className="flex items-baseline gap-1">
              <span className={`${nameOxanium.className} text-[20px] font-extrabold text-white`}>
                {summary.total2nd}
              </span>
              <span className="text-[11px] text-white/50">{isJa ? "本" : "picks"}</span>
            </div>
            <p className="text-[9px] text-white/50">
              {isJa ? (
                <>
                  確定 <strong className="text-white font-bold">{summary.guaranteed2nd}</strong> / 条件付{" "}
                  <strong className="text-[#FFB800] font-bold">{summary.conditional2nd}</strong>
                </>
              ) : (
                <>
                  Guar <strong className="text-white font-bold">{summary.guaranteed2nd}</strong> / Cond{" "}
                  <strong className="text-[#FFB800] font-bold">{summary.conditional2nd}</strong>
                </>
              )}
            </p>
          </div>

          {/* スワップ権 */}
          <div className="bg-white/[0.03] border border-white/10 p-2.5 rounded-[2px] space-y-1">
            <p className="text-[9px] font-bold uppercase text-[#FFB800]/80 tracking-wider">
              {isJa ? "スワップ権利" : "SWAP RIGHTS"}
            </p>
            <div className="flex items-baseline gap-1">
              <span className={`${nameOxanium.className} text-[20px] font-extrabold text-[#FFB800]`}>
                {summary.swapRights}
              </span>
              <span className="text-[11px] text-white/50">{isJa ? "件" : "swaps"}</span>
            </div>
            <p className="text-[9px] text-white/40">{isJa ? "有利交換権" : "Favorable swap"}</p>
          </div>

          {/* 放出済み */}
          <div className="bg-white/[0.03] border border-white/10 p-2.5 rounded-[2px] space-y-1">
            <p className="text-[9px] font-bold uppercase text-[#FF2D78]/80 tracking-wider">
              {isJa ? "放出済み指名権" : "OUTGOING PICKS"}
            </p>
            <div className="flex items-baseline gap-1">
              <span className={`${nameOxanium.className} text-[20px] font-extrabold text-[#FF2D78]`}>
                {summary.outgoingPicks}
              </span>
              <span className="text-[11px] text-white/50">{isJa ? "本" : "picks"}</span>
            </div>
            <p className="text-[9px] text-white/40">{isJa ? "トレード譲渡" : "Traded away"}</p>
          </div>
        </div>
      </div>

      {/* ② Year-by-Year Timeline (年別タイムライン) */}
      <div
        className="border bg-black/60 p-3.5 space-y-3"
        style={{ borderColor: hexToRgba(accent, 0.4) }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <span className={`${nameOxanium.className} text-[11px] font-bold uppercase tracking-wider text-white/50`}>
            {isJa ? "年別タイムライン (タップで条件詳細)" : "FUTURE PICKS TIMELINE (TAP FOR DETAILS)"}
          </span>
          <div className="flex items-center gap-2 text-[8px] text-white/40">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5FF]" /> {isJa ? "自前" : "OWN"}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5CF0B5]" /> {isJa ? "取得" : "FROM"}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" /> SWAP
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B388FF]" /> {isJa ? "条件/保護" : "PROT"}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D78]" /> {isJa ? "放出" : "OUT"}
            </span>
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {draftCapital.years.map((y) => {
            return (
              <div key={y.year} className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start gap-2.5">
                {/* 年表示 */}
                <div className="w-14 shrink-0 pt-1">
                  <span
                    className={`${nameOxanium.className} text-[16px] font-extrabold text-white flex items-center gap-1`}
                    style={{ transform: "skewX(-6deg)" }}
                  >
                    {y.year}
                  </span>
                </div>

                {/* 1st & 2nd Rounds */}
                <div className="flex-1 space-y-2">
                  {/* 1巡目 (1ST ROUND) */}
                  <div className="flex items-start gap-2">
                    <span
                      className={`${nameOxanium.className} text-[10px] font-extrabold text-[#00F5FF] w-7 pt-1 shrink-0`}
                    >
                      1ST
                    </span>
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {y.firstRound.length === 0 ? (
                        <span className="text-[10px] text-white/25 italic py-0.5">
                          {isJa ? "保有なし" : "None"}
                        </span>
                      ) : (
                        y.firstRound.map((p) => {
                          const badge = renderPickBadge(p, isJa, () => setSelectedPick(p));
                          return badge;
                        })
                      )}
                    </div>
                  </div>

                  {/* 2巡目 (2ND ROUND) */}
                  <div className="flex items-start gap-2">
                    <span
                      className={`${nameOxanium.className} text-[10px] font-extrabold text-white/40 w-7 pt-1 shrink-0`}
                    >
                      2ND
                    </span>
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {y.secondRound.length === 0 ? (
                        <span className="text-[10px] text-white/25 italic py-0.5">
                          {isJa ? "保有なし" : "None"}
                        </span>
                      ) : (
                        y.secondRound.map((p) => {
                          const badge = renderPickBadge(p, isJa, () => setSelectedPick(p));
                          return badge;
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ③ タップで開く詳細モーダル */}
      {selectedPick && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedPick(null)}
        >
          <div
            className="w-full max-w-md bg-[#0c0d14] border border-[#00F5FF]/50 p-5 space-y-4 shadow-[0_0_30px_rgba(0,245,255,0.2)] rounded-[2px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <p className={`${nameOxanium.className} text-[11px] font-bold text-[#00F5FF] uppercase tracking-wider`}>
                  {selectedPick.year} NBA DRAFT • {selectedPick.round === 1 ? "1ST ROUND" : "2ND ROUND"}
                </p>
                <h3 className={`${nameOxanium.className} text-[18px] font-extrabold text-white mt-0.5`}>
                  {isJa ? selectedPick.detailsJa ?? selectedPick.detailsEn : selectedPick.detailsEn ?? selectedPick.detailsJa}
                </h3>
              </div>
              <button
                type="button"
                className="text-white/50 hover:text-white p-1 text-[16px] leading-none"
                onClick={() => setSelectedPick(null)}
              >
                ✕
              </button>
            </div>

            {/* Badges / Meta */}
            <div className="flex flex-wrap gap-2 text-[10px]">
              {selectedPick.badgeType && (
                <span className="px-2 py-0.5 font-bold uppercase rounded-[2px] bg-white/10 text-white border border-white/20">
                  {selectedPick.badgeType === "own"
                    ? isJa ? "自前指名権" : "OWN PICK"
                    : selectedPick.badgeType === "from"
                    ? isJa ? `獲得 (via ${selectedPick.fromTeamId ?? ""})` : `VIA ${selectedPick.fromTeamId ?? ""}`
                    : selectedPick.badgeType === "swap"
                    ? isJa ? `スワップ権 (${selectedPick.swapWithTeamId ?? ""})` : `SWAP (${selectedPick.swapWithTeamId ?? ""})`
                    : selectedPick.badgeType === "prot"
                    ? isJa ? "プロテクト付き" : "PROTECTED"
                    : selectedPick.badgeType === "outgoing"
                    ? isJa ? `放出済み (to ${selectedPick.toTeamId ?? ""})` : `OUTGOING (to ${selectedPick.toTeamId ?? ""})`
                    : isJa ? "条件付き" : "CONDITIONAL"}
                </span>
              )}

              {selectedPick.protection && (
                <span className="px-2 py-0.5 font-bold text-[#FFB800] rounded-[2px] bg-[#FFB800]/10 border border-[#FFB800]/30">
                  {selectedPick.protection}
                </span>
              )}
            </div>

            {/* Conditions List */}
            <div className="space-y-2 bg-white/[0.02] border border-white/[0.06] p-3 rounded-[2px]">
              <p className="text-[10px] font-bold uppercase text-white/40 tracking-wider">
                {isJa ? "行使条件・保護ルール" : "CONDITIONS & CONVEYANCE"}
              </p>
              {selectedPick.conditionsJa && selectedPick.conditionsJa.length > 0 ? (
                <ul className="space-y-1.5 text-[12px] text-white/80">
                  {(isJa ? selectedPick.conditionsJa : selectedPick.conditionsEn ?? selectedPick.conditionsJa).map(
                    (c, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#00F5FF] mt-0.5">•</span>
                        <span>{c}</span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-[12px] text-white/70">
                  {isJa
                    ? selectedPick.detailsJa ?? "追加のプロテクション条件はありません（確定）"
                    : selectedPick.detailsEn ?? "No additional protection conditions (guaranteed)."}
                </p>
              )}
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                type="button"
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-[12px] rounded-[2px] border border-white/20 transition-colors"
                onClick={() => setSelectedPick(null)}
              >
                {isJa ? "閉じる" : "CLOSE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function renderPickBadge(
  p: NbaDraftPickEntry,
  isJa: boolean,
  onClick: () => void
) {
  const badgeType = p.badgeType ?? "own";
  const isOutgoing = p.kind === "outgoing" || p.isOutgoing || badgeType === "outgoing";
  const isSwap = p.kind.startsWith("swap") || p.isSwap || badgeType === "swap";
  const isProt = badgeType === "prot" || (p.protection && p.protection.toLowerCase() !== "unprotected");
  const isFrom = badgeType === "from" || (!isSwap && !isProt && !isOutgoing && !!p.fromTeamId);

  let bg = "rgba(0,245,255,0.08)";
  let border = "rgba(0,245,255,0.35)";
  let color = "#00F5FF";
  let tagBg = "rgba(0,245,255,0.2)";
  let tagText = isJa ? "自前" : "OWN";

  if (isOutgoing) {
    bg = "rgba(255,45,120,0.06)";
    border = "rgba(255,45,120,0.3)";
    color = "#FF2D78";
    tagBg = "rgba(255,45,120,0.2)";
    tagText = isJa ? "放出" : "OUT";
  } else if (isSwap) {
    bg = "rgba(255,184,0,0.08)";
    border = "rgba(255,184,0,0.4)";
    color = "#FFB800";
    tagBg = "rgba(255,184,0,0.2)";
    tagText = "SWAP";
  } else if (isProt) {
    bg = "rgba(179,136,255,0.08)";
    border = "rgba(179,136,255,0.4)";
    color = "#B388FF";
    tagBg = "rgba(179,136,255,0.2)";
    tagText = p.protectionTag ?? (isJa ? "プロテクト" : "PROT");
  } else if (isFrom) {
    bg = "rgba(92,240,181,0.08)";
    border = "rgba(92,240,181,0.4)";
    color = "#5CF0B5";
    tagBg = "rgba(92,240,181,0.2)";
    tagText = p.fromTeamId ? `FROM ${p.fromTeamId}` : isJa ? "取得" : "FROM";
  }

  const label = isJa
    ? p.shortLabelJa ?? p.detailsJa ?? p.detailsEn
    : p.shortLabelEn ?? p.detailsEn ?? p.detailsJa;

  return (
    <button
      key={p.id}
      type="button"
      onClick={onClick}
      className={`${nameOxanium.className} inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold border rounded-[2px] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer`}
      style={{
        backgroundColor: bg,
        borderColor: border,
        color: color,
        textDecoration: isOutgoing ? "line-through" : "none",
        opacity: isOutgoing ? 0.65 : 1,
      }}
    >
      <span
        className="px-1 py-0.2 text-[8px] font-extrabold rounded-[1px] shrink-0"
        style={{ backgroundColor: tagBg, color: color }}
      >
        {tagText}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function NbaTeamDetailPanel({
  teamId,
  language = "ja",
}: Props) {
  const router = useRouter();
  const isJa = language === "ja";
  const { bundle } = useLeagueTeamStatsBundle();
  const baseDetail = useMemo(
    () => getNbaTeamDetailPreview(teamId, bundle),
    [teamId, bundle]
  );
  const { detail, hasFetchError } = useNbaTeamDetailLiveOverlay({
    teamId: baseDetail.teamId,
    base: baseDetail,
  });
  const jerseyPrimary = getTeamJerseyPrimaryColor("nba", detail.teamId);
  const secondary = getTeamJerseySecondaryColor("nba", detail.teamId);
  const accent = getTeamUiAccentColor("nba", detail.teamId);
  const frame = hexToRgba(accent, 0.4);
  const winPct = detail.season.winPct.toFixed(3).replace(/^0/, "");
  const confLine =
    detail.conference === "east"
      ? "EASTERN CONFERENCE"
      : "WESTERN CONFERENCE";
  const seasonMetrics = detail.metrics.season;
  const byId = new Map(seasonMetrics.map((m) => [m.id, m]));
  const last10 = recentFormRecord(detail.recentGames);
  return (
    <div className="space-y-4 pb-24 text-white">
      {hasFetchError ? (
        <div
          className="border px-3 py-2 text-[11px] font-bold tracking-wide text-white/70"
          style={{ borderColor: "rgba(255,255,255,0.2)" }}
        >
          {isJa
            ? "一部データの取得に失敗しました。表示が古い／空の可能性があります。"
            : "Some live data failed to load. Parts may be empty or stale."}
        </div>
      ) : null}
      <div
        className="space-y-3.5 border bg-[#050808] p-3"
        style={{ borderColor: accent }}
      >
        <div className="flex items-start gap-3.5">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            <HalftoneJerseyMark
              accent={jerseyPrimary}
              accentEnd={secondary}
              className="h-14 w-14"
              glow="soft"
            />
          </div>
          <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p
                className={`${nameOxanium.className} mb-1 truncate text-[9px] font-bold uppercase tracking-[0.12em]`}
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                {confLine}
              </p>
              <p
                className={`${nameOxanium.className} text-[12px] font-bold uppercase tracking-[0.18em] text-white/55`}
                style={{ transform: "skewX(-6deg)" }}
              >
                {detail.cityEn.toUpperCase()}
              </p>
              <p
                className={`${nameBebas.className} text-[26px] uppercase leading-none text-white`}
                style={teamNickTy}
              >
                {detail.nickEn.toUpperCase()}
              </p>
            </div>
            <TeamHeroStreakBadge
              streak={detail.streak}
              last10={last10}
              isJa={isJa}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <div
            className="flex-1 space-y-1 border bg-black/40 px-3 py-2.5"
            style={{ borderColor: frame }}
          >
            <p className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em] text-white/40`}>
              Record
            </p>
            <p className={`${nameOxanium.className} text-[22px] font-extrabold`} style={{ transform: "skewX(-8deg)" }}>
              {detail.season.wins}-{detail.season.losses}{" "}
              <span className="text-[13px] text-white">
                {winPct}
              </span>
            </p>
          </div>
          <div
            className="flex-1 space-y-1 border bg-black/40 px-3 py-2.5"
            style={{ borderColor: frame }}
          >
            <p className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em] text-white/40`}>
              Rank
            </p>
            <p className={`${nameOxanium.className} text-[22px] font-extrabold`} style={{ color: "#FFFFFF", transform: "skewX(-8deg)" }}>
              #{String(detail.conferenceRank).padStart(2, "0")}{" "}
              <span className="text-[13px] text-white/55">Seed</span>
            </p>
          </div>
        </div>
      </div>

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(accent, 0.22) }}
      />

      <Injuries injuries={detail.injuries} accent={accent} isJa={isJa} />

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(accent, 0.22) }}
      />

      <PerformanceMetrics
        ortg={byId.get("ortg")}
        drtg={byId.get("drtg")}
        accent={accent}
      />

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(accent, 0.22) }}
      />

      <HowTheyPlayBoard
        teamId={detail.teamId}
        accent={accent}
        isJa={isJa}
        bundle={bundle}
      />

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(accent, 0.22) }}
      />

      <div
        className="border bg-black/40 p-3"
        style={{ borderColor: frame }}
      >
        <RecentForm
          games={detail.recentGames}
          streak={detail.streak}
          accent={accent}
          isJa={isJa}
        />
      </div>

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(accent, 0.22) }}
      />

      <GameLogs games={detail.recentGames} accent={accent} isJa={isJa} />

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(accent, 0.22) }}
      />

      <HeadToHead rows={detail.headToHead} accent={accent} isJa={isJa} />

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(accent, 0.22) }}
      />

      <Upcoming games={detail.upcomingGames} accent={accent} isJa={isJa} />

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(accent, 0.22) }}
      />

      <section className="space-y-2.5">
        <SectionTitle title="SPLITS" accent={accent} />
        <div className="flex gap-2">
          <SplitCard
            label="HOME"
            wins={detail.homeAwaySplit.home.wins}
            losses={detail.homeAwaySplit.home.losses}
            accent={accent}
          />
          <SplitCard
            label="AWAY"
            wins={detail.homeAwaySplit.away.wins}
            losses={detail.homeAwaySplit.away.losses}
            accent={accent}
          />
        </div>
        <div className="flex gap-2">
          <SplitCard
            label="VS EAST"
            wins={detail.conferenceSplit.vsEast.wins}
            losses={detail.conferenceSplit.vsEast.losses}
            labelColor="#EF3B24"
            accent={accent}
          />
          <SplitCard
            label="VS WEST"
            wins={detail.conferenceSplit.vsWest.wins}
            losses={detail.conferenceSplit.vsWest.losses}
            labelColor="#007AC1"
            accent={accent}
          />
        </div>
        <div className="flex gap-2">
          <SplitCard
            label="VS .500+"
            wins={detail.strengthSplit.vsOver500.wins}
            losses={detail.strengthSplit.vsOver500.losses}
            accent={accent}
          />
          <SplitCard
            label="VS SUB-.500"
            wins={detail.strengthSplit.vsUnder500.wins}
            losses={detail.strengthSplit.vsUnder500.losses}
            accent={accent}
          />
        </div>
      </section>

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(accent, 0.22) }}
      />

      <PayrollCard
        payroll={detail.payroll}
        rosterBlock={detail.rosterBlock}
        accent={accent}
        isJa={isJa}
      />

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(accent, 0.22) }}
      />

      <DraftPicksCard teamId={detail.teamId} accent={accent} isJa={isJa} />

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(accent, 0.22) }}
      />

      <section className="space-y-2.5">
        <SectionTitle title="ROSTER" accent={accent} />
        <div
          className="border bg-black/40 p-2"
          style={{ borderColor: frame }}
        >
          <NbaTeamRosterCard
            block={detail.rosterBlock}
            onPlayerClick={(player) =>
              router.push(
                `/mobile/player-detail-preview?playerId=${encodeURIComponent(String(player.id))}`
              )
            }
          />
        </div>
      </section>

      <p
        className={`${nameOxanium.className} text-center text-[9px] font-bold uppercase tracking-[0.14em]`}
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        {detail.asOfLabel} · PREVIEW
      </p>
    </div>
  );
}
