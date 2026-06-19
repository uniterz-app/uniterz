import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, getDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { db } from "../../../lib/firebase";
import type { ProfileStackParamList } from "../../../navigation/types";
import { colors, fonts, spacing } from "../../../theme/tokens";

function formatDate(value: unknown) {
  const date =
    value instanceof Date
      ? value
      : value && typeof value === "object" && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function"
        ? (value as { toDate: () => Date }).toDate()
        : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ja-JP", {
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
    if (!fUser?.uid) return;
    let cancelled = false;
    void (async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      if (cancelled || !snap.exists()) return;
      const data = snap.data();
      const nextHandle = data.handle;
      if (typeof nextHandle === "string" && nextHandle.trim()) {
        setHandle(nextHandle.trim());
      }
      setProUntil(formatDate(data.proUntil));
    })();
    return () => {
      cancelled = true;
    };
  }, [fUser?.uid]);

  return (
    <MobilePageShell title="解約完了" appBackground onClose={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <View style={styles.headingRow}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkText}>✓</Text>
            </View>
            <Text style={styles.title}>Your plan has been canceled!</Text>
          </View>
          <Text style={styles.desc}>
            Pro Planのご利用、ありがとうございました。{"\n"}
            皆さまのサポートが、Uniterzの改善につながっています。
          </Text>
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
            <Text style={styles.freePlan}>Free Plan</Text>
          </View>

          <Text style={styles.until}>
            プランは <Text style={styles.untilStrong}>{proUntil || "—"}</Text> まで利用できます
          </Text>

          <Pressable
            disabled={!handle}
            onPress={() => {
              if (handle) navigation.navigate("PublicProfile", { handle });
            }}
            accessibilityRole="button"
            style={{ opacity: handle ? 1 : 0.55 }}
          >
            <LinearGradient colors={["#F59E0B", "#F97316"]} style={styles.cta}>
              <Text style={styles.ctaLabel}>Back to Profile</Text>
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
  heading: { marginBottom: 24, alignItems: "center" },
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  title: { color: "rgba(255,255,255,0.92)", fontSize: 19, fontWeight: "900" },
  desc: {
    marginTop: 10,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 21,
    fontSize: 14,
    textAlign: "center",
  },
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
  freePlan: { color: "rgba(255,255,255,0.82)", fontSize: 14 },
  until: {
    marginTop: 12,
    marginBottom: 10,
    color: "rgba(255,255,255,0.76)",
    fontSize: 12,
    textAlign: "center",
  },
  untilStrong: { color: "rgba(255,255,255,0.92)", fontWeight: "900" },
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
