"use client";

function KinetikAvatarGlyph() {
  return (
    <div className="profile-edit-kinetik-avatar__glyph">
      <svg viewBox="0 0 40 40" aria-hidden>
        <polygon
          className="profile-edit-kinetik-avatar__glyph-shape"
          points="20,9 31.5,29 8.5,29"
          strokeWidth="1.35"
        />
        <circle
          className="profile-edit-kinetik-avatar__glyph-dot"
          cx="20"
          cy="21.5"
          r="2.8"
        />
      </svg>
    </div>
  );
}

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
              <KinetikAvatarGlyph />
              <span className="sr-only">{initial}</span>
            </>
          )}
        </div>
      </div>

      {editable ? <span className="sr-only">Change avatar</span> : null}
    </div>
  );
}
