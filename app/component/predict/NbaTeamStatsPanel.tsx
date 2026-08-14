"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ROW_STAGGER,
  SymmetricalCompareRow,
  barPctDiffNorm,
  barPctMaxNorm,
  barPctMinPaNorm,
} from "@/app/component/predict/teamStatsCompare";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import type {
  NbaTeamStatSide,
  NbaTeamStatsBundle,
} from "@/lib/predict/nbaTeamStatsPreviewMocks";
import { metricDelta } from "@/lib/predict/nbaTeamStatsForm";
import { nbaTeamDetailPreviewHref } from "@/lib/predict/nbaTeamDetailHref";
import { nameBebas, nameOxanium } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { getMobileTeamName } from "@/lib/team-name-split-mobile";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type WindowId = "season" | "last10";

type Props = {
  data: NbaTeamStatsBundle;
  /** Pro: SZN± 差分 + #順位（LAST 10） */
  isPro?: boolean;
  language?: Language;
  className?: string;
};

function fmtRank(rank: number | undefined): string | null {
  if (rank == null || rank < 1 || !Number.isFinite(rank)) return null;
  return `#${Math.round(rank)}`;
}

function fmtDiff(d: number): string {
  return `${d > 0 ? "+" : ""}${d.toFixed(1)}`;
}

function winPct(w: number, l: number): number {
  const n = w + l;
  return n > 0 ? (100 * w) / n : 0;
}

function teamLabel(teamId: string, fallback: string): string {
  const full = NBA_TEAM_NAME_BY_ID[teamId];
  if (full) return getMobileTeamName("nba", full).toUpperCase();
  return fallback.toUpperCase();
}

