/**
 * Web `app/mobile/pro/subscribe/page.tsx` に相当。
 * プラン: Weekly / Monthly / Season Pass（docs/pro-billing-design.md）
 */
import { useState } from "react";
import { cyberAlert } from "../../../components/cyberAlert";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MobilePageShell from "./MobilePageShell";
import { useNativeIap } from "../../billing/useNativeIap";
import {
  IAP_FALLBACK_PRICE_JA,
  IAP_PRODUCT_IDS,
  type ProIapPlan,
} from "../../billing/iapProductIds";

const PLANS: readonly {
  id: ProIapPlan;
  titleJa: string;
  titleEn: string;
  periodJa: string;
  periodEn: string;
  badgeJa?: string;
  badgeEn?: string;
  noteJa: string;
  noteEn: string;
}[] = [
  {
    id: "weekly",
    titleJa: "Weekly",
    titleEn: "Weekly",
    periodJa: "/ 週",
    periodEn: "/ week",
    badgeJa: "7日無料",
    badgeEn: "7-day free",
    noteJa: "月次レポートなし",
    noteEn: "No monthly report",
  },
  {
    id: "monthly",
    titleJa: "Monthly",
    titleEn: "Monthly",
    periodJa: "/ 月",
    periodEn: "/ month",
    badgeJa: "おすすめ",
    badgeEn: "Popular",
    noteJa: "週次・月次レポート",
    noteEn: "Weekly + monthly reports",
  },
  {
    id: "season",
    titleJa: "Season Pass",
    titleEn: "Season Pass",
    periodJa: "/ シーズン",
    periodEn: "/ season",
    badgeJa: "買い切り",
    badgeEn: "One-time",
    noteJa: "自動更新なし・返金なし",
    noteEn: "No auto-renew / no refund",
  },
];

const FEATURES_JA = [
  "PRO INSIGHT（試合の重要結論 3〜5）",
  "試合直前アラート",
  "週次レポート",
  "月次レポート（Monthly / Season）",
  "My Rank Pro（TOP%・進捗）",
  "Pro バッジ",
  "Pro Skin",
];

const FEATURES_EN = [
  "PRO INSIGHT (3–5 key takeaways)",
  "Pre-tipoff alerts",
  "Weekly report",
  "Monthly report (Monthly / Season)",
  "My Rank Pro (TOP% & progress)",
  "Pro badge",
  "Pro Skin",
];

function catalogPriceLabel(products: unknown[], productId: string, fallback: string): string {
  const item = products.find(
    (p) => typeof p === "object" && p != null && (p as { productId?: string }).productId === productId
  ) as Record<string, unknown> | undefined;
  if (!item) return fallback;
  const price =
    (typeof item.localizedPrice === "string" && item.localizedPrice) ||
    (typeof item.price === "string" && item.price) ||
    null;
  return price ?? fallback;
}

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  onSuccess?: (plan: ProIapPlan) => void;
  onOpenPreview?: () => void;
};

