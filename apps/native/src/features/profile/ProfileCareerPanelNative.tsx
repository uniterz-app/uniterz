/**
 * Web `ProfileCareerPanel` 相当 — 予想者の履歴書（公開）。
 * face + Pro のときは表カードと同じ Pro スキン背景を載せる。
 */
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useReducedMotion } from "react-native-reanimated";
import {
  aggregateCareerAwardsFromBadges,
  type ProfileCareerBadgeLike,
} from "../../../../../lib/profile/profileCareerStats";
import type { ProfilePlanProBgVariant } from "../../../../../lib/profile/profilePlanProBgVariants";
import { PROFILE_PLAN_PRO_BG_DEFAULT } from "../../../../../lib/profile/profilePlanProBgVariants";
import {
  buildUserCareerBoardRows,
  buildUserCareerSummaryRows,
  type UserCareerDoc,
} from "../../../../../lib/profile/userCareer";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../lib/rankings/nbaSeason";
import ProfilePlanProBackgroundNative from "./kinetik/ProfilePlanProBackgroundNative";
import {
  KINETIK_FLIP_EAR,
  ProfileKinetikFlipEarNative,
  ProfileKinetikFlipEarTopEdgesNative,
  useProfileKinetikFlipEar,
} from "./kinetik/ProfileKinetikFlipEarNative";
import ProfileOverviewChartCardNative from "./ProfileOverviewChartCardNative";
import {
  profileOverviewChartSubtitleStyle,
  profileOverviewChartTitleStyle,
} from "./profileOverviewChartShell";

const RAJDHANI = "Rajdhani_600SemiBold";
const OXANIUM = "Oxanium_700Bold";

type Props = {
  language: "ja" | "en";
  career?: UserCareerDoc | null;
  badges?: readonly ProfileCareerBadgeLike[];
  loading?: boolean;
  loadError?: string | null;
  /** section: overview / face: カード裏面 */
  variant?: "section" | "face";
  isPro?: boolean;
  planProBgVariant?: ProfilePlanProBgVariant;
};

type CareerRow = { key: string; label: string; value: string };

