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
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

export default function ProSkinScreenNative() {
  const navigation = useNavigation();
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
      setSavedId(id);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [fUser]);

  const overlayEntry = useMemo(
    () =>
      overlayId
        ? PROFILE_PLAN_PRO_ADOPTED_BG.find((e) => e.id === overlayId) ?? null
        : null,
    [overlayId]
  );
  const overlayIndex = overlayEntry
    ? PROFILE_PLAN_PRO_ADOPTED_BG.findIndex((e) => e.id === overlayEntry.id)
    : -1;

  const hasUnsavedChange =
    overlayId != null && savedId != null
      ? overlayId !== savedId
      : overlayId != null && savedId == null;
  const canConfirm = Boolean(overlayId) && !saving && hasUnsavedChange;
  const confirmLabel = saving
    ? isJa
      ? "保存中…"
      : "Saving…"
    : hasUnsavedChange
      ? isJa
        ? "このスキンを適用"
        : "Apply skin"
      : isJa
        ? "適用済み"
        : "Applied";

  const closeOverlay = useCallback(() => {
    if (saving) return;
    setOverlayId(null);
    setSaveError(null);
  }, [saving]);

  const handleConfirm = useCallback(async () => {
    if (!overlayId || !canConfirm) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveMeProSkinNative(overlayId);
      setSavedId(overlayId);
      setOverlayId(null);
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
  }, [canConfirm, isJa, navigation, overlayId]);

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
        language === "ja"
          ? "模様をタップするとプレビューが開き、そこで適用を確定できます。"
          : "Tap a pattern to preview, then confirm in the overlay."
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
              <View style={styles.headerBlock}>
                <Text style={styles.eyebrow}>Pro Skin</Text>
                <Text style={styles.pageTitle}>Choose Pro Skin</Text>
                <Text style={styles.desc}>
                  {isJa
                    ? "模様をタップするとプレビューが開き、そこで適用を確定できます。"
                    : "Tap a thumbnail to open the preview overlay and confirm."}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <SkinThumbNative
                entry={item}
                width={tileW}
                selected={savedId === item.id}
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
                </View>
                <Pressable
                  onPress={closeOverlay}
                  style={styles.overlayCloseBtn}
                  disabled={saving}
                >
                  <Text style={styles.overlayCloseText}>
                    {isJa ? "閉じる" : "Close"}
                  </Text>
                </Pressable>
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
                    {...previewPanelProps(language)}
                    planProBgVariant={overlayEntry.id}
                  />
                </View>
              </ScrollView>

              <View style={styles.overlayActions}>
                <Pressable
                  disabled={!canConfirm}
                  onPress={() => void handleConfirm()}
                  style={[
                    styles.confirmBtn,
                    canConfirm ? styles.confirmBtnOn : styles.confirmBtnOff,
                    styles.confirmBtnGrow,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="star-four-points"
                    size={14}
                    color={canConfirm ? "#050508" : "rgba(255,255,255,0.3)"}
                  />
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
                <Pressable
                  disabled={saving}
                  onPress={closeOverlay}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>
                    {isJa ? "キャンセル" : "Cancel"}
                  </Text>
                </Pressable>
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
  overlayCloseBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  overlayCloseText: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
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
  tilePreview: {
    width: "100%",
    backgroundColor: "#060809",
    overflow: "hidden",
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
