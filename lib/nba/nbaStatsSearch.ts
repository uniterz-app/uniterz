/**
 * STATS ハブ用: チーム / 選手の前方・部分一致検索。
 * 索引はリーグ表 / リーダー表の共有スナップショットから切る。
 */
import { TEAM_SHORT } from "@/lib/team-short";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { getMobileTeamName } from "@/lib/team-name-split-mobile";
import {
  getNbaLeagueTeamStatsMock,
  type NbaLeagueTeamStatsBundle,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";
import {
  NBA_BDL_PLAYER_LEADER_STAT_TYPES,
  getNbaPlayerStatLeadersMock,
  type NbaPlayerStatLeadersBundle,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import {
  getNbaPlayerDetailPreview,
  listNbaPlayerDetailPreviewSeeds,
} from "@/lib/predict/nbaPlayerDetailPreviewMocks";

export type NbaStatsSearchKind = "team" | "player";

export type NbaStatsSearchHit = {
  kind: NbaStatsSearchKind;
  id: string;
  name: string;
  abbr: string;
  teamId?: string;
};

export type NbaStatsSearchBundles = {
  team?: NbaLeagueTeamStatsBundle;
  player?: NbaPlayerStatLeadersBundle;
};

function normalizeQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function haystack(...parts: Array<string | null | undefined>): string {
  return parts
    .filter(Boolean)
    .map((p) => normalizeQuery(String(p)))
    .join(" ");
}

function scoreMatch(hay: string, q: string): number {
  if (!q) return 0;
  if (hay === q) return 100;
  if (hay.startsWith(q)) return 80;
  const tokens = hay.split(/\s+/);
  if (tokens.some((t) => t.startsWith(q))) return 70;
  if (hay.includes(q)) return 40;
  return 0;
}

export function listNbaTeamSearchIndex(
  bundle: NbaLeagueTeamStatsBundle = getNbaLeagueTeamStatsMock()
): NbaStatsSearchHit[] {
  return bundle.season.map((row) => {
    const nick = getMobileTeamName("nba", row.teamName);
    const abbr = TEAM_SHORT[row.teamId] ?? row.teamId.replace(/^nba-/i, "");
    const full = NBA_TEAM_NAME_BY_ID[row.teamId] ?? row.teamName;
    return {
      kind: "team" as const,
      id: row.teamId,
      name: nick || full,
      abbr: abbr.toUpperCase(),
    };
  });
}

export function listNbaPlayerSearchIndex(
  leaders: NbaPlayerStatLeadersBundle = getNbaPlayerStatLeadersMock()
): NbaStatsSearchHit[] {
  const seen = new Map<string, NbaStatsSearchHit>();

  for (const seed of listNbaPlayerDetailPreviewSeeds()) {
    const detail = getNbaPlayerDetailPreview(seed.playerId);
    const abbr = TEAM_SHORT[detail.teamId] ?? detail.teamAbbr;
    seen.set(seed.playerId, {
      kind: "player",
      id: seed.playerId,
      name: `${detail.firstName} ${detail.lastName}`,
      abbr: abbr.toUpperCase(),
      teamId: detail.teamId,
    });
  }

  for (const statType of NBA_BDL_PLAYER_LEADER_STAT_TYPES) {
    for (const row of leaders.season[statType] ?? []) {
      if (seen.has(row.playerId)) continue;
      seen.set(row.playerId, {
        kind: "player",
        id: row.playerId,
        name: row.playerName,
        abbr: (
          TEAM_SHORT[row.teamId] ?? row.teamId.replace(/^nba-/i, "")
        ).toUpperCase(),
        teamId: row.teamId,
      });
    }
  }

  return [...seen.values()];
}

export function searchNbaStatsIndex(
  query: string,
  kind: NbaStatsSearchKind,
  limit = 12,
  bundles?: NbaStatsSearchBundles
): NbaStatsSearchHit[] {
  const q = normalizeQuery(query);
  if (q.length < 1) return [];
  const source =
    kind === "team"
      ? listNbaTeamSearchIndex(bundles?.team)
      : listNbaPlayerSearchIndex(bundles?.player);
  return source
    .map((hit) => {
      const hay = haystack(hit.name, hit.abbr, hit.teamId, hit.id);
      return { hit, score: scoreMatch(hay, q) };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.hit.name.localeCompare(b.hit.name))
    .slice(0, limit)
    .map((r) => r.hit);
}
