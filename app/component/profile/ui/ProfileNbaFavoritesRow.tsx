"use client";

import TeamAbbrBadge from "@/app/component/games/TeamAbbrBadge";
import {
  formatNbaFanSinceInline,
  formatNbaFavoritePlayerInitialLast,
  type NbaFavorites,
} from "@/lib/profile/nbaFavorites";
import {
  compactNbaCardNickname,
  getNbaTeamNicknameById,
} from "@/lib/nba-team-names";
import { nameOxanium } from "@/lib/fonts";

type Props = {
  favorites: NbaFavorites;
  language?: "ja" | "en";
  className?: string;
};

/**
 * プロフィールカード用お気に入り（チーム1・選手1・横並び）。
 * FAVORITES 見出しは中央。
 */
export default function ProfileNbaFavoritesRow({
  favorites,
  language = "ja",
  className,
}: Props) {
  const teamId = favorites.favoriteNbaTeamId;
  const player = favorites.favoriteNbaPlayers[0] ?? null;
  if (!teamId && !player) return null;

  const fanSince = formatNbaFanSinceInline(
    favorites.favoriteNbaTeamFanSinceSeason,
    language
  );
  const teamLabel = teamId
    ? compactNbaCardNickname(getNbaTeamNicknameById(teamId), teamId)
    : "";

  return (
    <div
      className={["w-full", className].filter(Boolean).join(" ")}
      aria-label="Favorites"
    >
      <p
        className={`${nameOxanium.className} mb-1.5 text-center text-[13px] font-extrabold uppercase tracking-[0.18em] text-white/75`}
        style={{ transform: "skewX(-8deg)" }}
      >
        FAVORITES
      </p>
      <div className="flex w-full min-w-0 items-center justify-center gap-3">
        {teamId ? (
          <div className="flex min-w-0 max-w-[50%] items-baseline gap-1.5">
            <span
              className={`${nameOxanium.className} inline-block min-w-0 truncate text-[11px] font-extrabold uppercase tracking-[0.04em] text-white/85`}
              style={{ transform: "skewX(-8deg)" }}
              title={teamLabel}
            >
              {teamLabel}
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
        {teamId && player ? (
          <span className="shrink-0 text-white/25" aria-hidden>
            ·
          </span>
        ) : null}
        {player ? (
          <div
            className="flex min-w-0 max-w-[50%] items-center gap-1.5"
            title={player.displayName}
          >
            <span
              className={`${nameOxanium.className} inline-block min-w-0 truncate text-[11px] font-extrabold uppercase tracking-[0.06em] text-white/85`}
              style={{ transform: "skewX(-8deg)" }}
            >
              {formatNbaFavoritePlayerInitialLast(player.displayName)}
            </span>
            {player.teamId ? <TeamAbbrBadge teamId={player.teamId} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
