/**
 * Web `app/mobile/plan-status/page.tsx` に相当。
 */
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CandleChartLoaderNative } from "../../../components/CandleChartLoaderNative";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import MobilePageShell from "./MobilePageShell";
import PlanChamferPanelNative, {
  PlanSlantCtaNative,
} from "./PlanChamferPanelNative";
import ProCyberBadgeNative from "../kinetik/ProCyberBadgeNative";
import UniterzLogoNative from "../UniterzLogoNative";
import { fonts } from "../../../theme/tokens";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import {
  asProIapPlan,
  firestoreDate,
  formatPlanDate,
  formatProTenureLabel,
  normalizeStoredPlanType,
  periodEndLabel,
  planCatalogPrice,
  planDisplayNameFull,
  planPeriodLabel,
  type StoredPlanType,
} from "../../billing/planChangeDisplay";

type Props = {
  language: "ja" | "en";
  uid: string | undefined;
  onClose: () => void;
  onUpgrade: () => void;
  apiBase: string | null;
  onNavigate?: (screen: "PlanChange" | "CancelPlan") => void;
};

export default function MobilePlanStatusScreen({
  language,
  uid,
  onClose,
  onUpgrade,
  onNavigate,
}: Props) {
  const isJa = language === "ja";
  const lang = isJa ? "ja" : "en";
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [planType, setPlanType] = useState<StoredPlanType | null>(null);
  const [proUntil, setProUntil] = useState<Date | null>(null);
  const [planStart, setPlanStart] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      if (!alive) return;
      if (snap.exists()) {
        const data = snap.data() as Record<string, unknown>;
        setPlan(data.plan === "pro" ? "pro" : "free");
        setPlanType(normalizeStoredPlanType(data.planType));
        setProUntil(
          firestoreDate(data.proUntil as { toDate?: () => Date } | Date | null)
        );
        setPlanStart(
          firestoreDate(data.planStartDate as { toDate?: () => Date } | Date | null)
        );
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [uid]);

  const planHelp = isJa
    ? "現在のプランと更新情報を確認できます。"
    : "Check your current plan and renewal details.";

  if (loading) {
    return (
      <MobilePageShell title="PLAN" subtitle={planHelp} appBackground onClose={onClose}>
        <View style={styles.center}>
          <CandleChartLoaderNative label={isJa ? "読み込み中" : "Loading"} />
        </View>
      </MobilePageShell>
    );
  }

  const currentIap = asProIapPlan(planType);
  const planLabel =
    plan === "free"
      ? "Free Plan"
      : planDisplayNameFull(planType ?? currentIap, lang);

  return (
    <MobilePageShell title="PLAN" subtitle={planHelp} appBackground onClose={onClose}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.wrap,
          { paddingBottom: bottomContentReserveY + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PlanChamferPanelNative>
          <View style={styles.badgeBlock}>
            <View style={styles.wordmark}>
              <UniterzLogoNative width={200} />
            </View>
            {plan === "pro" ? (
              <ProCyberBadgeNative premium />
            ) : (
              <View style={styles.freeMark}>
                <Text style={styles.freeMarkText}>U</Text>
              </View>
            )}
          </View>

          <Text style={styles.eyebrow}>
            {plan === "pro" ? "PRO PLAN" : "FREE PLAN"}
          </Text>
          <Text style={styles.planTitle}>{planLabel}</Text>

          {plan === "pro" && formatProTenureLabel(planStart, lang) ? (
            <Text style={styles.tenure}>{formatProTenureLabel(planStart, lang)}</Text>
          ) : null}

          {plan === "pro" ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceAmt}>{planCatalogPrice(currentIap, lang)}</Text>
              <Text style={styles.pricePeriod}>
                {planPeriodLabel(currentIap, lang)}
                {isJa ? "・税込み" : " · tax incl."}
              </Text>
            </View>
          ) : null}

          <View style={styles.metaBlock}>
            {plan === "pro" && planStart ? (
              <Text style={styles.metaLine}>
                {isJa ? "開始日" : "Started"}:{" "}
                <Text style={styles.billingStrong}>
                  {formatPlanDate(planStart, lang)}
                </Text>
              </Text>
            ) : null}
            <Text style={styles.billing}>
              {periodEndLabel(currentIap, lang)}:{" "}
              <Text style={styles.billingStrong}>
                {plan === "pro" && proUntil ? formatPlanDate(proUntil, lang) : "-----"}
              </Text>
            </Text>
          </View>

          <View style={styles.divider} />

          {plan === "free" ? (
            <PlanSlantCtaNative
              label={isJa ? "Pro にアップグレード" : "Upgrade to Pro"}
              onPress={onUpgrade}
            />
          ) : (
            <View style={styles.actions}>
              <PlanSlantCtaNative
                label={isJa ? "プラン変更" : "Change Plan"}
                onPress={() => onNavigate?.("PlanChange")}
              />
              <PlanSlantCtaNative
                label={isJa ? "解約" : "Cancel"}
                variant="danger"
                onPress={() => onNavigate?.("CancelPlan")}
              />
            </View>
          )}
        </PlanChamferPanelNative>
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexGrow: 1,
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  badgeBlock: { alignItems: "center", marginBottom: 10 },
  wordmark: { marginBottom: 8 },
  freeMark: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    backgroundColor: "rgba(0,245,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  freeMarkText: {
    color: "#CFFAFE",
    fontFamily: fonts.brand,
    fontSize: 28,
    fontStyle: "italic",
    fontWeight: "900",
  },
  eyebrow: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.7)",
    textAlign: "center",
  },
  planTitle: {
    marginTop: 6,
    fontFamily: fonts.metric,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#fff",
    textAlign: "center",
  },
  tenure: {
    marginTop: 8,
    fontFamily: fonts.metric,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "rgba(253,230,138,0.92)",
    textAlign: "center",
  },
  priceRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 6,
  },
  priceAmt: {
    fontFamily: fonts.metric,
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
  },
  pricePeriod: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
  },
  metaBlock: {
    marginTop: 12,
    gap: 4,
    alignItems: "center",
  },
  metaLine: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
  },
  billing: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },
  billingStrong: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "700",
  },
  divider: {
    marginVertical: 22,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  actions: { gap: 10 },
});
