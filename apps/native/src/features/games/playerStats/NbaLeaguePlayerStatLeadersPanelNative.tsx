/** Web: League Player Stats Leaders (mock) */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
  CYBER_TAB_CYAN,
} from "../../rankings/CyberSlantedTabNative";
import {
  METRIC_FONT,
  RANK_DISPLAY_FONT,
} from "../../rankings/rankingsUiTheme";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_15,
  MATCH_CARD_BRACKET_TEXT,
} from "../matchCardTypography";
import {
  NBA_PLAYER_STAT_LEADER_METRICS,
  NBA_PLAYER_STAT_LEADER_METRIC_ROWS,
  formatPlayerLeaderValue,
  getNbaPlayerStatLeadersMock,
  type NbaPlayerStatLeaderMetric,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import TeamAbbrBadgeNative from "../TeamAbbrBadgeNative";

type WindowId = "season" | "last10";

type Props = {
  language: "ja" | "en";
  onSelectPlayer?: (playerId: string) => void;
};

function MetricChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.metricChip,
        pressed ? { opacity: 0.85 } : null,
        active ? styles.metricChipActive : null,
      ]}
    >
      <Text style={[styles.metricChipLabel, active && styles.metricChipLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function NbaLeaguePlayerStatLeadersPanelNative({
  language,
  onSelectPlayer,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const bundle = useMemo(() => getNbaPlayerStatLeadersMock(), []);

  const [windowId, setWindowId] = useState<WindowId>("season");
  const [metric, setMetric] = useState<NbaPlayerStatLeaderMetric>("pts");

  const metricMeta = NBA_PLAYER_STAT_LEADER_METRICS.find((m) => m.id === metric)!;

  const leaders = bundle[windowId][metric];

  const bottomPad = Math.max(12, insets.bottom);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.pad, { paddingBottom: bottomPad + 160 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.asOf}>
            {bundle.asOfLabel}
          </Text>
          <Text style={styles.sub}>
            {isJa
              ? "BallDontLie Leaders 相当の stat_type（モック）。"
              : "Mock aligned to BallDontLie Leaders stat_type."}
          </Text>
        </View>

        <View style={styles.tabBlock}>
          <CyberSlantedTabBarNative fill>
            <CyberSlantedTabNative
              label="SEASON"
              active={windowId === "season"}
              onPress={() => setWindowId("season")}
              compact
              fontWeight="700"
            />
            <CyberSlantedTabNative
              label="LAST 10"
              active={windowId === "last10"}
              onPress={() => setWindowId("last10")}
              compact
              fontWeight="700"
            />
          </CyberSlantedTabBarNative>
        </View>

        <View style={styles.metricBlock}>
          {NBA_PLAYER_STAT_LEADER_METRIC_ROWS.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.metricRowLine}>
              {row.map((m) => (
                <View key={m.id} style={styles.metricCell}>
                  <MetricChip
                    active={metric === m.id}
                    label={m.short}
                    onPress={() => setMetric(m.id)}
                  />
                </View>
              ))}
              {/* Team Stats と同じ 6 列幅を保つ（最終行の MIN/EFF が横に伸びないように） */}
              {Array.from({ length: Math.max(0, 6 - row.length) }).map(
                (_, i) => (
                  <View
                    key={`pad-${rowIdx}-${i}`}
                    style={styles.metricCell}
                    pointerEvents="none"
                  />
                )
              )}
            </View>
          ))}
        </View>

        <Text style={styles.metricHint}>
          {isJa ? metricMeta.hintJa : metricMeta.hintEn}
        </Text>

        <View style={styles.sortMeta}>
          <Text style={styles.sortTitle}>
            {isJa ? "リーダー" : "Leaders"} · {metricMeta.short}
          </Text>
          <Text style={styles.sortSub}>
            {isJa ? "Top 30" : "Top 30"}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.colRank]}>#</Text>
            <Text style={[styles.th, styles.colPlayer]}>
              {isJa ? "選手" : "Player"}
            </Text>
            <Text style={[styles.th, styles.colTeam]}>
              {isJa ? "チーム" : "Team"}
            </Text>
            <Text style={[styles.th, styles.colGp]}>
              {isJa ? "試合" : "GP"}
            </Text>
            <Text style={[styles.th, styles.colVal]}>{metricMeta.short}</Text>
          </View>

          {leaders.map((row, index) => (
            <Pressable
              key={row.playerId}
              onPress={() => onSelectPlayer?.(row.playerId)}
              style={({ pressed }) => [
                styles.row,
                pressed && onSelectPlayer ? { opacity: 0.75 } : null,
              ]}
            >
              <Text style={[styles.tdRank, { color: index < 6 ? CYBER_TAB_CYAN : "rgba(255,255,255,0.55)" }]}>
                {index + 1}
              </Text>
              <Text style={styles.tdPlayer} numberOfLines={1}>
                {row.playerName}
              </Text>
              <View style={styles.colTeam}>
                <TeamAbbrBadgeNative teamId={row.teamId} />
              </View>
              <Text style={styles.tdGp}>{row.gamesPlayed}</Text>
              <Text style={styles.tdVal}>
                {formatPlayerLeaderValue(metric, row.value)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { paddingHorizontal: 16, paddingTop: 4 },
  header: { marginBottom: 12, gap: 6 },
  asOf: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.45)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  sub: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.52)",
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  tabBlock: { marginBottom: 10 },
  metricBlock: { gap: 6, marginBottom: 8 },
  metricRowLine: { flexDirection: "row", gap: 6 },
  metricCell: { flex: 1, minWidth: 0 },
  metricChip: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
    backgroundColor: "rgba(4,20,30,0.72)",
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 8,
    alignItems: "center",
  },
  metricChipActive: {
    borderColor: CYBER_TAB_CYAN,
    backgroundColor: CYBER_TAB_CYAN,
  },
  metricChipLabel: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    textAlign: "center",
    transform: [{ skewX: "-6deg" }],
  },
  metricChipLabelActive: { color: "#050508" },
  metricHint: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.68)",
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
    minHeight: 34,
  },
  sortMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sortTitle: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.42)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  sortSub: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.35)",
    fontSize: 10,
    fontWeight: "700",
  },
  table: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.12)",
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(4,16,24,0.35)",
  },
  tableHead: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,245,255,0.06)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,245,255,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  th: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.42)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  colRank: { width: 28 },
  colPlayer: { flex: 1.2 },
  colTeam: { width: 46, alignItems: "flex-start", justifyContent: "center" },
  colGp: { width: 36, textAlign: "right" },
  colVal: { width: 56, textAlign: "right" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,245,255,0.08)",
    gap: 4,
  },
  tdRank: {
    width: 28,
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 13,
    letterSpacing: 0.5,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-10deg" }],
  },
  tdPlayer: {
    flex: 1.2,
    color: "rgba(255,255,255,0.92)",
    ...MATCH_CARD_BRACKET_TEXT,
    fontSize: 18,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_15,
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  tdGp: {
    width: 36,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  tdVal: {
    width: 56,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
});

