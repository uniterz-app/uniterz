import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cyberAlert } from "../../../components/cyberAlert";
import {
  Image, Platform, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle,
} from "react-native";
import UnitEarnOverlayNative from "../UnitEarnOverlayNative";
import { useUnitEarnOverlayNative } from "../useUnitEarnOverlayNative";
import { unitVaultUiBalance } from "../../../../../../lib/units/unitVaultDisplay";
import { UNIT_EARN_VAULT_COUNT_MS, unitEarnCountDisplayValue } from "../../../../../../lib/units/unitEarnMotion";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useReducedMotion } from "react-native-reanimated";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { ProfileEditKinetikStats } from "../../../../../../app/component/profile/edit/profileEditKinetikTypes";
import type { ProfileEditTronIdentity } from "../../../../../../app/component/profile/edit/profileEditTronTypes";
import {
  resolveKinetikMenuAccent,
  resolveKinetikProfileAccent,
  resolveKinetikRankBadge,
  type KinetikRankBadgeResult,
  type KinetikRankBadgeTier,
} from "../../../../../../app/component/profile/edit/kinetikRankBadge";
import {
  proBridgeBadgeEnterDelayMs,
  proBridgeBadgeFloatDelayMs,
  resolveProBridgeBadgeLayout,
  shouldProBridgeBadgeNudgeScroll,
  shouldProBridgeBadgeScroll,
} from "../../../../../../lib/profile/profileBadgeBridgeLayout";
import { KINETIK_AVATAR_MOBILE } from "./kinetikAvatarNativeMetrics";
import {
  formatKinetikWinStreakLabel,
  getKinetikWinStreakExplanation,
} from "../../../../../../app/component/profile/edit/kinetikStreakFx";
import { getKinetikRankBadgeExplanation } from "../../../../../../app/component/profile/edit/kinetikRankBadge";
import { formatProfileMemberSince } from "../../../../../../lib/profile/formatProfileMemberSince";
import {
  useKinetikMetricCountUp,
  type KinetikMetricCountFormat,
} from "../../../../../../lib/hooks/useKinetikMetricCountUp";
import {
  formatProfileMetricDayDelta,
  profileMetricDeltaTone,
} from "../../../../../../lib/profile/formatProfileMetricDelta";
import type { MyRankMetricValueDeltas } from "../../../../../../lib/rankings/myRankMetricValueDeltas";
import type { RankingLeagueSource } from "../../../../../../lib/rankings/rankingLeagueSource";
import {
  KINETIK_UPSET_METRIC_LABEL,
  kinetikMetricLabelUsesLatinUppercase,
} from "../../../../../../lib/profile/kinetikMetricDisplay";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { RankingsPeriodLabelNavNative } from "../../rankings/RankingsPeriodLabelNavNative";
import {
  getKinetikMetricsScopeHint,
  type ProfileKinetikMetricsTab,
} from "../../../../../../lib/profile/useNbaKinetikMonthlyStats";
import { currentRankingPeriodLabel } from "../../../../../../lib/rankings/rankingPeriod";
import { rankingFlagImageUri } from "../../rankings/rankingFlagUri";
import { getUniterzApiBaseUrl } from "../../games/submitPredictionApi";
import { buildProfileShareUrl } from "../../../../../../lib/share/shareAppUrls";
import type { ResolvedBadgeNative } from "../useNativeProfileBadges";
import {
  KINETIK_METRIC_GOLD,
  KINETIK_SLANT_TAB_RANK,
  KINETIK_SLANT_TAB_ROW_H,
  KINETIK_SLANT_TAB_STREAK,
  kinetikPanelBorderColor,
  kinetikPlanProFrameTheme,
  type KinetikMetricAccent,
} from "./profileKinetikNativeTheme";
import ProCyberBadgeNative from "./ProCyberBadgeNative";
import ProfileKinetikAvatarWithStreakNative from "./ProfileKinetikAvatarWithStreakNative";
import ResultImpactStreakTagNative from "../../results/ResultImpactStreakTagNative";
import ProfilePlanProBackgroundNative from "./ProfilePlanProBackgroundNative";
import {
  KINETIK_FLIP_EAR,
  ProfileKinetikFlipEarNative,
  ProfileKinetikFlipEarTopEdgesNative,
  useProfileKinetikFlipEar,
} from "./ProfileKinetikFlipEarNative";
import { LinearGradient } from "expo-linear-gradient";
import {
  PROFILE_PLAN_PRO_BG_DEFAULT,
  type ProfilePlanProBgVariant,
} from "../../../../../../lib/profile/profilePlanProBgVariants";
import { isProfilePlanProScaleBgVariant } from "../../../../../../lib/profile/profilePlanProScaleBgVariants";
import { isProfilePlanProBeastBgVariant } from "../../../../../../lib/profile/profilePlanProBeastBgVariants";
import { isProfilePlanProCosmosBgVariant } from "../../../../../../lib/profile/profilePlanProCosmosBgVariants";
import { isProfilePlanProFormBgVariant } from "../../../../../../lib/profile/profilePlanProFormBgVariants";
import { isProfilePlanProNeoBgVariant } from "../../../../../../lib/profile/profilePlanProNeoBgVariants";
import { isProfilePlanProFuturisticBgVariant } from "../../../../../../lib/profile/profilePlanProFuturisticBgVariants";
import { isProfilePlanProLabBgVariant } from "../../../../../../lib/profile/profilePlanProLabBgVariants";
import { isProfilePlanProWaveBgVariant } from "../../../../../../lib/profile/profilePlanProWaveBgVariants";
import TutorialTargetNative from "../../tutorial/TutorialTargetNative";

const OXANIUM_BOLD = "Oxanium_700Bold";
const OXANIUM_EXTRA = "Oxanium_800ExtraBold";
const UNIT_VAULT_GOLD = "#f6c344";
function kinetikWinRateSegs(winRate: number): number {
  return Math.round((Math.min(100, Math.max(0, winRate)) / 100) * 5);
}

function kinetikTotalPointsRankSegs(
  rank: number | null | undefined,
  denominator: number | null | undefined
): number {
  if (
    typeof rank !== "number" ||
    !Number.isFinite(rank) ||
    typeof denominator !== "number" ||
    !Number.isFinite(denominator) ||
    rank < 1 ||
    denominator < 1
  ) {
    return 0;
  }
  const safeRank = Math.min(Math.floor(rank), Math.floor(denominator));
  const safeDenom = Math.floor(denominator);
  const ratio = (safeDenom - safeRank + 1) / safeDenom;
  return Math.max(0, Math.min(5, Math.round(ratio * 5)));
}

function MetricRectFrameNative({
  color,
  inset,
}: {
  color: string;
  inset: number;
}) {
  const edge = { backgroundColor: color } as const;
  return (
    <View
      pointerEvents="none"
      style={[styles.metricFrameHost, { top: inset, right: inset, bottom: inset, left: inset }]}
    >
      <View style={[styles.metricFrameH, styles.metricFrameTop, edge]} />
      <View style={[styles.metricFrameH, styles.metricFrameBottom, edge]} />
      <View style={[styles.metricFrameV, styles.metricFrameLeft, edge]} />
      <View style={[styles.metricFrameV, styles.metricFrameRight, edge]} />
    </View>
  );
}

