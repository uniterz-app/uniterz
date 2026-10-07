"use client";

import Image from "next/image";
import { useState } from "react";
import { jp, nameOxanium, nameRajdhani } from "@/lib/fonts";
import {
  ARENA_PASSPORT_ROWS,
  ARENA_PASSPORT_TOTAL,
  arenaPassportBadgeWebSrc,
  type ArenaPassportId,
} from "@/lib/profile/arenaPassport";
import { arenaPassportCopy } from "@/lib/profile/arenaPassportCopy";

type Props = {
  language: string;
  visited: readonly ArenaPassportId[];
  loading?: boolean;
  /** 本人のみ。タップで訪問済みをトグル */
  onToggle?: ((arenaId: ArenaPassportId) => Promise<boolean>) | null;
};

/** カード裏面 PASSPORT — 30 アリーナのバッジ（1 行 = 1 ディビジョン） */
export default function ProfileArenaPassportGrid({
  language,
  visited,
  loading = false,
  onToggle = null,
}: Props) {
  const copy = arenaPassportCopy(language);
  const isCjk = copy.lang === "ja" || copy.lang === "ko" || copy.lang === "zh";
  const visitedSet = new Set(visited);
  const [saveFailed, setSaveFailed] = useState(false);

  const handleToggle = async (id: ArenaPassportId) => {
    if (!onToggle) return;
    setSaveFailed(false);
    const ok = await onToggle(id);
    if (!ok) setSaveFailed(true);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mt-2 flex items-baseline justify-center gap-2">
        <span
          className={[
            nameOxanium.className,
            "text-[15px] font-bold tracking-[0.14em] text-white/95",
          ].join(" ")}
        >
          {copy.title}
        </span>
        <span
          className={[
            nameOxanium.className,
            "text-[13px] font-bold tabular-nums tracking-[0.08em] text-cyan-200/85",
          ].join(" ")}
        >
          {loading ? "–" : visited.length}/{ARENA_PASSPORT_TOTAL}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {ARENA_PASSPORT_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-5 gap-1">
            {row.map((arena) => {
              const isVisited = visitedSet.has(arena.id);
              const label = copy.badgeAria(arena.city, isVisited);
              const img = (
                <>
                  <Image
                    src={arenaPassportBadgeWebSrc(arena.id, isVisited)}
                    alt={label}
                    width={206}
                    height={254}
                    sizes="80px"
                    className={[
                      "h-auto w-full select-none transition-opacity duration-200",
                      loading ? "opacity-30" : isVisited ? "" : "opacity-70",
                    ].join(" ")}
                    draggable={false}
                  />
                  <span
                    className={[
                      nameOxanium.className,
                      "mt-0.5 block truncate text-center text-[9px] font-bold uppercase leading-tight tracking-[0.04em] [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]",
                      isVisited ? "text-[#F6C344]" : "text-white/75",
                    ].join(" ")}
                    aria-hidden
                  >
                    {arena.city}
                  </span>
                </>
              );
              return onToggle ? (
                <button
                  key={arena.id}
                  type="button"
                  onClick={() => void handleToggle(arena.id)}
                  disabled={loading}
                  aria-pressed={isVisited}
                  aria-label={label}
                  className="block w-full transition-transform active:scale-95"
                >
                  {img}
                </button>
              ) : (
                <div key={arena.id} className="w-full">
                  {img}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {onToggle ? (
        <p
          className={[
            isCjk ? jp.className : nameRajdhani.className,
            "mt-3 text-center text-[11px]",
            saveFailed ? "text-rose-300/90" : "text-white/45",
          ].join(" ")}
        >
          {saveFailed ? copy.saveError : copy.editHint}
        </p>
      ) : null}

      <p
        className={[
          isCjk ? jp.className : "",
          "mt-auto pt-3 text-[9px] leading-relaxed text-white/35",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {copy.disclaimer}
      </p>
    </div>
  );
}
