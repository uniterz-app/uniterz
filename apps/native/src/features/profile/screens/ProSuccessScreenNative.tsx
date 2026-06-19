import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, getDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
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
    if (!fUser?.uid) return;
    let cancelled = false;
    void (async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      if (cancelled) return;
      const value = snap.exists() ? snap.data()?.handle : null;
      setHandle(typeof value === "string" && value.trim() ? value.trim() : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [fUser?.uid]);

  const startedOn = useMemo(
    () =>
      new Date().toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    []
  );

  return (
    <MobilePageShell title="Pro" appBackground onClose={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headingRow}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkText}>✓</Text>
          </View>
          <Text style={styles.title}>Upgrade to Pro!</Text>
        </View>

        <View style={styles.card}>
          <LinearGradient
            colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.025)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.logoPlate}>
            <Image
              source={require("../../../../assets/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brand}>UNITERZ</Text>
            <View style={styles.planRow}>
              <View style={styles.planDot} />
              <Text style={styles.planText}>
                {plan === "monthly" ? "Pro Monthly Plan" : "Pro Yearly Plan"}
              </Text>
            </View>
          </View>

          <Text style={styles.started}>Started on {startedOn}</Text>

          <Pressable
            disabled={!handle}
            onPress={() => {
              if (handle) navigation.navigate("PublicProfile", { handle });
            }}
            accessibilityRole="button"
            style={{ opacity: handle ? 1 : 0.55 }}
          >
            <LinearGradient colors={["#3B82F6", "#22D3EE"]} style={styles.cta}>
              <Text style={styles.ctaLabel}>Pro データを見る</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>プランに関する質問はサポートに問い合わせしてください。</Text>
          <View style={styles.footerLinks}>
            <Pressable onPress={() => navigation.navigate("Terms")} accessibilityRole="button">
              <Text style={styles.footerLink}>利用規約</Text>
            </Pressable>
            <Text style={styles.footerSep}>|</Text>
            <Pressable onPress={() => navigation.navigate("Contact")} accessibilityRole="button">
              <Text style={styles.footerLink}>お問い合わせ</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  headingRow: {
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { color: "#000", fontSize: 14, fontWeight: "900" },
  title: { color: "rgba(255,255,255,0.92)", fontSize: 20, fontWeight: "900" },
  card: {
    width: 320,
    minHeight: 320,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
    padding: 24,
    justifyContent: "space-between",
  },
  logoPlate: {
    alignSelf: "center",
    width: 220,
    height: 180,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0b1f26",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  logo: { width: 60, height: 60 },
  brand: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: fonts.brand,
    fontSize: 28,
    letterSpacing: 4,
  },
  planRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  planDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  planText: { color: "rgba(255,255,255,0.82)", fontSize: 13 },
  started: {
    marginTop: 12,
    marginBottom: 10,
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
  },
  cta: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
  },
  ctaLabel: { color: colors.textPrimary, fontWeight: "900" },
  footer: { marginTop: 24, alignItems: "center", gap: 8 },
  footerText: { color: "rgba(255,255,255,0.6)", fontSize: 12, textAlign: "center" },
  footerLinks: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerLink: { color: "rgba(255,255,255,0.92)", fontSize: 14, fontWeight: "900" },
  footerSep: { color: "rgba(255,255,255,0.55)", fontSize: 13 },
});
