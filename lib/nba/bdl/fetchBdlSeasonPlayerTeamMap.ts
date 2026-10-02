/**
 * BDL `/nba/v1/stats` からシーズン所属チームを推定。
 *
 * leaders / players の `player.team_id` は「現在所属」を返すことがあるため使わない。
 * 行の `team`（その試合のチーム）で出場分を数え、最多を所属とする。
 */
import {
  bdlNbaGetJson,
  type BdlListResponse,
} from "@/lib/nba/bdl/bdlNbaFetch";
import type { BdlPlayerTeamRef } from "@/lib/nba/bdl/fetchBdlActivePlayers";
import {
  appTeamIdFromBdlAbbreviation,
  rememberBdlTeamId,
} from "@/lib/nba/bdl/bdlNbaTeamIdMap";

type BdlStatRow = {
  min?: string | number | null;
  player?: {
    id?: number;
    first_name?: string;
    last_name?: string;
  } | null;
  team?: {
    id?: number;
    abbreviation?: string | null;
  } | null;
  game?: {
    id?: number;
    date?: string | null;
  } | null;
};

function parseMinutes(raw: string | number | null | undefined): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const s = String(raw ?? "").trim();
  if (!s || s === "00" || s === "0" || s === "0:00") return 0;
  if (s.includes(":")) {
    const [m, sec] = s.split(":");
    const mm = Number(m);
    const ss = Number(sec);
    if (!Number.isFinite(mm)) return 0;
    return mm + (Number.isFinite(ss) ? ss / 60 : 0);
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

type TeamTally = {
  abbr: string;
  bdlTeamId: number | null;
  games: number;
};

type PlayerAccum = {
  first: string;
  last: string;
  byAbbr: Map<string, TeamTally>;
};

const MAX_PAGES = 450;

/** `bdlNbaGetAllPages` の 50 ページ上限では足りないため専用ループ。 */
async function forEachBdlSeasonStatRow(
  seasonYear: number,
  seasonType: "regular" | "playoffs",
  onRow: (row: BdlStatRow) => void
): Promise<void> {
  let cursor: number | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const body = await bdlNbaGetJson<BdlListResponse<BdlStatRow>>(
      "/nba/v1/stats",
      {
        "seasons[]": seasonYear,
        season_type: seasonType,
        per_page: 100,
        ...(cursor != null ? { cursor } : {}),
      }
    );
    const chunk = Array.isArray(body.data) ? body.data : [];
    for (const row of chunk) onRow(row);
    const next = body.meta?.next_cursor;
    if (next == null || chunk.length === 0) break;
    cursor = next;
  }
}

function resolveRowTeamId(row: BdlStatRow): {
  teamId: string;
  bdlTeamId: number | null;
} | null {
  const abbr = String(row.team?.abbreviation ?? "")
    .trim()
    .toUpperCase();
  if (!abbr) return null;
  const bdlTeamId = typeof row.team?.id === "number" ? row.team.id : null;
  const teamId =
    (bdlTeamId != null ? rememberBdlTeamId(bdlTeamId, abbr) : null) ??
    appTeamIdFromBdlAbbreviation(abbr);
  return teamId ? { teamId, bdlTeamId } : null;
}

export type BdlSeasonFinalPlayerTeam = {
  playerId: string;
  firstName: string;
  lastName: string;
  teamId: string;
  /** YYYY-MM-DD（BDL game.date 先頭 10 文字） */
  lastGameDate: string | null;
};

/**
 * シーズン最終所属（レギュラー + プレーオフで最後に box に載ったチーム）。
 * DNP 行も含める（シーズン末に故障で出ていない選手も最終ロスターとして拾う）。
 */
