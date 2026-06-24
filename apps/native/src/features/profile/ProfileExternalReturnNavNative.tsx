/** Web `RankingsReturnNavLink` 相当 */
import { Pressable, StyleSheet, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Language } from "../../../../../lib/i18n/language";
import { t } from "../../../../../lib/i18n/t";

type Props = {
  language: Language;
  variant: "rankings" | "leaderboards";
  onPress: () => void;
};

export default function ProfileExternalReturnNavNative({
  language,
  variant,
  onPress,
}: Props) {
  const m = t(language);
  const label =
    variant === "leaderboards"
      ? m.profile.backToGroupRankings
      : m.profile.backToRankings;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
    >
      <MaterialCommunityIcons
        name="chevron-left"
        size={18}
        color="rgba(240,253,250,0.95)"
      />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(165,243,252,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  btnPressed: {
    opacity: 0.88,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  label: {
    color: "rgba(240,253,250,0.95)",
    fontSize: 14,
    fontWeight: "600",
  },
});
