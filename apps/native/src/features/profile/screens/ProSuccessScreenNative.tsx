/**
 * Web `app/mobile/pro/success/page.tsx` 相当
 */
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { doc, getDoc } from "firebase/firestore";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { db } from "../../../lib/firebase";
import type { ProfileStackParamList } from "../../../navigation/types";
import { colors, fonts, spacing } from "../../../theme/tokens";

export default function ProSuccessScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const route = useRoute<RouteProp<ProfileStackParamList, "ProSuccess">>();
  const { fUser } = useFirebaseUser();
  const [handle, setHandle] = useState<string | null>(null);
  const plan = route.params?.plan ?? "monthly";

  useEffect(() => {
    let alive = true;
    if (!fUser) {
      setHandle(null);
      return;
    }
    void (async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      if (!alive) return;
      const data = snap.data() as { handle?: unknown } | undefined;
      const raw = typeof data?.handle === "string" && data.handle.trim() ? data.handle.trim() : null;
      setHandle(raw ?? fUser.uid);
    })();
    return () => {
      alive = false;
    };
  }, [fUser]);

  const startedOn = useMemo(
    () =>
      new Date().toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    []
  );

  const openProData = () => {
    if (!handle) return;
    navigation.navigate("PublicProfile", { handle });
  };

  return (
    <MobilePageShell title="Pro" appBackground onClose={() => navigation.goBack()}>
      <View style={styles.content}>
        <View style={styles.headingRow}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkText}>✓</Text>
          </View>
          <Text style={styles.heading}>Upgrade to Pro!</Text>
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
                {plan === "monthly" ? "Pro Monthly Plan" : "Pro Yearly Plan"}
              </Text>
            </View>
          </View>

          <Text style={styles.started}>Started on {startedOn}</Text>

          <Pressable disabled={!handle} onPress={openProData} style={{ opacity: handle ? 1 : 0.55 }}>
            <LinearGradient colors={["#3B82F6", "#22D3EE"]} style={styles.cta}>
              <Text style={styles.ctaLabel}>Pro データを見る</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>プランに関する質問はサポートに問い合わせしてください。</Text>
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
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
  },
  heading: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 20,
    fontWeight: "900",
  },
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
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(34,211,238,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoMarkText: {
    color: colors.textPrimary,
    fontFamily: fonts.brand,
    fontSize: 36,
    lineHeight: 40,
  },
  logoText: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: fonts.metric,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 5.3,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  planText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  started: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 10,
  },
  cta: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
  },
  ctaLabel: { color: colors.textPrimary, fontWeight: "700" },
  footer: {
    marginTop: 24,
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  link: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
});
