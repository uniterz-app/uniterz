"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import TeamAbbrBadge from "@/app/component/games/TeamAbbrBadge";
import { nameOxanium } from "@/lib/fonts";
import {
  formatNbaFavoritePlayerInitialLast,
  NBA_FAVORITE_MAX_PLAYERS,
  type NbaFavoritePlayer,
} from "@/lib/profile/nbaFavorites";

type Props = {
  open: boolean;
  language?: "ja" | "en";
  /** 追加しようとしている選手名 */
  incomingLabel?: string;
  players: NbaFavoritePlayer[];
  busy?: boolean;
  onClose: () => void;
  onReplace: (removePlayerId: string) => void;
};

/**
 * お気に入り選手が上限に達したとき — 誰を外すか選ぶ。
 */
export default function NbaFavoriteLimitModal({
  open,
  language = "ja",
  incomingLabel,
  players,
  busy = false,
  onClose,
  onReplace,
}: Props) {
  const isJa = language === "ja";
  const [pickedId, setPickedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPickedId(null);
      return;
    }
    if (players.length === 1) {
      setPickedId(players[0]!.playerId);
    } else {
      setPickedId(null);
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onClose, players]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="nba-fav-limit-title"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="w-full max-w-sm border border-amber-300/55 bg-[#0a0a0c] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/10 px-4 py-3">
          <p
            className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300/80`}
          >
            FAVORITES
          </p>
          <h2
            id="nba-fav-limit-title"
            className={`${nameOxanium.className} mt-1 text-[15px] font-extrabold text-white`}
            style={{ transform: "skewX(-8deg)" }}
          >
            {isJa ? "入れ替えますか？" : "Replace favorite?"}
          </h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-white/55">
            {isJa
              ? `お気に入り選手は${NBA_FAVORITE_MAX_PLAYERS}人までです${
                  incomingLabel
                    ? `。「${incomingLabel}」に入れ替える選手を選んでください。`
                    : "。"
                }`
              : `You can favorite ${NBA_FAVORITE_MAX_PLAYERS} player${
                  NBA_FAVORITE_MAX_PLAYERS === 1 ? "" : "s"
                }${
                  incomingLabel
                    ? `. Pick who to replace with ${incomingLabel}.`
                    : "."
                }`}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 p-3">
          {players.map((p) => {
            const selected = pickedId === p.playerId;
            const label = formatNbaFavoritePlayerInitialLast(p.displayName);
            return (
              <button
                key={p.playerId}
                type="button"
                disabled={busy}
                onClick={() => setPickedId(p.playerId)}
                className={[
                  "flex w-full items-center gap-2 border px-3 py-2.5 text-left transition",
                  selected
                    ? "border-amber-300/70 bg-amber-400/15"
                    : "border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]",
                  busy ? "opacity-50" : "",
                ].join(" ")}
              >
                <span
                  className={`${nameOxanium.className} min-w-0 flex-1 truncate text-[12px] font-extrabold uppercase tracking-[0.06em] text-white/90`}
                  style={{ transform: "skewX(-8deg)" }}
                  title={p.displayName}
                >
                  {label}
                </span>
                {p.teamId ? <TeamAbbrBadge teamId={p.teamId} /> : null}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className={`${nameOxanium.className} border border-white/20 bg-transparent px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/70 transition hover:border-white/35 hover:text-white/90 disabled:opacity-50`}
          >
            {isJa ? "キャンセル" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={busy || !pickedId}
            onClick={() => {
              if (pickedId) onReplace(pickedId);
            }}
            className={`${nameOxanium.className} border border-amber-300/40 bg-amber-400/10 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-400/20 disabled:opacity-40`}
          >
            {isJa ? "入れ替える" : "Replace"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
