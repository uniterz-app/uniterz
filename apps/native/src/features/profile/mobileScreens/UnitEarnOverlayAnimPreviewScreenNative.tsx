/**
 * Web `UnitEarnOverlayAnimPreviewPage` 相当 —
 * Unit 獲得オーバーレイ入場アニメ案プレビュー。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  UNIT_EARN_OVERLAY_ANIM_SAMPLE,
  UNIT_EARN_OVERLAY_ANIM_VARIANTS,
  type UnitEarnOverlayAnimId,
} from "../../../../../../lib/units/unitEarnOverlayAnimPreview";
import { formatUnitEarnRankOrdinal } from "../../../../../../lib/units/formatUnitEarnRank";
import { fonts } from "../../../theme/tokens";
import { JP_600, JP_700 } from "../reports/reportThemeNative";
import UnitCoinDiscNative from "../UnitCoinDiscNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

const EASE = Easing.bezier(0.25, 1, 0.5, 1);
const SAMPLE_RANK = 8;
const CYBER_CYAN = "#00F5FF";

function AnimDemo({
  animId,
  playKey,
  isJa,
}: {
  animId: UnitEarnOverlayAnimId;
  playKey: number;
  isJa: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [claimReady, setClaimReady] = useState(false);
  const [amount, setAmount] = useState(0);

  const detailOpacity = useSharedValue(0);
  const detailY = useSharedValue(10);
  const detailScale = useSharedValue(1);
  const rankOpacity = useSharedValue(0);
  const rankScale = useSharedValue(1);
  const rankY = useSharedValue(8);
  const prizeOpacity = useSharedValue(0);
  const prizeY = useSharedValue(12);
  const prizeScale = useSharedValue(0.96);
  const footerOpacity = useSharedValue(0);
  const footerY = useSharedValue(8);
  const footerScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.35);
  const prizeGlow = useSharedValue(0);

  const title = isJa
    ? UNIT_EARN_OVERLAY_ANIM_SAMPLE.titleJa
    : UNIT_EARN_OVERLAY_ANIM_SAMPLE.titleEn;
  const subtitle = isJa
    ? UNIT_EARN_OVERLAY_ANIM_SAMPLE.subtitleJa
    : UNIT_EARN_OVERLAY_ANIM_SAMPLE.subtitleEn;
  const claimLabel = isJa ? "獲得する" : "Claim";
  const rankText = useMemo(
    () => formatUnitEarnRankOrdinal(SAMPLE_RANK),
    []
  );

  useEffect(() => {
    setClaimReady(false);
    setAmount(0);

    const markReady = () => setClaimReady(true);

    if (reduceMotion) {
      detailOpacity.value = 1;
      detailY.value = 0;
      detailScale.value = 1;
      rankOpacity.value = 1;
      rankScale.value = 1;
      rankY.value = 0;
      prizeOpacity.value = 1;
      prizeY.value = 0;
      prizeScale.value = 1;
      footerOpacity.value = 1;
      footerY.value = 0;
      footerScale.value = 1;
      ringOpacity.value = 0;
      prizeGlow.value = 0;
      setAmount(UNIT_EARN_OVERLAY_ANIM_SAMPLE.amount);
      markReady();
      return;
    }

    detailOpacity.value = 0;
    detailY.value = 10;
    detailScale.value = 1;
    rankOpacity.value = 0;
    rankScale.value = 1;
    rankY.value = 8;
    prizeOpacity.value = 0;
    prizeY.value = 12;
    prizeScale.value = 0.96;
    footerOpacity.value = 0;
    footerY.value = 8;
    footerScale.value = 1;
    ringOpacity.value = 0;
    ringScale.value = 0.35;
    prizeGlow.value = 0;

    const item = 340;

    if (animId === "cinema") {
      // ブラー代替: わずかなスケール＋遅いフェードで焦点が合う感
      detailScale.value = 1.02;
      rankScale.value = 1.03;
      prizeScale.value = 0.98;
      detailOpacity.value = withDelay(40, withTiming(1, { duration: 550, easing: EASE }));
      detailY.value = withDelay(40, withTiming(0, { duration: 550, easing: EASE }));
      detailScale.value = withDelay(40, withTiming(1, { duration: 550, easing: EASE }));
      rankOpacity.value = withDelay(120, withTiming(1, { duration: 580, easing: EASE }));
      rankY.value = withDelay(120, withTiming(0, { duration: 580, easing: EASE }));
      rankScale.value = withDelay(120, withTiming(1, { duration: 580, easing: EASE }));
      prizeOpacity.value = withDelay(200, withTiming(1, { duration: 600, easing: EASE }));
      prizeY.value = withDelay(200, withTiming(0, { duration: 600, easing: EASE }));
      prizeScale.value = withDelay(200, withTiming(1, { duration: 600, easing: EASE }));
      footerOpacity.value = withDelay(340, withTiming(1, { duration: 400, easing: EASE }));
      footerY.value = withDelay(340, withTiming(0, { duration: 400, easing: EASE }));
    } else if (animId === "lock") {
      rankY.value = 0;
      rankScale.value = 1.04;
      rankOpacity.value = withDelay(20, withTiming(1, { duration: 420, easing: EASE }));
      rankScale.value = withDelay(20, withTiming(1, { duration: 420, easing: EASE }));
      detailOpacity.value = withDelay(180, withTiming(1, { duration: 360, easing: EASE }));
      detailY.value = withDelay(180, withTiming(0, { duration: 360, easing: EASE }));
      prizeOpacity.value = withDelay(280, withTiming(1, { duration: 400, easing: EASE }));
      prizeY.value = withDelay(280, withTiming(0, { duration: 400, easing: EASE }));
      prizeScale.value = withDelay(280, withTiming(1, { duration: 400, easing: EASE }));
      footerOpacity.value = withDelay(400, withTiming(1, { duration: 340, easing: EASE }));
      footerY.value = withDelay(400, withTiming(0, { duration: 340, easing: EASE }));
    } else if (animId === "press") {
      rankY.value = -18;
      rankScale.value = 1.03;
      rankOpacity.value = withDelay(20, withTiming(1, { duration: 360, easing: EASE }));
      rankY.value = withDelay(20, withTiming(0, { duration: 360, easing: EASE }));
      rankScale.value = withDelay(20, withTiming(1, { duration: 360, easing: EASE }));
      detailY.value = -8;
      detailOpacity.value = withDelay(120, withTiming(1, { duration: 320, easing: EASE }));
      detailY.value = withDelay(120, withTiming(0, { duration: 320, easing: EASE }));
      prizeY.value = 14;
      prizeOpacity.value = withDelay(200, withTiming(1, { duration: 400, easing: EASE }));
      prizeY.value = withDelay(200, withTiming(0, { duration: 400, easing: EASE }));
      prizeScale.value = withDelay(200, withTiming(1, { duration: 400, easing: EASE }));
      footerOpacity.value = withDelay(340, withTiming(1, { duration: 320, easing: EASE }));
      footerY.value = withDelay(340, withTiming(0, { duration: 320, easing: EASE }));
    } else if (animId === "depth") {
      detailScale.value = 0.94;
      rankScale.value = 0.92;
      prizeScale.value = 0.9;
      detailY.value = 0;
      rankY.value = 0;
      prizeY.value = 0;
      detailOpacity.value = withDelay(40, withTiming(1, { duration: 500, easing: EASE }));
      detailScale.value = withDelay(40, withTiming(1, { duration: 500, easing: EASE }));
      rankOpacity.value = withDelay(120, withTiming(1, { duration: 520, easing: EASE }));
      rankScale.value = withDelay(120, withTiming(1, { duration: 520, easing: EASE }));
      prizeOpacity.value = withDelay(200, withTiming(1, { duration: 550, easing: EASE }));
      prizeScale.value = withDelay(200, withTiming(1, { duration: 550, easing: EASE }));
      footerScale.value = 0.97;
      footerOpacity.value = withDelay(340, withTiming(1, { duration: 400, easing: EASE }));
      footerScale.value = withDelay(340, withTiming(1, { duration: 400, easing: EASE }));
      footerY.value = 0;
    } else if (animId === "aperture") {
      ringOpacity.value = withSequence(
        withTiming(0.5, { duration: 100, easing: EASE }),
        withTiming(0, { duration: 620, easing: EASE })
      );
      ringScale.value = withTiming(1.7, { duration: 720, easing: EASE });
      detailOpacity.value = withDelay(180, withTiming(1, { duration: 380, easing: EASE }));
      detailY.value = withDelay(180, withTiming(0, { duration: 380, easing: EASE }));
      rankOpacity.value = withDelay(260, withTiming(1, { duration: 400, easing: EASE }));
      rankY.value = withDelay(260, withTiming(0, { duration: 400, easing: EASE }));
      prizeOpacity.value = withDelay(340, withTiming(1, { duration: 420, easing: EASE }));
      prizeY.value = withDelay(340, withTiming(0, { duration: 420, easing: EASE }));
      prizeScale.value = withDelay(340, withTiming(1, { duration: 420, easing: EASE }));
      footerOpacity.value = withDelay(460, withTiming(1, { duration: 340, easing: EASE }));
      footerY.value = withDelay(460, withTiming(0, { duration: 340, easing: EASE }));
    } else if (animId === "gilt") {
      detailOpacity.value = withDelay(40, withTiming(1, { duration: 380, easing: EASE }));
      detailY.value = withDelay(40, withTiming(0, { duration: 380, easing: EASE }));
      rankOpacity.value = withDelay(120, withTiming(1, { duration: 380, easing: EASE }));
      rankY.value = withDelay(120, withTiming(0, { duration: 380, easing: EASE }));
      prizeOpacity.value = withDelay(180, withTiming(1, { duration: 420, easing: EASE }));
      prizeY.value = withDelay(180, withTiming(0, { duration: 420, easing: EASE }));
      prizeScale.value = withDelay(180, withTiming(1, { duration: 420, easing: EASE }));
      prizeGlow.value = withDelay(
        180,
        withSequence(
          withTiming(1, { duration: 280, easing: EASE }),
          withTiming(0, { duration: 420, easing: EASE })
        )
      );
      footerOpacity.value = withDelay(400, withTiming(1, { duration: 360, easing: EASE }));
      footerY.value = withDelay(400, withTiming(0, { duration: 360, easing: EASE }));
    } else if (animId === "stagger") {
      detailOpacity.value = withDelay(50, withTiming(1, { duration: item, easing: EASE }));
      detailY.value = withDelay(50, withTiming(0, { duration: item, easing: EASE }));
      rankOpacity.value = withDelay(130, withTiming(1, { duration: 360, easing: EASE }));
      rankY.value = withDelay(130, withTiming(0, { duration: 360, easing: EASE }));
      prizeOpacity.value = withDelay(180, withTiming(1, { duration: item, easing: EASE }));
      prizeY.value = withDelay(180, withTiming(0, { duration: item, easing: EASE }));
      prizeScale.value = withDelay(180, withTiming(1, { duration: item, easing: EASE }));
      footerOpacity.value = withDelay(280, withTiming(1, { duration: item, easing: EASE }));
      footerY.value = withDelay(280, withTiming(0, { duration: item, easing: EASE }));
    } else if (animId === "burst") {
      prizeY.value = 0;
      prizeScale.value = 0.94;
      prizeOpacity.value = withDelay(40, withTiming(1, { duration: 200, easing: EASE }));
      prizeScale.value = withDelay(
        40,
        withSequence(
          withTiming(1.02, { duration: 280, easing: EASE }),
          withTiming(1, { duration: 180, easing: EASE })
        )
      );
      detailOpacity.value = withDelay(160, withTiming(1, { duration: 340, easing: EASE }));
      detailY.value = withDelay(160, withTiming(0, { duration: 340, easing: EASE }));
      rankOpacity.value = withDelay(240, withTiming(1, { duration: 340, easing: EASE }));
      rankY.value = withDelay(240, withTiming(0, { duration: 340, easing: EASE }));
      footerOpacity.value = withDelay(340, withTiming(1, { duration: 320, easing: EASE }));
      footerY.value = withDelay(340, withTiming(0, { duration: 320, easing: EASE }));
    } else if (animId === "rise") {
      detailY.value = 20;
      rankY.value = 20;
      prizeY.value = 24;
      footerY.value = 18;
      detailOpacity.value = withDelay(40, withTiming(1, { duration: 420, easing: EASE }));
      detailY.value = withDelay(40, withTiming(0, { duration: 420, easing: EASE }));
      rankOpacity.value = withDelay(100, withTiming(1, { duration: 420, easing: EASE }));
      rankY.value = withDelay(100, withTiming(0, { duration: 420, easing: EASE }));
      prizeOpacity.value = withDelay(160, withTiming(1, { duration: 460, easing: EASE }));
      prizeY.value = withDelay(160, withTiming(0, { duration: 460, easing: EASE }));
      prizeScale.value = 1;
      footerOpacity.value = withDelay(240, withTiming(1, { duration: 400, easing: EASE }));
      footerY.value = withDelay(240, withTiming(0, { duration: 400, easing: EASE }));
    } else {
      detailY.value = 0;
      rankY.value = 0;
      prizeY.value = 0;
      footerY.value = 0;
      prizeScale.value = 1;
      detailOpacity.value = withDelay(50, withTiming(1, { duration: 450, easing: EASE }));
      rankOpacity.value = withDelay(120, withTiming(1, { duration: 450, easing: EASE }));
      prizeOpacity.value = withDelay(180, withTiming(1, { duration: 500, easing: EASE }));
      footerOpacity.value = withDelay(260, withTiming(1, { duration: 450, easing: EASE }));
    }

    const countDelay =
      animId === "cinema" || animId === "depth"
        ? 260
        : animId === "soft"
          ? 280
          : animId === "lock" || animId === "press"
            ? 180
            : 220;
    const target = UNIT_EARN_OVERLAY_ANIM_SAMPLE.amount;
    let raf = 0;
    const id = setTimeout(() => {
      const started = Date.now();
      const tick = () => {
        const t = Math.min(1, (Date.now() - started) / 900);
        const eased = 1 - (1 - t) * (1 - t);
        setAmount(Math.floor(target * eased));
        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          setAmount(target);
          markReady();
        }
      };
      raf = requestAnimationFrame(tick);
    }, countDelay);

    return () => {
      clearTimeout(id);
      cancelAnimationFrame(raf);
    };
  }, [
    animId,
    detailOpacity,
    detailScale,
    detailY,
    footerOpacity,
    footerScale,
    footerY,
    playKey,
    prizeGlow,
    prizeOpacity,
    prizeScale,
    prizeY,
    rankOpacity,
    rankScale,
    rankY,
    reduceMotion,
    ringOpacity,
    ringScale,
  ]);

  const detailStyle = useAnimatedStyle(() => ({
    opacity: detailOpacity.value,
    transform: [
      { translateY: detailY.value },
      { scale: detailScale.value },
    ],
  }));
  const rankStyle = useAnimatedStyle(() => ({
    opacity: rankOpacity.value,
    transform: [
      { translateY: rankY.value },
      { scale: rankScale.value },
    ],
  }));
  const prizeStyle = useAnimatedStyle(() => ({
    opacity: prizeOpacity.value,
    transform: [
      { translateY: prizeY.value },
      { scale: prizeScale.value },
    ],
  }));
  const prizeGlowStyle = useAnimatedStyle(() => ({
    opacity: prizeGlow.value * 0.35,
  }));
  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
    transform: [
      { translateY: footerY.value },
      { scale: footerScale.value },
    ],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <View style={styles.demo}>
      <View style={styles.demoScrim} />
      <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />
      <View style={styles.demoInner}>
        <Animated.View style={[styles.detail, detailStyle]}>
          <Text style={styles.context}>{title}</Text>
          <Text style={styles.sub}>{subtitle}</Text>
        </Animated.View>
        <Animated.Text style={[styles.rank, rankStyle]}>
          {rankText}
        </Animated.Text>
        <View style={styles.prizeWrap}>
          <Animated.View
            pointerEvents="none"
            style={[styles.prizeGlow, prizeGlowStyle]}
          />
          <Animated.View style={[styles.prize, prizeStyle]}>
            <UnitCoinDiscNative size={40} />
            <Text style={styles.amount}>
              <Text style={styles.plus}>+</Text>
              {amount}
            </Text>
          </Animated.View>
        </View>
        <Animated.View style={[styles.footer, footerStyle]}>
          <View
            style={[
              styles.claim,
              claimReady ? styles.claimReady : styles.claimDim,
            ]}
          >
            <Text
              style={[
                styles.claimText,
                !claimReady ? styles.claimTextDim : null,
              ]}
            >
              {claimLabel}
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

export default function UnitEarnOverlayAnimPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const [plays, setPlays] = useState<Record<string, number>>({});

  const replay = useCallback((id: UnitEarnOverlayAnimId) => {
    setPlays((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backText}>{isJa ? "戻る" : "Back"}</Text>
        </Pressable>
        <Text style={styles.topTitle}>
          {isJa ? "Unit 獲得アニメ案" : "Unit earn anims"}
        </Text>
        <View style={{ width: 52 }} />
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={styles.lead}>
          {isJa
            ? "上段が上質枠（跳ね・フラッシュなし）。再生で比較。"
            : "Premium variants on top — no bounce or flash. Replay to compare."}
        </Text>
        {UNIT_EARN_OVERLAY_ANIM_VARIANTS.map((v) => (
          <View
            key={v.id}
            style={[styles.card, v.premium ? styles.cardPremium : null]}
          >
            <View style={styles.cardHead}>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>
                    {isJa ? v.nameJa : v.nameEn}
                  </Text>
                  {v.premium ? (
                    <Text style={styles.premiumBadge}>PREMIUM</Text>
                  ) : null}
                </View>
                <Text style={styles.cardNote}>
                  {isJa ? v.noteJa : v.noteEn}
                </Text>
              </View>
              <Pressable
                onPress={() => replay(v.id)}
                style={styles.replayBtn}
              >
                <Text style={styles.replayText}>
                  {isJa ? "再生" : "Replay"}
                </Text>
              </Pressable>
            </View>
            <AnimDemo
              animId={v.id}
              playKey={plays[v.id] ?? 0}
              isJa={isJa}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#05080c",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  backBtn: {
    minWidth: 52,
  },
  backText: {
    fontFamily: JP_700,
    fontSize: 14,
    color: CYBER_CYAN,
  },
  topTitle: {
    fontFamily: fonts.metricExtra,
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },
  scroll: {
    paddingHorizontal: 14,
    gap: 16,
  },
  lead: {
    fontFamily: JP_600,
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 18,
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0a1218",
    overflow: "hidden",
  },
  cardPremium: {
    borderColor: "rgba(0,245,255,0.25)",
  },
  cardHead: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontFamily: fonts.metricExtra,
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
  premiumBadge: {
    fontFamily: fonts.metricExtra,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(207,250,254,0.9)",
    backgroundColor: "rgba(0,245,255,0.14)",
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardNote: {
    marginTop: 4,
    fontFamily: JP_600,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 17,
  },
  replayBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    backgroundColor: "rgba(0,245,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  replayText: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    fontWeight: "800",
    color: "#cffafe",
    letterSpacing: 1,
  },
  demo: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  demoScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
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
    zIndex: 1,
  },
  demoInner: {
    width: "100%",
    maxWidth: 260,
    alignItems: "center",
    zIndex: 2,
  },
  detail: {
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
    color: "rgba(226,246,255,0.78)",
    textAlign: "center",
  },
  rank: {
    marginTop: 12,
    fontFamily: fonts.metricExtra,
    fontSize: 32,
    fontWeight: "800",
    color: "#cffafe",
    textAlign: "center",
  },
  prizeWrap: {
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  prizeGlow: {
    position: "absolute",
    width: 160,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(246,195,68,0.45)",
  },
  prize: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  amount: {
    fontFamily: fonts.metricExtra,
    fontSize: 48,
    fontWeight: "800",
    color: "#ffe9a8",
  },
  plus: {
    color: "#f6c344",
  },
  footer: {
    marginTop: 28,
  },
  claim: {
    minWidth: 160,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  claimDim: {
    borderColor: "rgba(0,245,255,0.22)",
    backgroundColor: "rgba(0,245,255,0.14)",
    opacity: 0.55,
  },
  claimReady: {
    borderColor: "rgba(0,245,255,0.85)",
    backgroundColor: CYBER_CYAN,
    opacity: 1,
  },
  claimText: {
    fontFamily: fonts.metricExtra,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "#041018",
  },
  claimTextDim: {
    color: "rgba(180,230,240,0.5)",
  },
});
