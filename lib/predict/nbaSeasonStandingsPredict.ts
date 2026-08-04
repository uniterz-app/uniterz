/**
 * NBA シーズン順位予想 — 型とピッカーロジック（本番 Firestore 接続前）
 *
 * ルール:
 * - East / West それぞれ 1〜15 位にチームを配置
 * - 同一カンファレンス内でチームは 1 回のみ
 * - シーズン終了後に公式順位と照合して点数化（採点ルールはプレビューで仮）
 */

import {
  isNbaConferenceTeam,
  NBA_CONFERENCE_TEAM_IDS,
  NBA_STANDINGS_RANKS,
  type NbaConferenceId,
} from "@/lib/nba/nbaConferenceTeams";

export type NbaStandingsRank = number; // 1..15

/** rank (1-based) → teamId。未設定はキーなし or null */
export type NbaConferenceStandingsPicks = Partial<
  Record<NbaStandingsRank, string | null>
>;

export type NbaSeasonStandingsPrediction = {
  season: string;
  east: NbaConferenceStandingsPicks;
  west: NbaConferenceStandingsPicks;
};

export function emptyConferencePicks(): NbaConferenceStandingsPicks {
  return {};
}

export function emptySeasonStandingsPrediction(
  season: string
): NbaSeasonStandingsPrediction {
  return {
    season,
    east: emptyConferencePicks(),
    west: emptyConferencePicks(),
  };
}

export function conferenceTeamPool(conference: NbaConferenceId): readonly string[] {
  return NBA_CONFERENCE_TEAM_IDS[conference];
}

export function usedTeamIds(
  picks: NbaConferenceStandingsPicks
): Set<string> {
  const used = new Set<string>();
  for (let r = 1; r <= NBA_STANDINGS_RANKS; r += 1) {
    const id = picks[r];
    if (id) used.add(id);
  }
  return used;
}

export function availableTeamIds(
  conference: NbaConferenceId,
  picks: NbaConferenceStandingsPicks
): string[] {
  const used = usedTeamIds(picks);
  return conferenceTeamPool(conference).filter((id) => !used.has(id));
}

export function filledRankCount(picks: NbaConferenceStandingsPicks): number {
  let n = 0;
  for (let r = 1; r <= NBA_STANDINGS_RANKS; r += 1) {
    if (picks[r]) n += 1;
  }
  return n;
}

export function isConferenceComplete(
  picks: NbaConferenceStandingsPicks
): boolean {
  return filledRankCount(picks) === NBA_STANDINGS_RANKS;
}

export function isSeasonStandingsComplete(
  pred: NbaSeasonStandingsPrediction
): boolean {
  return isConferenceComplete(pred.east) && isConferenceComplete(pred.west);
}

function parseConferencePicks(raw: unknown): NbaConferenceStandingsPicks {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const src = raw as Record<string, unknown>;
  const out: NbaConferenceStandingsPicks = {};
  for (let r = 1; r <= NBA_STANDINGS_RANKS; r += 1) {
    const v = src[String(r)] ?? src[r as unknown as string];
    if (v == null) continue;
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (trimmed) out[r] = trimmed;
  }
  return out;
}

/** API / Firestore から来た予測を正規化 */
export function parseSeasonStandingsPrediction(
  season: string,
  raw: unknown
): NbaSeasonStandingsPrediction {
  const base = emptySeasonStandingsPrediction(season.trim());
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;
  return {
    season: season.trim(),
    east: parseConferencePicks(o.east),
    west: parseConferencePicks(o.west),
  };
}

/**
 * 完全提出の検証（カンファ別チーム・重複なし）。
 */
export function validateSeasonStandingsForSubmit(
  pred: NbaSeasonStandingsPrediction
): { ok: true } | { ok: false; error: string } {
  const season = pred.season.trim();
  if (!season || season.length > 32 || season.includes("/")) {
    return { ok: false, error: "invalid_season" };
  }
  if (!isSeasonStandingsComplete(pred)) {
    return { ok: false, error: "incomplete_picks" };
  }
  for (const conf of ["east", "west"] as const) {
    const picks = pred[conf];
    const seen = new Set<string>();
    for (let r = 1; r <= NBA_STANDINGS_RANKS; r += 1) {
      const id = picks[r];
      if (typeof id !== "string" || !id) {
        return { ok: false, error: "incomplete_picks" };
      }
      if (!isNbaConferenceTeam(conf, id)) {
        return { ok: false, error: `wrong_conference:${conf}:${r}` };
      }
      if (seen.has(id)) {
        return { ok: false, error: `duplicate_team:${conf}` };
      }
      seen.add(id);
    }
  }
  return { ok: true };
}

export function firstEmptyRank(
  picks: NbaConferenceStandingsPicks
): NbaStandingsRank | null {
  for (let r = 1; r <= NBA_STANDINGS_RANKS; r += 1) {
    if (!picks[r]) return r;
  }
  return null;
}

export type AssignStandingsResult =
  | { ok: true; picks: NbaConferenceStandingsPicks }
  | { ok: false; reason: "invalid_rank" | "wrong_conference" | "already_used" };

/**
 * `rank` に `teamId` を入れる。同じチームが他ランクにあればそこをクリアして移動。
 */
export function assignTeamToRank(
  conference: NbaConferenceId,
  picks: NbaConferenceStandingsPicks,
  rank: NbaStandingsRank,
  teamId: string
): AssignStandingsResult {
  if (rank < 1 || rank > NBA_STANDINGS_RANKS || !Number.isInteger(rank)) {
    return { ok: false, reason: "invalid_rank" };
  }
  if (!isNbaConferenceTeam(conference, teamId)) {
    return { ok: false, reason: "wrong_conference" };
  }

  const next: NbaConferenceStandingsPicks = { ...picks };
  for (let r = 1; r <= NBA_STANDINGS_RANKS; r += 1) {
    if (next[r] === teamId) next[r] = null;
  }
  next[rank] = teamId;
  return { ok: true, picks: next };
}

export function clearRank(
  picks: NbaConferenceStandingsPicks,
  rank: NbaStandingsRank
): NbaConferenceStandingsPicks {
  const next = { ...picks };
  next[rank] = null;
  return next;
}

/** プレビュー用・仮採点（本番確定前） */
export const SEASON_STANDINGS_SCORE_PREVIEW = {
  exact: 10,
  within1: 4,
  within2: 2,
  playoffCutoffBonus: 3, // 1–8 帯の境界を正しく読んだ場合など（案）
  maxPerConference: 15 * 10,
  maxTotal: 15 * 10 * 2,
} as const;
