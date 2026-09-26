/**
 * 公開プロフィール用お気に入り NBA チーム / 選手。
 * users/{uid}.favoriteNbaTeamId / favoriteNbaTeamFanSinceSeason / favoriteNbaPlayers
 */

import { TEAM_SHORT } from "@/lib/team-short";
import {
  CURRENT_NBA_SEASON_KEY,
  nbaSeasonShortLabel,
  previousNbaSeasonKey,
} from "@/lib/rankings/nbaSeason";

export const NBA_FAVORITE_MAX_PLAYERS = 3;

/** ファン歴ピッカーの最古（含む）— 3ポイントライン導入付近 */
export const NBA_FAN_SINCE_OLDEST_START_YEAR = 1979;

const NBA_SEASON_KEY_RE = /^\d{4}-\d{2}$/;

export type NbaFavoritePlayer = {
  playerId: string;
  displayName: string;
  teamId: string;
};

export type NbaFavorites = {
  favoriteNbaTeamId: string | null;
  /** そのチームのファンになったシーズン（例: "2016-17"） */
  favoriteNbaTeamFanSinceSeason: string | null;
  favoriteNbaPlayers: NbaFavoritePlayer[];
};

const EMPTY: NbaFavorites = {
  favoriteNbaTeamId: null,
  favoriteNbaTeamFanSinceSeason: null,
  favoriteNbaPlayers: [],
};

const NBA_TEAM_ID_RE = /^nba-[a-z0-9-]+$/;
const PLAYER_ID_RE = /^[0-9]{1,12}$/;

export function isValidNbaFavoriteTeamId(teamId: string): boolean {
  if (!NBA_TEAM_ID_RE.test(teamId)) return false;
  return teamId in TEAM_SHORT;
}

export function isValidNbaFavoritePlayerId(playerId: string): boolean {
  return PLAYER_ID_RE.test(playerId);
}

export function isValidNbaFanSinceSeason(seasonKey: string): boolean {
  if (!NBA_SEASON_KEY_RE.test(seasonKey)) return false;
  const start = Number.parseInt(seasonKey.slice(0, 4), 10);
  const yy = Number.parseInt(seasonKey.slice(5), 10);
  if (!Number.isFinite(start) || !Number.isFinite(yy)) return false;
  if ((start + 1) % 100 !== yy) return false;
  const currentStart = Number.parseInt(CURRENT_NBA_SEASON_KEY.slice(0, 4), 10);
  if (start > currentStart) return false;
  if (start < NBA_FAN_SINCE_OLDEST_START_YEAR) return false;
  return true;
}

/** 新しい順のファン歴候補シーズン */
export function nbaFanSinceSeasonKeys(
  fromSeasonKey: string = CURRENT_NBA_SEASON_KEY
): string[] {
  const out: string[] = [];
  let key = fromSeasonKey.trim() || CURRENT_NBA_SEASON_KEY;
  for (let i = 0; i < 80; i++) {
    out.push(key);
    const start = Number.parseInt(key.slice(0, 4), 10);
    if (!Number.isFinite(start) || start <= NBA_FAN_SINCE_OLDEST_START_YEAR) {
      break;
    }
    key = previousNbaSeasonKey(key);
  }
  return out;
}

export function formatNbaFanSinceLabel(
  seasonKey: string | null | undefined,
  language: "ja" | "en" = "ja"
): string | null {
  if (!seasonKey || !isValidNbaFanSinceSeason(seasonKey)) return null;
  const short = nbaSeasonShortLabel(seasonKey);
  return language === "ja" ? `${short} からファン` : `Fan since ${short}`;
}

/** プロフィール横並び用の短いファン歴（例: SINCE 16-17 / 16-17〜） */
export function formatNbaFanSinceInline(
  seasonKey: string | null | undefined,
  language: "ja" | "en" = "ja"
): string | null {
  if (!seasonKey || !isValidNbaFanSinceSeason(seasonKey)) return null;
  const short = nbaSeasonShortLabel(seasonKey);
  return language === "ja" ? `${short}〜` : `SINCE ${short}`;
}

