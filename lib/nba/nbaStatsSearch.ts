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
  /** 選手のみ（ロスター由来。リーダー表だけの選手には無い） */
  position?: string;
  jerseyNumber?: string;
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
        position: p.position?.trim() || undefined,
        jerseyNumber: p.jerseyNumber?.trim() || undefined,
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

/** NBA 30 チーム（静的な正式名から。リーグ表が空のオフでも引ける） */
export function listNbaStaticTeamSearchIndex(): NbaStatsSearchHit[] {
  return Object.entries(NBA_TEAM_NAME_BY_ID).map(([teamId, full]) => ({
    kind: "team" as const,
    id: teamId,
    name: getMobileTeamName("nba", full) || full,
    abbr: teamAbbr(teamId),
    teamId,
    matchText: full,
  }));
}

export type NbaMixedSearchRow = NbaStatsSearchHit & {
  /** 選手ヒットの所属として先頭に置いたチーム行（チーム名自体はクエリと一致しない） */
  viaPlayer?: boolean;
  /** チームヒットのロスターとして並べた選手行（選手名自体はクエリと一致しない） */
  viaTeam?: boolean;
};

/** チーム名ヒットがこの数以下ならロスター全員を展開する（1 文字入力で 30 チーム分並べない） */
const MAX_ROSTER_EXPAND_TEAMS = 2;
/** scoreMatch の「単語の先頭一致」以上 */
const ROSTER_EXPAND_MIN_SCORE = 70;

/**
 * 選手とチームをまとめて検索し、チームごとにまとめて返す（チーム行 → その下に選手行）。
 * - 選手は名前だけで照合（所属チーム名・略称では当てない）。所属チーム行を先頭に置き、同じチームの選手はまとめる。
 * - チーム名・略称で当たったチームは、その下にロスター全員を PPG 順で並べる。
 * - チームの並びは、そのチームで一番よく当たったヒットの順。
 * limit は直接ヒット数（差し込んだ所属チーム行・ロスター行は数えない）。
 */
export function searchNbaPlayersAndTeams(
  query: string,
  bundles?: Pick<NbaStatsSearchBundles, "player" | "rosters">,
  limit = 10
): NbaMixedSearchRow[] {
  const q = normalizeQuery(query);
  if (q.length < 1) return [];
  const teams = listNbaStaticTeamSearchIndex();
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const players = listNbaPlayerSearchIndex(bundles?.player, bundles?.rosters);
  const playerById = new Map(players.map((p) => [p.id, p]));

  const teamHits = teams
    .map((hit) => ({
      hit,
      score: scoreMatch(haystack(hit.name, hit.matchText, hit.abbr), q),
    }))
    .filter((r) => r.score > 0);
  const playerHits = players
    .map((hit) => ({ hit, score: scoreMatch(haystack(hit.name, hit.matchText), q) }))
    .filter((r) => r.score > 0);

  const ranked = [...teamHits, ...playerHits]
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.hit.kind === b.hit.kind ? 0 : a.hit.kind === "team" ? -1 : 1) ||
        a.hit.name.localeCompare(b.hit.name)
    )
    .slice(0, limit);

  /** 途中一致（Memphis の "phi" など）はロスターまで広げない */
  const expandTeamIds = new Set(
    teamHits.filter((r) => r.score >= ROSTER_EXPAND_MIN_SCORE).map((r) => r.hit.id)
  );
  const rosterIdsByTeam = new Map<string, string[]>();
  if (expandTeamIds.size <= MAX_ROSTER_EXPAND_TEAMS) {
    for (const team of Object.values(bundles?.rosters ?? {})) {
      if (!expandTeamIds.has(team.teamId)) continue;
      const ids = [...team.players]
        .sort((a, b) => (b.ppg ?? 0) - (a.ppg ?? 0))
        .map((p) => String(p.id ?? "").trim())
        .filter(Boolean);
      rosterIdsByTeam.set(team.teamId, ids);
    }
  }

  type Group = { team: NbaMixedSearchRow | null; players: NbaMixedSearchRow[] };
  const groups: Group[] = [];
  const groupByTeam = new Map<string, Group>();
  const shownPlayers = new Set<string>();
  const groupFor = (teamId: string | undefined, direct: boolean): Group => {
    const key = teamId ?? "";
    const existing = groupByTeam.get(key);
    if (existing) return existing;
    const team = teamId ? teamById.get(teamId) : undefined;
    const group: Group = { team: team ? (direct ? team : { ...team, viaPlayer: true }) : null, players: [] };
    groupByTeam.set(key, group);
    groups.push(group);
    return group;
  };

  for (const { hit } of ranked) {
    if (hit.kind === "team") {
      const group = groupFor(hit.id, true);
      if (group.team?.viaPlayer) group.team = hit;
      for (const id of rosterIdsByTeam.get(hit.id) ?? []) {
        const player = playerById.get(id);
        if (!player || shownPlayers.has(id)) continue;
        shownPlayers.add(id);
        group.players.push({ ...player, viaTeam: true });
      }
      continue;
    }
    if (shownPlayers.has(hit.id)) continue;
    shownPlayers.add(hit.id);
    groupFor(hit.teamId, false).players.push(hit);
  }

  const rows: NbaMixedSearchRow[] = [];
  for (const group of groups) {
    if (group.team) rows.push(group.team);
    rows.push(...group.players);
  }
  return rows;
}

export function searchNbaStatsIndex(
  query: string,
  kind: NbaStatsSearchKind,
  limit = 12,
  bundles?: NbaStatsSearchBundles
): NbaStatsSearchHit[] {
  const q = normalizeQuery(query);
  if (q.length < 1) return [];
  if (kind === "player") {
    // チーム名・略称（76ers / PHI）ならそのロスター全員。limit は名前ヒットだけに効く
    return searchNbaPlayersAndTeams(query, bundles, limit).filter(
      (row) => row.kind === "player"
    );
  }
  return listNbaTeamSearchIndex(bundles?.team)
    .map((hit) => {
      const hay = haystack(hit.name, hit.matchText, hit.abbr, hit.teamId, hit.id);
      return { hit, score: scoreMatch(hay, q) };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.hit.name.localeCompare(b.hit.name))
    .slice(0, limit)
    .map((r) => r.hit);
}