function KinetikMetricCardNative({
  label,
  value,
  countTarget,
  countFormat,
  countDecimals = 0,
  valuesPending = false,
  rankLabel,
  footnote,
  accent: _accent,
  filledSegs: _filledSegs,
  showSegBar: _showSegBar = false,
  segmentsReady = true,
  unit,
  unitHint,
  dayDelta,
  dayDeltaTone,
  rankBelowSegBar: _rankBelowSegBar = false,
  compact = false,
  isPlanPro = false,
  language: _language = "ja",
}: {
  label: string;
  value?: string;
  countTarget?: number;
  countFormat?: KinetikMetricCountFormat;
  countDecimals?: number;
  valuesPending?: boolean;
  rankLabel?: string;
  footnote?: string;
  accent: KinetikMetricAccent;
  filledSegs?: number;
  showSegBar?: boolean;
  segmentsReady?: boolean;
  unit?: string;
  unitHint?: string;
  dayDelta?: string | null;
  dayDeltaTone?: "up" | "down" | null;
  rankBelowSegBar?: boolean;
  compact?: boolean;
  isPlanPro?: boolean;
  language?: "ja" | "en";
}) {
  const reduceMotion = useReducedMotion() === true;
  const useCount = countFormat != null && countTarget != null;
  const countedValue = useKinetikMetricCountUp(
    useCount ? valuesPending : true,
    countTarget ?? 0,
    countFormat ?? "int",
    countDecimals,
    reduceMotion
  );
  const displayValue = useCount
    ? countedValue
    : valuesPending
      ? "—"
      : (value ?? "—");
  const valueHasUnit = displayValue.includes("%");
  const labelLatinUpper = kinetikMetricLabelUsesLatinUppercase(label);
  const goldInk = isPlanPro ? KINETIK_METRIC_GOLD : "#FFFFFF";
  const goldMuted = isPlanPro ? "rgba(232,198,106,0.62)" : "rgba(255,255,255,0.55)";
  const rankBadge =
    rankLabel && segmentsReady ? (
      <View
        style={[
          styles.metricRankBadge,
          isPlanPro && styles.metricRankBadgeGold,
        ]}
      >
        <Text
          style={[
            styles.metricRankBadgeText,
            isPlanPro && styles.metricRankBadgeTextGold,
          ]}
        >
          {rankLabel}
        </Text>
      </View>
    ) : null;

  return (
    <View
      style={[
        styles.metricCard,
        compact && styles.metricCardCompact,
      ]}
    >
      <MetricRectFrameNative
        color={isPlanPro ? "#C9A84B" : "rgba(255,255,255,0.22)"}
        inset={1}
      />
      <MetricRectFrameNative
        color={isPlanPro ? "rgba(201,168,75,0.55)" : "rgba(255,255,255,0.28)"}
        inset={4}
      />
      <View style={styles.metricLabelRow}>
        <Text
          style={[
            styles.metricLabel,
            labelLatinUpper ? styles.metricLabelLatin : styles.metricLabelCjk,
            { color: isPlanPro ? "rgba(232,198,106,0.72)" : "rgba(255,255,255,0.62)" },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {unitHint ? (
          <Text
            style={[
              styles.metricUnitHint,
              { color: isPlanPro ? "rgba(232,198,106,0.5)" : "rgba(255,255,255,0.38)" },
            ]}
            numberOfLines={1}
          >
            {unitHint}
          </Text>
        ) : null}
      </View>
      <View style={[styles.metricValueRow, compact && styles.metricValueRowCompact]}>
        <Text style={[styles.metricValue, { color: goldInk }]}>{displayValue}</Text>
        {unit && !valueHasUnit ? (
          <Text style={[styles.metricUnit, { color: goldMuted }]}>{unit}</Text>
        ) : null}
        {dayDelta ? (
          <Text
            style={[
              styles.metricDelta,
              dayDeltaTone === "up"
                ? styles.metricDeltaUp
                : dayDeltaTone === "down"
                  ? styles.metricDeltaDown
                  : null,
            ]}
          >
            {dayDelta}
          </Text>
        ) : null}
        {rankBadge}
      </View>
      {footnote ? (
        <Text
          style={[
            styles.metricFootnote,
            { color: isPlanPro ? "rgba(232,198,106,0.55)" : "rgba(255,255,255,0.62)" },
          ]}
        >
          {footnote}
        </Text>
      ) : null}
    </View>
  );
}

/** Web `.profile-edit-kinetik-slant-tab__scan` — 2px 透明 + 1px 線の 3px 周期 */
const SLANT_TAB_SCAN_STEP = 3;
const SLANT_TAB_SCAN_START = 2;

function slantTabScanLineCount(height: number): number {
  return Math.max(
    0,
    Math.floor((height - SLANT_TAB_SCAN_START - 1) / SLANT_TAB_SCAN_STEP) + 1
  );
}

function SlantTabScanNative() {
  const count = slantTabScanLineCount(KINETIK_SLANT_TAB_ROW_H);
  return (
    <View style={styles.slantTabScan} pointerEvents="none">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.slantTabScanLine,
            { top: SLANT_TAB_SCAN_START + i * SLANT_TAB_SCAN_STEP },
          ]}
        />
      ))}
    </View>
  );
}

function KinetikSlantTabNative({
  label,
  variant,
  rankTier,
  streakTier,
  explanation,
  language,
  onPress,
}: {
  label: string;
  variant: "filled" | "outline";
  rankTier?: KinetikRankBadgeTier;
  streakTier?: 1 | 2 | 3 | 4;
  explanation?: string;
  language: "ja" | "en";
  onPress?: () => void;
}) {
  const rankTheme = rankTier ? KINETIK_SLANT_TAB_RANK[rankTier] : null;
  const streakTheme = streakTier ? KINETIK_SLANT_TAB_STREAK[streakTier] : null;
  const filled = variant === "filled";
  const accent = filled
    ? (rankTheme?.accent ?? "#00f5ff")
    : (streakTheme?.accent ?? "#ccff00");
  const glow = filled
    ? (rankTheme?.glow ?? "rgba(0, 245, 255, 0.42)")
    : (streakTheme?.glow ?? "rgba(204, 255, 0, 0.35)");
  const textColor = filled ? (rankTheme?.fillText ?? "#050508") : accent;

  const glowShadowStyle = Platform.select({
    ios: {
      shadowColor: glow,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: filled ? 16 : 10,
    },
    android: { elevation: 0 },
    default: {},
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={explanation ?? label}
      style={({ pressed }) => [pressed && onPress ? { opacity: 0.88 } : null]}
    >
      <View style={[styles.slantTabOuter, glowShadowStyle]}>
        <View
          style={[
          styles.slantTab,
          filled
            ? {
                backgroundColor: accent,
                borderWidth: 0,
              }
            : {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: accent,
              },
        ]}
      >
        {filled ? <SlantTabScanNative /> : null}
        <Text
          style={[
            styles.slantTabText,
            { color: textColor },
            filled ? styles.slantTabTextFilled : null,
            !filled && language === "en" ? styles.slantTabTextEn : null,
            !filled && language === "ja" ? styles.slantTabTextJaStreak : null,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </View>
    </Pressable>
  );
}

function KinetikHeaderTabsNative({
  rankBadge,
  winStreak,
  language,
}: {
  rankBadge: KinetikRankBadgeResult | null;
  winStreak: number;
  language: "ja" | "en";
}) {
  const streakLabel = formatKinetikWinStreakLabel(winStreak, language);
  if (!rankBadge && !streakLabel) return null;

  const showTagExplanation = useCallback(
    (message: string) => {
      const [title, ...rest] = message.split("\n");
      cyberAlert(title, rest.join("\n").trim() || undefined);
    },
    []
  );

  return (
    <View style={styles.headerTabs}>
      {rankBadge ? (
        <KinetikSlantTabNative
          label={rankBadge.label}
          variant="filled"
          rankTier={rankBadge.tier}
          explanation={getKinetikRankBadgeExplanation(rankBadge, language)}
          language={language}
          onPress={() =>
            showTagExplanation(
              getKinetikRankBadgeExplanation(rankBadge, language)
            )
          }
        />
      ) : null}
      {streakLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={streakLabel}
          onPress={() =>
            showTagExplanation(getKinetikWinStreakExplanation(winStreak, language))
          }
          style={({ pressed }) => [pressed ? { opacity: 0.85 } : null]}
        >
          <ResultImpactStreakTagNative winStreak={winStreak} />
        </Pressable>
      ) : null}
    </View>
  );
}

function KinetikHeaderHatch() {
  return (
    <View pointerEvents="none" style={styles.headerHatch}>
      {Array.from({ length: 12 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.headerHatchLine,
            { top: i * 5, transform: [{ rotate: "-35deg" }, { translateX: i * 2 }] },
          ]}
        />
      ))}
    </View>
  );
}

const PRO_BRIDGE_FLOAT_PHASE_STAGGER = 5;
const PRO_BRIDGE_BADGE_GAP = 10;
/** Web `profile-kinetik-badge-enter` — cubic-bezier(0.22, 1, 0.36, 1) */
const BADGE_ENTER_EASE = Easing.bezier(0.22, 1, 0.36, 1);
/** Web `profile-kinetik-badge-float` 3.4s の片道 */
const BADGE_FLOAT_HALF_MS = 1700;
/** Web float 振幅（-6px）＋盾型など先端が枠いっぱいのバッジ用バッファ */
const BADGE_FLOAT_TRAVEL_PX = 6;
const BADGE_FLOAT_TOP_CLEARANCE_PX = BADGE_FLOAT_TRAVEL_PX + 8;

/**
 * Web と同じく入場ラッパーとフロート本体を分離する。
 * 同一 transform に合成すると入場後も scale/translate が干渉して動きが崩れる。
 */
