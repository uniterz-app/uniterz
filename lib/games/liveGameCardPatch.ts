/**
 * 試合一覧に重ねるスコア差分。ライブ中は窓全体を読み直さない。
 */

export type LiveGameCardPatch = {
  id: string;
  status: string | null;
  final: boolean;
  homeScore: number | null;
  awayScore: number | null;
  score: { home: number; away: number } | null;
  periodLabel: string | null;
  clock: string | null;
};

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function liveGameCardPatchFromGameDoc(
  id: string,
  data: Record<string, unknown> | undefined
): LiveGameCardPatch | null {
  if (!data) return null;
  const homeScore = finiteNumber(data.homeScore);
  const awayScore = finiteNumber(data.awayScore);
  const rawScore = data.score;
  let score: { home: number; away: number } | null = null;
  if (rawScore && typeof rawScore === "object") {
    const home = finiteNumber((rawScore as { home?: unknown }).home);
    const away = finiteNumber((rawScore as { away?: unknown }).away);
    if (home != null && away != null) score = { home, away };
  }
  if (!score && homeScore != null && awayScore != null) {
    score = { home: homeScore, away: awayScore };
  }
  const status = typeof data.status === "string" ? data.status : null;
  const periodLabel =
    typeof data.periodLabel === "string" ? data.periodLabel : null;
  const clock = typeof data.clock === "string" ? data.clock : null;
  return {
    id,
    status,
    final: data.final === true || data.final === 1,
    homeScore,
    awayScore,
    score,
    periodLabel,
    clock,
  };
}

function sameScore(
  prev: unknown,
  next: { home: number; away: number } | null
): boolean {
  if (next == null) return true;
  if (!prev || typeof prev !== "object") return false;
  const score = prev as { home?: unknown; away?: unknown };
  return score.home === next.home && score.away === next.away;
}

/** 値が同じ行は同じオブジェクトのまま返す */
export function applyLiveGameCardPatches<T extends Record<string, unknown>>(
  rows: readonly T[],
  patches: readonly LiveGameCardPatch[]
): T[] {
  if (patches.length === 0 || rows.length === 0) return rows as T[];
  const byId = new Map(patches.map((patch) => [patch.id, patch]));
  let changed = false;
  const next = rows.map((row) => {
    const id = typeof row.id === "string" ? row.id : "";
    const patch = id ? byId.get(id) : undefined;
    if (!patch) return row;
    const status = patch.status ?? row.status;
    const periodLabel = patch.periodLabel ?? row.periodLabel;
    const clock = patch.clock ?? row.clock;
    const score = patch.score ?? row.score;
    if (
      row.status === status &&
      row.final === patch.final &&
      row.homeScore === patch.homeScore &&
      row.awayScore === patch.awayScore &&
      row.periodLabel === periodLabel &&
      row.clock === clock &&
      sameScore(row.score, patch.score)
    ) {
      return row;
    }
    changed = true;
    return {
      ...row,
      status,
      final: patch.final,
      homeScore: patch.homeScore,
      awayScore: patch.awayScore,
      score,
      periodLabel,
      clock,
    };
  });
  return changed ? next : (rows as T[]);
}
