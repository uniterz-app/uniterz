/**
 * PLAYERS — 選手単位の読み（型×相手穴 / 直近フォーム）。
 * LLM なし。leaders スナップショット + チーム守備ランクのテンプレ穴埋め。
 */
import type { ProBriefPlayerItem } from "@/lib/predict/predictProBrief";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type {
  NbaPlayerStatLeaderRow,
  NbaPlayerStatLeadersBundle,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import {
  rankTeamsByMetric,
  type RankedMetricKey,
} from "@/lib/nba/insights/rankTeamMetrics";

const PLAYERS_MAX = 2;

type PlayerCandidate = ProBriefPlayerItem & { score: number; kind: string };

function shortPlayerName(name: string): string {
  const raw = name.trim();
  if (!raw) return name;
  const parts = raw.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}.${parts.slice(1).join(" ")}`;
  }
  return raw;
}

function rowsForTeam(
  board: NbaPlayerStatLeaderRow[] | undefined,
  teamId: string
): NbaPlayerStatLeaderRow[] {
  if (!board?.length) return [];
  return board.filter((r) => r.teamId === teamId);
}

function clashScore(myRank: number | undefined, oppWeakRank: number | undefined): number {
  if (myRank == null || oppWeakRank == null) return 0;
  const myBoost = Math.max(0, 16 - myRank);
  const oppBoost = Math.max(0, oppWeakRank - 15);
  return myBoost + oppBoost;
}

function pickTopOnTeam(
  board: NbaPlayerStatLeaderRow[] | undefined,
  teamId: string,
  max = 3
): NbaPlayerStatLeaderRow[] {
  return rowsForTeam(board, teamId)
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, max);
}

function leagueIndex(
  board: NbaPlayerStatLeaderRow[] | undefined,
  playerId: string
): number | undefined {
  if (!board?.length) return undefined;
  const i = board.findIndex((r) => r.playerId === playerId);
  return i >= 0 ? i + 1 : undefined;
}

export function buildPlayerLinesForTeam(input: {
  phase: ProBriefPhase;
  seasonRows: NbaLeagueTeamStatRow[];
  leaders: NbaPlayerStatLeadersBundle | null;
  teamId: string;
  opponentId: string;
}): ProBriefPlayerItem[] {
  if (input.phase === "opening" || !input.leaders) return [];

  const season = input.leaders.season;
  const last10 = input.leaders.last10;
  const candidates: PlayerCandidate[] = [];

  const oppPaintDef = rankTeamsByMetric(input.seasonRows, "oppEfgPct").get(
    input.opponentId
  );
  const opp3Def = rankTeamsByMetric(input.seasonRows, "oppFg3Pct").get(
    input.opponentId
  );

  // ペイント主体 × 相手守備が甘い
  for (const p of pickTopOnTeam(season.pts_paint, input.teamId, 2)) {
    const paintRank = leagueIndex(season.pts_paint, p.playerId);
    const shareRank = leagueIndex(season.pct_pts_paint, p.playerId);
    const score = clashScore(paintRank ?? shareRank, oppPaintDef) + 2;
    if (score < 8) continue;
    candidates.push({
      kind: "paint",
      score,
      playerId: p.playerId,
      playerName: shortPlayerName(p.playerName),
      label: "PAINT EDGE",
      detailJa: `ペイント得点 #${paintRank ?? "—"} · 相手守備 #${oppPaintDef ?? "—"}`,
      detailEn: `Paint PPG #${paintRank ?? "—"} · Opp defense #${oppPaintDef ?? "—"}`,
    });
  }

  // 3PT × 相手被3P
  for (const p of pickTopOnTeam(season.fg3m, input.teamId, 2)) {
    const mRank = leagueIndex(season.fg3m, p.playerId);
    const pctRank = leagueIndex(season.fg3_pct, p.playerId);
    const score = clashScore(mRank ?? pctRank, opp3Def) + 1;
    if (score < 8) continue;
    candidates.push({
      kind: "three",
      score,
      playerId: p.playerId,
      playerName: shortPlayerName(p.playerName),
      label: "3-POINT EDGE",
      detailJa: `3PM #${mRank ?? "—"} · 相手被3P #${opp3Def ?? "—"}`,
      detailEn: `3PM #${mRank ?? "—"} · Opp 3P% allowed #${opp3Def ?? "—"}`,
    });
  }

  // 直近 10 試合で得点が上がっている選手
  for (const p of pickTopOnTeam(last10.pts, input.teamId, 3)) {
    const l10Rank = leagueIndex(last10.pts, p.playerId);
    const seasonRank = leagueIndex(season.pts, p.playerId);
    if (l10Rank == null) continue;
    // last10 の方が明らかに良い（順位が良い = 数字が小さい）or シーズン順位が無い
    const hotBoost =
      seasonRank == null ? 6 : Math.max(0, seasonRank - l10Rank);
    if (hotBoost < 5 && l10Rank > 40) continue;
    const score = Math.max(0, 18 - l10Rank) + hotBoost;
    if (score < 10) continue;
    candidates.push({
      kind: "hot",
      score,
      playerId: p.playerId,
      playerName: shortPlayerName(p.playerName),
      label: "LAST 10 FORM",
      detailJa:
        seasonRank != null
          ? `直近10 得点 #${l10Rank}（今季 #${seasonRank}）`
          : `直近10 得点 #${l10Rank}`,
      detailEn:
        seasonRank != null
          ? `Last 10 PTS #${l10Rank} (season #${seasonRank})`
          : `Last 10 PTS #${l10Rank}`,
    });
  }

  // 直近 10 の 3P%
  for (const p of pickTopOnTeam(last10.fg3_pct, input.teamId, 2)) {
    const l10Rank = leagueIndex(last10.fg3_pct, p.playerId);
    if (l10Rank == null || l10Rank > 30) continue;
    const score = Math.max(0, 16 - l10Rank) + 3;
    candidates.push({
      kind: "hot3",
      score,
      playerId: p.playerId,
      playerName: shortPlayerName(p.playerName),
      label: "HOT 3PT",
      detailJa: `直近10 3P% #${l10Rank}`,
      detailEn: `Last 10 3P% #${l10Rank}`,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const usedKinds = new Set<string>();
  const usedPlayers = new Set<string>();
  const picked: ProBriefPlayerItem[] = [];
  for (const c of candidates) {
    if (usedKinds.has(c.kind)) continue;
    if (c.playerId && usedPlayers.has(c.playerId)) continue;
    usedKinds.add(c.kind);
    if (c.playerId) usedPlayers.add(c.playerId);
    picked.push({
      playerId: c.playerId,
      playerName: c.playerName,
      label: c.label,
      detailJa: c.detailJa,
      detailEn: c.detailEn,
    });
    if (picked.length >= PLAYERS_MAX) break;
  }
  return picked;
}

/** 未使用の型ノイズを避けるための再 export（将来の守備キー拡張用） */
export type PlayerOppDefenseKey = Extract<
  RankedMetricKey,
  "oppEfgPct" | "oppFg3Pct"
>;
