"use client";

import TeamAbbrBadge from "@/app/component/games/TeamAbbrBadge";
import {
  formatNbaFanSinceInline,
  formatNbaFavoritePlayerInitialLast,
  type NbaFavorites,
} from "@/lib/profile/nbaFavorites";
import { getNbaTeamFullNameById } from "@/lib/nba-team-names";
import { nameOxanium } from "@/lib/fonts";

type Props = {
  favorites: NbaFavorites;
  language?: "ja" | "en";
  className?: string;
};

/**
 * プロフィールカード用お気に入り（縦積み・フッター左半分向け）。
 * FAVORITES 見出し / チーム行 / 選手は縦積み（名前 + badge）
 * 選手バッジは列揃え（最長名に合わせて左クラスタ）
 */
export default function ProfileNbaFavoritesRow({
  favorites,
  language = "ja",
  className,
}: Props) {
  const teamId = favorites.favoriteNbaTeamId;
  const players = favorites.favoriteNbaPlayers;
  if (!teamId && players.length === 0) return null;

  const fanSince = formatNbaFanSinceInline(
    favorites.favoriteNbaTeamFanSinceSeason,
    language
  );

  return (
    <div
      className={["w-full", className].filter(Boolean).join(" ")}
      aria-label="Favorites"
    >
      <p
        className={`${nameOxanium.className} mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/75`}
        style={{ transform: "skewX(-8deg)" }}
      >
        FAVORITES
      </p>
      <div className="flex flex-col items-stretch gap-1.5">
        {teamId ? (
          <div className="flex w-fit max-w-full min-w-0 items-baseline gap-1.5">
            <span
              className={`${nameOxanium.className} inline-block min-w-0 truncate text-[11px] font-extrabold uppercase tracking-[0.04em] text-white/85`}
              style={{ transform: "skewX(-8deg)" }}
              title={getNbaTeamFullNameById(teamId)}
            >
              {getNbaTeamFullNameById(teamId)}
            </span>
            {fanSince ? (
              <span
                className={`${nameOxanium.className} inline-block shrink-0 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white/65`}
                style={{ transform: "skewX(-8deg)" }}
              >
                {fanSince}
              </span>
            ) : null}
          </div>
        ) : null}
        {players.length > 0 ? (
          <div className="grid w-fit max-w-full grid-cols-[auto_auto] items-center gap-x-1.5 gap-y-1.5">
            {players.map((p) => {
              const label = formatNbaFavoritePlayerInitialLast(p.displayName);
              return (
                <div key={p.playerId} className="contents" title={p.displayName}>
                  <span
                    className={`${nameOxanium.className} inline-block min-w-0 truncate text-[11px] font-extrabold uppercase tracking-[0.06em] text-white/85`}
                    style={{ transform: "skewX(-8deg)" }}
                  >
                    {label}
                  </span>
                  {p.teamId ? (
                    <TeamAbbrBadge teamId={p.teamId} />
                  ) : (
                    <span aria-hidden className="h-[22px] w-[2.5rem]" />
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
