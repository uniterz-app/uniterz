/** Web `MonthlyReportView` 相当。画面順: 表紙 / 数字で見る今月 / 獲得Unit内訳 / 能力チャート /
 * 予想のクセ / チーム相性 / 月間ハイライト / 今月のサマリー。 */
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type {
  MonthlyReport,
  MonthlyReportHabits,
  MonthlyReportHighlight,
  MonthlyReportMetric,
  MonthlyReportMetricKey,
  MonthlyReportOutlook,
  MonthlyReportRadarAxisKey,
  MonthlyReportTeam,
  MonthlyReportUnitGrant,
  MonthlyReportUnitMetric,
  MonthlyReportUnitSource,
} from "../../../../../../lib/reports/monthlyReportTypes";
import { MONTHLY_REPORT_RADAR_STRENGTH_P } from "../../../../../../lib/reports/monthlyReportTypes";
import {
  monthlyReportRankBandAccent,
  resolveMonthlyReportRankBand,
} from "../../../../../../lib/reports/monthlyReportRankBand";
import { resolveMonthlyReportAnalysisTypeCopy } from "../../../../../../lib/reports/monthlyReportAnalysisTypeCopy";
import { ANALYSIS_TYPE_COLOR } from "../../../../../../app/shared/analysis/analysisTypeColor";
import {
  computeTopPercentile,
  getKinetikRankBadgeTierFromTopPercent,
  type KinetikRankBadgeTier,
} from "../../../../../../app/component/profile/edit/kinetikRankBadge";
import { getTeamPrimaryColor } from "../../../../../../lib/team-colors";
import { RankingsCyberPanelNative } from "../../rankings/RankingsCyberPanelNative";
import MonthlyReportRadarChartNative, {
  MONTHLY_RADAR_MUTED,
  MONTHLY_RADAR_ORDER,
  MONTHLY_RADAR_STRENGTH,
} from "./MonthlyReportRadarChartNative";
import {
  BEBAS,
  MARK_MEDIAN,
  MARK_TOP10,
  MARK_YOU,
  OXANIUM_600,
  OXANIUM_700,
  OXANIUM_800,
  PANEL_BG,
  REPORT_ACCENT,
  fmtReportMonth,
  fmtReportPt,
  reportBodyFont,
  reportBodyFontSemibold,
} from "./reportThemeNative";

type Lang = "ja" | "en";

/* ============================================================
 * copy（Web MonthlyReportView と同一・要点のみ）
 * ============================================================ */

const COPY = {
  ja: {
    title: "MONTHLY REPORT",
    thisMonth: "今月の結果",
    participants: (n: number) => `${n}人中`,
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
    radarAxis: {
      win: "WIN",
      scorer: "SCORER",
      upset: "UPSET",
      activity: "ACTIVITY",
      consistency: "CONSISTENCY",
    } satisfies Record<MonthlyReportRadarAxisKey, string>,
  },
  en: {
    title: "MONTHLY REPORT",
    thisMonth: "This Month",
    participants: (n: number) => `of ${n}`,
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
    radarAxis: {
      win: "WIN",
      scorer: "SCORER",
      upset: "UPSET",
      activity: "ACTIVITY",
      consistency: "CONSISTENCY",
    } satisfies Record<MonthlyReportRadarAxisKey, string>,
  },
} as const;

const RADAR_ORDER = MONTHLY_RADAR_ORDER;

function isRadarStrength(percentile: number): boolean {
  return percentile >= MONTHLY_REPORT_RADAR_STRENGTH_P;
}

const TIER_LABEL: Record<Exclude<KinetikRankBadgeTier, "rising">, string> = {
  legend: "LEGEND",
  elite: "ELITE",
  pro: "PRO",
  analyst: "ANALYST",
};

const UNIT_SOURCE_COLOR: Record<MonthlyReportUnitSource, string> = {
  personal_weekly: "#22d3ee",
  personal_monthly: "#67e8f9",
  group_weekly: "#e879f9",
  group_monthly: "#c084fc",
  invite: "#34d399",
  metric_rank: "#fb923c",
  event: "#fbbf24",
};

const NUMBERS_METRIC_ORDER: MonthlyReportMetricKey[] = [
  "posts",
  "winRate",
  "units",
  "points",
  "goalScorerHits",
  "upsetPoints",
];

function cellStyle(): ViewStyle {
  return {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.28)",
    backgroundColor: PANEL_BG,
    borderRadius: 3,
    overflow: "hidden",
  };
}

function fmtSigned(v: number, opts?: { percent?: boolean; integer?: boolean }): string {
  const abs = opts?.integer
    ? String(Math.abs(Math.round(v)))
    : opts?.percent
      ? Math.abs(v).toFixed(1)
      : fmtReportPt(Math.abs(v));
  const unit = opts?.percent ? "%" : "";
  if (v > 0) return `+${abs}${unit}`;
  if (v < 0) return `−${abs}${unit}`;
  return `±0${unit}`;
}

function deltaTone(value: number | null): string {
  if (value == null) return "rgba(255,255,255,0.4)";
  if (value > 0) return REPORT_ACCENT.emerald.main;
  if (value < 0) return REPORT_ACCENT.orange.main;
  return "rgba(255,255,255,0.45)";
}

