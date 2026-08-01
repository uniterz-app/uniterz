/**
 * Web `ProSubscribePreview`（/mobile/pro-subscribe-preview）相当。
 * プラン選択 →（お試しモーダル）→ 模擬購入 → 成功画面。決済/IAP 未接続。
 */
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MobilePageShell from "./MobilePageShell";
import {
  PRO_SUBSCRIBE_PREVIEW_PLANS,
  proSubscribePreviewPlanById,
  type ProSubscribePreviewPlan,
  type ProSubscribePreviewPlanId,
} from "../../../../../../lib/pro/proSubscribePreviewPlans";

type Phase = "plans" | "purchasing" | "success";
type CheckoutKind = "trial" | "paid";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

const GOLD = "#f0cc72";
const GOLD_BRIGHT = "#e8f200";

function trialAvailableFor(planId: ProSubscribePreviewPlanId): boolean {
  return planId === "weekly" || planId === "monthly";
}

export default function ProSubscribePreviewNative({ language, onClose }: Props) {
  const ja = language === "ja";
  const [planId, setPlanId] = useState<ProSubscribePreviewPlanId>("monthly");
  const [phase, setPhase] = useState<Phase>("plans");
  const [checkoutKind, setCheckoutKind] = useState<CheckoutKind>("paid");
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const selected = proSubscribePreviewPlanById(planId);
  const trialAvailable = trialAvailableFor(planId);

  function startPaid() {
    if (phase === "purchasing") return;
    setCheckoutKind("paid");
    setPhase("purchasing");
    setTimeout(() => setPhase("success"), 900);
  }
  function confirmTrial() {
    setTrialModalOpen(false);
    setCheckoutKind("trial");
    setPhase("purchasing");
    setTimeout(() => setPhase("success"), 900);
  }
  function reset() {
    setPhase("plans");
    setCheckoutKind("paid");
    setTrialModalOpen(false);
  }

  const afterTrialPriceLine = ja
    ? planId === "weekly"
      ? "お試し後は週額 ¥280。期間中の解約で課金なし。"
      : "お試し後は月額 ¥780。期間中の解約で課金なし。"
    : planId === "weekly"
      ? "Then ¥280/week. Cancel during trial — no charge."
      : "Then ¥780/month. Cancel during trial — no charge.";

  return (
    <MobilePageShell title={ja ? "Pro プラン" : "Get Pro"} appBackground onClose={onClose}>
      <ScrollView contentContainerStyle={styles.pad}>
        {phase === "success" ? (
          <SuccessPanel
            ja={ja}
            planId={planId}
            planLabel={ja ? selected.labelJa : selected.labelEn}
            price={ja ? selected.priceJa : selected.priceEn}
            period={ja ? selected.periodJa : selected.periodEn}
            trial={checkoutKind === "trial"}
            onAgain={reset}
          />
        ) : (
          <View style={styles.card}>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
            <Text style={styles.h1}>Get Pro</Text>
            <Text style={styles.lead}>
              {ja
                ? "プランを選んで、できることと価格を確認。プレビューでは購入／お試しをシミュレートします。"
                : "Pick a plan, review perks & price. Preview simulates purchase / trial."}
            </Text>

            <View style={styles.plansRow}>
              {PRO_SUBSCRIBE_PREVIEW_PLANS.map((plan) => {
                const on = planId === plan.id;
                const highlight = plan.recommended || plan.badgeJa === "7日無料";
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => setPlanId(plan.id)}
                    style={[styles.planCard, on ? styles.planCardOn : styles.planCardOff]}
                  >
                    {plan.badgeJa || plan.recommended ? (
                      <View
                        style={[
                          styles.planBadge,
                          highlight ? styles.planBadgeGold : styles.planBadgeMuted,
                        ]}
                      >
                        <Text style={highlight ? styles.planBadgeGoldText : styles.planBadgeMutedText}>
                          {ja ? plan.badgeJa : plan.badgeEn}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={[styles.planLabel, on && styles.planLabelOn]}>
                      {ja ? plan.labelJa : plan.labelEn}
                    </Text>
                    <Text style={[styles.planPrice, on && styles.planPriceOn]}>
                      {ja ? plan.priceJa : plan.priceEn}
                      <Text style={styles.planPeriod}> {ja ? plan.periodJa : plan.periodEn}</Text>
                    </Text>
                    <Text style={styles.planBlurb}>{ja ? plan.blurbJa : plan.blurbEn}</Text>
                    {on ? (
                      <View style={styles.planCheck}>
                        <Text style={styles.planCheckText}>✓</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.includedBox}>
              <Text style={styles.includedTitle}>{ja ? "このプランでできること" : "Included"}</Text>
              {selected.features.map((f) => (
                <View key={f.titleEn} style={styles.featureRow}>
                  <View style={styles.featureDot} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.featureTitle}>{ja ? f.titleJa : f.titleEn}</Text>
                    <Text style={styles.featureDetail}>{ja ? f.detailJa : f.detailEn}</Text>
                  </View>
                </View>
              ))}
            </View>

            {trialAvailable ? (
              <View style={styles.ctaWrap}>
                <Pressable
                  disabled={phase === "purchasing"}
                  onPress={() => setTrialModalOpen(true)}
                  style={[styles.primaryBtn, phase === "purchasing" && styles.primaryBtnDisabled]}
                >
                  <Text style={styles.primaryBtnText}>
                    {phase === "purchasing"
                      ? ja
                        ? "処理中…"
                        : "Processing…"
                      : ja
                        ? "7日間無料で試す"
                        : "Start 7-day free trial"}
                  </Text>
                </Pressable>
                <Text style={styles.afterTrial}>{afterTrialPriceLine}</Text>
                <Pressable disabled={phase === "purchasing"} onPress={startPaid} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>
                    {ja
                      ? `お試しなしで${selected.labelJa}を購入`
                      : `Buy ${selected.labelEn} (no trial)`}
                  </Text>
                </Pressable>
                <Text style={styles.micro}>
                  {ja
                    ? "※ 初回のみ。iOS は App Store のサブスク管理から解約できます。プレビューでは決済しません。"
                    : "※ First time only. On iOS, cancel in App Store subscriptions. Preview does not charge."}
                </Text>
              </View>
            ) : (
              <View style={styles.ctaWrap}>
                <Pressable
                  disabled={phase === "purchasing"}
                  onPress={startPaid}
                  style={[styles.primaryBtn, phase === "purchasing" && styles.primaryBtnDisabled]}
                >
                  <Text style={styles.primaryBtnText}>
                    {phase === "purchasing"
                      ? ja
                        ? "処理中…"
                        : "Processing…"
                      : ja
                        ? `${selected.labelJa} を購入（プレビュー）`
                        : `Buy ${selected.labelEn} (preview)`}
                  </Text>
                </Pressable>
                <Text style={styles.micro}>
                  {ja
                    ? "※ 7日無料は Weekly / Monthly のみ。価格・特典は仮。決済は走りません。"
                    : "※ 7-day trial is Weekly / Monthly only. Prices are draft. No real charge."}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={trialModalOpen} transparent animationType="fade" onRequestClose={() => setTrialModalOpen(false)}>
        <TrialExplainModal
          ja={ja}
          plan={selected}
          onClose={() => setTrialModalOpen(false)}
          onConfirm={confirmTrial}
        />
      </Modal>
    </MobilePageShell>
  );
}

function TrialExplainModal({
  ja,
  plan,
  onClose,
  onConfirm,
}: {
  ja: boolean;
  plan: ProSubscribePreviewPlan;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const afterPrice = ja ? `${plan.priceJa}${plan.periodJa}` : `${plan.priceEn}${plan.periodEn}`;
  const points = ja
    ? [
        "7日間無料で Pro を試せます。",
        "期間中に解約すれば、お金はかかりません。",
        `解約しなければ、自動で有料の ${plan.labelJa}（${afterPrice}）に切り替わります。`,
        "Weekly と Monthly の変更は、いつでもできます。",
      ]
    : [
        "Try Pro free for 7 days.",
        "Cancel during the trial and you won’t be charged.",
        `Unless you cancel, it switches to paid ${plan.labelEn} (${afterPrice}).`,
        "You can switch Weekly ⇔ Monthly anytime.",
      ];

  return (
    <View style={styles.modalBackdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>{ja ? "お試しの前に" : "Before you start"}</Text>
        <Text style={styles.modalSub}>
          {ja ? `選択中: ${plan.labelJa} · 7日間無料` : `Selected: ${plan.labelEn} · 7-day free`}
        </Text>
        <View style={styles.modalPoints}>
          {points.map((text) => (
            <View key={text} style={styles.modalPointRow}>
              <View style={styles.modalPointDot} />
              <Text style={styles.modalPointText}>{text}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={onConfirm} style={styles.modalConfirm}>
          <Text style={styles.modalConfirmText}>OK · GET PRO</Text>
        </Pressable>
        <Pressable onPress={onClose} style={styles.modalBack}>
          <Text style={styles.modalBackText}>{ja ? "もどる" : "Back"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function SuccessPanel({
  ja,
  planId,
  planLabel,
  price,
  period,
  trial,
  onAgain,
}: {
  ja: boolean;
  planId: ProSubscribePreviewPlanId;
  planLabel: string;
  price: string;
  period: string;
  trial: boolean;
  onAgain: () => void;
}) {
  const started = new Date().toLocaleDateString(ja ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const end = new Date();
  end.setDate(end.getDate() + 7);
  const trialEndLabel = end.toLocaleDateString(ja ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const title = trial ? (ja ? "Pro お試し開始" : "Pro trial started") : "Upgrade to Pro";
  const statusLine = trial
    ? `PRO // 7DAY_TRIAL // ${planLabel.toUpperCase()}`
    : `PRO // ACTIVE // ${planLabel.toUpperCase()}`;

  return (
    <View style={styles.successWrap}>
      <View style={styles.successHead}>
        <View style={styles.successCheck}>
          <Text style={styles.successCheckText}>✓</Text>
        </View>
        <Text style={styles.successTitle}>{title}</Text>
      </View>

      <View style={styles.successFrameOuter}>
        <View style={styles.successPlate} />
        <View style={styles.successCard}>
          <View style={styles.successStrip}>
            <View style={{ flex: 1 }}>
              <Text style={styles.successStripEyebrow}>
                {trial ? "TRIAL_CONFIRMED // TYPE: PRO" : "UPGRADE_CONFIRMED // TYPE: PRO"}
              </Text>
              <Text style={styles.successStripTitle}>{trial ? "TRIAL ON" : "PRO ON"}</Text>
            </View>
            <View style={styles.successStripMeta}>
              <Text style={styles.successStripMetaText}>PLAN: {planLabel.toUpperCase()}</Text>
              <Text style={styles.successStripMetaText}>{trial ? "AUTH: TRIAL" : "AUTH: PAID"}</Text>
            </View>
          </View>

          <View style={styles.successBody}>
            <View style={styles.successBadgeBox}>
              <View style={styles.proBadgeSm}>
                <Text style={styles.proBadgeSmText}>PRO</Text>
              </View>
              <Text style={styles.successBrand}>UNITERZ</Text>
              <View style={styles.successHair} />
              <Text style={styles.successStatus}>{statusLine}</Text>
              <Text style={styles.successPrice}>
                {trial ? (ja ? "無料 → その後 " : "FREE → THEN ") : ""}
                {price}
                {trial ? period : ""}
              </Text>
            </View>

            <View style={styles.successMeta}>
              {trial ? (
                <>
                  <MetaRow label="START" value={started} />
                  <MetaRow label="ENDS" value={trialEndLabel} />
                  <MetaRow label="CHARGE" value={ja ? "期間中解約で課金なし" : "Cancel in trial = ¥0"} />
                </>
              ) : (
                <>
                  <MetaRow label="START" value={started} />
                  <MetaRow label="PLAN_ID" value={planId} />
                </>
              )}
            </View>

            <Pressable style={styles.successPrimary}>
              <Text style={styles.successPrimaryText}>{ja ? "Pro データを見る" : "View Pro data"}</Text>
            </Pressable>
            <Pressable onPress={onAgain} style={styles.successSecondary}>
              <Text style={styles.successSecondaryText}>{ja ? "プラン選択に戻る" : "Back to plans"}</Text>
            </Pressable>
            <Text style={styles.successLog}>SYS_LOG · PREVIEW_MOCK · NO_CHARGE</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const OX = "Oxanium_700Bold";

const styles = StyleSheet.create({
  pad: { padding: 16, paddingTop: 20, paddingBottom: 48 },
  card: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.28)",
    backgroundColor: "rgba(10,11,16,0.98)",
    paddingHorizontal: 16,
    paddingVertical: 22,
  },
  proBadge: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 12,
  },
  proBadgeText: { color: GOLD, fontFamily: OX, fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  h1: {
    textAlign: "center",
    fontFamily: OX,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#fff",
    textTransform: "uppercase",
  },
  lead: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.5)",
  },
  plansRow: { marginTop: 16, gap: 10 },
  planCard: {
    borderRadius: 2,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  planCardOn: {
    borderColor: "rgba(252,211,77,0.7)",
    backgroundColor: "rgba(252,211,77,0.12)",
  },
  planCardOff: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  planBadge: {
    position: "absolute",
    right: 8,
    top: 8,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  planBadgeGold: { backgroundColor: "#fcd34d" },
  planBadgeMuted: { borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(0,0,0,0.4)" },
  planBadgeGoldText: { color: "#120e08", fontFamily: OX, fontSize: 8, fontWeight: "800", letterSpacing: 0.6 },
  planBadgeMutedText: { color: "rgba(255,255,255,0.7)", fontFamily: OX, fontSize: 8, fontWeight: "800" },
  planLabel: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  planLabelOn: { color: "rgba(254,243,199,0.9)" },
  planPrice: {
    marginTop: 6,
    fontFamily: OX,
    fontSize: 22,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    fontVariant: ["tabular-nums"],
  },
  planPriceOn: { color: "#fff" },
  planPeriod: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.45)" },
  planBlurb: { marginTop: 6, fontSize: 11, lineHeight: 15, color: "rgba(255,255,255,0.45)" },
  planCheck: {
    marginTop: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fcd34d",
    alignItems: "center",
    justifyContent: "center",
  },
  planCheckText: { color: "#120e08", fontFamily: OX, fontSize: 11, fontWeight: "900" },
  includedBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  includedTitle: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    color: "rgba(253,224,71,0.75)",
    textTransform: "uppercase",
  },
  featureRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  featureDot: {
    marginTop: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fcd34d",
  },
  featureTitle: { fontFamily: OX, fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.9)" },
  featureDetail: { marginTop: 2, fontSize: 11, lineHeight: 15, color: "rgba(255,255,255,0.5)" },
  ctaWrap: { marginTop: 18, gap: 8 },
  primaryBtn: {
    borderRadius: 2,
    backgroundColor: "#fcd34d",
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnDisabled: { backgroundColor: "rgba(255,255,255,0.1)" },
  primaryBtnText: {
    color: "#120e08",
    fontFamily: OX,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  afterTrial: { textAlign: "center", fontSize: 11, lineHeight: 16, color: "rgba(255,255,255,0.5)" },
  secondaryBtn: { paddingVertical: 8, alignItems: "center" },
  secondaryBtnText: {
    color: "rgba(255,255,255,0.45)",
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  micro: { textAlign: "center", fontSize: 10, lineHeight: 15, color: "rgba(255,255,255,0.35)" },

  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.35)",
    backgroundColor: "rgba(14,14,18,0.99)",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalTitle: {
    textAlign: "center",
    fontFamily: OX,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#fff",
    textTransform: "uppercase",
  },
  modalSub: { marginTop: 8, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.5)" },
  modalPoints: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  modalPointRow: { flexDirection: "row", gap: 10 },
  modalPointDot: { marginTop: 7, width: 6, height: 6, borderRadius: 3, backgroundColor: "#fcd34d" },
  modalPointText: { flex: 1, fontSize: 13, lineHeight: 19, color: "rgba(255,255,255,0.8)" },
  modalConfirm: {
    marginTop: 16,
    borderRadius: 2,
    backgroundColor: "#fcd34d",
    paddingVertical: 12,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#120e08",
    fontFamily: OX,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  modalBack: { marginTop: 8, paddingVertical: 8, alignItems: "center" },
  modalBackText: {
    color: "rgba(255,255,255,0.4)",
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  successWrap: { alignItems: "center", paddingVertical: 8 },
  successHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  successCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  successCheckText: { color: "#120e08", fontFamily: OX, fontSize: 13, fontWeight: "900" },
  successTitle: {
    fontFamily: OX,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#fff",
    textTransform: "uppercase",
  },
  successFrameOuter: {
    width: "100%",
    maxWidth: 360,
    paddingTop: 8,
    paddingLeft: 8,
    paddingRight: 7,
    paddingBottom: 7,
    position: "relative",
  },
  successPlate: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 0,
    bottom: 0,
    backgroundColor: GOLD_BRIGHT,
  },
  successCard: {
    borderWidth: 2.5,
    borderColor: "#fff",
    backgroundColor: "#050505",
  },
  successStrip: {
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 2.5,
    borderBottomColor: "#fff",
    backgroundColor: "#fff",
  },
  successStripEyebrow: {
    paddingHorizontal: 12,
    paddingTop: 10,
    fontFamily: OX,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(0,0,0,0.55)",
  },
  successStripTitle: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    marginTop: 2,
    fontFamily: OX,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#000",
  },
  successStripMeta: {
    justifyContent: "center",
    borderLeftWidth: 2.5,
    borderLeftColor: "rgba(0,0,0,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  successStripMetaText: {
    fontFamily: OX,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(0,0,0,0.7)",
    textAlign: "right",
  },
  successBody: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 12 },
  successBadgeBox: {
    alignSelf: "center",
    maxWidth: 240,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 12,
    paddingVertical: 18,
  },
  proBadgeSm: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  proBadgeSmText: { color: GOLD, fontFamily: OX, fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  successBrand: {
    fontFamily: OX,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 4,
    color: "#fff",
  },
  successHair: { height: 1, width: 56, backgroundColor: GOLD_BRIGHT },
  successStatus: {
    textAlign: "center",
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.75)",
  },
  successPrice: {
    fontFamily: OX,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    color: GOLD_BRIGHT,
    fontVariant: ["tabular-nums"],
  },
  successMeta: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(232,242,0,0.35)",
    paddingTop: 12,
    gap: 6,
  },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 },
  metaLabel: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.4)",
  },
  metaValue: {
    flex: 1,
    textAlign: "right",
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: GOLD_BRIGHT,
    textTransform: "uppercase",
  },
  successPrimary: {
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#fff",
    paddingVertical: 12,
    alignItems: "center",
  },
  successPrimaryText: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#fff",
    textTransform: "uppercase",
  },
  successSecondary: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    paddingVertical: 10,
    alignItems: "center",
  },
  successSecondaryText: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
  },
  successLog: {
    marginTop: 10,
    textAlign: "center",
    fontFamily: OX,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.3)",
  },
});
