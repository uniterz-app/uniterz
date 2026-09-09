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
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
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
import {
  planChangeConfirmHint,
  planChangeCurrentLabel,
  planChangeFreeGateBody,
  planChangeNextLabel,
  planChangeNotices,
  planChangePageSubtitle,
  planChangeScreenTitle,
  planChangeSeasonPassNote,
  planChangeStartedLabel,
  planChangeSwitchCta,
  planChangeTaxSuffix,
  planChangeUpgradeCta,
  type PlanChangeUiLang,
} from "../../../../../../lib/pro/planChangeUiCopy";

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
  const { language } = useNativeUserLanguage(fUser?.uid ?? null);
  const lang: PlanChangeUiLang = language === "en" ? "en" : "ja";
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [storedType, setStoredType] = useState<StoredPlanType | null>(null);
  const [proUntil, setProUntil] = useState<Date | null>(null);
  const [planStart, setPlanStart] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const subtitle = planChangePageSubtitle(lang);
  const notices = planChangeNotices(lang);

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
      lang,
    });
  }, [currentPlan, nextPlan, proUntil, lang]);

  if (loading) {
    return (
      <MobilePageShell
        title="CHANGE"
        subtitle={subtitle}
        appBackground
        onClose={() => navigation.goBack()}
      >
        <View style={styles.center}>
          <CandleChartLoaderNative
            label={lang === "en" ? "Loading" : "読み込み中"}
          />
        </View>
      </MobilePageShell>
    );
  }

  if (plan !== "pro") {
    return (
      <MobilePageShell
        title="CHANGE"
        subtitle={subtitle}
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
            <Text style={styles.hint}>{planChangeFreeGateBody(lang)}</Text>
            <PlanSlantCtaNative
              label={planChangeUpgradeCta(lang)}
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
      subtitle={subtitle}
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
            <Text style={styles.title}>{planChangeScreenTitle(lang)}</Text>
            {planStart ? (
              <Text style={styles.started}>
                {planChangeStartedLabel(lang)}: {formatPlanDate(planStart, lang)}
              </Text>
            ) : null}
          </View>

          <View style={styles.currentCard}>
            <Text style={styles.sectionLabel}>
              {planChangeCurrentLabel(lang)}
            </Text>
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
              {planDisplayNameFull(storedType ?? currentPlan, lang)}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceAmt}>
                {planCatalogPrice(currentPlan, lang)}
              </Text>
              <Text style={styles.tax}>
                {planPeriodLabel(currentPlan, lang)}
                {planChangeTaxSuffix(lang)}
              </Text>
            </View>
            <Text style={styles.untilLine}>
              {periodEndLabel(currentPlan, lang)}:{" "}
              <Text style={styles.untilStrong}>
                {formatPlanDate(proUntil, lang)}
              </Text>
            </Text>
          </View>

          {nextPlan && copy ? (
            <>
              <View style={styles.nextCard}>
                <Text style={styles.sectionLabelAmber}>
                  {planChangeNextLabel(lang)}
                </Text>
                <Text style={styles.priceTitle}>
                  {planDisplayNameFull(nextPlan, lang)}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceAmt}>
                    {planCatalogPrice(nextPlan, lang)}
                  </Text>
                  <Text style={styles.tax}>
                    {planPeriodLabel(nextPlan, lang)}
                    {planChangeTaxSuffix(lang)}
                  </Text>
                </View>
                <Text style={styles.nextCharge}>{copy.nextChargeLabel}</Text>
                <Text style={styles.timing}>
                  <Text style={styles.timingLabel}>{copy.timingLabel}: </Text>
                  {copy.timingDetail}
                </Text>
              </View>
              <Text style={styles.hint}>
                {planChangeConfirmHint(lang, "store")}
              </Text>

              <PlanSlantCtaNative
                label={planChangeSwitchCta(
                  lang,
                  planDisplayNameFull(nextPlan, lang),
                  "store"
                )}
                onPress={() => {
                  openSubscriptionManagement();
                  navigation.navigate("PlanChangeComplete");
                }}
              />
            </>
          ) : (
            <Text style={styles.hint}>{planChangeSeasonPassNote(lang)}</Text>
          )}

          <View style={styles.notice}>
            {notices.map((line) => (
              <Text key={line} style={styles.noticeText}>
                {line}
              </Text>
            ))}
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
