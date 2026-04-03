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
    "relative flex items-center justify-between rounded-[14px] border px-3 py-2";

  const content = (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/20 bg-black">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              fill
              sizes="36px"
              className="object-cover"
            />
          ) : (
            <div
              className={[
                "grid h-full w-full place-items-center font-black text-[15px] text-white/50",
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
              "truncate font-black text-[14px] leading-tight text-white",
              jp.className,
            ].join(" ")}
          >
            {displayName}
          </div>
          {handle && (
            <div className="truncate text-[11px] leading-tight text-white/50">
              @{handle}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-1">
        <div className="text-[8px] tracking-wider text-white/40">RANK</div>
        <div
          className={["font-black leading-none text-white", alfa.className].join(
            " "
          )}
          style={{ fontSize: 20 }}
        >
          #{row.rank}
        </div>
      </div>

      <div className="flex flex-col items-end pl-1">
        <div
          className={[
            "font-black tabular-nums leading-none text-white",
            alfa.className,
          ].join(" ")}
          style={{ fontSize: 17 }}
        >
          {row.totalScore} pts
        </div>
      </div>
    </>
  );

  const shellStyle = {
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
    borderColor: "rgba(255,255,255,0.11)",
    boxShadow:
      "0 6px 20px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.16)",
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={[
          baseCardClass,
          "w-full text-left transition hover:bg-white/8 active:scale-[0.99]",
        ].join(" ")}
        style={shellStyle}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={baseCardClass} style={shellStyle}>
      {content}
    </div>
  );
}
