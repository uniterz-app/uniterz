export type SharedGameStatus = "scheduled" | "live" | "final";

function toDateOrNull(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: () => Date })?.toDate === "function") {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function resolveGameStatus(raw: Record<string, unknown>): SharedGameStatus {
  if (raw.final === true || raw.final === 1) return "final";
  const normalized = String(raw.status ?? "scheduled").toLowerCase();
  if (normalized === "live" || normalized === "inprogress") return "live";
  if (normalized === "final" || normalized === "ended") return "final";
  return "scheduled";
}

export function resolveGameStartAt(raw: Record<string, unknown>): Date | null {
  return (
    toDateOrNull(raw.startAtJst) ??
    toDateOrNull(raw.startAt) ??
    toDateOrNull(raw.kickoffJst) ??
    null
  );
}

export function resolveGameScore(
  raw: Record<string, unknown>
): { home: number; away: number } | null {
  const score = raw.score as
    | { home?: unknown; away?: unknown; h?: unknown; a?: unknown; final?: { home?: unknown; away?: unknown } }
    | undefined;
  if (score) {
    if (score.home != null || score.away != null) {
      const home = Number(score.home ?? 0);
      const away = Number(score.away ?? 0);
      if (Number.isFinite(home) && Number.isFinite(away)) return { home, away };
    }
    if (score.h != null || score.a != null) {
      const home = Number(score.h ?? 0);
      const away = Number(score.a ?? 0);
      if (Number.isFinite(home) && Number.isFinite(away)) return { home, away };
    }
    if (score.final?.home != null && score.final?.away != null) {
      const home = Number(score.final.home);
      const away = Number(score.final.away);
      if (Number.isFinite(home) && Number.isFinite(away)) return { home, away };
    }
  }

  const homeScore = Number(raw.homeScore);
  const awayScore = Number(raw.awayScore);
  if (Number.isFinite(homeScore) && Number.isFinite(awayScore)) {
    return { home: homeScore, away: awayScore };
  }

  const finalScore = raw.finalScore as { home?: unknown; away?: unknown } | undefined;
  if (finalScore?.home != null && finalScore?.away != null) {
    const home = Number(finalScore.home);
    const away = Number(finalScore.away);
    if (Number.isFinite(home) && Number.isFinite(away)) return { home, away };
  }

  const result = raw.result as { home?: unknown; away?: unknown } | undefined;
  if (result?.home != null && result?.away != null) {
    const home = Number(result.home);
    const away = Number(result.away);
    if (Number.isFinite(home) && Number.isFinite(away)) return { home, away };
  }

  return null;
}

export function resolveGameTeamName(
  side: unknown,
  fallback: unknown,
  defaultName: string
): string {
  if (typeof side === "string" && side.trim()) return side.trim();
  if (typeof (side as { name?: unknown })?.name === "string") {
    const name = String((side as { name: string }).name).trim();
    if (name) return name;
  }
  if (typeof fallback === "string" && fallback.trim()) return fallback.trim();
  return defaultName;
}

export function resolveGameLiveMeta(
  raw: Record<string, unknown>
): { period?: string; runningTime?: string } | null {
  const liveMeta = raw.liveMeta as
    | { period?: unknown; runningTime?: unknown; clock?: unknown }
    | undefined;

  const period =
    typeof liveMeta?.period === "string"
      ? liveMeta.period
      : typeof raw.period === "string"
      ? String(raw.period)
      : undefined;

  const runningTime =
    typeof liveMeta?.runningTime === "string"
      ? liveMeta.runningTime
      : typeof liveMeta?.clock === "string"
      ? liveMeta.clock
      : typeof raw.runningTime === "string"
      ? String(raw.runningTime)
      : typeof raw.clock === "string"
      ? String(raw.clock)
      : undefined;

  if (!period && !runningTime) return null;
  return { period, runningTime };
}
