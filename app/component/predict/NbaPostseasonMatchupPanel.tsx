"use client";

import { Fragment, type ReactNode } from "react";
import { motion } from "framer-motion";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import {
  ROW_STAGGER,
  SymmetricalCompareRow,
  barPctDiffNorm,
  barPctMaxNorm,
  barPctMinPaNorm,
} from "./teamStatsCompare";

/** 欠場ブロック直下のサマリー（日英いずれか一方だけでも可） */
export type NbaH2HGameInactiveFooterSummary = {
  ja: string;
  en: string;
};

function h2hInactiveFooterSummaryBody(
  isEn: boolean,
  block: NbaH2HGameInactiveFooterSummary | undefined
): string | null {
  if (!block) return null;
  const ja = block.ja.trim();
  const en = block.en.trim();
  if (!ja && !en) return null;
  if (isEn) return en || ja;
  return ja || en;
}

export type NbaH2HGameCard = {
  id: string;
  /** ET の日付（YYYY-MM-DD）。英語 UI で表示。 */
  dateEt: string;
  /** JST の日付（YYYY-MM-DD）。日本語 UI で表示。 */
  dateJst: string;
  /** 左列のチーム名（シリーズごとに固定の並びでデータ側で指定） */
  leftTeamDisplay: string;
  /** 右列のチーム名 */
  rightTeamDisplay: string;
  /** 左列チームの得点 */
  scoreLeft: number | null;
  /** 右列チームの得点 */
  scoreRight: number | null;
  /** 左列チームの欠場者（「D. Mitchell」形式の文字列） */
  injuriesLeft: string[];
  /** 右列チームの欠場者 */
  injuriesRight: string[];
  /**
   * この試合のホームが左列か右列か（カードの left/right チーム並びと対応）。
   * 未指定ならホーム／アウェイラベルは出さない。
   */
  homeTeamSide?: "left" | "right";
  /** true のとき得点の直上に OT を表示 */
  wentToOvertime?: boolean;
  /** 日付とスコア行の間に表示（例: プレーオフの「Game 1」） */
  seriesGameLabel?: string;
  /** 欠場者の下に表示するサマリーカード（任意） */
  inactiveFooterSummary?: NbaH2HGameInactiveFooterSummary;
};

export type NbaH2HAverages = {
  homeAvgPts: number | null;
  awayAvgPts: number | null;
  homeAvgPtsAllowed: number | null;
  awayAvgPtsAllowed: number | null;
  homeNetRtg: number | null;
  awayNetRtg: number | null;
};

type Props = {
  isEn: boolean;
  /** 未指定時はレイアウト用のプレースホルダーカードを表示 */
  seriesGames?: NbaH2HGameCard[];
  h2hAverages?: NbaH2HAverages;
};

const SKELETON_GAMES: NbaH2HGameCard[] = [
  {
    id: "sk1",
    dateEt: "",
    dateJst: "",
    leftTeamDisplay: "—",
    rightTeamDisplay: "—",
    scoreLeft: null,
    scoreRight: null,
    injuriesLeft: [],
    injuriesRight: [],
  },
  {
    id: "sk2",
    dateEt: "",
    dateJst: "",
    leftTeamDisplay: "—",
    rightTeamDisplay: "—",
    scoreLeft: null,
    scoreRight: null,
    injuriesLeft: [],
    injuriesRight: [],
  },
];

function parseYmd(ymd: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || mo < 1 || mo > 12 || d < 1 || d > 31)
    return null;
  return { y, m: mo, d };
}

function formatH2hGameCardDate(
  isEn: boolean,
  dateEt: string,
  dateJst: string
): string {
  const key = isEn ? dateEt : dateJst;
  const parsed = parseYmd(key);
  if (!parsed) return "—";
  const dt = new Date(parsed.y, parsed.m - 1, parsed.d);
  if (isEn) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(dt);
  }
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dt);
}

function fmtDiff(d: number) {
  return `${d > 0 ? "+" : ""}${d.toFixed(1)}`;
}

const H2H_INJURY_NAMES_PER_ROW = 2;

/** 略称（A.）と姓の間で改行されないよう、直後のスペースを NBSP にする */
function h2hInjuryNameForWrap(name: string): string {
  return name.replace(/\b([A-Z]\.) /g, "$1\u00a0");
}

