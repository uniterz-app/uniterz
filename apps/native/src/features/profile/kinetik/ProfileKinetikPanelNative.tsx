import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { cyberAlert } from "../../../components/cyberAlert";
import {
  Image, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View, type StyleProp, type ViewStyle,
} from "react-native";
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
  getKinetikStreakTier,
  getKinetikWinStreakExplanation,
} from "../../../../../../app/component/profile/edit/kinetikStreakFx";
import { getKinetikRankBadgeExplanation } from "../../../../../../app/component/profile/edit/kinetikRankBadge";
import { formatMetricDecimals } from "../../../../../../lib/format/metricDecimals";
import { formatProfileMemberSince } from "../../../../../../lib/profile/formatProfileMemberSince";
import {
  formatProfileMetricDayDelta,
  profileMetricDeltaTone,
} from "../../../../../../lib/profile/formatProfileMetricDelta";
import type { MyRankMetricValueDeltas } from "../../../../../../lib/rankings/myRankMetricValueDeltas";
import type { RankingLeagueSource } from "../../../../../../lib/rankings/rankingLeagueSource";
import type {
  ProfileKinetikMetricsSection,
  WcKinetikStackedStage,
} from "../../../../../../lib/profile/profileKinetikMetricsSection";
import {
  KINETIK_UPSET_METRIC_LABEL,
  kinetikMetricLabelUsesLatinUppercase,
} from "../../../../../../lib/profile/kinetikMetricDisplay";
import { PROFILE_WC_STACKED_STAGE_TAB_ORDER } from "../../../../../../lib/profile/profileWcStackedStageTabs";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import { rankingsTexts } from "../../rankings/rankingsTexts";
import { rankingFlagImageUri } from "../../rankings/rankingFlagUri";
import { getUniterzApiBaseUrl } from "../../games/submitPredictionApi";
import { buildProfileShareUrl } from "../../../../../../lib/share/shareAppUrls";
import CyberMenuButton from "../../../ui/CyberMenuButton";
import type { ResolvedBadgeNative } from "../useNativeProfileBadges";
import {
  KINETIK_METRIC_ACCENT,
  KINETIK_SLANT_TAB_RANK,
  KINETIK_SLANT_TAB_ROW_H,
  KINETIK_SLANT_TAB_STREAK,
  kinetikPanelBorderColor,
  kinetikPlanProFrameTheme,
  type KinetikMetricAccent,
} from "./profileKinetikNativeTheme";
import ProCyberBadgeNative from "./ProCyberBadgeNative";
import ProfileKinetikAvatarWithStreakNative from "./ProfileKinetikAvatarWithStreakNative";
import ProfilePlanProBackgroundNative from "./ProfilePlanProBackgroundNative";
import { LinearGradient } from "expo-linear-gradient";
import { PROFILE_PLAN_PRO_BG_DEFAULT } from "../../../../../../lib/profile/profilePlanProBgVariants";

const OXANIUM_BOLD = "Oxanium_700Bold";
const OXANIUM_EXTRA = "Oxanium_800ExtraBold";
/** `CyberMenuButton` md（36px）+ 余白 */
const HEADER_MENU_CLEARANCE = 40;

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

/** Web `color-mix(in srgb, accent X%, white)` の近似 */
function mixAccentWithWhite(hex: string, accentRatio: number): string {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (![r, g, b].every(Number.isFinite)) return hex;
  const t = 1 - accentRatio;
  return `rgb(${Math.round(r * accentRatio + 255 * t)},${Math.round(g * accentRatio + 255 * t)},${Math.round(b * accentRatio + 255 * t)})`;
}

