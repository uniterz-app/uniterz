"use client";

import { useCallback, useState } from "react";
import type { Language } from "@/lib/i18n/language";
import {
  COMMUNITY_GROUP_HERO_BG,
  COMMUNITY_GROUP_HERO_WEB_IMAGE_HEIGHT,
  COMMUNITY_GROUP_HERO_WEB_IMAGE_HEIGHT_WITH_BACK,
  COMMUNITY_GROUP_HERO_WEB_PANEL_OVERLAP,
  COMMUNITY_GROUP_HERO_SCRIM_HORIZONTAL,
  COMMUNITY_GROUP_HERO_SCRIM_VERTICAL,
} from "@/lib/communities/communityGroupHeroLayout";
import type { CommunityGroupSummary } from "@/app/component/communities/communityGroupDetailCache";
import CommunityGroupHeaderImage from "@/app/component/communities/CommunityGroupHeaderImage";
import CommunityGroupHeaderPanel from "@/app/component/communities/CommunityGroupHeaderPanel";
import CommunityGroupListBackHeader from "@/app/component/communities/CommunityGroupListBackHeader";

type Props = {
  groupId: string;
  language: Language;
  summary: CommunityGroupSummary;
  onImageUpdated: (patch: {
    headerImageUrl?: string | null;
    headerImagePositionY?: number;
  }) => void;
  capTop?: boolean;
  onImageEditingChange?: (editing: boolean) => void;
  /** Web — 「一覧へ」を画像上にオーバーレイ */
  overlayBackHeader?: boolean;
  onBack?: () => void;
};

/** Native `CommunityGroupHeaderHeroNative` 相当 */
export default function CommunityGroupHeaderHero({
  groupId,
  language,
  summary,
  onImageUpdated,
  capTop = false,
  onImageEditingChange,
  overlayBackHeader = false,
  onBack,
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
      <>
        {overlayBackHeader && onBack ? (
          <CommunityGroupListBackHeader language={language} onClick={onBack} variant="solid" />
        ) : null}
        <div className="mb-4">
          <CommunityGroupHeaderPanel summary={summary} language={language} compact />
        </div>
      </>
    );
  }

  const imageOverBack = overlayBackHeader && hasImage && Boolean(onBack);
  const imageAreaHeight = imageOverBack
    ? COMMUNITY_GROUP_HERO_WEB_IMAGE_HEIGHT_WITH_BACK
    : COMMUNITY_GROUP_HERO_WEB_IMAGE_HEIGHT;

  const imageBand = (
    <>
      <CommunityGroupHeaderImage
        groupId={groupId}
        language={language}
        name={summary.name}
        description={summary.description}
        headerImageUrl={summary.headerImageUrl}
        headerImagePositionY={summary.headerImagePositionY ?? 50}
        editable={editable}
        layout="hero"
        onEditingChange={handleImageEditingChange}
        onUpdated={onImageUpdated}
      />

      {hasImage && !imageEditing ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-[4]"
            style={{ background: COMMUNITY_GROUP_HERO_SCRIM_VERTICAL }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 z-[5]"
            style={{ background: COMMUNITY_GROUP_HERO_SCRIM_HORIZONTAL }}
            aria-hidden
          />
        </>
      ) : null}
    </>
  );

  return (
    <div
      className={["relative mb-4", capTop || imageOverBack ? "" : "rounded-t-xl"].join(" ")}
      style={{ backgroundColor: COMMUNITY_GROUP_HERO_BG }}
    >
      <div
        className={["relative overflow-hidden", capTop || imageOverBack ? "" : "rounded-t-xl"].join(" ")}
        style={{ height: imageAreaHeight }}
      >
        {imageBand}

        {imageOverBack && onBack ? (
          <CommunityGroupListBackHeader
            language={language}
            onClick={onBack}
            variant="overImage"
          />
        ) : null}
      </div>

      {!imageEditing ? (
        <div
          className="relative z-10 px-0.5"
          style={{
            marginTop: hasImage ? -COMMUNITY_GROUP_HERO_WEB_PANEL_OVERLAP : 0,
          }}
        >
          <CommunityGroupHeaderPanel summary={summary} language={language} compact overlay />
        </div>
      ) : null}
    </div>
  );
}
