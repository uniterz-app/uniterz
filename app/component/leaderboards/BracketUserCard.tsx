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
  const initial = displayName.charAt(0).toUpperCase();
  const handle = row.handle ?? null;
  const baseCardClass =
    "relative flex items-center justify-between rounded-[18px] border px-4 py-3";

  const content = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-[44px] w-[44px] shrink-0 overflow-hidden rounded-full border border-white/20 bg-black">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              fill
              sizes="44px"
              className="object-cover"
            />
          ) : (
            <div
              className={[
                "grid h-full w-full place-items-center font-black text-[18px] text-white/50",
                alfa.className,
              ].join(" ")}
            >
              {initial}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div
            className={[
              "truncate font-black text-[16px] leading-none text-white",
              jp.className,
            ].join(" ")}
          >
            {displayName}
          </div>
          {handle && <div className="truncate text-[12px] text-white/50">@{handle}</div>}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center">
        <div className="text-[9px] tracking-wider text-white/40">RANK</div>
        <div
          className={["font-black leading-none text-white", alfa.className].join(" ")}
          style={{ fontSize: 24 }}
        >
          #{row.rank}
        </div>
      </div>

      <div className="flex flex-col items-end">
        <div
          className={[
            "font-black tabular-nums leading-none text-white",
            alfa.className,
          ].join(" ")}
          style={{ fontSize: 20 }}
        >
          {row.totalScore} pts
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={[
          baseCardClass,
          "w-full text-left transition hover:bg-white/8 active:scale-[0.99]",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
          borderColor: "rgba(255,255,255,0.12)",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={baseCardClass}
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
        borderColor: "rgba(255,255,255,0.12)",
        boxShadow:
          "0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
      }}
    >
      {content}
    </div>
  );
}