function hexTint(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

function sortNumbersMetrics(metrics: MonthlyReportMetric[]): MonthlyReportMetric[] {
  const order = new Map(NUMBERS_METRIC_ORDER.map((k, i) => [k, i]));
  return [...metrics].sort((a, b) => (order.get(a.key) ?? 99) - (order.get(b.key) ?? 99));
}

function formatMetricValue(m: MonthlyReportMetric): string {
  if (m.key === "winRate") return `${fmtReportPt(m.value)}%`;
  if (m.key === "goalScorerHits" || m.key === "posts" || m.key === "units") {
    return String(Math.round(m.value));
  }
  return fmtReportPt(m.value);
}

function formatMetricAbs(m: MonthlyReportMetric, v: number): string {
  if (m.key === "winRate") return `${fmtReportPt(v)}%`;
  if (m.key === "goalScorerHits" || m.key === "posts" || m.key === "units") {
    return String(Math.round(v));
  }
  return fmtReportPt(v);
}

function formatMetricDelta(m: MonthlyReportMetric, delta: number | null): string | null {
  if (delta == null) return null;
  if (m.key === "winRate") return fmtSigned(delta, { percent: true });
  if (m.key === "goalScorerHits" || m.key === "posts" || m.key === "units") {
    return fmtSigned(delta, { integer: true });
  }
  return fmtSigned(delta);
}

function showsMetricRank(key: MonthlyReportMetricKey): boolean {
  return key !== "posts" && key !== "winRate";
}

function clampBias(v: number): number {
  return Math.min(1, Math.max(-1, v));
}

function winRateToDotSize(winRate: number): number {
  const pct = Math.round(winRate * 100);
  if (pct < 40) return 8;
  if (pct < 47) return 10;
  if (pct < 54) return 12;
  if (pct < 61) return 15;
  if (pct < 68) return 18;
  if (pct < 75) return 21;
  return 24;
}

function unitGrantTitle(g: MonthlyReportUnitGrant, c: (typeof COPY)[Lang]): string {
  if (g.label) return g.label;
  if (g.source === "metric_rank" && g.metric) {
    return `${c.unitSource.metric_rank} · ${c.unitMetric[g.metric]}`;
  }
  return c.unitSource[g.source];
}

/* ============================================================
 * parts
 * ============================================================ */

function SectionBadge({ children }: { children: string }) {
  return (
    <View style={styles.sectionBadgeWrap}>
      <Text style={styles.sectionBadgeText}>{children}</Text>
    </View>
  );
}

function MicroLabel({
  children,
  color = "rgba(255,255,255,0.42)",
}: {
  children: string;
  color?: string;
}) {
  return <Text style={[styles.microLabel, { color }]}>{children}</Text>;
}

function SlantTag({
  color,
  children,
  icon,
}: {
  color: string;
  children: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}) {
  return (
    <View style={[styles.slantTag, { borderColor: color }]}>
      {icon ? <MaterialCommunityIcons name={icon} size={11} color={color} /> : null}
      <Text style={[styles.slantTagText, { color }]}>{children}</Text>
    </View>
  );
}

/* ============================================================
 * 1. 表紙
 * ============================================================ */

function CoverBlock({ report, lang }: { report: MonthlyReport; lang: Lang }) {
  const c = COPY[lang];
  const delta = report.rankDeltaPlaces;
  const typeColor = ANALYSIS_TYPE_COLOR[report.analysisTypeId] ?? "#f8fafc";
  const typeCopy = resolveMonthlyReportAnalysisTypeCopy(report.analysisTypeId);
  const band = monthlyReportRankBandAccent(report.rank);
  const topPct = report.topPercent ?? computeTopPercentile(report.rank, report.participantCount);
  const tier = getKinetikRankBadgeTierFromTopPercent(topPct);

  return (
    <RankingsCyberPanelNative
      compact
      style={[styles.coverPanel, { borderColor: band.border, backgroundColor: PANEL_BG }]}
    >
      <Text style={styles.microCenterLabel}>{c.thisMonth}</Text>

      <View style={styles.coverRow}>
        <View style={styles.coverCol}>
          <Text style={[styles.coverColLabel, { color: band.text }]}>{c.rankLabel}</Text>
          <Text style={[styles.coverBig, { color: band.text }]}>
            <Text style={[styles.coverBigHash, { color: `${band.main}99` }]}>#</Text>
            {report.rank}
          </Text>
          <Text style={styles.coverParticipants}>{c.participants(report.participantCount)}</Text>
          {tier || delta != null ? (
            <View style={styles.coverTagRow}>
              {tier ? <SlantTag color={band.main}>{TIER_LABEL[tier]}</SlantTag> : null}
              {delta != null ? (
                <View style={styles.coverDeltaCol}>
                  <SlantTag
                    color={
                      delta > 0
                        ? REPORT_ACCENT.emerald.main
                        : delta < 0
                          ? REPORT_ACCENT.orange.main
                          : "rgba(148,163,184,0.7)"
                    }
                    icon={delta === 0 ? undefined : delta > 0 ? "arrow-up-bold" : "arrow-down-bold"}
                  >
                    {delta === 0 ? "±0" : String(Math.abs(delta))}
                  </SlantTag>
                  <Text style={styles.coverTagCaption}>{c.monthlyChange}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.coverSlash} />

        <View style={styles.coverCol}>
          <Text style={styles.coverColLabelWhite}>{c.unitsEarnedLabel}</Text>
          <Text style={styles.coverBigWhite}>{report.unitsEarned}</Text>
          <Text style={styles.coverColLabelWhite}>{c.unitsLabel}</Text>
          {report.unitsEarnedRank != null &&
          resolveMonthlyReportRankBand(report.unitsEarnedRank) !== "field" ? (
            <View style={styles.coverUnitsTagWrap}>
              <SlantTag color={monthlyReportRankBandAccent(report.unitsEarnedRank).main}>
                {monthlyReportRankBandAccent(report.unitsEarnedRank).label ?? ""}
              </SlantTag>
            </View>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.analysisInset,
          { borderColor: hexTint(typeColor, "66"), backgroundColor: hexTint(typeColor, "1f") },
        ]}
      >
        <Text style={styles.analysisLabel}>{c.typeLabel}</Text>
        <Text style={[styles.analysisTitle, { color: typeColor }]}>{typeCopy.label}</Text>
      </View>
    </RankingsCyberPanelNative>
  );
}

/* ============================================================
 * 2. 数字で見る今月
 * ============================================================ */

function MetricRankTag({ rank }: { rank: number }) {
  const accent = monthlyReportRankBandAccent(rank);
  return <SlantTag color={accent.main}>{`#${rank}`}</SlantTag>;
}

function MetricRangeBar({ metric, lang }: { metric: MonthlyReportMetric; lang: Lang }) {
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

  const vsMedian = median != null ? formatMetricDelta(metric, value - median) : null;
  const vsTop10 = top10 != null ? formatMetricDelta(metric, value - top10) : null;

  return (
    <View style={styles.rangeWrap}>
      <View style={styles.rangeTrack}>
        <View style={[styles.rangeFill, { width: `${youPct}%` }]} />
        {median != null ? (
          <View style={[styles.rangeTick, { left: `${toPct(median)}%`, backgroundColor: MARK_MEDIAN }]} />
        ) : null}
        {top10 != null ? (
          <View style={[styles.rangeTick, { left: `${toPct(top10)}%`, backgroundColor: MARK_TOP10 }]} />
        ) : null}
        <View style={[styles.rangeYouMarker, { left: `${youPct}%` }]} />
      </View>
      {vsMedian != null || vsTop10 != null ? (
        <View style={styles.rangeLegendRow}>
          {vsMedian != null ? (
            <Text style={styles.rangeLegendText}>
              <Text style={styles.rangeLegendLabel}>{c.vsMedian} </Text>
              <Text style={{ color: deltaTone(value - (median ?? 0)) }}>{vsMedian}</Text>
            </Text>
          ) : null}
          {vsTop10 != null ? (
            <Text style={styles.rangeLegendText}>
              <Text style={styles.rangeLegendLabel}>{c.vsTop10} </Text>
              <Text style={{ color: deltaTone(value - (top10 ?? 0)) }}>{vsTop10}</Text>
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function NumbersBlock({ metrics, lang }: { metrics: MonthlyReportMetric[]; lang: Lang }) {
  const c = COPY[lang];
  const ordered = sortNumbersMetrics(metrics);
  return (
    <View>
      <SectionBadge>{c.numbers}</SectionBadge>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendTick, { backgroundColor: MARK_MEDIAN }]} />
          <Text style={styles.legendText}>{c.medianMark}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDiamond, { backgroundColor: MARK_YOU }]} />
          <Text style={styles.legendText}>{c.youMark}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendTick, { backgroundColor: MARK_TOP10 }]} />
          <Text style={styles.legendText}>{c.top10Mark}</Text>
        </View>
      </View>
      <View style={styles.metricList}>
        {ordered.map((m) => {
          const prev = formatMetricDelta(m, m.prevDelta);
          const showRank = showsMetricRank(m.key) && m.rank != null;
          return (
            <View key={m.key} style={[styles.metricCell, cellStyle()]}>
              <View style={styles.metricHeaderRow}>
                <View style={styles.metricHeaderLeft}>
                  <Text style={styles.metricLabel}>{c.metric[m.key]}</Text>
                  {showRank ? <MetricRankTag rank={m.rank!} /> : null}
                </View>
                <View style={styles.metricHeaderRight}>
                  {prev != null ? (
                    <Text style={styles.metricPrevDelta}>
                      <Text style={styles.metricPrevDeltaLabel}>{c.prevDelta} </Text>
                      <Text style={{ color: deltaTone(m.prevDelta) }}>{prev}</Text>
                    </Text>
                  ) : null}
                  <Text style={styles.metricValue}>{formatMetricValue(m)}</Text>
                </View>
              </View>
              <MetricRangeBar metric={m} lang={lang} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ============================================================
 * 2b. 獲得 Unit 内訳
 * ============================================================ */

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
  const sorted = useMemo(
    () =>
      [...entries].sort((a, b) => {
        if (b.amount !== a.amount) return b.amount - a.amount;
        return b.grantedDateKey.localeCompare(a.grantedDateKey);
      }),
    [entries]
  );
  const sum = sorted.reduce((s, e) => s + e.amount, 0);
  const barTotal = Math.max(sum, total, 1);
  const canExpand = sorted.length > 0;

  const bySource = new Map<MonthlyReportUnitSource, number>();
  for (const e of sorted) {
    bySource.set(e.source, (bySource.get(e.source) ?? 0) + e.amount);
  }
  const sourceSegments = (Object.keys(UNIT_SOURCE_COLOR) as MonthlyReportUnitSource[])
    .map((source) => ({ source, amount: bySource.get(source) ?? 0 }))
    .filter((s) => s.amount > 0);

  return (
    <View>
      <SectionBadge>{c.unitsBreakdown}</SectionBadge>
      <View style={styles.unitsRoot}>
        <Pressable
          disabled={!canExpand}
          onPress={() => canExpand && setOpen((v) => !v)}
          style={[
            styles.unitsHeaderCard,
            cellStyle(),
            open && canExpand ? { borderColor: "rgba(34,211,238,0.45)" } : null,
          ]}
        >
          <View style={styles.unitsHeaderRow}>
            <Text style={styles.unitsHeaderLabel}>{c.unitsBreakdownTotal}</Text>
            <View style={styles.unitsHeaderValueRow}>
              <Text style={styles.unitsHeaderValue}>{total}</Text>
              <Text style={styles.unitsHeaderUnit}>U</Text>
            </View>
          </View>

          {sourceSegments.length > 0 ? (
            <View style={styles.unitsBar}>
              {sourceSegments.map((s) => (
                <View
                  key={s.source}
                  style={{
                    width: `${(s.amount / barTotal) * 100}%`,
                    backgroundColor: UNIT_SOURCE_COLOR[s.source],
                  }}
                />
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { fontFamily: reportBodyFont(lang) }]}>{c.unitsBreakdownEmpty}</Text>
          )}

          {canExpand ? (
            <View style={styles.unitsExpandRow}>
              <Text style={styles.unitsExpandText}>
                {open ? c.unitsBreakdownCollapse : c.unitsBreakdownExpand}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={12}
                color="rgba(255,255,255,0.35)"
                style={open ? styles.iconFlip180 : undefined}
              />
            </View>
          ) : null}
        </Pressable>

        {open && canExpand ? (
          <View style={styles.unitGrantList}>
            {sorted.map((g) => {
              const accent = UNIT_SOURCE_COLOR[g.source];
              return (
                <View key={g.id} style={[styles.unitGrantRow, cellStyle()]}>
                  <View style={[styles.unitGrantDot, { backgroundColor: accent }]} />
                  <View style={styles.unitGrantMain}>
                    <Text style={styles.unitGrantTitle} numberOfLines={1}>
                      {unitGrantTitle(g, c)}
                    </Text>
                    <Text style={styles.unitGrantMeta}>
                      {g.periodLabel}
                      {g.rank != null ? ` · ${c.unitRank(g.rank)}` : ""}
                    </Text>
                  </View>
                  <Text style={styles.unitGrantAmount}>+{g.amount}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* ============================================================
 * 3. 能力チャート
 * ============================================================ */

function RadarBlock({ report, lang }: { report: MonthlyReport; lang: Lang }) {
  const c = COPY[lang];
  const typeCopy = resolveMonthlyReportAnalysisTypeCopy(report.analysisTypeId);
  const typeColor = ANALYSIS_TYPE_COLOR[report.analysisTypeId] ?? "#f8fafc";
  const typeLines = typeCopy.description
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <View>
      <SectionBadge>{c.radar}</SectionBadge>
      <View style={[styles.radarPanel, cellStyle()]}>
        <MonthlyReportRadarChartNative
          radar={report.radar}
          labels={c.radarAxis}
          size={280}
        />

        <View style={styles.radarStatsRow}>
          {RADAR_ORDER.map((key, i) => {
            const v = Math.round(report.radar[key] ?? 0);
            const strong = isRadarStrength(report.radar[key] ?? 0);
            return (
              <View
                key={key}
                style={[
                  styles.radarStatCell,
                  i > 0 ? styles.radarStatCellBorder : null,
                ]}
              >
                <Text style={styles.radarStatLabel} numberOfLines={1}>
                  {c.radarAxis[key]}
                </Text>
                <Text
                  style={[
                    styles.radarStatValue,
                    { color: strong ? MONTHLY_RADAR_STRENGTH : MONTHLY_RADAR_MUTED },
                  ]}
                >
                  {v}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.radarFooter}>
          <Text style={styles.analysisLabel}>{c.typeLabel}</Text>
          <Text style={[styles.analysisTitle, { color: typeColor }]}>
            {typeCopy.label}
          </Text>
          <View style={styles.radarDescList}>
            {typeLines.map((line) => (
              <Text
                key={line}
                style={[
                  styles.radarDescription,
                  { fontFamily: reportBodyFont(lang) },
                ]}
              >
                {line}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

/* ============================================================
 * 4. 予想のクセ
 * ============================================================ */

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
    <View style={styles.shareBarWrap}>
      <View style={styles.shareBarTrack}>
        <View style={{ width: `${left * 100}%`, backgroundColor: leftColor }} />
        <View style={{ width: `${right * 100}%`, backgroundColor: rightColor }} />
      </View>
      <View style={styles.shareBarLabels}>
        <Text style={styles.shareBarLabel}>
          {leftLabel} {Math.round(left * 100)}%
        </Text>
        <Text style={styles.shareBarLabel}>
          {rightLabel} {Math.round(right * 100)}%
        </Text>
      </View>
    </View>
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
    <View style={[styles.rateCard, cellStyle()]}>
      <Text style={styles.rateCardTitle}>{title}</Text>
      <View style={styles.rateCardRow}>
        <View style={styles.rateCardSide}>
          <Text style={[styles.rateCardSideLabel, { color: leftColor }]}>{leftLabel}</Text>
          <Text style={[styles.rateCardValue, leftHigher ? styles.rateCardValueHigh : null]}>
            {leftPct}
            <Text style={styles.rateCardPercent}>%</Text>
          </Text>
        </View>
        <View style={[styles.rateCardSide, styles.rateCardSideRight]}>
          <Text style={[styles.rateCardSideLabel, { color: rightColor }]}>{rightLabel}</Text>
          <Text style={[styles.rateCardValue, rightHigher ? styles.rateCardValueHigh : null]}>
            {rightPct}
            <Text style={styles.rateCardPercent}>%</Text>
          </Text>
        </View>
      </View>
      <HabitsShareBar
        leftLabel={leftShareLabel}
        rightLabel={rightShareLabel}
        leftShare={leftShare}
        leftColor={leftColor}
        rightColor={rightColor}
      />
    </View>
  );
}

function HabitsBlock({ habits, lang }: { habits: MonthlyReportHabits | null; lang: Lang }) {
  const c = COPY[lang];

  if (!habits) {
    return (
      <View>
        <SectionBadge>{c.habits}</SectionBadge>
        <View style={[styles.habitsEmptyCard, cellStyle()]}>
          <Text style={[styles.emptyText, { fontFamily: reportBodyFont(lang) }]}>{c.habitsEmpty}</Text>
        </View>
      </View>
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
    <View>
      <SectionBadge>{c.habits}</SectionBadge>
      <View style={styles.habitsRoot}>
        <View style={[styles.mapCard, cellStyle()]}>
          <View style={styles.mapBox}>
            <View style={styles.mapAxisV} />
            <View style={styles.mapAxisH} />
            <Text style={[styles.mapEdgeLabelSide, { left: 6 }]}>Away</Text>
            <Text style={[styles.mapEdgeLabelSide, { right: 6 }]}>Home</Text>
            <Text style={[styles.mapEdgeLabelTop, { top: 6 }]}>
              {lang === "ja" ? "順当" : "CONSENSUS"}
            </Text>
            <Text style={[styles.mapEdgeLabelTop, { bottom: 6 }]}>
              {lang === "ja" ? "逆張り" : "FADE"}
            </Text>
            <View
              style={[
                styles.mapDot,
                {
                  width: dot,
                  height: dot,
                  borderRadius: dot / 2,
                  left: `${50 + x * 38}%`,
                  top: `${50 - y * 38}%`,
                  marginLeft: -dot / 2,
                  marginTop: -dot / 2,
                },
              ]}
            />
          </View>
          <Text style={styles.mapSummaryTitle}>{habits.summaryTitle}</Text>
          <Text style={[styles.mapSummaryBody, { fontFamily: reportBodyFont(lang) }]}>{habits.summaryBody}</Text>
          <Text style={styles.mapHint}>{c.habitsMapHint}</Text>
        </View>

        <View style={styles.rateGrid}>
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
        </View>
      </View>
    </View>
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
  const accent = tone === "strong" ? REPORT_ACCENT.emerald.main : REPORT_ACCENT.rose.main;
  return (
    <View style={[styles.teamListCard, cellStyle()]}>
      <Text style={[styles.teamListTitle, { color: accent }]}>{title}</Text>
      <View style={styles.teamRows}>
        {teams.map((t) => {
          const color = getTeamPrimaryColor("nba", t.teamId);
          return (
            <View key={t.teamId} style={styles.teamRow}>
              <Text style={[styles.teamAbbr, { color: color || "#fff" }]} numberOfLines={1}>
                {t.abbr}
              </Text>
              <Text style={styles.teamMeta}>
                {t.wins}–{t.losses} · {fmtReportPt(t.points)}pt
              </Text>
            </View>
          );
        })}
      </View>
    </View>
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
    <View>
      <SectionBadge>{c.affinity}</SectionBadge>
      <View style={styles.affinityRow}>
        <TeamList title={c.strong} teams={strong} tone="strong" />
        <TeamList title={c.weak} teams={weak} tone="weak" />
      </View>
    </View>
  );
}

/* ============================================================
 * 6. 月間ハイライト
 * ============================================================ */

function HighlightCard({ item, lang }: { item: MonthlyReportHighlight; lang: Lang }) {
  const c = COPY[lang];

  if (item.kind === "bestPick") {
    const homeColor = getTeamPrimaryColor("nba", item.home.teamId);
    const awayColor = getTeamPrimaryColor("nba", item.away.teamId);
    return (
      <View style={[styles.highlightCardWide, cellStyle()]}>
        <View style={styles.highlightHeaderRow}>
          <Text style={styles.highlightMeta}>
            {c.bestPick} · {item.dateKey.slice(5).replace("-", "/")}
          </Text>
          <Text style={styles.highlightPtsEmerald}>+{fmtReportPt(item.points)}pt</Text>
        </View>
        <View style={styles.bestPickScoreRow}>
          <Text style={[styles.bestPickAbbr, { color: homeColor }]} numberOfLines={1}>
            {item.home.abbr}
          </Text>
          <Text style={styles.bestPickScore}>
            {item.home.score}
            <Text style={styles.bestPickDash}> – </Text>
            {item.away.score}
          </Text>
          <Text style={[styles.bestPickAbbr, { color: awayColor }]} numberOfLines={1}>
            {item.away.abbr}
          </Text>
        </View>
        <Text style={styles.bestPickMyPick}>
          {c.myPick} {item.myHome}–{item.myAway}
        </Text>
      </View>
    );
  }

  if (item.kind === "bestDay") {
    return (
      <View style={[styles.highlightCard, cellStyle()]}>
        <Text style={styles.highlightMeta}>
          {c.bestDay} · {item.dateKey.slice(5).replace("-", "/")}
        </Text>
        <View style={styles.highlightValueRow}>
          <Text style={styles.highlightValueCyan}>+{fmtReportPt(item.points)}</Text>
          <Text style={styles.highlightUnit}>PT</Text>
        </View>
        <Text style={styles.highlightSub}>{c.bestDayLine(item.wins, item.posts)}</Text>
      </View>
    );
  }

  if (item.kind === "winStreak") {
    return (
      <View style={[styles.highlightCard, cellStyle()]}>
        <View style={styles.highlightHeaderRow}>
          <MaterialCommunityIcons name="fire" size={12} color={REPORT_ACCENT.orange.main} />
          <Text style={styles.highlightMeta}>{c.streak}</Text>
        </View>
        <View style={styles.highlightValueRow}>
          <Text style={styles.highlightValueOrange}>{item.length}</Text>
          <Text style={styles.highlightUnit}>{c.streakUnit}</Text>
        </View>
      </View>
    );
  }

  if (item.kind === "upset") {
    return (
      <View style={[styles.highlightCard, cellStyle()]}>
        <Text style={styles.highlightMeta}>
          {c.upset} · {item.dateKey.slice(5).replace("-", "/")}
        </Text>
        <Text style={[styles.highlightBody, { fontFamily: reportBodyFont(lang) }]}>{item.label}</Text>
        <Text style={styles.highlightValueOrange}>+{fmtReportPt(item.points)}pt</Text>
      </View>
    );
  }

  const divLabel = item.division === "winRate" ? "WIN%" : item.division === "goalScorerHits" ? "SCORER" : "UPSET";
  return (
    <View style={[styles.highlightCard, cellStyle()]}>
      <Text style={styles.highlightMeta}>{c.divisionTop10(divLabel, item.rank)}</Text>
      <Text style={styles.highlightValueAmber}>#{item.rank}</Text>
    </View>
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
  const primary = highlights.find((h) => h.kind === "bestPick") ?? null;
  const rest = highlights.filter((h) => h !== primary);

  return (
    <View>
      <SectionBadge>{c.highlights}</SectionBadge>
      <View style={styles.highlightsRoot}>
        {primary ? <HighlightCard item={primary} lang={lang} /> : null}
        {rest.length > 0 ? (
          <View style={styles.highlightGrid}>
            {rest.map((h, i) => (
              <View key={`${h.kind}-${i}`} style={styles.highlightGridItem}>
                <HighlightCard item={h} lang={lang} />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* ============================================================
 * 8. 今月のサマリー
 * ============================================================ */

function OutlookBlock({ outlook, lang }: { outlook: MonthlyReportOutlook; lang: Lang }) {
  const c = COPY[lang];
  const body = outlook.summary.trim();
  if (!body) return null;

  return (
    <View>
      <SectionBadge>{c.outlook}</SectionBadge>
      <View style={styles.outlookCard}>
        <Text style={[styles.outlookText, { fontFamily: reportBodyFontSemibold(lang) }]}>{body}</Text>
      </View>
    </View>
  );
}

/* ============================================================
 * main
 * ============================================================ */

export default function MonthlyReportViewNative({
  report,
  language = "ja",
}: {
  report: MonthlyReport;
  language?: Lang;
}) {
  const c = COPY[language];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{c.title}</Text>
        <Text style={styles.range}>{fmtReportMonth(report.monthKey)}</Text>
      </View>

      <CoverBlock report={report} lang={language} />
      <NumbersBlock metrics={report.metrics} lang={language} />
      <UnitsBreakdownBlock total={report.unitsEarned} entries={report.unitsBreakdown} lang={language} />
      <RadarBlock report={report} lang={language} />
      <HabitsBlock habits={report.habits} lang={language} />
      <AffinityBlock strong={report.teamAffinity.strong} weak={report.teamAffinity.weak} lang={language} />
      <HighlightsBlock highlights={report.highlights} lang={language} />
      <OutlookBlock outlook={report.outlook} lang={language} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  header: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  title: { fontFamily: OXANIUM_800, color: "#fff", fontSize: 13, letterSpacing: 1.6 },
  range: {
    fontFamily: OXANIUM_700,
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    letterSpacing: 1,
  },

  sectionBadgeWrap: { alignSelf: "flex-start", backgroundColor: "#fff", paddingHorizontal: 8, paddingVertical: 5 },
  sectionBadgeText: {
    fontFamily: OXANIUM_800,
    color: "#000",
    fontSize: 8,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  microLabel: {
    fontFamily: OXANIUM_700,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  microCenterLabel: {
    fontFamily: OXANIUM_700,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.42)",
  },
  emptyText: { color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 16 },
  iconFlip180: { transform: [{ rotate: "180deg" }] },

  slantTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(2,6,16,0.75)",
    transform: [{ skewX: "-12deg" }],
  },
  slantTagText: {
    fontFamily: OXANIUM_800,
    fontSize: 9,
    letterSpacing: 1.2,
    transform: [{ skewX: "12deg" }],
  },

  /* cover */
  coverPanel: { marginBottom: 0 },
  coverRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginTop: 10 },
  coverCol: { flex: 1, alignItems: "center", gap: 2 },
  coverColLabel: { fontFamily: OXANIUM_700, fontSize: 9, letterSpacing: 1.4, opacity: 0.8 },
  coverColLabelWhite: {
    fontFamily: OXANIUM_700,
    fontSize: 9,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  coverBig: { fontFamily: BEBAS, fontSize: 40, lineHeight: 42, transform: [{ skewX: "-8deg" }] },
  coverBigHash: { fontSize: 22 },
  coverBigWhite: {
    fontFamily: BEBAS,
    fontSize: 40,
    lineHeight: 42,
    color: "#fff",
    transform: [{ skewX: "-8deg" }],
  },
  coverParticipants: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },
  coverTagRow: { flexDirection: "row", gap: 10, marginTop: 8, alignItems: "flex-start" },
  coverDeltaCol: { alignItems: "center" },
  coverTagCaption: {
    fontFamily: OXANIUM_700,
    fontSize: 9,
    color: "rgba(255,255,255,0.55)",
    marginTop: 4,
  },
  coverUnitsTagWrap: { marginTop: 8 },
  coverSlash: {
    width: 1,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginHorizontal: 6,
    transform: [{ rotate: "18deg" }],
  },
  analysisInset: { marginTop: 12, borderWidth: 1, borderRadius: 3, paddingHorizontal: 12, paddingVertical: 10 },
  analysisLabel: {
    fontFamily: OXANIUM_700,
    fontSize: 8,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  analysisTitle: { fontFamily: BEBAS, fontSize: 20, marginTop: 4, transform: [{ skewX: "-6deg" }] },

  /* numbers */
  legendRow: { flexDirection: "row", gap: 12, marginTop: 8, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendTick: { width: 1.5, height: 10 },
  legendDiamond: { width: 8, height: 8, transform: [{ rotate: "45deg" }] },
  legendText: {
    fontFamily: OXANIUM_800,
    fontSize: 10,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  metricList: { marginTop: 8, gap: 6 },
  metricCell: { paddingHorizontal: 14, paddingVertical: 12 },
  metricHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  metricHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1, minWidth: 0 },
  metricHeaderRight: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  metricLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 11,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
  },
  metricPrevDelta: { fontFamily: OXANIUM_800, fontSize: 11, letterSpacing: 0.6 },
  metricPrevDeltaLabel: { color: "rgba(255,255,255,0.4)" },
  metricValue: { fontFamily: OXANIUM_800, fontSize: 20, color: "#fff", letterSpacing: 0.2 },

  rangeWrap: { marginTop: 10 },
  rangeTrack: {
    height: 10,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    position: "relative",
  },
  rangeFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
    backgroundColor: MARK_YOU,
    opacity: 0.85,
  },
  rangeTick: { position: "absolute", top: 0, bottom: 0, width: 1.5 },
  rangeYouMarker: {
    position: "absolute",
    top: "50%",
    width: 10,
    height: 10,
    marginLeft: -5,
    marginTop: -5,
    backgroundColor: MARK_YOU,
    transform: [{ rotate: "45deg" }],
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.4)",
  },
  rangeLegendRow: { flexDirection: "row", gap: 12, marginTop: 8, flexWrap: "wrap" },
  rangeLegendText: { fontFamily: OXANIUM_800, fontSize: 11, letterSpacing: 0.6 },
  rangeLegendLabel: { color: "rgba(255,255,255,0.4)" },

  /* units breakdown */
  unitsRoot: { marginTop: 8, gap: 6 },
  unitsHeaderCard: { paddingHorizontal: 14, paddingVertical: 12 },
  unitsHeaderRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  unitsHeaderLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 9,
    letterSpacing: 1.4,
    color: "rgba(103,232,249,0.75)",
    textTransform: "uppercase",
  },
  unitsHeaderValueRow: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  unitsHeaderValue: { fontFamily: OXANIUM_800, fontSize: 20, color: "#fff" },
  unitsHeaderUnit: { fontFamily: OXANIUM_800, fontSize: 9, color: "rgba(255,255,255,0.4)" },
  unitsBar: { marginTop: 10, flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)" },
  unitsExpandRow: { marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  unitsExpandText: {
    fontFamily: OXANIUM_800,
    fontSize: 8,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
  unitGrantList: { gap: 6 },
  unitGrantRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  unitGrantDot: { width: 10, height: 10, borderRadius: 5 },
  unitGrantMain: { flex: 1, minWidth: 0 },
  unitGrantTitle: { fontFamily: OXANIUM_800, fontSize: 12, letterSpacing: 0.4, color: "#fff" },
  unitGrantMeta: {
    fontFamily: OXANIUM_800,
    fontSize: 9,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
    textTransform: "uppercase",
  },
  unitGrantAmount: { fontFamily: BEBAS, fontSize: 20, color: "#6ee7b7" },

  /* radar */
  radarPanel: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
    backgroundColor: "rgba(8,12,18,0.98)",
  },
  radarStatsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 4,
    paddingHorizontal: 2,
  },
  radarStatCell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingHorizontal: 2,
  },
  radarStatCellBorder: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.1)",
  },
  radarStatLabel: {
    fontFamily: OXANIUM_700,
    fontSize: 7,
    letterSpacing: 0.2,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    textAlign: "center",
  },
  radarStatValue: {
    marginTop: 2,
    fontFamily: OXANIUM_800,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  radarFooter: {
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  radarDescList: { marginTop: 8, gap: 6 },
  radarDescription: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 18,
  },

  /* habits */
  habitsRoot: { marginTop: 8, gap: 6 },
  habitsEmptyCard: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 12 },
  mapCard: { paddingHorizontal: 12, paddingVertical: 12 },
  mapBox: {
    height: 168,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.22)",
    backgroundColor: "#050912",
    overflow: "hidden",
    position: "relative",
  },
  mapAxisV: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(34,211,238,0.4)",
  },
  mapAxisH: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  mapEdgeLabelSide: {
    position: "absolute",
    top: "48%",
    fontFamily: OXANIUM_800,
    fontSize: 8,
    letterSpacing: 1.2,
    color: "rgba(224,242,254,0.55)",
    textTransform: "uppercase",
  },
  mapEdgeLabelTop: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: OXANIUM_800,
    fontSize: 8,
    letterSpacing: 1.2,
    color: "rgba(224,242,254,0.5)",
    textTransform: "uppercase",
  },
  mapDot: {
    position: "absolute",
    backgroundColor: "#fb923c",
    shadowColor: "#fb923c",
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  mapSummaryTitle: {
    fontFamily: BEBAS,
    fontSize: 19,
    color: "#fff",
    marginTop: 10,
    transform: [{ skewX: "-8deg" }],
  },
  mapSummaryBody: { marginTop: 6, color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 18 },
  mapHint: {
    fontFamily: OXANIUM_800,
    fontSize: 8,
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.35)",
    marginTop: 8,
    textTransform: "uppercase",
  },
  rateGrid: { flexDirection: "row", gap: 6 },
  rateCard: { flex: 1, paddingHorizontal: 10, paddingVertical: 10 },
  rateCardTitle: {
    fontFamily: OXANIUM_800,
    fontSize: 8,
    letterSpacing: 1.2,
    color: "rgba(103,232,249,0.75)",
    textTransform: "uppercase",
  },
  rateCardRow: { flexDirection: "row", marginTop: 8, gap: 8 },
  rateCardSide: { flex: 1 },
  rateCardSideRight: { alignItems: "flex-end" },
  rateCardSideLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  rateCardValue: { fontFamily: OXANIUM_800, fontSize: 18, color: "#fff", marginTop: 2 },
  rateCardValueHigh: { color: "#fcd34d" },
  rateCardPercent: { fontFamily: OXANIUM_700, fontSize: 11, color: "rgba(255,255,255,0.5)" },

  shareBarWrap: { marginTop: 10 },
  shareBarTrack: { flexDirection: "row", height: 6, borderRadius: 3, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)" },
  shareBarLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  shareBarLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 8,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },

  /* affinity */
  affinityRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  teamListCard: { flex: 1, paddingHorizontal: 10, paddingVertical: 10 },
  teamListTitle: { fontFamily: OXANIUM_800, fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase" },
  teamRows: { marginTop: 10, gap: 8 },
  teamRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 6 },
  teamAbbr: { fontFamily: OXANIUM_800, fontSize: 13, letterSpacing: 0.4, flexShrink: 0 },
  teamMeta: { fontFamily: OXANIUM_700, fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: 0.4 },

  /* highlights */
  highlightsRoot: { marginTop: 8, gap: 6 },
  highlightGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  highlightGridItem: { flexBasis: "48%", flexGrow: 1 },
  highlightCardWide: { paddingHorizontal: 14, paddingVertical: 12 },
  highlightCard: { paddingHorizontal: 12, paddingVertical: 10 },
  highlightHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  highlightMeta: {
    fontFamily: OXANIUM_800,
    fontSize: 9,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  highlightPtsEmerald: {
    fontFamily: BEBAS,
    fontSize: 18,
    color: REPORT_ACCENT.emerald.main,
    transform: [{ skewX: "-10deg" }],
  },
  bestPickScoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  bestPickAbbr: { flex: 1, fontFamily: OXANIUM_800, fontSize: 13, letterSpacing: 0.6, textAlign: "center" },
  bestPickScore: { fontFamily: BEBAS, fontSize: 22, color: "#fff" },
  bestPickDash: { color: "rgba(255,255,255,0.35)" },
  bestPickMyPick: {
    marginTop: 4,
    textAlign: "center",
    fontFamily: OXANIUM_800,
    fontSize: 10,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.45)",
  },
  highlightValueRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 4 },
  highlightValueCyan: { fontFamily: BEBAS, fontSize: 20, color: REPORT_ACCENT.cyan.main },
  highlightValueOrange: { fontFamily: BEBAS, fontSize: 20, color: REPORT_ACCENT.orange.main, marginTop: 4 },
  highlightValueAmber: { fontFamily: BEBAS, fontSize: 20, color: "#fcd34d", marginTop: 4 },
  highlightUnit: {
    fontFamily: OXANIUM_800,
    fontSize: 9,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
  },
  highlightSub: {
    marginTop: 4,
    fontFamily: OXANIUM_800,
    fontSize: 9,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  highlightBody: { marginTop: 4, color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 17 },

  /* outlook */
  outlookCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.32)",
    backgroundColor: "rgba(8,14,22,0.96)",
    borderRadius: 3,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  outlookText: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 19 },
});
