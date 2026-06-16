import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { colors } from "../../../theme/tokens";

export default function PlanChangeCompleteScreenNative() {
  const navigation = useNavigation();
  return (
    <MobilePageShell title="変更完了" onClose={() => navigation.goBack()}>
      <View style={styles.content}>
        <Text style={styles.desc}>プラン変更の反映には時間がかかる場合があります。</Text>
        <Pressable style={styles.cta} onPress={() => navigation.goBack()}>
          <Text style={styles.ctaLabel}>OK</Text>
        </Pressable>
      </View>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 24, gap: 16 },
  desc: { color: colors.textSecondary, lineHeight: 22, fontSize: 15 },
  cta: {
    marginTop: 8,
    backgroundColor: "rgba(34,211,238,0.18)",
    borderWidth: 1,
    borderColor: colors.accentCyan,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaLabel: { color: colors.textPrimary, fontWeight: "700" },
});