export default function ProfileCareerPanelNative({
  language,
  career = null,
  badges = [],
  loading = false,
  loadError = null,
  variant = "section",
  isPro = false,
  planProBgVariant = PROFILE_PLAN_PRO_BG_DEFAULT,
}: Props) {
  const isJa = language === "ja";
  const isFace = variant === "face";
  const showProSkin = isPro && isFace;
  const reduceMotion = useReducedMotion() === true;
  const flipEar = useProfileKinetikFlipEar();
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const faceBorder = showProSkin
    ? "rgba(34,211,238,0.35)"
    : "rgba(103,232,249,0.2)";

  const seasonKeys = useMemo(() => {
    const keys = Object.keys(career?.seasons ?? {}).sort();
    if (keys.length === 0) return [CURRENT_NBA_SEASON_KEY];
    return keys;
  }, [career]);

  const [viewMode, setViewMode] = useState<"career" | "season">("career");
  const [seasonKey, setSeasonKey] = useState<string>(
    () => seasonKeys[seasonKeys.length - 1] ?? CURRENT_NBA_SEASON_KEY
  );
  const [board, setBoard] = useState<"regular" | "playoffs">("regular");

  const copy = useMemo(
    () =>
      isJa
        ? {
            title: "CAREER",
            sheetTitle: "CAREER // SHEET",
            desc: "予想者としての履歴書。長期成績は信頼の証明になる。",
            awards: "Awards",
            seasonAllTime: "All-Time",
            dossier: "PREDICTOR DOSSIER",
          }
        : {
            title: "CAREER",
            sheetTitle: "CAREER // SHEET",
            desc: "Your résumé as a predictor. Long-term records build trust.",
            awards: "Awards",
            seasonAllTime: "All-Time",
            dossier: "PREDICTOR DOSSIER",
          },
    [isJa]
  );

  const awards = useMemo(
    () => aggregateCareerAwardsFromBadges(badges, language),
    [badges, language]
  );

  const rows: CareerRow[] = useMemo(() => {
    if (!career) return [];
    if (viewMode === "career") {
      return buildUserCareerSummaryRows(career.summary, language);
    }
    const chapter = career.seasons[seasonKey];
    const boardStats =
      board === "playoffs" ? chapter?.playoffs : chapter?.regular;
    if (!boardStats) return [];
    return buildUserCareerBoardRows(boardStats, language);
  }, [career, viewMode, seasonKey, board, language]);

  const scopeTitle =
    viewMode === "career"
      ? "CAREER // ALL"
      : board === "playoffs"
        ? `${seasonKey} PLAYOFFS`
        : `${seasonKey} SEASON`;

  const cycleScope = () => {
    if (viewMode === "career") {
      setViewMode("season");
      setBoard("regular");
      setSeasonKey(seasonKeys[seasonKeys.length - 1] ?? CURRENT_NBA_SEASON_KEY);
      return;
    }
    if (board === "regular") {
      setBoard("playoffs");
      return;
    }
    const idx = seasonKeys.indexOf(seasonKey);
    if (idx >= 0 && idx < seasonKeys.length - 1) {
      setSeasonKey(seasonKeys[idx + 1]!);
      setBoard("regular");
      return;
    }
    setViewMode("career");
  };

  const content = (
    <>
      {isFace ? (
        <View style={styles.sheetTitleWrap}>
          <Text style={styles.sheetTitle} numberOfLines={1}>
            {copy.sheetTitle}
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.dossier}>{copy.dossier}</Text>
          <Text
            style={[
              profileOverviewChartTitleStyle,
              showProSkin ? styles.titlePro : null,
            ]}
          >
            {copy.title}
          </Text>
          <View
            style={[styles.titleRule, showProSkin ? styles.titleRulePro : null]}
          />
        </>
      )}
      {isFace ? (
        <View style={styles.scopeHeader}>
          <Pressable
            style={[styles.scopeNavBtn, styles.scopeNavBtnLeft]}
            onPress={cycleScope}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isJa ? "前の統計ボード" : "Previous stats board"}
          >
            <View
              style={[
                styles.scopeArrow,
                styles.scopeArrowLeft,
                showProSkin ? styles.scopeArrowPro : null,
              ]}
            />
          </Pressable>
          <Pressable
            style={styles.scopeTitlePress}
            onPress={cycleScope}
            accessibilityRole="button"
            accessibilityLabel={
              isJa ? "CAREER / SEASON / PLAYOFF を切り替え" : "Switch Career / Season / Playoff"
            }
          >
            <Text
              style={[
                styles.scopeTitleText,
                showProSkin ? styles.titlePro : null,
                styles.scopeTitle,
              ]}
              numberOfLines={1}
            >
              {scopeTitle}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.scopeNavBtn, styles.scopeNavBtnRight]}
            onPress={cycleScope}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isJa ? "次の統計ボード" : "Next stats board"}
          >
            <View
              style={[
                styles.scopeArrow,
                styles.scopeArrowRight,
                showProSkin ? styles.scopeArrowPro : null,
              ]}
            />
          </Pressable>
        </View>
      ) : null}
      {!isFace ? (
        <>
          <View
            style={[styles.titleRule, showProSkin ? styles.titleRulePro : null]}
          />
          <Text style={[profileOverviewChartSubtitleStyle, styles.desc]}>
            {copy.desc}
          </Text>
        </>
      ) : null}

      {loading ? (
        <View style={styles.skeleton} />
      ) : rows.length === 0 ? (
        <Text style={styles.emptyAward}>
          {loadError
            ? isJa
              ? "CAREER を取得できませんでした"
              : "Couldn’t load CAREER"
            : isJa
              ? "CAREER データがまだありません"
              : "No CAREER data yet"}
        </Text>
      ) : (
        <>
          <View style={styles.grid}>
            {rows.map((row) => (
              <View
                key={row.key}
                style={[styles.cell, showProSkin ? styles.cellPro : null]}
              >
                <Text
                  style={[styles.label, showProSkin ? styles.labelPro : null]}
                >
                  {row.label}
                </Text>
                <Text
                  style={[styles.value, showProSkin ? styles.valuePro : null]}
                  numberOfLines={1}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </View>

          {viewMode === "career" ? (
            <>
              <Text style={[styles.label, styles.awardsLabel]}>{copy.awards}</Text>
              {awards.length === 0 ? (
                <Text style={styles.emptyAward}>—</Text>
              ) : (
                <View style={styles.awardRow}>
                  {awards.map((award) => (
                    <View
                      key={award.key}
                      style={[
                        styles.awardChip,
                        showProSkin ? styles.awardChipPro : null,
                      ]}
                    >
                      <Text style={styles.awardChipText}>
                        {award.label}
                        {award.count > 1 ? ` ×${award.count}` : ""}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : null}

          <View style={styles.seasonRow}>
            <Pressable
              onPress={() => setViewMode("career")}
              style={[
                styles.seasonPill,
                viewMode === "career" ? styles.seasonPillActive : null,
              ]}
            >
              <Text
                style={[
                  styles.seasonPillText,
                  viewMode === "career" ? styles.seasonPillTextActive : null,
                ]}
              >
                {copy.seasonAllTime}
              </Text>
            </Pressable>
            {seasonKeys.map((opt) => {
              const active = viewMode === "season" && seasonKey === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    setViewMode("season");
                    setSeasonKey(opt);
                    setBoard("regular");
                  }}
                  style={[
                    styles.seasonPill,
                    active ? styles.seasonPillActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.seasonPillText,
                      active ? styles.seasonPillTextActive : null,
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </>
  );

  if (isFace) {
    return (
      <View
        style={[
          styles.faceShell,
          flipEar ? { paddingTop: KINETIK_FLIP_EAR.lip } : null,
        ]}
      >
        {flipEar ? <ProfileKinetikFlipEarNative /> : null}
        <View
          style={[
            styles.faceRoot,
            showProSkin ? styles.faceRootPro : styles.faceRootFree,
            flipEar ? styles.faceRootNotched : null,
          ]}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setFrameSize({ width, height });
          }}
        >
          {flipEar ? (
            <ProfileKinetikFlipEarTopEdgesNative borderColor={faceBorder} />
          ) : null}
          {showProSkin && frameSize.width > 0 && frameSize.height > 0 ? (
            <ProfilePlanProBackgroundNative
              width={frameSize.width}
              height={frameSize.height}
              animate={!reduceMotion}
              variant={planProBgVariant}
              accentReady
            />
          ) : null}
          {showProSkin ? (
            <LinearGradient
              colors={[
                "rgba(34,211,238,0.1)",
                "rgba(34,211,238,0.02)",
                "transparent",
                "rgba(167,139,250,0.05)",
              ]}
              locations={[0, 0.28, 0.62, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.proAmbient}
              pointerEvents="none"
            />
          ) : null}
          <View style={styles.faceContent}>{content}</View>
        </View>
      </View>
    );
  }

  return (
    <ProfileOverviewChartCardNative>{content}</ProfileOverviewChartCardNative>
  );
}

const styles = StyleSheet.create({
  faceShell: {
    flex: 1,
    alignSelf: "stretch",
    position: "relative",
  },
  faceRoot: {
    flex: 1,
    alignSelf: "stretch",
    overflow: "hidden",
    borderRadius: 4,
    borderWidth: 1,
    padding: 12,
  },
  faceRootNotched: {
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  faceRootFree: {
    borderColor: "rgba(103,232,249,0.2)",
    backgroundColor: "rgba(6,16,24,0.96)",
  },
  faceRootPro: {
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(3,8,13,0.2)",
    shadowColor: "#22d3ee",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  proAmbient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  faceContent: {
    position: "relative",
    zIndex: 3,
    flex: 1,
  },
  scopeHeader: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  scopeNavBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  scopeNavBtnLeft: {
    marginRight: 2,
  },
  scopeNavBtnRight: {
    marginLeft: 2,
  },
  scopeTitlePress: {
    flexShrink: 1,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  scopeTitle: {
    textAlign: "center",
  },
  scopeArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  scopeArrowLeft: {
    borderRightWidth: 8,
    borderRightColor: "#00f5ff",
  },
  scopeArrowRight: {
    borderLeftWidth: 8,
    borderLeftColor: "#00f5ff",
  },
  scopeArrowPro: {
    borderRightColor: "#67e8f9",
    borderLeftColor: "#67e8f9",
  },
  dossier: {
    fontFamily: RAJDHANI,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "rgba(165,243,252,0.7)",
  },
  sheetTitleWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    marginBottom: 2,
  },
  sheetTitle: {
    width: "100%",
    fontFamily: OXANIUM,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    textAlign: "center",
    color: "rgba(255,255,255,0.78)",
  },
  scopeTitleText: {
    fontFamily: RAJDHANI,
    fontSize: 16,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontWeight: "600",
    color: "rgba(255,255,255,0.95)",
  },
  titlePro: {
    textShadowColor: "rgba(34,211,238,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleRule: {
    marginTop: 6,
    width: 56,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  titleRulePro: {
    backgroundColor: "rgba(103,232,249,0.75)",
  },
  desc: {
    marginTop: 8,
    color: "rgba(203,213,225,0.8)",
  },
  skeleton: {
    marginTop: 14,
    height: 140,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  grid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 8,
  },
  cell: {
    width: "48%",
    minWidth: "47%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cellPro: {
    borderColor: "rgba(0,0,0,0.35)",
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  label: {
    fontFamily: RAJDHANI,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
  },
  labelPro: {
    color: "rgba(255,255,255,0.78)",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  value: {
    marginTop: 4,
    fontFamily: OXANIUM,
    fontSize: 16,
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.9)",
  },
  valuePro: {
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  awardsLabel: {
    marginTop: 18,
    color: "rgba(255,255,255,0.4)",
  },
  emptyAward: {
    marginTop: 6,
    fontSize: 14,
    color: "rgba(255,255,255,0.35)",
  },
  awardRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  awardChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  awardChipPro: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  awardChipText: {
    fontFamily: RAJDHANI,
    fontSize: 11,
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.8)",
  },
  seasonRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  seasonPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  seasonPillActive: {
    borderColor: "rgba(103,232,249,0.45)",
    backgroundColor: "rgba(34,211,238,0.15)",
  },
  seasonPillText: {
    fontFamily: RAJDHANI,
    fontSize: 11,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.35)",
  },
  seasonPillTextActive: {
    color: "rgba(236,254,255,0.95)",
  },
  seasonSoon: {
    marginLeft: 4,
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
  },
});
