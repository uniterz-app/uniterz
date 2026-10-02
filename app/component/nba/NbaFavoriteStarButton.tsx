"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  NbaFavoritesMaxPlayersError,
  saveMeNbaFavorites,
} from "@/lib/api/saveMeNbaFavorites";
import {
  formatNbaFavoritePlayerInitialLast,
  hasNbaFavoritePlayer,
  hasNbaFavoriteTeam,
  NBA_FAVORITE_MAX_PLAYERS,
  type NbaFavorites,
} from "@/lib/profile/nbaFavorites";
import { useMyNbaFavorites } from "@/lib/profile/useMyNbaFavorites";
import { getNbaTeamNicknameById } from "@/lib/nba-team-names";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import NbaFanSinceSeasonPicker from "@/app/component/nba/NbaFanSinceSeasonPicker";
import NbaFavoriteLimitModal from "@/app/component/nba/NbaFavoriteLimitModal";

type TeamProps = {
  kind: "team";
  teamId: string;
  language?: "ja" | "en";
  className?: string;
};

type PlayerProps = {
  kind: "player";
  playerId: string;
  displayName: string;
  teamId: string;
  language?: "ja" | "en";
  className?: string;
};

export type NbaFavoriteStarButtonProps = TeamProps | PlayerProps;

function StarGlyph({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
      className="block"
    >
      {filled ? (
        <path
          fill="currentColor"
          d="M12 2.5l2.9 6.1 6.7.7-5 4.6 1.4 6.6L12 17.8 5.99 20.5 7.4 13.9l-5-4.6 6.7-.7L12 2.5z"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
          d="M12 3.2l2.55 5.35 5.85.62-4.4 4.05 1.25 5.8L12 16.35 6.75 19.02l1.25-5.8-4.4-4.05 5.85-.62L12 3.2z"
        />
      )}
    </svg>
  );
}

/**
 * プレイヤー／チーム詳細ヒーロー用お気に入り星トグル。
 * チーム追加時はファン歴シーズンを選ぶ。選手上限時は入れ替えモーダル。
 */
export default function NbaFavoriteStarButton(
  props: NbaFavoriteStarButtonProps
) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const isJa = (props.language ?? "ja") === "ja";
  const { favorites, ready, uid } = useMyNbaFavorites();
  const [busy, setBusy] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [replaceBusy, setReplaceBusy] = useState(false);
  const [fanSinceOpen, setFanSinceOpen] = useState(false);

  const active =
    props.kind === "team"
      ? hasNbaFavoriteTeam(favorites, props.teamId)
      : hasNbaFavoritePlayer(favorites, props.playerId);

  const pushLogin = useCallback(() => {
    const isMobile =
      pathname.startsWith("/mobile") || pathname.startsWith("/m/");
    router.push(isMobile ? "/mobile/login" : "/web/login");
  }, [pathname, router]);

  const saveTeam = useCallback(
    async (teamId: string, fanSinceSeason?: string | null) => {
      setBusy(true);
      try {
        await saveMeNbaFavorites({
          action: "toggleTeam",
          teamId,
          fanSinceSeason,
        });
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const onToggle = useCallback(async () => {
    if (busy || replaceBusy) return;
    if (!uid) {
      pushLogin();
      return;
    }
    if (props.kind === "team") {
      if (active) {
        await saveTeam(props.teamId);
        return;
      }
      setFanSinceOpen(true);
      return;
    }
    if (
      !active &&
      favorites.favoriteNbaPlayers.length >= NBA_FAVORITE_MAX_PLAYERS
    ) {
      setLimitOpen(true);
      return;
    }
    setBusy(true);
    try {
      await saveMeNbaFavorites({
        action: "togglePlayer",
        playerId: props.playerId,
        displayName: props.displayName,
        teamId: props.teamId,
      });
    } catch (e) {
      if (e instanceof NbaFavoritesMaxPlayersError) {
        setLimitOpen(true);
      }
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    replaceBusy,
    uid,
    props,
    pushLogin,
    active,
    saveTeam,
    favorites.favoriteNbaPlayers.length,
  ]);

  const onReplace = useCallback(
    async (removePlayerId: string) => {
      if (props.kind !== "player" || replaceBusy) return;
      setReplaceBusy(true);
      try {
        await saveMeNbaFavorites({
          action: "replacePlayer",
          removePlayerId,
          playerId: props.playerId,
          displayName: props.displayName,
          teamId: props.teamId,
        });
        setLimitOpen(false);
      } finally {
        setReplaceBusy(false);
      }
    },
    [props, replaceBusy]
  );

  const label = active
    ? isJa
      ? "お気に入りを解除"
      : "Remove favorite"
    : isJa
      ? "お気に入りに追加"
      : "Add favorite";

  const incomingLabel =
    props.kind === "player"
      ? formatNbaFavoritePlayerInitialLast(props.displayName)
      : undefined;

  return (
    <div className={["relative shrink-0", props.className].filter(Boolean).join(" ")}>
      <button
        type="button"
        onClick={() => void onToggle()}
        disabled={busy || replaceBusy || !ready}
        aria-pressed={active}
        aria-label={label}
        title={label}
        className={[
          "flex h-9 w-9 items-center justify-center border transition",
          active
            ? "border-amber-300/70 bg-amber-400/15 text-amber-300"
            : "border-white/25 bg-black/40 text-white/55 hover:border-white/45 hover:text-white/85",
          busy || replaceBusy || !ready ? "opacity-50" : "",
        ].join(" ")}
      >
        <StarGlyph filled={active} />
      </button>
      {props.kind === "player" ? (
        <NbaFavoriteLimitModal
          open={limitOpen}
          language={isJa ? "ja" : "en"}
          incomingLabel={incomingLabel}
          players={favorites.favoriteNbaPlayers}
          busy={replaceBusy}
          onClose={() => {
            if (!replaceBusy) setLimitOpen(false);
          }}
          onReplace={(id) => void onReplace(id)}
        />
      ) : null}
      {props.kind === "team" ? (
        <NbaFanSinceSeasonPicker
          open={fanSinceOpen}
          language={isJa ? "ja" : "en"}
          teamLabel={getNbaTeamNicknameById(props.teamId)}
          initialSeason={
            favorites.favoriteNbaTeamFanSinceSeason ?? CURRENT_NBA_SEASON_KEY
          }
          onCancel={() => setFanSinceOpen(false)}
          onPick={(seasonKey) => {
            setFanSinceOpen(false);
            void saveTeam(props.teamId, seasonKey);
          }}
        />
      ) : null}
    </div>
  );
}

/** テスト・ストーリー用: 外部 favorites で見た目だけ */
export function NbaFavoriteStarPreview({
  active,
  className,
}: {
  active: boolean;
  className?: string;
  favorites?: NbaFavorites;
}) {
  return (
    <div
      className={[
        "flex h-9 w-9 items-center justify-center border",
        active
          ? "border-amber-300/70 bg-amber-400/15 text-amber-300"
          : "border-white/25 bg-black/40 text-white/55",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      <StarGlyph filled={active} />
    </div>
  );
}
