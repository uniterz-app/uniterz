import { Pressable, StyleSheet, Text, View } from "react-native";
import type { WcRankingStage } from "../../../../../lib/rankings/wcRankingStage";
import { colors } from "../../theme/tokens";

const STAGES: Array<{ id: WcRankingStage; ja: string; en: string }> = [
  { id: "overall", ja: "総合", en: "Overall" },
  { id: "qualifying", ja: "予選", en: "Qualifying" },
  { id: "main", ja: "本戦", en: "Main" },
];

type Props = {
  stage: WcRankingStage;
  onChange: (stage: WcRankingStage) => void;
  language: "ja" | "en";
};

/** Web `WcRankingStageTabs` のネイティブ版 */
export default function WcRankingStageTabsNative({ stage, onChange, language }: Props) {
  const isJa = language === "ja";

  return (
    <View style={styles.row}>
      {STAGES.map((s) => {
        const active = stage === s.id;
        return (
          <Pressable
            key={s.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(s.id)}
          >
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
              {isJa ? s.ja : s.en}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  chipActive: {
    borderColor: "rgba(103,232,249,0.45)",
    backgroundColor: "rgba(103,232,249,0.12)",
  },
  chipLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  chipLabelActive: { color: colors.textPrimary },
});
