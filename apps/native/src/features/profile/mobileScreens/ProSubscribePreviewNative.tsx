/**
 * Web `ProSubscribePreview`（`/mobile/pro/subscribe`）相当。
 * プラン選択アコーディオン → お試しモーダル → 模擬購入 → 成功。
 */
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  Keyframe,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import ProCyberBadgeNative from "../kinetik/ProCyberBadgeNative";
import {
  PRO_SUBSCRIBE_PREVIEW_PLANS,
  proSubscribePreviewPlanById,
  type ProSubscribeFeatureIcon,
  type ProSubscribePreviewPlan,
  type ProSubscribePreviewPlanId,
} from "../../../../../../lib/pro/proSubscribePreviewPlans";
import { PRO_SUBSCRIBE_SUCCESS_MOTION as SM } from "../../../../../../lib/pro/proSubscribeSuccessMotion";
import { PRO_SUCCESS_ACCENT } from "../../../../../../lib/pro/proSuccessAccent";
import { setAppBrandShelfHidden } from "../../../../../../lib/ui/appBrandShelfVisibility";
import { OXANIUM_700, OXANIUM_800 } from "../reports/reportThemeNative";

const successCardEntering = new Keyframe({
  0: {
    opacity: 0,
    transform: [
      { translateY: SM.cardFromY },
      { scale: SM.cardFromScale },
    ],
  },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
  },
}).duration(SM.cardMs);

const successHeadEntering = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateY: SM.headFromY }],
  },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }],
  },
})
  .duration(SM.headMs)
  .delay(SM.headDelayMs);

const successAccentEntering = new Keyframe({
  0: { opacity: 0 },
  100: { opacity: 1 },
})
  .duration(SM.accentMs)
  .delay(SM.accentDelayMs);

type Phase = "plans" | "purchasing" | "success";
type CheckoutKind = "trial" | "paid";

const FEATURE_ICONS: Record<
  ProSubscribeFeatureIcon,
  ComponentProps<typeof MaterialCommunityIcons>["name"]
> = {
  insight: "lightbulb-outline",
  alert: "bell-outline",
  rank: "chart-bar",
  badge: "medal-outline",
  skin: "image-outline",
  proLeague: "sword-cross",
  weeklyReport: "file-document-outline",
  monthlyReport: "radar",
  season: "calendar-range",
};

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  onOpenSkin?: () => void;
  /** カード右上はてな。未指定なら既定の Pro 説明 */
  helpText?: string;
};

const PLAN_ACCENT: Record<
  ProSubscribePreviewPlanId,
  { fill: string; border: string; glow: string; softBg: string }
> = {
  weekly: {
    fill: "#00F5FF",
    border: "rgba(0,245,255,0.45)",
    glow: "rgba(0,245,255,0.22)",
    softBg: "rgba(0,245,255,0.08)",
  },
  monthly: {
    fill: "#B8FF3C",
    border: "rgba(184,255,60,0.45)",
    glow: "rgba(184,255,60,0.2)",
    softBg: "rgba(184,255,60,0.08)",
  },
  season: {
    fill: "#FF8A1A",
    border: "rgba(255,138,26,0.5)",
    glow: "rgba(255,138,26,0.22)",
    softBg: "rgba(255,138,26,0.09)",
  },
};

function trialAvailableFor(planId: ProSubscribePreviewPlanId): boolean {
  return planId === "weekly" || planId === "monthly";
}

function PlanScanLabel({
  label,
  accent,
}: {
  label: string;
  accent: string;
}) {
  return (
    <View style={[styles.scanLabel, { backgroundColor: accent }]}>
      <View style={styles.scanLabelLines} pointerEvents="none" />
      <Text style={styles.scanLabelText}>{label}</Text>
    </View>
  );
}

