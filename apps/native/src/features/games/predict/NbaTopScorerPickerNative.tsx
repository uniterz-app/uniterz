/** Web `NbaTopScorerPicker` 相当 */
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  sortNbaTopScorerCandidatesByPpg,
  type NbaTopScorerCandidate,
  type NbaTopScorerPick,
} from "../../../../../../lib/nba/topScorer";
import type { GamesLanguage } from "../gamesI18n";
import { getGamesTexts } from "../gamesI18n";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_15,
  MATCH_CARD_BRACKET_TEXT,
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
import { injuryReportForMatchup } from "../../../../../../lib/predict/nbaInjuryReportPreviewMocks";

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
  candidates: NbaTopScorerCandidate[];
  value: NbaTopScorerPick | null;
  onChange: (next: NbaTopScorerPick | null) => void;
  language: GamesLanguage;
  injuryReport?: NbaInjuryReport | null;
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
  candidates,
  value,
  onChange,
  language,
  injuryReport,
}: Props) {
  const t = getGamesTexts(language);
  const isJa = language === "ja";
  const sorted = useMemo(
    () => sortNbaTopScorerCandidatesByPpg(candidates),
    [candidates]
  );
  const injuryById = useMemo(() => {
    const report =
      injuryReport ??
      injuryReportForMatchup(homeTeamId ?? undefined, awayTeamId ?? undefined);
    return report ? injuryStatusByPlayerId(report) : {};
  }, [injuryReport, homeTeamId, awayTeamId]);
  const restCount = Math.max(0, sorted.length - TOP_N);
  const selectedOutsideTop = useMemo(() => {
    if (!value) return false;
    const idx = sorted.findIndex((row) => isSamePick(value, row));
    return idx >= TOP_N;
  }, [sorted, value]);
  const [expanded, setExpanded] = useState(selectedOutsideTop);

  useEffect(() => {
    if (selectedOutsideTop) setExpanded(true);
  }, [selectedOutsideTop]);

  const visible = expanded ? sorted : sorted.slice(0, TOP_N);

  const onPick = (row: NbaTopScorerCandidate) => {
    if (isSamePick(value, row)) {
      onChange(null);
      return;
    }
    onChange({ playerId: row.playerId, teamId: row.teamId, name: row.name });
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t.nbaTopScorerTitle}</Text>
          <Text style={styles.hint}>{t.nbaTopScorerBonusHint}</Text>
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

      {sorted.length === 0 ? (
        <Text style={styles.empty}>{t.nbaTopScorerEmpty}</Text>
      ) : (
        <View style={styles.table}>
          <View style={styles.head}>
            <Text style={[styles.th, styles.colRank]}>#</Text>
            <Text style={[styles.th, styles.colPlayer]}>
              {isJa ? "選手" : "Player"}
            </Text>
            <Text style={[styles.th, styles.colTeamHead]}>
              {isJa ? "チーム" : "Team"}
            </Text>
            <Text style={[styles.th, styles.colGp]}>GP</Text>
            <Text style={[styles.th, styles.colMetric]}>PTS</Text>
          </View>

          {visible.map((row, index) => {
            const rank = index + 1;
            const selected = isSamePick(value, row);
            const injuryStatus = injuryById[row.playerId];
            return (
              <Pressable
                key={`${row.teamId}:${row.playerId}`}
                onPress={() => onPick(row)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.row,
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
                    <Text style={[styles.tdRank, { color: rankColor(rank) }]}>
                      {rank}
                    </Text>
                    <View style={styles.playerCol}>
                      <Text style={styles.tdPlayer} numberOfLines={1}>
                        {row.name}
                      </Text>
                      {injuryStatus ? (
                        <InjuryChip status={injuryStatus} />
                      ) : null}
                    </View>
                    <View style={styles.colTeam}>
                      <TeamAbbrBadgeNative teamId={row.teamId} />
                    </View>
                    <Text style={styles.tdGp}>{row.gp ?? "—"}</Text>
                    <Text style={styles.tdMetric}>{fmtPpg(row.ppg)}</Text>
                  </>
                )}
              </Pressable>
            );
          })}

          {restCount > 0 ? (
            <Pressable
              onPress={() => setExpanded((v) => !v)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.more,
                pressed ? styles.rowPressed : null,
              ]}
            >
              <Text style={styles.moreText}>
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
    marginTop: 12,
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
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
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
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
  empty: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
  },
  table: {
    overflow: "hidden",
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,245,255,0.12)",
    backgroundColor: "rgba(4,16,24,0.35)",
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
    ...MATCH_CARD_BRACKET_TEXT,
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_15,
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