function KinetikSegBar({
  filled,
  total = 5,
  accent,
  isPlanPro = false,
}: {
  filled: number;
  total?: number;
  accent: KinetikMetricAccent;
  isPlanPro?: boolean;
}) {
  const colors = KINETIK_METRIC_ACCENT[accent];
  return (
    <View style={[styles.segRow, isPlanPro ? styles.segRowPlanPro : null]}>
      {Array.from({ length: total }).map((_, i) => {
        const lit = i < filled;
        return (
          <View
            key={i}
            style={[
              styles.seg,
              isPlanPro && styles.segPlanPro,
              {
                backgroundColor: lit ? colors.fill : "rgba(255,255,255,0.08)",
                shadowColor: lit ? colors.glow : "transparent",
                /** 枠光りを避け、薄くにじませる */
                shadowOpacity: lit ? (isPlanPro ? 0.28 : 0.55) : 0,
                shadowRadius: lit ? (isPlanPro ? 6 : 4) : 0,
                shadowOffset: { width: 0, height: 0 },
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/** Web `profile-plan-pro-metric-card__value` の drop-shadow(0 0 3px …) 相当 */
function metricValuePlanProAccentStyle(
  accent: KinetikMetricAccent
): { color: string; textShadowColor: string; textShadowRadius: number } {
  const line = KINETIK_METRIC_ACCENT[accent]?.line ?? "#f8fafc";
  const glow =
    accent === "green"
      ? "rgba(168,255,42,0.14)"
      : accent === "magenta"
        ? "rgba(255,43,214,0.12)"
        : accent === "red"
          ? "rgba(248,113,113,0.12)"
          : "rgba(34,211,238,0.14)";
  return {
    color: line,
    textShadowColor: glow,
    textShadowRadius: 3,
  };
}

/** Web `profile-plan-pro-metric-card__label` — accent 72% + white */
function metricLabelPlanProAccentStyle(
  accent: KinetikMetricAccent
): {
  color: string;
  textShadowColor: string;
  textShadowOffset: { width: number; height: number };
  textShadowRadius: number;
} {
  const line = KINETIK_METRIC_ACCENT[accent]?.line ?? "#22d3ee";
  return {
    color: mixAccentWithWhite(line, 0.72),
    textShadowColor: "rgba(255,255,255,0.08)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  };
}

/** Web `profile-plan-pro-metric-card__unit-hint` — accent 42% + white/35 */
function metricUnitHintPlanProAccentStyle(
  accent: KinetikMetricAccent
): { color: string } {
  const line = KINETIK_METRIC_ACCENT[accent]?.line ?? "#22d3ee";
  return { color: mixAccentWithWhite(line, 0.42) };
}

/** Web `profile-plan-pro-metric-card__unit` — accent 55% + white/40 */
function metricUnitPlanProAccentStyle(
  accent: KinetikMetricAccent
): { color: string } {
  const line = KINETIK_METRIC_ACCENT[accent]?.line ?? "#22d3ee";
  return { color: mixAccentWithWhite(line, 0.55) };
}

function metricCardPlanProAccentStyle(
  accent: KinetikMetricAccent
): ViewStyle | undefined {
  switch (accent) {
    case "green":
      return styles.metricCardPlanProGreen;
    case "magenta":
      return styles.metricCardPlanProMagenta;
    case "cyan":
      return styles.metricCardPlanProCyan;
    case "red":
      return styles.metricCardPlanProRed;
    default:
      return undefined;
  }
}

function KinetikMetricCardNative({
  label,
  value,
  rankLabel,
  footnote,
  accent,
  filledSegs = 0,
  showSegBar = true,
  segmentsReady = true,
  unit,
  unitHint,
  dayDelta,
  dayDeltaTone,
  rankBelowSegBar = false,
  compact = false,
  isPlanPro = false,
  language = "ja",
}: {
  label: string;
  value: string;
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
  const colors = KINETIK_METRIC_ACCENT[accent];
  const valueHasUnit = value.includes("%");
  const labelLatinUpper = kinetikMetricLabelUsesLatinUppercase(label);
  const rankBadge =
    rankLabel && segmentsReady ? (
      <View
        style={[
          styles.metricRankBadge,
          rankBelowSegBar && styles.metricRankBelow,
          isPlanPro && styles.metricRankBadgePlanPro,
        ]}
      >
        <Text
          style={[
            styles.metricRankBadgeText,
            isPlanPro && styles.metricRankBadgeTextPlanPro,
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
        isPlanPro && styles.metricCardPlanPro,
        isPlanPro ? metricCardPlanProAccentStyle(accent) : undefined,
      ]}
    >
      {isPlanPro ? (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(10,24,40,0.92)",
              "rgba(5,14,26,0.78)",
              "rgba(4,10,20,0.86)",
            ]}
            locations={[0, 0.48, 1]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.metricCardPlanProFill}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.09)",
              "transparent",
              "transparent",
              "rgba(167,139,250,0.05)",
            ]}
            locations={[0, 0.34, 0.66, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.metricCardPlanProSheen}
          />
          <View style={styles.metricCardCornerTl} pointerEvents="none" />
          <View style={styles.metricCardCornerBr} pointerEvents="none" />
        </>
      ) : null}
      <View
        style={[
          styles.metricAccentBar,
          compact && styles.metricAccentBarCompact,
          isPlanPro && styles.metricAccentBarPlanPro,
          {
            backgroundColor: colors.line,
            shadowColor: colors.glow,
            /** 左バーのにじみだけ。カード外周は影を付けない */
            shadowOpacity: isPlanPro ? 0.38 : 0.7,
            shadowRadius: isPlanPro ? 9 : 8,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      />
      <View style={styles.metricLabelRow}>
        <Text
          style={[
            styles.metricLabel,
            labelLatinUpper ? styles.metricLabelLatin : styles.metricLabelCjk,
            isPlanPro ? styles.metricLabelPlanPro : null,
            isPlanPro ? metricLabelPlanProAccentStyle(accent) : null,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {unitHint ? (
          <Text
            style={[
              styles.metricUnitHint,
              isPlanPro ? styles.metricUnitHintPlanPro : null,
              isPlanPro ? metricUnitHintPlanProAccentStyle(accent) : null,
            ]}
            numberOfLines={1}
          >
            {unitHint}
          </Text>
        ) : null}
      </View>
      <View style={[styles.metricValueRow, compact && styles.metricValueRowCompact]}>
        <Text
          style={[
            styles.metricValue,
            isPlanPro ? styles.metricValuePlanPro : null,
            isPlanPro ? metricValuePlanProAccentStyle(accent) : null,
          ]}
        >
          {value}
        </Text>
        {unit && !valueHasUnit ? (
          <Text
            style={[
              styles.metricUnit,
              isPlanPro ? styles.metricUnitPlanPro : null,
              isPlanPro ? metricUnitPlanProAccentStyle(accent) : null,
            ]}
          >
            {unit}
          </Text>
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
        {rankLabel && !rankBelowSegBar ? rankBadge : null}
      </View>
      {showSegBar ? (
        <View style={styles.metricSegWrap}>
          {segmentsReady ? (
            <KinetikSegBar filled={filledSegs} accent={accent} isPlanPro={isPlanPro} />
          ) : (
            <View style={styles.metricSegPlaceholder} />
          )}
        </View>
      ) : null}
      {rankBelowSegBar ? <View style={styles.metricRankWrap}>{rankBadge}</View> : null}
      {footnote ? (
        <Text
          style={[
            styles.metricFootnote,
            isPlanPro ? styles.metricFootnotePlanPro : null,
            isPlanPro
              ? {
                  borderLeftColor: metricValuePlanProAccentStyle(accent).color,
                  color: "rgba(255,255,255,0.74)",
                }
              : null,
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

  const streakTier = getKinetikStreakTier(winStreak);

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
        <KinetikSlantTabNative
          label={streakLabel}
          variant="outline"
          streakTier={
            streakTier > 0 ? (streakTier as 1 | 2 | 3 | 4) : undefined
          }
          explanation={getKinetikWinStreakExplanation(winStreak, language)}
          language={language}
          onPress={() =>
            showTagExplanation(
              getKinetikWinStreakExplanation(winStreak, language)
            )
          }
        />
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
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const enter = useSharedValue(reduceMotion ? 1 : 0);
  const floatY = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(enter);
    cancelAnimation(floatY);

    if (reduceMotion) {
      enter.value = 1;
      floatY.value = 0;
      return;
    }

    const enterDelayMs = proBridgeBadgeEnterDelayMs(index);
    const floatDelayMs =
      proBridgeBadgeFloatDelayMs(index) + (index % PRO_BRIDGE_FLOAT_PHASE_STAGGER) * 80;

    enter.value = 0;
    floatY.value = 0;

    enter.value = withDelay(
      enterDelayMs,
      withTiming(1, { duration: 580, easing: BADGE_ENTER_EASE })
    );
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
  }, [enter, floatY, index, reduceMotion]);

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
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  return (
    <KinetikBadgeProBridgeWrapNative index={index}>{children}</KinetikBadgeProBridgeWrapNative>
  );
}

function KinetikBadgeRowNative({
  badges,
  onBadgePress,
  inline = false,
  variant = "default",
}: {
  badges: ResolvedBadgeNative[];
  onBadgePress?: (badge: ResolvedBadgeNative) => void;
  inline?: boolean;
  variant?: "default" | "proBridge";
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
      <KinetikBadgeFloatWrapNative key={badge.id} index={index}>
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
  if (!memberSinceLabel && !idLabel) return null;

  return (
    <View style={styles.identityJoinIdRow}>
      {memberSinceLabel ? (
        <KinetikFooterRef style={[styles.footerRefIdentity, styles.footerRefJoin]}>
          <Text style={styles.footerRefTextIdentity}>{memberSinceLabel}</Text>
        </KinetikFooterRef>
      ) : (
        <View style={styles.identityJoinIdSpacer} />
      )}
      <KinetikIdentityIdChipNative
        idLabel={idLabel}
        shareCopied={shareCopied}
        copiedLabel={copiedLabel}
        shareLabel={shareLabel}
        onShare={onShare}
        pressableStyle={styles.identityIdPressInline}
        compact
      />
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
  stackedMetricsSections?: ProfileKinetikMetricsSection[];
  statsPending?: boolean;
  style?: ViewStyle;
};

export default function ProfileKinetikPanelNative({
  identity,
  stats,
  language = "ja",
  bio,
  countryCode = null,
  memberSinceMs = null,
  isPro = false,
  winStreak,
  totalPointsRank: totalPointsRankProp,
  totalPointsRankDenominator: totalPointsRankDenominatorProp,
  rankDeltaPlaces: rankDeltaPlacesProp,
  metricsTitle = "NBA // PLAYOFFS STATS",
  onToggleMetricsScope,
  badges = [],
  onBadgePress,
  canOpenMenu = false,
  onOpenMenu,
  menuUnreadCount = 0,
  shareHandle,
  metricValueDeltas = null,
  rankingLeague = "nba",
  stackedMetricsSections,
  statsPending = false,
  style,
}: ProfileKinetikPanelNativeProps) {
  const isJa = language === "ja";
  const isWcProfile = rankingLeague === "worldcup";
  const [shareCopied, setShareCopied] = useState(false);

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
  const proFrameTheme = isPro ? kinetikPlanProFrameTheme(profileAccent) : null;
  const panelBorder = kinetikPanelBorderColor(profileAccent);
  const reduceMotion = useReducedMotion();
  const animatePlanProBg = isPro && reduceMotion !== true;
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const memberSinceLabel = formatProfileMemberSince(memberSinceMs, language);
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
      cumulativeUnitHint: isJa ? "累計" : "CUM",
      winRateUnitHint: "%",
    }),
    [isJa]
  );

  const wcStackedActive =
    isWcProfile &&
    stackedMetricsSections != null &&
    stackedMetricsSections.length > 0;
  const metricsHeaderTitle = isWcProfile
    ? metricsTitle ?? "WORLD CUP // STATS"
    : metricsTitle ?? "NBA // PLAYOFFS STATS";
  const stageTabTexts = rankingsTexts(language);

  const [wcStackedStage, setWcStackedStage] =
    useState<WcKinetikStackedStage>("main");
  const wcStackedAvailableStages = useMemo(
    () =>
      PROFILE_WC_STACKED_STAGE_TAB_ORDER.filter((stage) =>
        stackedMetricsSections?.some((section) => section.wcStage === stage)
      ),
    [stackedMetricsSections]
  );
  useEffect(() => {
    if (wcStackedAvailableStages.length === 0) return;
    setWcStackedStage((prev) =>
      wcStackedAvailableStages.includes(prev) ? prev : wcStackedAvailableStages[0]!
    );
  }, [wcStackedAvailableStages]);
  const showWcStackedStageTabs = wcStackedAvailableStages.length > 1;
  const activeWcStackedSection =
    stackedMetricsSections?.find((section) => section.wcStage === wcStackedStage) ??
    stackedMetricsSections?.[0] ??
    null;

  const renderMetricsGrid = (
    sectionStats: ProfileEditKinetikStats,
    sectionDeltas: MyRankMetricValueDeltas | null,
    sectionRank: {
      totalPointsRank: number | null;
      totalPointsRankDenominator: number | null;
    }
  ) => {
    const sectionWinRateFootnote = isJa
      ? `投稿 ${sectionStats.posts} · 的中 ${sectionStats.hits}`
      : `${sectionStats.hits} hits · ${sectionStats.posts} posts`;
    const sectionTotalPointsRankLabel =
      sectionRank.totalPointsRank != null
        ? isJa
          ? `${sectionRank.totalPointsRank}位`
          : `#${sectionRank.totalPointsRank}`
        : undefined;
    const sectionPtsSegmentsReady =
      sectionRank.totalPointsRankDenominator != null &&
      Number.isFinite(sectionRank.totalPointsRankDenominator) &&
      sectionRank.totalPointsRankDenominator >= 1;

    return (
      <View style={[styles.metricsGrid, isPro ? styles.metricsGridPlanPro : null]}>
        <KinetikMetricCardNative
          label={isJa ? "勝率" : "WIN RATE"}
          value={`${formatMetricDecimals(sectionStats.winRate, 1)}%`}
          footnote={sectionWinRateFootnote}
          accent="green"
          filledSegs={kinetikWinRateSegs(sectionStats.winRate)}
          unitHint={metricCopy.winRateUnitHint}
          dayDelta={formatProfileMetricDayDelta("winRate", sectionDeltas?.winRate)}
          dayDeltaTone={profileMetricDeltaTone(sectionDeltas?.winRate ?? null)}
          isPlanPro={isPro}
        />
        <KinetikMetricCardNative
          label={isJa ? "総合得点" : "TOTAL PTS"}
          value={sectionStats.totalPoints.toLocaleString()}
          rankLabel={sectionTotalPointsRankLabel}
          accent="magenta"
          filledSegs={kinetikTotalPointsRankSegs(
            sectionRank.totalPointsRank,
            sectionRank.totalPointsRankDenominator
          )}
          segmentsReady={sectionPtsSegmentsReady}
          rankBelowSegBar
          unit={metricCopy.ptsUnit}
          unitHint={metricCopy.cumulativeUnitHint}
          dayDelta={
            formatProfileMetricDayDelta("totalPoints", sectionDeltas?.totalPoints)
              ? `${formatProfileMetricDayDelta("totalPoints", sectionDeltas?.totalPoints)} ${metricCopy.ptsUnit}`
              : null
          }
          dayDeltaTone={profileMetricDeltaTone(sectionDeltas?.totalPoints ?? null)}
          isPlanPro={isPro}
          language={language}
        />
        <KinetikMetricCardNative
          label={
            isWcProfile
              ? isJa
                ? "完全的中"
                : "EXACT HITS"
              : isJa
                ? "スコア精度"
                : "PRECISION"
          }
          value={
            isWcProfile
              ? String(Math.max(0, Math.round(sectionStats.scorePrecision)))
              : formatMetricDecimals(sectionStats.scorePrecision, 1)
          }
          accent="cyan"
          showSegBar={false}
          compact
          unit={isWcProfile ? metricCopy.matchUnit : metricCopy.ptsUnit}
          unitHint={metricCopy.cumulativeUnitHint}
          dayDelta={
            formatProfileMetricDayDelta("scorePrecision", sectionDeltas?.totalPrecision, {
              integer: isWcProfile,
            })
              ? isWcProfile
                ? `${formatProfileMetricDayDelta("scorePrecision", sectionDeltas?.totalPrecision, { integer: true })} ${metricCopy.matchUnit}`
                : `${formatProfileMetricDayDelta("scorePrecision", sectionDeltas?.totalPrecision)} ${metricCopy.ptsUnit}`
              : null
          }
          dayDeltaTone={profileMetricDeltaTone(
            sectionDeltas?.totalPrecision ?? null,
            { positiveOnly: isWcProfile }
          )}
          isPlanPro={isPro}
        />
        <KinetikMetricCardNative
          label={KINETIK_UPSET_METRIC_LABEL}
          value={formatMetricDecimals(sectionStats.upset, 1)}
          accent="red"
          showSegBar={false}
          compact
          unit={metricCopy.ptsUnit}
          unitHint={metricCopy.cumulativeUnitHint}
          dayDelta={
            formatProfileMetricDayDelta("upset", sectionDeltas?.totalUpset)
              ? `${formatProfileMetricDayDelta("upset", sectionDeltas?.totalUpset)} ${metricCopy.ptsUnit}`
              : null
          }
          dayDeltaTone={profileMetricDeltaTone(sectionDeltas?.totalUpset ?? null)}
          isPlanPro={isPro}
        />
      </View>
    );
  };

  return (
    <View
      style={[
        styles.frameOuter,
        { borderColor: panelBorder },
        isPro && proFrameTheme
          ? {
              shadowColor: proFrameTheme.strong,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.28,
              shadowRadius: 18,
              elevation: 6,
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
      {isPro && frameSize.width > 0 ? (
        <ProfilePlanProBackgroundNative
          width={frameSize.width}
          height={frameSize.height}
          animate={animatePlanProBg}
          variant={PROFILE_PLAN_PRO_BG_DEFAULT}
          profileAccent={profileAccent}
          accentReady={!statsPending}
        />
      ) : null}

      {isPro && PROFILE_PLAN_PRO_BG_DEFAULT !== "atmos" ? (
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
          <ProfileKinetikAvatarWithStreakNative
            photoURL={identity.photoURL}
            displayName={identity.displayName}
            streak={activeWinStreak}
            accentKey={menuAccent}
            isPlanPro={isPro}
          />
          <View style={styles.headerMeta}>
            <KinetikHeaderHatch />
            {canOpenMenu ? (
              <View style={styles.headerMenuAnchor}>
                <CyberMenuButton
                  size="md"
                  onPress={() => onOpenMenu?.()}
                  accessibilityLabel={isJa ? "メニュー" : "Menu"}
                  badge={
                    menuUnreadCount > 0 ? (
                      <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>
                          {menuUnreadCount > 99 ? "99+" : String(menuUnreadCount)}
                        </Text>
                      </View>
                    ) : null
                  }
                />
              </View>
            ) : null}
            <View
              style={[
                styles.headerIdentity,
                canOpenMenu ? styles.headerIdentityWithMenu : null,
              ]}
            >
              <View style={styles.nameRow}>
                <Text
                  style={[styles.displayName, isPro ? styles.displayNamePro : null]}
                  numberOfLines={1}
                >
                  {identity.displayName}
                </Text>
                {profileFlagUri ? (
                  <View
                    style={styles.nameInlineFlagWrap}
                    accessibilityLabel={countryCode ?? undefined}
                  >
                    <Image
                      source={{ uri: profileFlagUri }}
                      style={styles.nameInlineFlag}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}
                {isPro ? <ProCyberBadgeNative premium /> : null}
              </View>
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
            />
          ) : null}
        </View>
      ) : (
        <KinetikBadgeRowNative badges={badges} onBadgePress={onBadgePress} />
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
        {statsPending ? (
          <View style={styles.metricsGrid}>
            <View style={styles.metricsSkeleton} />
            <View style={styles.metricsSkeleton} />
            <View style={styles.metricsSkeleton} />
            <View style={styles.metricsSkeleton} />
          </View>
        ) : wcStackedActive && activeWcStackedSection ? (
          <View>
            {showWcStackedStageTabs ? (
              <View style={[styles.metricsStageTabWrap, isPro ? styles.metricsDividerPlanPro : null]}>
                <CyberSlantedTabBarNative fill>
                  {wcStackedAvailableStages.map((stage) => (
                    <CyberSlantedTabNative
                      key={stage}
                      label={
                        stage === "main"
                          ? stageTabTexts.stageKnockout
                          : stageTabTexts.stageGroup
                      }
                      active={wcStackedStage === stage}
                      fill
                      compact
                      onPress={() => setWcStackedStage(stage)}
                    />
                  ))}
                </CyberSlantedTabBarNative>
              </View>
            ) : null}
            <View>
              <View style={[styles.metricsSubHeader, isPro ? styles.metricsDividerPlanPro : null]}>
                {!showWcStackedStageTabs ? (
                  <Text style={styles.metricsSubTitle} numberOfLines={2}>
                    {activeWcStackedSection.title}
                  </Text>
                ) : null}
                <KinetikHeaderTabsNative
                  rankBadge={activeWcStackedSection.rankBadge}
                  winStreak={activeWcStackedSection.winStreak}
                  language={language}
                />
              </View>
              {renderMetricsGrid(
                activeWcStackedSection.stats,
                activeWcStackedSection.metricValueDeltas,
                {
                  totalPointsRank: activeWcStackedSection.totalPointsRank,
                  totalPointsRankDenominator:
                    activeWcStackedSection.totalPointsRankDenominator,
                }
              )}
            </View>
          </View>
        ) : (
          <View>
            <View style={[styles.metricsSubHeader, isPro ? styles.metricsDividerPlanPro : null]}>
              <KinetikHeaderTabsNative
                rankBadge={rankBadge}
                winStreak={activeWinStreak}
                language={language}
              />
            </View>
            {renderMetricsGrid(stats, metricValueDeltas, {
              totalPointsRank: activeTotalPointsRank,
              totalPointsRankDenominator: activeRankDenominator,
            })}
          </View>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  frameOuter: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  frameOuterPlanPro: {
    backgroundColor: "rgba(3,8,13,0.14)",
    minHeight: 520,
    flexDirection: "column",
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
  headerMenuAnchor: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 3,
  },
  headerIdentity: {
    minWidth: 0,
  },
  headerIdentityWithMenu: {
    paddingRight: HEADER_MENU_CLEARANCE,
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
    flexWrap: "wrap",
  },
  nameInlineFlagWrap: {
    width: 18,
    height: 12,
    borderRadius: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.28)",
    overflow: "hidden",
    flexShrink: 0,
  },
  nameInlineFlag: {
    width: "100%",
    height: "100%",
  },
  identityIdPress: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    marginTop: 2,
  },
  identityIdPressInline: {
    alignSelf: "flex-end",
    marginTop: 0,
    flexShrink: 0,
  },
  identityJoinIdRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 4,
    width: "100%",
    marginTop: 2,
  },
  identityJoinIdSpacer: {
    flex: 1,
    minWidth: 0,
  },
  footerRefJoin: {
    flexShrink: 0,
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
  displayName: {
    flexShrink: 1,
    alignSelf: "flex-start",
    maxWidth: "100%",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 16,
    lineHeight: 20,
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
  badgeRowEmpty: { marginTop: 8, minHeight: 4 },
  badgeBridgePro: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 60 + BADGE_FLOAT_TOP_CLEARANCE_PX,
    marginHorizontal: -16,
    paddingTop: 8,
    paddingBottom: 12,
    zIndex: 1,
    justifyContent: "flex-start",
    overflow: "visible",
  },
  badgeBridgeProEmpty: {
    minHeight: 48,
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
    overflow: "hidden",
  },
  metricsPanelPlanPro: {
    marginTop: 0,
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
  /** skew タブのはみ出し用 */
  metricsStageTabWrap: {
    overflow: "visible",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
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
    padding: 10,
    gap: 10,
  },
  metricsGridPlanPro: {
    backgroundColor: "rgba(34,211,238,0.04)",
  },
  metricCard: {
    width: "47%",
    flexGrow: 1,
    minHeight: 104,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 16,
    position: "relative",
  },
  metricCardCompact: {
    minHeight: 76,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  metricCardPlanPro: {
    /** 塗りは Fill。色付き外周枠は出さず、黒落ち影のみ */
    backgroundColor: "transparent",
    borderColor: "rgba(255,255,255,0.07)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42,
    shadowRadius: 12,
    elevation: 3,
    overflow: "hidden",
  },
  metricCardPlanProFill: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  /** Web `.profile-plan-pro-metric-card__sheen` */
  metricCardPlanProSheen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    opacity: 0.45,
  },
  metricCardPlanProGreen: {
    borderColor: "rgba(255,255,255,0.07)",
  },
  metricCardPlanProMagenta: {
    borderColor: "rgba(255,255,255,0.07)",
  },
  metricCardPlanProCyan: {
    borderColor: "rgba(255,255,255,0.07)",
  },
  metricCardPlanProRed: {
    borderColor: "rgba(255,255,255,0.07)",
  },
  metricCardCornerTl: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 12,
    height: 12,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: "rgba(34,211,238,0.32)",
    zIndex: 1,
  },
  metricCardCornerBr: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: "rgba(167,139,250,0.26)",
    zIndex: 1,
  },
  metricAccentBarPlanPro: {
    width: 4,
    borderRadius: 2,
    zIndex: 1,
  },
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
    paddingLeft: 10,
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
    paddingLeft: 10,
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
    paddingLeft: 10,
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
