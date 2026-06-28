import { useCallback, useMemo, useState, type ReactNode } from "react";
import { cyberAlert } from "../../../components/cyberAlert";
import {
  Image, Platform, Pressable, Share, StyleSheet, Text, View, type ViewStyle,
} from "react-native";
import type { ProfileEditKinetikStats } from "../../../../../../app/component/profile/edit/profileEditKinetikTypes";
import type { ProfileEditTronIdentity } from "../../../../../../app/component/profile/edit/profileEditTronTypes";
import {
  resolveKinetikMenuAccent,
  resolveKinetikProfileAccent,
  resolveKinetikRankBadge,
  type KinetikRankBadgeResult,
  type KinetikRankBadgeTier,
} from "../../../../../../app/component/profile/edit/kinetikRankBadge";
import ProfileKinetikAvatarWithStreakNative from "./ProfileKinetikAvatarWithStreakNative";
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
import type { ProfileKinetikMetricsSection } from "../../../../../../lib/profile/profileKinetikMetricsSection";
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
  type KinetikMetricAccent,
} from "./profileKinetikNativeTheme";

const OXANIUM_BOLD = "Oxanium_700Bold";
const OXANIUM_EXTRA = "Oxanium_800ExtraBold";

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

function KinetikSegBar({
  filled,
  total = 5,
  accent,
}: {
  filled: number;
  total?: number;
  accent: KinetikMetricAccent;
}) {
  const colors = KINETIK_METRIC_ACCENT[accent];
  return (
    <View style={styles.segRow}>
      {Array.from({ length: total }).map((_, i) => {
        const lit = i < filled;
        return (
          <View
            key={i}
            style={[
              styles.seg,
              {
                backgroundColor: lit ? colors.fill : "rgba(255,255,255,0.08)",
                shadowColor: lit ? colors.glow : "transparent",
                shadowOpacity: lit ? 1 : 0,
                shadowRadius: lit ? 6 : 0,
              },
            ]}
          />
        );
      })}
    </View>
  );
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
}) {
  const colors = KINETIK_METRIC_ACCENT[accent];
  const valueHasUnit = value.includes("%");
  const rankBadge =
    rankLabel && segmentsReady ? (
      <Text style={[styles.metricRankBadge, rankBelowSegBar && styles.metricRankBelow]}>
        {rankLabel}
      </Text>
    ) : null;

  return (
    <View style={[styles.metricCard, compact && styles.metricCardCompact]}>
      <View
        style={[
          styles.metricAccentBar,
          compact && styles.metricAccentBarCompact,
          { backgroundColor: colors.line, shadowColor: colors.glow },
        ]}
      />
      <View style={styles.metricLabelRow}>
        <Text style={styles.metricLabel}>{label}</Text>
        {unitHint ? <Text style={styles.metricUnitHint}>{unitHint}</Text> : null}
      </View>
      <View style={[styles.metricValueRow, compact && styles.metricValueRowCompact]}>
        <Text style={styles.metricValue}>{value}</Text>
        {unit && !valueHasUnit ? <Text style={styles.metricUnit}>{unit}</Text> : null}
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
            <KinetikSegBar filled={filledSegs} accent={accent} />
          ) : (
            <View style={styles.metricSegPlaceholder} />
          )}
        </View>
      ) : null}
      {rankBelowSegBar ? <View style={styles.metricRankWrap}>{rankBadge}</View> : null}
      {footnote ? <Text style={styles.metricFootnote}>{footnote}</Text> : null}
    </View>
  );
}

function SlantTabScanNative({ filled = false }: { filled?: boolean }) {
  const step = filled ? 2 : 3;
  const count = filled ? 7 : 10;
  return (
    <View style={styles.slantTabScan} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.slantTabScanLine, { top: i * step }]} />
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

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={explanation ?? label}
      style={({ pressed }) => [pressed && onPress ? { opacity: 0.88 } : null]}
    >
      <View style={styles.slantTabOuter}>
        <View
          style={[
          styles.slantTab,
          filled
            ? {
                backgroundColor: accent,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.32)",
                shadowColor: glow,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.88,
                shadowRadius: 5,
                elevation: 3,
              }
            : {
                backgroundColor: "rgba(0,0,0,0.18)",
                borderWidth: 1,
                borderColor: accent,
                shadowColor: glow,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.55,
                shadowRadius: 4,
                elevation: 2,
              },
        ]}
      >
        {filled ? <SlantTabScanNative filled /> : null}
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
          streakTier={streakTier > 0 ? streakTier : undefined}
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

