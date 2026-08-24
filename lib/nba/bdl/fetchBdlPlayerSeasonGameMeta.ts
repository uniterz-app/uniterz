/**
 * BDL `/nba/v1/stats` から 1 選手・1 シーズンの所属チームと GS を推定。
 * - TEAM: 出場試合数が最多の abbreviation
 * - GS: 同試合・同チームで出場分が上位 5 ならスターター
 *   （BDL season averages に GS が無いための推定）
 */
import {
  bdlNbaGetAllPages,
  bdlNbaGetJson,
  type BdlListResponse,
} from "@/lib/nba/bdl/bdlNbaFetch";
import {
  appTeamIdFromBdlAbbreviation,
  rememberBdlTeamId,
} from "@/lib/nba/bdl/bdlNbaTeamIdMap";

export type BdlPlayerSeasonGameMeta = {
  teamId: string | null;
  teamAbbr: string | null;
  /** null = 推定不能（UI は "—"） */
  gamesStarted: number | null;
  gamesLogged: number;
};

type BdlStatRow = {
  min?: string | number | null;
  player?: { id?: number } | null;
  team?: {
    id?: number;
    abbreviation?: string | null;
  } | null;
  game?: { id?: number } | null;
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

async function fetchPlayerSeasonStatRows(input: {
  bdlPlayerId: number;
  seasonYear: number;
  seasonType: "regular" | "playoffs";
}): Promise<BdlStatRow[]> {
  return bdlNbaGetAllPages<BdlStatRow>("/nba/v1/stats", {
    "player_ids[]": input.bdlPlayerId,
    "seasons[]": input.seasonYear,
    season_type: input.seasonType === "playoffs" ? "playoffs" : "regular",
  });
}

function primaryTeamFromRows(rows: BdlStatRow[]): {
  teamId: string | null;
  teamAbbr: string | null;
} {
  const counts = new Map<
    string,
    { abbr: string; bdlTeamId: number | null; n: number }
  >();
  for (const row of rows) {
    const abbr = String(row.team?.abbreviation ?? "")
      .trim()
      .toUpperCase();
    if (!abbr) continue;
    const bdlTeamId = typeof row.team?.id === "number" ? row.team.id : null;
    const prev = counts.get(abbr);
    if (prev) prev.n += 1;
    else counts.set(abbr, { abbr, bdlTeamId, n: 1 });
  }
  let best: { abbr: string; bdlTeamId: number | null; n: number } | null =
    null;
  for (const v of counts.values()) {
    if (!best || v.n > best.n) best = v;
  }
  if (!best) return { teamId: null, teamAbbr: null };
  const fromNumeric =
    best.bdlTeamId != null
      ? rememberBdlTeamId(best.bdlTeamId, best.abbr)
      : null;
  const teamId =
    fromNumeric ?? appTeamIdFromBdlAbbreviation(best.abbr) ?? null;
  return { teamId, teamAbbr: best.abbr };
}

async function fetchStatsForGameIds(gameIds: number[]): Promise<BdlStatRow[]> {
  if (gameIds.length === 0) return [];
  const out: BdlStatRow[] = [];
  let cursor: number | undefined;
  for (let guard = 0; guard < 8; guard += 1) {
    const res = await bdlNbaGetJson<BdlListResponse<BdlStatRow>>(
      "/nba/v1/stats",
      {
        "game_ids[]": gameIds,
        per_page: 100,
        ...(cursor != null ? { cursor } : {}),
      }
    );
    const chunk = Array.isArray(res.data) ? res.data : [];
    out.push(...chunk);
    const next = res.meta?.next_cursor;
    if (next == null || chunk.length === 0) break;
    cursor = next;
  }
  return out;
}

/**
 * 同試合・同チームで出場分上位 5 人をスターターとみなす。
 */
async function countStartsFromGameMinutes(
  playerRows: BdlStatRow[]
): Promise<number | null> {
  const byGame = new Map<number, { teamAbbr: string; playerMin: number }>();
  for (const row of playerRows) {
    const gid = row.game?.id;
    const abbr = String(row.team?.abbreviation ?? "")
      .trim()
      .toUpperCase();
    if (typeof gid !== "number" || !abbr) continue;
    const mins = parseMinutes(row.min);
    if (mins <= 0) continue;
    byGame.set(gid, { teamAbbr: abbr, playerMin: mins });
  }
  const gameIds = [...byGame.keys()];
  if (gameIds.length === 0) return null;

  const teamMinutesByGame = new Map<number, Map<string, number[]>>();
  const chunkSize = 15;
  let fetchedAny = false;
  for (let i = 0; i < gameIds.length; i += chunkSize) {
    const slice = gameIds.slice(i, i + chunkSize);
    try {
      const rows = await fetchStatsForGameIds(slice);
      if (rows.length > 0) fetchedAny = true;
      for (const row of rows) {
        const gid = row.game?.id;
        const abbr = String(row.team?.abbreviation ?? "")
          .trim()
          .toUpperCase();
        if (typeof gid !== "number" || !abbr) continue;
        const mins = parseMinutes(row.min);
        if (mins <= 0) continue;
        let teamMap = teamMinutesByGame.get(gid);
        if (!teamMap) {
          teamMap = new Map();
          teamMinutesByGame.set(gid, teamMap);
        }
        const list = teamMap.get(abbr) ?? [];
        list.push(mins);
        teamMap.set(abbr, list);
      }
    } catch {
      // チャンク失敗はスキップ
    }
  }
  if (!fetchedAny) return null;

  let starts = 0;
  let judged = 0;
  for (const [gid, me] of byGame) {
    const minsList = teamMinutesByGame.get(gid)?.get(me.teamAbbr);
    if (!minsList || minsList.length < 5) continue;
    const sorted = [...minsList].sort((a, b) => b - a);
    const fifth = sorted[4] ?? 0;
    if (me.playerMin + 1e-6 >= fifth) starts += 1;
    judged += 1;
  }
  if (judged === 0) return null;
  return starts;
}

export async function fetchBdlPlayerSeasonGameMeta(input: {
  bdlPlayerId: number;
  seasonYear: number;
  seasonType: "regular" | "playoffs";
  /** false なら TEAM のみ（軽い）。default true */
  estimateGamesStarted?: boolean;
}): Promise<BdlPlayerSeasonGameMeta> {
  const rows = await fetchPlayerSeasonStatRows(input);
  const played = rows.filter((r) => parseMinutes(r.min) > 0);
  const { teamId, teamAbbr } = primaryTeamFromRows(played);
  let gamesStarted: number | null = null;
  if (input.estimateGamesStarted !== false && played.length > 0) {
    try {
      gamesStarted = await countStartsFromGameMinutes(played);
    } catch {
      gamesStarted = null;
    }
  }
  return {
    teamId,
    teamAbbr,
    gamesStarted,
    gamesLogged: played.length,
  };
}
