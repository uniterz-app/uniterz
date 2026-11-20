/**
 * Buzz / 確定トレードのチーム絞り。
 * 所属略称に加え、本文に出た行き先（Suns / PHX / サンズ）も拾う。
 */
import { nbaTeamIdFromBracketCode } from "@/lib/nba-bracket-code";
import { nbaAskTeamJaName } from "@/lib/nba/ask/nbaAskTeamNames";
import { getNbaTeamNicknameById } from "@/lib/nba-team-names";
import { TEAM_SHORT } from "@/lib/team-short";
import type { NbaTradeBuzzItem } from "@/lib/predict/nbaTradeBuzz";
import type { NbaConfirmedTrade } from "@/lib/predict/nbaTradeConfirmed";

const EXTRA_NEEDLES: Record<string, readonly string[]> = {
  "nba-76ers": ["Sixers", "76ers"],
  "nba-cavaliers": ["Cavs"],
  "nba-mavericks": ["Mavs"],
  "nba-timberwolves": ["Wolves", "T-Wolves"],
  "nba-blazers": ["Blazers", "Trail Blazers"],
  "nba-pelicans": ["Pels"],
};

function escapeRe(raw: string): string {
  return raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textHasNeedle(haystack: string, needle: string): boolean {
  const n = needle.trim();
  if (!n) return false;
  if (/^[A-Za-z0-9]/.test(n)) {
    return new RegExp(
      `(^|[^A-Za-z0-9])${escapeRe(n)}([^A-Za-z0-9]|$)`,
      "i"
    ).test(haystack);
  }
  return haystack.includes(n);
}

function abbrOfTeamId(teamId: string): string | null {
  const abbr = TEAM_SHORT[teamId];
  return abbr ? abbr.toUpperCase() : null;
}

function needlesForTeamId(teamId: string): string[] {
  const abbr = abbrOfTeamId(teamId);
  const nick = getNbaTeamNicknameById(teamId);
  const ja = nbaAskTeamJaName(teamId);
  return [abbr, nick, ja, ...(EXTRA_NEEDLES[teamId] ?? [])].filter(
    (v, i, all): v is string => Boolean(v) && all.indexOf(v) === i
  );
}

let nbaTeamIds: string[] | null = null;
function nbaIds(): string[] {
  if (!nbaTeamIds) {
    nbaTeamIds = Object.keys(TEAM_SHORT).filter((id) => id.startsWith("nba-"));
  }
  return nbaTeamIds;
}

function abbrsMentionedInText(text: string): string[] {
  if (!text) return [];
  const out: string[] = [];
  for (const teamId of nbaIds()) {
    const needles = needlesForTeamId(teamId);
    if (!needles.some((n) => textHasNeedle(text, n))) continue;
    const abbr = abbrOfTeamId(teamId);
    if (abbr) out.push(abbr);
  }
  return out;
}

function addAbbr(into: Set<string>, raw: string | null | undefined): void {
  const id = nbaTeamIdFromBracketCode(raw);
  const abbr = id ? abbrOfTeamId(id) : null;
  if (abbr) into.add(abbr);
}

export function nbaTradeBuzzItemTeamAbbrs(item: NbaTradeBuzzItem): string[] {
  const set = new Set<string>();
  addAbbr(set, item.fromTeamAbbr);
  const blob = [item.headlineJa, ...item.events.map((e) => e.textJa)]
    .filter(Boolean)
    .join("\n");
  for (const abbr of abbrsMentionedInText(blob)) set.add(abbr);
  return [...set];
}

export function nbaConfirmedTradeTeamAbbrs(trade: NbaConfirmedTrade): string[] {
  const set = new Set<string>();
  addAbbr(set, trade.fromTeamAbbr);
  addAbbr(set, trade.toTeamAbbr);
  for (const abbr of abbrsMentionedInText(trade.summaryJa)) set.add(abbr);
  return [...set];
}

export function nbaTradeBuzzItemMatchesTeam(
  item: NbaTradeBuzzItem,
  abbr: string | null
): boolean {
  if (!abbr) return true;
  return nbaTradeBuzzItemTeamAbbrs(item).includes(abbr.toUpperCase());
}

export function nbaConfirmedTradeMatchesTeam(
  trade: NbaConfirmedTrade,
  abbr: string | null
): boolean {
  if (!abbr) return true;
  return nbaConfirmedTradeTeamAbbrs(trade).includes(abbr.toUpperCase());
}

export function uniqueNbaTeamAbbrs(
  groups: readonly (readonly string[])[]
): string[] {
  const set = new Set<string>();
  for (const group of groups) {
    for (const abbr of group) {
      if (nbaTeamIdFromBracketCode(abbr)) set.add(abbr.toUpperCase());
    }
  }
  return [...set];
}

export function sortNbaTeamFilterAbbrs(
  abbrs: readonly string[],
  favoriteAbbr: string | null
): string[] {
  const fav = favoriteAbbr?.toUpperCase() ?? "";
  return [...abbrs].sort((a, b) => {
    if (a === fav) return -1;
    if (b === fav) return 1;
    return a.localeCompare(b);
  });
}

export function nbaFavoriteTeamAbbr(teamId: string | null | undefined): string | null {
  if (!teamId) return null;
  return abbrOfTeamId(teamId);
}
