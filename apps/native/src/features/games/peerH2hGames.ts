import { rawTeamIdFromGameSide } from "./resolveNativeSeriesStanding";
import {
  resolveGameScore,
  resolveGameStartAt,
  resolveGameStatus,
} from "../../shared/gameRow";

export type PeerH2hLine = {
  id: string;
  startMs: number;
  homeScore: number;
  awayScore: number;
};

function sameLeagueAndMatchup(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  if (String(a.league ?? "") !== String(b.league ?? "")) return false;
  const ha = rawTeamIdFromGameSide(a.home);
  const aa = rawTeamIdFromGameSide(a.away);
  const hb = rawTeamIdFromGameSide(b.home);
  const ab = rawTeamIdFromGameSide(b.away);
  if (!ha || !aa || !hb || !ab) return false;
  const setA = new Set([ha, aa]);
  return setA.has(hb) && setA.has(ab);
}

/**
 * `peerGames` から同一リーグ・同一二チームの終了試合を日付順（古い→新）で切り出す。
 * 日付周辺のクエリ枠内に収まる対戦履歴用（`resolveNbaH2HPack` の正規 H2H とは一致しない場合あり）。
 */
export function listFinalH2hGamesFromPeers(
  subject: Record<string, unknown>,
  peerGames: ReadonlyArray<Record<string, unknown>>,
  maxRows = 12
): PeerH2hLine[] {
  const out: PeerH2hLine[] = [];
  for (const p of peerGames) {
    const raw = p as Record<string, unknown>;
    if (!sameLeagueAndMatchup(subject, raw)) continue;
    if (resolveGameStatus(raw) !== "final") continue;
    const sc = resolveGameScore(raw);
    if (!sc) continue;
    const d = resolveGameStartAt(raw);
    out.push({
      id: String(raw.id ?? ""),
      startMs: d ? +d : 0,
      homeScore: sc.home,
      awayScore: sc.away,
    });
  }
  out.sort((a, b) => a.startMs - b.startMs);
  if (out.length > maxRows) {
    return out.slice(out.length - maxRows);
  }
  return out;
}
