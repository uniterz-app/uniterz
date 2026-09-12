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
  NbaTeamFormGame,
  NbaTeamStatSide,
  NbaTeamStatsBundle,
} from "@/lib/predict/nbaTeamStatsPreviewMocks";
import { metricDelta } from "@/lib/predict/nbaTeamStatsForm";
import { nbaTeamDetailPreviewHref } from "@/lib/predict/nbaTeamDetailHref";
import { stashPredictTeamDetailReturn } from "@/lib/predict/predictTeamDetailReturn";
import { nameBebas, nameOxanium } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { getMobileTeamName } from "@/lib/team-name-split-mobile";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import LiveGameStatsPanel from "@/app/component/games/live/LiveGameStatsPanel";
import { useLiveGameStats } from "@/lib/games/useLiveGameStats";

type WindowId = "season" | "last10";

/**
 * LAST 10 は box / スコアから導けるセット
 *（NET/ORTG/DRTG/PACE + FG%/3P%）。
 */
type Props = {
  data: NbaTeamStatsBundle;
  /** Pro: SZN± 差分 + #順位（LAST 10） */
  isPro?: boolean;
  language?: Language;
  className?: string;
  /** 予想入力から開いたとき、チーム詳細の戻る先 */
  fromPredictGameId?: string;
  predictReturnMode?: "overlay" | "route";
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

const FORM_WIN = "#F5C518";
const FORM_LOSS = "#FF2D78";

function FormGameLine({
  game,
  align,
  onOpen,
}: {
  game: NbaTeamFormGame;
  align: "left" | "right";
  onOpen?: (gameId: string) => void;
}) {
  const venue = game.home ? "vs" : "@";
  const win = game.result === "W";
  const endAlign = align === "right";
  const canOpen = Boolean(game.gameId && onOpen);
  const body = (
    <>
      <span className="shrink-0 tabular-nums text-[12px] text-white/45 md:text-[13px]">
        {game.dateLabel}
      </span>
      <span className="shrink-0 text-white/55">{venue}</span>
      <span
        className="min-w-0 truncate text-[13px] text-white/90 md:text-[14px]"
        style={{ transform: "skewX(-6deg)" }}
      >
        {game.oppAbbr}
      </span>
      <span className="shrink-0 tabular-nums text-white/85">
        {game.teamScore}-{game.oppScore}
      </span>
      <span
        className="w-4 shrink-0 text-center text-[14px] font-extrabold md:text-[15px]"
        style={{ color: win ? FORM_WIN : FORM_LOSS }}
      >
        {game.result}
      </span>
    </>
  );
  const className = [
    nameOxanium.className,
    "flex min-w-0 items-center gap-1.5 py-1.5 text-[13px] font-bold leading-none md:gap-2 md:text-[14px]",
    endAlign ? "justify-end" : "justify-start",
    canOpen ? "cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.07]" : "",
  ].join(" ");
  if (canOpen && game.gameId && onOpen) {
    return (
      <button
        type="button"
        onClick={() => onOpen(game.gameId!)}
        className={["w-full", className].join(" ")}
        aria-label={`Box score ${game.oppAbbr}`}
      >
        {body}
      </button>
    );
  }
  return <div className={className}>{body}</div>;
}

function FormGameBoxOverlay({
  gameId,
  language,
  onClose,
}: {
  gameId: string;
  language: Language;
  onClose: () => void;
}) {
  const { report, loading } = useLiveGameStats(gameId, true);
  const isJa = language === "ja";
  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black/92"
      role="dialog"
      aria-modal
      aria-label="Box score"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-3">
        <p
          className={[
            nameOxanium.className,
            "text-[13px] font-bold uppercase tracking-[0.12em] text-white/70",
          ].join(" ")}
          style={{ transform: "skewX(-6deg)" }}
        >
          BOX SCORE
        </p>
        <button
          type="button"
          onClick={onClose}
          className={[
            nameOxanium.className,
            "rounded-[2px] border border-white/25 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-white/80",
          ].join(" ")}
        >
          {isJa ? "閉じる" : "Close"}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {loading && !report ? (
          <p
            className={[
              nameOxanium.className,
              "px-2 py-6 text-center text-[12px] font-bold text-white/45",
            ].join(" ")}
          >
            {isJa ? "読み込み中…" : "Loading…"}
          </p>
        ) : report ? (
          <LiveGameStatsPanel report={report} language={language} />
        ) : (
          <p
            className={[
              nameOxanium.className,
              "px-2 py-6 text-center text-[12px] font-bold text-white/45",
            ].join(" ")}
          >
            {isJa ? "ボックススコアがありません" : "No box score yet"}
          </p>
        )}
      </div>
    </div>
  );
}

