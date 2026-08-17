/**
 * Web `UnitEarnOverlay` 相当 —
 * 枠なしオーバーレイで金額・理由・順位を表示し、獲得後に金庫へ飛行加算。
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type View as ViewType,
} from "react-native";
import { FullWindowOverlay } from "react-native-screens";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { fonts } from "../../theme/tokens";
import { JP_700, JP_600 } from "./reports/reportThemeNative";
import {
  UNIT_EARN_ABSORB_MS,
  UNIT_EARN_APERTURE_CLAIM_DELAY_MS,
  UNIT_EARN_APERTURE_COUNT_DELAY_MS,
  UNIT_EARN_APERTURE_DETAIL_DELAY_MS,
  UNIT_EARN_APERTURE_ITEM_MS,
  UNIT_EARN_APERTURE_PRIZE_DELAY_MS,
  UNIT_EARN_APERTURE_RANK_DELAY_MS,
  UNIT_EARN_APERTURE_RING_MS,
  UNIT_EARN_COUNT_MS,
  UNIT_EARN_EXIT_MS,
  UNIT_EARN_FLY_ARC,
  UNIT_EARN_FLY_MS,
  UNIT_EARN_SCRIM_MS,
  UNIT_EARN_VAULT_COUNT_MS,
  UNIT_EARN_COUNT_DISPLAY_STEPS,
} from "../../../../../lib/units/unitEarnMotion";
import { formatUnitEarnRankOrdinal } from "../../../../../lib/units/formatUnitEarnRank";
import UnitCoinDiscNative from "./UnitCoinDiscNative";

type Props = {
  open: boolean;
  amount: number;
  label?: string | null;
  title?: string | null;
  subtitle?: string | null;
  rank?: number | null;
  language?: "ja" | "en";
  vaultRef: RefObject<ViewType | null>;
  onAbsorb: () => void;
  onDone: () => void;
};

type Phase = "enter" | "ready" | "flying";

const EASE = Easing.bezier(0.25, 1, 0.5, 1);
const COUNT_EASE = Easing.bezier(0.22, 0.82, 0.28, 1);

function formatCount(n: number): string {
  const v = Math.max(0, Math.floor(n));
  return v.toLocaleString("en-US");
}

export default function UnitEarnOverlayNative({
  open,
  amount,
  label = null,
  title = null,
  subtitle = null,
  rank = null,
  language = "ja",
  vaultRef,
  onAbsorb,
  onDone,
}: Props) {
  const isJa = language === "ja";
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("enter");
  /** AnimatedTextInput は使わない（Hermes hades GC × TextInputState 連鎖で SIGBUS） */
  const [amountLabel, setAmountLabel] = useState("+0");
  const absorbedRef = useRef(false);
  const flyingRef = useRef(false);
  const onAbsorbRef = useRef(onAbsorb);
  const onDoneRef = useRef(onDone);
  const flyMeasureRef = useRef<ViewType>(null);
  const afterAbsorbRef = useRef<() => void>(() => {});
  const safeAmount = Math.max(0, Math.floor(amount));
  const safeRank =
    typeof rank === "number" && Number.isFinite(rank)
      ? Math.max(1, Math.floor(rank))
      : null;

  onAbsorbRef.current = onAbsorb;
  onDoneRef.current = onDone;

  const scrim = useSharedValue(0);
  const stageOpacity = useSharedValue(1);
  const metaOpacity = useSharedValue(1);
  const flyOpacity = useSharedValue(1);
  const valueScale = useSharedValue(1);
  const countT = useSharedValue(0);
  const amountSV = useSharedValue(safeAmount);
  const flying = useSharedValue(0);
  const flyT = useSharedValue(0);
  const flyEndX = useSharedValue(0);
  const flyEndY = useSharedValue(0);
  const flyEndScale = useSharedValue(0.35);
  const detailOpacity = useSharedValue(0);
  const detailY = useSharedValue(8);
  const rankOpacity = useSharedValue(0);
  const rankY = useSharedValue(6);
  const prizeOpacity = useSharedValue(0);
  const prizeY = useSharedValue(8);
  const prizeEnterScale = useSharedValue(0.97);
  const claimOpacity = useSharedValue(0);
  const claimY = useSharedValue(6);
  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.35);

  const reasonTitle =
    title?.trim() ||
    label?.trim() ||
    (isJa ? "Unit 報酬" : "Unit reward");
  const reasonSub = subtitle?.trim() || null;
  const claimLabel = isJa ? "獲得する" : "Claim";
  const rankText =
    safeRank != null ? formatUnitEarnRankOrdinal(safeRank) : null;

  const markReady = useCallback(() => {
    setPhase("ready");
  }, []);

  const invokeAfterAbsorb = useCallback(() => {
    afterAbsorbRef.current();
  }, []);

  useEffect(() => {
    amountSV.value = safeAmount;
  }, [amountSV, safeAmount]);

  const setAmountLabelSafe = useCallback((n: number) => {
    setAmountLabel(`+${formatCount(n)}`);
  }, []);

  useAnimatedReaction(
    () => {
      const total = Math.max(0, Math.floor(amountSV.value));
      const raw = Math.floor(amountSV.value * countT.value + 1e-6);
      if (countT.value >= 1) return total;
      // +80 程度は 1 刻み。大口だけ間引く
      if (total <= UNIT_EARN_COUNT_DISPLAY_STEPS) return Math.min(total, raw);
      const step = Math.max(1, Math.ceil(total / UNIT_EARN_COUNT_DISPLAY_STEPS));
      return Math.min(total, Math.floor(raw / step) * step);
    },
    (n, prev) => {
      if (n === prev) return;
      runOnJS(setAmountLabelSafe)(n);
    },
    [setAmountLabelSafe]
  );

  useEffect(() => {
    if (!open) {
      absorbedRef.current = false;
      flyingRef.current = false;
      setPhase("enter");
      setAmountLabel("+0");
      scrim.value = 0;
      stageOpacity.value = 1;
      metaOpacity.value = 1;
      flyOpacity.value = 1;
      valueScale.value = 1;
      countT.value = 0;
      flying.value = 0;
      flyT.value = 0;
      detailOpacity.value = 0;
      detailY.value = 8;
      rankOpacity.value = 0;
      rankY.value = 6;
      prizeOpacity.value = 0;
      prizeY.value = 8;
      prizeEnterScale.value = 0.97;
      claimOpacity.value = 0;
      claimY.value = 6;
      ringOpacity.value = 0;
      ringScale.value = 0.35;
      return;
    }

    absorbedRef.current = false;
    flyingRef.current = false;
    setPhase("enter");
    let cancelled = false;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    const runAbsorb = () => {
      if (absorbedRef.current) return;
      absorbedRef.current = true;
      onAbsorbRef.current();
    };

    const runDone = () => {
      if (!cancelled) onDoneRef.current();
    };

    const beginExit = () => {
      if (cancelled) return;
      scrim.value = withTiming(0, {
        duration: UNIT_EARN_EXIT_MS,
        easing: EASE,
      });
      stageOpacity.value = withTiming(
        0,
        { duration: UNIT_EARN_EXIT_MS, easing: EASE },
        (done) => {
          if (done) runOnJS(runDone)();
        }
      );
    };

    afterAbsorbRef.current = () => {
      runAbsorb();
      const holdMs = Math.max(
        UNIT_EARN_ABSORB_MS,
        Math.round(UNIT_EARN_VAULT_COUNT_MS * 0.55)
      );
      timers.push(setTimeout(beginExit, holdMs));
    };

    if (reduceMotion) {
      countT.value = 1;
      setAmountLabelSafe(safeAmount);
      scrim.value = withTiming(1, { duration: 160 });
      detailOpacity.value = 1;
      detailY.value = 0;
      rankOpacity.value = 1;
      rankY.value = 0;
      prizeOpacity.value = 1;
      prizeY.value = 0;
      prizeEnterScale.value = 1;
      claimOpacity.value = 1;
      claimY.value = 0;
      ringOpacity.value = 0;
      markReady();
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }

    countT.value = 0;
    setAmountLabelSafe(0);
    metaOpacity.value = 1;
    flyOpacity.value = 1;
    flying.value = 0;
    flyT.value = 0;
    detailOpacity.value = 0;
    detailY.value = 8;
    rankOpacity.value = 0;
    rankY.value = 6;
    prizeOpacity.value = 0;
    prizeY.value = 8;
    prizeEnterScale.value = 0.97;
    claimOpacity.value = 0;
    claimY.value = 6;
    ringOpacity.value = 0;
    ringScale.value = 0.35;

    scrim.value = withTiming(1, {
      duration: UNIT_EARN_SCRIM_MS,
      easing: EASE,
    });

    // 本番入場: Aperture
    ringOpacity.value = withSequence(
      withTiming(0.5, { duration: 100, easing: EASE }),
      withTiming(0, { duration: UNIT_EARN_APERTURE_RING_MS - 100, easing: EASE })
    );
    ringScale.value = withTiming(1.7, {
      duration: UNIT_EARN_APERTURE_RING_MS,
      easing: EASE,
    });
    detailOpacity.value = withDelay(
      UNIT_EARN_APERTURE_DETAIL_DELAY_MS,
      withTiming(1, { duration: UNIT_EARN_APERTURE_ITEM_MS, easing: EASE })
    );
    detailY.value = withDelay(
      UNIT_EARN_APERTURE_DETAIL_DELAY_MS,
      withTiming(0, { duration: UNIT_EARN_APERTURE_ITEM_MS, easing: EASE })
    );
    rankOpacity.value = withDelay(
      UNIT_EARN_APERTURE_RANK_DELAY_MS,
      withTiming(1, { duration: UNIT_EARN_APERTURE_ITEM_MS, easing: EASE })
    );
    rankY.value = withDelay(
      UNIT_EARN_APERTURE_RANK_DELAY_MS,
      withTiming(0, { duration: UNIT_EARN_APERTURE_ITEM_MS, easing: EASE })
    );
    prizeOpacity.value = withDelay(
      UNIT_EARN_APERTURE_PRIZE_DELAY_MS,
      withTiming(1, { duration: 420, easing: EASE })
    );
    prizeY.value = withDelay(
      UNIT_EARN_APERTURE_PRIZE_DELAY_MS,
      withTiming(0, { duration: 420, easing: EASE })
    );
    prizeEnterScale.value = withDelay(
      UNIT_EARN_APERTURE_PRIZE_DELAY_MS,
      withTiming(1, { duration: 420, easing: EASE })
    );
    claimOpacity.value = withDelay(
      UNIT_EARN_APERTURE_CLAIM_DELAY_MS,
      withTiming(1, { duration: 340, easing: EASE })
    );
    claimY.value = withDelay(
      UNIT_EARN_APERTURE_CLAIM_DELAY_MS,
      withTiming(0, { duration: 340, easing: EASE })
    );

    const countDelayMs = UNIT_EARN_APERTURE_COUNT_DELAY_MS;
    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        countT.value = 0;
        countT.value = withTiming(
          1,
          {
            duration: UNIT_EARN_COUNT_MS,
            easing: COUNT_EASE,
          },
          (finished) => {
            if (finished) runOnJS(markReady)();
          }
        );
        valueScale.value = 1.05;
        valueScale.value = withTiming(1, {
          duration: UNIT_EARN_COUNT_MS,
          easing: COUNT_EASE,
        });
      }, countDelayMs)
    );

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [
    amountSV,
    claimOpacity,
    claimY,
    countT,
    detailOpacity,
    detailY,
    flyOpacity,
    flyT,
    flying,
    markReady,
    metaOpacity,
    open,
    prizeEnterScale,
    prizeOpacity,
    prizeY,
    rankOpacity,
    rankY,
    reduceMotion,
    ringOpacity,
    ringScale,
    safeAmount,
    scrim,
    setAmountLabelSafe,
    stageOpacity,
    valueScale,
  ]);

  const handleClaim = useCallback(() => {
    if (phase !== "ready" || flyingRef.current) return;
    flyingRef.current = true;
    setPhase("flying");
    countT.value = 1;
    valueScale.value = 1;

    if (reduceMotion) {
      afterAbsorbRef.current();
      return;
    }

    const { width: sw, height: sh } = Dimensions.get("window");

    const startFly = (
      fromCx: number,
      fromCy: number,
      toCx: number,
      toCy: number
    ) => {
      metaOpacity.value = withTiming(0, {
        duration: Math.round(UNIT_EARN_FLY_MS * 0.28),
        easing: EASE,
      });
      scrim.value = withTiming(0.28, {
        duration: Math.round(UNIT_EARN_FLY_MS * 0.55),
        easing: EASE,
      });
      flyEndX.value = toCx - fromCx;
      flyEndY.value = toCy - fromCy;
      flyEndScale.value = 0.35;
      flyT.value = 0;
      flying.value = 1;
      flyT.value = withTiming(
        1,
        { duration: UNIT_EARN_FLY_MS, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (!finished) return;
          runOnJS(invokeAfterAbsorb)();
        }
      );
    };

    const fallbackFly = () => {
      startFly(sw / 2, sh / 2, sw - 48, 96);
    };

    const vault = vaultRef.current;
    const flyEl = flyMeasureRef.current;
    if (
      vault &&
      typeof vault.measureInWindow === "function" &&
      flyEl &&
      typeof flyEl.measureInWindow === "function"
    ) {
      flyEl.measureInWindow((px, py, pw, ph) => {
        vault.measureInWindow((vx, vy, vw, vh) => {
          startFly(px + pw / 2, py + ph / 2, vx + vw / 2, vy + vh / 2);
        });
      });
    } else if (vault && typeof vault.measureInWindow === "function") {
      vault.measureInWindow((vx, vy, vw, vh) => {
        startFly(sw / 2, sh / 2, vx + vw / 2, vy + vh / 2);
      });
    } else {
      fallbackFly();
    }
  }, [
    countT,
    flyEndScale,
    flyEndX,
    flyEndY,
    flyT,
    flying,
    invokeAfterAbsorb,
    metaOpacity,
    phase,
    reduceMotion,
    scrim,
    valueScale,
    vaultRef,
  ]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrim.value * 0.9,
  }));

  const stageStyle = useAnimatedStyle(() => ({
    opacity: stageOpacity.value,
  }));

  const detailStyle = useAnimatedStyle(() => ({
    opacity: detailOpacity.value * metaOpacity.value,
    transform: [{ translateY: detailY.value }],
  }));

  const rankStyle = useAnimatedStyle(() => ({
    opacity: rankOpacity.value,
    transform: [{ translateY: rankY.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const prizeEnterStyle = useAnimatedStyle(() => ({
    opacity: prizeOpacity.value,
    transform: [
      { translateY: prizeY.value },
      { scale: prizeEnterScale.value },
    ],
  }));

  const claimEnterStyle = useAnimatedStyle(() => ({
    opacity: claimOpacity.value * metaOpacity.value,
    transform: [{ translateY: claimY.value }],
  }));

  const flyStyle = useAnimatedStyle(() => {
    if (flying.value < 0.5) {
      return {
        opacity: flyOpacity.value,
        transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
      };
    }
    const t = flyT.value;
    const endX = flyEndX.value;
    const endY = flyEndY.value;
    const dist = Math.hypot(endX, endY) || 1;
    let nx = -endY / dist;
    let ny = endX / dist;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const lift = dist * UNIT_EARN_FLY_ARC;
    const cX = endX * 0.5 + nx * lift;
    const cY = endY * 0.5 + ny * lift;
    const s = 1 - t;
    const x = 2 * s * t * cX + t * t * endX;
    const y = 2 * s * t * cY + t * t * endY;
    const scale = 1 + (flyEndScale.value - 1) * t;
    return {
      opacity: flyOpacity.value * (1 - (1 - 0.92) * t),
      transform: [{ translateX: x }, { translateY: y }, { scale }],
    };
  });

  const valueWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: valueScale.value }],
  }));

  const body = (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[styles.scrim, scrimStyle]} />
      <Animated.View
        pointerEvents="none"
        style={[styles.ring, ringStyle]}
      />
      <Animated.View style={[styles.stage, stageStyle]}>
        {/* 上から: 題名 → UNIT → 獲得（Aperture 入場） */}
        <Animated.View style={[styles.detail, detailStyle]} pointerEvents="none">
          <Text style={styles.context} numberOfLines={2}>
            {reasonTitle}
          </Text>
          {reasonSub ? (
            <Text style={styles.sub} numberOfLines={2}>
              {reasonSub}
            </Text>
          ) : null}
          {rankText ? (
            <Animated.Text style={[styles.rank, rankStyle]}>
              {rankText}
            </Animated.Text>
          ) : null}
        </Animated.View>

        <Animated.View style={prizeEnterStyle}>
          <Animated.View style={[styles.flyRow, flyStyle]} pointerEvents="none">
            <View
              ref={flyMeasureRef}
              collapsable={false}
              style={styles.flyInner}
            >
              <Animated.View style={[styles.amountRow, valueWrapStyle]}>
                <UnitCoinDiscNative size={40} />
                <Animated.Text style={styles.valueText}>{amountLabel}</Animated.Text>
              </Animated.View>
            </View>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.footer, claimEnterStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={claimLabel}
            accessibilityState={{ disabled: phase !== "ready" }}
            disabled={phase !== "ready"}
            onPress={handleClaim}
            style={({ pressed }) => [
              styles.claimBtn,
              phase === "ready" ? styles.claimBtnReady : styles.claimBtnDim,
              phase === "ready" && pressed ? styles.claimBtnPressed : null,
            ]}
          >
            <Text
              style={[
                styles.claimBtnText,
                phase !== "ready" ? styles.claimBtnTextDim : null,
              ]}
            >
              {claimLabel}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );

  if (Platform.OS === "ios") {
    if (!open) return null;
    return <FullWindowOverlay>{body}</FullWindowOverlay>;
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {
        if (phase === "ready") {
          handleClaim();
          return;
        }
        if (!absorbedRef.current) {
          absorbedRef.current = true;
          onAbsorb();
        }
        onDone();
      }}
    >
      {body}
    </Modal>
  );
}

