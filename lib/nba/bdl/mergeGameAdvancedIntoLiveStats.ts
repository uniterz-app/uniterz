import type {
  LiveGameBoxPlayer,
  LiveGameStatsDoc,
} from "@/lib/games/liveGameStats";
import type { BdlGameAdvancedStatRow } from "@/lib/nba/bdl/fetchBdlGameAdvancedStats";

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function advancedFields(row: BdlGameAdvancedStatRow): Partial<LiveGameBoxPlayer> {
  const out: Partial<LiveGameBoxPlayer> = {};
  const ts = num(row.true_shooting_percentage);
  const efg = num(row.effective_field_goal_percentage);
  const usg = num(row.usage_percentage);
  const net = num(row.net_rating);
  const ortg = num(row.offensive_rating);
  const drtg = num(row.defensive_rating);
  const pie = num(row.pie);
  if (ts != null) out.tsPct = ts;
  if (efg != null) out.efgPct = efg;
  if (usg != null) out.usgPct = usg;
  if (net != null) out.netR = net;
  if (ortg != null) out.ortg = ortg;
  if (drtg != null) out.drtg = drtg;
  if (pie != null) out.pie = pie;
  return out;
}

function mergePlayers(
  players: LiveGameBoxPlayer[],
  byPlayerId: Map<string, Partial<LiveGameBoxPlayer>>
): LiveGameBoxPlayer[] {
  return players.map((p) => {
    const adv = byPlayerId.get(p.playerId);
    if (!adv) return p;
    return { ...p, ...adv };
  });
}

/** full-game（period 0）advanced 行を box 選手に merge */
export function mergeGameAdvancedIntoLiveStatsDoc(
  doc: LiveGameStatsDoc,
  rows: readonly BdlGameAdvancedStatRow[]
): LiveGameStatsDoc {
  const byPlayerId = new Map<string, Partial<LiveGameBoxPlayer>>();
  for (const row of rows) {
    if (row.period != null && row.period !== 0) continue;
    const playerId =
      row.player?.id != null ? String(row.player.id).trim() : "";
    if (!playerId) continue;
    const fields = advancedFields(row);
    if (Object.keys(fields).length === 0) continue;
    byPlayerId.set(playerId, { ...byPlayerId.get(playerId), ...fields });
  }
  if (byPlayerId.size === 0) return doc;
  return {
    ...doc,
    box: {
      home: mergePlayers(doc.box.home, byPlayerId),
      away: mergePlayers(doc.box.away, byPlayerId),
    },
  };
}
