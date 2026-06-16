import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { colors, fonts } from "../../../theme/tokens";

export default function ProSuccessScreenNative() {
  const navigation = useNavigation();

  return (
    <MobilePageShell title="Pro" onClose={() => navigation.goBack()}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Pro!</Text>
        <Text style={styles.desc}>Pro プランが有効になりました。分析タブで詳細を確認できます。</Text>
        <Pressable style={styles.cta} onPress={() => navigation.goBack()}>
          <Text style={styles.ctaLabel}>OK</Text>
        </Pressable>
      </View>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center", gap: 16 },
  title: { fontFamily: fonts.brand, fontSize: 32, color: colors.textPrimary, letterSpacing: 2 },
  desc: { color: colors.textSecondary, textAlign: "center", lineHeight: 22 },
  cta: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentCyan,
    backgroundColor: "rgba(34,211,238,0.15)",
  },
  ctaLabel: { color: colors.textPrimary, fontWeight: "700" },
});
