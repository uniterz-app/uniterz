/**
 * FIFA World Cup 2026 本戦抽選ポット（確定値）
 * @see https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/procedures-pots-final-draw
 */

export type WcDrawPot = 1 | 2 | 3 | 4;

const WC_DRAW_POT_BY_TEAM: Record<string, WcDrawPot> = {
  // ポット1 — 開催国 + FIFAランク上位
  "wc-can": 1,
  "wc-mex": 1,
  "wc-usa": 1,
  "wc-esp": 1,
  "wc-arg": 1,
  "wc-fra": 1,
  "wc-eng": 1,
  "wc-bra": 1,
  "wc-prt": 1,
  "wc-nld": 1,
  "wc-bel": 1,
  "wc-deu": 1,
  // ポット2
  "wc-hrv": 2,
  "wc-mar": 2,
  "wc-col": 2,
  "wc-ury": 2,
  "wc-che": 2,
  "wc-jpn": 2,
  "wc-sen": 2,
  "wc-irn": 2,
  "wc-kor": 2,
  "wc-ecu": 2,
  "wc-aut": 2,
  "wc-aus": 2,
  // ポット3
  "wc-nor": 3,
  "wc-pan": 3,
  "wc-egy": 3,
  "wc-dza": 3,
  "wc-sct": 3,
  "wc-pry": 3,
  "wc-tun": 3,
  "wc-civ": 3,
  "wc-uzb": 3,
  "wc-qat": 3,
  "wc-sau": 3,
  "wc-zaf": 3,
  // ポット4
  "wc-jor": 4,
  "wc-cpv": 4,
  "wc-gha": 4,
  "wc-cuw": 4,
  "wc-hti": 4,
  "wc-nzl": 4,
  "wc-bih": 4,
  "wc-cze": 4,
  "wc-irq": 4,
  "wc-cod": 4,
  "wc-tur": 4,
};

export function getWcDrawPot(teamId: string | null | undefined): WcDrawPot | null {
  const id = teamId?.trim() ?? "";
  if (!id) return null;
  return WC_DRAW_POT_BY_TEAM[id] ?? null;
}

export function formatWcDrawPotLabel(pot: WcDrawPot): string {
  return `Pot ${pot}`;
}