/** 「Anthony Edwards」→「A.EDWARDS」 */
export function formatNbaFavoritePlayerInitialLast(
  displayName: string
): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0]!.toUpperCase();
  }
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  const initial = first.charAt(0).toUpperCase();
  return `${initial}.${last.toUpperCase()}`;
}

function normalizePlayer(raw: unknown): NbaFavoritePlayer | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const playerId =
    typeof o.playerId === "string"
      ? o.playerId.trim()
      : typeof o.id === "string"
        ? o.id.trim()
        : "";
  if (!isValidNbaFavoritePlayerId(playerId)) return null;
  const displayName =
    typeof o.displayName === "string"
      ? o.displayName.trim().slice(0, 80)
      : typeof o.name === "string"
        ? o.name.trim().slice(0, 80)
        : "";
  const teamId =
    typeof o.teamId === "string" ? o.teamId.trim().slice(0, 40) : "";
  if (!displayName) return null;
  return {
    playerId,
    displayName,
    teamId: isValidNbaFavoriteTeamId(teamId) ? teamId : "",
  };
}

/** Firestore users ドキュメントからお気に入りを読む */
export function parseNbaFavorites(
  data: Record<string, unknown> | null | undefined
): NbaFavorites {
  if (!data) return { ...EMPTY, favoriteNbaPlayers: [] };

  const rawTeam = data.favoriteNbaTeamId;
  let favoriteNbaTeamId: string | null = null;
  if (typeof rawTeam === "string" && isValidNbaFavoriteTeamId(rawTeam.trim())) {
    favoriteNbaTeamId = rawTeam.trim();
  } else if (rawTeam === null) {
    favoriteNbaTeamId = null;
  }

  const rawSince = data.favoriteNbaTeamFanSinceSeason;
  let favoriteNbaTeamFanSinceSeason: string | null = null;
  if (
    typeof rawSince === "string" &&
    isValidNbaFanSinceSeason(rawSince.trim())
  ) {
    favoriteNbaTeamFanSinceSeason = rawSince.trim();
  }

  // チームがあるのに since が無い古いデータは今季扱いしない（表示だけ省略）
  if (!favoriteNbaTeamId) {
    favoriteNbaTeamFanSinceSeason = null;
  }

  const rawPlayers = data.favoriteNbaPlayers;
  const favoriteNbaPlayers: NbaFavoritePlayer[] = [];
  if (Array.isArray(rawPlayers)) {
    for (const item of rawPlayers) {
      const p = normalizePlayer(item);
      if (!p) continue;
      if (favoriteNbaPlayers.some((x) => x.playerId === p.playerId)) continue;
      favoriteNbaPlayers.push(p);
      if (favoriteNbaPlayers.length >= NBA_FAVORITE_MAX_PLAYERS) break;
    }
  }

  return {
    favoriteNbaTeamId,
    favoriteNbaTeamFanSinceSeason,
    favoriteNbaPlayers,
  };
}

export function hasNbaFavoriteTeam(
  favorites: NbaFavorites,
  teamId: string
): boolean {
  return (
    !!favorites.favoriteNbaTeamId &&
    favorites.favoriteNbaTeamId === teamId
  );
}

export function hasNbaFavoritePlayer(
  favorites: NbaFavorites,
  playerId: string
): boolean {
  const id = String(playerId);
  return favorites.favoriteNbaPlayers.some((p) => p.playerId === id);
}

/** トグル後の次状態（クライアント楽観更新・サーバー共通） */
export function toggleNbaFavoriteTeam(
  current: NbaFavorites,
  teamId: string,
  fanSinceSeason?: string | null
): NbaFavorites {
  if (!isValidNbaFavoriteTeamId(teamId)) return current;
  if (current.favoriteNbaTeamId === teamId) {
    return {
      ...current,
      favoriteNbaTeamId: null,
      favoriteNbaTeamFanSinceSeason: null,
    };
  }
  const since =
    typeof fanSinceSeason === "string" &&
    isValidNbaFanSinceSeason(fanSinceSeason)
      ? fanSinceSeason
      : CURRENT_NBA_SEASON_KEY;
  return {
    ...current,
    favoriteNbaTeamId: teamId,
    favoriteNbaTeamFanSinceSeason: since,
  };
}

