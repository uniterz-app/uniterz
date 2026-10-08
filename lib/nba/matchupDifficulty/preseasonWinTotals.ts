/**
 * 開幕前のレギュラーシーズン勝ち星 O/U ライン（チーム略称キー）。
 * Matchup Difficulty の開幕前 prior に使う。毎年開幕前に1回追記する。
 *
 * 出典:
 * - 2021-22〜2025-26: Basketball-Reference「NBA_{年}_preseason_odds」の W-L O/U
 * - 2026-27: Boyd's Bets のコンセンサス（2026-10-05 時点。MIN / CLE / HOU は BetFirm 集計）
 */
export const NBA_PRESEASON_WIN_TOTALS: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  "2021-22": {
    BKN: 56.5, LAL: 52.5, MIL: 54.5, GSW: 48.5, PHX: 51.5, UTA: 52.5, PHI: 50.5, LAC: 45.5,
    DEN: 47.5, MIA: 48.5, DAL: 48.5, ATL: 47.5, BOS: 45.5, POR: 44.5, CHI: 42.5, NYK: 41.5,
    MEM: 41.5, IND: 42.5, NOP: 39.5, CHA: 38.5, WAS: 33.5, TOR: 35.5, SAC: 36.5, MIN: 35.5,
    SAS: 28.5, CLE: 26.5, ORL: 22.5, OKC: 23.5, DET: 24.5, HOU: 27.5,
  },
  "2022-23": {
    BOS: 54.5, GSW: 52.5, MIL: 53.5, BKN: 50.5, LAC: 52.5, PHX: 52.5, PHI: 50.5, MIA: 49.5,
    DEN: 51.5, LAL: 44.5, MEM: 49.5, DAL: 48.5, MIN: 49.5, CLE: 46.5, TOR: 46.5, CHI: 41.5,
    NOP: 45.5, ATL: 46.5, NYK: 38.5, POR: 39.5, CHA: 34.5, WAS: 35.5, DET: 29.5, OKC: 23.5,
    ORL: 26.5, IND: 24.5, SAC: 34.5, SAS: 22.5, HOU: 23.5, UTA: 23.5,
  },
  "2023-24": {
    BOS: 54.5, DEN: 52.5, PHX: 51.5, MIL: 54.5, GSW: 48.5, LAL: 47.5, MIA: 45.5, PHI: 48.5,
    LAC: 46.5, MEM: 45.5, DAL: 45.5, CLE: 50.5, SAC: 44.5, NOP: 44.5, NYK: 45.5, MIN: 44.5,
    ATL: 42.5, TOR: 36.5, OKC: 44.5, CHI: 37.5, BKN: 37.5, POR: 28.5, SAS: 28.5, UTA: 35.5,
    ORL: 37.5, IND: 38.5, HOU: 31.5, WAS: 24.5, CHA: 31.5, DET: 28.5,
  },
  "2024-25": {
    BOS: 58.5, OKC: 57.5, NYK: 53.5, PHI: 50.5, DAL: 49.5, DEN: 51.5, MIN: 51.5, MIL: 49.5,
    PHX: 48.5, CLE: 48.5, MEM: 47.5, ORL: 47.5, GSW: 43.5, LAL: 43.5, MIA: 44.5, NOP: 46.5,
    IND: 46.5, SAC: 46.5, HOU: 43.5, LAC: 35.5, SAS: 35.5, ATL: 36.5, UTA: 28.5, DET: 25.5,
    CHA: 30.5, CHI: 28.5, BKN: 19.5, POR: 21.5, TOR: 29.5, WAS: 20.5,
  },
  "2025-26": {
    OKC: 62.5, DEN: 53.5, CLE: 56.5, NYK: 53.5, MIN: 49.5, HOU: 52.5, LAL: 46.5, LAC: 49.5,
    ORL: 51.5, GSW: 47.5, DET: 46.5, DAL: 41.5, PHI: 43.5, ATL: 46.5, MIL: 43.5, BOS: 41.5,
    SAS: 44.5, IND: 37.5, TOR: 39.5, MEM: 39.5, MIA: 37.5, NOP: 30.5, PHX: 30.5, POR: 35.5,
    SAC: 35.5, CHI: 33.5, CHA: 27.5, BKN: 19.5, UTA: 18.5, WAS: 20.5,
  },
  "2026-27": {
    OKC: 61.5, SAS: 59.5, NYK: 52.5, PHI: 50.5, BOS: 50.5, DET: 49.5, DEN: 48.5, MIN: 48.5,
    CLE: 47.5, HOU: 47.5, TOR: 46.5, MIA: 45.5, LAL: 45.5, ATL: 43.5, ORL: 43.5, IND: 43.5,
    POR: 41.5, PHX: 40.5, CHA: 39.5, UTA: 37.5, GSW: 37.5, WAS: 34.5, DAL: 33.5, CHI: 28.5,
    LAC: 28.5, MEM: 28.5, NOP: 28.5, MIL: 25.5, BKN: 24.5, SAC: 20.5,
  },
};

/**
 * ライン − その季の全チーム平均（ブックの取り分でライン合計は 1230 勝より大きい）。
 * その季のラインが無い、またはチームが無ければ null。
 */
export function preseasonWinTotalCentered(seasonKey: string, teamAbbr: string): number | null {
  const season = NBA_PRESEASON_WIN_TOTALS[seasonKey];
  const value = season?.[teamAbbr.toUpperCase()];
  if (!season || typeof value !== "number" || !Number.isFinite(value)) return null;
  const all = Object.values(season);
  return value - all.reduce((a, b) => a + b, 0) / all.length;
}
