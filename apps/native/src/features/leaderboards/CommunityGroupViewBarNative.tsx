/** グループ順位の表示切替 — 下線インジケータの細い HUD レール */
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Language } from "../../../../../lib/i18n/language";
import {
  COMMUNITY_GAMES_SCOPES,
  type CommunityGamesScope,
} from "../../../../../lib/communities/communityGamesScope";
import {
  COMMUNITY_METRICS,
  type CommunityMetric,
} from "../../../../../lib/communities/types";
import {
  gamesScopeChipLabel,
  metricLabel,
} from "../../../../../lib/communities/labels";
import { COMMUNITY_GROUP_PANEL_PADDING_X } from "../../../../../lib/communities/communityGroupShell";
import {
  communityMono,
  communityPressableTapStyle,
} from "./communityCrtThemeNative";

type Props = {
  language: Language;
  metric: CommunityMetric;
  gamesScope: CommunityGamesScope;
  onSelectMetric: (metric: CommunityMetric) => void;
  onSelectGamesScope: (scope: CommunityGamesScope) => void;
  gamesScopeBusy?: boolean;
};

function RailTab({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        styles.tab,
        pressed && !disabled && communityPressableTapStyle(true),
        disabled && styles.tabDisabled,
      ]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
      <View style={[styles.tabUnderline, active && styles.tabUnderlineActive]} />
    </Pressable>
  );
}

export default function CommunityGroupViewBarNative({
  language,
  metric,
  gamesScope,
  onSelectMetric,
  onSelectGamesScope,
  gamesScopeBusy = false,
}: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        {COMMUNITY_METRICS.map((key) => (
          <RailTab
            key={key}
            label={metricLabel(key, language)}
            active={key === metric}
            onPress={() => onSelectMetric(key)}
          />
        ))}
      </View>
      <View style={[styles.row, styles.rowScope]}>
        {COMMUNITY_GAMES_SCOPES.map((key) => (
          <RailTab
            key={key}
            label={gamesScopeChipLabel(key, language)}
            active={key === gamesScope}
            disabled={gamesScopeBusy}
            onPress={() => onSelectGamesScope(key)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: COMMUNITY_GROUP_PANEL_PADDING_X,
    paddingTop: 2,
    paddingBottom: 10,
    gap: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },
  rowScope: {
    marginTop: 2,
  },
  tab: {
    flex: 1,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 6,
    alignItems: "center",
  },
  tabDisabled: {
    opacity: 0.45,
  },
  tabText: {
    fontFamily: communityMono,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center",
    color: "rgba(255,255,255,0.42)",
  },
  tabTextActive: {
    color: "#00F5FF",
    fontWeight: "700",
  },
  tabUnderline: {
    marginTop: 6,
    height: 1.5,
    width: "100%",
    backgroundColor: "transparent",
  },
  tabUnderlineActive: {
    backgroundColor: "#00F5FF",
  },
});
