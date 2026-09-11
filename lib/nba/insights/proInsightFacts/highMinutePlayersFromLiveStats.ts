/**
 * 前試合 liveStats box から 36 分超選手を抽出（Firestore のみ · BDL なし）。
 */
import { normalizeLiveGameStatsDoc } from "@/lib/games/liveGameStats";
import type { HighMinutePlayer } from "@/lib/nba/insights/proInsightFacts/buildScheduleFacts";

const MIN36 = 36;

function teamIdFromSide(raw: unknown, fallback?: unknown): string {
  if (raw && typeof raw === "object" && "teamId" in raw) {
    const id = String((raw as { teamId?: unknown }).teamId ?? "").trim();
    if (id) return id;
  }
  return String(fallback ?? "").trim();
}

function toMs(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis: () => number }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "string") {
    const t = Date.parse(value);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

function shortPlayerName(firstName: string, lastName: string): string {
  const f = firstName.trim();
  const l = lastName.trim();
  if (f && l) return `${f.charAt(0)}.${l}`;
  return l || f || "Player";
}

/**
 * 各チームの tip 直前試合の liveStats から min≥36 を集める。
 */
export function highMinutePlayersFromRecentGames(input: {
  docs: Array<{ id: string; data: Record<string, unknown> }>;
  teamIds: string[];
  beforeMs: number;
}): HighMinutePlayer[] {
  const out: HighMinutePlayer[] = [];
  const seen = new Set<string>();

  for (const teamId of input.teamIds) {
    let best: { tip: number; data: Record<string, unknown> } | null = null;
    for (const doc of input.docs) {
      const tip = toMs(doc.data.startAtJst);
      if (tip == null || tip >= input.beforeMs) continue;
      const homeId = teamIdFromSide(doc.data.home, doc.data.homeTeamId);
      const awayId = teamIdFromSide(doc.data.away, doc.data.awayTeamId);
      if (homeId !== teamId && awayId !== teamId) continue;
      if (!best || tip > best.tip) best = { tip, data: doc.data };
    }
    if (!best) continue;

    const live = normalizeLiveGameStatsDoc(best.data.liveStats);
    if (!live?.box) continue;
    const homeId = teamIdFromSide(best.data.home, best.data.homeTeamId);
    const side = homeId === teamId ? live.box.home : live.box.away;
    for (const p of side) {
      if (!(p.min >= MIN36)) continue;
      const playerId = String(p.playerId ?? "").trim();
      const key = `${teamId}:${playerId || shortPlayerName(p.firstName, p.lastName)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        teamId,
        playerId: playerId || undefined,
        playerName: shortPlayerName(p.firstName, p.lastName),
        minutes: p.min,
      });
    }
  }

  return out;
}
