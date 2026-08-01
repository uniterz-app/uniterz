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
import {
  IAP_FALLBACK_PRICE_JA,
  proPlanDisplayName,
  type ProIapPlan,
} from "../../billing/iapProductIds";

function openSubscriptionManagement() {
  const url =
    Platform.OS === "ios"
      ? "https://apps.apple.com/account/subscriptions"
      : "https://play.google.com/store/account/subscriptions";
  void Linking.openURL(url);
}

function parsePlanType(value: unknown): ProIapPlan {
  if (value === "weekly" || value === "season" || value === "monthly") return value;
  if (value === "annual") return "monthly";
  return "monthly";
}

export default function PlanChangeScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const [currentPlan, setCurrentPlan] = useState<ProIapPlan>("monthly");

  useEffect(() => {
    if (!fUser) return;
    let alive = true;
    void (async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      if (!alive) return;
      const data = snap.data() as { planType?: unknown } | undefined;
      setCurrentPlan(parsePlanType(data?.planType));
    })();
    return () => {
      alive = false;
    };
  }, [fUser]);

  const isSeason = currentPlan === "season";
  const nextPlan: ProIapPlan =
    currentPlan === "weekly" ? "monthly" : currentPlan === "monthly" ? "weekly" : "monthly";

  return (
    <MobilePageShell
      title="CHANGE"
      subtitle="プランの変更手続きを行います。"
      appBackground
      onClose={() => navigation.goBack()}
    >
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroText}>U</Text>
          </View>
          <Text style={styles.title}>プラン変更</Text>

          <View style={styles.currentBlock}>
            <Text style={styles.currentLabel}>現在のプラン</Text>
            <Text
              style={[
                styles.currentPlan,
                currentPlan === "weekly"
                  ? styles.weekly
                  : currentPlan === "season"
                    ? styles.season
                    : styles.monthly,
              ]}
            >
              {proPlanDisplayName(currentPlan, "ja")}
            </Text>
          </View>

          {isSeason ? (
            <Text style={styles.hint}>
              Season Pass は買い切りのため、Weekly / Monthly への自動切替はありません。期間終了後に改めて購入してください。
            </Text>
          ) : (
            <>
              <View style={styles.nextCard}>
                <Text style={styles.priceLabel}>Pro Plan</Text>
                <Text style={styles.priceTitle}>{proPlanDisplayName(nextPlan, "ja")}</Text>
                <Text style={styles.priceAmt}>{IAP_FALLBACK_PRICE_JA[nextPlan]}</Text>
                <Text style={styles.tax}>税込み</Text>
              </View>
              <Text style={styles.hint}>実際の変更内容・請求日はストアの管理画面で確認できます</Text>

              <Pressable
                onPress={() => {
                  openSubscriptionManagement();
                  navigation.navigate("PlanChangeComplete");
                }}
              >
                <LinearGradient colors={["#F59E0B", "#F97316"]} style={styles.cta}>
                  <Text style={styles.ctaLabel}>
                    {proPlanDisplayName(nextPlan, "ja")} へ変更（ストア）
                  </Text>
                </LinearGradient>
              </Pressable>
            </>
          )}

          <View style={styles.notice}>
            <Text style={styles.noticeText}>※ Weekly / Monthly は自動更新されます。</Text>
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
  weekly: { color: "#67e8f9" },
  monthly: { color: "#93c5fd" },
  season: { color: "#f0cc72" },
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
