/**
 * 試合一覧の「チームで絞り込み」用。
 * Firestore games の home / away（文字列 or { name, teamId }）と照合する。
 * URL は最大2チーム（区切りは | 。単一IDのみの旧URLも解釈する）。
 */

export type TeamNameById = Record<string, string>;

export const TEAM_FILTER_SEP = "|";

/** クエリ team= の値を最大2件のユニークIDにパース */
export function parseTeamFilterParam(
  param: string | null | undefined,
): string[] {
  if (!param?.trim()) return [];
  const raw = param.trim();
  if (raw.includes(TEAM_FILTER_SEP)) {
    return [
      ...new Set(
        raw
          .split(TEAM_FILTER_SEP)
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ].slice(0, 2);
  }
  return [raw];
}

/** 最大2件を | 結合。空なら null */
export function serializeTeamFilterParam(ids: string[]): string | null {
  const u = [...new Set(ids.filter(Boolean))].slice(0, 2);
  if (!u.length) return null;
  return u.join(TEAM_FILTER_SEP);
}

/** 選択チームがホームまたはアウェイに含まれる試合だけ true。teamId が null なら常に true */
export function gameInvolvesTeam(
  game: Record<string, unknown>,
  teamId: string | null,
  nameById: TeamNameById,
): boolean {
  if (!teamId) return true;
  const displayName = nameById[teamId];
  const sides = [game.home, game.away];
  for (const raw of sides) {
    if (raw == null) continue;
    if (typeof raw === "string") {
      if (displayName && raw === displayName) return true;
      continue;
    }
    if (typeof raw === "object") {
      const o = raw as { teamId?: string; name?: string };
      if (o.teamId === teamId) return true;
      if (displayName && o.name === displayName) return true;
    }
  }
  return false;
}

/** いずれかのチームが出る試合（最大2チームは OR） */
export function gameInvolvesAnyTeam(
  game: Record<string, unknown>,
  teamIds: string[],
  nameById: TeamNameById,
): boolean {
  if (!teamIds.length) return true;
  return teamIds.some((id) => gameInvolvesTeam(game, id, nameById));
}

/** クエリ team_mode= の値（2チーム選択時のみ意味がある） */
export type TeamFilterMatchMode = "any" | "h2h";

const TEAM_FILTER_MODE_H2H = "h2h";

/** team_mode クエリをパース。未指定・不正値は any */
export function parseTeamFilterMode(
  param: string | null | undefined,
): TeamFilterMatchMode {
  const v = param?.trim().toLowerCase();
  if (v === TEAM_FILTER_MODE_H2H) return "h2h";
  return "any";
}

/**
 * ちょうど2チームがともにこの1試合に出ている（＝通常は直接対決）。
 * teamIds が2件でない場合は常に true（呼び出し側で分岐すること）。
 */
export function gameIsHeadToHeadBetween(
  game: Record<string, unknown>,
  teamIds: string[],
  nameById: TeamNameById,
): boolean {
  if (teamIds.length !== 2) return true;
  const [a, b] = teamIds;
  return (
    gameInvolvesTeam(game, a, nameById) && gameInvolvesTeam(game, b, nameById)
  );
}
