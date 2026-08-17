/**
 * NBA TOP SCORER 分布 — functions settle 用（lib と同ロジック）。
 */
import { calcNbaTopScorerBonus } from "./nbaTopScorerBonus";

export const TOP_SCORER_MARKET_NO_PICK_ID = "__none__";

export type TopScorerMarketSliceAgg = {
  playerId: string;
  teamId: string;
  name: string;
  pct: number;
  count: number;
  isActual?: boolean;
  points?: number | null;
};

export type TopScorerMarketEmbedAgg = {
  v: 1;
  n: number;
  slices: TopScorerMarketSliceAgg[];
  hitRatePct: number | null;
};

type Pick = {
  playerId: string;
  teamId: string;
  name?: string | null;
};

type Leader = Pick & { points: number };

function normalizePick(raw: unknown): Pick | null {
  if (!raw || typeof raw !== "object") return null;
  const playerId = String((raw as Pick).playerId ?? "").trim();
  const teamId = String((raw as Pick).teamId ?? "").trim();
  if (!playerId || !teamId) return null;
  const nameRaw = (raw as Pick).name;
  const name =
    nameRaw == null || String(nameRaw).trim() === ""
      ? null
      : String(nameRaw).trim();
  return name ? { playerId, teamId, name } : { playerId, teamId };
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
  const maxPts = Math.max(...parsed.map((p) => p.points));
  return parsed.filter((p) => p.points === maxPts);
}

function normalizeCandidates(raw: unknown): Array<Pick & { name: string }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<Pick & { name: string }> = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const pick = normalizePick(row);
    if (!pick) continue;
    const name = String((row as { name?: unknown }).name ?? "").trim();
    if (!name) continue;
    out.push({ ...pick, name });
  }
  return out;
}

function pickKey(playerId: string, teamId: string) {
  return `${playerId}|${teamId}`;
}

function resolveName(
  playerId: string,
  teamId: string,
  nameHint: string | null | undefined,
  candidates: Array<Pick & { name: string }>,
  leaders: Leader[]
): string {
  if (nameHint?.trim()) return nameHint.trim();
  const c = candidates.find(
    (x) => x.playerId === playerId && x.teamId === teamId
  );
  if (c?.name) return c.name;
  const l = leaders.find(
    (x) => x.playerId === playerId && x.teamId === teamId
  );
  if (l?.name) return l.name;
  return playerId;
}

export function buildTopScorerMarketEmbedFromPostsSnap({
  league,
  postsSnap,
  leadingScorers,
  topScorerCandidates,
  maxPlayerSlices = 4,
}: {
  league: string | null | undefined;
  postsSnap: FirebaseFirestore.QuerySnapshot;
  leadingScorers?: unknown;
  topScorerCandidates?: unknown;
  maxPlayerSlices?: number;
}): TopScorerMarketEmbedAgg | null {
  if (String(league ?? "").toLowerCase() !== "nba") return null;
  const totalN = postsSnap.size;
  if (totalN <= 0) return null;

  const leaders = normalizeLeadingScorers(leadingScorers);
  const candidates = normalizeCandidates(topScorerCandidates);
  const leaderKeys = new Set(leaders.map((l) => pickKey(l.playerId, l.teamId)));

  type Bucket = {
    playerId: string;
    teamId: string;
    nameHint: string | null;
    count: number;
  };
  const buckets = new Map<string, Bucket>();
  let noPickCount = 0;
  let pickCount = 0;
  let hitCount = 0;

  for (const doc of postsSnap.docs) {
    const p = doc.data();
    const pick = normalizePick(
      p.prediction != null && typeof p.prediction === "object"
        ? (p.prediction as { goalScorer?: unknown }).goalScorer
        : null
    );
    if (!pick) {
      noPickCount += 1;
      continue;
    }
    pickCount += 1;
    if (
      calcNbaTopScorerBonus(
        league,
        p.prediction as { goalScorer?: unknown },
        leadingScorers
      ) > 0
    ) {
      hitCount += 1;
    }
    const key = pickKey(pick.playerId, pick.teamId);
    const prev = buckets.get(key);
    if (prev) {
      prev.count += 1;
      if (!prev.nameHint && pick.name) prev.nameHint = pick.name;
    } else {
      buckets.set(key, {
        playerId: pick.playerId,
        teamId: pick.teamId,
        nameHint: pick.name ?? null,
        count: 1,
      });
    }
  }

  if (buckets.size === 0 && noPickCount === 0) return null;

  const playerSlices: TopScorerMarketSliceAgg[] = [...buckets.values()]
    .sort((a, b) => b.count - a.count || a.playerId.localeCompare(b.playerId))
    .slice(0, maxPlayerSlices)
    .map((b) => {
      const leader = leaders.find(
        (l) => l.playerId === b.playerId && l.teamId === b.teamId
      );
      const isActual = leaderKeys.has(pickKey(b.playerId, b.teamId));
      return {
        playerId: b.playerId,
        teamId: b.teamId,
        name: resolveName(
          b.playerId,
          b.teamId,
          b.nameHint,
          candidates,
          leaders
        ),
        pct: (b.count / totalN) * 100,
        count: b.count,
        isActual,
        points: leader?.points ?? null,
      };
    });

  const slices: TopScorerMarketSliceAgg[] = [...playerSlices];
  if (noPickCount > 0) {
    slices.push({
      playerId: TOP_SCORER_MARKET_NO_PICK_ID,
      teamId: "—",
      name: "NO PICK",
      pct: (noPickCount / totalN) * 100,
      count: noPickCount,
      isActual: false,
      points: null,
    });
  }

  if (slices.length === 0) return null;

  return {
    v: 1,
    n: totalN,
    hitRatePct:
      pickCount > 0 ? Math.round((hitCount / pickCount) * 1000) / 10 : null,
    slices,
  };
}
