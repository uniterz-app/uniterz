/**
 * Web `PrevMonthSummaryCard` のネイティブ版（得点内訳・リーグ別投稿・母集団基準）。
 */
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../../theme/tokens";
import { profilePrevMonthSummaryCopy } from "./profileOverviewWidgetsCopy";

type MonthlyRaw = {
  posts?: number;
  wins?: number;
  winRate?: number;
  avgPointsV3?: number;
  pointsSumV3?: number;
  upsetPointsSum?: number;
  upsetHit?: number;
  pointsSumV3Rank?: number | null;
  basePointsSum?: number;
  upsetBonusSum?: number;
  streakBonusSum?: number;
  leaguePosts?: Record<string, number>;
};

type Benchmarks = {
  mean: number;
  median: number;
  p90: number;
  max: number;
};

type Props = {
  language: string;
  monthKey: string;
  stats: Record<string, unknown>;
  olderStats: Record<string, unknown> | null;
  pointsSumBenchmarks?: Benchmarks | null;
};

const LEAGUE_LABELS: Record<string, string> = {
  nba: "NBA",
  pl: "PL",
  j1: "J1",
  bj: "BJ",
  wc: "WC",
};

function readRaw(doc: Record<string, unknown> | null | undefined): MonthlyRaw {
  return ((doc?.raw ?? {}) as MonthlyRaw) ?? {};
}

function deltaPts(current: number, previous: number | null): string | null {
  if (previous == null || !Number.isFinite(previous)) return null;
  const d = current - previous;
  if (Math.abs(d) < 0.05) return "±0";
  const sign = d > 0 ? "+" : "";
  return `${sign}${d.toFixed(1)}pts`;
}

function formatLeagueLabel(key: string): string {
  const k = key.trim().toLowerCase();
  return LEAGUE_LABELS[k] ?? k.toUpperCase();
}

