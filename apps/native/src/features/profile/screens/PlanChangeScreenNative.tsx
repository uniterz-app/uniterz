import { useEffect, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { doc, getDoc } from "firebase/firestore";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { db } from "../../../lib/firebase";
import type { ProfileStackParamList } from "../../../navigation/types";
import { colors, fonts } from "../../../theme/tokens";

function openSubscriptionManagement() {
  const url =
    Platform.OS === "ios"
      ? "https://apps.apple.com/account/subscriptions"
      : "https://play.google.com/store/account/subscriptions";
  void Linking.openURL(url);
}

export default function PlanChangeScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const [currentPlan, setCurrentPlan] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    if (!fUser) return;
    let alive = true;
    void (async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      if (!alive) return;
      const data = snap.data() as { planType?: unknown } | undefined;
      setCurrentPlan(data?.planType === "annual" ? "annual" : "monthly");
    })();
    return () => {
      alive = false;
    };
  }, [fUser]);

  const nextPlan = currentPlan === "monthly" ? "annual" : "monthly";

  return (
    <MobilePageShell title="プラン変更" appBackground onClose={() => navigation.goBack()}>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroText}>U</Text>
          </View>
          <Text style={styles.title}>プラン変更</Text>

          <View style={styles.currentBlock}>
            <Text style={styles.currentLabel}>現在のプラン</Text>
            <Text style={[styles.currentPlan, currentPlan === "monthly" ? styles.monthly : styles.annual]}>
              {currentPlan === "monthly" ? "月額プラン" : "年額プラン"}
            </Text>
          </View>

          <View style={styles.nextCard}>
            <Text style={styles.priceLabel}>Pro Plan</Text>
            <Text style={styles.priceTitle}>{nextPlan === "annual" ? "年額プラン" : "月額プラン"}</Text>
            <Text style={styles.priceAmt}>{nextPlan === "annual" ? "¥4,800" : "¥600"}</Text>
            <Text style={styles.tax}>
              {nextPlan === "annual" ? "税込み（4ヶ月お得）" : "税込み"}
            </Text>
          </View>
          <Text style={styles.hint}>実際の変更内容・請求日は次の画面で確認できます</Text>

        <Pressable
          onPress={() => {
            openSubscriptionManagement();
            navigation.navigate("PlanChangeComplete");
          }}
        >
            <LinearGradient colors={["#F59E0B", "#F97316"]} style={styles.cta}>
              <Text style={styles.ctaLabel}>
                {nextPlan === "annual" ? "年額プランへ変更" : "月額プランへ変更"}
              </Text>
            </LinearGradient>
        </Pressable>
          <View style={styles.notice}>
            <Text style={styles.noticeText}>※ プランは自動更新されます。</Text>
            <Text style={styles.noticeText}>
              ※ ダウングレードは現在の契約期間終了後に適用されます。
            </Text>
            <Text style={styles.noticeText}>※ 変更までの期間は現在のプランをご利用いただけます。</Text>
            <Text style={styles.noticeText}>※ ダウングレード時の返金はありません。</Text>
          </View>
        </View>
      </View>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16, justifyContent: "center" },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 10,
  },
  heroIcon: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroText: { color: colors.textPrimary, fontFamily: fonts.brand, fontSize: 36 },
  title: { color: "#fff", fontSize: 24, fontWeight: "900", textAlign: "center", marginBottom: 24 },
  currentBlock: { alignItems: "center", marginBottom: 22 },
  currentLabel: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  currentPlan: { fontSize: 24, fontWeight: "900" },
  monthly: { color: "#93c5fd" },
  annual: { color: "#4ade80" },
  nextCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    opacity: 0.85,
  },
  priceLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700", marginBottom: 6 },
  priceTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 8 },
  priceAmt: { color: "#fff", fontSize: 24, fontWeight: "900" },
  tax: { color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 2 },
  hint: { color: "rgba(255,255,255,0.6)", fontSize: 12, textAlign: "center", marginTop: 10, marginBottom: 16 },
  cta: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaLabel: { color: colors.textPrimary, fontWeight: "700" },
  notice: { marginTop: 20, gap: 5 },
  noticeText: { color: "rgba(255,255,255,0.6)", fontSize: 12, textAlign: "center", lineHeight: 18 },
});
