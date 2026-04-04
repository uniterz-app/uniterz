"use client";

import Link from "next/link";
import Image from "next/image";
import { Flame } from "lucide-react";

type Props = {
  uid: string;
  href: string;
  photoURL?: string;
  displayName: string;
  streak: number;
  hot?: boolean;
};

/** トレンド横スクロール用のコンパクトユーザーカード */
export default function TrendUserCard({
  href,
  photoURL,
  displayName,
  streak,
  hot,
}: Props) {
  const initial = displayName.charAt(0).toUpperCase() || "?";

  return (
    <Link
      href={href}
      className="
        block min-h-[190px] md:min-h-[260px] rounded-2xl border border-white/10
        bg-white/5 p-5 md:p-6 backdrop-blur transition hover:bg-white/[0.08]
      "
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/20 bg-black md:h-20 md:w-20">
          {photoURL ? (
            <Image
              src={photoURL}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-lg font-bold text-white/50">
              {initial}
            </div>
          )}
        </div>
        <div className="mt-3 line-clamp-2 text-sm font-semibold text-white">
          {displayName}
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-orange-300">
          {hot ? <Flame className="h-3.5 w-3.5" /> : null}
          <span>連勝 {streak}</span>
        </div>
      </div>
    </Link>
  );
}