function KinetikBadgeRowNative({
  badges,
  onBadgePress,
}: {
  badges: ResolvedBadgeNative[];
  onBadgePress?: (badge: ResolvedBadgeNative) => void;
}) {
  if (badges.length === 0) {
    return <View style={styles.badgeRowEmpty} />;
  }

  return (
    <View style={styles.badgeRow}>
      {badges.slice(0, 10).map((badge) => (
        <Pressable
          key={badge.id}
          style={styles.badgeThumb}
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
      ))}
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
  style?: ViewStyle;
}) {
  return <View style={[styles.footerRef, style]}>{children}</View>;
}

function KinetikIdentityIdChipNative({
  idLabel,
  shareCopied,
  copiedLabel,
  shareLabel,
  onShare,
}: {
  idLabel: string;
  shareCopied: boolean;
  copiedLabel: string;
  shareLabel: string;
  onShare: () => void;
}) {
  if (!idLabel) return null;

  return (
    <Pressable
      onPress={onShare}
      accessibilityRole="button"
      accessibilityLabel={shareLabel}
      style={styles.identityIdPress}
    >
      <KinetikFooterRef style={styles.identityIdRef}>
        <Text style={styles.footerRefText} numberOfLines={1}>
          {shareCopied ? copiedLabel : `ID: ${idLabel}`}
        </Text>
      </KinetikFooterRef>
    </Pressable>
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
  const panelBorder = kinetikPanelBorderColor(profileAccent);
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
  const metricsHeaderTitle = wcStackedActive
    ? "WORLD CUP // STATS"
    : metricsTitle;

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
      <View style={styles.metricsGrid}>
        <KinetikMetricCardNative
          label={isJa ? "勝率" : "WIN RATE"}
          value={`${formatMetricDecimals(sectionStats.winRate, 1)}%`}
          footnote={sectionWinRateFootnote}
          accent="green"
          filledSegs={kinetikWinRateSegs(sectionStats.winRate)}
          unitHint={metricCopy.winRateUnitHint}
          dayDelta={formatProfileMetricDayDelta("winRate", sectionDeltas?.winRate)}
          dayDeltaTone={profileMetricDeltaTone(sectionDeltas?.winRate ?? null)}
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
        />
        <KinetikMetricCardNative
          label={isJa ? "アップセット" : "UPSET"}
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
        />
      </View>
    );
  };

  return (
    <View style={[styles.frameOuter, { borderColor: panelBorder }, style]}>

      <View style={styles.headerRow}>
        <ProfileKinetikAvatarWithStreakNative
          photoURL={identity.photoURL}
          displayName={identity.displayName}
          streak={activeWinStreak}
          accentKey={menuAccent}
        />
        <View style={styles.headerMeta}>
          <KinetikHeaderHatch />
          <View style={[styles.headerTabsRow, wcStackedActive && styles.headerTabsRowEnd]}>
            {!wcStackedActive ? (
              <View style={styles.headerTabsFlex}>
                <KinetikHeaderTabsNative
                  rankBadge={rankBadge}
                  winStreak={activeWinStreak}
                  language={language}
                />
              </View>
            ) : null}
            {canOpenMenu ? (
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
            ) : null}
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.displayName} numberOfLines={1}>
              {identity.displayName}
            </Text>
            {profileFlagUri ? (
              <View style={styles.nameInlineFlagWrap} accessibilityLabel={countryCode ?? undefined}>
                <Image
                  source={{ uri: profileFlagUri }}
                  style={styles.nameInlineFlag}
                  resizeMode="cover"
                />
              </View>
            ) : null}
            {isPro ? (
              <View style={styles.proPill}>
                <Text style={styles.proPillText}>PRO</Text>
              </View>
            ) : null}
          </View>
          <KinetikIdentityIdChipNative
            idLabel={profileIdLabel}
            shareCopied={shareCopied}
            copiedLabel={shareCopiedLabel}
            shareLabel={shareProfileLabel}
            onShare={handleShareProfile}
          />
          {bio?.trim() ? (
            <Text style={styles.bio} numberOfLines={3}>
              {bio.trim()}
            </Text>
          ) : null}
        </View>
      </View>

      <KinetikBadgeRowNative badges={badges} onBadgePress={onBadgePress} />

      <View style={styles.metricsPanel}>
        <View style={styles.metricsHeader}>
          {onToggleMetricsScope ? (
            <>
              <Pressable onPress={onToggleMetricsScope} hitSlop={8}>
                <Text style={styles.scopeChevron}>◀</Text>
              </Pressable>
              <Pressable style={styles.metricsTitlePress} onPress={onToggleMetricsScope}>
                <Text style={styles.metricsTitle} numberOfLines={1}>
                  {metricsHeaderTitle}
                </Text>
              </Pressable>
              <Pressable onPress={onToggleMetricsScope} hitSlop={8}>
                <Text style={styles.scopeChevron}>▶</Text>
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
        ) : wcStackedActive ? (
          <View>
            {stackedMetricsSections!.map((section) => (
              <View key={section.title}>
                <View style={styles.metricsSubHeader}>
                  <Text style={styles.metricsSubTitle} numberOfLines={2}>
                    {section.title}
                  </Text>
                  <KinetikHeaderTabsNative
                    rankBadge={section.rankBadge}
                    winStreak={section.winStreak}
                    language={language}
                  />
                </View>
                {renderMetricsGrid(section.stats, section.metricValueDeltas, {
                  totalPointsRank: section.totalPointsRank,
                  totalPointsRankDenominator: section.totalPointsRankDenominator,
                })}
              </View>
            ))}
          </View>
        ) : (
          renderMetricsGrid(stats, metricValueDeltas, {
            totalPointsRank: activeTotalPointsRank,
            totalPointsRankDenominator: activeRankDenominator,
          })
        )}
      </View>

      <KinetikFooterNative memberSinceLabel={memberSinceLabel} />
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
  headerRow: { flexDirection: "row", gap: 16, alignItems: "flex-start" },
  headerMeta: { flex: 1, minWidth: 0, position: "relative", overflow: "visible" },
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
    marginTop: 4,
  },
  identityIdRef: {
    paddingTop: 4,
    paddingRight: 10,
    paddingBottom: 5,
    paddingLeft: 8,
    minHeight: 22,
  },
  displayName: {
    flexShrink: 1,
    fontFamily: OXANIUM_EXTRA,
    fontSize: 17,
    fontStyle: "italic",
    color: "#f8fafc",
    letterSpacing: -0.3,
  },
  proPill: {
    borderWidth: 1,
    borderColor: "rgba(255,43,214,0.55)",
    backgroundColor: "rgba(255,43,214,0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proPillText: {
    fontFamily: OXANIUM_BOLD,
    fontSize: 9,
    color: "#ff2bd6",
    letterSpacing: 1,
  },
  bio: {
    marginTop: 6,
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
  badgeRowEmpty: { marginTop: 8, minHeight: 4 },
  badgeThumb: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  metricsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  metricsTitlePress: { flex: 1, minWidth: 0 },
  metricsTitle: {
    flex: 1,
    fontFamily: OXANIUM_BOLD,
    fontSize: 10,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.72)",
    textTransform: "uppercase",
  },
  metricsSubHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  metricsSubTitle: {
    fontFamily: OXANIUM_BOLD,
    fontSize: 9,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.62)",
    textTransform: "uppercase",
  },
  metricsSkeleton: {
    width: "47%",
    flexGrow: 1,
    minHeight: 76,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  scopeChevron: { color: "rgba(255,255,255,0.35)", fontSize: 10, paddingHorizontal: 2 },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    gap: 10,
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
  metricAccentBar: {
    position: "absolute",
    left: 0,
    top: 14,
    bottom: 14,
    width: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  metricAccentBarCompact: {
    top: 10,
    bottom: 10,
  },
  metricLabelRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 10 },
  metricLabel: {
    fontFamily: OXANIUM_BOLD,
    fontSize: 10,
    letterSpacing: 1.3,
    color: "rgba(255,255,255,0.62)",
    textTransform: "uppercase",
  },
  metricUnitHint: {
    fontFamily: OXANIUM_BOLD,
    fontSize: 9,
    color: "rgba(255,255,255,0.38)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  metricValueRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: 5,
    marginTop: 8,
    paddingLeft: 10,
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
    fontFamily: OXANIUM_BOLD,
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  metricRankBelow: { alignSelf: "flex-start" },
  metricRankWrap: { paddingLeft: 10, marginTop: 10 },
  metricSegWrap: { marginTop: 10, paddingLeft: 10 },
  metricSegPlaceholder: { height: 6 },
  segRow: { flexDirection: "row", gap: 3 },
  seg: { flex: 1, height: 6 },
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
