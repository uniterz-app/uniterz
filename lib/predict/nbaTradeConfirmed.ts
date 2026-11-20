/**
 * トレード予想 — 公式に成立した移籍（今季）。
 *
 * - 掲載は球団・リーグの公式発表のみ。報道・噂は Buzz 側。
 * - 受付開始（12/15 0:00 JST）より前の移籍は一覧に出すが採点・枠ロックには入らない。
 * - 採点の判定は「受付期間中に最初に移籍した時点」。同じ選手が後で再移籍しても、最初の 1 件で固定する。
 * - 手更新（管理画面の入力が入るまでは、ここを直す）。
 */
import {
  TRADE_BALLOT_OPEN_AT_MS,
  TRADE_BALLOT_TDL_END_AT_MS,
} from "@/lib/predict/nbaTradeBallotDeadline";
import type { NbaTradeBallotOfficialTrade } from "@/lib/predict/nbaTradeBallotScoring";
import { nbaTeamIdFromBracketCode } from "@/lib/nba-bracket-code";

export type NbaConfirmedTrade = {
  id: string;
  /** 公式発表の日付（JST）`YYYY-MM-DD` */
  day: string;
  /** 公式発表の時刻（JST）`HH:mm`。不明なら null */
  time: string | null;
  /** BDL の選手 ID。未確認なら null（その場合は採点に入らない） */
  playerId: string | null;
  playerName: string;
  fromTeamAbbr: string;
  /** 移籍先（三角トレードは選手が最終的に入ったチーム） */
  toTeamAbbr: string;
  summaryJa: string;
  sourceLabel: string;
  sourceUrl: string;
};

export const NBA_CONFIRMED_TRADES_2026_27: readonly NbaConfirmedTrade[] = [
  {
    id: "2026-11-clifford-sac-okc",
    day: "2026-11-09",
    time: "05:47",
    playerId: null,
    playerName: "Nique Clifford",
    fromTeamAbbr: "SAC",
    toTeamAbbr: "OKC",
    summaryJa:
      "Thunder が Kings から Clifford を獲得。Kings は 2028 年 2 巡目（UTA 経由）と 2030 年 2 巡目（MIN 経由）を受け取る。",
    sourceLabel: "Sacramento Kings 公式リリース",
    sourceUrl: "https://kings.com/news/sacramento-kings-complete-trade",
  },
];

/** 受付期間（12/15 0:00 〜 TDL 終了）に入る発表か。JST の日付で判定 */
export function nbaConfirmedTradeCountsForBallot(
  trade: Pick<NbaConfirmedTrade, "day" | "time">
): boolean {
  const ms = Date.parse(`${trade.day}T${trade.time ?? "00:00"}:00+09:00`);
  if (!Number.isFinite(ms)) return false;
  return ms >= TRADE_BALLOT_OPEN_AT_MS && ms <= TRADE_BALLOT_TDL_END_AT_MS;
}

function tradeMs(trade: NbaConfirmedTrade): number {
  return Date.parse(`${trade.day}T${trade.time ?? "00:00"}:00+09:00`);
}

/**
 * 採点用の移籍一覧。受付期間内の移籍だけを使い、同じ選手は最初の 1 件で固定する。
 * playerId が無い移籍は採点に入らない（ID を入れるまで）。
 */
export function tradeBallotOfficialTradesFromConfirmed(
  trades: readonly NbaConfirmedTrade[] = NBA_CONFIRMED_TRADES_2026_27
): NbaTradeBallotOfficialTrade[] {
  const sorted = trades
    .filter((t) => t.playerId && nbaConfirmedTradeCountsForBallot(t))
    .slice()
    .sort((a, b) => tradeMs(a) - tradeMs(b));

  const seen = new Set<string>();
  const out: NbaTradeBallotOfficialTrade[] = [];
  for (const t of sorted) {
    const playerId = (t.playerId ?? "").trim();
    if (!playerId || seen.has(playerId)) continue;
    const toTeamId = nbaTeamIdFromBracketCode(t.toTeamAbbr);
    if (!toTeamId) continue;
    seen.add(playerId);
    out.push({ playerId, toTeamId });
  }
  return out;
}
