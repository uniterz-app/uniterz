/**
 * Web `app/mobile/pro/subscribe/page.tsx` に相当。
 */
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MobilePageShell from "./MobilePageShell";
import { useNativeIap } from "../../billing/useNativeIap";
import { IAP_PRODUCT_IDS } from "../../billing/iapProductIds";

type Plan = "monthly" | "annual";

function subscriptionPriceLabel(products: unknown[], productId: string, fallback: string): string {
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

const FEATURES_JA = [
  "データを基にしたレーダーチャート",
  "あなたの分析タイプ",
  "指標別パーセンタイル",
  "今月の傾向サマリー",
  "月間パフォーマンス比較（平均・上位ユーザー）",
  "Upsetデータ分析",
  "連勝・連敗記録",
  "Home / Away 分析",
  "Market傾向分析",
  "チーム別パフォーマンス",
  "月別パフォーマンス",
];

const FEATURES_EN = [
  "Radar charts from your data",
  "Your analysis type",
  "Per-metric percentiles",
  "This month’s trend summary",
  "Monthly performance vs average & top users",
  "Upset analytics",
  "Win / loss streak records",
  "Home / Away analysis",
  "Market trend analysis",
  "Per-team performance",
  "Monthly performance",
];

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  onSuccess?: (plan: Plan) => void;
};

