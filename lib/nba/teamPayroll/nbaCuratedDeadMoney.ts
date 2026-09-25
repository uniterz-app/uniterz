/**
 * チームペイロールのデッドサラリー（waive / stretch 等）。
 * BDL は Active 契約行にしか載せないことが多いので curated で補完する。
 *
 * ストレッチは `throughSeasonKey` まで **同額** を各シーズンに載せる。
 * `throughSeasonKey` なし = その登録シーズンのみ。
 * 理由ラベルは UI 上英語（WAIVE / STRETCH）で統一。
 */
export type NbaCuratedDeadMoneyLine = {
  playerId: string;
  /** 表示名（例: D.CARTER） */
  name: string;
  /** ストレッチ年ごとのキャップヒット（同額） */
  capHit: number;
  /** デッドが続く最終シーズン（省略時は登録シーズンのみ） */
  throughSeasonKey?: string;
  noteJa?: string;
  noteEn?: string;
};

function seasonStartYear(seasonKey: string): number {
  const y = parseInt(String(seasonKey).split("-")[0] ?? "", 10);
  return Number.isFinite(y) ? y : 0;
}

function throughNote(
  throughSeasonKey: string | undefined
): Pick<NbaCuratedDeadMoneyLine, "noteJa" | "noteEn" | "throughSeasonKey"> {
  if (!throughSeasonKey) return {};
  const note = `STRETCH thru ${throughSeasonKey}`;
  return {
    throughSeasonKey,
    noteJa: note,
    noteEn: note,
  };
}

/**
 * 登録シーズン → teamId → dead lines。
 * ストレッチは `curatedDeadMoneyForTeam` が through まで同額で展開する。
 */
export const NBA_CURATED_DEAD_MONEY: Readonly<
  Record<string, Readonly<Record<string, readonly NbaCuratedDeadMoneyLine[]>>>
> = {
  "2026-27": {
    /** Devin Carter: SAC→ATL 後に waive。2026-27 ルーキースケールが ATL デッド */
    "nba-hawks": [
      {
        playerId: "1028025242",
        name: "D.CARTER",
        capHit: 5_158_080,
        noteJa: "WAIVE (rookie scale)",
        noteEn: "WAIVE (rookie scale)",
      },
    ],
    "nba-suns": [
      {
        playerId: "37",
        name: "B.BEAL",
        capHit: 19_383_010,
        ...throughNote("2029-30"),
      },
      {
        playerId: "666729",
        name: "N.LITTLE",
        capHit: 3_107_143,
        ...throughNote("2029-30"),
      },
      {
        playerId: "38017663",
        name: "E.LIDDELL",
        capHit: 706_898,
        noteJa: "2026-27 ONLY",
        noteEn: "2026-27 ONLY",
      },
    ],
    "nba-bucks": [
      {
        playerId: "278",
        name: "D.LILLARD",
        capHit: 22_516_603,
        ...throughNote("2029-30"),
      },
      {
        playerId: "4197029",
        name: "V.MICIC",
        capHit: 666_667,
        ...throughNote("2027-28"),
      },
    ],
    "nba-grizzlies": [
      {
        playerId: "81",
        name: "K.CALDWELL-POPE",
        capHit: 17_744_971,
        noteJa: "WAIVE",
        noteEn: "WAIVE",
      },
      {
        playerId: "3547251",
        name: "C.ANTHONY",
        capHit: 3_700_000,
        ...throughNote("2027-28"),
      },
      {
        playerId: "3547163",
        name: "M.DIAKITE",
        capHit: 464_050,
        noteJa: "2026-27 ONLY",
        noteEn: "2026-27 ONLY",
      },
    ],
    "nba-mavericks": [
      {
        playerId: "443",
        name: "K.THOMPSON",
        capHit: 7_660_317,
        noteJa: "WAIVE",
        noteEn: "WAIVE",
      },
      {
        playerId: "306",
        name: "J.MCGEE",
        capHit: 2_208_856,
        ...throughNote("2027-28"),
      },
      {
        playerId: "56677859",
        name: "O.PROSPER",
        capHit: 1_002_360,
        ...throughNote("2027-28"),
      },
    ],
    "nba-magic": [
      {
        playerId: "229",
        name: "J.ISAAC",
        capHit: 8_000_000,
        noteJa: "WAIVE",
        noteEn: "WAIVE",
      },
    ],
    "nba-bulls": [
      {
        playerId: "1057389374",
        name: "K.JONES",
        capHit: 1_075_459,
        noteJa: "WAIVE",
        noteEn: "WAIVE",
      },
    ],
    "nba-cavaliers": [
      {
        playerId: "404",
        name: "R.RUBIO",
        capHit: 424_672,
        noteJa: "2026-27 ONLY",
        noteEn: "2026-27 ONLY",
      },
    ],
    "nba-blazers": [
      {
        playerId: "4197307",
        name: "D.LOUZADA",
        capHit: 268_032,
        ...throughNote("2029-30"),
      },
    ],
  },
};

/** ストレッチ: 登録シーズン〜through まで同額 */
export function curatedDeadMoneyForTeam(
  seasonKey: string,
  teamId: string
): readonly NbaCuratedDeadMoneyLine[] {
  const key = seasonKey.trim();
  const tid = teamId.trim();
  const targetY = seasonStartYear(key);
  if (!key || !tid || targetY <= 0) return [];

  const out: NbaCuratedDeadMoneyLine[] = [];
  const seen = new Set<string>();

  for (const [startKey, byTeam] of Object.entries(NBA_CURATED_DEAD_MONEY)) {
    const startY = seasonStartYear(startKey);
    const lines = byTeam[tid] ?? [];
    for (const line of lines) {
      const throughKey = line.throughSeasonKey?.trim() || startKey;
      const throughY = seasonStartYear(throughKey);
      if (targetY < startY || targetY > throughY) continue;
      const id = String(line.playerId ?? "").trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(line);
    }
  }

  return out;
}

/** プレイヤー ID でデッドサラリー保有チームを探す（ストレッチ展開後） */
export function curatedDeadSalaryForPlayer(
  seasonKey: string,
  playerId: string
): {
  teamId: string;
  line: NbaCuratedDeadMoneyLine;
} | null {
  const id = String(playerId ?? "").trim();
  const key = seasonKey.trim();
  if (!id || !key) return null;

  const teamIds = new Set<string>();
  for (const byTeam of Object.values(NBA_CURATED_DEAD_MONEY)) {
    for (const tid of Object.keys(byTeam)) teamIds.add(tid);
  }
  for (const teamId of teamIds) {
    const hit = curatedDeadMoneyForTeam(key, teamId).find(
      (d) => String(d.playerId) === id
    );
    if (hit) return { teamId, line: hit };
  }
  return null;
}

/**
 * ロスターにいるが標準年俸を載せない選手（Exhibit 10 / キャンプ）。
 * 旧所属のルーキースケール等が BDL に残っていても $0 にする。
 */
export const NBA_CURATED_EXHIBIT10_PLAYER_IDS: Readonly<
  Record<string, readonly string[]>
> = {
  "2026-27": [
    "1028025242", // Devin Carter — BOS キャンプ / E10（ATL がデッド保有）
  ],
};

export function isCuratedExhibit10Player(
  playerId: string | number | null | undefined,
  seasonKey: string = "2026-27"
): boolean {
  const id = String(playerId ?? "").trim();
  if (!id) return false;
  return (NBA_CURATED_EXHIBIT10_PLAYER_IDS[seasonKey.trim()] ?? []).includes(id);
}
