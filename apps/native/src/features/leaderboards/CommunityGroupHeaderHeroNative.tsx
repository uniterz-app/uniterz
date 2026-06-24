/** グループ詳細ヒーロー — 画像を下端で背景色へフェード、TITLE を画像上に重ねる */
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Language } from "../../../../../lib/i18n/language";
import {
  COMMUNITY_GROUP_HERO_BG,
  COMMUNITY_GROUP_HERO_IMAGE_HEIGHT,
  COMMUNITY_GROUP_HERO_NATIVE_SCRIM,
  COMMUNITY_GROUP_HERO_NATIVE_SCRIM_HORIZONTAL,
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
};

export default function CommunityGroupHeaderHeroNative({
  groupId,
  language,
  summary,
  getIdToken,
  onImageUpdated,
  capTop = false,
  onImageEditingChange,
}: Props) {
  const [imageEditing, setImageEditing] = useState(false);
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

  return (
    <View style={[styles.hero, capTop && styles.heroCapTop]}>
      <View style={[styles.imageLayer, capTop && styles.imageLayerCapTop]}>
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
          onEditingChange={handleImageEditingChange}
          onUpdated={onImageUpdated}
        />

        {hasImage && !imageEditing ? (
          <>
            <LinearGradient
              pointerEvents="none"
              colors={[...COMMUNITY_GROUP_HERO_NATIVE_SCRIM.colors]}
              locations={[...COMMUNITY_GROUP_HERO_NATIVE_SCRIM.locations]}
              style={styles.scrim}
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
        ) : null}
      </View>

      {!imageEditing ? (
        <View style={styles.panelOverlay}>
          <CommunityGroupHeaderPanelNative summary={summary} language={language} overlay />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: "relative",
    marginBottom: 16,
    backgroundColor: COMMUNITY_GROUP_HERO_BG,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  heroCapTop: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  panelOnly: {
    marginBottom: 16,
  },
  imageLayer: {
    height: COMMUNITY_GROUP_HERO_IMAGE_HEIGHT,
    position: "relative",
    overflow: "hidden",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imageLayerCapTop: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
  panelOverlay: {
    position: "relative",
    zIndex: 10,
    marginTop: -COMMUNITY_GROUP_HERO_PANEL_OVERLAP,
    paddingHorizontal: 2,
  },
});
