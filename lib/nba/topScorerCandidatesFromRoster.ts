/**
 * 対戦2チームのロスターから TOP SCORER 候補を組む。
 * PPG 降順。UI は先頭 5 人を出し、残りは展開する。
 */
import {
  sortNbaTopScorerCandidatesByPpg,
  type NbaTopScorerCandidate,
} from "@/lib/nba/topScorer";
import {
  playerCardName,
  type NbaRosterReport,
} from "@/lib/predict/nbaRoster";

export function topScorerCandidatesFromRoster(
  report: NbaRosterReport | null | undefined
): NbaTopScorerCandidate[] {
  if (!report) return [];
  const out: NbaTopScorerCandidate[] = [];
  for (const side of [report.home, report.away]) {
    for (const p of side.players) {
      if (p.dimmed) continue;
      const playerId = String(p.id ?? "").trim();
      if (!playerId) continue;
      const name = playerCardName(p);
      if (!name || name === "—") continue;
      const ppg = Number(p.ppg);
      const gp = Number(p.gp);
      out.push({
        playerId,
        teamId: side.teamId,
        name,
        ppg: Number.isFinite(ppg) ? ppg : null,
        gp: Number.isFinite(gp) ? gp : null,
        position: p.position || null,
        jerseyNumber: p.jerseyNumber ?? null,
      });
    }
  }
  return sortNbaTopScorerCandidatesByPpg(out);
}
