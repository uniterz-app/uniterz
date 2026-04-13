// app/component/profile/ui/MobileProfileHeaderV2.tsx
"use client";

import React from "react";
import { Menu } from "lucide-react";

type HeaderProfile = {
  displayName?: string;
  handle?: string;
  bio?: string;
  avatarUrl?: string | null;
  currentStreak?: number;
};

type Props = {
  profile: HeaderProfile;
  canOpenSettings?: boolean;
  onOpenSettings?: () => void;

  coverUrl?: string | null;

  coverHeight?: number; // default 140
  avatarSize?: number; // default 84

  // streak frame
  streakFrameMin?: number; // default 3

  // 確認用（未指定なら profile.currentStreak を使う）
  debugCurrentStreak?: number | null;
  /** 未読お知らせ件数 */
  menuUnreadCount?: number;
};

export default function MobileProfileHeaderV2({
  profile,
  canOpenSettings,
  onOpenSettings,
  coverUrl,
  coverHeight = 140,
  avatarSize = 84,
  streakFrameMin = 3,
  debugCurrentStreak = null,
  menuUnreadCount = 0,
}: Props) {
  const displayName = profile.displayName ?? "";
  const handle = profile.handle ?? "";
  const bio = profile.bio ?? "";
  const avatarUrl = profile.avatarUrl ?? null;

  const currentStreakRaw = profile.currentStreak ?? 0;
  const currentStreak =
    typeof debugCurrentStreak === "number" ? debugCurrentStreak : currentStreakRaw;

  const isHot = currentStreak >= streakFrameMin;

  const coverH = Math.max(110, Math.min(220, coverHeight));
  const avatarS = Math.max(64, Math.min(120, avatarSize));

  // アバター中心で上下が切り替わるようにする
  // cover: avatarS/2 だけ下に伸ばす → 切替ラインがアバター中心に来る
  const coverTotalH = coverH + Math.round(avatarS / 2);

  // bottom: アバター下半分 + 余白分だけ上にパディング（詰める）
  const bottomPadTop = Math.round(avatarS / 2) + 6;

  return (
    <div className="relative rounded-3xl overflow-visible">
      {/* outer (frame) */}
      <div className="relative rounded-3xl overflow-visible">
        {isHot && (
          <>
            <div className="absolute -inset-[10px] rounded-[28px] bg-linear-to-r from-yellow-400 via-orange-500 to-red-600 blur-2xl opacity-70 pointer-events-none" />
            <div className="absolute -inset-[2px] rounded-3xl bg-linear-to-r from-yellow-300 via-orange-500 to-red-600 pointer-events-none" />
          </>
        )}

        {/* inner */}
        <div className="relative z-10 overflow-hidden rounded-3xl border border-white/10">
          {/* top (cover) */}
          <div className="relative" style={{ height: coverTotalH }}>
            {/* base (streakで色切替) */}
            <div
              className={[
                "absolute inset-0",
                isHot
                  ? "bg-linear-to-br from-[#2a1206] via-[#1a0b06] to-[#060a12]"
                  : "bg-linear-to-br from-[#0b1220] via-[#111827] to-[#060a12]",
              ].join(" ")}
            />

            {/* cover image */}
            {coverUrl && (
              <img
                src={coverUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            {/* overlay */}
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-black/70" />

            {/* settings */}
            {canOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5"
              >
                <Menu className="h-5 w-5" />
                {menuUnreadCount > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm"
                    aria-hidden
                  >
                    {menuUnreadCount > 9 ? "9+" : menuUnreadCount}
                  </span>
                )}
              </button>
            )}

            {/* avatar (center on split line) */}
            <div
              className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-10"
              style={{ width: avatarS, height: avatarS }}
            >
              <div className="h-full w-full rounded-full overflow-hidden border border-white/25 bg-[#0f2d35] shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-white/5" />
                )}
              </div>

              {/* ring */}
              <div className="pointer-events-none absolute inset-[-6px] rounded-full border border-white/10" />
            </div>
          </div>

          {/* bottom */}
          <div className="relative px-4 pb-4" style={{ paddingTop: bottomPadTop }}>
            <div
              className={[
                "absolute inset-0",
                isHot ? "bg-[#0b0706]/80" : "bg-[#050814]/80",
              ].join(" ")}
            />

            {/* content */}
            <div className="relative text-center">
              <div className="text-[18px] font-extrabold leading-tight truncate">
                {displayName}
              </div>
              <div className="mt-0.5 text-sm text-white/70 truncate">{handle}</div>

              {bio ? (
                <div className="mt-2 text-[13px] leading-snug text-white/85">
                  {bio}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}