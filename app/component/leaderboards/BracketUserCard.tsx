"use client";

import Image from "next/image";
import { alfa, jp } from "@/lib/fonts";
import type { BracketLeaderboardRow } from "@/lib/leaderboards/useBracketLeaderboard";

type Props = {
  row: BracketLeaderboardRow;
  onClick?: () => void;
};

export default function BracketUserCard({ row, onClick }: Props) {
  const avatarUrl = row.photoURL ?? null;
  const displayName = row.displayName || "User";

  const content = (
    <>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/10">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div
            className={["flex h-full w-full items-center justify-center text-lg font-black text-white/50", alfa.className].join(" ")}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={["truncate font-black text-[16px] leading-none text-white", jp.className].join(" ")}
        >
          {displayName}
        </div>
        <div className={["text-sm text-white/50", jp.className].join(" ")}>
          {row.rank}位
        </div>
      </div>
      <div
        className={["shrink-0 font-black tabular-nums leading-none text-white", alfa.className].join(" ")}
        style={{ fontSize: 20 }}
      >
        {row.totalScore} pts
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-left transition hover:bg-white/8 active:scale-[0.99]"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
      {content}
    </div>
  );
}
