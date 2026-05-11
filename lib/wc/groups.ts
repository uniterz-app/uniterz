// lib/wc/groups.ts
//
// FIFA World Cup の本戦グループ分け。
// 抽選後に確定する固定情報なので Firestore ではなくコードで管理。
//
// 2026年大会から出場枠 48、グループ A〜L の 12 グループ × 各 4 チーム制。

export type WcGroupCode =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

export type WcGroupDef = {
  code: WcGroupCode;
  /** wc-{iso3 lower} 形式の teamId 4 つ */
  teamIds: [string, string, string, string];
};

/**
 * 2026 年 W杯本戦のグループ。抽選結果に基づく確定値。
 */
const WC_GROUPS_2026: Partial<Record<WcGroupCode, WcGroupDef>> = {
  A: {
    code: "A",
    teamIds: ["wc-mex", "wc-zaf", "wc-kor", "wc-cze"],
  },
  B: {
    code: "B",
    teamIds: ["wc-can", "wc-bih", "wc-qat", "wc-che"],
  },
  C: {
    code: "C",
    teamIds: ["wc-bra", "wc-mar", "wc-hti", "wc-sct"],
  },
  D: {
    code: "D",
    teamIds: ["wc-usa", "wc-pry", "wc-aus", "wc-tur"],
  },
  E: {
    code: "E",
    teamIds: ["wc-deu", "wc-civ", "wc-ecu", "wc-cuw"],
  },
  F: {
    code: "F",
    teamIds: ["wc-nld", "wc-jpn", "wc-swe", "wc-tun"],
  },
  G: {
    code: "G",
    teamIds: ["wc-bel", "wc-egy", "wc-irn", "wc-nzl"],
  },
  H: {
    code: "H",
    teamIds: ["wc-esp", "wc-cpv", "wc-sau", "wc-ury"],
  },
  I: {
    code: "I",
    teamIds: ["wc-fra", "wc-sen", "wc-irq", "wc-nor"],
  },
  J: {
    code: "J",
    teamIds: ["wc-arg", "wc-dza", "wc-aut", "wc-jor"],
  },
  K: {
    code: "K",
    teamIds: ["wc-prt", "wc-cod", "wc-uzb", "wc-col"],
  },
  L: {
    code: "L",
    teamIds: ["wc-eng", "wc-hrv", "wc-gha", "wc-pan"],
  },
};

/**
 * teamId からその国が属するグループを引く。未定義のチームは null。
 */
export function getWcGroupForTeam(teamId: string): WcGroupDef | null {
  for (const g of Object.values(WC_GROUPS_2026)) {
    if (g && g.teamIds.includes(teamId)) return g;
  }
  return null;
}

/**
 * グループコード（"C" など）から取得。
 */
export function getWcGroupByCode(code: WcGroupCode): WcGroupDef | null {
  return WC_GROUPS_2026[code] ?? null;
}
