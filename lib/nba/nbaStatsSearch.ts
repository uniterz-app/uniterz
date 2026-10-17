/**
 * STATS ハブ用: チーム / 選手の前方・部分一致検索。
 * 索引はリーグ表 / ロスター / リーダー表の共有スナップショットから切る（モックなし）。
 * 選手はロスター全員が正（リーダー表は各指標 Top30 のみで、出場の少ない選手が漏れる）。
 */
import { TEAM_SHORT } from "@/lib/team-short";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { getMobileTeamName } from "@/lib/team-name-split-mobile";
import { formatNbaPlayerListName } from "@/lib/nba/formatNbaPlayerListName";
import type { NbaLeagueTeamStatsBundle } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaPlayerStatLeadersBundle } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import type { NbaTeamRosterDocTeam } from "@/lib/nba/teamRosters/teamRosterTypes";

export type NbaStatsSearchKind = "team" | "player";

export type NbaStatsSearchHit = {
  kind: NbaStatsSearchKind;
  id: string;
  name: string;
  abbr: string;
  teamId?: string;
  /** 表示短縮前の氏名など、検索用に残す */
  matchText?: string;
};

export type NbaStatsSearchBundles = {
  team?: NbaLeagueTeamStatsBundle;
  player?: NbaPlayerStatLeadersBundle;
  rosters?: Record<string, NbaTeamRosterDocTeam>;
};

const EMPTY_TEAM_BUNDLE: NbaLeagueTeamStatsBundle = {
  season: [],
  playoffs: [],
  last10: [],
  asOfLabel: "UNAVAILABLE",
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
  bundle: NbaLeagueTeamStatsBundle = EMPTY_TEAM_BUNDLE
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

function teamAbbr(teamId: string): string {
  return (TEAM_SHORT[teamId] ?? teamId.replace(/^nba-/i, "")).toUpperCase();
}

export function listNbaPlayerSearchIndex(
  leaders?: NbaPlayerStatLeadersBundle | null,
  rosters?: Record<string, NbaTeamRosterDocTeam> | null
): NbaStatsSearchHit[] {
  const seen = new Map<string, NbaStatsSearchHit>();

  for (const team of Object.values(rosters ?? {})) {
    for (const p of team.players) {
      const id = String(p.id ?? "").trim();
      const fullName = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
      if (!id || !fullName || seen.has(id)) continue;
      seen.set(id, {
        kind: "player",
        id,
        name: formatNbaPlayerListName(fullName, id),
        abbr: teamAbbr(team.teamId),
        teamId: team.teamId,
        matchText: fullName,
      });
    }
  }

  if (!leaders) return [...seen.values()];

  for (const rows of Object.values(leaders.season)) {
    for (const row of rows) {
      if (seen.has(row.playerId)) continue;
      seen.set(row.playerId, {
        kind: "player",
        id: row.playerId,
        name: formatNbaPlayerListName(row.playerName, row.playerId),
        abbr: teamAbbr(row.teamId),
        teamId: row.teamId,
        matchText: row.playerName,
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
      : listNbaPlayerSearchIndex(bundles?.player, bundles?.rosters);
  return source
    .map((hit) => {
      const hay = haystack(hit.name, hit.matchText, hit.abbr, hit.teamId, hit.id);
      return { hit, score: scoreMatch(hay, q) };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.hit.name.localeCompare(b.hit.name))
    .slice(0, limit)
    .map((r) => r.hit);
}