function h2hHomeAwayLabel(role: "home" | "away"): string {
  return role === "home" ? "Home" : "Away";
}

function H2hInjuryNamesTwoPerRow({
  names,
  alignEnd,
}: {
  names: string[];
  /** true のとき右寄せ列（Spurs 側）。1 行内は名前単位で折り返し、イニシャルと姓が分断されないようにする */
  alignEnd?: boolean;
}): ReactNode {
  if (!names.length) {
    return <span className="text-white/38">—</span>;
  }
  const rows: string[][] = [];
  for (let i = 0; i < names.length; i += H2H_INJURY_NAMES_PER_ROW) {
    rows.push(names.slice(i, i + H2H_INJURY_NAMES_PER_ROW));
  }
  const rowClass = alignEnd
    ? "flex flex-wrap justify-end gap-x-1"
    : "flex flex-wrap justify-start gap-x-1";
  return (
    <span className="flex flex-col gap-y-1">
      {rows.map((pair, rowIdx) => (
        <span key={rowIdx} className={rowClass}>
          {pair.map((name, i) => (
            <Fragment key={`${rowIdx}-${i}-${name}`}>
              {i > 0 ? (
                <span
                  className="shrink-0 self-center text-white/50"
                  aria-hidden
                >
                  ·
                </span>
              ) : null}
              <span className="shrink-0 whitespace-nowrap">
                {h2hInjuryNameForWrap(name)}
              </span>
            </Fragment>
          ))}
        </span>
      ))}
    </span>
  );
}

