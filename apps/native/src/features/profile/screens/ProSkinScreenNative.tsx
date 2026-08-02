/**
 * Web `ProSkinPage` / `ProfilePlanProSkinPicker`（production）相当
 * — ヘッダー / HUD 確定バー / フルカードプレビュー / 2列カタログ
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import ProfilePlanProBackgroundNative from "../kinetik/ProfilePlanProBackgroundNative";
import ProfileKinetikPanelNative from "../kinetik/ProfileKinetikPanelNative";
import { saveMeProSkinNative } from "../accountApiNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { db } from "../../../lib/firebase";
import { cyberAlert } from "../../../components/cyberAlert";
import { useNativeUserLanguageFromAuth } from "../../../hooks/useNativeUserLanguage";
import {
  PROFILE_PLAN_PRO_ADOPTED_BG,
  profilePlanProAdoptedCategoryLabel,
  type ProfilePlanProAdoptedCategory,
  type ProfilePlanProAdoptedEntry,
} from "../../../../../../lib/profile/profilePlanProAdoptedBgVariants";
import { parseUserPlanProBgVariant } from "../../../../../../lib/profile/profilePlanProBgVariantField";
import type { ProfilePlanProBgVariant } from "../../../../../../lib/profile/profilePlanProBgVariants";
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
      displayName: "MPJ",
      systemId: "3PJVG4Y9",
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
    bio: "Win now",
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
  onPress,
}: {
  entry: ProfilePlanProAdoptedEntry;
  width: number;
  selected: boolean;
  onPress: () => void;
}) {
  const height = Math.max(84, Math.min(108, Math.round(width / 2.05)));
  const cat = categoryBadgeColors(entry.category);

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
        <View style={[styles.tileCatBadge, { backgroundColor: cat.bg }]}>
          <Text style={[styles.tileCatText, { color: cat.text }]} numberOfLines={1}>
            {profilePlanProAdoptedCategoryLabel(entry.category, "en")}
          </Text>
        </View>
      </View>
      <View style={[styles.tilePreview, { height }]}>
        <ProfilePlanProBackgroundNative
          width={width}
          height={height}
          animate={false}
          variant={entry.id}
        />
        <ThumbCorners />
      </View>
    </Pressable>
  );
}

/** Web `ScaledCatalogCard` — Native パネルはもともと mobile 幅なのでフル幅描画 */
function OpenPreviewCardNative({
  variantId,
  language,
  replaySeed,
}: {
  variantId: ProfilePlanProBgVariant;
  language: "ja" | "en";
  replaySeed: number;
}) {
  return (
    <View style={styles.openPreview} pointerEvents="none">
      <ProfileKinetikPanelNative
        key={`${variantId}:${replaySeed}`}
        {...previewPanelProps(language)}
        planProBgVariant={variantId}
      />
    </View>
  );
}

