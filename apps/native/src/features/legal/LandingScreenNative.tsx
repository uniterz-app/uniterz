import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import type { AuthStackParamList } from "../../navigation/types";
import { colors, fonts, spacing } from "../../theme/tokens";

export default function LandingScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#040a14", "#090c15", "#0a1118"]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hero}>UNITERZ</Text>
        <Text style={styles.tagline}>Predict. Compete. Rank.</Text>
        <Text style={styles.desc}>
          試合予想とランキングで競うスポーツ予想プラットフォーム
        </Text>
        <View style={styles.features}>
          {["試合予想", "リザルト分析", "ランキング", "コミュニティ"].map((f) => (
            <View key={f} style={styles.featureChip}>
              <Text style={styles.featureLabel}>{f}</Text>
            </View>
          ))}
        </View>
        <Pressable style={styles.ctaPrimary} onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.ctaPrimaryLabel}>GET STARTED</Text>
        </Pressable>
        <Pressable style={styles.ctaSecondary} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.ctaSecondaryLabel}>LOG IN</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
    paddingBottom: 48,
    alignItems: "center",
    gap: spacing.lg,
  },
  hero: {
    fontFamily: fonts.brand,
    fontSize: 56,
    letterSpacing: 4,
    color: colors.textPrimary,
  },
  tagline: {
    fontFamily: fonts.metric,
    fontSize: 16,
    color: colors.accentCyan,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  desc: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
  features: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  featureChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: "rgba(15,23,42,0.5)",
  },
  featureLabel: { color: colors.textSecondary, fontSize: 13 },
  ctaPrimary: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "rgba(34,211,238,0.2)",
    borderWidth: 1,
    borderColor: colors.accentCyan,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.md,
  },
  ctaPrimaryLabel: {
    fontFamily: fonts.brand,
    fontSize: 24,
    letterSpacing: 2,
    color: colors.textPrimary,
  },
  ctaSecondary: { paddingVertical: 12 },
  ctaSecondaryLabel: { color: colors.accentCyan, fontSize: 15, fontWeight: "600" },
});