export async function fetchBdlSeasonFinalPlayerTeamMap(input: {
  seasonYear: number;
}): Promise<Map<string, BdlSeasonFinalPlayerTeam>> {
  type Last = BdlSeasonFinalPlayerTeam & { sortKey: string };
  const byPlayer = new Map<string, Last>();

  const onRow = (row: BdlStatRow) => {
    const pid = row.player?.id;
    if (pid == null) return;
    const team = resolveRowTeamId(row);
    if (!team) return;
    const date = String(row.game?.date ?? "").slice(0, 10);
    const gameId = typeof row.game?.id === "number" ? row.game.id : 0;
    const sortKey = `${date || "0000-00-00"}#${String(gameId).padStart(12, "0")}`;
    const playerId = String(pid);
    const prev = byPlayer.get(playerId);
    if (prev && prev.sortKey >= sortKey) return;
    byPlayer.set(playerId, {
      playerId,
      firstName: row.player?.first_name?.trim() || prev?.firstName || "",
      lastName: row.player?.last_name?.trim() || prev?.lastName || "",
      teamId: team.teamId,
      lastGameDate: date || null,
      sortKey,
    });
  };

  await forEachBdlSeasonStatRow(input.seasonYear, "regular", onRow);
  await forEachBdlSeasonStatRow(input.seasonYear, "playoffs", onRow);

  const out = new Map<string, BdlSeasonFinalPlayerTeam>();
  for (const [id, { sortKey: _sortKey, ...rest }] of byPlayer) {
    out.set(id, rest);
  }
  return out;
}

/**
 * 1 シーズン分の box 行をページングし、playerId → 所属チームを返す。
 */
export async function fetchBdlSeasonPlayerTeamMap(input: {
  seasonYear: number;
  seasonType?: "regular" | "playoffs";
}): Promise<Map<string, BdlPlayerTeamRef>> {
  const seasonType = input.seasonType === "playoffs" ? "playoffs" : "regular";
  const byPlayer = new Map<string, PlayerAccum>();

  await forEachBdlSeasonStatRow(input.seasonYear, seasonType, (row) => {
    const pid = row.player?.id;
    if (pid == null) return;
    if (parseMinutes(row.min) <= 0) return;
    const abbr = String(row.team?.abbreviation ?? "")
      .trim()
      .toUpperCase();
    if (!abbr) return;
    const playerId = String(pid);
    let accum = byPlayer.get(playerId);
    if (!accum) {
      accum = {
        first: row.player?.first_name?.trim() ?? "",
        last: row.player?.last_name?.trim() ?? "",
        byAbbr: new Map(),
      };
      byPlayer.set(playerId, accum);
    } else {
      if (!accum.first && row.player?.first_name) {
        accum.first = row.player.first_name.trim();
      }
      if (!accum.last && row.player?.last_name) {
        accum.last = row.player.last_name.trim();
      }
    }
    const bdlTeamId = typeof row.team?.id === "number" ? row.team.id : null;
    const prev = accum.byAbbr.get(abbr);
    if (prev) {
      prev.games += 1;
      if (prev.bdlTeamId == null && bdlTeamId != null) {
        prev.bdlTeamId = bdlTeamId;
      }
    } else {
      accum.byAbbr.set(abbr, { abbr, bdlTeamId, games: 1 });
    }
  });

  const out = new Map<string, BdlPlayerTeamRef>();
  for (const [playerId, accum] of byPlayer) {
    let best: TeamTally | null = null;
    for (const t of accum.byAbbr.values()) {
      if (!best || t.games > best.games) best = t;
    }
    if (!best) continue;
    const teamId =
      (best.bdlTeamId != null
        ? rememberBdlTeamId(best.bdlTeamId, best.abbr)
        : null) ?? appTeamIdFromBdlAbbreviation(best.abbr);
    if (!teamId) continue;
    const playerName =
      `${accum.first} ${accum.last}`.trim() || `Player ${playerId}`;
    out.set(playerId, {
      playerId,
      playerName,
      teamId,
      bdlTeamId: best.bdlTeamId,
    });
  }
  return out;
}
