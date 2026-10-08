import type { LiveGameBoxPlayer } from "@/lib/games/liveGameStats";

export type LiveGameBoxScoreMode = "basic" | "advanced";

export type LiveGameBoxColumnDef = {
  key: string;
  label: string;
  emphasis?: boolean;
};

export const LIVE_GAME_BOX_BASIC_COLUMNS: readonly LiveGameBoxColumnDef[] = [
  { key: "min", label: "MIN" },
  { key: "pts", label: "PTS", emphasis: true },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "tov", label: "TO" },
  { key: "fg", label: "FG", emphasis: true },
  { key: "fg3", label: "3P", emphasis: true },
  { key: "ft", label: "FT" },
  { key: "pm", label: "+/-" },
];

/** BDL box + `/nba/v2/stats/advanced`（試合 ingest で merge） */
export const LIVE_GAME_BOX_ADVANCED_COLUMNS: readonly LiveGameBoxColumnDef[] = [
  { key: "min", label: "MIN" },
  { key: "oreb", label: "OREB" },
  { key: "dreb", label: "DREB" },
  { key: "pf", label: "PF" },
  { key: "tsPct", label: "TS%" },
  { key: "efgPct", label: "EFG%" },
  { key: "usgPct", label: "USG%" },
  { key: "netR", label: "NET" },
  { key: "ortg", label: "ORTG" },
  { key: "drtg", label: "DRTG" },
  { key: "pie", label: "PIE" },
];

function dash(v: unknown): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  return String(v);
}

function pctFromRatio(v: unknown): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  const pct = v <= 1 && v >= -1 ? v * 100 : v;
  return `${pct.toFixed(1)}%`;
}

function rating(v: unknown): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  const rounded = Math.round(v * 10) / 10;
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

function pieLabel(v: unknown): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  return (v * 100).toFixed(1);
}

export function liveGameBoxColumns(
  mode: LiveGameBoxScoreMode
): readonly LiveGameBoxColumnDef[] {
  return mode === "advanced"
    ? LIVE_GAME_BOX_ADVANCED_COLUMNS
    : LIVE_GAME_BOX_BASIC_COLUMNS;
}

export function liveGameBoxColumnValues(
  player: LiveGameBoxPlayer,
  mode: LiveGameBoxScoreMode
): string[] {
  if (mode === "basic") {
    const pm = player.plusMinus;
    return [
      String(player.min),
      String(player.pts),
      String(player.reb),
      String(player.ast),
      String(player.stl),
      String(player.blk),
      String(player.tov),
      player.fg,
      player.fg3,
      player.ft,
      pm > 0 ? `+${pm}` : String(pm),
    ];
  }

  return [
    String(player.min),
    dash(player.oreb),
    dash(player.dreb),
    dash(player.pf),
    pctFromRatio(player.tsPct),
    pctFromRatio(player.efgPct),
    pctFromRatio(player.usgPct),
    rating(player.netR),
    dash(player.ortg),
    dash(player.drtg),
    pieLabel(player.pie),
  ];
}

/** 列ヘッダーのタップ: 降順 → 昇順 → 解除（ロスター表と同じ） */
export type LiveGameBoxSort = { key: string; dir: "desc" | "asc" } | null;

export function nextLiveGameBoxSort(
  prev: LiveGameBoxSort,
  key: string
): LiveGameBoxSort {
  if (!prev || prev.key !== key) return { key, dir: "desc" };
  if (prev.dir === "desc") return { key, dir: "asc" };
  return null;
}

function madeFromSplit(v: string): number | null {
  const made = Number.parseInt(String(v).split("-")[0] ?? "", 10);
  return Number.isFinite(made) ? made : null;
}

function finiteOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** FG / 3P / FT は成功数で比較 */
export function liveGameBoxSortValue(
  player: LiveGameBoxPlayer,
  key: string
): number | null {
  switch (key) {
    case "fg":
      return madeFromSplit(player.fg);
    case "fg3":
      return madeFromSplit(player.fg3);
    case "ft":
      return madeFromSplit(player.ft);
    case "pm":
      return finiteOrNull(player.plusMinus);
    default:
      return finiteOrNull((player as Record<string, unknown>)[key]);
  }
}

function defaultBoxOrder(a: LiveGameBoxPlayer, b: LiveGameBoxPlayer): number {
  if (a.starter !== b.starter) return a.starter ? -1 : 1;
  if (b.pts !== a.pts) return b.pts - a.pts;
  return b.min - a.min;
}

/** sort 無し（または今のモードに無い列）は スタメン → PTS → MIN。値なしは常に末尾 */
export function sortLiveGameBoxPlayers(
  players: readonly LiveGameBoxPlayer[],
  sort: LiveGameBoxSort,
  mode: LiveGameBoxScoreMode
): LiveGameBoxPlayer[] {
  const active = activeLiveGameBoxSort(sort, mode);
  if (!active) return [...players].sort(defaultBoxOrder);
  const mul = active.dir === "desc" ? -1 : 1;
  return [...players].sort((a, b) => {
    const av = liveGameBoxSortValue(a, active.key);
    const bv = liveGameBoxSortValue(b, active.key);
    if (av == null || bv == null) {
      if (av == null && bv == null) return defaultBoxOrder(a, b);
      return av == null ? 1 : -1;
    }
    if (av !== bv) return av < bv ? -mul : mul;
    return defaultBoxOrder(a, b);
  });
}

/** 今のモードで有効な sort（無効なら null） */
export function activeLiveGameBoxSort(
  sort: LiveGameBoxSort,
  mode: LiveGameBoxScoreMode
): LiveGameBoxSort {
  return sort && liveGameBoxColumns(mode).some((c) => c.key === sort.key)
    ? sort
    : null;
}

export function liveGameBoxHasAdvancedData(
  players: readonly LiveGameBoxPlayer[]
): boolean {
  if (players.length === 0) return false;
  return players.some(
    (p) =>
      p.oreb != null ||
      p.dreb != null ||
      p.pf != null ||
      p.tsPct != null ||
      p.usgPct != null ||
      p.netR != null ||
      p.pie != null ||
      p.ortg != null ||
      p.drtg != null
  );
}
