/** グループ詳細ヒーロー — カバー画像の上に名前、下で背景へ溶ける */
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Language } from "../../../../../lib/i18n/language";
import {
  COMMUNITY_GROUP_HERO_BG,
  COMMUNITY_GROUP_HERO_IMAGE_HEIGHT,
  COMMUNITY_GROUP_HERO_NATIVE_SCRIM,
  COMMUNITY_GROUP_HERO_NATIVE_SCRIM_HORIZONTAL,
  COMMUNITY_GROUP_HERO_NATIVE_SCRIM_BOTTOM,
  COMMUNITY_GROUP_HERO_NATIVE_SCRIM_TOP,
  COMMUNITY_GROUP_HERO_PANEL_OVERLAP,
} from "../../../../../lib/communities/communityGroupHeroLayout";
import type { CommunityGroupSummary } from "./communityApiNative";
import CommunityGroupHeaderImageNative from "./CommunityGroupHeaderImageNative";
import CommunityGroupHeaderPanelNative from "./CommunityGroupHeaderPanelNative";

type Props = {
  groupId: string;
  language: Language;
  summary: CommunityGroupSummary;
  getIdToken: () => Promise<string>;
  onImageUpdated: (patch: {
    headerImageUrl?: string | null;
    headerImagePositionY?: number;
  }) => void;
  /** 一覧へヘッダー直下 — 上角丸を付けない */
  capTop?: boolean;
  /** 画像編集中 — 親 ScrollView のスクロール無効化用 */
  onImageEditingChange?: (editing: boolean) => void;
  onEditGroup?: () => void;
  onEndGroup?: () => void;
};

export default function CommunityGroupHeaderHeroNative({
  groupId,
  language,
  summary,
  getIdToken,
  onImageUpdated,
  capTop = false,
  onImageEditingChange,
  onEditGroup,
  onEndGroup,
}: Props) {
  const [imageEditing, setImageEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const hasImage = Boolean(summary.headerImageUrl);
  const editable = summary.isOwner && !summary.archived;
  const showMedia = hasImage || editable;

  const handleImageEditingChange = useCallback(
    (editing: boolean) => {
      setImageEditing(editing);
      onImageEditingChange?.(editing);
    },
    [onImageEditingChange]
  );

  if (!showMedia) {
    return (
      <View style={styles.panelOnly}>
        <CommunityGroupHeaderPanelNative summary={summary} language={language} />
      </View>
    );
  }

  const photoOverlay =
    hasImage && !imageEditing ? (
      <>
        <LinearGradient
          pointerEvents="none"
          colors={[...COMMUNITY_GROUP_HERO_NATIVE_SCRIM_TOP.colors]}
          locations={[...COMMUNITY_GROUP_HERO_NATIVE_SCRIM_TOP.locations]}
          style={[
            styles.scrimTop,
            {
              height:
                COMMUNITY_GROUP_HERO_IMAGE_HEIGHT *
                COMMUNITY_GROUP_HERO_NATIVE_SCRIM_TOP.heightRatio,
            },
          ]}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[...COMMUNITY_GROUP_HERO_NATIVE_SCRIM.colors]}
          locations={[...COMMUNITY_GROUP_HERO_NATIVE_SCRIM.locations]}
          style={styles.scrim}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[...COMMUNITY_GROUP_HERO_NATIVE_SCRIM_BOTTOM.colors]}
          locations={[...COMMUNITY_GROUP_HERO_NATIVE_SCRIM_BOTTOM.locations]}
          style={[
            styles.scrimBottom,
            {
              height:
                COMMUNITY_GROUP_HERO_IMAGE_HEIGHT *
                COMMUNITY_GROUP_HERO_NATIVE_SCRIM_BOTTOM.heightRatio,
            },
          ]}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[...COMMUNITY_GROUP_HERO_NATIVE_SCRIM_HORIZONTAL.colors]}
          locations={[...COMMUNITY_GROUP_HERO_NATIVE_SCRIM_HORIZONTAL.locations]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.scrim}
        />
      </>
    ) : null;

  return (
    <View style={[styles.hero, capTop && styles.heroCapTop, menuOpen && styles.heroMenuOpen]}>
      <View
        style={[
          styles.imageLayer,
          capTop && styles.imageLayerCapTop,
          menuOpen && styles.imageLayerMenuOpen,
        ]}
      >
        <CommunityGroupHeaderImageNative
          groupId={groupId}
          language={language}
          name={summary.name}
          description={summary.description}
          headerImageUrl={summary.headerImageUrl}
          headerImagePositionY={summary.headerImagePositionY ?? 50}
          editable={editable}
          getIdToken={getIdToken}
          layout="hero"
          photoOverlay={photoOverlay}
          onEditingChange={handleImageEditingChange}
          onUpdated={onImageUpdated}
          onEditGroup={onEditGroup}
          onEndGroup={onEndGroup}
          onMenuOpenChange={setMenuOpen}
        />
      </View>

      {!imageEditing ? (
        <View
          style={[styles.panelOverlay, menuOpen && styles.panelOverlayMenuOpen]}
          pointerEvents={menuOpen ? "none" : "auto"}
        >
          <CommunityGroupHeaderPanelNative
            summary={summary}
            language={language}
            overlay
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: "relative",
    marginBottom: 0,
    width: "100%",
    overflow: "hidden",
    backgroundColor: COMMUNITY_GROUP_HERO_BG,
  },
  heroCapTop: {},
  panelOnly: {
    marginBottom: 0,
  },
  imageLayer: {
    width: "100%",
    height: COMMUNITY_GROUP_HERO_IMAGE_HEIGHT,
    position: "relative",
    overflow: "hidden",
    backgroundColor: COMMUNITY_GROUP_HERO_BG,
  },
  imageLayerCapTop: {},
  /** メニュー中はタイトル帯より前面にして「グループ終了」などを押せるようにする */
  imageLayerMenuOpen: {
    zIndex: 30,
  },
  heroMenuOpen: {
    overflow: "visible",
    zIndex: 30,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
  scrimTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  scrimBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  panelOverlay: {
    position: "relative",
    zIndex: 10,
    marginTop: -COMMUNITY_GROUP_HERO_PANEL_OVERLAP,
    paddingHorizontal: 0,
  },
  panelOverlayMenuOpen: {
    zIndex: 1,
  },
});