export type ToggleNbaFavoritePlayerResult =
  | { ok: true; next: NbaFavorites }
  | { ok: false; reason: "invalid" | "max_players"; next: NbaFavorites };

function normalizeFavoritePlayerInput(
  player: NbaFavoritePlayer
): NbaFavoritePlayer | null {
  if (!isValidNbaFavoritePlayerId(player.playerId)) return null;
  const displayName = player.displayName.trim().slice(0, 80);
  if (!displayName) return null;
  const teamId =
    typeof player.teamId === "string" && isValidNbaFavoriteTeamId(player.teamId)
      ? player.teamId
      : "";
  return { playerId: player.playerId, displayName, teamId };
}

export function toggleNbaFavoritePlayer(
  current: NbaFavorites,
  player: NbaFavoritePlayer
): ToggleNbaFavoritePlayerResult {
  const normalized = normalizeFavoritePlayerInput(player);
  if (!normalized) {
    return { ok: false, reason: "invalid", next: current };
  }
  const id = normalized.playerId;
  const exists = current.favoriteNbaPlayers.some((p) => p.playerId === id);
  if (exists) {
    return {
      ok: true,
      next: {
        ...current,
        favoriteNbaPlayers: current.favoriteNbaPlayers.filter(
          (p) => p.playerId !== id
        ),
      },
    };
  }
  if (current.favoriteNbaPlayers.length >= NBA_FAVORITE_MAX_PLAYERS) {
    return { ok: false, reason: "max_players", next: current };
  }
  return {
    ok: true,
    next: {
      ...current,
      favoriteNbaPlayers: [...current.favoriteNbaPlayers, normalized],
    },
  };
}

export type ReplaceNbaFavoritePlayerResult =
  | { ok: true; next: NbaFavorites }
  | {
      ok: false;
      reason: "invalid" | "not_found" | "already_favorited";
      next: NbaFavorites;
    };

/**
 * 上限到達時: removePlayerId を外して addPlayer を入れる（原子的）。
 */
export function replaceNbaFavoritePlayer(
  current: NbaFavorites,
  removePlayerId: string,
  addPlayer: NbaFavoritePlayer
): ReplaceNbaFavoritePlayerResult {
  const removeId = String(removePlayerId).trim();
  if (!isValidNbaFavoritePlayerId(removeId)) {
    return { ok: false, reason: "invalid", next: current };
  }
  const normalized = normalizeFavoritePlayerInput(addPlayer);
  if (!normalized) {
    return { ok: false, reason: "invalid", next: current };
  }
  if (normalized.playerId === removeId) {
    return { ok: false, reason: "invalid", next: current };
  }
  if (
    current.favoriteNbaPlayers.some((p) => p.playerId === normalized.playerId)
  ) {
    return { ok: false, reason: "already_favorited", next: current };
  }
  if (!current.favoriteNbaPlayers.some((p) => p.playerId === removeId)) {
    return { ok: false, reason: "not_found", next: current };
  }
  return {
    ok: true,
    next: {
      ...current,
      favoriteNbaPlayers: [
        ...current.favoriteNbaPlayers.filter((p) => p.playerId !== removeId),
        normalized,
      ],
    },
  };
}

export function nbaFavoritesEqual(a: NbaFavorites, b: NbaFavorites): boolean {
  if (a.favoriteNbaTeamId !== b.favoriteNbaTeamId) return false;
  if (a.favoriteNbaTeamFanSinceSeason !== b.favoriteNbaTeamFanSinceSeason) {
    return false;
  }
  if (a.favoriteNbaPlayers.length !== b.favoriteNbaPlayers.length) return false;
  for (let i = 0; i < a.favoriteNbaPlayers.length; i++) {
    const x = a.favoriteNbaPlayers[i]!;
    const y = b.favoriteNbaPlayers[i]!;
    if (
      x.playerId !== y.playerId ||
      x.displayName !== y.displayName ||
      x.teamId !== y.teamId
    ) {
      return false;
    }
  }
  return true;
}