function KinetikBadgeProBridgeWrapNative({
  index,
  paused = false,
  children,
}: {
  index: number;
  /** Unit 獲得演出中など — フロートを止めて負荷を下げる */
  paused?: boolean;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const enter = useSharedValue(reduceMotion ? 1 : 0);
  const floatY = useSharedValue(0);
  const enteredRef = useRef(false);

  useEffect(() => {
    cancelAnimation(enter);
    cancelAnimation(floatY);

    if (reduceMotion || paused) {
      enter.value = 1;
      floatY.value = 0;
      enteredRef.current = true;
      return;
    }

    const enterDelayMs = enteredRef.current
      ? 0
      : proBridgeBadgeEnterDelayMs(index);
    const floatDelayMs = enteredRef.current
      ? 0
      : proBridgeBadgeFloatDelayMs(index) +
        (index % PRO_BRIDGE_FLOAT_PHASE_STAGGER) * 80;

    if (!enteredRef.current) {
      enter.value = 0;
      enter.value = withDelay(
        enterDelayMs,
        withTiming(1, { duration: 580, easing: BADGE_ENTER_EASE })
      );
      enteredRef.current = true;
    } else {
      enter.value = 1;
    }

    floatY.value = 0;
    /** Web: `animation: profile-kinetik-badge-float 3.4s ease-in-out infinite` */
    floatY.value = withDelay(
      floatDelayMs,
      withRepeat(
        withTiming(-BADGE_FLOAT_TRAVEL_PX, {
          duration: BADGE_FLOAT_HALF_MS,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );

    return () => {
      cancelAnimation(enter);
      cancelAnimation(floatY);
    };
  }, [enter, floatY, index, paused, reduceMotion]);

  const enterStyle = useAnimatedStyle(() => {
    const enterT = enter.value;
    return {
      opacity: enterT,
      transform: [
        { translateX: (1 - enterT) * -18 },
        { translateY: (1 - enterT) * 10 },
        { scale: 0.86 + enterT * 0.14 },
      ],
    };
  });

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View style={[styles.badgeEnterWrap, enterStyle]}>
      <Animated.View style={[styles.badgeFloatWrap, floatStyle]}>{children}</Animated.View>
    </Animated.View>
  );
}

function proBridgeRowStyle(layout: ReturnType<typeof resolveProBridgeBadgeLayout>) {
  switch (layout) {
    case "one":
    case "two":
    case "three":
    case "four":
      return styles.badgeRowProBridgeCentered;
    default:
      return styles.badgeRowProBridgeScroll;
  }
}

function proBridgeRowGap(layout: ReturnType<typeof resolveProBridgeBadgeLayout>): number {
  switch (layout) {
    case "two":
      return 14;
    case "three":
      return 12;
    case "four":
      return 10;
    default:
      return PRO_BRIDGE_BADGE_GAP;
  }
}

/** 5 個時 — 約 4.35 個分の幅で軽くスライド */
const PRO_BRIDGE_NUDGE_WIDTH = Math.round(60 * 4.35 + PRO_BRIDGE_BADGE_GAP * 4);

function KinetikBadgeFloatWrapNative({
  index,
  paused = false,
  children,
}: {
  index: number;
  paused?: boolean;
  children: ReactNode;
}) {
  return (
    <KinetikBadgeProBridgeWrapNative
      index={index}
      paused={paused}
    >
      {children}
    </KinetikBadgeProBridgeWrapNative>
  );
}

function KinetikBadgeRowNative({
  badges,
  onBadgePress,
  inline = false,
  variant = "default",
  motionPaused = false,
}: {
  badges: ResolvedBadgeNative[];
  onBadgePress?: (badge: ResolvedBadgeNative) => void;
  inline?: boolean;
  variant?: "default" | "proBridge";
  motionPaused?: boolean;
}) {
  if (badges.length === 0) {
    return inline ? null : <View style={styles.badgeRowEmpty} />;
  }

  const isProBridge = variant === "proBridge";

  const badgeItems = badges.slice(0, 10).map((badge, index) => {
    const thumb = (
      <Pressable
        style={[
          styles.badgeThumb,
          inline ? styles.badgeThumbInline : null,
          isProBridge ? styles.badgeThumbProBridge : null,
        ]}
        onPress={() => onBadgePress?.(badge)}
        accessibilityRole="button"
        accessibilityLabel={badge.title}
      >
        {badge.icon ? (
          <Image source={{ uri: badge.icon }} style={styles.badgeImg} resizeMode="contain" />
        ) : (
          <Text style={styles.badgeFallbackText} numberOfLines={2}>
            {badge.title}
          </Text>
        )}
      </Pressable>
    );

    if (!isProBridge) {
      return <View key={badge.id}>{thumb}</View>;
    }

    return (
      <KinetikBadgeFloatWrapNative
        key={badge.id}
        index={index}
        paused={motionPaused}
      >
        {thumb}
      </KinetikBadgeFloatWrapNative>
    );
  });

  if (isProBridge) {
    const badgeCount = badges.length;
    const layoutMode = resolveProBridgeBadgeLayout(badgeCount);
    const useScroll = shouldProBridgeBadgeScroll(badgeCount);
    const nudgeScroll = shouldProBridgeBadgeNudgeScroll(badgeCount);
    const rowGap = proBridgeRowGap(layoutMode);

    if (!useScroll) {
      return (
        <View style={styles.badgeScrollProBridgeWrap}>
          <View style={[proBridgeRowStyle(layoutMode), { gap: rowGap }]}>
            {badgeItems}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.badgeScrollProBridgeWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[
            styles.badgeScrollProBridge,
            nudgeScroll ? { maxWidth: PRO_BRIDGE_NUDGE_WIDTH } : null,
          ]}
          contentContainerStyle={[styles.badgeRowProBridgeScroll, { gap: rowGap }]}
          nestedScrollEnabled
        >
          {badgeItems}
        </ScrollView>
        <LinearGradient
          colors={["rgba(3,8,13,0.96)", "rgba(3,8,13,0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.badgeScrollFadeLeft}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["rgba(3,8,13,0)", "rgba(3,8,13,0.96)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.badgeScrollFadeRight}
          pointerEvents="none"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        inline ? styles.badgeRowInline : styles.badgeRow,
      ]}
    >
      {badgeItems}
    </View>
  );
}

const KINETIK_FRAME_DIM = "rgba(255, 255, 255, 0.28)";
const FOOTER_REF_FONT = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

function KinetikFooterRef({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.footerRef, style]}>{children}</View>;
}

function KinetikIdentityIdChipNative({
  idLabel,
  shareCopied,
  copiedLabel,
  shareLabel,
  onShare,
  pressableStyle,
  footerRefStyle,
  compact = false,
}: {
  idLabel: string;
  shareCopied: boolean;
  copiedLabel: string;
  shareLabel: string;
  onShare: () => void;
  pressableStyle?: ViewStyle;
  footerRefStyle?: ViewStyle;
  compact?: boolean;
}) {
  if (!idLabel) return null;

  return (
    <Pressable
      onPress={onShare}
      accessibilityRole="button"
      accessibilityLabel={shareLabel}
      style={[styles.identityIdPress, pressableStyle]}
    >
      <KinetikFooterRef
        style={[
          compact ? styles.footerRefIdentity : styles.identityIdRef,
          footerRefStyle,
        ]}
      >
        <Text
          style={compact ? styles.footerRefTextIdentity : styles.footerRefText}
          numberOfLines={compact ? undefined : 1}
          ellipsizeMode={compact ? undefined : "tail"}
        >
          {shareCopied ? copiedLabel : `ID: ${idLabel}`}
        </Text>
      </KinetikFooterRef>
    </Pressable>
  );
}

/** Web の Unit コインアニメ秒数（CSS keyframes と揃える） */
const UNIT_COIN_GLOW_HALF_MS = 1400;
const UNIT_COIN_SHEEN_CYCLE_MS = 3600;
const UNIT_COIN_SHEEN_SWEEP_MS = 580;
const UNIT_COIN_SHEEN_HOLD_MS = Math.round(UNIT_COIN_SHEEN_CYCLE_MS * 0.55);

function formatVaultBalance(n: number): string {
  return Math.max(0, Math.floor(n)).toLocaleString("en-US");
}

/** Web `ProfileUnitVault` 相当 — 金貨ディスク + イタリック数字（U8） */
const KinetikUnitVaultNative = forwardRef<
  View,
  {
    balance: number;
    ariaLabel: string;
    corner?: boolean;
    onPress?: () => void;
    absorbPulse?: boolean;
    /** false のあいだは数字を固定（中央の獲得演出中） */
    countUpEnabled?: boolean;
    /** Web `html.unit-earn-playing` 相当 — 獲得演出中は常時ループを止める */
    effectsPaused?: boolean;
    /** 加算カウント中（背景ループ停止用） */
    onCountBusyChange?: (busy: boolean) => void;
  }
>(function KinetikUnitVaultNative(
  {
    balance,
    ariaLabel,
    corner,
    onPress,
    absorbPulse = false,
    countUpEnabled = true,
    effectsPaused = false,
    onCountBusyChange,
  },
  ref
) {
  /** Web corner: 18px disc / 16px value — PRO バッジ高さと揃える */
  const disc = corner ? 18 : 28;
  const inner = corner ? 13 : 20;
  const reduceMotion = useReducedMotion();
  /**
   * ヒットでラッチし、オーバーレイ退出後も加算カウントを完走させる。
   * （absorbPulse だけだと dismiss で即切れ、カウントが見えない）
   */
  const [countLatch, setCountLatch] = useState(false);
  const [label, setLabel] = useState(() => formatVaultBalance(balance));
  const shownRef = useRef(balance);
  const onBusyRef = useRef(onCountBusyChange);
  onBusyRef.current = onCountBusyChange;

  useEffect(() => {
    if (absorbPulse) {
      setCountLatch(true);
      return;
    }
    if (!countUpEnabled) setCountLatch(false);
  }, [absorbPulse, countUpEnabled]);

  const counting =
    countUpEnabled && !reduceMotion && (absorbPulse || countLatch);

  useEffect(() => {
    onBusyRef.current?.(counting);
  }, [counting]);

  /**
   * AnimatedTextInput は使わない（Hermes hades GC の TextInputState 連鎖で SIGBUS するため）。
   * 表示は間引き、整数が変わったときだけ Text を更新する。
   */
  useEffect(() => {
    const end = Math.max(0, Math.floor(balance));
    if (!counting) {
      shownRef.current = end;
      setLabel(formatVaultBalance(end));
      return;
    }
    const start = shownRef.current;
    if (end <= start) {
      shownRef.current = end;
      setLabel(formatVaultBalance(end));
      return;
    }

    let raf = 0;
    let lastShown = -1;
    const t0 = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - t0) / UNIT_EARN_VAULT_COUNT_MS);
      const eased = 1 - (1 - t) ** 3;
      const n = unitEarnCountDisplayValue(start, end, eased);
      if (n !== lastShown) {
        lastShown = n;
        shownRef.current = n;
        setLabel(formatVaultBalance(n));
      }
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        shownRef.current = end;
        setLabel(formatVaultBalance(end));
        setCountLatch(false);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [balance, counting]);

  /** 復帰マウントで入場アニメをやり直さない（獲得演出の硬さ対策） */
  const enter = useSharedValue(1);
  const absorb = useSharedValue(1);
  const glow = useSharedValue(0);
  const sheenX = useSharedValue(-1.4);
  const sheenOpacity = useSharedValue(0);

  useEffect(() => {
    if (!absorbPulse || reduceMotion) {
      absorb.value = 1;
      return;
    }
    absorb.value = withSequence(
      withTiming(1.14, {
        duration: 160,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(1, {
        duration: 160,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [absorb, absorbPulse, reduceMotion]);

  useEffect(() => {
    cancelAnimation(glow);
    cancelAnimation(sheenX);
    cancelAnimation(sheenOpacity);

    if (reduceMotion || effectsPaused) {
      glow.value = 0;
      sheenX.value = -1.4;
      sheenOpacity.value = 0;
      return;
    }

    /** タブ復帰直後はレイアウトが落ち着いてからループ開始 */
    const settleId = setTimeout(() => {
      /** Web: `profile-unit-coin-glow 2.8s` */
      glow.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: UNIT_COIN_GLOW_HALF_MS,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: UNIT_COIN_GLOW_HALF_MS,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );

      /** Web: `profile-unit-coin-sheen 3.6s` */
      sheenX.value = -1.4;
      sheenOpacity.value = 0;
      sheenX.value = withRepeat(
        withSequence(
          withDelay(
            UNIT_COIN_SHEEN_HOLD_MS,
            withTiming(2.2, {
              duration: UNIT_COIN_SHEEN_SWEEP_MS,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          withTiming(-1.4, { duration: 0 })
        ),
        -1,
        false
      );
      sheenOpacity.value = withRepeat(
        withSequence(
          withDelay(UNIT_COIN_SHEEN_HOLD_MS, withTiming(0.85, { duration: 80 })),
          withTiming(0, {
            duration: UNIT_COIN_SHEEN_SWEEP_MS - 80,
            easing: Easing.in(Easing.ease),
          }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      );
    }, 480);

    return () => {
      clearTimeout(settleId);
      cancelAnimation(glow);
      cancelAnimation(sheenX);
      cancelAnimation(sheenOpacity);
    };
  }, [effectsPaused, glow, reduceMotion, sheenOpacity, sheenX]);

  const rootStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ scale: absorb.value }],
  }));

  const discStyle = useAnimatedStyle(() => {
    const g = glow.value;
    return {
      transform: [{ scale: 1 + g * 0.05 }],
      shadowOpacity: 0.38 + g * 0.37,
      shadowRadius: 6 + g * 6,
    };
  });

  const sheenStyle = useAnimatedStyle(() => ({
    opacity: sheenOpacity.value,
    transform: [
      { translateX: sheenX.value * disc },
      { rotate: "18deg" },
    ],
  }));

  const valueGlowStyle = useAnimatedStyle(() => ({
    textShadowRadius: 6 + glow.value * 6,
    textShadowColor: `rgba(246,195,68,${0.4 + glow.value * 0.32})`,
  }));

  return (
    <View ref={ref} collapsable={false}>
      <Animated.View
        style={[styles.unitVault, corner ? styles.unitVaultCorner : null, rootStyle]}
        accessibilityRole={onPress ? "button" : "text"}
        accessibilityLabel={ariaLabel}
        accessibilityHint={onPress ? ariaLabel : undefined}
      >
        <Pressable
          disabled={!onPress}
          onPress={onPress}
          style={[
            styles.unitVaultPressable,
            corner ? styles.unitVaultPressableCorner : null,
          ]}
          hitSlop={6}
        >
          <Animated.View
            style={[
              styles.unitVaultDisc,
              { width: disc, height: disc, borderRadius: disc / 2 },
              discStyle,
            ]}
          >
            <LinearGradient
              colors={["#f9d576", "#b8860b", "#f6c344", "#8a6410"]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Animated.View
              pointerEvents="none"
              style={[styles.unitVaultSheen, { height: disc * 1.4, top: -disc * 0.2 }, sheenStyle]}
            />
            <View
              style={[
                styles.unitVaultDiscInner,
                {
                  width: inner,
                  height: inner,
                  borderRadius: inner / 2,
                },
              ]}
            >
              <LinearGradient
                colors={["#ffedb0", "#d9a125"]}
                start={{ x: 0.3, y: 0.2 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={[styles.unitVaultU, corner ? styles.unitVaultUCorner : null]}>U</Text>
            </View>
          </Animated.View>
          <Animated.Text
            style={[
              styles.unitVaultValue,
              corner ? styles.unitVaultValueCorner : null,
              valueGlowStyle,
            ]}
          >
            {label}
          </Animated.Text>
        </Pressable>
      </Animated.View>
    </View>
  );
});

function KinetikIdentityJoinIdRowNative({
  memberSinceLabel,
  idLabel,
  shareCopied,
  copiedLabel,
  shareLabel,
  onShare,
}: {
  memberSinceLabel: string | null;
  idLabel: string;
  shareCopied: boolean;
  copiedLabel: string;
  shareLabel: string;
  onShare: () => void;
}) {
  return (
    <View style={styles.identityJoinIdRow}>
      {memberSinceLabel ? (
        <KinetikFooterRef style={[styles.footerRefIdentity, styles.footerRefJoin]}>
          <Text style={styles.footerRefTextIdentity}>{memberSinceLabel}</Text>
        </KinetikFooterRef>
      ) : (
        <View
          style={[styles.footerRefIdentity, styles.footerRefJoin, styles.footerJoinSlot]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      )}
      {idLabel ? (
        <KinetikIdentityIdChipNative
          idLabel={idLabel}
          shareCopied={shareCopied}
          copiedLabel={copiedLabel}
          shareLabel={shareLabel}
          onShare={onShare}
          pressableStyle={styles.identityIdPressInline}
          footerRefStyle={styles.footerRefId}
          compact
        />
      ) : (
        <View
          style={[styles.footerRefIdentity, styles.footerRefId, styles.footerIdSlot]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      )}
    </View>
  );
}

function KinetikViewCountChipNative({
  viewCount,
  viewCountAriaLabel,
  underAvatar,
}: {
  viewCount: number;
  viewCountAriaLabel: string | null;
  underAvatar?: boolean;
}) {
  return (
    <View
      style={[
        styles.viewCountChip,
        underAvatar ? styles.viewCountChipUnderAvatar : null,
      ]}
      accessibilityRole="text"
      accessibilityLabel={viewCountAriaLabel ?? undefined}
    >
      <MaterialCommunityIcons name="eye" size={12} color="#00F5FF" />
      <Text style={styles.viewCountNum}>
        {viewCount.toLocaleString("en-US")}
      </Text>
    </View>
  );
}

function KinetikFooterNative({ memberSinceLabel }: { memberSinceLabel: string | null }) {
  if (!memberSinceLabel) return null;

  return (
    <View style={styles.footer}>
      <View style={styles.footerRow}>
        <KinetikFooterRef style={styles.footerRefGrow}>
          <Text style={styles.footerRefText} numberOfLines={1}>
            {memberSinceLabel}
          </Text>
        </KinetikFooterRef>
      </View>
    </View>
  );
}

function MetricsScopeArrowNative({
  direction,
  planPro = false,
}: {
  direction: "left" | "right";
  planPro?: boolean;
}) {
  const color = planPro ? "#67e8f9" : "#00f5ff";
  return (
    <View
      style={[
        styles.scopeArrowBase,
        direction === "left"
          ? { borderRightWidth: 8, borderRightColor: color }
          : { borderLeftWidth: 8, borderLeftColor: color },
        styles.scopeArrowGlow,
      ]}
    />
  );
}

function MetricsScopeTitleBreathingNative({
  children,
  animate,
}: {
  children: string;
  animate: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0.85);

  useEffect(() => {
    if (!animate || reduceMotion) {
      opacity.value = 0.88;
      return;
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.96, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.76, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [animate, opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.metricsTitle, animatedStyle]} numberOfLines={1}>
      {children}
    </Animated.Text>
  );
}

export type ProfileKinetikPanelNativeProps = {
  identity: ProfileEditTronIdentity;
  stats: ProfileEditKinetikStats;
  language: "ja" | "en";
  bio?: string | null;
  countryCode?: string | null;
  memberSinceMs?: number | null;
  isPro?: boolean;
  /** Pro Skin（users.planProBgVariant） */
  planProBgVariant?: ProfilePlanProBgVariant;
  winStreak?: number;
  totalPointsRank?: number | null;
  totalPointsRankDenominator?: number | null;
  rankDeltaPlaces?: number | null;
  metricsTitle?: string;
  onToggleMetricsScope?: () => void;
  badges?: ResolvedBadgeNative[];
  onBadgePress?: (badge: ResolvedBadgeNative) => void;
  canOpenMenu?: boolean;
  onOpenMenu?: () => void;
  menuUnreadCount?: number;
  shareHandle?: string;
  metricValueDeltas?: MyRankMetricValueDeltas | null;
  rankingLeague?: RankingLeagueSource;
  statsPending?: boolean;
  style?: ViewStyle;
  /** NBA: Playoffs / Season 切替 */
  metricsPeriod?: "playoffs" | "season";
  onMetricsPeriodChange?: (period: "playoffs" | "season") => void;
  /** NBA: TOTAL / Week / Month 切替 */
  metricsTab?: ProfileKinetikMetricsTab;
  onMetricsTabChange?: (tab: ProfileKinetikMetricsTab) => void;
  metricsWindowLabel?: string | null;
  onMetricsWindowLabelChange?: (label: string | null) => void;
  metricsPeriodLabels?: string[];
  /** 累計プロフィール閲覧数（公開） */
  profileViewCount?: number | null;
  /** 保有 Unit（公開） */
  unitBalance?: number | null;
  /** 自分のプロフィール時: Unit 履歴を開く */
  onOpenUnitLedger?: () => void;
};

export default function ProfileKinetikPanelNative({
  identity,
  stats,
  language = "ja",
  bio,
  countryCode = null,
  memberSinceMs = null,
  isPro = false,
  planProBgVariant = PROFILE_PLAN_PRO_BG_DEFAULT,
  winStreak,
  totalPointsRank: totalPointsRankProp,
  totalPointsRankDenominator: totalPointsRankDenominatorProp,
  rankDeltaPlaces: rankDeltaPlacesProp,
  metricsTitle = "NBA // 26-27",
  onToggleMetricsScope,
  badges = [],
  onBadgePress,
  shareHandle,
  metricValueDeltas = null,
  rankingLeague: _rankingLeague = "nba",
  statsPending = false,
  style,
  metricsPeriod: _metricsPeriod,
  onMetricsPeriodChange: _onMetricsPeriodChange,
  metricsTab,
  onMetricsTabChange,
  metricsWindowLabel = null,
  onMetricsWindowLabelChange,
  metricsPeriodLabels = [],
  profileViewCount = null,
  unitBalance = null,
  onOpenUnitLedger,
}: ProfileKinetikPanelNativeProps) {
  const isJa = language === "ja";
  const showNbaMetricsTabs = metricsTab != null && !!onMetricsTabChange;
  const scopeHint = getKinetikMetricsScopeHint(
    metricsTab ?? "total",
    isJa ? "ja" : "en",
    metricsTab === "weekly" || metricsTab === "monthly"
      ? {
          windowLabel: metricsWindowLabel,
          isCurrentWindow:
            !metricsWindowLabel ||
            metricsWindowLabel === currentRankingPeriodLabel(metricsTab),
        }
      : undefined
  );
  const [shareCopied, setShareCopied] = useState(false);
  const unitVaultRef = useRef<View>(null);

  /** 自分プロフィール（台帳導線あり）のみ獲得演出 */
  const unitEarn = useUnitEarnOverlayNative({
    balance: unitBalance ?? null,
    enabled: !!onOpenUnitLedger && unitBalance != null,
    storageKey: shareHandle?.trim() || "me",
    language: isJa ? "ja" : "en",
  });
  /** 金庫加算中はバッジ／コイン常時ループを止め続ける */
  const [vaultSettling, setVaultSettling] = useState(false);
  const onVaultCountBusyChange = useCallback((busy: boolean) => {
    setVaultSettling(busy);
  }, []);
  const earnFxPaused = unitEarn.active != null || vaultSettling;
  /** hook 側でモック / プレビュー加算済み（1000→1250）まで解決済み */
  const vaultDisplayBalance =
    unitEarn.vaultBalance ?? unitVaultUiBalance(unitBalance);

  const activeWinStreak = Math.max(0, Math.floor(winStreak ?? stats.winStreak ?? 0));
  const activeTotalPointsRank = totalPointsRankProp ?? stats.totalPointsRank ?? null;
  const activeRankDenominator =
    totalPointsRankDenominatorProp ?? stats.totalPointsRankDenominator ?? null;
  const activeRankDelta = rankDeltaPlacesProp ?? stats.rankDeltaPlaces ?? null;

  const rankBadge = resolveKinetikRankBadge({
    totalPointsRank: activeTotalPointsRank,
    totalPointsRankDenominator: activeRankDenominator,
    rankDeltaPlaces: activeRankDelta,
    language,
  });
  const menuAccent = resolveKinetikMenuAccent({
    totalPointsRank: activeTotalPointsRank,
    rankBadge,
  });
  const profileAccent = resolveKinetikProfileAccent({
    streak: activeWinStreak,
    totalPointsRank: activeTotalPointsRank,
    rankBadge,
  });
  const goldMonogramSkin = planProBgVariant === "wave-gold-monogram";
  const proFrameTheme = isPro ? kinetikPlanProFrameTheme(profileAccent) : null;
  const panelBorder = kinetikPanelBorderColor(profileAccent);
  const flipEar = useProfileKinetikFlipEar();
  const reduceMotion = useReducedMotion();
  const { width: windowW } = useWindowDimensions();
  /**
   * 獲得演出中は Pro 背景ループも止める（SvgSkinHud は再開時に入場をやり直さない）。
   * バッジ／金庫の常時ループも earnFxPaused で止める。
   */
  const animatePlanProBg =
    isPro && reduceMotion !== true && !earnFxPaused;
  const [frameSize, setFrameSize] = useState(() => ({
    width: Math.max(0, windowW - 24),
    height: isPro ? 520 : 0,
  }));
  const memberSinceLabel = formatProfileMemberSince(memberSinceMs, language);
  const profileViewCountAria =
    profileViewCount == null
      ? null
      : isJa
        ? `プロフィール閲覧数 ${profileViewCount.toLocaleString("ja-JP")}`
        : `${profileViewCount.toLocaleString("en-US")} profile views`;
  const unitBalanceAria =
    unitBalance == null
      ? null
      : isJa
        ? `保有 Unit ${unitBalance.toLocaleString("ja-JP")}`
        : `${unitBalance.toLocaleString("en-US")} Units`;
  const shareTargetHandle = shareHandle?.trim() || identity.handle?.trim() || "";
  const profileFlagUri = countryCode?.trim()
    ? rankingFlagImageUri(countryCode.trim())
    : null;
  const profileIdLabel = identity.systemId.trim();
  const shareProfileLabel = isJa ? "プロフィールを共有" : "Share profile";
  const shareCopiedLabel = isJa ? "コピー済" : "Copied";

  const handleShareProfile = useCallback(async () => {
    if (!shareTargetHandle) return;
    const base = getUniterzApiBaseUrl();
    const url = buildProfileShareUrl(shareTargetHandle, base);
    const title = identity.displayName;
    const text =
      language === "ja" ? `${title} のプロフィール` : `${title}'s profile`;
    try {
      await Share.share({ message: `${text}\n${url}`, url, title });
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2200);
    } catch {
      /* cancelled */
    }
  }, [identity.displayName, language, shareTargetHandle]);

  const metricCopy = useMemo(
    () => ({
      ptsUnit: "pts",
      matchUnit: isJa ? "試合" : "matches",
      cumulativeUnitHint: scopeHint.unitHint,
      winRateUnitHint: "%",
    }),
    [isJa, scopeHint.unitHint]
  );

  const metricsHeaderTitle = metricsTitle ?? "NBA // 26-27";

  const renderMetricsGrid = (
    sectionStats: ProfileEditKinetikStats,
    sectionDeltas: MyRankMetricValueDeltas | null,
    sectionRank: {
      totalPointsRank: number | null;
      totalPointsRankDenominator: number | null;
    },
    valuesPending = false
  ) => {
    const pendingMark = "—";
    const sectionWinRateFootnote = valuesPending
      ? pendingMark
      : isJa
        ? `投稿 ${sectionStats.posts} · 的中 ${sectionStats.hits}`
        : `${sectionStats.hits} hits · ${sectionStats.posts} posts`;
    const sectionTotalPointsRankLabel =
      !valuesPending && sectionRank.totalPointsRank != null
        ? isJa
          ? `${sectionRank.totalPointsRank}位`
          : `#${sectionRank.totalPointsRank}`
        : undefined;
    const sectionPtsSegmentsReady =
      !valuesPending &&
      sectionRank.totalPointsRankDenominator != null &&
      Number.isFinite(sectionRank.totalPointsRankDenominator) &&
      sectionRank.totalPointsRankDenominator >= 1;

    return (
      <View style={styles.metricsGrid}>
        <KinetikMetricCardNative
          label={isJa ? "勝率" : "WIN RATE"}
          countTarget={sectionStats.winRate}
          countFormat="percent"
          countDecimals={1}
          valuesPending={valuesPending}
          footnote={sectionWinRateFootnote}
          accent="green"
          filledSegs={
            valuesPending ? 0 : kinetikWinRateSegs(sectionStats.winRate)
          }
          unitHint={metricCopy.winRateUnitHint}
          dayDelta={
            valuesPending
              ? null
              : formatProfileMetricDayDelta("winRate", sectionDeltas?.winRate)
          }
          dayDeltaTone={
            valuesPending
              ? null
              : profileMetricDeltaTone(sectionDeltas?.winRate ?? null)
          }
          isPlanPro={isPro}
        />
        <KinetikMetricCardNative
          label={isJa ? "総合得点" : "TOTAL PTS"}
          countTarget={sectionStats.totalPoints}
          countFormat="locale"
          valuesPending={valuesPending}
          rankLabel={sectionTotalPointsRankLabel}
          accent="magenta"
          filledSegs={
            valuesPending
              ? 0
              : kinetikTotalPointsRankSegs(
                  sectionRank.totalPointsRank,
                  sectionRank.totalPointsRankDenominator
                )
          }
          segmentsReady={sectionPtsSegmentsReady}
          rankBelowSegBar
          unit={metricCopy.ptsUnit}
          unitHint={metricCopy.cumulativeUnitHint}
          dayDelta={
            valuesPending
              ? null
              : formatProfileMetricDayDelta(
                  "totalPoints",
                  sectionDeltas?.totalPoints
                )
              ? `${formatProfileMetricDayDelta("totalPoints", sectionDeltas?.totalPoints)} ${metricCopy.ptsUnit}`
              : null
          }
          dayDeltaTone={
            valuesPending
              ? null
              : profileMetricDeltaTone(sectionDeltas?.totalPoints ?? null)
          }
          isPlanPro={isPro}
          language={language}
        />
        <KinetikMetricCardNative
          label={KINETIK_UPSET_METRIC_LABEL}
          countTarget={sectionStats.upset}
          countFormat="fixed"
          countDecimals={1}
          valuesPending={valuesPending}
          accent="red"
          showSegBar={false}
          compact
          unit={metricCopy.ptsUnit}
          unitHint={metricCopy.cumulativeUnitHint}
          dayDelta={
            valuesPending
              ? null
              : formatProfileMetricDayDelta("upset", sectionDeltas?.totalUpset)
                ? `${formatProfileMetricDayDelta("upset", sectionDeltas?.totalUpset)} ${metricCopy.ptsUnit}`
                : null
          }
          dayDeltaTone={
            valuesPending
              ? null
              : profileMetricDeltaTone(sectionDeltas?.totalUpset ?? null)
          }
          isPlanPro={isPro}
        />
        <KinetikMetricCardNative
          label={isJa ? "最多得点者" : "TOP SCORER"}
          countTarget={Math.max(0, Math.round(sectionStats.goalScorerHits ?? 0))}
          countFormat="int"
          valuesPending={valuesPending}
          accent="cyan"
          showSegBar={false}
          compact
          unit={metricCopy.matchUnit}
          unitHint={metricCopy.cumulativeUnitHint}
          isPlanPro={isPro}
        />
      </View>
    );
  };

  return (
    <View
      style={[
        styles.panelRoot,
        flipEar ? { paddingTop: KINETIK_FLIP_EAR.lip } : null,
      ]}
    >
      {flipEar ? <ProfileKinetikFlipEarNative /> : null}
    <View
      style={[
        styles.frameOuter,
        { borderColor: panelBorder },
        flipEar ? styles.frameOuterNotched : null,
        isPro && proFrameTheme
          ? {
              shadowColor: goldMonogramSkin ? "#000" : proFrameTheme.strong,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: goldMonogramSkin ? 0.35 : 0.28,
              shadowRadius: goldMonogramSkin ? 12 : 18,
              elevation: goldMonogramSkin ? 4 : 6,
            }
          : null,
        isPro ? styles.frameOuterPlanPro : null,
        style,
      ]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setFrameSize({ width, height });
      }}
    >
      {flipEar ? (
        <ProfileKinetikFlipEarTopEdgesNative borderColor={panelBorder} />
      ) : null}
      {isPro && frameSize.width > 0 ? (
        <ProfilePlanProBackgroundNative
          width={frameSize.width}
          height={frameSize.height}
          animate={animatePlanProBg}
          variant={planProBgVariant}
          profileAccent={profileAccent}
          accentReady={true}
        />
      ) : null}

      {/* Web 同様 — atmos / scale / beast / cosmos / form / neo / lab / wave では ambient を載せない */}
      {isPro &&
      planProBgVariant !== "atmos" &&
      !isProfilePlanProScaleBgVariant(planProBgVariant) &&
      !isProfilePlanProBeastBgVariant(planProBgVariant) &&
      !isProfilePlanProCosmosBgVariant(planProBgVariant) &&
      !isProfilePlanProFormBgVariant(planProBgVariant) &&
      !isProfilePlanProNeoBgVariant(planProBgVariant) &&
      !isProfilePlanProFuturisticBgVariant(planProBgVariant) &&
      !isProfilePlanProLabBgVariant(planProBgVariant) &&
      !isProfilePlanProWaveBgVariant(planProBgVariant) ? (
        <LinearGradient
          colors={[
            "rgba(34,211,238,0.1)",
            "rgba(34,211,238,0.02)",
            "transparent",
            "rgba(167,139,250,0.04)",
          ]}
          locations={[0, 0.28, 0.62, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.planProAmbient}
          pointerEvents="none"
        />
      ) : null}

      <View style={styles.headerBlock}>
        <View style={styles.headerRow}>
          <View style={styles.avatarColumn}>
            <ProfileKinetikAvatarWithStreakNative
              photoURL={identity.photoURL}
              displayName={identity.displayName}
              streak={activeWinStreak}
              accentKey={menuAccent}
              isPlanPro={isPro}
            />
            <View style={styles.avatarViews}>
              {profileViewCount != null ? (
                <KinetikViewCountChipNative
                  viewCount={profileViewCount}
                  viewCountAriaLabel={profileViewCountAria}
                  underAvatar
                />
              ) : (
                <View style={styles.viewCountChipSlot} />
              )}
            </View>
          </View>
          <View style={styles.headerMeta}>
            <KinetikHeaderHatch />
            <View style={styles.headerIdentity}>
              <View style={styles.nameRow}>
                <Text
                  style={[styles.displayName, isPro ? styles.displayNamePro : null]}
                  numberOfLines={1}
                >
                  {identity.displayName}
                </Text>
                {isPro ? <ProCyberBadgeNative premium /> : null}
                {unitBalance != null && unitBalanceAria ? (
                  <View style={styles.unitVaultInNameRow}>
                    <TutorialTargetNative id="profile-unit-coin">
                      <KinetikUnitVaultNative
                        ref={unitVaultRef}
                        // UI 確認用モック（実残高が 0・演出なしのとき 1,000 を表示）
                        balance={vaultDisplayBalance}
                        ariaLabel={
                          onOpenUnitLedger
                            ? isJa
                              ? `${unitBalanceAria} · 履歴を開く`
                              : `${unitBalanceAria} · Open history`
                            : unitBalanceAria
                        }
                        corner
                        onPress={onOpenUnitLedger}
                        absorbPulse={unitEarn.active != null && unitEarn.absorbed}
                        countUpEnabled={!unitEarn.active || unitEarn.absorbed}
                        effectsPaused={earnFxPaused}
                        onCountBusyChange={onVaultCountBusyChange}
                      />
                    </TutorialTargetNative>
                  </View>
                ) : (
                  /** 残高未取得でも測位用ターゲットを残す（チュートリアル枠ずれ防止） */
                  <TutorialTargetNative
                    id="profile-unit-coin"
                    style={styles.unitVaultInNameRow}
                  >
                    <View style={styles.unitCoinTutorialStub} collapsable={false} />
                  </TutorialTargetNative>
                )}
              </View>
              {profileFlagUri ? (
                <View
                  style={styles.nameFlagBelow}
                  accessibilityLabel={countryCode ?? undefined}
                >
                  <Image
                    source={{ uri: profileFlagUri }}
                    style={styles.nameFlagBelowImg}
                    resizeMode="cover"
                  />
                </View>
              ) : null}
            </View>
          </View>
        </View>
        {bio?.trim() ? (
          <Text style={styles.headerBio} numberOfLines={3}>
            {bio.trim()}
          </Text>
        ) : null}
      </View>

      {isPro ? (
        <View
          style={[
            styles.badgeBridgePro,
            badges.length === 0 ? styles.badgeBridgeProEmpty : null,
          ]}
          pointerEvents={badges.length === 0 ? "none" : "auto"}
        >
          {badges.length > 0 ? (
            <KinetikBadgeRowNative
              badges={badges}
              onBadgePress={onBadgePress}
              variant="proBridge"
              motionPaused={earnFxPaused}
            />
          ) : null}
        </View>
      ) : (
        <KinetikBadgeRowNative
          badges={badges}
          onBadgePress={onBadgePress}
          motionPaused={earnFxPaused}
        />
      )}

      <View style={[styles.metricsPanel, isPro ? styles.metricsPanelPlanPro : null]}>
        <View
          style={[
            styles.metricsHeader,
            onToggleMetricsScope ? styles.metricsHeaderPicker : null,
          ]}
        >
          {onToggleMetricsScope ? (
            <>
              <Pressable
                style={[styles.scopeNavBtn, styles.scopeNavBtnLeft]}
                onPress={onToggleMetricsScope}
                hitSlop={8}
              >
                <MetricsScopeArrowNative direction="left" planPro={isPro} />
              </Pressable>
              <Pressable style={styles.metricsTitlePressPicker} onPress={onToggleMetricsScope}>
                <MetricsScopeTitleBreathingNative animate>
                  {metricsHeaderTitle}
                </MetricsScopeTitleBreathingNative>
              </Pressable>
              <Pressable
                style={[styles.scopeNavBtn, styles.scopeNavBtnRight]}
                onPress={onToggleMetricsScope}
                hitSlop={8}
              >
                <MetricsScopeArrowNative direction="right" planPro={isPro} />
              </Pressable>
            </>
          ) : (
            <Text style={styles.metricsTitle} numberOfLines={1}>
              {metricsHeaderTitle}
            </Text>
          )}
        </View>
        {showNbaMetricsTabs ? (
          <View
            style={[
              styles.metricsStageTabWrap,
              isPro ? styles.metricsDividerPlanPro : null,
            ]}
          >
            <CyberSlantedTabBarNative fill>
              <CyberSlantedTabNative
                label="TOTAL"
                active={metricsTab === "total"}
                fill
                compact
                onPress={() => onMetricsTabChange?.("total")}
              />
              <CyberSlantedTabNative
                label="WEEK"
                active={metricsTab === "weekly"}
                fill
                compact
                onPress={() => onMetricsTabChange?.("weekly")}
              />
              <CyberSlantedTabNative
                label="MONTH"
                active={metricsTab === "monthly"}
                fill
                compact
                onPress={() => onMetricsTabChange?.("monthly")}
              />
            </CyberSlantedTabBarNative>
            {metricsTab !== "total" &&
            isPro &&
            onMetricsWindowLabelChange &&
            metricsPeriodLabels.length > 0 ? (
              <RankingsPeriodLabelNavNative
                period={metricsTab}
                activeLabel={
                  metricsWindowLabel ??
                  currentRankingPeriodLabel(metricsTab)
                }
                availableLabels={metricsPeriodLabels}
                onChange={onMetricsWindowLabelChange}
                language={isJa ? "ja" : "en"}
              />
            ) : metricsTab !== "total" && scopeHint.unitHint ? (
              <Text style={styles.metricsPeriodHint}>{scopeHint.unitHint}</Text>
            ) : null}
          </View>
        ) : null}
        <View>
          <View style={[styles.metricsSubHeader, isPro ? styles.metricsDividerPlanPro : null]}>
            <KinetikHeaderTabsNative
              rankBadge={rankBadge}
              winStreak={activeWinStreak}
              language={language}
            />
          </View>
          {renderMetricsGrid(
            stats,
            metricValueDeltas,
            {
              totalPointsRank: activeTotalPointsRank,
              totalPointsRankDenominator: activeRankDenominator,
            },
            statsPending
          )}
        </View>
      </View>

      <View style={styles.cardFooterMeta}>
        <KinetikIdentityJoinIdRowNative
          memberSinceLabel={memberSinceLabel}
          idLabel={profileIdLabel}
          shareCopied={shareCopied}
          copiedLabel={shareCopiedLabel}
          shareLabel={shareProfileLabel}
          onShare={handleShareProfile}
        />
      </View>

    </View>
    {unitEarn.active ? (
      <UnitEarnOverlayNative
        open
        amount={unitEarn.active.amount}
        label={unitEarn.active.label}
        title={unitEarn.active.title}
        subtitle={unitEarn.active.subtitle}
        rank={unitEarn.active.rank}
        language={isJa ? "ja" : "en"}
        vaultRef={unitVaultRef}
        onAbsorb={unitEarn.markAbsorbed}
        onDone={unitEarn.dismiss}
      />
    ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panelRoot: {
    position: "relative",
    alignSelf: "stretch",
  },
  frameOuter: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "transparent",
    overflow: "hidden",
    flexDirection: "column",
  },
  frameOuterNotched: {
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  frameOuterPlanPro: {
    backgroundColor: "rgba(3,8,13,0.14)",
    minHeight: 520,
  },
  planProAmbient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  planProFrameInner: {
    ...StyleSheet.absoluteFillObject,
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderWidth: 1.5,
    zIndex: 2,
    backgroundColor: "rgba(34,211,238,0.03)",
  },
  planProFrameEdgeTop: {
    position: "absolute",
    top: 0,
    left: "8%",
    right: "8%",
    height: 2,
    zIndex: 2,
    shadowColor: "#22d3ee",
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  planProFrameRail: {
    position: "absolute",
    top: "10%",
    bottom: "10%",
    width: 2,
    opacity: 0.72,
    zIndex: 2,
    shadowColor: "#22d3ee",
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  planProFrameRailLeft: {
    left: 7,
  },
  planProFrameRailRight: {
    right: 7,
  },
  headerBlock: {
    width: "100%",
  },
  headerRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  headerMeta: {
    flex: 1,
    minWidth: 0,
    position: "relative",
    overflow: "visible",
    minHeight: KINETIK_AVATAR_MOBILE.size,
    justifyContent: "center",
  },
  headerIdentity: {
    minWidth: 0,
  },
  headerHatch: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 96,
    height: 64,
    opacity: 0.4,
    overflow: "hidden",
  },
  headerHatchLine: {
    position: "absolute",
    right: -8,
    width: 120,
    height: 1,
    backgroundColor: "rgba(168, 255, 42, 0.12)",
  },
  headerTabsRow: { flexDirection: "row", alignItems: "stretch", gap: 8, marginBottom: 2 },
  headerTabsRowEnd: { justifyContent: "flex-end" },
  headerTabsFlex: { flex: 1, minWidth: 0, overflow: "visible" },
  headerTabs: { flexDirection: "row", flexWrap: "wrap", gap: 5, alignItems: "center" },
  slantTabOuter: {
    flexShrink: 0,
    overflow: "visible",
  },
  slantTab: {
    position: "relative",
    overflow: "hidden",
    height: KINETIK_SLANT_TAB_ROW_H,
    minHeight: KINETIK_SLANT_TAB_ROW_H,
    maxHeight: KINETIK_SLANT_TAB_ROW_H,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ skewX: "-14deg" }],
    paddingHorizontal: 8,
  },
  slantTabScan: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  slantTabScanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  slantTabText: {
    position: "relative",
    zIndex: 1,
    fontFamily: OXANIUM_BOLD,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.1,
    lineHeight: 10,
    includeFontPadding: false,
    transform: [{ skewX: "14deg" }],
  },
  slantTabTextFilled: {
    textTransform: "uppercase",
  },
  slantTabTextEn: {
    letterSpacing: 1.26,
    textTransform: "uppercase",
  },
  slantTabTextJaStreak: {
    letterSpacing: 0.72,
    textTransform: "none",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
    width: "100%",
    flexWrap: "wrap",
  },
  unitVaultInNameRow: {
    marginLeft: "auto",
    flexShrink: 0,
    alignSelf: "center",
  },
  /** 残高未ロード時の測位スタブ（見た目は出さない） */
  unitCoinTutorialStub: {
    width: 72,
    height: 28,
    opacity: 0,
  },
  nameFlagBelow: {
    marginTop: 6,
    width: 22,
    height: 15,
    borderRadius: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.28)",
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  nameFlagBelowImg: {
    width: "100%",
    height: "100%",
  },
  cardFooterMeta: {
    marginTop: "auto",
    paddingTop: 12,
    alignSelf: "stretch",
    alignItems: "flex-start",
    zIndex: 1,
  },
  identityIdPress: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    marginTop: 2,
  },
  identityIdPressInline: {
    alignSelf: "flex-start",
    marginTop: 0,
    flexShrink: 0,
  },
  identityJoinIdRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    gap: 8,
    alignSelf: "flex-start",
    maxWidth: "100%",
    minHeight: 22,
  },
  footerJoinSlot: {
    minWidth: 72,
    opacity: 0,
  },
  footerIdSlot: {
    minWidth: 64,
    opacity: 0,
  },
  footerRefJoin: {
    flexShrink: 0,
  },
  /** カード左下: JOIN + ID を左寄せで並べる */
  footerRefId: {
    borderLeftWidth: 0,
    borderRightWidth: 1,
    borderColor: KINETIK_FRAME_DIM,
    paddingLeft: 6,
    paddingRight: 5,
  },
  identityIdRef: {
    paddingTop: 4,
    paddingRight: 10,
    paddingBottom: 5,
    paddingLeft: 8,
    minHeight: 22,
  },
  footerRefIdentity: {
    paddingTop: 4,
    paddingRight: 6,
    paddingBottom: 4,
    paddingLeft: 5,
    minHeight: 20,
  },
  footerRefTextIdentity: {
    fontFamily: FOOTER_REF_FONT,
    fontSize: 8,
    fontWeight: "500",
    letterSpacing: 0.45,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.42)",
    lineHeight: 10,
    fontVariant: ["tabular-nums"],
  },
  /** Web `.profile-edit-kinetik-view-count` 相当 */
  viewCountChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 3,
    paddingRight: 8,
    paddingBottom: 4,
    paddingLeft: 7,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.65)",
    backgroundColor: "rgba(0,245,255,0.14)",
    // iOS グロー
    shadowColor: "#00F5FF",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    // Android
    elevation: 3,
    flexShrink: 0,
  },
  viewCountNum: {
    fontFamily: FOOTER_REF_FONT,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#f8fafc",
    lineHeight: 12,
    fontVariant: ["tabular-nums"],
  },
  /** Web `.profile-edit-kinetik-unit-vault` 相当 — 金貨コイン（U8） */
  unitVault: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  unitVaultPressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unitVaultPressableCorner: {
    gap: 5,
  },
  unitVaultDisc: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: UNIT_VAULT_GOLD,
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  unitVaultSheen: {
    position: "absolute",
    zIndex: 2,
    width: "42%",
    left: 0,
    backgroundColor: "rgba(255,248,220,0.55)",
  },
  unitVaultDiscInner: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 1,
  },
  unitVaultU: {
    fontFamily: FOOTER_REF_FONT,
    fontSize: 10,
    fontWeight: "800",
    color: "#241902",
    lineHeight: 12,
    zIndex: 1,
  },
  unitVaultValue: {
    fontFamily: OXANIUM_EXTRA,
    fontSize: 20,
    fontWeight: "800",
    fontStyle: "italic",
    letterSpacing: -0.2,
    color: "#ffe9a8",
    lineHeight: 22,
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(246,195,68,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  unitVaultCorner: {
    gap: 5,
    minHeight: 18,
  },
  unitVaultUCorner: {
    fontSize: 8,
    lineHeight: 10,
  },
  unitVaultValueCorner: {
    fontSize: 16,
    lineHeight: 18,
  },
  avatarColumn: {
    alignItems: "center",
    flexShrink: 0,
  },
  avatarViews: {
    marginTop: 6,
    width: KINETIK_AVATAR_MOBILE.size,
    alignItems: "stretch",
    minHeight: 22,
  },
  viewCountChipSlot: {
    height: 22,
  },
  /** アバター直下 — 横幅フル */
  viewCountChipUnderAvatar: {
    width: "100%",
    justifyContent: "center",
    paddingLeft: 0,
    paddingRight: 0,
  },
  displayName: {
    flexShrink: 1,
    maxWidth: "100%",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 16,
    lineHeight: 18,
    fontStyle: "italic",
    color: "#f8fafc",
    letterSpacing: -0.3,
    includeFontPadding: false,
  },
  displayNamePro: {
    textShadowColor: "rgba(34, 211, 238, 0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerBio: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.5)",
  },
  menuBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  menuBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14, minHeight: 44 },
  badgeRowProBridge: { marginTop: 0, gap: 10 },
  badgeScrollProBridgeWrap: {
    position: "relative",
    alignSelf: "stretch",
    overflow: "visible",
  },
  badgeScrollProBridge: {
    alignSelf: "stretch",
    flexGrow: 1,
    overflow: "visible",
  },
  badgeScrollFadeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 6,
    width: 28,
    zIndex: 2,
  },
  badgeScrollFadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 6,
    width: 28,
    zIndex: 2,
  },
  badgeRowProBridgeCentered: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
    paddingBottom: 6,
  },
  badgeRowProBridgeScroll: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 6,
  },
  badgeRowInline: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    alignItems: "center",
  },
  badgeRowEmpty: { marginTop: 14, minHeight: 44 },
  badgeBridgePro: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 60 + BADGE_FLOAT_TOP_CLEARANCE_PX,
    marginHorizontal: -16,
    paddingTop: 8,
    paddingBottom: 12,
    zIndex: 1,
    justifyContent: "flex-start",
    overflow: "visible",
  },
  /** 空でも同じ高さを確保 — バッジ有無で背景図形が動かない */
  badgeBridgeProEmpty: {
    minHeight: 60 + BADGE_FLOAT_TOP_CLEARANCE_PX,
  },
  /**
   * Web `.profile-edit-kinetik-badge-enter-wrap`
   * 上パディングで float 振幅分を確保し、盾型など枠いっぱいの形でも見切れないようにする。
   * （親 `frameOuter` は overflow:hidden のため、レイアウト内に余白を持つ必要がある）
   */
  badgeEnterWrap: {
    flexShrink: 0,
    overflow: "visible",
    paddingTop: BADGE_FLOAT_TOP_CLEARANCE_PX,
  },
  /** Web `.profile-edit-kinetik-badge-float` */
  badgeFloatWrap: {
    flexShrink: 0,
    overflow: "visible",
  },
  badgeThumb: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  badgeThumbProBridge: {
    width: 60,
    height: 60,
    overflow: "visible",
  },
  badgeThumbInline: {
    width: 36,
    height: 36,
  },
  badgeImg: { width: "100%", height: "100%" },
  badgeFallbackText: {
    fontSize: 8,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    padding: 4,
  },
  metricsPanel: {
    marginTop: 14,
    /** 斜めタブの発光を四角く切らない（Web の overflow-visible 相当） */
    overflow: "visible",
  },
  metricsPanelPlanPro: {
    marginTop: 0,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  metricsHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  metricsHeaderPicker: {
    position: "relative",
    minHeight: 32,
  },
  metricsTitlePressPicker: {
    width: "100%",
    minWidth: 0,
    alignItems: "center",
    paddingHorizontal: 36,
  },
  metricsTitle: {
    width: "100%",
    fontFamily: OXANIUM_BOLD,
    fontSize: 10,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.72)",
    textTransform: "uppercase",
    textAlign: "center",
  },
  metricsSubHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  metricsDividerPlanPro: {
    borderBottomWidth: 0,
  },
  metricsSubTitle: {
    fontFamily: OXANIUM_BOLD,
    fontSize: 9,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.62)",
    textTransform: "uppercase",
  },
  /** Web `wcStageTabWrapClass`: px-2.5 py-2 */
  metricsStageTabWrap: {
    overflow: "visible",
    /** バー側で glow pad を持つので、ここでは最小余白のみ */
    paddingHorizontal: 0,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  metricsPeriodHint: {
    marginTop: 6,
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    fontFamily: METRIC_FONT,
  },
  metricsSkeleton: {
    width: "47%",
    flexGrow: 1,
    minHeight: 76,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  scopeArrowBase: {
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  scopeArrowGlow: {
    shadowColor: "#00f5ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 6,
  },
  scopeNavBtn: {
    position: "absolute",
    top: "50%",
    marginTop: -14,
    minHeight: 28,
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  scopeNavBtnLeft: {
    left: 6,
  },
  scopeNavBtnRight: {
    right: 6,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 6,
    gap: 5,
  },
  metricCard: {
    width: "47%",
    flexGrow: 1,
    minHeight: 104,
    backgroundColor: "#000000",
    padding: 16,
    position: "relative",
    overflow: "hidden",
    borderWidth: 0,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  metricCardCompact: {
    minHeight: 76,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  /** 外縁は黒のまま。金線を 1px 内側に置いてスキンへ滲まないようにする */
  metricFrameHost: {
    position: "absolute",
    zIndex: 0,
  },
  metricFrameH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  metricFrameV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
  },
  metricFrameTop: { top: 0 },
  metricFrameBottom: { bottom: 0 },
  metricFrameLeft: { left: 0 },
  metricFrameRight: { right: 0 },
  metricLabelPlanPro: {
    fontWeight: "700",
    zIndex: 1,
  },
  metricUnitHintPlanPro: {
    opacity: 0.85,
  },
  metricUnitPlanPro: {
    opacity: 0.9,
  },
  metricFootnotePlanPro: {
    borderLeftWidth: 2,
    paddingLeft: 8,
    marginLeft: 2,
    opacity: 0.88,
  },
  metricValuePlanPro: {
    fontWeight: "700",
    textShadowOffset: { width: 0, height: 0 },
    zIndex: 1,
  },
  metricRankBadgePlanPro: {
    borderColor: "rgba(34,211,238,0.28)",
    backgroundColor: "rgba(34,211,238,0.08)",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  metricRankBadgeGold: {
    borderColor: "rgba(232,198,106,0.45)",
    backgroundColor: "transparent",
  },
  metricRankBadgeTextGold: {
    color: "rgba(232,198,106,0.88)",
  },
  metricAccentBar: {
    position: "absolute",
    left: 0,
    top: 14,
    bottom: 14,
    width: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    zIndex: 1,
  },
  metricAccentBarCompact: {
    top: 10,
    bottom: 10,
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 0,
    paddingRight: 4,
    minWidth: 0,
    zIndex: 1,
  },
  metricLabel: {
    fontFamily: OXANIUM_BOLD,
    fontSize: 10,
    flexShrink: 1,
    minWidth: 0,
    color: "rgba(255,255,255,0.62)",
    textTransform: "uppercase",
  },
  metricLabelLatin: {
    letterSpacing: 1.3,
  },
  metricLabelCjk: {
    letterSpacing: 0.4,
    textTransform: "none",
  },
  metricUnitHint: {
    fontFamily: OXANIUM_BOLD,
    fontSize: 9,
    color: "rgba(255,255,255,0.38)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    flexShrink: 0,
  },
  metricValueRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: 5,
    marginTop: 8,
    paddingLeft: 0,
    zIndex: 1,
  },
  metricValueRowCompact: {
    marginTop: 6,
  },
  metricValue: {
    fontFamily: OXANIUM_BOLD,
    fontSize: 19,
    color: "rgba(255,255,255,0.92)",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-12deg" }],
  },
  metricUnit: {
    fontFamily: OXANIUM_BOLD,
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  metricDelta: {
    fontFamily: OXANIUM_BOLD,
    fontSize: 10,
    marginBottom: 2,
    fontVariant: ["tabular-nums"],
  },
  metricDeltaUp: { color: "#a8ff2a" },
  metricDeltaDown: { color: "rgba(255,255,255,0.42)" },
  metricRankBadge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 2,
  },
  metricRankBadgeText: {
    fontFamily: OXANIUM_BOLD,
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.8,
  },
  metricRankBadgeTextPlanPro: {
    color: "rgba(34,211,238,0.95)",
  },
  metricRankBelow: { alignSelf: "flex-start" },
  metricRankWrap: { paddingLeft: 10, marginTop: 10 },
  metricSegWrap: { marginTop: 10, paddingLeft: 10 },
  metricSegPlaceholder: { height: 6 },
  segRow: { flexDirection: "row", gap: 3 },
  segRowPlanPro: { gap: 4 },
  seg: { flex: 1, height: 6 },
  segPlanPro: { height: 6, borderRadius: 2 },
  metricFootnote: {
    marginTop: 8,
    paddingLeft: 0,
    fontFamily: OXANIUM_BOLD,
    fontSize: 11,
    color: "rgba(255,255,255,0.62)",
    letterSpacing: 0.6,
    fontVariant: ["tabular-nums"],
  },
  footer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: KINETIK_FRAME_DIM,
    borderStyle: "dashed",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  footerFlagRef: {
    flexShrink: 0,
  },
  footerFlag: { width: 18, height: 13, borderRadius: 1 },
  footerRef: {
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: KINETIK_FRAME_DIM,
    paddingTop: 7,
    paddingRight: 12,
    paddingBottom: 9,
    paddingLeft: 10,
    minHeight: 29,
    justifyContent: "flex-end",
  },
  footerRefGrow: { flexShrink: 1, minWidth: 0 },
  footerRefText: {
    fontFamily: FOOTER_REF_FONT,
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 1.26,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.42)",
    lineHeight: 9,
  },
});
