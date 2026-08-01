"use client";

// 月次レポート（Pro）本体。docs/pro-subscription-plan.md §4。
// 画面順: 表紙 / 数字で見る今月 / 獲得 Unit 内訳 / 能力チャート / 予想のクセ /
//         チーム相性 / 月間ハイライト / 今月のサマリー。
// 見た目はランキング画面の DATA SLAB 語彙（週次レポートと同系統）。

import type { CSSProperties } from "react";
import { useState } from "react";
import { ArrowDown, ArrowUp, Flame } from "lucide-react";
import CyberTooltip from "@/app/component/common/CyberTooltip";
import { KINETIK_CYBER_TOOLTIP_DEFAULT } from "@/app/component/profile/edit/kinetikSlantTabTheme";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as ReRadarChart,
  ResponsiveContainer,
} from "recharts";
import { RankingsCyberPanel } from "@/app/component/rankings/RankingsCyberPanel";
import { CyberScanlineText } from "@/app/component/rankings/CyberRankingListParts";
import {
  computeTopPercentile,
  getKinetikRankBadgeTierFromTopPercent,
  type KinetikRankBadgeTier,
} from "@/app/component/profile/edit/kinetikRankBadge";
import { ANALYSIS_TYPE_COLOR } from "@/shared/analysis/analysisTypeColor";
import { nameBebas, nameOxanium, jp } from "@/lib/fonts";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import {
  monthlyReportRankBandAccent,
  resolveMonthlyReportRankBand,
} from "@/lib/reports/monthlyReportRankBand";
import { resolveMonthlyReportAnalysisTypeCopy } from "@/lib/reports/monthlyReportAnalysisTypeCopy";
import type {
  MonthlyReport,
  MonthlyReportHabits,
  MonthlyReportHighlight,
  MonthlyReportMetric,
  MonthlyReportMetricKey,
  MonthlyReportOutlook,
  MonthlyReportRadar,
  MonthlyReportRadarAxisKey,
  MonthlyReportTeam,
  MonthlyReportUnitGrant,
  MonthlyReportUnitMetric,
  MonthlyReportUnitSource,
} from "@/lib/reports/monthlyReportTypes";
import { MONTHLY_REPORT_RADAR_STRENGTH_P } from "@/lib/reports/monthlyReportTypes";
import type { AnalysisTypeId } from "@/shared/analysis/types";

type Lang = "ja" | "en";

const COPY = {
  ja: {
    title: "MONTHLY REPORT",
    thisMonth: "今月の結果",
    participants: (n: number) => `${n}人中`,
    top: (p: string) => `TOP ${p}%`,
    posts: "投稿",
    wins: "勝",
    losses: "敗",
    rankLabel: "RANK",
    unitsLabel: "UNITS",
    unitsEarnedLabel: "今月の獲得",
    monthlyChange: "前月比",
    typeLabel: "今月の分析タイプ",
    numbers: "数字で見る今月",
    unitsBreakdown: "獲得 Unit 内訳",
    unitsBreakdownEmpty: "今月の Unit 付与はありません。",
    unitsBreakdownTotal: "今月の合計",
    unitsBreakdownExpand: "タップで内訳",
    unitsBreakdownCollapse: "閉じる",
    unitSource: {
      personal_weekly: "個人・週間",
      personal_monthly: "個人・月間",
      group_weekly: "グループ・週間",
      group_monthly: "グループ・月間",
      invite: "招待",
      metric_rank: "部門上位",
      event: "イベント",
    } satisfies Record<MonthlyReportUnitSource, string>,
    unitMetric: {
      totalPoints: "総合得点",
      winRate: "勝率",
      scorer: "SCORER",
      upset: "UPSET",
    } satisfies Record<MonthlyReportUnitMetric, string>,
    unitRank: (n: number) => `#${n}`,
    radar: "能力チャート",
    habits: "予想のクセ",
    habitsEmpty: "サンプルが足りず、今月のクセはまだ出せません。",
    habitsMapHint: "横: Away ←→ Home / 縦: 順当 ←→ 逆張り · 点の大きさ=勝率",
    homeAway: "Home / Away",
    market: "順当 / 逆張り",
    homeWr: "Home勝率",
    awayWr: "Away勝率",
    favWr: "順当勝率",
    dogWr: "逆張り勝率",
    homeShare: "Home",
    awayShare: "Away",
    favShare: "順当",
    dogShare: "逆張り",
    pickShare: "選球比",
    affinity: "チーム相性",
    strong: "得意",
    weak: "苦手",
    highlights: "月間ハイライト",
    bestPick: "ベスト予想",
    myPick: "自分の予想",
    bestDay: "ベストデー",
    bestDayLine: (w: number, p: number) => `${p}試合 ${w}勝`,
    streak: "最長連勝",
    streakUnit: "連勝",
    upset: "最大アップセット",
    divisionTop10: (d: string, n: number) => `${d} 部門 #${n}`,
    outlook: "今月のサマリー",
    metric: {
      posts: "予想数",
      points: "総合得点",
      winRate: "勝率",
      goalScorerHits: "SCORER 的中",
      upsetPoints: "UPSET pt",
      units: "獲得 Unit",
    } satisfies Record<MonthlyReportMetricKey, string>,
    prevDelta: "前月比",
    medianMark: "中央値",
    youMark: "自分",
    top10Mark: "上位10%",
    vsMedian: "中央値より",
    vsTop10: "上位10%より",
    metricRank: (n: number) => `#${n}`,
    radarAxis: {
      win: "WIN",
      scorer: "SCORER",
      upset: "UPSET",
      activity: "ACTIVITY",
      consistency: "CONSISTENCY",
    } satisfies Record<MonthlyReportRadarAxisKey, string>,
    radarAxisHelp: {
      win: "WIN\n勝敗予想の強さ。当月コホート内での勝率の位置（パーセンタイル）。",
      scorer:
        "SCORER\n得点者予想の的中力。最多得点者を当てる力の相対位置。",
      upset:
        "UPSET\n番狂わせで稼ぐ力。アップセット得点の相対位置。",
      activity:
        "ACTIVITY\n参加量。ピックアップ試合にどれだけ予想したか。",
      consistency:
        "CONSISTENCY\n安定性。連勝を活かし、連敗の傷を抑える力。",
    } satisfies Record<MonthlyReportRadarAxisKey, string>,
  },
  en: {
    title: "MONTHLY REPORT",
    thisMonth: "This Month",
    participants: (n: number) => `of ${n}`,
    top: (p: string) => `TOP ${p}%`,
    posts: "picks",
    wins: "W",
    losses: "L",
    rankLabel: "RANK",
    unitsLabel: "UNITS",
    unitsEarnedLabel: "Earned",
    monthlyChange: "MoM",
    typeLabel: "Analysis Type",
    numbers: "Month in Numbers",
    unitsBreakdown: "Units Breakdown",
    unitsBreakdownEmpty: "No Units granted this month.",
    unitsBreakdownTotal: "Month total",
    unitsBreakdownExpand: "Tap for details",
    unitsBreakdownCollapse: "Hide",
    unitSource: {
      personal_weekly: "Personal · Weekly",
      personal_monthly: "Personal · Monthly",
      group_weekly: "Group · Weekly",
      group_monthly: "Group · Monthly",
      invite: "Invite",
      metric_rank: "Metric top",
      event: "Event",
    } satisfies Record<MonthlyReportUnitSource, string>,
    unitMetric: {
      totalPoints: "Points",
      winRate: "Win %",
      scorer: "Scorer",
      upset: "Upset",
    } satisfies Record<MonthlyReportUnitMetric, string>,
    unitRank: (n: number) => `#${n}`,
    radar: "Ability Chart",
    habits: "Habits",
    habitsEmpty: "Not enough sample to surface habits this month.",
    habitsMapHint: "X: Away ←→ Home / Y: Consensus ←→ Fade · Dot size = win rate",
    homeAway: "Home / Away",
    market: "Consensus / Fade",
    homeWr: "Home win %",
    awayWr: "Away win %",
    favWr: "Consensus win %",
    dogWr: "Fade win %",
    homeShare: "Home",
    awayShare: "Away",
    favShare: "Consensus",
    dogShare: "Fade",
    pickShare: "Pick share",
    affinity: "Team Affinity",
    strong: "Strong",
    weak: "Weak",
    highlights: "Highlights",
    bestPick: "Best Pick",
    myPick: "Your pick",
    bestDay: "Best Day",
    bestDayLine: (w: number, p: number) => `${w}W of ${p}`,
    streak: "Longest Streak",
    streakUnit: "wins",
    upset: "Biggest Upset",
    divisionTop10: (d: string, n: number) => `${d} #${n}`,
    outlook: "Month Summary",
    metric: {
      posts: "Picks",
      points: "Total Points",
      winRate: "Win %",
      goalScorerHits: "Scorer hits",
      upsetPoints: "Upset pts",
      units: "Units",
    } satisfies Record<MonthlyReportMetricKey, string>,
    prevDelta: "vs last",
    medianMark: "Median",
    youMark: "You",
    top10Mark: "Top 10%",
    vsMedian: "vs med",
    vsTop10: "vs top10%",
    metricRank: (n: number) => `#${n}`,
    radarAxis: {
      win: "WIN",
      scorer: "SCORER",
      upset: "UPSET",
      activity: "ACTIVITY",
      consistency: "CONSISTENCY",
    } satisfies Record<MonthlyReportRadarAxisKey, string>,
    radarAxisHelp: {
      win: "WIN\nWin-pick strength. Your win-rate percentile in this month’s cohort.",
      scorer:
        "SCORER\nGoal-scorer hit strength. Relative skill at picking top scorers.",
      upset:
        "UPSET\nUpset earning power. Relative upset points in the cohort.",
      activity:
        "ACTIVITY\nParticipation volume. How many pickup games you picked.",
      consistency:
        "CONSISTENCY\nStability. Riding win streaks while limiting losing runs.",
    } satisfies Record<MonthlyReportRadarAxisKey, string>,
  },
} as const;

