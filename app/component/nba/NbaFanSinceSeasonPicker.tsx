"use client";

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { nameOxanium } from "@/lib/fonts";
import { nbaFanSinceSeasonKeys } from "@/lib/profile/nbaFavorites";
import {
  CURRENT_NBA_SEASON_KEY,
  nbaSeasonShortLabel,
} from "@/lib/rankings/nbaSeason";

type Props = {
  open: boolean;
  language?: "ja" | "en";
  teamLabel?: string;
  initialSeason?: string;
  onPick: (seasonKey: string) => void;
  onCancel: () => void;
};

/**
 * お気に入りチーム登録時: 何シーズンからファンか選ぶ。
 */
export default function NbaFanSinceSeasonPicker({
  open,
  language = "ja",
  teamLabel,
  initialSeason = CURRENT_NBA_SEASON_KEY,
  onPick,
  onCancel,
}: Props) {
  const isJa = language === "ja";
  const seasons = useMemo(() => nbaFanSinceSeasonKeys(), []);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-season="${initialSeason}"]`
    );
    el?.scrollIntoView({ block: "center" });
  }, [open, initialSeason]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal
      aria-label={isJa ? "ファン歴を選択" : "Select fan since"}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm border border-amber-300/55 bg-[#0a0a0c] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/15 px-4 py-3.5">
          <p
            className={`${nameOxanium.className} text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-300/90`}
            style={{ transform: "skewX(-8deg)" }}
          >
            FAN SINCE
          </p>
          <p
            className={`${nameOxanium.className} mt-1.5 text-[16px] font-extrabold leading-snug text-white`}
            style={{ transform: "skewX(-8deg)" }}
          >
            {teamLabel
              ? isJa
                ? `${teamLabel} のファンはいつから？`
                : `Fan of ${teamLabel} since…`
              : isJa
                ? "いつからファン？"
                : "Fan since…"}
          </p>
        </div>
        <div
          ref={listRef}
          className="max-h-[min(52vh,360px)] overflow-y-auto overscroll-contain"
        >
          {seasons.map((key) => {
            const active = key === initialSeason;
            return (
              <button
                key={key}
                type="button"
                data-season={key}
                onClick={() => onPick(key)}
                className={[
                  "flex w-full items-center justify-between border-b border-white/10 px-4 py-3 text-left transition",
                  active
                    ? "bg-amber-400/15 text-amber-100"
                    : "text-white/90 hover:bg-white/8",
                ].join(" ")}
              >
                <span
                  className={`${nameOxanium.className} text-[15px] font-extrabold`}
                  style={{ transform: "skewX(-8deg)" }}
                >
                  {nbaSeasonShortLabel(key)}
                </span>
                <span
                  className={`${nameOxanium.className} text-[11px] font-bold ${
                    active ? "text-amber-200/70" : "text-white/45"
                  }`}
                >
                  {key}
                </span>
              </button>
            );
          })}
        </div>
        <div className="border-t border-white/15 p-2">
          <button
            type="button"
            onClick={onCancel}
            className={`${nameOxanium.className} w-full border border-white/20 bg-white/5 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/70 transition hover:border-white/35 hover:text-white`}
          >
            {isJa ? "キャンセル" : "Cancel"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
