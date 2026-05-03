/**
 * Web `app/mobile/plan-status/page.tsx` に相当。
 */
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import MobilePageShell from "./MobilePageShell";

type PlanType = "monthly" | "annual" | null;

type Props = {
  language: "ja" | "en";
  uid: string | undefined;
  onClose: () => void;
  /** Free のとき Pro 申込画面へ */
  onUpgrade: () => void;
  /** Web のプラン変更・解約（ブラウザ） */
  apiBase: string | null;
  onOpenWebPath: (path: string) => void;
};

export default function MobilePlanStatusScreen({
  language,
  uid,
  onClose,
  onUpgrade,
  apiBase,
  onOpenWebPath,
}: Props) {
  const isJa = language === "ja";
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [planType, setPlanType] = useState<PlanType>(null);
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
        setPlanType((data.planType as PlanType) ?? null);
        const pu = data.proUntil as { toDate?: () => Date } | undefined;
        setProUntil(pu && typeof pu.toDate === "function" ? pu.toDate() : null);
        const ps = data.planStartDate as { toDate?: () => Date } | undefined;
        setPlanStart(ps && typeof ps.toDate === "function" ? ps.toDate() : null);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [uid]);

  const formatDate = (d: Date | null) =>
    d ? d.toLocaleDateString(isJa ? "ja-JP" : "en-US") : null;

  const title = isJa ? "プランの確認" : "Plan Status";

  if (loading) {
    return (
      <MobilePageShell title={title} onClose={onClose}>
        <View style={styles.center}>
          <Text style={styles.muted}>{isJa ? "読み込み中…" : "Loading..."}</Text>
        </View>
      </MobilePageShell>
    );
  }

  return (
    <MobilePageShell title={title} onClose={onClose}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <View style={styles.logoRow}>
            <Image
              source={require("../../../../assets/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            {plan === "pro" && planStart ? (
              <Text style={styles.started}>
                {isJa ? `開始日: ${formatDate(planStart)}` : `Started on ${formatDate(planStart)}`}
              </Text>
            ) : null}
          </View>

          <Text style={styles.planTitle}>
            {plan === "free"
              ? isJa
                ? "Free Plan"
                : "Free Plan"
              : isJa
                ? "Pro Plan"
                : "Pro Plan"}
            {plan === "pro" && planType ? (
              <Text style={styles.planSub}>
                {planType === "annual"
                  ? isJa
                    ? " 年額"
                    : " Yearly"
                  : isJa
                    ? " 月額"
                    : " Monthly"}
              </Text>
            ) : null}
          </Text>

          <Text style={styles.billing}>
            {isJa
              ? `次回更新日：${plan === "pro" && proUntil ? formatDate(proUntil) : "-----"}`
              : `Next billing date: ${plan === "pro" && proUntil ? formatDate(proUntil) : "-----"}`}
          </Text>

          <View style={styles.divider} />

          {plan === "free" ? (
            <Pressable onPress={onUpgrade} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
              <LinearGradient
                colors={["#22d3ee", "#3b82f6"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>{isJa ? "Pro にアップグレード" : "Upgrade to Pro"}</Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <View style={styles.row2}>
              <Pressable
                onPress={() => {
                  if (apiBase) onOpenWebPath("/mobile/plan-change");
                }}
                style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.9 : 1 }]}
              >
                <LinearGradient
                  colors={["#F59E0B", "#F97316"]}
                  style={styles.ctaHalf}
                >
                  <Text style={styles.ctaText}>{isJa ? "プラン変更" : "Change Plan"}</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (apiBase) onOpenWebPath("/mobile/cancel-plan");
                }}
                style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.9 : 1 }]}
              >
                <Text style={styles.cancelText}>{isJa ? "解約" : "Cancel"}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "rgba(248,250,252,0.55)", fontSize: 14 },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  logo: { width: 40, height: 40, opacity: 0.95 },
  started: { fontSize: 11, color: "rgba(248,250,252,0.5)", flex: 1 },
  planTitle: { fontSize: 24, fontWeight: "900", color: "#fff" },
  planSub: { fontSize: 18, fontWeight: "600", color: "rgba(255,255,255,0.4)" },
  billing: { marginTop: 8, fontSize: 14, color: "rgba(248,250,252,0.7)" },
  divider: { marginVertical: 22, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" },
  cta: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  row2: { flexDirection: "row", gap: 10 },
  ctaHalf: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.45)",
  },
  cancelText: { fontSize: 16, fontWeight: "800", color: "#f87171" },
});
