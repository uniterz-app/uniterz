/**
 * Web `app/mobile/plan-change/page.tsx` 相当
 */
import { useEffect, useMemo, useState } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, getDoc } from "firebase/firestore";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import PlanChamferPanelNative, {
  PlanSlantCtaNative,
} from "../mobileScreens/PlanChamferPanelNative";
import { CandleChartLoaderNative } from "../../../components/CandleChartLoaderNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { db } from "../../../lib/firebase";
import type { ProfileStackParamList } from "../../../navigation/types";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { fonts } from "../../../theme/tokens";
import ProCyberBadgeNative from "../kinetik/ProCyberBadgeNative";
import UniterzLogoNative from "../UniterzLogoNative";
import type { ProIapPlan } from "../../billing/iapProductIds";
import {
  asProIapPlan,
  changeEffectiveCopy,
  firestoreDate,
  formatPlanDate,
  normalizeStoredPlanType,
  periodEndLabel,
  planCatalogPrice,
  planDisplayNameFull,
  planPeriodLabel,
  suggestedChangeTarget,
  type StoredPlanType,
} from "../../billing/planChangeDisplay";

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
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [storedType, setStoredType] = useState<StoredPlanType | null>(null);
  const [proUntil, setProUntil] = useState<Date | null>(null);
  const [planStart, setPlanStart] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fUser) {
      setLoading(false);
      return;
    }
    let alive = true;
    void (async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      if (!alive) return;
      const data = snap.data() as Record<string, unknown> | undefined;
      if (data) {
        setPlan(data.plan === "pro" ? "pro" : "free");
        setStoredType(normalizeStoredPlanType(data.planType));
        setProUntil(firestoreDate(data.proUntil as { toDate?: () => Date } | Date | null));
        setPlanStart(
          firestoreDate(data.planStartDate as { toDate?: () => Date } | Date | null)
        );
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [fUser]);

  const currentPlan: ProIapPlan = asProIapPlan(storedType);
  const nextPlan = suggestedChangeTarget(currentPlan);
  const copy = useMemo(() => {
    if (!nextPlan) return null;
    return changeEffectiveCopy({
      from: currentPlan,
      to: nextPlan,
      periodEnd: proUntil,
      lang: "ja",
    });
  }, [currentPlan, nextPlan, proUntil]);

  if (loading) {
    return (
      <MobilePageShell
        title="CHANGE"
        subtitle="プランの変更手続きを行います。"
        appBackground
        onClose={() => navigation.goBack()}
      >
        <View style={styles.center}>
          <CandleChartLoaderNative label="読み込み中" />
        </View>
      </MobilePageShell>
    );
  }

  if (plan !== "pro") {
    return (
      <MobilePageShell
        title="CHANGE"
        subtitle="プランの変更手続きを行います。"
        appBackground
        onClose={() => navigation.goBack()}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomContentReserveY + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <PlanChamferPanelNative>
            <Text style={styles.hint}>Pro プラン加入後に変更できます。</Text>
            <PlanSlantCtaNative
              label="Pro にアップグレード"
              onPress={() => navigation.navigate("ProSubscribe")}
            />
          </PlanChamferPanelNative>
        </ScrollView>
      </MobilePageShell>
    );
  }

  return (
    <MobilePageShell
      title="CHANGE"
      subtitle="プランの変更手続きを行います。"
      appBackground
      onClose={() => navigation.goBack()}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomContentReserveY + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PlanChamferPanelNative>
          <View style={styles.hero}>
            <View style={styles.wordmark}>
              <UniterzLogoNative width={220} />
            </View>
            <ProCyberBadgeNative premium />
            <Text style={styles.title}>プラン変更</Text>
            {planStart ? (
              <Text style={styles.started}>開始日: {formatPlanDate(planStart, "ja")}</Text>
            ) : null}
          </View>

          <View style={styles.currentCard}>
            <Text style={styles.sectionLabel}>現在のプラン</Text>
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
              {planDisplayNameFull(storedType ?? currentPlan, "ja")}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceAmt}>{planCatalogPrice(currentPlan, "ja")}</Text>
              <Text style={styles.tax}>{planPeriodLabel(currentPlan, "ja")}・税込み</Text>
            </View>
            <Text style={styles.untilLine}>
              {periodEndLabel(currentPlan, "ja")}:{" "}
              <Text style={styles.untilStrong}>{formatPlanDate(proUntil, "ja")}</Text>
            </Text>
          </View>

          {nextPlan && copy ? (
            <>
              <View style={styles.nextCard}>
                <Text style={styles.sectionLabelAmber}>変更後のプラン</Text>
                <Text style={styles.priceTitle}>{planDisplayNameFull(nextPlan, "ja")}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceAmt}>{planCatalogPrice(nextPlan, "ja")}</Text>
                  <Text style={styles.tax}>{planPeriodLabel(nextPlan, "ja")}・税込み</Text>
                </View>
                <Text style={styles.nextCharge}>{copy.nextChargeLabel}</Text>
                <Text style={styles.timing}>
                  <Text style={styles.timingLabel}>{copy.timingLabel}: </Text>
                  {copy.timingDetail}
                </Text>
              </View>
              <Text style={styles.hint}>
                実際の変更内容・請求日はストアの管理画面で確認できます
              </Text>

              <PlanSlantCtaNative
                label={`${planDisplayNameFull(nextPlan, "ja")} へ変更（ストア）`}
                onPress={() => {
                  openSubscriptionManagement();
                  navigation.navigate("PlanChangeComplete");
                }}
              />
            </>
          ) : (
            <Text style={styles.hint}>
              Season Pass は買い切りのため、Weekly / Monthly への自動切替はありません。期間終了後に改めて購入してください。
            </Text>
          )}

          <View style={styles.notice}>
            <Text style={styles.noticeText}>※ Weekly / Monthly は自動更新されます。</Text>
            <Text style={styles.noticeText}>
              ※ ダウングレードは現在の契約期間終了後に適用されます。
            </Text>
            <Text style={styles.noticeText}>※ 変更までの期間は現在のプランをご利用いただけます。</Text>
            <Text style={styles.noticeText}>※ ダウングレード時の返金はありません。</Text>
          </View>
        </PlanChamferPanelNative>
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, flexGrow: 1 },
  hero: { alignItems: "center", marginBottom: 18 },
  wordmark: { marginBottom: 8 },
  title: {
    marginTop: 14,
    fontFamily: fonts.metric,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: "#fff",
  },
  started: { marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.45)" },
  currentCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 14,
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: fonts.metric,
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sectionLabelAmber: {
    fontFamily: fonts.metric,
    color: "rgba(251,191,36,0.75)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  currentPlan: {
    fontFamily: fonts.metric,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  weekly: { color: "#67e8f9" },
  monthly: { color: "#93c5fd" },
  season: { color: "#f0cc72" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 8 },
  priceAmt: {
    fontFamily: fonts.metric,
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  tax: {
    fontFamily: fonts.metric,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700",
  },
  untilLine: { color: "rgba(255,255,255,0.65)", fontSize: 13 },
  untilStrong: { color: "rgba(255,255,255,0.92)", fontWeight: "700" },
  nextCard: {
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.35)",
    backgroundColor: "rgba(252,211,77,0.05)",
    padding: 14,
  },
  priceTitle: {
    fontFamily: fonts.metric,
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  nextCharge: {
    fontFamily: fonts.metric,
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 8,
  },
  timing: { color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 18 },
  timingLabel: { color: "rgba(255,255,255,0.75)", fontWeight: "700" },
  hint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 14,
    lineHeight: 17,
  },
  notice: { marginTop: 18, gap: 5 },
  noticeText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
  },
});