export default function ProSkinScreenNative() {
  const navigation = useNavigation();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguageFromAuth();
  const isJa = language === "ja";
  const { width: winW } = useWindowDimensions();
  const contentW = Math.min(420, winW - 24);
  const tileW = Math.floor((contentW - GAP) / COLS);

  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<ProfilePlanProBgVariant | null>(
    null
  );
  const [savedId, setSavedId] = useState<ProfilePlanProBgVariant | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [replayByVariant, setReplayByVariant] = useState<
    Partial<Record<ProfilePlanProBgVariant, number>>
  >({});

  useEffect(() => {
    if (!fUser) {
      setReady(true);
      return;
    }
    let alive = true;
    void getDoc(doc(db, "users", fUser.uid)).then((snap) => {
      if (!alive) return;
      const data = snap.data() as { planProBgVariant?: unknown } | undefined;
      const id = parseUserPlanProBgVariant(data?.planProBgVariant);
      setSelectedId(id);
      setSavedId(id);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [fUser]);

  const selected = useMemo(
    () =>
      selectedId
        ? PROFILE_PLAN_PRO_ADOPTED_BG.find((e) => e.id === selectedId) ?? null
        : null,
    [selectedId]
  );
  const selectedIndex = selected
    ? PROFILE_PLAN_PRO_ADOPTED_BG.findIndex((e) => e.id === selected.id)
    : -1;

  const hasUnsavedChange =
    selectedId != null && savedId != null && selectedId !== savedId;
  const canConfirm = Boolean(selectedId) && !saving && hasUnsavedChange;
  const confirmLabel = saving
    ? isJa
      ? "保存中…"
      : "Saving…"
    : hasUnsavedChange
      ? isJa
        ? "確定"
        : "Confirm"
      : isJa
        ? "適用済み"
        : "Applied";

  const handleConfirm = useCallback(async () => {
    if (!selectedId || !canConfirm) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveMeProSkinNative(selectedId);
      setSavedId(selectedId);
      navigation.goBack();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : isJa
            ? "保存に失敗しました。"
            : "Save failed.";
      setSaveError(msg);
      cyberAlert("", msg);
    } finally {
      setSaving(false);
    }
  }, [canConfirm, isJa, navigation, selectedId]);

  const selectSkin = useCallback((id: ProfilePlanProBgVariant) => {
    setSelectedId(id);
    setReplayByVariant((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
  }, []);

  return (
    <MobilePageShell
      title="SKIN"
      subtitle={
        language === "ja"
          ? "Pro プロフィール背景スキンを選べます。"
          : "Choose a Pro profile background skin."
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
            data={PROFILE_PLAN_PRO_ADOPTED_BG}
            keyExtractor={(item) => item.id}
            numColumns={COLS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={[
              styles.listContent,
              { width: contentW, alignSelf: "center" },
            ]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View>
                <View style={styles.headerBlock}>
                  <Text style={styles.eyebrow}>Pro Skin</Text>
                  <Text style={styles.pageTitle}>Choose Pro Skin</Text>
                  <Text style={styles.desc}>
                    {isJa
                      ? "サムネをタップしてプレビューし、確定でプロフィールに反映します。"
                      : "Tap a thumbnail to preview, then confirm to apply."}
                  </Text>
                </View>

                {/* stickyHeaderIndices 用の先頭セル相当 */}
                <View style={styles.stickyWrap}>
                  <View
                    style={[
                      styles.confirmBar,
                      hasUnsavedChange ? styles.confirmBarActive : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.rail,
                        hasUnsavedChange && styles.railVisible,
                      ]}
                      pointerEvents="none"
                    />
                    <View
                      style={[
                        styles.hudCorner,
                        styles.hudCornerTL,
                        hasUnsavedChange && styles.hudCornerVisible,
                      ]}
                      pointerEvents="none"
                    />
                    <View
                      style={[
                        styles.hudCorner,
                        styles.hudCornerBR,
                        hasUnsavedChange && styles.hudCornerVisible,
                      ]}
                      pointerEvents="none"
                    />

                    <View
                      style={[
                        styles.confirmIcon,
                        hasUnsavedChange
                          ? styles.confirmIconActive
                          : styles.confirmIconIdle,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="star-four-points"
                        size={18}
                        color={
                          hasUnsavedChange
                            ? CYBER_TAB_CYAN
                            : "rgba(0,245,255,0.78)"
                        }
                      />
                    </View>
                    <View style={styles.confirmMeta}>
                      <Text style={styles.confirmTitle}>PRO SKIN</Text>
                      <Text style={styles.confirmSub} numberOfLines={1}>
                        {selected && selectedIndex >= 0
                          ? `No.${selectedIndex + 1} · ${selected.label}${
                              selected.tag ? ` · ${selected.tag}` : ""
                            }`
                          : isJa
                            ? "未選択"
                            : "None"}
                      </Text>
                    </View>
                    <Pressable
                      disabled={!canConfirm}
                      onPress={() => void handleConfirm()}
                      style={[
                        styles.confirmBtn,
                        canConfirm
                          ? styles.confirmBtnOn
                          : styles.confirmBtnOff,
                      ]}
                    >
                      <Text
                        style={[
                          styles.confirmBtnText,
                          canConfirm
                            ? styles.confirmBtnTextOn
                            : styles.confirmBtnTextOff,
                        ]}
                      >
                        {confirmLabel}
                      </Text>
                    </Pressable>
                  </View>
                  {saveError ? (
                    <Text style={styles.saveError}>{saveError}</Text>
                  ) : null}
                </View>

                {selected ? (
                  <View style={styles.previewWrap}>
                    <OpenPreviewCardNative
                      variantId={selected.id}
                      language={language}
                      replaySeed={replayByVariant[selected.id] ?? 0}
                    />
                  </View>
                ) : null}
              </View>
            }
            renderItem={({ item }) => (
              <SkinThumbNative
                entry={item}
                width={tileW}
                selected={selectedId === item.id}
                onPress={() => selectSkin(item.id)}
              />
            )}
          />
        )}
      </View>
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
  stickyWrap: {
    marginBottom: 10,
    paddingVertical: 2,
    backgroundColor: "rgba(3,8,13,0.94)",
  },
  previewWrap: {
    marginBottom: 12,
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
  confirmBar: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(10,14,20,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "hidden",
  },
  confirmBarActive: {
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "rgba(0,245,255,0.07)",
  },
  rail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "transparent",
  },
  railVisible: {
    backgroundColor: "rgba(0,245,255,0.55)",
  },
  hudCorner: {
    position: "absolute",
    width: 10,
    height: 10,
    borderColor: "transparent",
    zIndex: 2,
  },
  hudCornerTL: {
    left: 0,
    top: 0,
    borderLeftWidth: 2,
    borderTopWidth: 2,
  },
  hudCornerBR: {
    right: 0,
    bottom: 0,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },
  hudCornerVisible: {
    borderColor: "rgba(0,245,255,0.65)",
  },
  confirmIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    zIndex: 1,
  },
  confirmIconIdle: {
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  confirmIconActive: {
    borderColor: "rgba(0,245,255,0.35)",
    backgroundColor: "rgba(0,245,255,0.1)",
  },
  confirmMeta: {
    flex: 1,
    minWidth: 0,
    zIndex: 1,
  },
  confirmTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  confirmSub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(165,243,252,0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  confirmBtn: {
    zIndex: 1,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  confirmBtnOn: {
    borderColor: CYBER_TAB_CYAN,
    backgroundColor: CYBER_TAB_CYAN,
  },
  confirmBtnOff: {
    borderColor: "rgba(255,255,255,0.15)",
  },
  confirmBtnText: {
    fontSize: 10,
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
  saveError: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 12,
    color: "rgba(252,165,165,0.9)",
  },
  openPreview: {
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.28)",
    backgroundColor: "#060809",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 18,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  tile: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  tileOn: {
    borderColor: "rgba(34,211,238,0.55)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: { elevation: 4 },
      default: {},
    }),
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
    borderRadius: 4,
  },
  tileTagText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
  },
  tileCatBadge: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tileCatText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tilePreview: {
    width: "100%",
    backgroundColor: "#060809",
    overflow: "hidden",
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
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
