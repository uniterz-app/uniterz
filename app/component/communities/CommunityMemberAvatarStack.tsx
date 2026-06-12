"use client";

import type { GroupMemberPreview } from "@/lib/communities/memberPreviews";

type Props = {
  previews: GroupMemberPreview[];
  /** 重ねて表示する最大人数 */
  max?: number;
  sizeClassName?: string;
  variant?: "round" | "square";
};

export default function CommunityMemberAvatarStack({
  previews,
  max = 4,
  sizeClassName = "size-6",
  variant = "round",
}: Props) {
  const shown = previews.slice(0, max);
  if (shown.length === 0) return null;

  const isSquare = variant === "square";

  const avatars = shown.map((m, i) => {
    const ring = isSquare
      ? m.role === "owner"
        ? "ring-cyan-400/70"
        : "ring-emerald-400/55"
      : m.role === "owner"
        ? "ring-blue-400/85"
        : "ring-emerald-400/75";
    return (
      <div
        key={m.uid}
        className={[
          "relative shrink-0 overflow-hidden bg-[#1a2430]",
          isSquare ? "rounded-sm ring-1" : "rounded-full ring-[1.5px]",
          sizeClassName,
          ring,
          i > 0 ? (isSquare ? "-ml-1.5" : "-ml-2") : "",
        ].join(" ")}
        style={{ zIndex: shown.length - i }}
      >
        {m.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.photoURL}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[8px] font-semibold text-white/35">
            ?
          </div>
        )}
      </div>
    );
  });

  if (isSquare) {
    return (
      <div
        className="inline-flex items-center rounded-sm border border-cyan-400/20 bg-[#0a1018]/80 px-1.5 py-1"
        aria-hidden
      >
        {avatars}
      </div>
    );
  }

  return (
    <div className="flex items-center" aria-hidden>
      {avatars}
    </div>
  );
}