function FormResultChip({
  result,
  index,
  total,
}: {
  result: "W" | "L";
  index: number;
  total: number;
}) {
  const win = result === "W";
  const fill = win ? "#00F5FF" : "#FF2D78";
  const last = total > 0 && index === total - 1;
  /** 古い→新しい：0.34 → 1.0 */
  const t = total <= 1 ? 1 : index / (total - 1);
  const opacity = 0.34 + t * 0.66;
  const glow = win ? "rgba(0,245,255," : "rgba(255,45,120,";

  return (
    <span
      className={[
        nameOxanium.className,
        "relative inline-grid h-[15px] w-full min-w-0 flex-1 place-items-center overflow-visible",
        "text-[7px] font-black leading-none text-[#050508] md:h-[17px] md:text-[8px]",
        last ? "z-[1]" : "",
      ].join(" ")}
      style={{
        background: fill,
        opacity,
        transform: "skewX(-12deg)",
        boxShadow: last
          ? `0 0 0 1px rgba(255,255,255,0.92), 0 0 10px ${glow}0.72)`
          : `0 0 6px ${glow}${0.18 + t * 0.2})`,
      }}
      aria-label={
        last
          ? win
            ? "Win, most recent"
            : "Loss, most recent"
          : win
            ? "Win"
            : "Loss"
      }
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.16) 2px,
            rgba(0, 0, 0, 0.16) 3px
          )`,
        }}
      />
      <span className="relative z-[1]" style={{ transform: "skewX(12deg)" }}>
        {result}
      </span>
    </span>
  );
}

function FormResultsStrip({
  left,
  right,
}: {
  left: Array<"W" | "L">;
  right: Array<"W" | "L">;
}) {
  const leftWins = left.filter((r) => r === "W").length;
  const rightWins = right.filter((r) => r === "W").length;

  return (
    <div className="border-b border-white/8 py-1.5 last:border-b-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-0.5 gap-y-0.5 md:gap-x-1.5">
        {/* HOME: セグメント同様・中央（右）→外側（左）＝古い→新しい */}
        <div className="flex min-w-0 flex-row-reverse gap-px">
          {left.map((r, i) => (
            <FormResultChip
              key={`l-${i}`}
              result={r}
              index={i}
              total={left.length}
            />
          ))}
        </div>
        <div
          className={[
            nameOxanium.className,
            "w-14 shrink-0 px-0 text-center text-[8px] font-bold uppercase tracking-[0.1em] text-white/70 md:w-16 md:text-[10px] md:tracking-[0.12em]",
          ].join(" ")}
        >
          L10
        </div>
        {/* AWAY: 中央（左）→外側（右）＝古い→新しい */}
        <div className="flex min-w-0 gap-px">
          {right.map((r, i) => (
            <FormResultChip
              key={`r-${i}`}
              result={r}
              index={i}
              total={right.length}
            />
          ))}
        </div>

        <p
          className={[
            nameOxanium.className,
            "text-right text-[11px] font-extrabold tabular-nums tracking-wide text-white/65 md:text-[12px]",
          ].join(" ")}
        >
          {leftWins}-{left.length - leftWins}
        </p>
        <p
          className={[
            nameOxanium.className,
            "w-14 shrink-0 px-0 text-center text-[7px] font-extrabold uppercase tracking-[0.04em] text-white/40 md:w-16 md:text-[8px] md:tracking-[0.06em]",
          ].join(" ")}
          title="Oldest near center → newest outward"
        >
          ←NEW→
        </p>
        <p
          className={[
            nameOxanium.className,
            "text-left text-[11px] font-extrabold tabular-nums tracking-wide text-white/65 md:text-[12px]",
          ].join(" ")}
        >
          {rightWins}-{right.length - rightWins}
        </p>
      </div>
    </div>
  );
}

function sideProExtras(
  isPro: boolean,
  windowId: WindowId,
  key: string,
  seasonVal: number,
  last10Val: number,
  last10Rank: number | undefined
): {
  proMeta: string | null;
  proMetaTone: "up" | "down" | "flat";
  proRank: string | null;
} {
  if (!isPro || windowId !== "last10") {
    return {
      proMeta: null,
      proMetaTone: "flat",
      proRank: null,
    };
  }
  const d = metricDelta(key, seasonVal, last10Val);
  return {
    proMeta: `SZN ${d.label}`,
    proMetaTone: d.tone,
    proRank: fmtRank(last10Rank),
  };
}

/**
 * NBA 予想ツール — Team Stats（SEASON / LAST10 + Pro 差分）
 */
export default function NbaTeamStatsPanel({
  data,
  isPro = false,
  language = "ja",
  className,
}: Props) {
  const [windowId, setWindowId] = useState<WindowId>("season");
  const active = windowId === "season" ? data.season : data.last10;
  const { home, away } = active;
  const seasonHome = data.season.home;
  const seasonAway = data.season.away;
  const last10Home = data.last10.home;
  const last10Away = data.last10.away;
  const rh = home.ranks;
  const ra = away.ranks;
  const l10Rh = last10Home.ranks;
  const l10Ra = last10Away.ranks;

  const [ppgL, ppgR] = barPctMaxNorm(home.ppg, away.ppg);
  const [papgL, papgR] = barPctMinPaNorm(home.papg, away.papg);
  const [diffL, diffR] = barPctDiffNorm(home.diff, away.diff);
  const [ortgL, ortgR] = barPctMaxNorm(home.ortg, away.ortg);
  const [drtgL, drtgR] = barPctMinPaNorm(home.drtg, away.drtg);
  const [netL, netR] = barPctDiffNorm(home.netrtg, away.netrtg);
  const [paceL, paceR] = barPctMaxNorm(home.pace, away.pace);

  const showSplit = windowId === "season";
  const homeHomePct = winPct(home.homeW, home.homeL);
  const awayHomePct = winPct(away.homeW, away.homeL);
  const homeAwayPct = winPct(home.awayW, home.awayL);
  const awayAwayPct = winPct(away.awayW, away.awayL);

  type RowSide = {
    primary: string;
    rank: string | null;
    rankBelow: string | null;
    barPct: number;
    leagueRank: number | null;
    recordBelow: string | null;
    proMeta: string | null;
    proMetaTone: "up" | "down" | "flat";
  };

  const metricRow = (
    key: string,
    label: string,
    h: number,
    a: number,
    barL: number,
    barR: number,
    leftWin: boolean,
    rightWin: boolean,
    fmt: (n: number) => string,
    seasonH: number,
    seasonA: number,
    lastH: number,
    lastA: number,
    rankKey?: keyof NonNullable<NbaTeamStatSide["ranks"]>
  ) => {
    const leftRank =
      windowId === "last10"
        ? rankKey
          ? l10Rh?.[rankKey]
          : undefined
        : rankKey
          ? rh?.[rankKey]
          : undefined;
    const rightRank =
      windowId === "last10"
        ? rankKey
          ? l10Ra?.[rankKey]
          : undefined
        : rankKey
          ? ra?.[rankKey]
          : undefined;

    const leftPro = sideProExtras(
      isPro,
      windowId,
      key,
      seasonH,
      lastH,
      rankKey ? l10Rh?.[rankKey] : undefined
    );
    const rightPro = sideProExtras(
      isPro,
      windowId,
      key,
      seasonA,
      lastA,
      rankKey ? l10Ra?.[rankKey] : undefined
    );

    // Season / Free: 順位のみ下段。Pro Last10: SZN → #n
    const leftRankBelow =
      isPro && windowId === "last10"
        ? leftPro.proRank
        : fmtRank(leftRank);
    const rightRankBelow =
      isPro && windowId === "last10"
        ? rightPro.proRank
        : fmtRank(rightRank);

    return {
      key,
      label,
      left: {
        primary: fmt(h),
        rank: null as string | null,
        rankBelow: leftRankBelow,
        barPct: barL,
        leagueRank: leftRank ?? null,
        recordBelow: null as string | null,
        proMeta: leftPro.proMeta,
        proMetaTone: leftPro.proMetaTone,
      } satisfies RowSide,
      right: {
        primary: fmt(a),
        rank: null,
        rankBelow: rightRankBelow,
        barPct: barR,
        leagueRank: rightRank ?? null,
        recordBelow: null,
        proMeta: rightPro.proMeta,
        proMetaTone: rightPro.proMetaTone,
      } satisfies RowSide,
      leftWin,
      rightWin,
    };
  };

  const coreRows = [
    metricRow(
      "ppg",
      "PPG",
      home.ppg,
      away.ppg,
      ppgL,
      ppgR,
      home.ppg > away.ppg,
      away.ppg > home.ppg,
      (n) => n.toFixed(1),
      seasonHome.ppg,
      seasonAway.ppg,
      last10Home.ppg,
      last10Away.ppg,
      "ppg"
    ),
    metricRow(
      "ortg",
      "ORTG",
      home.ortg,
      away.ortg,
      ortgL,
      ortgR,
      home.ortg > away.ortg,
      away.ortg > home.ortg,
      (n) => n.toFixed(1),
      seasonHome.ortg,
      seasonAway.ortg,
      last10Home.ortg,
      last10Away.ortg,
      "ortg"
    ),
    metricRow(
      "papg",
      "PAPG",
      home.papg,
      away.papg,
      papgL,
      papgR,
      home.papg < away.papg,
      away.papg < home.papg,
      (n) => n.toFixed(1),
      seasonHome.papg,
      seasonAway.papg,
      last10Home.papg,
      last10Away.papg,
      "papg"
    ),
    metricRow(
      "drtg",
      "DRTG",
      home.drtg,
      away.drtg,
      drtgL,
      drtgR,
      home.drtg < away.drtg,
      away.drtg < home.drtg,
      (n) => n.toFixed(1),
      seasonHome.drtg,
      seasonAway.drtg,
      last10Home.drtg,
      last10Away.drtg,
      "drtg"
    ),
    metricRow(
      "diff",
      "DIFF",
      home.diff,
      away.diff,
      diffL,
      diffR,
      home.diff > away.diff,
      away.diff > home.diff,
      fmtDiff,
      seasonHome.diff,
      seasonAway.diff,
      last10Home.diff,
      last10Away.diff,
      "diff"
    ),
    metricRow(
      "netrtg",
      "NETRTG",
      home.netrtg,
      away.netrtg,
      netL,
      netR,
      home.netrtg > away.netrtg,
      away.netrtg > home.netrtg,
      fmtDiff,
      seasonHome.netrtg,
      seasonAway.netrtg,
      last10Home.netrtg,
      last10Away.netrtg,
      "netrtg"
    ),
    metricRow(
      "pace",
      "PACE",
      home.pace,
      away.pace,
      paceL,
      paceR,
      home.pace > away.pace,
      away.pace > home.pace,
      (n) => n.toFixed(1),
      seasonHome.pace,
      seasonAway.pace,
      last10Home.pace,
      last10Away.pace,
      "pace"
    ),
  ];

  const splitRows = showSplit
    ? [
        {
          key: "home",
          label: "HOME",
          left: {
            primary: `${Math.round(homeHomePct)}%`,
            rank: null,
            rankBelow: null,
            barPct: Math.round(Math.min(100, Math.max(0, homeHomePct))),
            leagueRank: null,
            recordBelow: `${home.homeW}-${home.homeL}`,
            proMeta: null,
            proMetaTone: "flat" as const,
          },
          right: {
            primary: `${Math.round(awayHomePct)}%`,
            rank: null,
            rankBelow: null,
            barPct: Math.round(Math.min(100, Math.max(0, awayHomePct))),
            leagueRank: null,
            recordBelow: `${away.homeW}-${away.homeL}`,
            proMeta: null,
            proMetaTone: "flat" as const,
          },
          leftWin: homeHomePct > awayHomePct,
          rightWin: awayHomePct > homeHomePct,
        },
        {
          key: "away",
          label: "AWAY",
          left: {
            primary: `${Math.round(homeAwayPct)}%`,
            rank: null,
            rankBelow: null,
            barPct: Math.round(Math.min(100, Math.max(0, homeAwayPct))),
            leagueRank: null,
            recordBelow: `${home.awayW}-${home.awayL}`,
            proMeta: null,
            proMetaTone: "flat" as const,
          },
          right: {
            primary: `${Math.round(awayAwayPct)}%`,
            rank: null,
            rankBelow: null,
            barPct: Math.round(Math.min(100, Math.max(0, awayAwayPct))),
            leagueRank: null,
            recordBelow: `${away.awayW}-${away.awayL}`,
            proMeta: null,
            proMetaTone: "flat" as const,
          },
          leftWin: homeAwayPct > awayAwayPct,
          rightWin: awayAwayPct > homeAwayPct,
        },
      ]
    : [];

  const homeFormW = home.formW ?? 0;
  const homeFormL = home.formL ?? 0;
  const awayFormW = away.formW ?? 0;
  const awayFormL = away.formL ?? 0;
  const formLeft =
    home.formResults ??
    (homeFormW + homeFormL > 0
      ? Array.from({ length: homeFormW + homeFormL }, (_, i) =>
          i < homeFormL ? ("L" as const) : ("W" as const)
        )
      : []);
  const formRight =
    away.formResults ??
    (awayFormW + awayFormL > 0
      ? Array.from({ length: awayFormW + awayFormL }, (_, i) =>
          i < awayFormL ? ("L" as const) : ("W" as const)
        )
      : []);
  const showFormStrip = windowId === "last10" && (formLeft.length > 0 || formRight.length > 0);

  const rows = [...coreRows, ...splitRows];

  return (
    <div
      className={[
        "relative z-[1] rounded-[2px] bg-[rgba(6,10,16,0.96)] px-1 py-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-1.5 px-0.5">
        <CyberSlantedTabBar fill aria-label="Team stats window">
          <CyberSlantedTab
            role="tab"
            label="SEASON"
            active={windowId === "season"}
            onClick={() => setWindowId("season")}
            compact
            fontWeight={900}
          />
          <CyberSlantedTab
            role="tab"
            label="LAST 10"
            active={windowId === "last10"}
            onClick={() => setWindowId("last10")}
            compact
            fontWeight={900}
          />
        </CyberSlantedTabBar>
      </div>

      <p
        className={[
          nameOxanium.className,
          "mb-1 px-0.5 text-center text-[11px] font-bold tracking-[0.06em] text-white/55",
        ].join(" ")}
      >
        {t(language).predict.teamStatsMoreHint}
      </p>

      <header className="mb-1.5 grid grid-cols-2 gap-2 px-0.5">
        {home.teamId ? (
          <Link
            href={nbaTeamDetailPreviewHref(home.teamId)}
            className={[
              nameBebas.className,
              "truncate text-center text-[15px] font-bold uppercase leading-tight text-cyan-200",
            ].join(" ")}
            style={matchCardTeamNameStyle(true)}
          >
            {teamLabel(home.teamId, home.teamName)} →
          </Link>
        ) : (
          <p
            className={[
              nameBebas.className,
              "truncate text-center text-[15px] font-bold uppercase leading-tight text-white",
            ].join(" ")}
            style={matchCardTeamNameStyle(true)}
          >
            {teamLabel(home.teamId, home.teamName)}
          </p>
        )}
        {away.teamId ? (
          <Link
            href={nbaTeamDetailPreviewHref(away.teamId)}
            className={[
              nameBebas.className,
              "truncate text-center text-[15px] font-bold uppercase leading-tight text-violet-200",
            ].join(" ")}
            style={matchCardTeamNameStyle(true)}
          >
            {teamLabel(away.teamId, away.teamName)} →
          </Link>
        ) : (
          <p
            className={[
              nameBebas.className,
              "truncate text-center text-[15px] font-bold uppercase leading-tight text-white",
            ].join(" ")}
            style={matchCardTeamNameStyle(true)}
          >
            {teamLabel(away.teamId, away.teamName)}
          </p>
        )}
      </header>

      {isPro && windowId === "last10" ? (
        <p
          className={[
            nameOxanium.className,
            "mb-1 px-0.5 text-center text-[7px] font-bold uppercase tracking-[0.14em] text-amber-300/70",
          ].join(" ")}
        >
          szn delta · pro
        </p>
      ) : null}

      <section className="space-y-0">
        {rows.map((row, index) => (
          <SymmetricalCompareRow
            key={`${windowId}-${row.key}`}
            label={row.label}
            left={row.left}
            right={row.right}
            leftWin={row.leftWin}
            rightWin={row.rightWin}
            barDelay={index * ROW_STAGGER}
            compactHud
          />
        ))}
        {showFormStrip ? (
          <FormResultsStrip left={formLeft} right={formRight} />
        ) : null}
      </section>
    </div>
  );
}
