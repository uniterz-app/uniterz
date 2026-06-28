/** グループヘッダー画像 — オーナーは変更・削除・位置調整が可能 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  ActivityIndicator, Image, PanResponder, Pressable, StyleSheet, Text, View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { Language } from "../../../../../lib/i18n/language";
import { patchCommunityGroup } from "../../../../../lib/communities/patchCommunityGroup";
import {
  DEFAULT_HEADER_IMAGE_POSITION_Y,
  HEADER_IMAGE_NATIVE_CARD_HEIGHT_SCALE,
  HEADER_IMAGE_NATIVE_HERO_ADJUST_SCALE,
  headerImageNativeImageHeight,
  headerImageNativeMarginTop,
  sanitizeHeaderImagePositionY,
} from "../../../../../lib/communities/headerImagePosition";
import {
  COMMUNITY_GROUP_HERO_IMAGE_HEIGHT,
} from "../../../../../lib/communities/communityGroupHeroLayout";
import { storage } from "../../lib/firebase";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { communityApiUrl, communityAuthHeader } from "./communityApiNative";
import { prefetchCommunityHeaderImageNative } from "./prefetchCommunityHeaderImageNative";
import { communityPressableTapStyle } from "./communityCrtThemeNative";
import type { CommunityGroupHeaderImagePatch } from "./communityGroupHeaderImageTypes";

const BANNER_HEIGHT_CARD = 140;

type Props = {
  groupId: string;
  language: Language;
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  headerImagePositionY: number;
  editable: boolean;
  getIdToken: () => Promise<string>;
  layout?: "card" | "hero";
  onEditingChange?: (editing: boolean) => void;
  onUpdated: (patch: CommunityGroupHeaderImagePatch) => void;
};

type PendingUpload = {
  uri: string;
  blob: Blob | null;
  positionY: number;
  repositionOnly: boolean;
};

export default function CommunityGroupHeaderImageNative({
  groupId,
  language,
  name,
  description,
  headerImageUrl,
  headerImagePositionY,
  editable,
  getIdToken,
  layout = "card",
  onEditingChange,
  onUpdated,
}: Props) {
  const { fUser } = useFirebaseUser();
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState<PendingUpload | null>(null);
  const dragStart = useRef<{ y: number; startPos: number } | null>(null);

  const savedPositionY = sanitizeHeaderImagePositionY(headerImagePositionY);
  const isHero = layout === "hero";
  const bannerHeight = isHero ? COMMUNITY_GROUP_HERO_IMAGE_HEIGHT : BANNER_HEIGHT_CARD;
  const cardImageHeightScale = HEADER_IMAGE_NATIVE_CARD_HEIGHT_SCALE;
  const heroEditorHeightScale = HEADER_IMAGE_NATIVE_HERO_ADJUST_SCALE;

  const heroImageLayout = useCallback(
    (positionY: number, forEditor: boolean) => {
      if (!isHero) {
        const scale = cardImageHeightScale;
        return {
          imageStyle: [
            styles.bannerImage,
            {
              height: headerImageNativeImageHeight(bannerHeight, scale),
              marginTop: headerImageNativeMarginTop(bannerHeight, positionY, scale),
            },
          ] as const,
        };
      }

      if (forEditor) {
        const scale = heroEditorHeightScale;
        return {
          imageStyle: [
            styles.bannerImage,
            {
              height: headerImageNativeImageHeight(bannerHeight, scale),
              marginTop: headerImageNativeMarginTop(bannerHeight, positionY, scale),
            },
          ] as const,
        };
      }

      const y = sanitizeHeaderImagePositionY(positionY);
      const needsAdjust = y !== DEFAULT_HEADER_IMAGE_POSITION_Y;
      if (!needsAdjust) {
        return { imageStyle: styles.bannerImageHeroCover as const };
      }

      const scale = HEADER_IMAGE_NATIVE_HERO_ADJUST_SCALE;
      return {
        imageStyle: [
          styles.bannerImageHeroAdjust,
          {
            height: headerImageNativeImageHeight(bannerHeight, scale),
            top: headerImageNativeMarginTop(bannerHeight, y, scale),
          },
        ] as const,
      };
    },
    [bannerHeight, cardImageHeightScale, heroEditorHeightScale, isHero]
  );

  useEffect(() => {
    if (headerImageUrl) prefetchCommunityHeaderImageNative(headerImageUrl);
  }, [headerImageUrl]);

  useEffect(() => {
    onEditingChange?.(Boolean(pending));
  }, [pending, onEditingChange]);

  const t = useMemo(
    () =>
      language === "en"
        ? {
            add: "Add image",
            change: "Change image",
            remove: "Remove image",
            reposition: "Drag to reposition",
            repositionMenu: "Adjust position",
            apply: "Apply",
            cancel: "Cancel",
            saved: "Image updated.",
            removed: "Image removed.",
            failed: "Update failed.",
            photoRequired: "Photo access is required.",
          }
        : {
            add: "画像を追加",
            change: "画像を変更",
            remove: "画像を削除",
            reposition: "ドラッグして位置を調整",
            repositionMenu: "位置を調整",
            apply: "適用",
            cancel: "キャンセル",
            saved: "画像を更新しました。",
            removed: "画像を削除しました。",
            failed: "更新に失敗しました。",
            photoRequired: "写真へのアクセスが必要です。",
          },
    [language]
  );

  const commitPatch = useCallback(
    async (patch: CommunityGroupHeaderImagePatch, message?: string) => {
      if (!fUser) return false;
      const h = await communityAuthHeader(getIdToken);
      if (!h) return false;
      const result = await patchCommunityGroup(
        groupId,
        h,
        { name, description, ...patch },
        communityApiUrl
      );
      if (!result.ok) {
        cyberAlert("", result.error || t.failed);
        return false;
      }
      onUpdated({
        headerImageUrl: result.group.headerImageUrl,
        headerImagePositionY: result.group.headerImagePositionY,
      });
      if (message) cyberAlert("", message);
      return true;
    },
    [fUser, getIdToken, groupId, name, description, onUpdated, t]
  );

  const applyPatch = useCallback(
    async (patch: CommunityGroupHeaderImagePatch, message?: string) => {
      if (!fUser || busy) return false;
      setBusy(true);
      try {
        return await commitPatch(patch, message);
      } finally {
        setBusy(false);
      }
    },
    [fUser, busy, commitPatch]
  );

  const clearPending = useCallback(() => {
    setPending(null);
  }, []);

  const startReposition = useCallback(() => {
    if (!headerImageUrl || !editable) return;
    setPending({
      uri: headerImageUrl,
      blob: null,
      positionY: savedPositionY,
      repositionOnly: true,
    });
    setMenuOpen(false);
  }, [editable, headerImageUrl, savedPositionY]);

  const pickImage = useCallback(async () => {
    if (!editable || busy) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      cyberAlert("", t.photoRequired);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]?.uri) return;

    setBusy(true);
    try {
      const resp = await fetch(result.assets[0].uri);
      const blob = await resp.blob();
      setPending({
        uri: result.assets[0].uri,
        blob,
        positionY: DEFAULT_HEADER_IMAGE_POSITION_Y,
        repositionOnly: false,
      });
      setMenuOpen(false);
    } catch {
      cyberAlert("", t.failed);
    } finally {
      setBusy(false);
    }
  }, [editable, busy, t]);

  const applyPending = useCallback(async () => {
    if (!pending || !fUser || busy) return;
    if (pending.repositionOnly) {
      setBusy(true);
      try {
        const positionY = sanitizeHeaderImagePositionY(pending.positionY);
        const ok = await commitPatch({ headerImagePositionY: positionY }, t.saved);
        if (ok) clearPending();
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!pending.blob) return;
    setBusy(true);
    try {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const fileRef = ref(storage, `community_headers/${fUser.uid}/${id}.jpg`);
      await uploadBytes(fileRef, pending.blob, { contentType: "image/jpeg" });
      const url = await getDownloadURL(fileRef);
      const positionY = sanitizeHeaderImagePositionY(pending.positionY);
      const ok = await commitPatch({ headerImageUrl: url, headerImagePositionY: positionY }, t.saved);
      if (ok) clearPending();
    } catch {
      cyberAlert("", t.failed);
    } finally {
      setBusy(false);
    }
  }, [pending, fUser, busy, commitPatch, clearPending, t]);

  const confirmRemove = useCallback(() => {
    if (!editable || busy || !headerImageUrl) return;
    cyberAlert(
      "",
      language === "en" ? "Remove header image?" : "ヘッダー画像を削除しますか？",
      [
        { text: language === "en" ? "Cancel" : "キャンセル", style: "cancel" },
        {
          text: language === "en" ? "Remove" : "削除",
          style: "destructive",
          onPress: () => {
            void applyPatch(
              {
                headerImageUrl: null,
                headerImagePositionY: DEFAULT_HEADER_IMAGE_POSITION_Y,
              },
              t.removed
            );
          },
        },
      ]
    );
  }, [editable, busy, headerImageUrl, language, applyPatch, t]);

  const setPendingPosition = useCallback((nextY: number) => {
    const y = sanitizeHeaderImagePositionY(nextY);
    setPending((prev) => (prev ? { ...prev, positionY: y } : prev));
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => Boolean(pending) && !busy,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Boolean(pending) && !busy && Math.abs(gesture.dy) > 1,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (_, gesture) => {
          if (!pending) return;
          dragStart.current = { y: gesture.y0, startPos: pending.positionY };
        },
        onPanResponderMove: (_, gesture) => {
          if (!dragStart.current) return;
          const deltaY = gesture.moveY - dragStart.current.y;
          setPendingPosition(dragStart.current.startPos - (deltaY / bannerHeight) * 100);
        },
        onPanResponderRelease: () => {
          dragStart.current = null;
        },
        onPanResponderTerminate: () => {
          dragStart.current = null;
        },
      }),
    [pending, busy, setPendingPosition, bannerHeight]
  );

  if (!editable && !headerImageUrl) return null;

  const renderEditor = (previewUri: string, positionY: number) => {
    const { imageStyle } = heroImageLayout(positionY, true);

    return (
      <View style={[styles.wrap, isHero && styles.wrapHero]}>
        <View
          style={[
            styles.bannerWrap,
            isHero && styles.bannerWrapHero,
            { height: bannerHeight },
            styles.bannerWrapColumn,
          ]}
        >
          <View style={styles.dragZone} {...panResponder.panHandlers}>
            <Image
              source={{ uri: previewUri }}
              style={imageStyle}
              resizeMode="cover"
              fadeDuration={0}
            />
            {!isHero ? <View style={styles.bannerFade} pointerEvents="none" /> : null}
            <View style={styles.repositionHint} pointerEvents="none">
              <Text style={styles.repositionHintText}>{t.reposition}</Text>
            </View>
          </View>
          <View style={styles.editorActions}>
            <Pressable
              disabled={busy}
              onPress={clearPending}
              style={({ pressed }) => [
                styles.editorBtn,
                styles.editorBtnCancel,
                pressed && communityPressableTapStyle(true),
              ]}
            >
              <Text style={styles.editorBtnCancelText}>{t.cancel}</Text>
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={() => void applyPending()}
              style={({ pressed }) => [
                styles.editorBtn,
                styles.editorBtnApply,
                pressed && communityPressableTapStyle(true),
              ]}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#e0f2fe" />
              ) : (
                <Text style={styles.editorBtnApplyText}>{t.apply}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderBanner = (url: string, positionY: number, showMenu: boolean) => {
    const { imageStyle } = heroImageLayout(positionY, false);

    return (
      <View style={[styles.wrap, isHero && styles.wrapHero]}>
        <View style={[styles.bannerWrap, isHero && styles.bannerWrapHero, { height: bannerHeight }]}>
          <Image
            source={{ uri: url }}
            style={imageStyle}
            resizeMode="cover"
            fadeDuration={0}
          />
          {!isHero ? <View style={styles.bannerFade} pointerEvents="none" /> : null}
          {showMenu ? (
            <View style={[styles.actions, isHero && styles.actionsHero]}>
              <Pressable
                disabled={busy}
                onPress={() => setMenuOpen((v) => !v)}
                style={({ pressed }) => [styles.menuBtn, pressed && communityPressableTapStyle(true)]}
                accessibilityLabel={language === "en" ? "Image menu" : "画像メニュー"}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#e0f2fe" />
                ) : (
                  <MaterialCommunityIcons name="menu" size={16} color="rgba(224,242,254,0.95)" />
                )}
              </Pressable>
              {menuOpen ? (
                <View style={[styles.menuPanel, isHero && styles.menuPanelHero]}>
                  <Pressable
                    disabled={busy}
                    onPress={startReposition}
                    style={({ pressed }) => [styles.menuItem, pressed && communityPressableTapStyle(true)]}
                  >
                    <MaterialCommunityIcons name="arrow-up-down" size={14} color="rgba(224,242,254,0.95)" />
                    <Text style={styles.menuItemText}>{t.repositionMenu}</Text>
                  </Pressable>
                  <Pressable
                    disabled={busy}
                    onPress={() => void pickImage()}
                    style={({ pressed }) => [styles.menuItem, pressed && communityPressableTapStyle(true)]}
                  >
                    <MaterialCommunityIcons name="camera-outline" size={14} color="rgba(224,242,254,0.95)" />
                    <Text style={styles.menuItemText}>{t.change}</Text>
                  </Pressable>
                  <Pressable
                    disabled={busy}
                    onPress={() => {
                      setMenuOpen(false);
                      confirmRemove();
                    }}
                    style={({ pressed }) => [
                      styles.menuItem,
                      styles.menuItemDanger,
                      pressed && communityPressableTapStyle(true),
                    ]}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={14} color="rgba(254,202,202,0.9)" />
                    <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>{t.remove}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  if (pending) {
    return renderEditor(pending.uri, pending.positionY);
  }

  if (!headerImageUrl) {
    return (
      <Pressable
        disabled={!editable || busy}
        onPress={() => void pickImage()}
        style={({ pressed }) => [
          styles.placeholder,
          isHero && styles.placeholderHero,
          pressed && editable && communityPressableTapStyle(true),
        ]}
        accessibilityLabel={t.add}
      >
        {busy ? (
          <ActivityIndicator color="#22d3ee" />
        ) : (
          <>
            <MaterialCommunityIcons name="image-plus" size={22} color="rgba(165,243,252,0.55)" />
            <Text style={styles.placeholderText}>{t.add}</Text>
          </>
        )}
      </Pressable>
    );
  }

  return renderBanner(headerImageUrl, savedPositionY, editable);
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  wrapHero: {
    marginBottom: 0,
    ...StyleSheet.absoluteFillObject,
  },
  bannerWrap: {
    position: "relative",
    width: "100%",
    height: BANNER_HEIGHT_CARD,
    borderRadius: 8,
    overflow: "hidden",
  },
  bannerWrapColumn: {
    flexDirection: "column",
  },
  dragZone: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    position: "relative",
  },
  bannerWrapHero: {
    borderRadius: 0,
    ...StyleSheet.absoluteFillObject,
  },
  bannerImage: {
    width: "100%",
  },
  bannerImageHeroCover: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerImageHeroAdjust: {
    position: "absolute",
    left: 0,
    right: 0,
    width: "100%",
  },
  bannerFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  repositionHint: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  repositionHintText: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(255,255,255,0.82)",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
    borderRadius: 999,
  },
  editorActions: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.62)",
    padding: 8,
    zIndex: 20,
  },
  editorBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderWidth: 1,
  },
  editorBtnCancel: {
    borderColor: "rgba(255,255,255,0.16)",
  },
  editorBtnApply: {
    borderColor: "rgba(34,211,238,0.45)",
    backgroundColor: "rgba(34,211,238,0.18)",
  },
  editorBtnCancelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.78)",
  },
  editorBtnApplyText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(224,242,254,0.95)",
  },
  actions: {
    position: "absolute",
    right: 8,
    bottom: 8,
    zIndex: 20,
  },
  actionsHero: {
    top: 10,
    bottom: undefined,
    right: 10,
    zIndex: 20,
  },
  menuBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  menuPanel: {
    position: "absolute",
    right: 0,
    bottom: 38,
    minWidth: 132,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(8,12,24,0.94)",
    overflow: "hidden",
  },
  menuPanelHero: {
    top: 40,
    bottom: undefined,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(224,242,254,0.95)",
  },
  menuItemTextDanger: {
    color: "rgba(254,202,202,0.9)",
  },
  placeholder: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(34,211,238,0.28)",
    backgroundColor: "rgba(34,211,238,0.04)",
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  placeholderHero: {
    marginBottom: 0,
    borderRadius: 0,
    borderWidth: 0,
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,14,28,0.55)",
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(165,243,252,0.62)",
  },
});
