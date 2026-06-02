"use client";

import type { GroupMemberPreview } from "@/lib/communities/memberPreviews";

type Props = {
  previews: GroupMemberPreview[];
  /** 重ねて表示する最大人数 */
  max?: number;
  sizeClassName?: string;
};

export default function CommunityMemberAvatarStack({
  previews,
  max = 4,
  sizeClassName = "size-6",
}: Props) {
  const shown = previews.slice(0, max);
  if (shown.length === 0) return null;

  return (
    <div className="flex items-center" aria-hidden>
      {shown.map((m, i) => {
        const ring =
          m.role === "owner"
            ? "ring-blue-400/85"
            : "ring-emerald-400/75";
        return (
          <div
            key={m.uid}
            className={[
              "relative shrink-0 overflow-hidden rounded-full bg-[#1a2430] ring-[1.5px]",
              sizeClassName,
              ring,
              i > 0 ? "-ml-2" : "",
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
      })}
    </div>
  );
}