const PANEL_BG = "linear-gradient(170deg, rgba(14,20,32,0.98), rgba(6,10,16,1))";
const NOTCH_SM =
  "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)";

const RADAR_ORDER: MonthlyReportRadarAxisKey[] = [
  "win",
  "scorer",
  "upset",
  "activity",
  "consistency",
];

const RADAR_ACCENT = "#22d3ee";
/** 強みスタッツ（p70+）— マイランク系のオレンジ */
const RADAR_STRENGTH = "#fb923c";
const RADAR_MUTED = "rgba(255,255,255,0.92)";

function isRadarStrength(percentile: number): boolean {
  return percentile >= MONTHLY_REPORT_RADAR_STRENGTH_P;
}

function fmtMonth(monthKey: string, lang: Lang): string {
  const [y, m] = monthKey.split("-");
  return lang === "ja" ? `${y}年${Number(m)}月` : `${y}-${m}`;
}

function fmtPt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function fmtSigned(v: number, opts?: { percent?: boolean; integer?: boolean }): string {
  const abs = opts?.integer
    ? String(Math.abs(Math.round(v)))
    : opts?.percent
      ? Math.abs(v).toFixed(1)
      : fmtPt(Math.abs(v));
  const unit = opts?.percent ? "%" : "";
  if (v > 0) return `+${abs}${unit}`;
  if (v < 0) return `−${abs}${unit}`;
  return `±0${unit}`;
}

function hexTint(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

function cellStyle(extra?: CSSProperties): CSSProperties {
  return {
    border: "1px solid rgba(34,211,238,0.28)",
    background: PANEL_BG,
    boxShadow: "inset 0 0 0 1px rgba(8,14,26,0.85)",
    clipPath: NOTCH_SM,
    WebkitClipPath: NOTCH_SM,
    ...extra,
  };
}

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative inline-block">
      <span
        className={[
          nameOxanium.className,
          "inline-block bg-white px-2 py-[5px] text-[8px] font-black uppercase leading-none tracking-[0.18em] text-black",
        ].join(" ")}
      >
        {children}
      </span>
      <span
        className="pointer-events-none absolute -bottom-0.5 -left-1 text-[9px] leading-none text-white/30"
        aria-hidden
      >
        ✦
      </span>
    </div>
  );
}

function DeltaTone({ value }: { value: number | null }) {
  if (value == null) return "rgba(255,255,255,0.4)";
  if (value > 0) return "#34d399";
  if (value < 0) return "#fb923c";
  return "rgba(255,255,255,0.45)";
}

const TIER_LABEL: Record<Exclude<KinetikRankBadgeTier, "rising">, string> = {
  legend: "LEGEND",
  elite: "ELITE",
  pro: "PRO",
  analyst: "ANALYST",
};

/** プロフィールと同じ斜めタグ（表示のみ） */
function CoverSlantTag({
  tier,
  label,
}: {
  tier: Exclude<KinetikRankBadgeTier, "rising">;
  label: string;
}) {
  return (
    <span
      className={[
        "profile-edit-kinetik-slant-tab profile-edit-kinetik-slant-tab--filled",
        `profile-edit-kinetik-slant-tab--rank-${tier}`,
        "px-2.5 py-1",
      ].join(" ")}
    >
      <span className="profile-edit-kinetik-slant-tab__scan" aria-hidden />
      <span
        className={[
          nameOxanium.className,
          "profile-edit-kinetik-slant-tab__label text-[9px] uppercase tracking-[0.14em]",
        ].join(" ")}
      >
        {label}
      </span>
    </span>
  );
}

/** 前月比 — LEGEND 同系の斜めタグ。上昇=緑 / 下降=橙。min幅固定・桁が増えたら伸びる */
function CoverDeltaSlantTag({ delta }: { delta: number }) {
  const tone =
    delta > 0
      ? {
          accent: "#34d399",
          glow: "rgba(52,211,153,0.45)",
          text: "#04140c",
        }
      : delta < 0
        ? {
            accent: "#fb923c",
            glow: "rgba(251,146,60,0.45)",
            text: "#140a02",
          }
        : {
            accent: "#94a3b8",
            glow: "rgba(148,163,184,0.35)",
            text: "#0b1018",
          };

  const ArrowIcon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : null;

  return (
    <span
      className="profile-edit-kinetik-slant-tab profile-edit-kinetik-slant-tab--filled box-border min-w-[52px] justify-center overflow-visible px-2.5 py-1"
      style={
        {
          ["--kst-accent" as string]: tone.accent,
          ["--kst-glow" as string]: tone.glow,
          ["--kst-fill-text" as string]: tone.text,
        } as CSSProperties
      }
    >
      <span className="profile-edit-kinetik-slant-tab__scan" aria-hidden />
      <span
        className={[
          nameOxanium.className,
          "relative z-[1] inline-flex items-center justify-center gap-0.5 text-[9px] font-extrabold tabular-nums tracking-normal",
        ].join(" ")}
        style={{ transform: "skewX(14deg)" }}
      >
        {ArrowIcon ? (
          <ArrowIcon
            className="h-3 w-3 shrink-0"
            strokeWidth={2.75}
            aria-hidden
            style={{
              transform: delta > 0 ? "rotate(45deg)" : "rotate(-45deg)",
            }}
          />
        ) : (
          <span>±</span>
        )}
        <span>{delta === 0 ? "0" : Math.abs(delta)}</span>
      </span>
    </span>
  );
}

