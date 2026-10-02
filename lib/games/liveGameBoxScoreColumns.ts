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
