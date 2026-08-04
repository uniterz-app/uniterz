/**
 * Web `ProSkinPage` / `ProfilePlanProSkinPicker`（production）相当
 * — カタログ + 模様タップでオーバーレイ確認
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  useNavigation,
  type NavigationProp,
} from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import ProfilePlanProBackgroundNative from "../kinetik/ProfilePlanProBackgroundNative";
import ProfileKinetikPanelNative from "../kinetik/ProfileKinetikPanelNative";
import {
  fetchProSkinStatusNative,
  saveMeProSkinNative,
} from "../accountApiNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { cyberAlert } from "../../../components/cyberAlert";
import { useNativeUserLanguageFromAuth } from "../../../hooks/useNativeUserLanguage";
import type { ProfileStackParamList } from "../../../navigation/types";
import {
  profilePlanProAdoptedCategoryLabel,
  type ProfilePlanProAdoptedCategory,
} from "../../../../../../lib/profile/profilePlanProAdoptedBgVariants";
import { profilePlanProAdoptedSkinSwatch } from "../../../../../../lib/profile/profilePlanProAdoptedSkinSwatch";
import { parseCssLinearGradientColors } from "../../../../../../lib/profile/parseCssLinearGradientColors";
import {
  formatProSkinOwnerCount,
  formatProSkinUnlockCondition,
  listProImmediateSkinIds,
  PRO_SKIN_UNLOCK_CATALOG,
  userDataIsPro,
  type ProSkinUnlockCatalogEntry,
} from "../../../../../../lib/profile/proSkinUnlock";
import { proSkinMilestoneProgressBar } from "../../../../../../lib/profile/proSkinProgress";
import { parseUserPlanProBgVariant } from "../../../../../../lib/profile/profilePlanProBgVariantField";
import type { ProfilePlanProBgVariant } from "../../../../../../lib/profile/profilePlanProBgVariants";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { PROFILE_EDIT_KINETIK_MOCK } from "../../../../../../app/component/profile/edit/profileEditKinetikTypes";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";

const COLS = 2;
const GAP = 10;

function categoryBadgeColors(category: ProfilePlanProAdoptedCategory): {
  bg: string;
  text: string;
} {
  switch (category) {
    case "cyber":
      return { bg: "rgba(34,211,238,0.15)", text: "rgba(165,243,252,0.9)" };
    case "reptile":
      return { bg: "rgba(251,146,60,0.15)", text: "rgba(254,215,170,0.9)" };
    case "beast":
      return { bg: "rgba(232,121,249,0.15)", text: "rgba(245,208,254,0.9)" };
    case "material":
      return { bg: "rgba(148,163,184,0.15)", text: "rgba(226,232,240,0.9)" };
    case "geometry":
      return { bg: "rgba(52,211,153,0.15)", text: "rgba(167,243,208,0.9)" };
  }
}

function previewPanelProps(language: "ja" | "en") {
  return {
    language,
    identity: {
      ...PROFILE_EDIT_KINETIK_MOCK.identity,
      displayName: "UNITERZ",
      systemId: "",
      handle: "mpj",
    },
    stats: {
      ...PROFILE_EDIT_KINETIK_MOCK.stats,
      winRate: 63.4,
      posts: 71,
      hits: 45,
      totalPoints: 350,
      scorePrecision: 8,
      upset: 9,
    },
    winStreak: 0,
    totalPointsRank: 14,
    totalPointsRankDenominator: 800,
    rankDeltaPlaces: 0,
    bio: "PREVIEW",
    metricsTitle: "NBA // PLAYOFFS STATS",
    countryCode: "JP",
    memberSinceMs: new Date("2025-12-01T00:00:00+09:00").getTime(),
    shareHandle: "mpj",
    rankingLeague: "nba" as const,
    isPro: true,
    canOpenMenu: false,
  };
}

function ThumbCorners() {
  return (
    <>
      <View style={[styles.thumbCorner, styles.thumbCornerTL]} pointerEvents="none" />
      <View style={[styles.thumbCorner, styles.thumbCornerTR]} pointerEvents="none" />
      <View style={[styles.thumbCorner, styles.thumbCornerBL]} pointerEvents="none" />
      <View style={[styles.thumbCorner, styles.thumbCornerBR]} pointerEvents="none" />
    </>
  );
}

function SkinThumbNative({
  entry,
  width,
  selected,
  unlocked,
  isNew,
  owners,
  language,
  progress,
  onPress,
}: {
  entry: ProSkinUnlockCatalogEntry;
  width: number;
  selected: boolean;
  unlocked: boolean;
  isNew: boolean;
  owners: number;
  language: "ja" | "en";
  progress: {
    posts: number;
    exactHits: number;
    maxWinStreak: number;
    referralCompletedCount: number;
    periodWins: Record<string, number>;
  };
  onPress: () => void;
}) {
  const height = Math.max(84, Math.min(108, Math.round(width / 2.05)));
  const cat = categoryBadgeColors(entry.category);
  const condition = formatProSkinUnlockCondition(entry.unlock, language);
  const swatchColors = parseCssLinearGradientColors(
    profilePlanProAdoptedSkinSwatch(entry)
  );
  const bar =
    !unlocked && entry.unlock.kind !== "pro"
      ? proSkinMilestoneProgressBar(entry.unlock, progress, language)
      : null;

  const badgeLabel = !unlocked
    ? "LOCKED"
    : isNew
      ? "NEW"
      : entry.unlock.kind === "pro"
        ? "PRO"
        : "UNLOCKED";

  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, { width }, selected ? styles.tileOn : null]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View style={styles.tileHead}>
        <View style={styles.tileTitlesRow}>
          <Text
            style={[styles.tileLabel, selected && styles.tileLabelOn]}
            numberOfLines={1}
          >
            {entry.label}
          </Text>
          {entry.tag ? (
            <View style={styles.tileTag}>
              <Text style={styles.tileTagText} numberOfLines={1}>
                {entry.tag}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.tileBadgeRow}>
          <View style={[styles.tileCatBadge, { backgroundColor: cat.bg }]}>
            <Text style={[styles.tileCatText, { color: cat.text }]} numberOfLines={1}>
              {profilePlanProAdoptedCategoryLabel(entry.category, "en")}
            </Text>
          </View>
          <View
            style={[
              styles.tileLockBadge,
              !unlocked
                ? styles.tileLockBadgeOff
                : isNew
                  ? styles.tileLockBadgeNew
                  : entry.unlock.kind === "pro"
                    ? styles.tileLockBadgePro
                    : styles.tileLockBadgeOn,
            ]}
          >
            <Text
              style={[
                styles.tileLockBadgeText,
                !unlocked
                  ? styles.tileLockBadgeTextOff
                  : isNew
                    ? styles.tileLockBadgeTextNew
                    : entry.unlock.kind === "pro"
                      ? styles.tileLockBadgeTextPro
                      : styles.tileLockBadgeTextOn,
              ]}
            >
              {badgeLabel}
            </Text>
          </View>
        </View>
        <Text style={styles.tileMeta} numberOfLines={2}>
          {condition} · {formatProSkinOwnerCount(owners, language)}
        </Text>
      </View>
      <View style={[styles.tilePreview, { height }]} collapsable={false}>
        {/* フォールバック用 swatch（FX 未対応時も空にしない） */}
        <LinearGradient
          colors={swatchColors}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* 一覧で模様が見えるよう本番背景をサムネ描画（FlatList 仮想化で同時描画は少数） */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <ProfilePlanProBackgroundNative
            width={width}
            height={height}
            variant={entry.id}
            animate={false}
          />
        </View>
        <ThumbCorners />
        {!unlocked ? (
          <View style={styles.tileLockOverlay} pointerEvents="none">
            <MaterialCommunityIcons
              name="lock"
              size={18}
              color="rgba(253,230,138,0.95)"
            />
            <Text style={styles.tileLockOverlayText}>
              {entry.unlock.kind === "pro" ? "PRO" : "MILESTONE"}
            </Text>
            {bar ? (
              <View style={styles.tileProgressWrap}>
                <View style={styles.tileProgressTrack}>
                  <View
                    style={[
                      styles.tileProgressFill,
                      { width: `${Math.round(bar.ratio * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.tileProgressLabel}>{bar.label}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ProSkinScreenNative() {
  const navigation =
    useNavigation<NavigationProp<ProfileStackParamList>>();
  const insets = useSafeAreaInsets();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguageFromAuth();
  const isJa = language === "ja";
  const { width: winW, height: winH } = useWindowDimensions();
  const contentW = Math.min(420, winW - 24);
  const tileW = Math.floor((contentW - GAP) / COLS);
  const overlayPanelW = Math.min(420, winW - 24);

  const [ready, setReady] = useState(false);
  const [savedId, setSavedId] = useState<ProfilePlanProBgVariant | null>(null);
  const [overlayId, setOverlayId] = useState<ProfilePlanProBgVariant | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [replayByVariant, setReplayByVariant] = useState<
    Partial<Record<ProfilePlanProBgVariant, number>>
  >({});
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(
    () => new Set(PRO_SKIN_UNLOCK_CATALOG.map((e) => e.id))
  );
  const [ownerCounts, setOwnerCounts] = useState<Record<string, number>>({});
  const [milestoneProgress, setMilestoneProgress] = useState({
    posts: 0,
    exactHits: 0,
    maxWinStreak: 0,
    referralCompletedCount: 0,
    periodWins: {} as Record<string, number>,
  });
  const [viewerIsPro, setViewerIsPro] = useState(false);
  const [noticeIds, setNoticeIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!fUser) {
      setReady(false);
      return;
    }
    let alive = true;

    async function resolveUnlockedIds(
      fromApi: readonly string[],
      apiSaysPro: boolean
    ): Promise<{ ids: string[]; isPro: boolean }> {
      const next = new Set(fromApi);
      let isPro = apiSaysPro;
      if (!isPro) {
        try {
          const snap = await getDoc(doc(db, "users", fUser!.uid));
          isPro = userDataIsPro(
            snap.exists() ? (snap.data() as Record<string, unknown>) : undefined
          );
        } catch {
          /* ignore */
        }
      }
      if (isPro) {
        for (const id of listProImmediateSkinIds()) next.add(id);
      }
      return { ids: [...next], isPro };
    }

    void (async () => {
      try {
        const status = await fetchProSkinStatusNative();
        if (!alive) return;
        const { ids, isPro } = await resolveUnlockedIds(
          status.unlockedIds ?? [],
          status.isPro
        );
        if (!alive) return;
        setViewerIsPro(isPro);
        setUnlockedIds(new Set(ids));
        setOwnerCounts(status.ownerCounts ?? {});
        setMilestoneProgress({
          posts: status.progress?.posts ?? 0,
          exactHits: status.progress?.exactHits ?? 0,
          maxWinStreak: status.progress?.maxWinStreak ?? 0,
          referralCompletedCount:
            status.progress?.referralCompletedCount ?? 0,
          periodWins: status.progress?.periodWins ?? {},
        });
        const parsed = parseUserPlanProBgVariant(status.savedId);
        if (parsed) setSavedId(parsed);
        setNoticeIds(new Set(status.noticeIds ?? []));
      } catch {
        if (!alive) return;
        const { ids, isPro } = await resolveUnlockedIds([], false);
        setViewerIsPro(isPro);
        setUnlockedIds(new Set(ids));
        setNoticeIds(new Set());
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fUser]);

  const overlayEntry = useMemo(
    () =>
      overlayId
        ? PRO_SKIN_UNLOCK_CATALOG.find((e) => e.id === overlayId) ?? null
        : null,
    [overlayId]
  );
  const overlayIndex = overlayEntry
    ? PRO_SKIN_UNLOCK_CATALOG.findIndex((e) => e.id === overlayEntry.id)
    : -1;
  const overlayUnlocked =
    overlayId != null && unlockedIds.has(overlayId);

  const hasUnsavedChange =
    overlayId != null && overlayUnlocked && overlayId !== savedId;
  const canConfirm = Boolean(overlayId) && !saving && hasUnsavedChange;
  const confirmLabel = saving
    ? isJa
      ? "保存中…"
      : "Saving…"
    : !viewerIsPro
      ? "GET PRO"
      : !overlayUnlocked
        ? isJa
          ? "未解放"
          : "Locked"
        : hasUnsavedChange
          ? isJa
            ? "このスキンを適用"
            : "Apply skin"
          : isJa
            ? "適用済み"
            : "Applied";

  const goGetPro = useCallback(() => {
    navigation.navigate("ProSubscribe");
  }, [navigation]);

  const closeOverlay = useCallback(() => {
    if (saving) return;
    setOverlayId(null);
    setSaveError(null);
  }, [saving]);

  const handleConfirm = useCallback(async () => {
    if (!overlayId || saving || !hasUnsavedChange) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveMeProSkinNative(overlayId);
      setSavedId(overlayId);
      setOverlayId(null);
      setSaving(false);
      navigation.navigate("ProfileHome");
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : isJa
            ? "保存に失敗しました。"
            : "Save failed.";
      setSaveError(msg);
      cyberAlert("", msg);
      setSaving(false);
    }
  }, [hasUnsavedChange, isJa, navigation, overlayId, saving]);

  const openOverlay = useCallback((id: ProfilePlanProBgVariant) => {
    setSaveError(null);
    setOverlayId(id);
    setReplayByVariant((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
  }, []);

  return (
    <MobilePageShell
      title="SKIN"
      subtitle={
        isJa
          ? viewerIsPro
            ? "上段は Pro ですぐ使えるスキン。下段はマイルストーン達成で解放されます。"
            : "プレビューは無料で見られます。適用するには Pro プランが必要です。"
          : viewerIsPro
            ? "Top skins unlock with Pro. Milestone skins unlock as you progress."
            : "Preview is free. Upgrade to Pro to apply a skin."
      }
      appBackground
      onClose={() => navigation.goBack()}
    >
      <View style={styles.pageBg}>
        {!ready ? (
          <View style={styles.loading}>
            <ActivityIndicator color={CYBER_TAB_CYAN} />
          </View>
        ) : (
          <FlatList
            data={PRO_SKIN_UNLOCK_CATALOG as ProSkinUnlockCatalogEntry[]}
            keyExtractor={(item) => item.id}
            numColumns={COLS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={[
              styles.listContent,
              { width: contentW, alignSelf: "center" },
            ]}
            showsVerticalScrollIndicator={false}
            initialNumToRender={6}
            maxToRenderPerBatch={4}
            windowSize={5}
            removeClippedSubviews={Platform.OS === "android"}
            ListHeaderComponent={
              <View style={styles.headerBlock}>
                <Text style={styles.eyebrow}>Pro Skin</Text>
                <Text style={styles.pageTitle}>Choose Pro Skin</Text>
                <Text style={styles.desc}>
                  {isJa
                    ? viewerIsPro
                      ? "上段は Pro ですぐ使えるスキン。下段はマイルストーン達成で解放されます。"
                      : "プレビューは無料で見られます。適用するには Pro プランが必要です。"
                    : viewerIsPro
                      ? "Top skins unlock with Pro. Milestone skins unlock as you progress."
                      : "Preview is free. Upgrade to Pro to apply a skin."}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <SkinThumbNative
                entry={item}
                width={tileW}
                selected={savedId === item.id}
                unlocked={unlockedIds.has(item.id)}
                isNew={noticeIds.has(item.id)}
                owners={ownerCounts[item.id] ?? 0}
                language={language === "ja" ? "ja" : "en"}
                progress={milestoneProgress}
                onPress={() => openOverlay(item.id)}
              />
            )}
          />
        )}
      </View>

      <Modal
        visible={overlayEntry != null}
        transparent
        animationType="fade"
        onRequestClose={closeOverlay}
      >
        <View style={styles.overlayRoot}>
          <Pressable
            style={styles.overlayBackdrop}
            onPress={closeOverlay}
            accessibilityRole="button"
            accessibilityLabel={isJa ? "閉じる" : "Close"}
          />
          {overlayEntry ? (
            <View
              style={[
                styles.overlayPanel,
                {
                  width: overlayPanelW,
                  maxHeight: winH - insets.top - insets.bottom - 24,
                  marginTop: insets.top + 8,
                  marginBottom: Math.max(insets.bottom, 12),
                },
              ]}
            >
              <View style={styles.overlayHead}>
                <View style={styles.overlayHeadMeta}>
                  <Text style={styles.overlayEyebrow}>PREVIEW</Text>
                  <Text style={styles.overlayTitle} numberOfLines={1}>
                    {overlayIndex >= 0 ? `No.${overlayIndex + 1} · ` : ""}
                    {overlayEntry.label}
                    {overlayEntry.tag ? ` · ${overlayEntry.tag}` : ""}
                  </Text>
                  <Text style={styles.overlayCondition} numberOfLines={2}>
                    {formatProSkinUnlockCondition(
                      overlayEntry.unlock,
                      isJa ? "ja" : "en"
                    )}
                    {" · "}
                    {formatProSkinOwnerCount(
                      ownerCounts[overlayEntry.id] ?? 0,
                      isJa ? "ja" : "en"
                    )}
                  </Text>
                </View>
              </View>

              <ScrollView
                style={styles.overlayScroll}
                contentContainerStyle={styles.overlayScrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View style={styles.openPreview} pointerEvents="none">
                  <ProfileKinetikPanelNative
                    key={`${overlayEntry.id}:${replayByVariant[overlayEntry.id] ?? 0}`}
                    {...previewPanelProps(language === "ja" ? "ja" : "en")}
                    planProBgVariant={overlayEntry.id}
                  />
                </View>
                {!overlayUnlocked ? (
                  <View style={styles.lockedBanner}>
                    <MaterialCommunityIcons
                      name="lock"
                      size={16}
                      color="rgba(253,230,138,0.95)"
                    />
                    <Text style={styles.lockedBannerText}>
                      {!viewerIsPro
                        ? isJa
                          ? "プレビューのみ · 適用には Pro が必要です"
                          : "Preview only · Pro required to apply"
                        : isJa
                          ? "このスキンはまだ解放されていません"
                          : "This skin is still locked"}
                    </Text>
                  </View>
                ) : null}
              </ScrollView>

              <View style={styles.overlayActions}>
                {!viewerIsPro ? (
                  <>
                    <Pressable
                      onPress={goGetPro}
                      style={[
                        styles.confirmBtn,
                        styles.confirmBtnOn,
                        styles.confirmBtnGrow,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="star-four-points"
                        size={14}
                        color="#050508"
                      />
                      <Text style={[styles.confirmBtnText, styles.confirmBtnTextOn]}>
                        GET PRO
                      </Text>
                    </Pressable>
                    <Pressable
                      disabled={saving}
                      onPress={closeOverlay}
                      style={styles.cancelBtn}
                    >
                      <Text style={styles.cancelBtnText}>
                        {isJa ? "キャンセル" : "Cancel"}
                      </Text>
                    </Pressable>
                  </>
                ) : overlayUnlocked ? (
                  <>
                    <Pressable
                      disabled={!canConfirm && !saving}
                      onPress={() => void handleConfirm()}
                      style={[
                        styles.confirmBtn,
                        canConfirm || saving
                          ? styles.confirmBtnOn
                          : styles.confirmBtnOff,
                        styles.confirmBtnGrow,
                      ]}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#050508" />
                      ) : (
                        <MaterialCommunityIcons
                          name="star-four-points"
                          size={14}
                          color={
                            canConfirm ? "#050508" : "rgba(255,255,255,0.3)"
                          }
                        />
                      )}
                      <Text
                        style={[
                          styles.confirmBtnText,
                          canConfirm || saving
                            ? styles.confirmBtnTextOn
                            : styles.confirmBtnTextOff,
                        ]}
                      >
                        {confirmLabel}
                      </Text>
                    </Pressable>
                    <Pressable
                      disabled={saving}
                      onPress={closeOverlay}
                      style={styles.cancelBtn}
                    >
                      <Text style={styles.cancelBtnText}>
                        {isJa ? "キャンセル" : "Cancel"}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    onPress={closeOverlay}
                    style={[styles.confirmBtn, styles.confirmBtnOff, styles.confirmBtnGrow]}
                  >
                    <Text style={[styles.confirmBtnText, styles.confirmBtnTextOff]}>
                      {isJa ? "閉じる" : "Close"}
                    </Text>
                  </Pressable>
                )}
              </View>
              {saveError ? (
                <Text style={styles.saveError}>{saveError}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </Modal>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  pageBg: {
    flex: 1,
    backgroundColor: "#03080d",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 48,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  headerBlock: {
    marginBottom: 12,
    gap: 6,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  desc: {
    marginBottom: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.5)",
  },
  overlayRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  overlayPanel: {
    zIndex: 1,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    backgroundColor: "rgba(4,16,24,0.98)",
    ...Platform.select({
      ios: {
        shadowColor: "#00F5FF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
      default: {},
    }),
  },
  overlayHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,245,255,0.16)",
  },
  overlayHeadMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  overlayEyebrow: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.2,
    color: "rgba(103,232,249,0.8)",
    textTransform: "uppercase",
  },
  overlayTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  overlayScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  overlayScrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  overlayActions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,245,255,0.16)",
    backgroundColor: "rgba(2,8,14,0.92)",
  },
  confirmBtn: {
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  confirmBtnGrow: {
    flex: 1,
  },
  confirmBtnOn: {
    borderColor: CYBER_TAB_CYAN,
    backgroundColor: CYBER_TAB_CYAN,
  },
  confirmBtnOff: {
    borderColor: "rgba(255,255,255,0.15)",
  },
  confirmBtnText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  confirmBtnTextOn: {
    color: "#050508",
  },
  confirmBtnTextOff: {
    color: "rgba(255,255,255,0.3)",
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
  },
  cancelBtnText: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
  },
  saveError: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    textAlign: "center",
    fontSize: 12,
    color: "rgba(252,165,165,0.9)",
  },
  openPreview: {
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.28)",
    backgroundColor: "#060809",
  },
  tile: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  tileOn: {
    borderColor: "rgba(34,211,238,0.55)",
  },
  tileHead: {
    paddingHorizontal: 9,
    paddingTop: 8,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(4,8,12,0.94)",
    gap: 4,
  },
  tileTitlesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  tileLabel: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    lineHeight: 14,
    color: "rgba(255,255,255,0.88)",
  },
  tileLabelOn: {
    color: "#67e8f9",
  },
  tileTag: {
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tileTagText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
  },
  tileCatBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tileCatText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tileBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  tileLockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  tileLockBadgePro: {
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "rgba(0,245,255,0.12)",
  },
  tileLockBadgeOn: {
    borderColor: "rgba(52,211,153,0.45)",
    backgroundColor: "rgba(52,211,153,0.12)",
  },
  tileLockBadgeNew: {
    borderColor: "rgba(103,232,249,0.5)",
    backgroundColor: "rgba(34,211,238,0.16)",
  },
  tileLockBadgeOff: {
    borderColor: "rgba(251,191,36,0.4)",
    backgroundColor: "rgba(251,191,36,0.1)",
  },
  tileLockBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tileLockBadgeTextOn: {
    color: "rgba(167,243,208,0.95)",
  },
  tileLockBadgeTextPro: {
    color: "rgba(165,243,252,0.9)",
  },
  tileLockBadgeTextNew: {
    color: "rgba(165,243,252,0.98)",
  },
  tileLockBadgeTextOff: {
    color: "rgba(253,230,138,0.95)",
  },
  tileMeta: {
    fontSize: 9,
    lineHeight: 12,
    color: "rgba(255,255,255,0.42)",
  },
  tilePreview: {
    width: "100%",
    backgroundColor: "#060809",
    overflow: "hidden",
  },
  tileLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(3,8,13,0.55)",
  },
  tileLockOverlayText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "rgba(253,230,138,0.9)",
  },
  tileProgressWrap: {
    marginTop: 4,
    width: "84%",
    alignItems: "center",
    gap: 3,
  },
  tileProgressTrack: {
    height: 5,
    width: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  tileProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(125, 211, 252, 0.95)",
  },
  tileProgressLabel: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.72)",
  },
  overlayCondition: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.45)",
  },
  lockedBanner: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
    backgroundColor: "rgba(251,191,36,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  lockedBannerText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(253,230,138,0.95)",
  },
  thumbCorner: {
    position: "absolute",
    width: 10,
    height: 10,
    borderColor: "rgba(255,255,255,0.35)",
    zIndex: 2,
  },
  thumbCornerTL: {
    left: 4,
    top: 4,
    borderLeftWidth: 1.5,
    borderTopWidth: 1.5,
  },
  thumbCornerTR: {
    right: 4,
    top: 4,
    borderRightWidth: 1.5,
    borderTopWidth: 1.5,
  },
  thumbCornerBL: {
    left: 4,
    bottom: 4,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
  },
  thumbCornerBR: {
    right: 4,
    bottom: 4,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
  },
});