/** 獲得 Unit の TOP 帯タグ（LEGEND 同系の斜めタグ） */
function CoverUnitsBandTag({ rank }: { rank: number }) {
  const accent = monthlyReportRankBandAccent(rank);
  if (!accent.label) return null;

  return (
    <span
      className="profile-edit-kinetik-slant-tab profile-edit-kinetik-slant-tab--filled box-border min-w-[52px] justify-center overflow-visible px-2.5 py-1"
      style={
        {
          ["--kst-accent" as string]: accent.main,
          ["--kst-glow" as string]: accent.glow,
          ["--kst-fill-text" as string]: "#0b1018",
        } as CSSProperties
      }
    >
      <span className="profile-edit-kinetik-slant-tab__scan" aria-hidden />
      <span
        className={[
          nameOxanium.className,
          "relative z-[1] text-[9px] font-extrabold uppercase tracking-[0.14em]",
        ].join(" ")}
        style={{ transform: "skewX(14deg)" }}
      >
        {accent.label}
      </span>
    </span>
  );
}

/** 指標内順位 — 前月比と同系の斜めタグ。色は順位帯 */
function MetricRankSlantTag({
  rank,
  label,
}: {
  rank: number;
  label: string;
}) {
  const accent = monthlyReportRankBandAccent(rank);

  return (
    <span
      className="profile-edit-kinetik-slant-tab profile-edit-kinetik-slant-tab--filled box-border min-w-[44px] justify-center overflow-visible px-2 py-0.5"
      style={
        {
          ["--kst-accent" as string]: accent.main,
          ["--kst-glow" as string]: accent.glow,
          ["--kst-fill-text" as string]: "#0b1018",
        } as CSSProperties
      }
    >
      <span className="profile-edit-kinetik-slant-tab__scan" aria-hidden />
      <span
        className={[
          nameOxanium.className,
          "relative z-[1] text-[10px] font-extrabold tabular-nums tracking-tight",
        ].join(" ")}
        style={{ transform: "skewX(14deg)" }}
      >
        {label}
      </span>
    </span>
  );
}

/** 数字セクションの表示順 */
const NUMBERS_METRIC_ORDER: MonthlyReportMetricKey[] = [
  "posts",
  "winRate",
  "units",
  "points",
  "goalScorerHits",
  "upsetPoints",
];

function sortNumbersMetrics(
  metrics: MonthlyReportMetric[]
): MonthlyReportMetric[] {
  const order = new Map(NUMBERS_METRIC_ORDER.map((k, i) => [k, i]));
  return [...metrics].sort(
    (a, b) => (order.get(a.key) ?? 99) - (order.get(b.key) ?? 99)
  );
}

/* ============================================================
 * 1. 表紙
 * ============================================================ */

