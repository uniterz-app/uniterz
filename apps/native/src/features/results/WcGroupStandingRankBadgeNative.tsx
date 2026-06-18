import { Text, View, type TextStyle, type ViewStyle } from "react-native";
import type { Language } from "../../../../../lib/i18n/language";
import { formatWcGroupStandingRankLabel } from "../../../../../lib/wc/wcGroupStandingRank";

type Props = {
  rank: number | null | undefined;
  language: Language;
};

/** 国旗の直上 — グループ内順位（Web `WcGroupStandingRankBadge` 相当） */
export default function WcGroupStandingRankBadgeNative({ rank, language }: Props) {
  if (rank == null || rank <= 0) return null;
  const label = formatWcGroupStandingRankLabel(rank, language);
  return (
    <View style={styles.pill} accessibilityLabel={language === "ja" ? `グループ ${rank} 位` : `Group rank ${rank}`}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = {
  pill: {
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.08)",
  } satisfies ViewStyle,
  text: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
    fontVariant: ["tabular-nums"],
  } satisfies TextStyle,
};
