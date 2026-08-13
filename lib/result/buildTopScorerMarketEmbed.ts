/**
 * NBA 最多得点者の選択分布 — settle / backfill 用（myPick は含めない）。
 */
import {
  nbaTopScorerPredictionHit,
  normalizeNbaLeadingScorers,
  normalizeNbaTopScorerCandidates,
  normalizeNbaTopScorerPick,
  type NbaLeadingScorer,
  type NbaTopScorerCandidate,
} from "@/lib/nba/topScorer";
import type {
  ResultTopScorerMarketSlice,
  ResultTopScorerMarketView,
} from "@/lib/result/resultTopScorerMarket";

export const TOP_SCORER_MARKET_NO_PICK_ID = "__none__";

export type TopScorerMarketEmbedV1 = {
  v: 1;
  /** 試合の全投稿数 */
  n: number;
  slices: ResultTopScorerMarketSlice[];
  /** 選択者の的中率 0–100 */
  hitRatePct: number | null;
};

export type TopScorerMarketPostRow = {
  prediction?: { goalScorer?: unknown } | null;
};

function pickKey(playerId: string, teamId: string) {
  return `${playerId}|${teamId}`;
}

function resolveSliceName(
  playerId: string,
  teamId: string,
  nameHint: string | null | undefined,
  candidates: NbaTopScorerCandidate[],
  leaders: NbaLeadingScorer[]
): string {
  if (nameHint?.trim()) return nameHint.trim();
  const fromCand = candidates.find(
    (c) => c.playerId === playerId && c.teamId === teamId
  );
  if (fromCand?.name) return fromCand.name;
  const fromLeader = leaders.find(
    (l) => l.playerId === playerId && l.teamId === teamId
  );
  if (fromLeader?.name) return fromLeader.name;
  return playerId;
}

function leaderForPick(
  playerId: string,
  teamId: string,
  leaders: NbaLeadingScorer[]
): NbaLeadingScorer | undefined {
  return leaders.find(
    (l) => l.playerId === playerId && l.teamId === teamId
  );
}

/**
 * posts スナップ + game 断片から TOP SCORER 分布を構築。
 * NBA 以外・投稿 0・分布なしのとき null。
 */
export function buildTopScorerMarketEmbed(input: {
  league: string | null | undefined;
  posts: readonly TopScorerMarketPostRow[];
  leadingScorers?: unknown;
  topScorerCandidates?: unknown;
  /** NO PICK を除いた上位 N 選手 + NO PICK */
  maxPlayerSlices?: number;
}): TopScorerMarketEmbedV1 | null {
  if (String(input.league ?? "").toLowerCase() !== "nba") return null;
  const totalN = input.posts.length;
  if (totalN <= 0) return null;

  const leaders = normalizeNbaLeadingScorers(input.leadingScorers);
  const candidates = normalizeNbaTopScorerCandidates(input.topScorerCandidates);
  const maxPlayerSlices = Math.max(1, input.maxPlayerSlices ?? 4);

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

  for (const post of input.posts) {
    const pick = normalizeNbaTopScorerPick(post.prediction?.goalScorer);
    if (!pick) {
      noPickCount += 1;
      continue;
    }
    pickCount += 1;
    if (leaders.length > 0 && nbaTopScorerPredictionHit(pick, leaders)) {
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

  const leaderKeys = new Set(
    leaders.map((l) => pickKey(l.playerId, l.teamId))
  );

  const playerSlices: ResultTopScorerMarketSlice[] = [...buckets.values()]
    .sort((a, b) => b.count - a.count || a.playerId.localeCompare(b.playerId))
    .slice(0, maxPlayerSlices)
    .map((b) => {
      const leader = leaderForPick(b.playerId, b.teamId, leaders);
      const isActual = leaderKeys.has(pickKey(b.playerId, b.teamId));
      return {
        playerId: b.playerId,
        teamId: b.teamId,
        name: resolveSliceName(
          b.playerId,
          b.teamId,
          b.nameHint,
          candidates,
          leaders
        ),
        pct: (b.count / totalN) * 100,
        count: b.count,
        isActual,
        points:
          leader != null && Number.isFinite(leader.points)
            ? leader.points
            : null,
      };
    });

  const slices: ResultTopScorerMarketSlice[] = [...playerSlices];
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

export function parseTopScorerMarketEmbed(
  raw: unknown
): TopScorerMarketEmbedV1 | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1) return null;
  if (!Array.isArray(o.slices) || o.slices.length === 0) return null;
  const n =
    typeof o.n === "number" && Number.isFinite(o.n)
      ? Math.max(0, Math.floor(o.n))
      : 0;
  const slices: ResultTopScorerMarketSlice[] = [];
  for (const row of o.slices) {
    if (row == null || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const playerId = String(r.playerId ?? "").trim();
    const name = String(r.name ?? "").trim();
    const pct = Number(r.pct);
    const count = Number(r.count);
    if (!playerId || !name || !Number.isFinite(pct)) continue;
    const pointsRaw =
      r.points != null
        ? Number(r.points)
        : r.actualPoints != null
          ? Number(r.actualPoints)
          : null;
    slices.push({
      playerId,
      teamId: String(r.teamId ?? "").trim() || "—",
      name,
      pct: Math.max(0, pct),
      count: Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0,
      isActual: r.isActual === true,
      points:
        pointsRaw != null && Number.isFinite(pointsRaw) ? pointsRaw : null,
    });
  }
  if (slices.length === 0) return null;
  const hitRatePct =
    o.hitRatePct == null
      ? null
      : Number.isFinite(Number(o.hitRatePct))
        ? Math.max(0, Math.min(100, Number(o.hitRatePct)))
        : null;
  return { v: 1, n, slices, hitRatePct };
}

/** game 埋め込み + 閲覧中 post から詳細 VM 用 view を組み立てる */
export function resolveTopScorerMarketView(
  gameData: Record<string, unknown> | null | undefined,
  post: Record<string, unknown>
): ResultTopScorerMarketView | null {
  if (!gameData) return null;
  const embed = parseTopScorerMarketEmbed(gameData.topScorerMarket);
  if (!embed) return null;

  const league = post.league ?? gameData.league;
  if (String(league ?? "").toLowerCase() !== "nba") return null;

  const pick = normalizeNbaTopScorerPick(
    (post.prediction as { goalScorer?: unknown } | null | undefined)?.goalScorer
  );
  const leaders = normalizeNbaLeadingScorers(gameData.leadingScorers);
  const candidates = normalizeNbaTopScorerCandidates(
    gameData.topScorerCandidates
  );

  let myPick: ResultTopScorerMarketView["myPick"] = null;
  if (pick) {
    const hit =
      leaders.length > 0
        ? nbaTopScorerPredictionHit(pick, leaders)
        : null;
    myPick = {
      playerId: pick.playerId,
      teamId: pick.teamId,
      name: resolveSliceName(
        pick.playerId,
        pick.teamId,
        pick.name,
        candidates,
        leaders
      ),
      hit,
    };
  }

  return {
    n: embed.n,
    slices: embed.slices,
    hitRatePct: embed.hitRatePct,
    myPick,
  };
}
