/**
 * BDL shooting by_zone season averages → `NbaPlayerShotZone[]`。
 */
import {
  bdlStatNum,
  type BdlPlayerSeasonAverageRow,
} from "@/lib/nba/bdl/fetchBdlPlayerSeasonAverages";
import type {
  NbaPlayerShotZone,
  NbaPlayerShotZoneId,
} from "@/lib/predict/nbaPlayerDetailPreviewMocks";

const ZONE_DEFS: Array<{
  id: NbaPlayerShotZoneId;
  short: string;
  label: string;
  fgaKeys: string[];
  fgPctKeys: string[];
}> = [
  {
    id: "restricted",
    short: "RA",
    label: "Restricted Area",
    fgaKeys: ["restricted_area_fga"],
    fgPctKeys: ["restricted_area_fg_pct"],
  },
  {
    id: "paint",
    short: "PAINT",
    label: "In Paint (Non-RA)",
    fgaKeys: ["in_the_paint_(non-ra)_fga"],
    fgPctKeys: ["in_the_paint_(non-ra)_fg_pct"],
  },
  {
    id: "mid",
    short: "MID",
    label: "Mid-Range",
    fgaKeys: ["mid-range_fga"],
    fgPctKeys: ["mid-range_fg_pct"],
  },
  {
    id: "left_corner_3",
    short: "LC3",
    label: "Left Corner 3",
    fgaKeys: ["left_corner_3_fga"],
    fgPctKeys: ["left_corner_3_fg_pct"],
  },
  {
    id: "right_corner_3",
    short: "RC3",
    label: "Right Corner 3",
    fgaKeys: ["right_corner_3_fga"],
    fgPctKeys: ["right_corner_3_fg_pct"],
  },
  {
    id: "above_break_3",
    short: "AB3",
    label: "Above the Break 3",
    fgaKeys: ["above_the_break_3_fga"],
    fgPctKeys: ["above_the_break_3_fg_pct"],
  },
];

function pct01(raw: number | null): number {
  if (raw == null || !Number.isFinite(raw)) return 0;
  return raw > 1 ? raw / 100 : raw;
}

export function mapBdlRowToPlayerShotZones(
  row: BdlPlayerSeasonAverageRow | null | undefined
): NbaPlayerShotZone[] {
  if (!row?.stats) return [];
  const stats = row.stats;
  const out: NbaPlayerShotZone[] = [];
  for (const def of ZONE_DEFS) {
    const fga = bdlStatNum(stats, ...def.fgaKeys);
    const fgPctRaw = bdlStatNum(stats, ...def.fgPctKeys);
    if (fga == null && fgPctRaw == null) continue;
    out.push({
      id: def.id,
      short: def.short,
      label: def.label,
      fgPct: pct01(fgPctRaw),
      fga: fga ?? 0,
    });
  }
  return out;
}

/** リーグ batch 結果 → playerId → zones */
export function indexBdlShotZoneRowsByPlayerId(
  rows: BdlPlayerSeasonAverageRow[]
): Map<string, NbaPlayerShotZone[]> {
  const out = new Map<string, NbaPlayerShotZone[]>();
  for (const row of rows) {
    const pid = row.player?.id;
    if (typeof pid !== "number" || pid <= 0) continue;
    const zones = mapBdlRowToPlayerShotZones(row);
    if (zones.length === 0) continue;
    out.set(String(pid), zones);
  }
  return out;
}
