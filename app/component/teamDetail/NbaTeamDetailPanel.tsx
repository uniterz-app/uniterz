"use client";

import { useMemo, useState } from "react";
import { nameOxanium } from "@/lib/fonts";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import { CyberSlantedSegBar } from "@/app/component/rankings/CyberSlantedSegBar";
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
  type NbaTeamOpponentAllowedMetric,
  type NbaTeamPayroll,
  type NbaTeamRecentGame,
  type NbaTeamStreak,
  type NbaTeamUpcomingGame,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";

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
          className="flex items-center gap-1.5 px-2.5 py-2"
          style={{ borderBottom: `1px solid ${hexToRgba(accent, 0.12)}` }}
        >
          <span className={`${nameOxanium.className} w-9 text-[9px] font-bold uppercase tracking-wide text-white/40`}>Date</span>
          <span className={`${nameOxanium.className} flex-1 text-[9px] font-bold uppercase tracking-wide text-white/40`}>Game</span>
          <span className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-wide text-white/40`}>Score</span>
          <span className="w-4" />
        </div>
        {list.map((g, i) => (
          <div
            key={`${g.dateLabel}-${g.oppAbbr}-${i}`}
            className="flex items-center gap-1.5 px-2.5 py-2"
            style={
              i < list.length - 1
                ? { borderBottom: `1px solid ${hexToRgba(accent, 0.12)}` }
                : undefined
            }
          >
            <span className={`${nameOxanium.className} w-9 text-[11px] text-white/40`}>
              {g.dateLabel}
            </span>
            <span className={`${nameOxanium.className} flex-1 truncate text-[12px] font-bold`}>
              {g.home ? "vs" : "@"} {g.oppAbbr}
            </span>
            <span className={`${nameOxanium.className} text-[12px] font-bold tabular-nums`} style={{ transform: "skewX(-6deg)" }}>
              {g.teamScore}-{g.oppScore}
            </span>
            <span
              className={`${nameOxanium.className} w-4 text-right text-[12px] font-extrabold`}
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
      <SectionTitle title="Injuries" accent={accent} />
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

function OpponentStats({
  metrics,
  accent,
  isJa,
}: {
  metrics: NbaTeamOpponentAllowedMetric[];
  accent: string;
  isJa: boolean;
}) {
  const [selectedId, setSelectedId] = useState(metrics[0]?.id ?? null);
  const selected =
    metrics.find((m) => m.id === selectedId) ?? metrics[0] ?? null;

  return (
    <section className="space-y-2.5">
      <SectionTitle title="Opponents Stats" accent={accent} />
      <p
        className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.12em] text-white/40`}
        style={{ transform: "skewX(-6deg)" }}
      >
        Allowed
      </p>
      <p className={`${nameOxanium.className} text-[10px] leading-snug text-white/45`}>
        {isJa
          ? "相手に許したスタッツ（TOV は誘発数）。順位は #1 が最良。"
          : "What opponents average vs this team (TOV = forced). Rank #1 is best."}
      </p>
      <div
        className="grid grid-cols-3 overflow-hidden border bg-black/50"
        style={{ borderColor: hexToRgba(accent, 0.4) }}
      >
        {metrics.map((m) => {
          const active = selected?.id === m.id;
          const dirLabel = m.lowerIsBetter
            ? isJa
              ? "↓ 低ほど良"
              : "↓ lower"
            : isJa
              ? "↑ 高ほど良"
              : "↑ higher";
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedId(m.id)}
              className="space-y-0.5 px-2.5 py-3 text-left transition-colors"
              style={{
                borderBottom: `1px solid ${hexToRgba(accent, 0.15)}`,
                borderRight: `1px solid ${hexToRgba(accent, 0.15)}`,
                backgroundColor: active
                  ? hexToRgba(accent, 0.08)
                  : undefined,
              }}
              aria-pressed={active}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-wider text-white/40`}
                  style={{ transform: "skewX(-6deg)" }}
                >
                  {m.short}
                </span>
                <span
                  className={`${nameOxanium.className} text-[12px] font-extrabold tabular-nums`}
                  style={{
                    color:
                      m.leagueRank <= 10 ? accent : "rgba(255,255,255,0.35)",
                    transform: "skewX(-8deg)",
                  }}
                >
                  #{m.leagueRank}
                </span>
              </div>
              <p
                className={`${nameOxanium.className} text-[18px] font-extrabold tabular-nums`}
                style={{ transform: "skewX(-8deg)" }}
              >
                {m.display}
              </p>
              <p
                className={`${nameOxanium.className} text-[9px] font-bold tracking-wide`}
                style={{
                  color: m.lowerIsBetter
                    ? "rgba(59,160,255,0.75)"
                    : "rgba(92,240,181,0.8)",
                  transform: "skewX(-6deg)",
                }}
              >
                {dirLabel}
              </p>
            </button>
          );
        })}
      </div>
      {selected ? (
        <p className={`${nameOxanium.className} text-[10px] leading-snug text-white/50`}>
          {isJa ? selected.hintJa : selected.hintEn}
        </p>
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
      <SectionTitle title="Performance Metrics" accent={accent} />
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
                Offensive Rating
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
                Defensive Rating
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
      <SectionTitle title="Upcoming" accent={accent} />
      <div
        className="overflow-hidden border bg-black/40"
        style={{ borderColor: hexToRgba(accent, 0.3) }}
      >
        {games.map((g, i) => (
          <div
            key={`${g.dateLabel}-${g.oppAbbr}-${i}`}
            className="flex items-center gap-1.5 px-2.5 py-2"
            style={
              i < games.length - 1
                ? { borderBottom: `1px solid ${hexToRgba(accent, 0.12)}` }
                : undefined
            }
          >
            <span className={`${nameOxanium.className} w-9 text-[11px] text-white/40`}>
              {g.dateLabel}
            </span>
            <span className={`${nameOxanium.className} flex-1 truncate text-[12px] font-bold`}>
              {g.home ? "vs" : "@"} {g.oppAbbr}
            </span>
            <span
              className={`${nameOxanium.className} text-[12px] font-bold`}
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
      <SectionTitle title="Payroll" accent={accent} />
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
        <div className="space-y-1.5">
          {slices.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-[1px]"
                style={{
                  backgroundColor: s.color,
                  transform: "skewX(-12deg)",
                }}
              />
              <span
                className={`${nameOxanium.className} min-w-0 flex-1 truncate text-[11px] font-bold text-white/85`}
                style={{ transform: "skewX(-8deg)" }}
              >
                {s.label}
              </span>
              <span
                className={`${nameOxanium.className} text-[11px] font-bold tabular-nums text-white/70`}
                style={{ transform: "skewX(-8deg)" }}
              >
                {formatSalaryUsd(s.salary)}
              </span>
              <span
                className={`${nameOxanium.className} w-9 text-right text-[11px] font-extrabold tabular-nums`}
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

const ADV_IDS = [
  "ppg",
  "papg",
  "pace",
  "efgPct",
  "fg3Pct",
  "fg3a",
  "netrtg",
  "diff",
  "tovPct",
] as const;

/** Team Detail 叩き台（モック）— カード区切り + チームカラー */
export default function NbaTeamDetailPanel({
  teamId,
  language = "ja",
}: Props) {
  const isJa = language === "ja";
  const detail = useMemo(() => getNbaTeamDetailPreview(teamId), [teamId]);
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
  const advCells = ADV_IDS.map((id) => byId.get(id)).filter(
    (m): m is NbaTeamMetricWithRank => Boolean(m)
  );

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
              className="h-11 w-11"
              glow="soft"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`${nameOxanium.className} mb-1 truncate text-[9px] font-bold uppercase tracking-[0.12em]`}
              style={{ color: hexToRgba(accent, 0.85) }}
            >
              {confLine} · {detail.divisionLabelEn.toUpperCase()} DIVISION
            </p>
            <p className={`${nameOxanium.className} text-[12px] font-bold uppercase tracking-wide text-white/55`}>
              {detail.cityEn}
            </p>
            <p
              className={`${nameOxanium.className} text-[24px] font-extrabold uppercase`}
              style={{ transform: "skewX(-6deg)" }}
            >
              {detail.nickEn}
            </p>
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
              #{String(detail.conferenceRank).padStart(2, "0")}
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

      <section className="space-y-2.5">
        <SectionTitle title="Advanced Metrics" accent={accent} />
        <div
          className="grid grid-cols-3 overflow-hidden border bg-black/50"
          style={{ borderColor: hexToRgba(accent, 0.4) }}
        >
          {advCells.map((m) => (
            <div
              key={m.id}
              className="px-2.5 py-3"
              style={{
                borderBottom: `1px solid ${hexToRgba(accent, 0.15)}`,
                borderRight: `1px solid ${hexToRgba(accent, 0.15)}`,
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-wider text-white/40`}>
                  {m.short}
                </span>
                <span
                  className={`${nameOxanium.className} text-[12px] font-extrabold tabular-nums`}
                  style={{
                    color:
                      m.leagueRank <= 10 ? accent : "rgba(255,255,255,0.35)",
                  }}
                >
                  #{m.leagueRank}
                </span>
              </div>
              <p className={`${nameOxanium.className} mt-1 text-[18px] font-extrabold tabular-nums`}>
                {m.display}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div
        className="h-px"
        style={{ backgroundColor: hexToRgba(accent, 0.22) }}
      />

      <OpponentStats
        metrics={detail.opponentStats}
        accent={accent}
        isJa={isJa}
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

      <PayrollCard payroll={detail.payroll} accent={accent} isJa={isJa} />

      <p
        className={`${nameOxanium.className} text-center text-[9px] font-bold uppercase tracking-[0.14em]`}
        style={{ color: hexToRgba(accent, 0.4) }}
      >
        {detail.asOfLabel} · Preview
      </p>
    </div>
  );
}
