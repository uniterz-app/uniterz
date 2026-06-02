"use client";

import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";

type Props = {
  onClick?: () => void;
  disabled?: boolean;
  closeLabel?: string;
};

/** ログアウト確認などと同系の方眼＋暗幕（モーダル背面） */
export function CommunityModalGridBackdrop({
  onClick,
  disabled,
  closeLabel = "Close",
}: Props) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-[#050814]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.38]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-black/55 backdrop-blur-sm"
        aria-hidden
      />
      {onClick ? (
        <button
          type="button"
          aria-label={closeLabel}
          className="absolute inset-0 disabled:pointer-events-none"
          onClick={onClick}
          disabled={disabled}
        />
      ) : null}
    </>
  );
}
