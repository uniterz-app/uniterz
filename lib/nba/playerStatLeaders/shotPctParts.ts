/**
 * 成功率のリーダー / メトリクスに添える 1 試合平均の成功数・試投数。
 * `made` / `att` は同じ値を持つ別の指標 ID（ingest 前の行の穴埋め用）。トラッキング系は行の `made` / `att` だけ。
 */
export type NbaShotPctParts = {
  madeShort: string;
  attShort: string;
  made?: string;
  att?: string;
};

export const NBA_SHOT_PCT_PARTS: Readonly<Record<string, NbaShotPctParts>> = {
  fg_pct: { madeShort: "FGM", attShort: "FGA", made: "fgm", att: "fga" },
  fg3_pct: { madeShort: "3PM", attShort: "3PA", made: "fg3m", att: "fg3a" },
  ft_pct: { madeShort: "FTM", attShort: "FTA", made: "ftm", att: "fta" },
  drive_fg_pct: { madeShort: "FGM", attShort: "FGA" },
  cns_fg_pct: { madeShort: "FGM", attShort: "FGA" },
  pullup_fg_pct: { madeShort: "FGM", attShort: "FGA" },
  clutch_fg_pct: { madeShort: "FGM", attShort: "FGA" },
  restricted_fg_pct: { madeShort: "FGM", attShort: "FGA" },
  corner3_pct: { madeShort: "3PM", attShort: "3PA" },
};

export function nbaShotPctParts(metric: string): NbaShotPctParts | null {
  return NBA_SHOT_PCT_PARTS[metric] ?? null;
}

/** 1 試合平均の本数（小数 1 桁） */
export function formatShotPerGame(v: number | null | undefined): string {
  return typeof v === "number" && Number.isFinite(v) ? v.toFixed(1) : "—";
}
