"use client";

import { Camera } from "lucide-react";
import { nameOxanium } from "@/lib/fonts";

const CYAN = "#22d3ee";

type Props = {
  photoURL?: string | null;
  displayName: string;
  size?: "web" | "mobile";
  editable?: boolean;
  onPickPhoto?: () => void;
};

export default function ProfileEditTronAvatar({
  photoURL,
  displayName,
  size = "web",
  editable = false,
  onPickPhoto,
}: Props) {
  const dim = size === "web" ? 148 : 120;
  const ringPad = size === "web" ? 10 : 8;
  const initial = (displayName?.slice(0, 1) ?? "?").toUpperCase();

  return (
    <div
      className="relative mx-auto shrink-0"
      style={{ width: dim + ringPad * 2, height: dim + ringPad * 2 }}
    >
      {/* 外リング + 軌道する光点 */}
      <div
        className="profile-edit-tron-orbit pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: `1px solid rgba(34,211,238,0.35)`,
            boxShadow: `0 0 18px rgba(34,211,238,0.12), inset 0 0 12px rgba(34,211,238,0.06)`,
          }}
        />
        <div className="profile-edit-tron-orbit-spin absolute inset-0">
          <div
            className="profile-edit-tron-orbit-dot absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: size === "web" ? 8 : 7,
              height: size === "web" ? 8 : 7,
              background: CYAN,
              boxShadow: `0 0 10px ${CYAN}, 0 0 20px rgba(34,211,238,0.55)`,
            }}
          />
        </div>
      </div>

      {/* 内リング */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: ringPad - 2,
          border: `1px solid rgba(34,211,238,0.22)`,
        }}
        aria-hidden
      />

      <button
        type="button"
        className={[
          "profile-edit-tron-avatar-core group relative overflow-hidden rounded-full",
          editable ? "cursor-pointer" : "cursor-default",
        ].join(" ")}
        style={{
          width: dim,
          height: dim,
          margin: ringPad,
        }}
        onClick={editable ? onPickPhoto : undefined}
        aria-label={editable ? "Change avatar" : undefined}
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={[
              "flex h-full w-full items-center justify-center bg-[#0a1620] text-cyan-200/90",
              nameOxanium.className,
            ].join(" ")}
            style={{ fontSize: size === "web" ? 42 : 34 }}
          >
            {initial}
          </div>
        )}

        {/* スキャンライン */}
        <div
          className="profile-edit-tron-scanlines pointer-events-none absolute inset-0 opacity-35"
          aria-hidden
        />

        {editable ? (
          <span
            className="absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full border border-cyan-300/35 bg-black/70 text-cyan-200 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden
          >
            <Camera className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </button>
    </div>
  );
}