export default function MobileProSubscribeScreen({ language, onClose, onSuccess }: Props) {
  const isJa = language === "ja";
  const [plan, setPlan] = useState<Plan>("monthly");
  const features = isJa ? FEATURES_JA : FEATURES_EN;
  const { ready, products, purchasing, purchase, restore } = useNativeIap();

  const monthlyPrice = subscriptionPriceLabel(products, IAP_PRODUCT_IDS.monthly, "¥600");
  const annualPrice = subscriptionPriceLabel(products, IAP_PRODUCT_IDS.annual, "¥4800");

  async function handlePurchase() {
    const ok = await purchase(plan);
    if (ok) {
      Alert.alert(isJa ? "完了" : "Success", isJa ? "Pro プランが有効になりました。" : "Pro plan activated.");
      onSuccess?.(plan);
    }
  }

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

        <View style={styles.grid}>
          <Pressable
            onPress={() => setPlan("monthly")}
            style={[
              styles.priceCard,
              plan === "monthly" ? styles.priceCardOn : styles.priceCardOff,
            ]}
          >
            <Text style={[styles.priceLabel, plan === "monthly" && styles.priceLabelOn]}>
              Pro Plan
            </Text>
            <View style={styles.priceRow}>
              <Text style={[styles.priceTitle, plan === "monthly" && styles.priceTitleOn]}>
                {isJa ? "月額" : "Monthly"}
              </Text>
              {plan === "monthly" ? (
                <View style={styles.check}>
                  <Text style={styles.checkTxt}>✓</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.priceAmt, plan === "monthly" && styles.priceAmtOn]}>{monthlyPrice}</Text>
            <Text style={[styles.tax, plan === "monthly" && styles.taxOn]}>{isJa ? "税込み" : "tax incl."}</Text>
          </Pressable>

          <Pressable
            onPress={() => setPlan("annual")}
            style={[
              styles.priceCard,
              plan === "annual" ? styles.priceCardOn : styles.priceCardOff,
            ]}
          >
            <Text style={[styles.priceLabel, plan === "annual" && styles.priceLabelOn]}>
              Pro Plan
            </Text>
            <View style={styles.priceRow}>
              <Text style={[styles.priceTitle, plan === "annual" && styles.priceTitleOn]}>
                {isJa ? "年額" : "Annual"}
              </Text>
              {plan === "annual" ? (
                <View style={styles.check}>
                  <Text style={styles.checkTxt}>✓</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.priceAmt, plan === "annual" && styles.priceAmtOn]}>{annualPrice}</Text>
            <Text style={[styles.tax, plan === "annual" && styles.taxOn]}>{isJa ? "税込み" : "tax incl."}</Text>
            <View style={styles.badgeSave}>
              <Text style={styles.badgeSaveTxt}>{isJa ? "4ヶ月お得" : "Save ~4 mo."}</Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.noteSmall}>
          {isJa
            ? "※ 年額プランは途中解約しても返金はありません（期間終了まで利用可）"
            : "Annual: no refund if you cancel early; Pro stays active until period end."}
        </Text>

        <Pressable disabled={!ready || purchasing} onPress={handlePurchase} style={{ opacity: ready ? 1 : 0.85 }}>
          <LinearGradient
            colors={ready ? ["#22d3ee", "#2563eb"] : ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.08)"]}
            style={styles.cta}
          >
            <Text style={styles.ctaTxt}>
              {purchasing
                ? isJa
                  ? "処理中..."
                  : "Processing..."
                : isJa
                  ? "Pro Planにアップグレード"
                  : "Upgrade to Pro"}
            </Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => void restore()} style={styles.restoreBtn}>
          <Text style={styles.restoreTxt}>{isJa ? "購入を復元" : "Restore Purchases"}</Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          {isJa
            ? "※ App Store / Google Play 経由のサブスクリプションです"
            : "Subscription via App Store / Google Play."}
        </Text>

        <Text style={styles.micro}>
          {isJa
            ? "※ 機能は順次追加・改善されます 月間データ：月初に集計・更新"
            : "Features improve over time. Monthly stats refresh at month start."}
        </Text>

        <View style={{ marginTop: 16, gap: 10 }}>
          {features.map((text) => (
            <View key={text} style={styles.featRow}>
              <LinearGradient
                colors={["#3B82F6", "#22D3EE"]}
                style={styles.featCheck}
              >
                <Text style={styles.featCheckTxt}>✓</Text>
              </LinearGradient>
              <Text style={styles.featTxt}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 22, gap: 8 }}>
          <Text style={styles.foot}>
            {isJa
              ? "※ プランは自動更新されます。解約はいつでも可能ですが、次回更新まで利用可能です。"
              : "Plans auto-renew. You can cancel anytime; access lasts until the renewal date."}
          </Text>
          <Text style={styles.foot}>
            {isJa ? "安全な外部決済サービスを利用しています。" : "Checkout uses a secure external payment provider."}
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
    marginBottom: 20,
  },
  grid: { flexDirection: "row", gap: 12, marginBottom: 10 },
  priceCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  priceCardOn: { backgroundColor: "#fff", borderColor: "#fff" },
  priceCardOff: { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.2)" },
  priceLabel: { fontSize: 11, fontWeight: "700", opacity: 0.55, color: "#fff" },
  priceLabelOn: { color: "rgba(0,0,0,0.55)" },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  priceTitle: { fontWeight: "800", color: "#fff" },
  priceTitleOn: { color: "#000" },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  checkTxt: { fontSize: 11, fontWeight: "900", color: "#000" },
  priceAmt: { fontSize: 22, fontWeight: "900", marginTop: 6, color: "#fff" },
  priceAmtOn: { color: "#000" },
  tax: { fontSize: 10, opacity: 0.55, color: "#fff", marginTop: 2 },
  taxOn: { color: "rgba(0,0,0,0.55)" },
  badgeSave: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#facc15",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeSaveTxt: { fontSize: 11, fontWeight: "900", color: "#000" },
  noteSmall: {
    fontSize: 11,
    color: "rgba(248,250,252,0.55)",
    textAlign: "center",
    marginBottom: 12,
  },
  cta: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginBottom: 10 },
  ctaTxt: { fontSize: 16, fontWeight: "800", color: "#fff" },
  restoreBtn: { alignItems: "center", paddingVertical: 8, marginBottom: 8 },
  restoreTxt: { fontSize: 13, color: "rgba(34,211,238,0.85)", fontWeight: "600" },
  disclaimer: { fontSize: 11, color: "rgba(248,250,252,0.5)", textAlign: "center", marginBottom: 8 },
  micro: { fontSize: 10, color: "rgba(248,250,252,0.4)", textAlign: "center", marginBottom: 8 },
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
