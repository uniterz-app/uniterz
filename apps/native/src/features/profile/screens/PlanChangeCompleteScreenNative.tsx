/**
 * Web `app/mobile/plan-change-complete/page.tsx` 相当
 */
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { doc, getDoc } from "firebase/firestore";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { db } from "../../../lib/firebase";
import type { ProfileStackParamList } from "../../../navigation/types";
import { colors, fonts, spacing } from "../../../theme/tokens";

export default function PlanChangeCompleteScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const [planType, setPlanType] = useState<"monthly" | "annual">("monthly");
  const [proUntil, setProUntil] = useState("");
  const [handle, setHandle] = useState<string | null>(null);

  useEffect(() => {
    if (!fUser) return;
    let alive = true;
    void (async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      if (!alive) return;
      const data = snap.data() as { planType?: unknown; proUntil?: { toDate?: () => Date }; handle?: unknown } | undefined;
      setPlanType(data?.planType === "annual" ? "annual" : "monthly");
      const d = data?.proUntil?.toDate?.();
      setProUntil(
        d
          ? d.toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : ""
      );
      setHandle(typeof data?.handle === "string" && data.handle.trim() ? data.handle.trim() : fUser.uid);
    })();
    return () => {
      alive = false;
    };
  }, [fUser]);

  return (
    <MobilePageShell title="変更完了" appBackground onClose={() => navigation.goBack()}>
      <View style={styles.content}>
        <View style={styles.headingRow}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkText}>✓</Text>
          </View>
          <Text style={styles.heading}>Plan updated successfully</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.logoCard}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>U</Text>
            </View>
            <Text style={styles.logoText}>UNITERZ</Text>
            <View style={styles.planRow}>
              <View style={styles.dot} />
              <Text style={styles.planText}>
                {planType === "annual" ? "Pro Annual Plan" : "Pro Monthly Plan"}
              </Text>
            </View>
          </View>

          <Text style={styles.untilText}>
            次回更新日：<Text style={styles.untilStrong}>{proUntil || "—"}</Text>
          </Text>

          <Pressable
            disabled={!handle}
            onPress={() => {
              if (handle) navigation.navigate("PublicProfile", { handle });
            }}
            style={{ opacity: handle ? 1 : 0.55 }}
          >
            <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.cta}>
              <Text style={styles.ctaLabel}>Proデータを見る</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>プランに関する質問はサポートにお問い合わせください。</Text>
          <View style={styles.linkRow}>
            <Pressable onPress={() => navigation.navigate("Terms")}>
              <Text style={styles.link}>利用規約</Text>
            </Pressable>
            <Text style={styles.footerText}>|</Text>
            <Pressable onPress={() => navigation.navigate("Contact")}>
              <Text style={styles.link}>お問い合わせ</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.lg, alignItems: "center", justifyContent: "center" },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4ade80",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { color: "#000", fontSize: 14, fontWeight: "900" },
  heading: { color: "rgba(255,255,255,0.9)", fontSize: 20, fontWeight: "900" },
  card: {
    width: 320,
    minHeight: 320,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 24,
    justifyContent: "space-between",
  },
  logoCard: {
    height: 180,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0b1f26",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  logoMark: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    backgroundColor: "rgba(34,197,94,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoMarkText: { color: colors.textPrimary, fontFamily: fonts.brand, fontSize: 36, lineHeight: 40 },
  logoText: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: fonts.metric,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 5.3,
  },
  planRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80" },
  planText: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  untilText: { color: "rgba(255,255,255,0.7)", fontSize: 12, textAlign: "center", marginTop: 14, marginBottom: 10 },
  untilStrong: { color: "rgba(255,255,255,0.92)", fontWeight: "800" },
  cta: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
  },
  ctaLabel: { color: colors.textPrimary, fontWeight: "700" },
  footer: { marginTop: 24, alignItems: "center", gap: 8 },
  footerText: { color: "rgba(255,255,255,0.6)", fontSize: 12, textAlign: "center" },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  link: { color: colors.textPrimary, fontSize: 14, fontWeight: "800" },
});
