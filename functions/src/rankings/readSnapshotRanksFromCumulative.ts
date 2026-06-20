import type { WcRankingStage } from "./wcRankingStage";

type Metric =
  | "winRate"
  | "totalPoints"
  | "totalPrecision"
  | "totalExactHits"
  | "totalUpset"
  | "activeWinStreak"
  | "totalGoalScorerHits";

type RankingPhase = "play_in" | "playoffs";
type PlayoffRoundKey = "overall" | "r1" | "r2" | "cf" | "finals";

type MetricRankMap = Partial<Record<Metric, unknown>>;

type SnapshotRanksRoot = {
  play_in?: MetricRankMap;
  playoffs?: MetricRankMap;
  playoffRounds?: Partial<Record<PlayoffRoundKey, MetricRankMap>>;
  wc?: Partial<Record<WcRankingStage, MetricRankMap>>;
};

function isNonEmptyObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && Object.keys(v as object).length > 0;
}

function pickBlock(
  nested: unknown,
  dot: unknown
): Record<string, unknown> | undefined {
  if (isNonEmptyObject(dot)) return dot;
  if (isNonEmptyObject(nested)) return nested;
  return undefined;
}

export function readSnapshotRanksRoot(
  data: Record<string, unknown> | null | undefined
): SnapshotRanksRoot {
  if (!data) return {};
  const nested = data.snapshotRanks as Record<string, unknown> | undefined;

  return {
    play_in: pickBlock(nested?.play_in, data["snapshotRanks.play_in"]) as
      | MetricRankMap
      | undefined,
    playoffs: pickBlock(nested?.playoffs, data["snapshotRanks.playoffs"]) as
      | MetricRankMap
      | undefined,
    playoffRounds: pickBlock(
      nested?.playoffRounds,
      data["snapshotRanks.playoffRounds"]
    ) as Partial<Record<PlayoffRoundKey, MetricRankMap>> | undefined,
    wc: pickBlock(nested?.wc, data["snapshotRanks.wc"]) as
      | Partial<Record<WcRankingStage, MetricRankMap>>
      | undefined,
  };
}

export function coerceRankInt(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    const r = Math.floor(v);
    return r >= 1 ? r : null;
  }
  if (typeof v === "object" && v !== null) {
    const o = v as Record<string, unknown>;
    if (typeof o.toNumber === "function") {
      const n = (o as { toNumber: () => number }).toNumber();
      if (Number.isFinite(n)) {
        const r = Math.floor(n);
        return r >= 1 ? r : null;
      }
    }
    const iv = o.integerValue ?? o._integerValue;
    if (typeof iv === "string" && /^\d+$/.test(iv.trim())) {
      const r = parseInt(iv.trim(), 10);
      return r >= 1 ? r : null;
    }
  }
  return null;
}

export function readStoredRankFromUser(
  me: Record<string, unknown>,
  metric: Metric,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): number | null {
  const snapshotRanks = readSnapshotRanksRoot(me);

  let raw: unknown;
  if (wcStage) {
    raw = snapshotRanks.wc?.[wcStage]?.[metric];
    if (metric === "totalExactHits" && raw == null) {
      raw = snapshotRanks.wc?.[wcStage]?.totalPrecision;
    }
  } else if (phase === "playoffs" && round !== "overall") {
    raw = snapshotRanks.playoffRounds?.[round]?.[metric];
  } else {
    raw = snapshotRanks[phase]?.[metric];
  }

  return typeof raw === "number" && Number.isFinite(raw) && raw >= 1
    ? Math.floor(raw)
    : coerceRankInt(raw);
}