export default function MobileProSubscribeScreen({
  language,
  onClose,
  onSuccess,
  onOpenPreview,
}: Props) {
  const isJa = language === "ja";
  const [plan, setPlan] = useState<ProIapPlan>("monthly");
  const features = isJa ? FEATURES_JA : FEATURES_EN;
  const { ready, products, purchasing, purchase, restore } = useNativeIap();

  async function handlePurchase() {
    const ok = await purchase(plan);
    if (ok) {
      cyberAlert(isJa ? "完了" : "Success", isJa ? "Pro プランが有効になりました。" : "Pro plan activated.");
      onSuccess?.(plan);
    }
  }

  const ctaLabel = (() => {
    if (purchasing) return isJa ? "処理中..." : "Processing...";
    if (plan === "weekly") {
      return isJa ? "7日間無料で試す（Weekly）" : "Start 7-day free (Weekly)";
    }
    if (plan === "monthly") {
      return isJa ? "7日間無料で試す（Monthly）" : "Start 7-day free (Monthly)";
    }
    return isJa ? "Season Pass を購入" : "Buy Season Pass";
  })();

  return (
    <MobilePageShell title={isJa ? "Pro プラン" : "Get Pro"} appBackground onClose={onClose}>
      <ScrollView contentContainerStyle={styles.pad}>
        <View style={styles.cardShell}>
          <View style={styles.heroIcon}>
            <Image
              source={require("../../../../assets/icon.png")}
              style={styles.heroImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.h1}>Get Pro</Text>
          <Text style={styles.lead}>
            {isJa
              ? "予想を助け、自分を分析し、課金者として目立てる。"
              : "Better picks, clearer self-analysis, and Pro status that shows."}
          </Text>

          <View style={styles.grid}>
            {PLANS.map((p) => {
              const on = plan === p.id;
              const price = catalogPriceLabel(
                products,
                IAP_PRODUCT_IDS[p.id],
                IAP_FALLBACK_PRICE_JA[p.id]
              );
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPlan(p.id)}
                  style={[styles.priceCard, on ? styles.priceCardOn : styles.priceCardOff]}
                >
                  {p.badgeJa ? (
                    <View style={[styles.badge, on ? styles.badgeOn : styles.badgeOff]}>
                      <Text style={[styles.badgeTxt, on && styles.badgeTxtOn]}>
                        {isJa ? p.badgeJa : p.badgeEn}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={[styles.priceTitle, on && styles.priceTitleOn]}>
                    {isJa ? p.titleJa : p.titleEn}
                  </Text>
                  <Text style={[styles.priceAmt, on && styles.priceAmtOn]}>
                    {price}
                    <Text style={[styles.period, on && styles.periodOn]}>
                      {" "}
                      {isJa ? p.periodJa : p.periodEn}
                    </Text>
                  </Text>
                  <Text style={[styles.tax, on && styles.taxOn]}>{isJa ? "税込み" : "tax incl."}</Text>
                  <Text style={[styles.note, on && styles.noteOn]}>
                    {isJa ? p.noteJa : p.noteEn}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.noteSmall}>
            {isJa
              ? "※ Season Pass は自動更新しません。途中解約の返金はありません。"
              : "Season Pass does not auto-renew. No mid-season refund."}
          </Text>

          <Pressable disabled={!ready || purchasing} onPress={handlePurchase} style={{ opacity: ready ? 1 : 0.85 }}>
            <LinearGradient
              colors={ready ? ["#22d3ee", "#2563eb"] : ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.08)"]}
              style={styles.cta}
            >
              <Text style={styles.ctaTxt}>{ctaLabel}</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => void restore()} style={styles.restoreBtn}>
            <Text style={styles.restoreTxt}>{isJa ? "購入を復元" : "Restore Purchases"}</Text>
          </Pressable>

          {onOpenPreview ? (
            <Pressable onPress={onOpenPreview} style={styles.previewBtn}>
              <Text style={styles.previewTxt}>
                {isJa ? "お試し導線のプレビュー" : "Preview trial flow"}
              </Text>
            </Pressable>
          ) : null}

          <Text style={styles.disclaimer}>
            {isJa
              ? "※ App Store / Google Play 経由の購入です"
              : "Purchases via App Store / Google Play."}
          </Text>

          <View style={{ marginTop: 16, gap: 10 }}>
            {features.map((text) => (
              <View key={text} style={styles.featRow}>
                <LinearGradient colors={["#3B82F6", "#22D3EE"]} style={styles.featCheck}>
                  <Text style={styles.featCheckTxt}>✓</Text>
                </LinearGradient>
                <Text style={styles.featTxt}>{text}</Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 22, gap: 8 }}>
            <Text style={styles.foot}>
              {isJa
                ? "※ Weekly / Monthly は自動更新されます。解約はストアの管理画面から。"
                : "Weekly / Monthly auto-renew. Cancel in the store subscription settings."}
            </Text>
            <Text style={styles.foot}>
              {isJa
                ? "※ 他人の予想は見せません。勝者は断言しません。"
                : "We never show others’ picks or declare winners."}
            </Text>
          </View>
        </View>
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingTop: 24, paddingBottom: 48 },
  cardShell: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#000",
    paddingHorizontal: 20,
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
    marginBottom: 12,
  },
  heroImg: { width: 32, height: 32 },
  h1: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
  },
  lead: {
    textAlign: "center",
    fontSize: 13,
    color: "rgba(248,250,252,0.65)",
    marginBottom: 18,
    lineHeight: 18,
  },
  grid: { gap: 10, marginBottom: 10 },
  priceCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  priceCardOn: { backgroundColor: "#fff", borderColor: "#fff" },
  priceCardOff: { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.2)" },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  badgeOn: { backgroundColor: "#facc15" },
  badgeOff: { backgroundColor: "rgba(250,204,21,0.2)" },
  badgeTxt: { fontSize: 10, fontWeight: "900", color: "rgba(250,204,21,0.95)" },
  badgeTxtOn: { color: "#000" },
  priceTitle: { fontWeight: "800", color: "#fff", fontSize: 15 },
  priceTitleOn: { color: "#000" },
  priceAmt: { fontSize: 22, fontWeight: "900", marginTop: 4, color: "#fff" },
  priceAmtOn: { color: "#000" },
  period: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.55)" },
  periodOn: { color: "rgba(0,0,0,0.5)" },
  tax: { fontSize: 10, opacity: 0.55, color: "#fff", marginTop: 2 },
  taxOn: { color: "rgba(0,0,0,0.55)" },
  note: { fontSize: 11, color: "rgba(248,250,252,0.55)", marginTop: 6 },
  noteOn: { color: "rgba(0,0,0,0.55)" },
  noteSmall: {
    fontSize: 11,
    color: "rgba(248,250,252,0.55)",
    textAlign: "center",
    marginBottom: 12,
  },
  cta: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginBottom: 10 },
  ctaTxt: { fontSize: 15, fontWeight: "800", color: "#fff" },
  restoreBtn: { alignItems: "center", paddingVertical: 8, marginBottom: 8 },
  restoreTxt: { fontSize: 13, color: "rgba(34,211,238,0.85)", fontWeight: "600" },
  previewBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(240,204,114,0.4)",
    borderRadius: 2,
  },
  previewTxt: { fontSize: 12, color: "rgba(240,204,114,0.9)", fontWeight: "700", letterSpacing: 0.6 },
  disclaimer: { fontSize: 11, color: "rgba(248,250,252,0.5)", textAlign: "center", marginBottom: 8 },
  featRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  featCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  featCheckTxt: { fontSize: 10, fontWeight: "900", color: "#000" },
  featTxt: { flex: 1, fontSize: 14, color: "rgba(248,250,252,0.85)", lineHeight: 20 },
  foot: { fontSize: 12, color: "rgba(248,250,252,0.6)", textAlign: "center", lineHeight: 18 },
});