function CoverBlock({ report, lang }: { report: MonthlyReport; lang: Lang }) {
  const c = COPY[lang];
  const delta = report.rankDeltaPlaces;
  const typeColor = ANALYSIS_TYPE_COLOR[report.analysisTypeId];
  const typeCopy = resolveMonthlyReportAnalysisTypeCopy(report.analysisTypeId);
  const typeLabel = typeCopy.label;
  const band = monthlyReportRankBandAccent(report.rank);

  const topPct =
    report.topPercent ??
    computeTopPercentile(report.rank, report.participantCount);
  const tier = getKinetikRankBadgeTierFromTopPercent(topPct);

  return (
    <RankingsCyberPanel
      accentRgb={band.glow}
      shellStyle={{
        border: `1px solid ${band.border}`,
        background: `linear-gradient(170deg, ${band.tint}, rgba(6,10,16,0.98) 62%), ${PANEL_BG}`,
        boxShadow: `inset 0 0 0 1px rgba(8,14,26,0.9), inset 0 0 28px ${band.tint}, 0 0 22px ${band.glow}`,
      }}
    >
      <div className="relative z-10">
        <p
          className={[
            nameOxanium.className,
            "text-[9px] font-bold uppercase tracking-[0.16em] text-white/42",
          ].join(" ")}
        >
          {c.thisMonth}
        </p>

        <div className="relative mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-1">
          {/* LEFT: RANK */}
          <div className="min-w-0 flex flex-col items-center text-center">
            <p
              className={[
                nameOxanium.className,
                "text-[9px] font-bold uppercase tracking-[0.18em]",
              ].join(" ")}
              style={{ color: band.text, opacity: 0.75 }}
            >
              {c.rankLabel}
            </p>
            <p
              className={[nameBebas.className, "mt-1 leading-none"].join(" ")}
              style={{
                fontSize: "3.2rem",
                transform: "skewX(-10deg)",
                letterSpacing: "0.02em",
                color: band.text,
                textShadow: `0 0 24px ${band.glow}`,
              }}
            >
              <span style={{ fontSize: "1.85rem", color: `${band.main}99` }}>
                #
              </span>
              {report.rank}
            </p>
            <p
              className={[
                nameOxanium.className,
                "mt-1 text-[11px] font-bold tabular-nums tracking-[0.08em] text-white/40",
              ].join(" ")}
            >
              {c.participants(report.participantCount)}
            </p>

            {(tier || delta != null) && (
              <div className="mt-2.5 flex items-start justify-center gap-1.5">
                {tier ? (
                  <CoverSlantTag tier={tier} label={TIER_LABEL[tier]} />
                ) : null}
                {delta != null ? (
                  <div className="flex flex-col items-center">
                    <CoverDeltaSlantTag delta={delta} />
                    <p
                      className={[
                        nameOxanium.className,
                        "mt-1.5 text-[10px] font-bold tracking-[0.12em] text-white/55",
                      ].join(" ")}
                    >
                      {c.monthlyChange}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* CENTER: single slash */}
          <div
            className="relative mx-1 flex w-5 self-stretch items-center justify-center"
            aria-hidden
          >
            <span
              className="absolute h-[72%] min-h-16 w-px bg-white/30"
              style={{ transform: "rotate(18deg)" }}
            />
          </div>

          {/* RIGHT: UNITS */}
          <div className="min-w-0 flex flex-col items-center text-center">
            <p
              className={[
                nameOxanium.className,
                "text-[9px] font-bold uppercase tracking-[0.18em] text-white/45",
              ].join(" ")}
            >
              {c.unitsEarnedLabel}
            </p>
            <p
              className={[nameBebas.className, "mt-1 leading-none text-white"].join(
                " "
              )}
              style={{
                fontSize: "3.2rem",
                transform: "skewX(-10deg)",
                letterSpacing: "0.02em",
                textShadow: "0 0 18px rgba(255,255,255,0.12)",
              }}
            >
              {report.unitsEarned}
            </p>
            <p
              className={[
                nameOxanium.className,
                "mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45",
              ].join(" ")}
            >
              {c.unitsLabel}
            </p>
            {report.unitsEarnedRank != null &&
            resolveMonthlyReportRankBand(report.unitsEarnedRank) !== "field" ? (
              <div className="mt-2.5">
                <CoverUnitsBandTag rank={report.unitsEarnedRank} />
              </div>
            ) : null}
          </div>
        </div>

        {/* analysis type */}
        <div
          className="mt-3 px-3.5 py-3"
          style={{
            border: `1px solid ${hexTint(typeColor, "66")}`,
            background: `linear-gradient(170deg, ${hexTint(typeColor, "1f")}, rgba(6,10,16,0.95) 75%), ${PANEL_BG}`,
            boxShadow: `inset 0 0 18px ${hexTint(typeColor, "14")}`,
            clipPath: NOTCH_SM,
            WebkitClipPath: NOTCH_SM,
          }}
        >
          <p
            className={[
              nameOxanium.className,
              "text-[8px] font-bold uppercase tracking-[0.18em] text-white/45",
            ].join(" ")}
          >
            {c.typeLabel}
          </p>
          <p
            className={[nameBebas.className, "mt-1.5 leading-none"].join(" ")}
            style={{
              fontSize: "1.7rem",
              transform: "skewX(-8deg)",
              color: typeColor,
              textShadow: `0 0 22px ${hexTint(typeColor, "59")}`,
              letterSpacing: "0.04em",
            }}
          >
            {typeLabel}
          </p>
        </div>
      </div>
    </RankingsCyberPanel>
  );
}

/* ============================================================
 * 2. 数字で見る今月
 * ============================================================ */

function formatMetricValue(m: MonthlyReportMetric): string {
  if (m.key === "winRate") return `${fmtPt(m.value)}%`;
  if (
    m.key === "goalScorerHits" ||
    m.key === "posts" ||
    m.key === "units"
  ) {
    return String(Math.round(m.value));
  }
  return fmtPt(m.value);
}

function formatMetricAbs(m: MonthlyReportMetric, v: number): string {
  if (m.key === "winRate") return `${fmtPt(v)}%`;
  if (
    m.key === "goalScorerHits" ||
    m.key === "posts" ||
    m.key === "units"
  ) {
    return String(Math.round(v));
  }
  return fmtPt(v);
}

function formatMetricDelta(
  m: MonthlyReportMetric,
  delta: number | null
): string | null {
  if (delta == null) return null;
  if (m.key === "winRate") return fmtSigned(delta, { percent: true });
  if (
    m.key === "goalScorerHits" ||
    m.key === "posts" ||
    m.key === "units"
  ) {
    return fmtSigned(delta, { integer: true });
  }
  return fmtSigned(delta);
}

function showsMetricRank(key: MonthlyReportMetricKey): boolean {
  return key !== "posts" && key !== "winRate";
}

const MARK_MEDIAN = "rgba(255,255,255,0.55)";
const MARK_YOU = "#fb923c";
const MARK_TOP10 = "#fcd34d";

function MetricRangeBar({
  metric,
  lang,
}: {
  metric: MonthlyReportMetric;
  lang: Lang;
}) {
  const c = COPY[lang];
  const { value, median, top10 } = metric;
  if (median == null && top10 == null) return null;

  const pts = [value];
  if (median != null) pts.push(median);
  if (top10 != null) pts.push(top10);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min;
  const pad = span > 0 ? span * 0.14 : Math.max(Math.abs(max) * 0.08, 1);
  const lo = min - pad;
  const hi = max + pad;
  const toPct = (v: number) => ((v - lo) / (hi - lo)) * 100;

  const youPct = toPct(value);
  const fillTone = MARK_YOU;

  const vsMedian =
    median != null ? formatMetricDelta(metric, value - median) : null;
  const vsTop10 =
    top10 != null ? formatMetricDelta(metric, value - top10) : null;

  return (
    <div className="mt-2.5">
      <div className="relative h-2.5 w-full overflow-visible rounded-[2px] bg-white/8">
        <div
          className="absolute inset-y-0 left-0 rounded-[2px]"
          style={{
            width: `${youPct}%`,
            background: `linear-gradient(90deg, ${fillTone}33, ${fillTone}aa)`,
            boxShadow: `0 0 10px ${fillTone}55`,
          }}
        />
        {median != null ? (
          <span
            className="absolute top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${toPct(median)}%`, background: MARK_MEDIAN }}
            title={`${c.medianMark} ${formatMetricAbs(metric, median)}`}
          />
        ) : null}
        {top10 != null ? (
          <span
            className="absolute top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${toPct(top10)}%`, background: MARK_TOP10 }}
            title={`${c.top10Mark} ${formatMetricAbs(metric, top10)}`}
          />
        ) : null}
        <span
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-black/40"
          style={{
            left: `${youPct}%`,
            background: MARK_YOU,
            boxShadow: `0 0 10px ${MARK_YOU}`,
          }}
          title={`${c.youMark} ${formatMetricAbs(metric, value)}`}
        />
      </div>

      {(vsMedian != null || vsTop10 != null) && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5">
          {vsMedian != null ? (
            <p
              className={[
                nameOxanium.className,
                "text-[11px] font-bold uppercase tracking-[0.08em] tabular-nums",
              ].join(" ")}
            >
              <span className="text-white/40">{c.vsMedian} </span>
              <span style={{ color: DeltaTone({ value: value - (median ?? 0) }) }}>
                {vsMedian}
              </span>
            </p>
          ) : null}
          {vsTop10 != null ? (
            <p
              className={[
                nameOxanium.className,
                "text-[11px] font-bold uppercase tracking-[0.08em] tabular-nums",
              ].join(" ")}
            >
              <span className="text-white/40">{c.vsTop10} </span>
              <span style={{ color: DeltaTone({ value: value - (top10 ?? 0) }) }}>
                {vsTop10}
              </span>
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function NumbersBlock({
  metrics,
  lang,
}: {
  metrics: MonthlyReportMetric[];
  lang: Lang;
}) {
  const c = COPY[lang];
  const ordered = sortNumbersMetrics(metrics);
  return (
    <section>
      <SectionBadge>{c.numbers}</SectionBadge>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className={[
            nameOxanium.className,
            "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/45",
          ].join(" ")}
        >
          <span className="inline-block h-2.5 w-px" style={{ background: MARK_MEDIAN }} />
          {c.medianMark}
        </span>
        <span
          className={[
            nameOxanium.className,
            "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/45",
          ].join(" ")}
        >
          <span
            className="inline-block h-2 w-2 rotate-45"
            style={{ background: MARK_YOU }}
          />
          {c.youMark}
        </span>
        <span
          className={[
            nameOxanium.className,
            "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/45",
          ].join(" ")}
        >
          <span className="inline-block h-2.5 w-px" style={{ background: MARK_TOP10 }} />
          {c.top10Mark}
        </span>
      </div>
      <div className="mt-2 grid gap-1.5">
        {ordered.map((m) => {
          const prev = formatMetricDelta(m, m.prevDelta);
          const showRank = showsMetricRank(m.key) && m.rank != null;
          return (
            <div key={m.key} className="px-3.5 py-3" style={cellStyle()}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <p
                    className={[
                      nameOxanium.className,
                      "text-[11px] font-bold uppercase tracking-[0.14em] text-white/50",
                    ].join(" ")}
                  >
                    {c.metric[m.key]}
                  </p>
                  {showRank ? (
                    <MetricRankSlantTag
                      rank={m.rank!}
                      label={c.metricRank(m.rank!)}
                    />
                  ) : null}
                </div>
                <div className="flex items-baseline gap-2.5">
                  {prev != null ? (
                    <p
                      className={[
                        nameOxanium.className,
                        "text-[11px] font-bold uppercase tracking-[0.08em] tabular-nums",
                      ].join(" ")}
                    >
                      <span className="text-white/40">{c.prevDelta} </span>
                      <span style={{ color: DeltaTone({ value: m.prevDelta }) }}>
                        {prev}
                      </span>
                    </p>
                  ) : null}
                  <p
                    className={[
                      nameOxanium.className,
                      "text-[22px] font-extrabold leading-none tabular-nums tracking-tight text-white",
                    ].join(" ")}
                  >
                    {formatMetricValue(m)}
                  </p>
                </div>
              </div>
              <MetricRangeBar metric={m} lang={lang} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================
 * 2b. 獲得 Unit 内訳
 * ============================================================ */

const UNIT_SOURCE_COLOR: Record<MonthlyReportUnitSource, string> = {
  personal_weekly: "#22d3ee",
  personal_monthly: "#67e8f9",
  group_weekly: "#e879f9",
  group_monthly: "#c084fc",
  invite: "#34d399",
  metric_rank: "#fb923c",
  event: "#fbbf24",
};

function unitGrantTitle(
  g: MonthlyReportUnitGrant,
  c: (typeof COPY)["ja"]
): string {
  if (g.label) return g.label;
  if (g.source === "metric_rank" && g.metric) {
    return `${c.unitSource.metric_rank} · ${c.unitMetric[g.metric]}`;
  }
  return c.unitSource[g.source];
}

function UnitsBreakdownBlock({
  total,
  entries,
  lang,
}: {
  total: number;
  entries: MonthlyReportUnitGrant[];
  lang: Lang;
}) {
  const c = COPY[lang];
  const [open, setOpen] = useState(false);
  const sorted = [...entries].sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return b.grantedDateKey.localeCompare(a.grantedDateKey);
  });
  const sum = sorted.reduce((s, e) => s + e.amount, 0);
  const barTotal = Math.max(sum, total, 1);
  const canExpand = sorted.length > 0;

  const bySource = new Map<MonthlyReportUnitSource, number>();
  for (const e of sorted) {
    bySource.set(e.source, (bySource.get(e.source) ?? 0) + e.amount);
  }
  const sourceSegments = (
    Object.keys(UNIT_SOURCE_COLOR) as MonthlyReportUnitSource[]
  )
    .map((source) => ({
      source,
      amount: bySource.get(source) ?? 0,
    }))
    .filter((s) => s.amount > 0);

  return (
    <section>
      <SectionBadge>{c.unitsBreakdown}</SectionBadge>
      <div className="mt-2 space-y-1.5">
        <button
          type="button"
          disabled={!canExpand}
          aria-expanded={canExpand ? open : undefined}
          onClick={() => {
            if (canExpand) setOpen((v) => !v);
          }}
          className={[
            "w-full px-3.5 py-3 text-left transition-[border-color,box-shadow]",
            canExpand
              ? "cursor-pointer active:brightness-110"
              : "cursor-default",
          ].join(" ")}
          style={cellStyle(
            canExpand && open
              ? { borderColor: "rgba(34,211,238,0.45)" }
              : undefined
          )}
        >
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={[
                nameOxanium.className,
                "text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-300/75",
              ].join(" ")}
            >
              {c.unitsBreakdownTotal}
            </p>
            <p className="flex items-baseline gap-1">
              <CyberScanlineText subtle>
                <span
                  className={[
                    nameOxanium.className,
                    "text-[22px] font-extrabold leading-none tabular-nums text-white",
                  ].join(" ")}
                >
                  {total}
                </span>
              </CyberScanlineText>
              <span
                className={[
                  nameOxanium.className,
                  "text-[9px] font-bold uppercase tracking-[0.14em] text-white/40",
                ].join(" ")}
              >
                U
              </span>
            </p>
          </div>

          {sourceSegments.length > 0 ? (
            <div className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-white/8">
              {sourceSegments.map((s) => (
                <div
                  key={s.source}
                  className="h-full"
                  style={{
                    width: `${(s.amount / barTotal) * 100}%`,
                    background: UNIT_SOURCE_COLOR[s.source],
                  }}
                  title={`${c.unitSource[s.source]} ${s.amount}`}
                />
              ))}
            </div>
          ) : (
            <p
              className={[
                lang === "ja" ? jp.className : nameOxanium.className,
                "mt-2 text-[12px] leading-relaxed text-white/45",
              ].join(" ")}
            >
              {c.unitsBreakdownEmpty}
            </p>
          )}

          {canExpand ? (
            <p
              className={[
                nameOxanium.className,
                "mt-2 flex items-center justify-between gap-2 text-[8px] font-bold uppercase tracking-[0.14em] text-white/35",
              ].join(" ")}
            >
              <span>
                {open ? c.unitsBreakdownCollapse : c.unitsBreakdownExpand}
              </span>
              <ArrowDown
                className={[
                  "h-3 w-3 transition-transform duration-200",
                  open ? "rotate-180" : "",
                ].join(" ")}
                strokeWidth={2.5}
                aria-hidden
              />
            </p>
          ) : null}
        </button>

        {open && canExpand ? (
          <div className="grid gap-1.5">
            {sorted.map((g) => {
              const accent = UNIT_SOURCE_COLOR[g.source];
              return (
                <div
                  key={g.id}
                  className="flex items-center gap-3 px-3 py-2.5"
                  style={cellStyle()}
                >
                  <span
                    className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background: accent,
                      boxShadow: `0 0 10px ${accent}88`,
                    }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={[
                        nameOxanium.className,
                        "truncate text-[12px] font-extrabold tracking-[0.04em] text-white",
                      ].join(" ")}
                    >
                      {unitGrantTitle(g, c)}
                    </p>
                    <p
                      className={[
                        nameOxanium.className,
                        "mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/40",
                      ].join(" ")}
                    >
                      {g.periodLabel}
                      {g.rank != null ? (
                        <>
                          <span className="mx-1 text-white/20">·</span>
                          {c.unitRank(g.rank)}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <CyberScanlineText subtle>
                    <span
                      className={[
                        nameBebas.className,
                        "text-[22px] leading-none tabular-nums text-emerald-300",
                      ].join(" ")}
                      style={{ textShadow: "0 0 12px rgba(52,211,153,0.35)" }}
                    >
                      +{g.amount}
                    </span>
                  </CyberScanlineText>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ============================================================
 * 3. 能力チャート（5軸・パーセンタイル）
 * ============================================================ */

function RadarAxisTick(props: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  textAnchor?: string;
}) {
  const { x = 0, y = 0, payload, textAnchor = "middle" } = props;
  const label = payload?.value ?? "";
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      dominantBaseline="central"
      fill="rgba(224,242,254,0.92)"
      fontSize={9}
      fontWeight={800}
      letterSpacing="0.06em"
      style={{ fontFamily: "var(--font-oxanium), ui-sans-serif, system-ui" }}
    >
      {label}
    </text>
  );
}

function RadarBlock({
  report,
  lang,
}: {
  report: MonthlyReport;
  lang: Lang;
}) {
  const c = COPY[lang];
  const { radar, analysisTypeId } = report;
  const typeCopy = resolveMonthlyReportAnalysisTypeCopy(analysisTypeId);
  const typeColor = ANALYSIS_TYPE_COLOR[analysisTypeId] ?? "#f8fafc";
  const data = RADAR_ORDER.map((key) => ({
    axis: c.radarAxis[key],
    value: radar[key],
  }));
  const typeLines = typeCopy.description
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const [axisTip, setAxisTip] = useState<{
    key: MonthlyReportRadarAxisKey;
    rect: DOMRect;
  } | null>(null);

  return (
    <section>
      <SectionBadge>{c.radar}</SectionBadge>
      <div
        className="mt-2 overflow-hidden px-3 pb-4 pt-3"
        style={{
          ...cellStyle(),
          background:
            "radial-gradient(ellipse 80% 55% at 50% 28%, rgba(34,211,238,0.10), transparent 62%), linear-gradient(170deg, rgba(12,16,24,0.98), rgba(5,8,12,1))",
        }}
      >
        <div className="mx-auto h-[260px] w-full max-w-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <ReRadarChart
              data={data}
              cx="50%"
              cy="52%"
              outerRadius="58%"
              margin={{ top: 18, right: 36, bottom: 18, left: 36 }}
            >
              <PolarGrid
                stroke="rgba(148,163,184,0.28)"
                strokeDasharray="1 5"
                gridType="polygon"
              />
              <PolarAngleAxis
                dataKey="axis"
                tick={<RadarAxisTick />}
                tickLine={false}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                dataKey="value"
                stroke={RADAR_ACCENT}
                fill={RADAR_ACCENT}
                fillOpacity={0.16}
                strokeWidth={2.5}
                dot={{
                  r: 3.5,
                  fill: "#f8fafc",
                  stroke: RADAR_ACCENT,
                  strokeWidth: 1.5,
                }}
                style={{
                  filter: "drop-shadow(0 0 6px rgba(34,211,238,0.55))",
                }}
              />
            </ReRadarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-1 flex items-stretch justify-between gap-0 px-0.5">
          {RADAR_ORDER.map((key, i) => {
            const v = Math.round(radar[key]);
            const strong = isRadarStrength(radar[key]);
            const num = (
              <span
                className={[
                  nameOxanium.className,
                  "text-[18px] font-extrabold leading-none tabular-nums tracking-tight",
                ].join(" ")}
                style={{
                  color: strong ? RADAR_STRENGTH : RADAR_MUTED,
                  textShadow: strong
                    ? "0 0 12px rgba(251,146,60,0.45)"
                    : undefined,
                }}
              >
                {v}
              </span>
            );
            return (
              <button
                key={key}
                type="button"
                className={[
                  "flex min-w-0 flex-1 flex-col items-center px-0.5",
                  i > 0 ? "border-l border-white/10" : "",
                ].join(" ")}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = (
                    e.currentTarget as HTMLButtonElement
                  ).getBoundingClientRect();
                  setAxisTip((prev) =>
                    prev?.key === key ? null : { key, rect }
                  );
                }}
                aria-label={c.radarAxisHelp[key].replace("\n", ": ")}
              >
                <p
                  className={[
                    nameOxanium.className,
                    "max-w-full text-center text-[7px] font-bold uppercase leading-tight tracking-[0.02em] text-white/40 underline decoration-white/20 decoration-dotted underline-offset-2",
                  ].join(" ")}
                >
                  {c.radarAxis[key]}
                </p>
                <div className="mt-0.5">
                  <CyberScanlineText subtle={!strong}>{num}</CyberScanlineText>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 border-t border-white/[0.08] pt-3.5">
          <p
            className={[
              nameOxanium.className,
              "text-[8px] font-bold uppercase tracking-[0.18em] text-white/45",
            ].join(" ")}
          >
            {c.typeLabel}
          </p>
          <p
            className={[nameBebas.className, "mt-1.5 leading-none"].join(" ")}
            style={{
              fontSize: "1.55rem",
              transform: "skewX(-8deg)",
              color: typeColor,
              textShadow: `0 0 22px ${hexTint(typeColor, "59")}`,
              letterSpacing: "0.04em",
            }}
          >
            {typeCopy.label}
          </p>
          <div className="mt-2.5 space-y-1.5">
            {typeLines.map((line) => (
              <p
                key={line}
                className={[
                  jp.className,
                  "text-[12px] leading-relaxed text-white/55",
                ].join(" ")}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      {axisTip ? (
        <CyberTooltip
          anchorRect={axisTip.rect}
          message={c.radarAxisHelp[axisTip.key]}
          theme={KINETIK_CYBER_TOOLTIP_DEFAULT}
          onClose={() => setAxisTip(null)}
        />
      ) : null}
    </section>
  );
}

/* ============================================================
 * 4. 予想のクセ — スタイルマップ（自分1点）+ 勝率 + 短文
 * ============================================================ */

function clampBias(v: number) {
  return Math.min(1, Math.max(-1, v));
}

function winRateToDotSize(winRate: number) {
  const pct = Math.round(winRate * 100);
  if (pct < 40) return 8;
  if (pct < 47) return 10;
  if (pct < 54) return 12;
  if (pct < 61) return 15;
  if (pct < 68) return 18;
  if (pct < 75) return 21;
  return 24;
}

function HabitsShareBar({
  leftLabel,
  rightLabel,
  leftShare,
  leftColor,
  rightColor,
}: {
  leftLabel: string;
  rightLabel: string;
  leftShare: number;
  leftColor: string;
  rightColor: string;
}) {
  const left = Math.max(0, Math.min(1, leftShare));
  const right = 1 - left;
  return (
    <div className="mt-2.5">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full"
          style={{ width: `${left * 100}%`, background: leftColor }}
        />
        <div
          className="h-full"
          style={{ width: `${right * 100}%`, background: rightColor }}
        />
      </div>
      <div className="mt-1.5 flex justify-between gap-2">
        <span
          className={[
            nameOxanium.className,
            "text-[8px] font-bold uppercase tracking-[0.12em] text-white/45",
          ].join(" ")}
        >
          {leftLabel} {Math.round(left * 100)}%
        </span>
        <span
          className={[
            nameOxanium.className,
            "text-[8px] font-bold uppercase tracking-[0.12em] text-white/45",
          ].join(" ")}
        >
          {rightLabel} {Math.round(right * 100)}%
        </span>
      </div>
    </div>
  );
}

function HabitsRatePair({
  title,
  leftLabel,
  rightLabel,
  leftShareLabel,
  rightShareLabel,
  leftRate,
  rightRate,
  leftColor,
  rightColor,
  leftShare,
}: {
  title: string;
  leftLabel: string;
  rightLabel: string;
  leftShareLabel: string;
  rightShareLabel: string;
  leftRate: number;
  rightRate: number;
  leftColor: string;
  rightColor: string;
  leftShare: number;
}) {
  const leftPct = Math.round(leftRate * 100);
  const rightPct = Math.round(rightRate * 100);
  const leftHigher = leftPct > rightPct;
  const rightHigher = rightPct > leftPct;

  return (
    <div className="px-3 py-2.5" style={cellStyle()}>
      <p
        className={[
          nameOxanium.className,
          "text-[8px] font-bold uppercase tracking-[0.16em] text-cyan-300/75",
        ].join(" ")}
      >
        {title}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <p
            className={[
              nameOxanium.className,
              "text-[8px] font-bold uppercase tracking-[0.12em]",
            ].join(" ")}
            style={{ color: leftColor }}
          >
            {leftLabel}
          </p>
          <CyberScanlineText subtle>
            <span
              className={[
                nameOxanium.className,
                "text-[20px] font-extrabold leading-none tabular-nums",
                leftHigher ? "text-amber-300" : "text-white",
              ].join(" ")}
            >
              {leftPct}
              <span className="text-[11px] font-bold text-white/50">%</span>
            </span>
          </CyberScanlineText>
        </div>
        <div className="text-right">
          <p
            className={[
              nameOxanium.className,
              "text-[8px] font-bold uppercase tracking-[0.12em]",
            ].join(" ")}
            style={{ color: rightColor }}
          >
            {rightLabel}
          </p>
          <CyberScanlineText subtle>
            <span
              className={[
                nameOxanium.className,
                "text-[20px] font-extrabold leading-none tabular-nums",
                rightHigher ? "text-amber-300" : "text-white",
              ].join(" ")}
            >
              {rightPct}
              <span className="text-[11px] font-bold text-white/50">%</span>
            </span>
          </CyberScanlineText>
        </div>
      </div>
      <HabitsShareBar
        leftLabel={leftShareLabel}
        rightLabel={rightShareLabel}
        leftShare={leftShare}
        leftColor={leftColor}
        rightColor={rightColor}
      />
    </div>
  );
}

function HabitsBlock({
  habits,
  lang,
}: {
  habits: MonthlyReportHabits | null;
  lang: Lang;
}) {
  const c = COPY[lang];

  if (!habits) {
    return (
      <section>
        <SectionBadge>{c.habits}</SectionBadge>
        <div className="mt-2 px-3.5 py-3" style={cellStyle()}>
          <p
            className={[
              lang === "ja" ? jp.className : nameOxanium.className,
              "text-[12px] leading-relaxed text-white/45",
            ].join(" ")}
          >
            {c.habitsEmpty}
          </p>
        </div>
      </section>
    );
  }

  const x = clampBias(habits.homeAwayBias);
  const y = clampBias(-habits.marketBias);
  const dot = winRateToDotSize(habits.winRate);
  const COLOR_HOME = "#22d3ee";
  const COLOR_AWAY = "#e879f9";
  const COLOR_FAV = "#e879f9";
  const COLOR_DOG = "#22d3ee";

  return (
    <section>
      <SectionBadge>{c.habits}</SectionBadge>
      <div className="mt-2 space-y-1.5">
        <div className="overflow-hidden px-3 py-3" style={cellStyle()}>
          <div
            className="relative h-44 overflow-hidden"
            style={{
              border: "1px solid rgba(34,211,238,0.22)",
              background:
                "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(34,211,238,0.10), transparent 62%), radial-gradient(ellipse 90% 80% at 50% 50%, #07101c 0%, #03060e 100%)",
            }}
          >
            {/* fine cyan grid */}
            <div
              className="absolute inset-0 opacity-[0.55]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(34,211,238,0.11) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(34,211,238,0.11) 1px, transparent 1px)
                `,
                backgroundSize: "14px 14px",
                maskImage:
                  "radial-gradient(ellipse 85% 75% at 50% 50%, #000 40%, transparent 100%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 85% 75% at 50% 50%, #000 40%, transparent 100%)",
              }}
              aria-hidden
            />
            {/* major grid */}
            <div
              className="absolute inset-0 opacity-[0.45]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(56,189,248,0.22) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(56,189,248,0.22) 1px, transparent 1px)
                `,
                backgroundSize: "56px 56px",
                backgroundPosition: "center",
                maskImage:
                  "radial-gradient(ellipse 80% 70% at 50% 50%, #000 35%, transparent 100%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 80% 70% at 50% 50%, #000 35%, transparent 100%)",
              }}
              aria-hidden
            />
            {/* scanlines */}
            <div
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,0,0,0.45) 2px, rgba(0,0,0,0.45) 3px)",
              }}
              aria-hidden
            />
            {/* quadrant tint */}
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background: `
                  linear-gradient(135deg, rgba(232,121,249,0.07) 0%, transparent 42%),
                  linear-gradient(315deg, rgba(34,211,238,0.08) 0%, transparent 42%)
                `,
              }}
              aria-hidden
            />

            {/* crosshair axes */}
            <div
              className="absolute bottom-0 left-1/2 top-0 w-px"
              style={{
                background:
                  "linear-gradient(180deg, transparent, rgba(34,211,238,0.55) 18%, rgba(34,211,238,0.85) 50%, rgba(34,211,238,0.55) 82%, transparent)",
                boxShadow: "0 0 10px rgba(34,211,238,0.35)",
              }}
            />
            <div
              className="absolute left-0 right-0 top-1/2 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(232,121,249,0.45) 18%, rgba(255,255,255,0.55) 50%, rgba(34,211,238,0.45) 82%, transparent)",
                boxShadow: "0 0 10px rgba(125,211,252,0.25)",
              }}
            />
            {/* center reticle */}
            <div
              className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/40"
              aria-hidden
            />

            <span
              className={[
                nameOxanium.className,
                "absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-bold uppercase tracking-[0.14em] text-fuchsia-200/55",
              ].join(" ")}
            >
              Away
            </span>
            <span
              className={[
                nameOxanium.className,
                "absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold uppercase tracking-[0.14em] text-cyan-200/60",
              ].join(" ")}
            >
              Home
            </span>
            <span
              className={[
                nameOxanium.className,
                "absolute left-1/2 top-2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-[0.14em] text-cyan-200/55",
              ].join(" ")}
            >
              {lang === "ja" ? "順当" : "CONSENSUS"}
            </span>
            <span
              className={[
                nameOxanium.className,
                "absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-[0.14em] text-fuchsia-200/55",
              ].join(" ")}
            >
              {lang === "ja" ? "逆張り" : "FADE"}
            </span>

            <div
              className="absolute rounded-full bg-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.7)]"
              style={{
                width: dot,
                height: dot,
                left: `${50 + x * 38}%`,
                top: `${50 - y * 38}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          <p
            className={[
              nameBebas.className,
              "mt-3 origin-left -skew-x-[8deg] text-[22px] leading-none tracking-[0.02em] text-white",
            ].join(" ")}
          >
            {habits.summaryTitle}
          </p>
          <p
            className={[
              lang === "ja" ? jp.className : nameOxanium.className,
              "mt-1.5 text-[12px] leading-relaxed text-white/70",
            ].join(" ")}
          >
            {habits.summaryBody}
          </p>
          <p
            className={[
              nameOxanium.className,
              "mt-2 text-[8px] font-bold uppercase tracking-[0.12em] text-white/35",
            ].join(" ")}
          >
            {c.habitsMapHint}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          <HabitsRatePair
            title={c.homeAway}
            leftLabel={c.homeWr}
            rightLabel={c.awayWr}
            leftShareLabel={c.homeShare}
            rightShareLabel={c.awayShare}
            leftRate={habits.home.winRate}
            rightRate={habits.away.winRate}
            leftColor={COLOR_HOME}
            rightColor={COLOR_AWAY}
            leftShare={habits.home.share}
          />
          <HabitsRatePair
            title={c.market}
            leftLabel={c.dogWr}
            rightLabel={c.favWr}
            leftShareLabel={c.dogShare}
            rightShareLabel={c.favShare}
            leftRate={habits.underdog.winRate}
            rightRate={habits.favorite.winRate}
            leftColor={COLOR_DOG}
            rightColor={COLOR_FAV}
            leftShare={habits.underdog.share}
          />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * 5. チーム相性
 * ============================================================ */

function TeamList({
  title,
  teams,
  tone,
}: {
  title: string;
  teams: MonthlyReportTeam[];
  tone: "strong" | "weak";
}) {
  const accent = tone === "strong" ? "#34d399" : "#fb7185";
  return (
    <div className="px-3 py-2.5" style={cellStyle()}>
      <p
        className={[
          nameOxanium.className,
          "text-[10px] font-bold uppercase tracking-[0.16em]",
        ].join(" ")}
        style={{ color: accent }}
      >
        {title}
      </p>
      <ul className="mt-2.5 space-y-2">
        {teams.map((t) => {
          const color = getTeamPrimaryColor("nba", t.teamId);
          return (
            <li key={t.teamId} className="flex items-baseline justify-between gap-2">
              <span
                className={[
                  nameOxanium.className,
                  "text-[14px] font-extrabold uppercase tracking-[0.06em]",
                ].join(" ")}
                style={{ color: color || "#fff" }}
              >
                {t.abbr}
              </span>
              <span
                className={[
                  nameOxanium.className,
                  "text-[12px] font-bold tabular-nums tracking-[0.06em] text-white/55",
                ].join(" ")}
              >
                {t.wins}–{t.losses}
                <span className="mx-1 text-white/25">·</span>
                {fmtPt(t.points)}pt
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AffinityBlock({
  strong,
  weak,
  lang,
}: {
  strong: MonthlyReportTeam[];
  weak: MonthlyReportTeam[];
  lang: Lang;
}) {
  const c = COPY[lang];
  return (
    <section>
      <SectionBadge>{c.affinity}</SectionBadge>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <TeamList title={c.strong} teams={strong} tone="strong" />
        <TeamList title={c.weak} teams={weak} tone="weak" />
      </div>
    </section>
  );
}

/* ============================================================
 * 6. 月間ハイライト
 * ============================================================ */

function HighlightCard({
  item,
  lang,
}: {
  item: MonthlyReportHighlight;
  lang: Lang;
}) {
  const c = COPY[lang];

  if (item.kind === "bestPick") {
    const homeColor = getTeamPrimaryColor("nba", item.home.teamId);
    const awayColor = getTeamPrimaryColor("nba", item.away.teamId);
    return (
      <div className="relative overflow-hidden px-4 py-3" style={cellStyle()}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${homeColor}22 0%, transparent 32%, transparent 68%, ${awayColor}22 100%)`,
          }}
          aria-hidden
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <p
              className={[
                nameOxanium.className,
                "text-[9px] font-bold uppercase tracking-[0.16em] text-white/45",
              ].join(" ")}
            >
              {c.bestPick} · {item.dateKey.slice(5).replace("-", "/")}
            </p>
            <span
              className={[nameBebas.className, "text-xl leading-none text-emerald-400"].join(
                " "
              )}
              style={{
                transform: "skewX(-10deg)",
                textShadow: "0 0 16px rgba(52,211,153,0.32)",
              }}
            >
              +{fmtPt(item.points)}pt
            </span>
          </div>
          <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <p
              className={[
                nameOxanium.className,
                "truncate text-right text-sm font-extrabold uppercase tracking-[0.06em]",
              ].join(" ")}
              style={{ color: homeColor }}
            >
              {item.home.abbr}
            </p>
            <p
              className={[nameBebas.className, "text-2xl leading-none text-white tabular-nums"].join(
                " "
              )}
            >
              {item.home.score}
              <span className="mx-1 text-white/35">–</span>
              {item.away.score}
            </p>
            <p
              className={[
                nameOxanium.className,
                "truncate text-left text-sm font-extrabold uppercase tracking-[0.06em]",
              ].join(" ")}
              style={{ color: awayColor }}
            >
              {item.away.abbr}
            </p>
          </div>
          <p
            className={[
              nameOxanium.className,
              "mt-1 text-center text-[10px] font-bold uppercase tracking-[0.1em] tabular-nums text-white/45",
            ].join(" ")}
          >
            {c.myPick} {item.myHome}–{item.myAway}
          </p>
        </div>
      </div>
    );
  }

  if (item.kind === "bestDay") {
    return (
      <div className="px-3 py-2.5" style={cellStyle()}>
        <p
          className={[
            nameOxanium.className,
            "text-[9px] font-bold uppercase tracking-[0.16em] text-white/45",
          ].join(" ")}
        >
          {c.bestDay} · {item.dateKey.slice(5).replace("-", "/")}
        </p>
        <p className="mt-1 flex items-baseline gap-1">
          <span
            className={[nameBebas.className, "text-[22px] leading-none text-cyan-300"].join(" ")}
            style={{ textShadow: "0 0 14px rgba(34,211,238,0.35)" }}
          >
            +{fmtPt(item.points)}
          </span>
          <span
            className={[
              nameOxanium.className,
              "text-[9px] font-bold uppercase tracking-[0.14em] text-white/40",
            ].join(" ")}
          >
            PT
          </span>
        </p>
        <p
          className={[
            nameOxanium.className,
            "mt-1 text-[9px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/45",
          ].join(" ")}
        >
          {c.bestDayLine(item.wins, item.posts)}
        </p>
      </div>
    );
  }

  if (item.kind === "winStreak") {
    return (
      <div className="px-3 py-2.5" style={cellStyle()}>
        <p
          className={[
            nameOxanium.className,
            "flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45",
          ].join(" ")}
        >
          <Flame className="h-3 w-3 text-orange-400" strokeWidth={2.5} aria-hidden />
          {c.streak}
        </p>
        <p className="mt-1 flex items-baseline gap-1">
          <span
            className={[nameBebas.className, "text-[22px] leading-none text-orange-300"].join(
              " "
            )}
            style={{ textShadow: "0 0 14px rgba(251,146,60,0.32)" }}
          >
            {item.length}
          </span>
          <span
            className={[
              nameOxanium.className,
              "text-[9px] font-bold uppercase tracking-[0.14em] text-white/40",
            ].join(" ")}
          >
            {c.streakUnit}
          </span>
        </p>
      </div>
    );
  }

  if (item.kind === "upset") {
    return (
      <div className="px-3 py-2.5" style={cellStyle()}>
        <p
          className={[
            nameOxanium.className,
            "text-[9px] font-bold uppercase tracking-[0.16em] text-white/45",
          ].join(" ")}
        >
          {c.upset} · {item.dateKey.slice(5).replace("-", "/")}
        </p>
        <p
          className={[
            lang === "ja" ? jp.className : nameOxanium.className,
            "mt-1 text-[12px] text-white/70",
          ].join(" ")}
        >
          {item.label}
        </p>
        <p
          className={[nameBebas.className, "mt-1 text-xl leading-none text-orange-300"].join(
            " "
          )}
        >
          +{fmtPt(item.points)}pt
        </p>
      </div>
    );
  }

  const divLabel =
    item.division === "winRate"
      ? "WIN%"
      : item.division === "goalScorerHits"
        ? "SCORER"
        : "UPSET";
  return (
    <div className="px-3 py-2.5" style={cellStyle()}>
      <p
        className={[
          nameOxanium.className,
          "text-[9px] font-bold uppercase tracking-[0.16em] text-white/45",
        ].join(" ")}
      >
        {c.divisionTop10(divLabel, item.rank)}
      </p>
      <p
        className={[nameBebas.className, "mt-1 text-[22px] leading-none text-amber-300"].join(
          " "
        )}
      >
        #{item.rank}
      </p>
    </div>
  );
}

function HighlightsBlock({
  highlights,
  lang,
}: {
  highlights: MonthlyReportHighlight[];
  lang: Lang;
}) {
  const c = COPY[lang];
  const primary = highlights.find((h) => h.kind === "bestPick");
  const rest = highlights.filter((h) => h !== primary);

  return (
    <section>
      <SectionBadge>{c.highlights}</SectionBadge>
      <div className="mt-2 grid gap-1.5">
        {primary ? <HighlightCard item={primary} lang={lang} /> : null}
        {rest.length > 0 ? (
          <div className="grid grid-cols-2 gap-1.5">
            {rest.map((h, i) => (
              <HighlightCard key={`${h.kind}-${i}`} item={h} lang={lang} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ============================================================
 * 8. 今月のサマリー
 * ============================================================ */

function OutlookBlock({
  outlook,
  lang,
}: {
  outlook: MonthlyReportOutlook;
  lang: Lang;
}) {
  const c = COPY[lang];
  const body = outlook.summary.trim();
  if (!body) return null;

  return (
    <section>
      <SectionBadge>{c.outlook}</SectionBadge>
      <div
        className="mt-2 px-3.5 py-3.5"
        style={cellStyle({
          border: "1px solid rgba(34,211,238,0.32)",
          background:
            "linear-gradient(165deg, rgba(34,211,238,0.10), rgba(6,10,16,0.98) 55%), rgba(8,14,22,0.96)",
        })}
      >
        <p
          className={[
            lang === "ja" ? jp.className : nameOxanium.className,
            "text-[13px] leading-relaxed text-white/80",
          ].join(" ")}
        >
          {body}
        </p>
      </div>
    </section>
  );
}

/* ============================================================
 * main
 * ============================================================ */

export default function MonthlyReportView({
  report,
  language = "ja",
}: {
  report: MonthlyReport;
  language?: Lang;
}) {
  const c = COPY[language];

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-2">
        <h2
          className={[
            nameOxanium.className,
            "text-sm font-extrabold uppercase tracking-[0.14em] text-white",
          ].join(" ")}
        >
          {c.title}
        </h2>
        <p
          className={[
            nameOxanium.className,
            "text-[11px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/45",
          ].join(" ")}
        >
          {fmtMonth(report.monthKey, language)}
        </p>
      </header>

      <CoverBlock report={report} lang={language} />
      <NumbersBlock metrics={report.metrics} lang={language} />
      <UnitsBreakdownBlock
        total={report.unitsEarned}
        entries={report.unitsBreakdown}
        lang={language}
      />
      <RadarBlock report={report} lang={language} />
      <HabitsBlock habits={report.habits} lang={language} />
      <AffinityBlock
        strong={report.teamAffinity.strong}
        weak={report.teamAffinity.weak}
        lang={language}
      />
      <HighlightsBlock highlights={report.highlights} lang={language} />
      <OutlookBlock outlook={report.outlook} lang={language} />
    </div>
  );
}
