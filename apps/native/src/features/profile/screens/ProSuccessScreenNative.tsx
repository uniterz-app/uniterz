/**
 * Web `app/mobile/pro/success/page.tsx` 相当
 * 本番課金成功 — サイバー HUD / グリーンアクセント
 */
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CommonActions, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
import { doc, getDoc } from "firebase/firestore";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import ProCyberBadgeNative from "../kinetik/ProCyberBadgeNative";
import { OXANIUM_700, OXANIUM_800 } from "../reports/reportThemeNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { db } from "../../../lib/firebase";
import type { ProfileStackParamList } from "../../../navigation/types";
import { spacing } from "../../../theme/tokens";
import type { ProIapPlan } from "../../billing/iapProductIds";
import {
  asProIapPlan,
  firestoreDate,
  formatPlanDate,
  normalizeStoredPlanType,
  planCatalogPrice,
  planDisplayNameFull,
  planPeriodLabel,
  type StoredPlanType,
} from "../../billing/planChangeDisplay";
import { PRO_SUCCESS_ACCENT } from "../../../../../../lib/pro/proSuccessAccent";
import { PRO_SUBSCRIBE_SUCCESS_MOTION as SM } from "../../../../../../lib/pro/proSubscribeSuccessMotion";

const A = PRO_SUCCESS_ACCENT.billing;

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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

export default function ProSuccessScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const [storedType, setStoredType] = useState<StoredPlanType | null>(null);
  const [proUntil, setProUntil] = useState<Date | null>(null);

  const reduceMotion = useReducedMotion() === true;
  const checkGlow = useSharedValue(0.35);
  const sheenX = useSharedValue(-80);
  const sheenOpacity = useSharedValue(0);

  useEffect(() => {
    if (!fUser) return;
    let alive = true;
    void (async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      if (!alive) return;
      const data = snap.data() as Record<string, unknown> | undefined;
      setStoredType(normalizeStoredPlanType(data?.planType));
      setProUntil(
        firestoreDate(data?.proUntil as { toDate?: () => Date } | Date | null)
      );
    })();
    return () => {
      alive = false;
    };
  }, [fUser]);

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
    transform: [{ translateX: sheenX.value }, { rotate: "18deg" }],
  }));

  const plan: ProIapPlan = asProIapPlan(storedType);
  const planLabel = planDisplayNameFull(storedType ?? plan, "en");
  const price = planCatalogPrice(plan, "ja");
  const period = planPeriodLabel(plan, "ja");
  const untilLabel = formatPlanDate(proUntil, "ja");
  const startedOn = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <MobilePageShell
      title="PRO"
      appBackground
      onClose={() => navigation.goBack()}
    >
      <View style={styles.content}>
        <Animated.View
          style={styles.successHead}
          entering={reduceMotion ? undefined : successHeadEntering}
        >
          <Animated.View style={[styles.successCheck, checkGlowStyle]}>
            <Text style={styles.successCheckText}>✓</Text>
          </Animated.View>
          <Text style={styles.successTitle}>Upgrade to Pro!</Text>
        </Animated.View>

        <Animated.View
          style={styles.successFrameOuter}
          entering={reduceMotion ? undefined : successCardEntering}
        >
          <Animated.View
            style={styles.successCornerTL}
            entering={reduceMotion ? undefined : successAccentEntering}
          />
          <Animated.View
            style={styles.successCornerBR}
            entering={reduceMotion ? undefined : successAccentEntering}
          />
          <Animated.View
            style={styles.successPlate}
            entering={reduceMotion ? undefined : successAccentEntering}
          />
          <View style={styles.successCard}>
            <View style={styles.successStrip}>
              <View style={{ flex: 1 }}>
                <Text style={styles.successStripEyebrow}>
                  UPGRADE_CONFIRMED // TYPE: PRO
                </Text>
                <Text style={styles.successStripTitle}>PRO ON</Text>
              </View>
              <View style={styles.successStripMeta}>
                <Text style={styles.successStripMetaText}>
                  PLAN: {planLabel.toUpperCase()}
                </Text>
                <Text style={styles.successStripMetaText}>AUTH: PAID</Text>
              </View>
            </View>

            <View style={styles.successBody}>
              <View style={styles.successBadgeBox}>
                <View style={styles.successBrandCluster}>
                  <ProCyberBadgeNative premium />
                  <Text style={styles.successBrand}>UNITERZ</Text>
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
                          "rgba(187,247,208,0.55)",
                          "transparent",
                        ]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                    </Animated.View>
                  ) : null}
                </View>
                <View style={styles.successHair} />
                <Text style={styles.successStatus}>
                  {`ACTIVE // ${planLabel.toUpperCase()}`}
                </Text>
                <Text style={styles.successPrice}>
                  {price}
                  <Text style={styles.successPriceMuted}>
                    {" "}
                    {period}・税込み
                  </Text>
                </Text>
              </View>

              <View style={styles.successMeta}>
                <MetaRow label="START" value={startedOn} />
                <MetaRow
                  label={plan === "season" ? "UNTIL" : "RENEW"}
                  value={untilLabel}
                />
              </View>

              <Pressable
                onPress={() => {
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: "ProfileHome" }],
                    })
                  );
                }}
                style={styles.successPrimary}
              >
                <Text style={styles.successPrimaryText}>Proデータを見る</Text>
              </Pressable>

              <View style={styles.linkRow}>
                <Pressable onPress={() => navigation.navigate("Terms")}>
                  <Text style={styles.link}>利用規約</Text>
                </Pressable>
                <Text style={styles.linkSep}>|</Text>
                <Pressable onPress={() => navigation.navigate("Contact")}>
                  <Text style={styles.link}>お問い合わせ</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: A.main,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: A.main,
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
    color: A.ink,
  },
  successTitle: {
    fontFamily: OXANIUM_800,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: A.title,
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
    borderColor: A.main,
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
    borderColor: A.main,
    zIndex: 20,
  },
  successPlate: {
    ...StyleSheet.absoluteFillObject,
    top: 8,
    left: 8,
    backgroundColor: A.main,
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
    textAlign: "left",
  },
  successStripTitle: {
    fontFamily: OXANIUM_800,
    marginTop: 2,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#000000",
    textTransform: "uppercase",
    textAlign: "left",
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
    borderColor: A.borderSoft,
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
    color: A.title,
  },
  successHair: {
    width: 56,
    height: 1,
    backgroundColor: A.main,
  },
  successStatus: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: A.muted,
    textTransform: "uppercase",
    textAlign: "center",
  },
  successPrice: {
    fontFamily: OXANIUM_800,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
    color: A.main,
    textAlign: "center",
  },
  successPriceMuted: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    fontWeight: "700",
    color: A.soft,
  },
  successMeta: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: A.borderSoft,
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
    color: A.metaLabel,
    textTransform: "uppercase",
  },
  metaValue: {
    flex: 1,
    textAlign: "right",
    fontFamily: OXANIUM_700,
    fontSize: 11,
    fontWeight: "700",
    color: A.main,
  },
  successPrimary: {
    marginTop: 12,
    borderRadius: 2,
    backgroundColor: A.main,
    paddingVertical: 12,
    alignItems: "center",
  },
  successPrimaryText: {
    fontFamily: OXANIUM_800,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: A.ink,
    textTransform: "uppercase",
  },
  linkRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  link: {
    fontFamily: OXANIUM_700,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: A.soft,
    textTransform: "uppercase",
  },
  linkSep: {
    fontSize: 9,
    color: `rgba(${A.mainRgb},0.3)`,
  },
});
