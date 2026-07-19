/** NBA 最多得点者ボーナス（functions 側。lib/nba/topScorer.ts と同ロジック） */

export const NBA_TOP_SCORER_BONUS_POINTS = 2;

type Pick = { playerId?: string; teamId?: string };
type Leader = Pick & { points?: number };

function normalizePick(raw: unknown): Pick | null {
  if (!raw || typeof raw !== "object") return null;
  const playerId = String((raw as Pick).playerId ?? "").trim();
  const teamId = String((raw as Pick).teamId ?? "").trim();
  if (!playerId || !teamId) return null;
  return { playerId, teamId };
}

function normalizeLeadingScorers(raw: unknown): Leader[] {
  if (!Array.isArray(raw)) return [];
  const parsed: Leader[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const pick = normalizePick(row);
    if (!pick) continue;
    const points = Number((row as Leader).points);
    if (!Number.isFinite(points) || points < 0) continue;
    parsed.push({ ...pick, points });
  }
  if (parsed.length === 0) return [];
  const maxPts = Math.max(...parsed.map((p) => Number(p.points)));
  return parsed.filter((p) => Number(p.points) === maxPts);
}

export function calcNbaTopScorerBonus(
  league: string | null | undefined,
  prediction: { goalScorer?: unknown } | null | undefined,
  leadingScorers: unknown
): number {
  if (String(league ?? "").toLowerCase() !== "nba") return 0;
  const pick = normalizePick(prediction?.goalScorer);
  if (!pick) return 0;
  const leaders = normalizeLeadingScorers(leadingScorers);
  const hit = leaders.some(
    (g) => g.playerId === pick.playerId && g.teamId === pick.teamId
  );
  return hit ? NBA_TOP_SCORER_BONUS_POINTS : 0;
}