/** 表下: 各チーム直近 ≤5 試合。初期折りたたみ。行タップで BOX */
function RecentFormGamesStrip({
  left,
  right,
  language,
}: {
  left: NbaTeamFormGame[];
  right: NbaTeamFormGame[];
  language: Language;
}) {
  const [open, setOpen] = useState(false);
  const [boxGameId, setBoxGameId] = useState<string | null>(null);
  const rows = Math.max(left.length, right.length, 1);
  const isJa = language === "ja";
  const hint = isJa ? "タップ→BOXスコア" : "tap→box score";
  return (
    <div className="border-t border-white/10 pt-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mb-1.5 flex w-full flex-col items-center gap-0.5"
      >
        <span
          className={[
            nameOxanium.className,
            "inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.14em] text-white/55 md:text-[14px]",
          ].join(" ")}
        >
          <span style={{ transform: "skewX(-6deg)" }}>LAST 5</span>
          <span
            aria-hidden
            className="text-[10px] text-white/40"
            style={{ transform: open ? "rotate(180deg)" : undefined }}
          >
            ▼
          </span>
        </span>
        <span
          className={[
            nameOxanium.className,
            "text-[10px] font-bold tracking-[0.06em] text-white/45 md:text-[11px]",
          ].join(" ")}
          style={{ transform: "skewX(-6deg)" }}
        >
          {hint}
        </span>
      </button>
      {open ? (
        <div className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-start gap-x-3">
          <div className="flex min-w-0 flex-col">
            {Array.from({ length: rows }, (_, i) =>
              left[i] ? (
                <FormGameLine
                  key={`l-${i}`}
                  game={left[i]}
                  align="right"
                  onOpen={setBoxGameId}
                />
              ) : (
                <div key={`l-${i}`} className="h-[30px]" />
              )
            )}
          </div>
          <div className="self-stretch bg-white" aria-hidden />
          <div className="flex min-w-0 flex-col">
            {Array.from({ length: rows }, (_, i) =>
              right[i] ? (
                <FormGameLine
                  key={`r-${i}`}
                  game={right[i]}
                  align="left"
                  onOpen={setBoxGameId}
                />
              ) : (
                <div key={`r-${i}`} className="h-[30px]" />
              )
            )}
          </div>
        </div>
      ) : null}
      {boxGameId ? (
        <FormGameBoxOverlay
          gameId={boxGameId}
          language={language}
          onClose={() => setBoxGameId(null)}
        />
      ) : null}
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
 * NBA 予想ツール — Team Stats（対戦比較）
 * NET / ORTG / DRTG / PACE + FG%/3P%。SEASON は今試合の HOME vs ROAD。LAST10 は W/L。
 */
export default function NbaTeamStatsPanel({
  data,
  isPro = false,
  language = "ja",
  className,
  fromPredictGameId,
  predictReturnMode,
}: Props) {
  const resolvedReturnMode =
    predictReturnMode ?? (fromPredictGameId ? "overlay" : "route");
  const teamDetailHref = (teamId: string) =>
    nbaTeamDetailPreviewHref(teamId, {
      fromPredict: fromPredictGameId,
      predictToolsTab: fromPredictGameId ? "stats" : undefined,
    });
  const stashReturnBeforeTeamNav = () => {
    if (!fromPredictGameId) return;
    stashPredictTeamDetailReturn({
      gameId: fromPredictGameId,
      predictToolsTab: "stats",
      returnMode: resolvedReturnMode,
    });
  };
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

  const [netL, netR] = barPctDiffNorm(home.netrtg, away.netrtg);
  const [ortgL, ortgR] = barPctMaxNorm(home.ortg, away.ortg);
  const [drtgL, drtgR] = barPctMinPaNorm(home.drtg, away.drtg);
  const [paceL, paceR] = barPctMaxNorm(home.pace, away.pace);
  const fmtPct = (n: number) => `${(n <= 1 ? n * 100 : n).toFixed(1)}`;
  const pct = (n: number | undefined) =>
    typeof n === "number" && Number.isFinite(n) ? n : 0;
  const [fgL, fgR] = barPctMaxNorm(pct(home.fgPct), pct(away.fgPct));
  const [fg3L, fg3R] = barPctMaxNorm(pct(home.fg3Pct), pct(away.fg3Pct));

  const showSplit = windowId === "season";
  const homeSitePct = winPct(home.homeW, home.homeL);
  const awaySitePct = winPct(away.awayW, away.awayL);

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
    metricRow(
      "fgPct",
      "FG%",
      pct(home.fgPct),
      pct(away.fgPct),
      fgL,
      fgR,
      pct(home.fgPct) > pct(away.fgPct),
      pct(away.fgPct) > pct(home.fgPct),
      fmtPct,
      pct(seasonHome.fgPct),
      pct(seasonAway.fgPct),
      pct(last10Home.fgPct),
      pct(last10Away.fgPct),
      "fgPct"
    ),
    metricRow(
      "fg3Pct",
      "3P%",
      pct(home.fg3Pct),
      pct(away.fg3Pct),
      fg3L,
      fg3R,
      pct(home.fg3Pct) > pct(away.fg3Pct),
      pct(away.fg3Pct) > pct(home.fg3Pct),
      fmtPct,
      pct(seasonHome.fg3Pct),
      pct(seasonAway.fg3Pct),
      pct(last10Home.fg3Pct),
      pct(last10Away.fg3Pct),
      "fg3Pct"
    ),
  ];

  /** 今試合の条件: ホームの HOME 成績 vs アウェイの ROAD 成績 */
  const splitRows = showSplit
    ? [
        {
          key: "site",
          label: "H/R",
          left: {
            primary: `${Math.round(homeSitePct)}%`,
            rank: null,
            rankBelow: null,
            barPct: Math.round(Math.min(100, Math.max(0, homeSitePct))),
            leagueRank: null,
            recordBelow: `${home.homeW}-${home.homeL}`,
            proMeta: null,
            proMetaTone: "flat" as const,
          },
          right: {
            primary: `${Math.round(awaySitePct)}%`,
            rank: null,
            rankBelow: null,
            barPct: Math.round(Math.min(100, Math.max(0, awaySitePct))),
            leagueRank: null,
            recordBelow: `${away.awayW}-${away.awayL}`,
            proMeta: null,
            proMetaTone: "flat" as const,
          },
          leftWin: homeSitePct > awaySitePct,
          rightWin: awaySitePct > homeSitePct,
        },
      ]
    : [];

  const formLeft =
    data.season.home.recentFormGames ??
    data.last10.home.recentFormGames ??
    [];
  const formRight =
    data.season.away.recentFormGames ??
    data.last10.away.recentFormGames ??
    [];
  const showRecentForm = formLeft.length > 0 || formRight.length > 0;

  const rows = [...coreRows, ...splitRows];

  return (
    <div
      className={[
        "relative z-[1] rounded-none border border-[rgba(0,245,255,0.32)] bg-[rgba(0,14,20,0.55)] px-1.5 py-2",
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

      <header className="mb-1.5 grid grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] items-center px-0.5">
        {home.teamId ? (
          <Link
            href={teamDetailHref(home.teamId)}
            onClick={stashReturnBeforeTeamNav}
            className={[
              nameBebas.className,
              "truncate text-center text-[14px] font-bold uppercase leading-tight text-cyan-200",
            ].join(" ")}
            style={matchCardTeamNameStyle(true)}
          >
            {teamLabel(home.teamId, home.teamName)} →
          </Link>
        ) : (
          <p
            className={[
              nameBebas.className,
              "truncate text-center text-[14px] font-bold uppercase leading-tight text-white",
            ].join(" ")}
            style={matchCardTeamNameStyle(true)}
          >
            {teamLabel(home.teamId, home.teamName)}
          </p>
        )}
        <span aria-hidden className="w-16 shrink-0" />
        {away.teamId ? (
          <Link
            href={teamDetailHref(away.teamId)}
            onClick={stashReturnBeforeTeamNav}
            className={[
              nameBebas.className,
              "truncate text-center text-[14px] font-bold uppercase leading-tight text-violet-200",
            ].join(" ")}
            style={matchCardTeamNameStyle(true)}
          >
            {teamLabel(away.teamId, away.teamName)} →
          </Link>
        ) : (
          <p
            className={[
              nameBebas.className,
              "truncate text-center text-[14px] font-bold uppercase leading-tight text-white",
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
        {showRecentForm ? (
          <RecentFormGamesStrip left={formLeft} right={formRight} language={language ?? "ja"} />
        ) : null}
      </section>
    </div>
  );
}
