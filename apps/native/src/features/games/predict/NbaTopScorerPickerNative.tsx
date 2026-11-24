/** Web `NbaTopScorerPicker` 相当 */
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  sortNbaTopScorerCandidatesByPpg,
  type NbaTopScorerCandidate,
  type NbaTopScorerPick,
} from "../../../../../../lib/nba/topScorer";
import { useNbaTopScorerCandidates } from "../../../../../../lib/nba/useNbaTopScorerCandidates";
import type { GamesLanguage } from "../gamesI18n";
import { getGamesTexts } from "../gamesI18n";
import {
  MATCH_CARD_DISPLAY_FONT,
} from "../matchCardTypography";
import {
  METRIC_FONT,
  RANK_DISPLAY_FONT,
} from "../../rankings/rankingsUiTheme";
import TeamAbbrBadgeNative from "../TeamAbbrBadgeNative";
import {
  injuryStatusByPlayerId,
  injuryStatusLabel,
  injuryStatusTone,
  type NbaInjuryReport,
} from "../../../../../../lib/predict/nbaInjuryReport";
import { useNbaMatchupInjuryReport } from "../../../../../../lib/nba/predict/useNbaMatchupInjuryReport";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import { matchupTeamUiAccent } from "../../../../../../lib/team-colors";

const TOP_N = 5;
const OXANIUM_800 = "Oxanium_800ExtraBold";
const CYAN = "#00F5FF";

const INJURY_CHIP: Record<string, { border: string; bg: string; text: string }> = {
  out: { border: "rgba(255,45,120,0.7)", bg: "rgba(255,45,120,0.2)", text: "#FF8AB4" },
  doubt: { border: "rgba(255,138,61,0.7)", bg: "rgba(255,138,61,0.18)", text: "#FFB07A" },
  question: { border: "rgba(245,197,24,0.7)", bg: "rgba(245,197,24,0.15)", text: "#F5C518" },
  probable: { border: "rgba(0,229,255,0.6)", bg: "rgba(0,229,255,0.12)", text: "#00E5FF" },
  available: { border: "rgba(45,255,110,0.5)", bg: "rgba(45,255,110,0.1)", text: "#2DFF6E" },
  neutral: { border: "rgba(255,255,255,0.25)", bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.6)" },
};

type Props = {
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  /** game に載っていれば優先。空なら対戦ロスターから PPG 順に組む */
  candidates?: NbaTopScorerCandidate[];
  value: NbaTopScorerPick | null;
  onChange: (next: NbaTopScorerPick | null) => void;
  language: GamesLanguage;
  injuryReport?: NbaInjuryReport | null;
  /** 折りたたみ時に出す人数。まとめて入力は 1 */
  collapsedCount?: number;
  /** 余白を詰める。折りたたみ中の行タップは展開（選択しない） */
  compact?: boolean;
};

function InjuryChip({ status }: { status: string }) {
  const tone = injuryStatusTone(status);
  const c = INJURY_CHIP[tone] ?? INJURY_CHIP.neutral;
  return (
    <View
      style={[
        styles.injuryChip,
        { borderColor: c.border, backgroundColor: c.bg },
      ]}
    >
      <Text
        style={[styles.injuryChipText, { color: c.text }]}
        numberOfLines={1}
      >
        {injuryStatusLabel(status)}
      </Text>
    </View>
  );
}

function fmtPpg(ppg: number | null | undefined): string {
  if (ppg == null || !Number.isFinite(ppg)) return "—";
  return ppg.toFixed(1);
}

function rankColor(rank: number): string {
  if (rank <= 6) return "rgba(110,231,183,0.95)";
  if (rank <= 10) return "rgba(252,211,77,0.92)";
  return "rgba(252,165,165,0.75)";
}

function isSamePick(
  value: NbaTopScorerPick | null,
  row: NbaTopScorerCandidate
): boolean {
  return value?.playerId === row.playerId && value?.teamId === row.teamId;
}