const CYBER_CYAN = "#00F5FF";

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  ring: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    marginTop: -72,
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 1,
    borderColor: "rgba(207,250,254,0.35)",
    zIndex: 0,
  },
  stage: {
    width: "100%",
    maxWidth: 280,
    alignItems: "center",
    zIndex: 1,
  },
  flyRow: {
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  flyInner: {
    alignItems: "center",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  valueText: {
    fontFamily: fonts.metricExtra,
    fontSize: 56,
    fontWeight: "800",
    color: "#ffe9a8",
    letterSpacing: -1.5,
    minWidth: 96,
    textAlign: "left",
    textShadowColor: "rgba(246,195,68,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  detail: {
    width: "100%",
    alignItems: "center",
  },
  context: {
    fontFamily: JP_700,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.94)",
    textAlign: "center",
  },
  sub: {
    marginTop: 6,
    fontFamily: JP_600,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: "rgba(226,246,255,0.78)",
    textAlign: "center",
  },
  rank: {
    marginTop: 12,
    fontFamily: fonts.metricExtra,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#cffafe",
    textAlign: "center",
  },
  footer: {
    marginTop: 28,
    width: "100%",
    alignItems: "center",
  },
  claimBtn: {
    minWidth: 160,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  claimBtnDim: {
    borderColor: "rgba(0,245,255,0.22)",
    backgroundColor: "rgba(0,245,255,0.14)",
    opacity: 0.55,
  },
  claimBtnReady: {
    borderColor: "rgba(0,245,255,0.85)",
    backgroundColor: CYBER_CYAN,
    opacity: 1,
  },
  claimBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  claimBtnText: {
    fontFamily: fonts.metricExtra,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "#041018",
  },
  claimBtnTextDim: {
    color: "rgba(180,230,240,0.5)",
  },
});