export default function NbaPostseasonMatchupPanel({
  isEn,
  seriesGames,
  h2hAverages,
}: Props) {
  /** データは古い日付が先頭のため、今季の直接対決は新しい試合が上になるよう逆順で表示 */
  const games =
    seriesGames && seriesGames.length > 0
      ? [...seriesGames].reverse()
      : SKELETON_GAMES;

  const h = h2hAverages;
  const homePts = h?.homeAvgPts ?? null;
  const awayPts = h?.awayAvgPts ?? null;
  const homePa = h?.homeAvgPtsAllowed ?? null;
  const awayPa = h?.awayAvgPtsAllowed ?? null;
  const homeNet = h?.homeNetRtg ?? null;
  const awayNet = h?.awayNetRtg ?? null;

  const [ppgBarL, ppgBarR] =
    homePts != null && awayPts != null
      ? barPctMaxNorm(homePts, awayPts)
      : [0, 0];
  const [papgBarL, papgBarR] =
    homePa != null && awayPa != null
      ? barPctMinPaNorm(homePa, awayPa)
      : [0, 0];
  const [netBarL, netBarR] =
    homeNet != null && awayNet != null
      ? barPctDiffNorm(homeNet, awayNet)
      : [0, 0];

  const h2hRows: Array<{
    key: string;
    label: string;
    left: {
      primary: string;
      rank: string | null;
      barPct: number;
      recordBelow: string | null;
    };
    right: {
      primary: string;
      rank: string | null;
      barPct: number;
      recordBelow: string | null;
    };
    leftWin: boolean;
    rightWin: boolean;
  }> = [
    {
      key: "h2h-ppg",
      label: isEn ? "H2H PTS / G" : "H2H平均得点",
      left: {
        primary: homePts != null ? homePts.toFixed(1) : "—",
        rank: null,
        barPct: ppgBarL,
        recordBelow: null,
      },
      right: {
        primary: awayPts != null ? awayPts.toFixed(1) : "—",
        rank: null,
        barPct: ppgBarR,
        recordBelow: null,
      },
      leftWin:
        homePts != null && awayPts != null ? homePts > awayPts : false,
      rightWin:
        homePts != null && awayPts != null ? awayPts > homePts : false,
    },
    {
      key: "h2h-papg",
      label: isEn ? "H2H OPP PTS / G" : "H2H平均失点",
      left: {
        primary: homePa != null ? homePa.toFixed(1) : "—",
        rank: null,
        barPct: papgBarL,
        recordBelow: null,
      },
      right: {
        primary: awayPa != null ? awayPa.toFixed(1) : "—",
        rank: null,
        barPct: papgBarR,
        recordBelow: null,
      },
      leftWin:
        homePa != null && awayPa != null ? homePa < awayPa : false,
      rightWin:
        homePa != null && awayPa != null ? awayPa < homePa : false,
    },
    {
      key: "h2h-net",
      label: "H2H NET",
      left: {
        primary: homeNet != null ? fmtDiff(homeNet) : "—",
        rank: null,
        barPct: netBarL,
        recordBelow: null,
      },
      right: {
        primary: awayNet != null ? fmtDiff(awayNet) : "—",
        rank: null,
        barPct: netBarR,
        recordBelow: null,
      },
      leftWin:
        homeNet != null && awayNet != null ? homeNet > awayNet : false,
      rightWin:
        homeNet != null && awayNet != null ? awayNet > homeNet : false,
    },
  ];

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <ul className="space-y-2.5">
          {games.map((g, i) => {
            const inactiveFooterSummaryText = h2hInactiveFooterSummaryBody(
              isEn,
              g.inactiveFooterSummary
            );
            return (
            <motion.li
              key={g.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-xl border border-white/10 bg-white/4 p-3 md:p-3.5"
            >
              <div className="text-center">
                <span
                  className={[
                    resultStatsMetricNumClass,
                    "text-sm text-white/80 md:text-sm",
                  ].join(" ")}
                >
                  {formatH2hGameCardDate(isEn, g.dateEt, g.dateJst)}
                </span>
              </div>
              {g.seriesGameLabel ? (
                <div className="mt-1 text-center">
                  <span
                    className={[
                      resultStatsMetricNumClass,
                      "text-xs font-semibold tracking-wide text-white/55 md:text-[13px]",
                    ].join(" ")}
                  >
                    {g.seriesGameLabel}
                  </span>
                </div>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-end justify-center gap-2 sm:gap-3 md:gap-4">
                <div className="flex min-w-0 max-w-[42%] flex-1 flex-col items-center sm:max-w-none">
                  {g.homeTeamSide ? (
                    <span
                      className={[
                        resultStatsMetricNumClass,
                        "mb-1 text-center text-[9px] font-semibold uppercase tracking-wide text-white/48 md:text-[10px]",
                      ].join(" ")}
                    >
                      {h2hHomeAwayLabel(
                        g.homeTeamSide === "left" ? "home" : "away"
                      )}
                    </span>
                  ) : null}
                  <span
                    className={[
                      resultStatsMetricNumClass,
                      "truncate text-center text-base font-semibold text-white/78 sm:text-lg md:text-lg",
                    ].join(" ")}
                  >
                    {g.leftTeamDisplay}
                  </span>
                </div>
                {g.scoreLeft != null && g.scoreRight != null ? (
                  <div className="flex shrink-0 flex-col items-center">
                    {g.wentToOvertime ? (
                      <span
                        className={[
                          resultStatsMetricNumClass,
                          "mb-0.5 text-center text-[9px] font-semibold uppercase tracking-wide text-white/48 md:text-[10px]",
                        ].join(" ")}
                      >
                        OT
                      </span>
                    ) : null}
                    <span
                      className={[
                        resultStatsMetricNumClass,
                        "text-xl font-bold tabular-nums tracking-tight sm:text-2xl md:text-2xl",
                      ].join(" ")}
                    >
                      <span
                        className={
                          g.scoreLeft > g.scoreRight
                            ? "text-yellow-300"
                            : "text-white"
                        }
                        style={
                          g.scoreLeft > g.scoreRight
                            ? {
                                textShadow:
                                  "0 0 8px rgba(253, 224, 71, 0.5), 0 0 3px rgba(253, 224, 71, 0.65)",
                              }
                            : undefined
                        }
                      >
                        {g.scoreLeft}
                      </span>
                      <span className="mx-1 text-white/55">–</span>
                      <span
                        className={
                          g.scoreRight > g.scoreLeft
                            ? "text-yellow-300"
                            : "text-white"
                        }
                        style={
                          g.scoreRight > g.scoreLeft
                            ? {
                                textShadow:
                                  "0 0 8px rgba(253, 224, 71, 0.5), 0 0 3px rgba(253, 224, 71, 0.65)",
                              }
                            : undefined
                        }
                      >
                        {g.scoreRight}
                      </span>
                    </span>
                  </div>
                ) : (
                  <span
                    className={[
                      resultStatsMetricNumClass,
                      "shrink-0 text-xl font-bold tabular-nums tracking-tight text-white sm:text-2xl md:text-2xl",
                    ].join(" ")}
                  >
                    —
                  </span>
                )}
                <div className="flex min-w-0 max-w-[42%] flex-1 flex-col items-center sm:max-w-none">
                  {g.homeTeamSide ? (
                    <span
                      className={[
                        resultStatsMetricNumClass,
                        "mb-1 text-center text-[9px] font-semibold uppercase tracking-wide text-white/48 md:text-[10px]",
                      ].join(" ")}
                    >
                      {h2hHomeAwayLabel(
                        g.homeTeamSide === "right" ? "home" : "away"
                      )}
                    </span>
                  ) : null}
                  <span
                    className={[
                      resultStatsMetricNumClass,
                      "truncate text-center text-base font-semibold text-white/78 sm:text-lg md:text-lg",
                    ].join(" ")}
                  >
                    {g.rightTeamDisplay}
                  </span>
                </div>
              </div>
              <div className="mt-2 border-t border-white/8 pt-2">
                <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-2 sm:px-3 sm:py-2.5">
                  <div className="flex items-start justify-center gap-2 sm:gap-3 md:gap-4">
                    <div
                      className={[
                        resultStatsMetricNumClass,
                        "min-w-0 flex-1 text-right text-xs leading-relaxed text-white/82 sm:text-sm md:text-base",
                      ].join(" ")}
                    >
                      <H2hInjuryNamesTwoPerRow names={g.injuriesLeft} alignEnd />
                    </div>
                    <div
                      className={[
                        resultStatsMetricNumClass,
                        "shrink-0 px-0.5 pt-0.5 text-center text-[11px] font-semibold tracking-wide text-white/55 sm:text-xs md:text-sm",
                      ].join(" ")}
                    >
                      {isEn ? "Inactive" : "欠場"}
                    </div>
                    <div
                      className={[
                        resultStatsMetricNumClass,
                        "min-w-0 flex-1 text-left text-xs leading-relaxed text-white/82 sm:text-sm md:text-base",
                      ].join(" ")}
                    >
                      <H2hInjuryNamesTwoPerRow names={g.injuriesRight} />
                    </div>
                  </div>
                </div>
                {inactiveFooterSummaryText ? (
                  <div
                    className={[
                      resultStatsMetricNumClass,
                      "mt-2 rounded-lg border border-white/12 bg-black/30 px-2.5 py-2 sm:px-3 sm:py-2.5",
                    ].join(" ")}
                  >
                    <p
                      className={[
                        resultStatsMetricNumClass,
                        "text-[10px] font-semibold tracking-wide text-white/48 md:text-[11px]",
                      ].join(" ")}
                    >
                      {isEn ? "Summary" : "サマリー"}
                    </p>
                    <p
                      className={[
                        resultStatsMetricNumClass,
                        "mt-1 whitespace-pre-line text-xs leading-relaxed text-white/78 sm:text-sm",
                      ].join(" ")}
                    >
                      {inactiveFooterSummaryText}
                    </p>
                  </div>
                ) : null}
              </div>
            </motion.li>
            );
          })}
        </ul>
        {!seriesGames?.length ? (
          <p className="text-[9px] text-white/38 md:text-[10px]">
            {isEn
              ? "Game and injury data will appear here once connected."
              : "試合・欠場情報はデータ連携後に表示されます。"}
          </p>
        ) : null}
      </div>

      <div className="space-y-0">
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/55 md:text-xs">
          {isEn ? "Head-to-head stats" : "直接対決のスタッツ"}
        </h3>
        {!h2hAverages ? (
          <p className="mb-2 text-[9px] text-white/38 md:text-[10px]">
            {isEn
              ? "H2H averages use the same bars as detailed team stats."
              : "H2H平均は詳細スタッツと同じミント／紫のバーで表示します。"}
          </p>
        ) : null}
        {h2hRows.map((row, index) => (
          <SymmetricalCompareRow
            key={row.key}
            label={row.label}
            left={row.left}
            right={row.right}
            leftWin={row.leftWin}
            rightWin={row.rightWin}
            barDelay={index * ROW_STAGGER}
            emphasizedMetrics
          />
        ))}
      </div>
    </section>
  );
}
