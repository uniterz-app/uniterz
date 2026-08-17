/**
 * リザルト詳細「この試合」— NBA 最多得点者の選択分布。
 * settle 時に `games.topScorerMarket` へ埋め込み。myPick は閲覧 post から resolve。
 */
export type ResultTopScorerMarketSlice = {
  playerId: string;
  teamId: string;
  name: string;
  /** 0–100 */
  pct: number;
  count: number;
  /** 実最多得点者（同点可） */
  isActual?: boolean;
  /** 試合得点（凡例表示用） */
  points?: number | null;
  /** @deprecated `points` 優先 */
  actualPoints?: number | null;
};

export type ResultTopScorerMarketView = {
  /** 選択があった投稿数（NO PICK 除く母数は n） */
  n: number;
  slices: ResultTopScorerMarketSlice[];
  /** 的中率 0–100（選択者のうち） */
  hitRatePct: number | null;
  myPick: {
    playerId: string;
    teamId: string;
    name: string;
    hit: boolean | null;
  } | null;
};

export function parseResultTopScorerMarketView(
  raw: unknown
): ResultTopScorerMarketView | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
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
    const teamId = String(r.teamId ?? "").trim();
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
      teamId: teamId || "—",
      name,
      pct: Math.max(0, pct),
      count: Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0,
      isActual: r.isActual === true,
      points:
        pointsRaw != null && Number.isFinite(pointsRaw) ? pointsRaw : null,
    });
  }
  if (slices.length === 0) return null;

  let myPick: ResultTopScorerMarketView["myPick"] = null;
  if (o.myPick != null && typeof o.myPick === "object") {
    const m = o.myPick as Record<string, unknown>;
    const playerId = String(m.playerId ?? "").trim();
    const name = String(m.name ?? "").trim();
    if (playerId && name) {
      myPick = {
        playerId,
        teamId: String(m.teamId ?? "").trim() || "—",
        name,
        hit: m.hit === true ? true : m.hit === false ? false : null,
      };
    }
  }

  const hitRatePct =
    o.hitRatePct == null
      ? null
      : Number.isFinite(Number(o.hitRatePct))
        ? Math.max(0, Math.min(100, Number(o.hitRatePct)))
        : null;

  return { n, slices, hitRatePct, myPick };
}
