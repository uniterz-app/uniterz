"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  formatStreakLabel,
  getNbaTeamDetailPreview,
  payrollDisplaySlices,
  type NbaTeamInjuryEntry,
  type NbaTeamMetricWithRank,
  type NbaTeamPayroll,
  type NbaTeamRecentGame,
  type NbaTeamStreak,
  type NbaTeamUpcomingGame,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";
import { useLeagueTeamStatsBundle } from "@/lib/nba/useLeagueTeamStatsBundle";
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
        style={{ color: labelColor ?? hexToRgba(accent, 0.75) }}
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
        className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em]`}
        style={{ color: hexToRgba(accent, 0.75) }}
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
}: {
  games: NbaTeamRecentGame[];
  streak: NbaTeamStreak;
  accent: string;
}) {
  const results = games.slice(-10).map((g) => g.result);
  const wins = results.filter((r) => r === "W").length;
  const streakWin = streak.kind === "W";

  return (
    <div className="space-y-2.5">
      <div className="flex w-full items-center gap-2">
        <span
          className={`${nameOxanium.className} flex-1 text-left text-[10px] font-bold uppercase tracking-[0.16em]`}
          style={{ color: hexToRgba(accent, 0.75) }}
        >
          Recent Form (Last 10)
        </span>
        <span
          className={`${nameOxanium.className} text-[13px] font-black`}
          style={{
            color: streakWin ? FORM_WIN : FORM_LOSS,
            transform: "skewX(-8deg)",
          }}
        >
          {formatStreakLabel(streak)}
        </span>
      </div>
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

function GameLogs({
  games,
  accent,
}: {
  games: NbaTeamRecentGame[];
  accent: string;
}) {
  const list = [...games].slice(-10).reverse();
  return (
    <section className="space-y-2.5">
      <SectionTitle title={`Game Logs (Last ${list.length})`} accent={accent} />
      <div
        className="overflow-hidden border bg-black/40"
        style={{ borderColor: hexToRgba(accent, 0.3) }}
      >
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
            {isJa ? "欠場者なし" : "No injuries"}
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

function rankTone(rank: number, accent: string): string {
  return rank <= 10 ? accent : "rgba(255,255,255,0.35)";
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
        style={{ color: rankTone(rank, accent) }}
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
                    style={{ color: rankTone(row.own.rank, accent) }}
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
                    style={{ color: rankTone(row.opp.rank, accent) }}
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

      {tab === "shooting" ? (
        <div className="space-y-3.5 border bg-black/40 px-3 py-3" style={{ borderColor: frame }}>
          {board.shooting.map((row) => (
            <div key={row.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`${nameOxanium.className} min-w-0 flex-1 text-[12px] font-bold uppercase tracking-wide text-white/88`}>
                  {isJa ? row.labelJa : row.labelEn}
                </span>
                <HowPtsCol display={row.pts.display} />
                <MetricStack
                  display={row.cell.display}
                  rank={row.cell.rank}
                  accent={accent}
                />
              </div>
              <CyberSlantedSegBar
                pct={leagueRankSegPct(row.cell.rank)}
                segments={LEAGUE_RANK_SEGMENTS}
                compact
                accent={{
                  border: accent,
                  glow: hexToRgba(accent, 0.34),
                  bg: accent,
                }}
                forceStatic
              />
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
                  style={{ color: rankTone(row.cell.rank, accent) }}
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
}: {
  games: NbaTeamUpcomingGame[];
  accent: string;
}) {
  if (games.length === 0) return null;
  return (
    <section className="space-y-2.5">
      <SectionTitle title="UPCOMING" accent={accent} />
      <div
        className="overflow-hidden border bg-black/40"
        style={{ borderColor: hexToRgba(accent, 0.3) }}
      >
        {games.map((g, i) => (
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
              style={{ color: hexToRgba(accent, 0.85) }}
            >
              {g.tipLabel}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PayrollCard({
  payroll,
  accent,
  isJa,
}: {
  payroll: NbaTeamPayroll;
  accent: string;
  isJa: boolean;
}) {
  const overCap = payroll.capSpace < 0;
  const slices = payrollDisplaySlices(payroll.lines, accent, 5);
  return (
    <section className="space-y-2.5">
      <SectionTitle title="PAYROLL" accent={accent} />
      <div
        className="space-y-2 border bg-black/45 p-3.5"
        style={{ borderColor: hexToRgba(accent, 0.45) }}
      >
        <div className="flex items-end justify-between">
          <div>
            <p
              className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em] text-white/40`}
              style={{ transform: "skewX(-8deg)" }}
            >
              {isJa ? "総年俸" : "Total"}
            </p>
            <p
              className={`${nameOxanium.className} text-[26px] font-extrabold`}
              style={{ transform: "skewX(-8deg)" }}
            >
              {formatSalaryUsd(payroll.totalSalary)}
            </p>
          </div>
          <div className="text-right">
            <p
              className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.14em] text-white/40`}
              style={{ transform: "skewX(-8deg)" }}
            >
              Rank
            </p>
            <p
              className={`${nameOxanium.className} text-[22px] font-extrabold`}
              style={{ color: accent, transform: "skewX(-8deg)" }}
            >
              #{payroll.leagueRank}
            </p>
          </div>
        </div>
        <p className={`${nameOxanium.className} text-[11px] font-bold uppercase tracking-wide text-white/60`}>
          CAP {formatSalaryUsd(payroll.salaryCap)} · TAX LINE{" "}
          {formatSalaryUsd(payroll.taxLine)}
        </p>
        <p
          className={`${nameOxanium.className} text-[12px] font-extrabold`}
          style={{
            color: overCap ? FORM_LOSS : BAR_OFFENSE,
            transform: "skewX(-6deg)",
          }}
        >
          {isJa ? "キャップ余裕" : "CAP SPACE"}{" "}
          {overCap ? "" : "+"}
          {formatSalaryUsd(payroll.capSpace)}
          {payroll.taxBill > 0
            ? `  ·  TAX ${formatSalaryUsd(payroll.taxBill)}`
            : ""}
        </p>
        <p
          className={`${nameOxanium.className} text-[12px] font-extrabold`}
          style={{ color: accent, transform: "skewX(-6deg)" }}
        >
          {isJa ? "保証額" : "GUARANTEED"}{" "}
          {formatSalaryUsd(payroll.guaranteed)}
        </p>

        <p
          className={`${nameOxanium.className} pt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/45`}
          style={{ transform: "skewX(-6deg)" }}
        >
          {isJa ? "選手内訳" : "By Player"}
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
        <div className="space-y-2.5">
          {slices.map((s) => (
            <div key={s.key} className="flex items-center gap-2.5 py-0.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[1px]"
                style={{
                  backgroundColor: s.color,
                  transform: "skewX(-12deg)",
                }}
              />
              <span
                className={`${nameOxanium.className} min-w-0 flex-1 truncate text-[14px] font-extrabold text-white/90`}
                style={{ transform: "skewX(-8deg)" }}
              >
                {s.label}
              </span>
              <span
                className={`${nameOxanium.className} text-[13px] font-bold tabular-nums text-white/70`}
                style={{ transform: "skewX(-8deg)" }}
              >
                {formatSalaryUsd(s.salary)}
              </span>
              <span
                className={`${nameOxanium.className} w-10 text-right text-[13px] font-extrabold tabular-nums`}
                style={{ color: accent, transform: "skewX(-8deg)" }}
              >
                {Math.round(s.share * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function NbaTeamDetailPanel({
  teamId,
  language = "ja",
}: Props) {
  const router = useRouter();
  const isJa = language === "ja";
  const { bundle } = useLeagueTeamStatsBundle();
  const detail = useMemo(
    () => getNbaTeamDetailPreview(teamId, bundle),
    [teamId, bundle]
  );
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
                style={{ color: hexToRgba(accent, 0.85) }}
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
              <span className="text-[13px]" style={{ color: accent }}>
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
            <p className={`${nameOxanium.className} text-[22px] font-extrabold`} style={{ color: accent, transform: "skewX(-8deg)" }}>
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
        />
      </div>

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(accent, 0.22) }}
      />

      <GameLogs games={detail.recentGames} accent={accent} />

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(accent, 0.22) }}
      />

      <Upcoming games={detail.upcomingGames} accent={accent} />

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
      </section>

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(accent, 0.22) }}
      />

      <PayrollCard payroll={detail.payroll} accent={accent} isJa={isJa} />

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
        style={{ color: hexToRgba(accent, 0.4) }}
      >
        {detail.asOfLabel} · PREVIEW
      </p>
    </div>
  );
}
