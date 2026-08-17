/**
 * NBA 試合ごとの最多得点者予想。
 * 的中で +2（WC 得点者ボーナスと同点）。同点トップは全員ヒット対象。
 */

export type NbaTopScorerPick = {
  playerId: string;
  teamId: string;
  /** 表示用。投稿時に候補名をコピー（古い投稿は欠ける） */
  name?: string | null;
};

export type NbaTopScorerCandidate = NbaTopScorerPick & {
  name: string;
  /** シーズン平均得点（PPG）。UI は高い順に並べる */
  ppg?: number | null;
  position?: string | null;
  jerseyNumber?: string | null;
};

export type NbaLeadingScorer = NbaTopScorerPick & {
  points: number;
  name?: string | null;
};

export const NBA_TOP_SCORER_BONUS_POINTS = 2;

export function normalizeNbaTopScorerPick(
  raw: unknown
): NbaTopScorerPick | null {
  if (!raw || typeof raw !== "object") return null;
  const playerId = String((raw as NbaTopScorerPick).playerId ?? "").trim();
  const teamId = String((raw as NbaTopScorerPick).teamId ?? "").trim();
  if (!playerId || !teamId) return null;
  const nameRaw = (raw as NbaTopScorerPick).name;
  const name =
    nameRaw == null || String(nameRaw).trim() === ""
      ? null
      : String(nameRaw).trim();
  return name ? { playerId, teamId, name } : { playerId, teamId };
}

export function normalizeNbaTopScorerCandidates(
  raw: unknown
): NbaTopScorerCandidate[] {
  if (!Array.isArray(raw)) return [];
  const out: NbaTopScorerCandidate[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const pick = normalizeNbaTopScorerPick(row);
    if (!pick) continue;
    const name = String((row as NbaTopScorerCandidate).name ?? "").trim();
    if (!name) continue;
    const positionRaw = (row as NbaTopScorerCandidate).position;
    const jerseyRaw = (row as NbaTopScorerCandidate).jerseyNumber;
    const ppgRaw = Number((row as NbaTopScorerCandidate).ppg);
    out.push({
      ...pick,
      name,
      ppg: Number.isFinite(ppgRaw) ? ppgRaw : null,
      position:
        positionRaw == null || positionRaw === ""
          ? null
          : String(positionRaw),
      jerseyNumber:
        jerseyRaw == null || jerseyRaw === "" ? null : String(jerseyRaw),
    });
  }
  return out;
}

/** 平均得点が高い順。同点は名前順 */
export function sortNbaTopScorerCandidatesByPpg(
  candidates: NbaTopScorerCandidate[]
): NbaTopScorerCandidate[] {
  return [...candidates].sort((a, b) => {
    const ap = a.ppg ?? -1;
    const bp = b.ppg ?? -1;
    if (bp !== ap) return bp - ap;
    return a.name.localeCompare(b.name);
  });
}

export function normalizeNbaLeadingScorers(raw: unknown): NbaLeadingScorer[] {
  if (!Array.isArray(raw)) return [];
  const parsed: NbaLeadingScorer[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const pick = normalizeNbaTopScorerPick(row);
    if (!pick) continue;
    const points = Number((row as NbaLeadingScorer).points);
    if (!Number.isFinite(points) || points < 0) continue;
    const nameRaw = (row as NbaLeadingScorer).name;
    parsed.push({
      ...pick,
      points,
      name: nameRaw == null || nameRaw === "" ? null : String(nameRaw),
    });
  }
  if (parsed.length === 0) return [];
  const maxPts = Math.max(...parsed.map((p) => p.points));
  return parsed.filter((p) => p.points === maxPts);
}

export function nbaTopScorerPredictionHit(
  pick: NbaTopScorerPick | null | undefined,
  leadingScorers: NbaLeadingScorer[] | null | undefined
): boolean {
  if (!pick) return false;
  const list = leadingScorers ?? [];
  return list.some(
    (g) => g.playerId === pick.playerId && g.teamId === pick.teamId
  );
}

export function validateNbaTopScorerPickForGame(
  pick: NbaTopScorerPick | null | undefined,
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined,
  candidates?: NbaTopScorerCandidate[] | null
): { ok: true } | { ok: false; error: string } {
  if (!pick) return { ok: true };
  const allowed = [homeTeamId, awayTeamId].filter(Boolean) as string[];
  if (!allowed.includes(pick.teamId)) {
    return { ok: false, error: "goalScorer.teamId must be home or away" };
  }
  if (candidates && candidates.length > 0) {
    const ok = candidates.some(
      (c) => c.playerId === pick.playerId && c.teamId === pick.teamId
    );
    if (!ok) {
      return { ok: false, error: "goalScorer.playerId invalid" };
    }
  }
  return { ok: true };
}

export function calcNbaTopScorerBonus(
  league: string | null | undefined,
  prediction: { goalScorer?: unknown } | null | undefined,
  leadingScorers: unknown
): number {
  if (String(league ?? "").toLowerCase() !== "nba") return 0;
  const pick = normalizeNbaTopScorerPick(prediction?.goalScorer);
  if (!pick) return 0;
  const leaders = normalizeNbaLeadingScorers(leadingScorers);
  return nbaTopScorerPredictionHit(pick, leaders)
    ? NBA_TOP_SCORER_BONUS_POINTS
    : 0;
}
