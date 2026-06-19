/**
 * Web `app/mobile/cancel-complete/page.tsx` 相当
 */
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { db } from "../../../lib/firebase";
import type { ProfileStackParamList } from "../../../navigation/types";
import { colors, fonts, spacing } from "../../../theme/tokens";

function formatDate(raw: unknown): string {
  const d =
    raw instanceof Date
      ? raw
      : raw instanceof Timestamp
        ? raw.toDate()
        : raw && typeof raw === "object" && "toDate" in raw && typeof (raw as { toDate: () => Date }).toDate === "function"
          ? (raw as { toDate: () => Date }).toDate()
          : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CancelCompleteScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const [handle, setHandle] = useState<string | null>(null);
  const [proUntil, setProUntil] = useState("");

  useEffect(() => {
    let alive = true;
    if (!fUser) {
      setHandle(null);
      setProUntil("");
      return;
    }
    void (async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      if (!alive) return;
      const data = snap.data() as { handle?: unknown; proUntil?: unknown } | undefined;
      const rawHandle =
        typeof data?.handle === "string" && data.handle.trim() ? data.handle.trim() : null;
      setHandle(rawHandle ?? fUser.uid);
      setProUntil(formatDate(data?.proUntil));
    })();
    return () => {
      alive = false;
    };
  }, [fUser]);

  const openProfile = () => {
    if (!handle) return;
    navigation.navigate("PublicProfile", { handle });
  };

  return (
    <MobilePageShell title="解約完了" appBackground onClose={() => navigation.goBack()}>
      <View style={styles.content}>
        <View style={styles.heading}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkText}>✓</Text>
          </View>
          <Text style={styles.title}>Your plan has been canceled!</Text>
          <Text style={styles.desc}>
            Pro Planのご利用、ありがとうございました。{"\n"}
            皆さまのサポートが、Uniterzの改善につながっています。
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.logoCard}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>U</Text>
            </View>
            <Text style={styles.logoText}>UNITERZ</Text>
            <Text style={styles.planText}>Free Plan</Text>
          </View>

          <Text style={styles.untilText}>
            プランは <Text style={styles.untilStrong}>{proUntil || "—"}</Text> まで利用できます
          </Text>

          <Pressable disabled={!handle} onPress={openProfile} style={{ opacity: handle ? 1 : 0.55 }}>
            <LinearGradient colors={["#F59E0B", "#F97316"]} style={styles.cta}>
              <Text style={styles.ctaLabel}>Back to Profile</Text>
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
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    alignItems: "center",
    marginBottom: 24,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  checkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  title: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  desc: {
    color: "rgba(255,255,255,0.7)",
    lineHeight: 21,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
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
    borderColor: "rgba(249,115,22,0.35)",
    backgroundColor: "rgba(249,115,22,0.1)",
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
  planText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  untilText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 10,
  },
  untilStrong: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "800",
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
