/**
 * リザルトカード上辺のラウンド表示（例: CF GAME6 / R2 GAME3 / FINALS GAME1）。
 * 試合カードの games.roundLabel + playoffRound を結果投稿側でも同じ粒度で出す。
 */

export type ResultRoundLabelSource = {
  roundLabel?: unknown;
  playoffRound?: unknown;
  seasonRound?: unknown;
  seasonPhase?: unknown;
};

function playoffRoundAbbrev(v: unknown): string | null {
  const s = String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
  if (!s) return null;
  if (s === "r1" || s === "1st" || s === "firstround") return "R1";
  if (s === "r2" || s === "2nd" || s === "secondround" || s === "semifinals")
    return "R2";
  if (s === "cf" || s === "conferencefinals" || s === "conferencefinal")
    return "CF";
  if (s === "finals" || s === "final" || s === "nba finals") return "FINALS";
  if (s === "overall") return null;
  return null;
}

function extractGameNumber(roundLabel: string): number | null {
  const m = roundLabel.match(/GAME\s*#?\s*(\d+)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeLooseRoundLabel(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .replace(/GAME\s+(\d+)/g, "GAME$1");
}

/** post / game からカード上辺ラベルを決定 */
export function formatResultRoundLabel(
  source: ResultRoundLabelSource
): string {
  const roundLabel =
    typeof source.roundLabel === "string" ? source.roundLabel.trim() : "";
  const playoffKey = source.playoffRound ?? source.seasonRound;
  const abbrev = playoffRoundAbbrev(playoffKey);
  const gameN = roundLabel ? extractGameNumber(roundLabel) : null;

  if (abbrev && gameN != null) {
    return `${abbrev} GAME${gameN}`;
  }
  if (abbrev) {
    if (roundLabel) {
      const swapped = normalizeLooseRoundLabel(
        roundLabel.replace(/PLAY\s*-?\s*OFFS?/gi, abbrev)
      );
      if (swapped && swapped !== "MATCH" && !/^PLAYOFFS?$/i.test(swapped)) {
        return swapped;
      }
    }
    return abbrev;
  }

  if (roundLabel) {
    const normalized = normalizeLooseRoundLabel(roundLabel);
    if (normalized) return normalized;
  }

  const seasonRound = source.seasonRound;
  if (typeof seasonRound === "string" && seasonRound.trim()) {
    const abbr = playoffRoundAbbrev(seasonRound);
    if (abbr) return abbr;
    return seasonRound.trim().toUpperCase();
  }
  if (typeof seasonRound === "number" && Number.isFinite(seasonRound)) {
    return `ROUND ${seasonRound}`;
  }

  const phase = source.seasonPhase;
  if (typeof phase === "string" && phase.trim()) {
    return phase.trim().toUpperCase();
  }

  return "MATCH";
}
