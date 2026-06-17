"use client";

import { KinetikAvatarGlyph } from "@/app/component/common/KinetikAvatarGlyph";

export default function ProfileEditKinetikAvatar({
  photoURL,
  displayName,
  editable,
}: {
  photoURL?: string | null;
  displayName: string;
  editable?: boolean;
}) {
  const initial = (displayName?.slice(0, 1) ?? "K").toUpperCase();

  return (
    <div className="profile-edit-kinetik-avatar">
      <div className="profile-edit-kinetik-avatar__plate">
        <div
          className="profile-edit-kinetik-avatar__edge profile-edit-kinetik-avatar__edge--tl"
          aria-hidden
        />
        <div
          className="profile-edit-kinetik-avatar__edge profile-edit-kinetik-avatar__edge--br"
          aria-hidden
        />

        <div className="profile-edit-kinetik-avatar__inner">
          {photoURL ? (
            <img src={photoURL} alt="" />
          ) : (
            <>
              <KinetikAvatarGlyph variant="kinetik" />
              <span className="sr-only">{initial}</span>
            </>
          )}
        </div>
      </div>

      {editable ? <span className="sr-only">Change avatar</span> : null}
    </div>
  );
}
