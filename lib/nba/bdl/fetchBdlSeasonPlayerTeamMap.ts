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

/**
 * 1 シーズン分の box 行をページングし、playerId → 所属チームを返す。
 * `bdlNbaGetAllPages` の 50 ページ上限では足りないため専用ループ。
 */
export async function fetchBdlSeasonPlayerTeamMap(input: {
  seasonYear: number;
  seasonType?: "regular" | "playoffs";
}): Promise<Map<string, BdlPlayerTeamRef>> {
  const seasonType = input.seasonType === "playoffs" ? "playoffs" : "regular";
  const byPlayer = new Map<string, PlayerAccum>();
  let cursor: number | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const body = await bdlNbaGetJson<BdlListResponse<BdlStatRow>>(
      "/nba/v1/stats",
      {
        "seasons[]": input.seasonYear,
        season_type: seasonType,
        per_page: 100,
        ...(cursor != null ? { cursor } : {}),
      }
    );
    const chunk = Array.isArray(body.data) ? body.data : [];
    for (const row of chunk) {
      const pid = row.player?.id;
      if (pid == null) continue;
      if (parseMinutes(row.min) <= 0) continue;
      const abbr = String(row.team?.abbreviation ?? "")
        .trim()
        .toUpperCase();
      if (!abbr) continue;
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
    }
    const next = body.meta?.next_cursor;
    if (next == null || chunk.length === 0) break;
    cursor = next;
  }

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