export default function ProSubscribePreviewNative({
  language,
  onClose,
  onOpenSkin,
  helpText,
}: Props) {
  const ja = language === "ja";
  const infoText =
    helpText ??
    (ja
      ? "スキンやプレミアム機能を使える Pro プランです。"
      : "Upgrade to Pro for skins and premium features.");
  const [planId, setPlanId] = useState<ProSubscribePreviewPlanId | null>(null);
  const [phase, setPhase] = useState<Phase>("plans");
  const [checkoutKind, setCheckoutKind] = useState<CheckoutKind>("paid");
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const selected = planId ? proSubscribePreviewPlanById(planId) : null;

  useEffect(() => {
    const hide = phase === "success";
    setAppBrandShelfHidden(hide);
    return () => {
      if (hide) setAppBrandShelfHidden(false);
    };
  }, [phase]);

  function togglePlan(id: ProSubscribePreviewPlanId) {
    setPlanId((prev) => (prev === id ? null : id));
  }

  function startPaid() {
    if (!planId || phase === "purchasing") return;
    setCheckoutKind("paid");
    setPhase("purchasing");
    setTimeout(() => setPhase("success"), 900);
  }

  function confirmTrial() {
    if (!planId) return;
    setTrialModalOpen(false);
    setCheckoutKind("trial");
    setPhase("purchasing");
    setTimeout(() => setPhase("success"), 900);
  }

  function reset() {
    setPhase("plans");
    setPlanId(null);
    setCheckoutKind("paid");
    setTrialModalOpen(false);
  }

  if (phase === "success" && selected && planId) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={[styles.pad, styles.padSuccess]}
          showsVerticalScrollIndicator={false}
        >
          <SuccessPanel
            ja={ja}
            planId={planId}
            planLabel={ja ? selected.labelJa : selected.labelEn}
            price={ja ? selected.priceJa : selected.priceEn}
            period={ja ? selected.periodJa : selected.periodEn}
            trial={checkoutKind === "trial"}
            onAgain={reset}
            onOpenSkin={onOpenSkin}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.pad}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
            <View style={styles.cardToolbar}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.toolBtn,
                  pressed && styles.toolBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={ja ? "戻る" : "Back"}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={22}
                  color="#ecfeff"
                />
              </Pressable>
              <Pressable
                onPress={() => setHelpOpen(true)}
                style={({ pressed }) => [
                  styles.toolBtn,
                  pressed && styles.toolBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={ja ? "説明" : "Info"}
              >
                <Text style={styles.helpGlyph}>?</Text>
              </Pressable>
            </View>

            <View style={styles.header}>
              <ProCyberBadgeNative premium />
              <Text style={styles.h1}>Get Pro</Text>
              <Text style={styles.lead}>
                {ja
                  ? "プランをタップして、できることを確認。もう一度タップで閉じます。"
                  : "Tap a plan to see what’s included. Tap again to close."}
              </Text>
            </View>

            <View style={styles.planList}>
              {PRO_SUBSCRIBE_PREVIEW_PLANS.map((plan) => {
                const on = planId === plan.id;
                const accent = PLAN_ACCENT[plan.id];
                return (
                  <View key={plan.id} style={styles.planBlock}>
                    <Pressable
                      onPress={() => togglePlan(plan.id)}
                      style={[
                        styles.planCard,
                        {
                          borderColor: accent.border,
                          backgroundColor: on
                            ? accent.softBg
                            : "rgba(255,255,255,0.03)",
                        },
                        on && {
                          shadowColor: accent.glow,
                          shadowOpacity: 1,
                          shadowRadius: 10,
                          shadowOffset: { width: 0, height: 0 },
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: on }}
                    >
                      <View style={styles.planTopRow}>
                        <PlanScanLabel
                          label={ja ? plan.labelJa : plan.labelEn}
                          accent={accent.fill}
                        />
                        <View style={styles.planTopRight}>
                          {plan.badgeJa || plan.recommended ? (
                            <View
                              style={[
                                styles.planBadge,
                                plan.badgeJa === "7日無料"
                                  ? { backgroundColor: accent.fill }
                                  : styles.planBadgeMuted,
                              ]}
                            >
                              <Text
                                style={
                                  plan.badgeJa === "7日無料"
                                    ? styles.planBadgeAccentText
                                    : styles.planBadgeMutedText
                                }
                              >
                                {ja ? plan.badgeJa : plan.badgeEn}
                              </Text>
                            </View>
                          ) : null}
                          <Text
                            style={[
                              styles.chevron,
                              on
                                ? { color: accent.fill, transform: [{ rotate: "180deg" }] }
                                : null,
                            ]}
                          >
                            ▾
                          </Text>
                        </View>
                      </View>

                      <View style={styles.priceRow}>
                        <Text style={styles.price}>
                          {ja ? plan.priceJa : plan.priceEn}
                        </Text>
                        <Text style={styles.period}>
                          {ja ? plan.periodJa : plan.periodEn}
                        </Text>
                      </View>
                      <Text style={styles.blurb}>
                        {ja ? plan.blurbJa : plan.blurbEn}
                      </Text>
                    </Pressable>

                    {on ? (
                      <View
                        style={[
                          styles.included,
                          { borderColor: accent.border },
                        ]}
                      >
                        <Text style={[styles.includedTitle, { color: accent.fill }]}>
                          {ja ? "このプランでできること" : "Included"}
                        </Text>
                        {plan.features.map((f) => (
                          <View key={f.titleEn} style={styles.featureRow}>
                            <View
                              style={[
                                styles.featureIcon,
                                {
                                  borderColor: `${accent.fill}73`,
                                  backgroundColor: `${accent.fill}26`,
                                },
                              ]}
                            >
                              <MaterialCommunityIcons
                                name={FEATURE_ICONS[f.icon]}
                                size={12}
                                color={accent.fill}
                              />
                            </View>
                            <View style={styles.featureCopy}>
                              <Text style={styles.featureTitle}>
                                {ja ? f.titleJa : f.titleEn}
                              </Text>
                              <Text style={styles.featureDetail}>
                                {ja ? f.detailJa : f.detailEn}
                              </Text>
                            </View>
                          </View>
                        ))}

                        {trialAvailableFor(plan.id) ? (
                          <View style={styles.inlineCta}>
                            <Pressable
                              disabled={phase === "purchasing"}
                              onPress={() => setTrialModalOpen(true)}
                              style={[
                                styles.primaryBtn,
                                phase === "purchasing" && styles.primaryBtnDisabled,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.primaryBtnText,
                                  phase === "purchasing" &&
                                    styles.primaryBtnTextDisabled,
                                ]}
                              >
                                {phase === "purchasing"
                                  ? ja
                                    ? "処理中…"
                                    : "Processing…"
                                  : ja
                                    ? "7日間無料で試す"
                                    : "Start 7-day free trial"}
                              </Text>
                            </Pressable>
                            <Text style={styles.afterTrial}>
                              {plan.id === "weekly"
                                ? ja
                                  ? "お試し後は週額 ¥280。期間中の解約で課金なし。"
                                  : "Then ¥280/week. Cancel during trial — no charge."
                                : ja
                                  ? "お試し後は月額 ¥780。期間中の解約で課金なし。"
                                  : "Then ¥780/month. Cancel during trial — no charge."}
                            </Text>
                            <Pressable
                              disabled={phase === "purchasing"}
                              onPress={startPaid}
                              style={styles.secondaryBtn}
                            >
                              <Text style={styles.secondaryBtnText}>
                                {ja
                                  ? `お試しなしで${plan.labelJa}を購入`
                                  : `Buy ${plan.labelEn} (no trial)`}
                              </Text>
                            </Pressable>
                            <Text style={styles.micro}>
                              {ja
                                ? "※ 初回のみ。iOS は App Store のサブスク管理から解約できます。プレビューでは決済しません。"
                                : "※ First time only. On iOS, cancel in App Store subscriptions. Preview does not charge."}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.inlineCta}>
                            <Pressable
                              disabled={phase === "purchasing"}
                              onPress={startPaid}
                              style={[
                                styles.primaryBtn,
                                phase === "purchasing" && styles.primaryBtnDisabled,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.primaryBtnText,
                                  phase === "purchasing" &&
                                    styles.primaryBtnTextDisabled,
                                ]}
                              >
                                {phase === "purchasing"
                                  ? ja
                                    ? "処理中…"
                                    : "Processing…"
                                  : ja
                                    ? `${plan.labelJa} を購入（プレビュー）`
                                    : `Buy ${plan.labelEn} (preview)`}
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
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
      </ScrollView>

      <Modal
        visible={trialModalOpen && selected != null}
        transparent
        animationType="fade"
        onRequestClose={() => setTrialModalOpen(false)}
      >
        {selected ? (
          <TrialExplainModal
            ja={ja}
            plan={selected}
            onClose={() => setTrialModalOpen(false)}
            onConfirm={confirmTrial}
          />
        ) : null}
      </Modal>

      <Modal
        visible={helpOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpOpen(false)}
      >
        <View style={styles.helpBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setHelpOpen(false)}
          />
          <View style={styles.helpCard}>
            <Text style={styles.helpLabel}>INFO</Text>
            <Text style={styles.helpBody}>{infoText}</Text>
            <Pressable
              onPress={() => setHelpOpen(false)}
              style={styles.helpClose}
            >
              <Text style={styles.helpCloseText}>
                {ja ? "閉じる" : "Close"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
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
  const afterPrice = ja
    ? `${plan.priceJa}${plan.periodJa}`
    : `${plan.priceEn}${plan.periodEn}`;
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
        <Text style={styles.modalTitle}>
          {ja ? "お試しの前に" : "Before you start"}
        </Text>
        <Text style={styles.modalSub}>
          {ja
            ? `選択中: ${plan.labelJa} · 7日間無料`
            : `Selected: ${plan.labelEn} · 7-day free`}
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

function MetaRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: (typeof PRO_SUCCESS_ACCENT)[keyof typeof PRO_SUCCESS_ACCENT];
}) {
  return (
    <View style={styles.metaRow}>
      <Text style={[styles.metaLabel, { color: accent.metaLabel }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: accent.main }]}>{value}</Text>
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
  onOpenSkin,
}: {
  ja: boolean;
  planId: ProSubscribePreviewPlanId;
  planLabel: string;
  price: string;
  period: string;
  trial: boolean;
  onAgain: () => void;
  onOpenSkin?: () => void;
}) {
  const A = trial ? PRO_SUCCESS_ACCENT.trial : PRO_SUCCESS_ACCENT.billing;
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
  const title = trial
    ? ja
      ? "Pro お試し開始"
      : "Pro trial started"
    : "Upgrade to Pro";
  const statusLine = trial
    ? `7DAY_TRIAL // ${planLabel.toUpperCase()}`
    : `ACTIVE // ${planLabel.toUpperCase()}`;

  const reduceMotion = useReducedMotion() === true;
  const checkGlow = useSharedValue(0.35);
  const sheenX = useSharedValue(-80);
  const sheenOpacity = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      checkGlow.value = 0.45;
      sheenX.value = -80;
      sheenOpacity.value = 0;
      return;
    }
    checkGlow.value = 0.28;
    checkGlow.value = withDelay(
      SM.checkGlowDelayMs,
      withSequence(
        withTiming(0.75, {
          duration: Math.round(SM.checkGlowMs * 0.45),
          easing: Easing.out(Easing.quad),
        }),
        withTiming(0.45, {
          duration: Math.round(SM.checkGlowMs * 0.55),
          easing: Easing.out(Easing.quad),
        })
      )
    );

    sheenX.value = -80;
    sheenOpacity.value = 0;
    sheenOpacity.value = withDelay(
      SM.brandSheenDelayMs,
      withSequence(
        withTiming(1, { duration: 70, easing: Easing.out(Easing.quad) }),
        withTiming(1, {
          duration: Math.max(SM.brandSheenMs - 160, 80),
        }),
        withTiming(0, { duration: 90, easing: Easing.in(Easing.quad) })
      )
    );
    sheenX.value = withDelay(
      SM.brandSheenDelayMs,
      withTiming(220, {
        duration: SM.brandSheenMs,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [checkGlow, reduceMotion, sheenOpacity, sheenX]);

  const checkGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: checkGlow.value,
    shadowRadius: 4 + checkGlow.value * 14,
  }));

  const sheenStyle = useAnimatedStyle(() => ({
    opacity: sheenOpacity.value,
    transform: [
      { translateX: sheenX.value },
      { rotate: "18deg" },
    ],
  }));

  return (
    <View style={styles.successWrap}>
      <Animated.View
        style={styles.successHead}
        entering={reduceMotion ? undefined : successHeadEntering}
      >
        <Animated.View
          style={[
            styles.successCheck,
            checkGlowStyle,
            { backgroundColor: A.main, shadowColor: A.main },
          ]}
        >
          <Text style={[styles.successCheckText, { color: A.ink }]}>✓</Text>
        </Animated.View>
        <Text style={[styles.successTitle, { color: A.title }]}>{title}</Text>
      </Animated.View>

      <Animated.View
        style={styles.successFrameOuter}
        entering={reduceMotion ? undefined : successCardEntering}
      >
        <Animated.View
          style={[styles.successCornerTL, { borderColor: A.main }]}
          entering={reduceMotion ? undefined : successAccentEntering}
        />
        <Animated.View
          style={[styles.successCornerBR, { borderColor: A.main }]}
          entering={reduceMotion ? undefined : successAccentEntering}
        />
        <Animated.View
          style={[styles.successPlate, { backgroundColor: A.main }]}
          entering={reduceMotion ? undefined : successAccentEntering}
        />
        <View style={styles.successCard}>
          <View style={styles.successStrip}>
            <View style={{ flex: 1 }}>
              <Text style={styles.successStripEyebrow}>
                {trial
                  ? "TRIAL_CONFIRMED // TYPE: PRO"
                  : "UPGRADE_CONFIRMED // TYPE: PRO"}
              </Text>
              <Text style={styles.successStripTitle}>
                {trial ? "TRIAL ON" : "PRO ON"}
              </Text>
            </View>
            <View style={styles.successStripMeta}>
              <Text style={styles.successStripMetaText}>
                PLAN: {planLabel.toUpperCase()}
              </Text>
              <Text style={styles.successStripMetaText}>
                {trial ? "AUTH: TRIAL" : "AUTH: PAID"}
              </Text>
            </View>
          </View>

          <View style={styles.successBody}>
            <View
              style={[styles.successBadgeBox, { borderColor: A.borderSoft }]}
            >
              <View style={styles.successBrandCluster}>
                <ProCyberBadgeNative premium />
                <Text style={[styles.successBrand, { color: A.title }]}>
                  UNITERZ
                </Text>
                {!reduceMotion ? (
                  <Animated.View
                    pointerEvents="none"
                    style={[styles.successBrandSheen, sheenStyle]}
                  >
                    <LinearGradient
                      colors={[
                        "transparent",
                        "rgba(255,255,255,0.12)",
                        "rgba(255,255,255,0.9)",
                        "rgba(186,250,255,0.55)",
                        "transparent",
                      ]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  </Animated.View>
                ) : null}
              </View>
              <View style={[styles.successHair, { backgroundColor: A.main }]} />
              <Text style={[styles.successStatus, { color: A.muted }]}>
                {statusLine}
              </Text>
              <Text style={[styles.successPrice, { color: A.main }]}>
                {trial ? (ja ? "無料 → その後 " : "FREE → THEN ") : ""}
                {price}
                {trial ? period : ""}
              </Text>
            </View>

            <View style={[styles.successMeta, { borderTopColor: A.borderSoft }]}>
              {trial ? (
                <>
                  <MetaRow accent={A} label="START" value={started} />
                  <MetaRow accent={A} label="ENDS" value={trialEndLabel} />
                  <MetaRow
                    accent={A}
                    label="CHARGE"
                    value={ja ? "期間中解約で課金なし" : "Cancel in trial = ¥0"}
                  />
                </>
              ) : (
                <>
                  <MetaRow accent={A} label="START" value={started} />
                  <MetaRow accent={A} label="PLAN_ID" value={planId} />
                </>
              )}
            </View>

            <Pressable
              style={[
                styles.successPrimary,
                { backgroundColor: A.main },
              ]}
              onPress={onOpenSkin}
            >
              <Text style={[styles.successPrimaryText, { color: A.ink }]}>
                {ja ? "Pro Skin を選ぶ" : "Choose Pro Skin"}
              </Text>
            </Pressable>
            <Pressable
              onPress={onAgain}
              style={[styles.successSecondary, { borderColor: A.borderSoft }]}
            >
              <Text style={[styles.successSecondaryText, { color: A.soft }]}>
                {ja ? "プラン選択に戻る" : "Back to plans"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pad: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 40,
  },
  padSuccess: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: 0,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.28)",
    backgroundColor: "rgba(8,10,16,0.98)",
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  cardToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  toolBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
    backgroundColor: "rgba(0,245,255,0.06)",
  },
  toolBtnPressed: {
    borderColor: "rgba(0,245,255,0.5)",
    backgroundColor: "rgba(0,245,255,0.12)",
  },
  helpGlyph: {
    fontFamily: OXANIUM_800,
    fontSize: 17,
    fontWeight: "900",
    fontStyle: "italic",
    color: "rgba(165,243,252,0.9)",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  helpBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,9,0.78)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  helpCard: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.32)",
    backgroundColor: "#050b14",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  helpLabel: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.8,
    color: "rgba(103,232,249,0.85)",
    textAlign: "center",
    textTransform: "uppercase",
  },
  helpBody: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  helpClose: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
    backgroundColor: "rgba(0,245,255,0.06)",
    paddingVertical: 10,
    alignItems: "center",
  },
  helpCloseText: {
    fontFamily: OXANIUM_700,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "#ecfeff",
    textTransform: "uppercase",
  },
  h1: {
    fontFamily: OXANIUM_800,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2.8,
    color: "#ffffff",
    textTransform: "uppercase",
  },
  lead: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  planList: {
    gap: 10,
  },
  planBlock: {
    gap: 0,
  },
  planCard: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  planTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  planTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scanLabel: {
    height: 18,
    paddingHorizontal: 6,
    justifyContent: "center",
    overflow: "hidden",
  },
  scanLabelLines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
  },
  scanLabelText: {
    fontFamily: OXANIUM_800,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#050508",
    textTransform: "uppercase",
  },
  planBadge: {
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 2,
    justifyContent: "center",
  },
  planBadgeMuted: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  planBadgeAccentText: {
    fontFamily: OXANIUM_800,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#120e08",
    textTransform: "uppercase",
  },
  planBadgeMutedText: {
    fontFamily: OXANIUM_700,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
  },
  chevron: {
    fontFamily: OXANIUM_800,
    fontSize: 12,
    fontWeight: "900",
    color: "rgba(255,255,255,0.35)",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 10,
  },
  price: {
    fontFamily: OXANIUM_800,
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
  },
  period: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.45)",
  },
  blurb: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.45)",
  },
  included: {
    borderWidth: 1,
    borderTopWidth: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  includedTitle: {
    fontFamily: OXANIUM_800,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  featureIcon: {
    width: 20,
    height: 20,
    marginTop: 1,
    borderRadius: 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: {
    flex: 1,
    minWidth: 0,
  },
  featureTitle: {
    fontFamily: OXANIUM_800,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.9)",
  },
  featureDetail: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.5)",
  },
  inlineCta: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    gap: 8,
  },
  primaryBtn: {
    borderRadius: 2,
    backgroundColor: "#fcd34d",
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  primaryBtnText: {
    fontFamily: OXANIUM_800,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#120e08",
    textTransform: "uppercase",
  },
  primaryBtnTextDisabled: {
    color: "rgba(255,255,255,0.5)",
  },
  afterTrial: {
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.5)",
  },
  secondaryBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  micro: {
    textAlign: "center",
    fontSize: 10,
    lineHeight: 15,
    color: "rgba(255,255,255,0.35)",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 24,
    paddingTop: 40,
  },
  modalCard: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.35)",
    backgroundColor: "rgba(8,10,16,0.99)",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalTitle: {
    fontFamily: OXANIUM_800,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: "#ffffff",
    textAlign: "center",
    textTransform: "uppercase",
  },
  modalSub: {
    marginTop: 8,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  modalPoints: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  modalPointRow: {
    flexDirection: "row",
    gap: 10,
  },
  modalPointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fcd34d",
    marginTop: 7,
  },
  modalPointText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.8)",
  },
  modalConfirm: {
    marginTop: 16,
    borderRadius: 2,
    backgroundColor: "#fcd34d",
    paddingVertical: 12,
    alignItems: "center",
  },
  modalConfirmText: {
    fontFamily: OXANIUM_800,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#120e08",
    textTransform: "uppercase",
  },
  modalBack: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  modalBackText: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  successWrap: {
    alignItems: "center",
    width: "100%",
    marginTop: -20,
  },
  successHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  successCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00F5FF",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#00F5FF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  successCheckText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#050508",
  },
  successTitle: {
    fontFamily: OXANIUM_800,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: "#ecfeff",
    textTransform: "uppercase",
  },
  successFrameOuter: {
    width: "100%",
    maxWidth: 360,
    paddingTop: 8,
    paddingLeft: 8,
    paddingRight: 7,
    paddingBottom: 7,
  },
  successCornerTL: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 18,
    height: 18,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: "#00F5FF",
    zIndex: 20,
  },
  successCornerBR: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 18,
    height: 18,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: "#00F5FF",
    zIndex: 20,
  },
  successPlate: {
    ...StyleSheet.absoluteFillObject,
    top: 8,
    left: 8,
    backgroundColor: "#00F5FF",
    zIndex: 0,
  },
  successCard: {
    borderWidth: 2.5,
    borderColor: "#ffffff",
    backgroundColor: "#04080f",
    zIndex: 10,
  },
  successStrip: {
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 2.5,
    borderBottomColor: "#ffffff",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  successStripEyebrow: {
    fontFamily: OXANIUM_700,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(0,0,0,0.55)",
    textTransform: "uppercase",
  },
  successStripTitle: {
    fontFamily: OXANIUM_800,
    marginTop: 2,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#000000",
    textTransform: "uppercase",
  },
  successStripMeta: {
    borderLeftWidth: 2.5,
    borderLeftColor: "rgba(0,0,0,0.15)",
    paddingLeft: 10,
    justifyContent: "center",
  },
  successStripMetaText: {
    fontFamily: OXANIUM_700,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(0,0,0,0.7)",
    textTransform: "uppercase",
    textAlign: "right",
  },
  successBody: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
  },
  successBadgeBox: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 240,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(4,10,18,0.88)",
    paddingHorizontal: 12,
    paddingVertical: 20,
    alignItems: "center",
    gap: 10,
  },
  successBrandCluster: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    overflow: "hidden",
  },
  successBrandSheen: {
    position: "absolute",
    top: -14,
    bottom: -14,
    left: 0,
    width: 56,
    zIndex: 4,
  },
  successBrand: {
    fontFamily: OXANIUM_700,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 4.4,
    color: "#ecfeff",
  },
  successHair: {
    width: 56,
    height: 1,
    backgroundColor: "#00F5FF",
  },
  successStatus: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(207,250,254,0.7)",
    textTransform: "uppercase",
    textAlign: "center",
  },
  successPrice: {
    fontFamily: OXANIUM_800,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
    color: "#00F5FF",
  },
  successMeta: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(34,211,238,0.3)",
    paddingTop: 12,
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  metaLabel: {
    fontFamily: OXANIUM_700,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  metaValue: {
    flex: 1,
    textAlign: "right",
    fontFamily: OXANIUM_700,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
  successPrimary: {
    marginTop: 12,
    borderRadius: 2,
    backgroundColor: "#00F5FF",
    paddingVertical: 12,
    alignItems: "center",
  },
  successPrimaryText: {
    fontFamily: OXANIUM_800,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#050508",
    textTransform: "uppercase",
  },
  successSecondary: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  successSecondaryText: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
});