export default function ProfilePrevMonthSummaryNative({
  language,
  monthKey,
  stats,
  olderStats,
  pointsSumBenchmarks = null,
}: Props) {
  const copy = profilePrevMonthSummaryCopy(language);
  const [benchOpen, setBenchOpen] = useState(false);
  const raw = readRaw(stats);
  const oldRaw = readRaw(olderStats);
  const posts = raw.posts ?? 0;

  if (posts === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>
          {copy.summaryTitle(monthKey)}
        </Text>
        <Text style={styles.empty}>{copy.noPosts}</Text>
      </View>
    );
  }

  const winRate = raw.winRate ?? 0;
  const upsetSum = raw.upsetPointsSum ?? 0;
  const upsetHit =
    typeof raw.upsetHit === "number" && Number.isFinite(raw.upsetHit)
      ? Math.max(0, Math.floor(raw.upsetHit))
      : null;
  const pointsSum = raw.pointsSumV3 ?? (raw.avgPointsV3 ?? 0) * posts;
  const upsetBonus = raw.upsetBonusSum ?? 0;
  const streakBonus = raw.streakBonusSum ?? 0;
  const basePoints = raw.basePointsSum ?? Math.max(0, pointsSum - upsetBonus - streakBonus);
  const pointsSumOld =
    oldRaw.pointsSumV3 !== undefined
      ? oldRaw.pointsSumV3
      : oldRaw.avgPointsV3 !== undefined && oldRaw.posts
        ? oldRaw.avgPointsV3 * oldRaw.posts
        : null;
  const rank =
    typeof raw.pointsSumV3Rank === "number" && Number.isFinite(raw.pointsSumV3Rank)
      ? Math.max(1, Math.floor(raw.pointsSumV3Rank))
      : null;

  const leagueLines = Object.entries(raw.leaguePosts ?? {})
    .filter(([, n]) => typeof n === "number" && Number.isFinite(n) && n > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .map(([key, n]) => ({
      key,
      label: formatLeagueLabel(key),
      count: Math.max(0, Math.floor(Number(n))),
    }));

  const momDelta = deltaPts(pointsSum, pointsSumOld);
  const hasBench = pointsSumBenchmarks != null;

  return (
    <View style={styles.card}>
      {rank != null ? (
        <Text style={styles.rankBadge}>
          {copy.rank(rank)}
        </Text>
      ) : null}

      <Text style={[styles.title, rank != null && styles.titleWithRank]}>
        {copy.summaryTitle(monthKey)}
      </Text>

      <Pressable
        disabled={!hasBench}
        onPress={() => hasBench && setBenchOpen((v) => !v)}
        style={styles.totalBlock}
      >
        <Text style={styles.totalLabel}>{copy.totalPoints}</Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalValue}>{Math.round(pointsSum).toLocaleString()}</Text>
          <Text style={styles.totalUnit}>pts</Text>
          {momDelta ? (
            <View style={styles.momCol}>
              <Text style={styles.momLabel}>{copy.mom}</Text>
              <Text style={styles.momDelta}>{momDelta}</Text>
            </View>
          ) : null}
        </View>
        {hasBench ? (
          <Text style={styles.benchHint}>
            {copy.benchHint}
          </Text>
        ) : null}
      </Pressable>

      {hasBench && benchOpen ? (
        <View style={styles.benchBox}>
          <BenchRow label={copy.userAvg} value={pointsSumBenchmarks!.mean} />
          <BenchRow label={copy.median} value={pointsSumBenchmarks!.median} />
          <BenchRow label={copy.top10} value={pointsSumBenchmarks!.p90} />
          <BenchRow label={copy.first} value={pointsSumBenchmarks!.max} />
        </View>
      ) : null}

      <View style={styles.breakdownRow}>
        <BreakdownCell label={copy.base} value={basePoints} />
        <BreakdownCell label={copy.streak} value={streakBonus} tone="sky" />
        <BreakdownCell label={copy.upset} value={upsetBonus} tone="amber" />
      </View>

      <MetricRow
        label={copy.posts}
        value={String(posts)}
        delta={
          oldRaw.posts != null
            ? `${posts - oldRaw.posts >= 0 ? "+" : ""}${posts - oldRaw.posts}`
            : null
        }
      />
      <MetricRow
        label={copy.winRate}
        value={`${Math.round(winRate * 100)}%`}
        delta={
          oldRaw.winRate != null
            ? `${winRate * 100 - oldRaw.winRate * 100 >= 0 ? "+" : ""}${Math.round(
                winRate * 100 - oldRaw.winRate * 100
              )}%`
            : null
        }
      />
      {upsetHit != null ? (
        <MetricRow
          label={copy.upsetHits}
          value={String(upsetHit)}
        />
      ) : null}
      <MetricRow
        label={copy.upsetPoints}
        value={upsetSum.toFixed(1)}
        delta={
          oldRaw.upsetPointsSum != null
            ? `${upsetSum - oldRaw.upsetPointsSum >= 0 ? "+" : ""}${(
                upsetSum - oldRaw.upsetPointsSum
              ).toFixed(1)}`
            : null
        }
      />

      {leagueLines.length > 0 ? (
        <View style={styles.leagueSection}>
          <Text style={styles.leagueTitle}>{copy.byLeague}</Text>
          <View style={styles.leagueChips}>
            {leagueLines.map((line) => (
              <View key={line.key} style={styles.leagueChip}>
                <Text style={styles.leagueChipText}>
                  {line.label} {line.count}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function BenchRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.benchRow}>
      <Text style={styles.benchLabel}>{label}</Text>
      <Text style={styles.benchValue}>{value.toFixed(1)} pts</Text>
    </View>
  );
}

function BreakdownCell({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "sky" | "amber";
}) {
  const valueStyle =
    tone === "sky"
      ? styles.breakdownValueSky
      : tone === "amber"
        ? styles.breakdownValueAmber
        : styles.breakdownValue;
  return (
    <View style={styles.breakdownCell}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={valueStyle}>{value.toFixed(1)}</Text>
    </View>
  );
}

function MetricRow({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: string | null;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricRight}>
        <Text style={styles.metricValue}>{value}</Text>
        {delta ? <Text style={styles.metricDelta}>{delta}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(5,8,20,0.85)",
    gap: 8,
    position: "relative",
  },
  rankBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    color: "#fde68a",
    fontSize: 13,
    fontWeight: "800",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  titleWithRank: { marginTop: 8 },
  empty: { color: colors.textSecondary, fontSize: 12, textAlign: "center" },
  totalBlock: {
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.2)",
    backgroundColor: "rgba(251,191,36,0.06)",
    gap: 4,
  },
  totalLabel: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "600" },
  totalRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  totalValue: { color: colors.textPrimary, fontSize: 28, fontWeight: "900" },
  totalUnit: { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "700", marginBottom: 4 },
  momCol: { marginLeft: 8, alignItems: "flex-end" },
  momLabel: { color: "rgba(255,255,255,0.4)", fontSize: 10 },
  momDelta: { color: "#67e8f9", fontSize: 12, fontWeight: "700" },
  benchHint: { color: "rgba(255,255,255,0.45)", fontSize: 10, marginTop: 2 },
  benchBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 10,
    gap: 6,
  },
  benchRow: { flexDirection: "row", justifyContent: "space-between" },
  benchLabel: { color: colors.textSecondary, fontSize: 11 },
  benchValue: { color: colors.textPrimary, fontSize: 12, fontWeight: "700" },
  breakdownRow: { flexDirection: "row", gap: 8 },
  breakdownCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  breakdownLabel: { color: "rgba(255,255,255,0.45)", fontSize: 10, marginBottom: 4 },
  breakdownValue: { color: colors.textPrimary, fontSize: 15, fontWeight: "800" },
  breakdownValueSky: { color: "#bae6fd", fontSize: 15, fontWeight: "800" },
  breakdownValueAmber: { color: "#fde68a", fontSize: 15, fontWeight: "800" },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  metricLabel: { color: colors.textSecondary, fontSize: 12, flex: 1 },
  metricRight: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  metricValue: { color: colors.textPrimary, fontSize: 15, fontWeight: "800" },
  metricDelta: { color: "#67e8f9", fontSize: 11, fontWeight: "700" },
  leagueSection: { marginTop: 4, gap: 6 },
  leagueTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: "600" },
  leagueChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  leagueChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  leagueChipText: { color: colors.textPrimary, fontSize: 11, fontWeight: "700" },
});