export default function NbaTopScorerPickerNative({
  homeTeamId,
  awayTeamId,
  candidates: candidatesProp,
  value,
  onChange,
  language,
  injuryReport,
  collapsedCount = TOP_N,
  compact = false,
}: Props) {
  const t = getGamesTexts(language);
  const apiBaseUrl = getUniterzApiBaseUrl();
  const { candidates, loading: candidatesLoading } = useNbaTopScorerCandidates({
    homeTeamId,
    awayTeamId,
    override: candidatesProp,
    apiBaseUrl,
  });
  const sorted = useMemo(
    () => sortNbaTopScorerCandidatesByPpg(candidates),
    [candidates]
  );
  // 予想ツールの INJURY タブと同じスナップショットキャッシュを共有するので追加リクエストにならない
  const { report: liveInjury } = useNbaMatchupInjuryReport({
    homeTeamId: homeTeamId ?? undefined,
    awayTeamId: awayTeamId ?? undefined,
    override: injuryReport,
    apiBaseUrl,
    enabled: sorted.length > 0,
  });
  const injuryById = useMemo(
    () => (liveInjury ? injuryStatusByPlayerId(liveInjury) : {}),
    [liveInjury]
  );
  const foldCount = Math.max(1, collapsedCount);
  const restCount = Math.max(0, sorted.length - foldCount);
  /** 初回は常に上位 N。選択が下位でも自動展開しない */
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [homeTeamId, awayTeamId]);

  const visible = useMemo(() => {
    if (expanded) {
      return sorted.map((row, index) => ({ row, rank: index + 1 }));
    }
    if (value) {
      const index = sorted.findIndex((row) => isSamePick(value, row));
      if (index >= 0) return [{ row: sorted[index], rank: index + 1 }];
    }
    return sorted.slice(0, foldCount).map((row, index) => ({
      row,
      rank: index + 1,
    }));
  }, [expanded, foldCount, sorted, value]);

  const onPick = (row: NbaTopScorerCandidate) => {
    if (isSamePick(value, row)) {
      onChange(null);
      return;
    }
    onChange({ playerId: row.playerId, teamId: row.teamId, name: row.name });
    if (compact) setExpanded(false);
  };

  const onRowPress = (row: NbaTopScorerCandidate) => {
    if (compact && !expanded && restCount > 0) {
      setExpanded(true);
      return;
    }
    onPick(row);
  };

  return (
    <View style={[styles.root, compact ? styles.rootCompact : null]}>
      <View style={[styles.header, compact ? styles.headerCompact : null]}>
        <View style={styles.headerText}>
          <Text style={[styles.title, compact ? styles.titleCompact : null]}>
            {t.nbaTopScorerTitle}
          </Text>
          <Text style={[styles.hint, compact ? styles.hintCompact : null]}>
            {t.nbaTopScorerBonusHint}
          </Text>
        </View>
        {value ? (
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t.nbaTopScorerClear}
          >
            <Text style={styles.clear}>{t.nbaTopScorerClear}</Text>
          </Pressable>
        ) : null}
      </View>

      {candidatesLoading && sorted.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>{t.nbaTopScorerLoading}</Text>
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>{t.nbaTopScorerEmpty}</Text>
        </View>
      ) : (
        <View style={styles.table}>
          <View style={[styles.head, compact ? styles.headCompact : null]}>
            <Text
              style={[
                styles.th,
                styles.colRank,
                compact ? styles.colRankCompact : null,
              ]}
            >
              #
            </Text>
            <Text style={[styles.th, styles.colPlayer]}>
              {t.nbaTopScorerPlayerCol}
            </Text>
            <Text style={[styles.th, styles.colTeamHead]}>
              {t.nbaTopScorerTeamCol}
            </Text>
            <Text style={[styles.th, styles.colGp]}>GP</Text>
            <Text style={[styles.th, styles.colMetric]}>PTS</Text>
          </View>

          {visible.map(({ row, rank }) => {
            const selected = isSamePick(value, row);
            const injuryStatus = injuryById[row.playerId];
            return (
              <Pressable
                key={`${row.teamId}:${row.playerId}`}
                onPress={() => onRowPress(row)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.row,
                  compact ? styles.rowCompact : null,
                  selected ? styles.rowSelected : null,
                  pressed ? styles.rowPressed : null,
                ]}
              >
                {({ pressed }) => (
                  <>
                    {pressed ? (
                      <View
                        pointerEvents="none"
                        style={styles.rowPressedWash}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.tdRank,
                        compact ? styles.tdRankCompact : null,
                        { color: rankColor(rank) },
                      ]}
                    >
                      {rank}
                    </Text>
                    <View
                      style={[
                        styles.playerCol,
                        compact ? styles.playerColCompact : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tdPlayer,
                          compact ? styles.tdPlayerCompact : null,
                        ]}
                        numberOfLines={1}
                      >
                        {row.name}
                      </Text>
                      {injuryStatus ? (
                        <View style={compact ? styles.injuryChipCompactWrap : null}>
                          <InjuryChip status={injuryStatus} />
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.colTeam}>
                      <TeamAbbrBadgeNative
                        teamId={row.teamId}
                        fillColor={
                          homeTeamId && awayTeamId
                            ? matchupTeamUiAccent(
                                "nba",
                                row.teamId,
                                homeTeamId,
                                awayTeamId
                              )
                            : null
                        }
                      />
                    </View>
                    <Text
                      style={[styles.tdGp, compact ? styles.tdGpCompact : null]}
                    >
                      {row.gp ?? "—"}
                    </Text>
                    <Text
                      style={[
                        styles.tdMetric,
                        compact ? styles.tdMetricCompact : null,
                      ]}
                    >
                      {fmtPpg(row.ppg)}
                    </Text>
                  </>
                )}
              </Pressable>
            );
          })}

          {restCount > 0 ? (
            <Pressable
              onPress={() => setExpanded((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              style={({ pressed }) => [
                styles.more,
                compact ? styles.moreCompact : null,
                pressed ? styles.rowPressed : null,
              ]}
            >
              <Text style={styles.moreText}>
                {expanded ? "▲ " : "▼ "}
                {expanded
                  ? t.nbaTopScorerLess
                  : t.nbaTopScorerMore.replace("{n}", String(restCount))}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: "stretch",
    width: "100%",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.32)",
    backgroundColor: "rgba(0,14,20,0.55)",
  },
  rootCompact: {
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  headerCompact: {
    marginBottom: 4,
  },
  titleCompact: {
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0.9,
  },
  hintCompact: {
    fontSize: 11,
    letterSpacing: 0.4,
  },
  headCompact: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  rowCompact: {
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  colRankCompact: {
    width: 18,
  },
  tdRankCompact: {
    width: 18,
    fontSize: 14,
  },
  playerColCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 2,
  },
  injuryChipCompactWrap: {
    marginTop: -2,
  },
  tdPlayerCompact: {
    fontSize: 13,
  },
  tdGpCompact: {
    fontSize: 12,
  },
  tdMetricCompact: {
    fontSize: 13,
  },
  moreCompact: {
    paddingVertical: 5,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 8,
  },
  title: {
    color: "#fff",
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "400",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
  },
  hint: {
    color: "#F5C518",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  clear: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.18)",
    backgroundColor: "rgba(4,16,24,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  empty: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    lineHeight: 18,
  },
  table: {
    overflow: "hidden",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.32)",
    backgroundColor: "rgba(4,16,24,0.45)",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,245,255,0.12)",
    backgroundColor: "rgba(0,245,255,0.06)",
  },
  th: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.42)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  colRank: { width: 26 },
  colPlayer: { flex: 1, minWidth: 0 },
  colTeamHead: { width: 46 },
  colGp: { width: 28, textAlign: "right" },
  colMetric: { width: 52, textAlign: "right", color: CYAN },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,245,255,0.08)",
    overflow: "hidden",
  },
  rowSelected: {
    backgroundColor: "rgba(0,245,255,0.16)",
  },
  rowPressed: {
    transform: [{ scale: 0.985 }],
  },
  rowPressedWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,245,255,0.16)",
  },
  tdRank: {
    width: 26,
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 15,
    letterSpacing: 0.5,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-10deg" }],
  },
  playerCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingRight: 4,
  },
  tdPlayer: {
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  injuryChip: {
    alignSelf: "flex-start",
    marginTop: 2,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  injuryChipText: {
    fontFamily: METRIC_FONT,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  colTeam: {
    width: 46,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  tdGp: {
    width: 28,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  tdMetric: {
    width: 52,
    textAlign: "right",
    fontFamily: OXANIUM_800,
    color: CYAN,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  more: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,245,255,0.12)",
  },
  moreText: {
    fontFamily: METRIC_FONT,
    color: CYAN,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
