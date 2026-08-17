/** Web `NbaTopScorerResultRow` 相当 */
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getTeamPrimaryColor } from "../../../../../lib/team-colors";
import type { NbaTopScorerResultInfo } from "../../../../../lib/result/resolveNbaTopScorerResult";
import { MATCH_CARD_METRIC_FONT } from "../games/matchCardTypography";
import {
  OVERLAY_RESULT_STAT_LABEL_W,
  OVERLAY_RESULT_STAT_ROW_GAP,
} from "./resultMobileUiNative";

type Props = {
  label: string;
  info: NbaTopScorerResultInfo;
  compact?: boolean;
};

export default function NbaTopScorerResultRowNative({
  label,
  info,
  compact = false,
}: Props) {
  const teamColor = getTeamPrimaryColor("nba", info.teamId) ?? "#e8edf5";
  const markSize = compact ? 16 : 18;

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <Text style={[styles.label, compact && styles.labelCompact]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.mid}>
        <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
          {info.playerName}
        </Text>
        <View style={[styles.tag, { borderColor: teamColor }]}>
          <Text style={[styles.tagText, { color: teamColor }]}>{info.teamTag}</Text>
        </View>
      </View>
      <View style={styles.markSlot}>
        {info.hit === true ? (
          <MaterialCommunityIcons name="check" size={markSize} color="#34d399" />
        ) : info.hit === false ? (
          <MaterialCommunityIcons name="close" size={markSize} color="#fb7185" />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: OVERLAY_RESULT_STAT_ROW_GAP,
    paddingVertical: 6,
  },
  rowCompact: {
    paddingVertical: 4,
  },
  label: {
    width: OVERLAY_RESULT_STAT_LABEL_W,
    flexShrink: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.96)",
  },
  labelCompact: {
    fontSize: 10,
    lineHeight: 14,
  },
  mid: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  nameCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  tag: {
    flexShrink: 0,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "transparent",
  },
  tagText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  markSlot: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
