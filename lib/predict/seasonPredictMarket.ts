/**
 * シーズン予想マーケット（締切後）— 集計型。
 * 順位: フル平均予想表 + 行タップで 1–3 / 4–6 / 7–9 / 10–12 / 13–15 分布。
 * アワード: 賞ごと Top5。
 */

import type { UiStrings } from "@/lib/i18n/ui";
import {
  NBA_STANDINGS_RANKS,
  type NbaConferenceId,
} from "@/lib/nba/nbaConferenceTeams";
import type { NbaAwardId } from "@/lib/predict/nbaSeasonAwardsPredict";

/** 「2–6」「1–3」など数字だけの帯は全言語同じ表記 */
function numericBandLabel(range: string): UiStrings {
  return {
    ja: range,
    en: range,
    ko: range,
    zh: range,
    es: range,
    pt: range,
    fr: range,
  };
}

/** 順位帯（粗い帯・レガシー） */
export type SeasonStandingsMarketBandId =
  | "first"
  | "straight"
  | "playin"
  | "out";

export const SEASON_STANDINGS_MARKET_BANDS: readonly {
  id: SeasonStandingsMarketBandId;
  label: UiStrings;
  ranks: readonly number[];
  color: string;
}[] = [
  {
    id: "first",
    label: {
      ja: "1位",
      en: "1st",
      ko: "1위",
      zh: "第1名",
      es: "1.º",
      pt: "1.º",
      fr: "1er",
    },
    ranks: [1],
    color: "#00E5FF",
  },
  {
    id: "straight",
    label: numericBandLabel("2–6"),
    ranks: [2, 3, 4, 5, 6],
    color: "#67E8F9",
  },
  {
    id: "playin",
    label: numericBandLabel("7–10"),
    ranks: [7, 8, 9, 10],
    color: "#2DFF6E",
  },
  {
    id: "out",
    label: numericBandLabel("11–15"),
    ranks: [11, 12, 13, 14, 15],
    color: "rgba(255,255,255,0.28)",
  },
] as const;

/** 行展開用の細帯（3位ずつ） */
export type SeasonStandingsDetailBandId =
  | "b1_3"
  | "b4_6"
  | "b7_9"
  | "b10_12"
  | "b13_15";

export const SEASON_STANDINGS_DETAIL_BANDS: readonly {
  id: SeasonStandingsDetailBandId;
  label: UiStrings;
  ranks: readonly number[];
  color: string;
}[] = [
  {
    id: "b1_3",
    label: numericBandLabel("1–3"),
    ranks: [1, 2, 3],
    color: "#00E5FF",
  },
  {
    id: "b4_6",
    label: numericBandLabel("4–6"),
    ranks: [4, 5, 6],
    color: "#67E8F9",
  },
  {
    id: "b7_9",
    label: numericBandLabel("7–9"),
    ranks: [7, 8, 9],
    color: "#2DFF6E",
  },
  {
    id: "b10_12",
    label: numericBandLabel("10–12"),
    ranks: [10, 11, 12],
    color: "#F5C518",
  },
  {
    id: "b13_15",
    label: numericBandLabel("13–15"),
    ranks: [13, 14, 15],
    color: "rgba(255,255,255,0.32)",
  },
] as const;

export type SeasonStandingsTeamMarketRow = {
  teamId: string;
  conference: NbaConferenceId;
  picks: number;
  modeRank: number;
  modePct: number;
  rankPct: readonly number[];
  bandPct: Readonly<Record<SeasonStandingsMarketBandId, number>>;
};

export type SeasonStandingsConsensusSlot = {
  rank: number;
  teamId: string;
  pct: number;
  picks: number;
};

/** 平均予想で並べた順位表の1行（各チームは1回だけ） */
export type SeasonStandingsCrowdBoardRow = {
  boardRank: number;
  teamId: string;
  avgRank: number;
  modeRank: number;
  modePct: number;
  /** 展開用: 1–3 … 13–15 */
  detailBandPct: Readonly<Record<SeasonStandingsDetailBandId, number>>;
};

export type SeasonStandingsMarketSnapshot = {
  season: string;
  submissionCount: number;
  builtAtMs: number;
  east: readonly SeasonStandingsTeamMarketRow[];
  west: readonly SeasonStandingsTeamMarketRow[];
};

export type SeasonAwardsMarketPickRow = {
  candidateId: string;
  name: string;
  teamAbbr: string | null;
  pct: number;
  picks: number;
};

export type SeasonAwardsMarketAwardBlock = {
  awardId: NbaAwardId;
  /** MVP / DPOY … 言語非依存の略号 */
  labelEn: string;
  /** 賞の正式名（7言語） */
  name: UiStrings;
  top: readonly SeasonAwardsMarketPickRow[];
};

export type SeasonAwardsMarketSnapshot = {
  season: string;
  submissionCount: number;
  builtAtMs: number;
  awards: readonly SeasonAwardsMarketAwardBlock[];
};

export function bandIdForStandingsRank(
  rank: number
): SeasonStandingsMarketBandId {
  if (rank <= 1) return "first";
  if (rank <= 6) return "straight";
  if (rank <= 10) return "playin";
  return "out";
}

export function standingsBandWidths(
  bandPct: Readonly<Record<SeasonStandingsMarketBandId, number>>
): readonly { id: SeasonStandingsMarketBandId; pct: number; color: string }[] {
  return SEASON_STANDINGS_MARKET_BANDS.map((b) => ({
    id: b.id,
    pct: bandPct[b.id] ?? 0,
    color: b.color,
  }));
}

/** rankPct[0]=1位 … から細帯シェアを合成 */
export function standingsDetailBandPct(
  rankPct: readonly number[]
): Record<SeasonStandingsDetailBandId, number> {
  const out: Record<SeasonStandingsDetailBandId, number> = {
    b1_3: 0,
    b4_6: 0,
    b7_9: 0,
    b10_12: 0,
    b13_15: 0,
  };
  for (const band of SEASON_STANDINGS_DETAIL_BANDS) {
    let sum = 0;
    for (const r of band.ranks) {
      sum += rankPct[r - 1] ?? 0;
    }
    out[band.id] = Math.round(sum * 10) / 10;
  }
  return out;
}

export function standingsDetailBandWidths(
  detailBandPct: Readonly<Record<SeasonStandingsDetailBandId, number>>
): readonly {
  id: SeasonStandingsDetailBandId;
  label: UiStrings;
  pct: number;
  color: string;
}[] {
  return SEASON_STANDINGS_DETAIL_BANDS.map((b) => ({
    id: b.id,
    label: b.label,
    pct: detailBandPct[b.id] ?? 0,
    color: b.color,
  }));
}

export type SeasonStandingsMarketPickRow = {
  teamId: string;
  pct: number;
  picks: number;
};

export function buildStandingsTopByRankSlot(
  rows: readonly SeasonStandingsTeamMarketRow[],
  rank: number,
  submissionCount: number,
  topN = 5
): readonly SeasonStandingsMarketPickRow[] {
  const idx = Math.max(0, Math.min(NBA_STANDINGS_RANKS, rank) - 1);
  const n = Math.max(1, submissionCount);
  return [...rows]
    .map((row) => {
      const pct = Math.round((row.rankPct[idx] ?? 0) * 10) / 10;
      return {
        teamId: row.teamId,
        pct,
        picks: Math.round((pct / 100) * n),
      };
    })
    .sort((a, b) => {
      if (b.pct !== a.pct) return b.pct - a.pct;
      return a.teamId.localeCompare(b.teamId);
    })
    .slice(0, topN);
}

export function buildStandingsTopByBand(
  rows: readonly SeasonStandingsTeamMarketRow[],
  bandId: SeasonStandingsMarketBandId,
  submissionCount: number,
  topN = 5
): readonly SeasonStandingsMarketPickRow[] {
  const n = Math.max(1, submissionCount);
  return [...rows]
    .map((row) => {
      const pct = Math.round((row.bandPct[bandId] ?? 0) * 10) / 10;
      return {
        teamId: row.teamId,
        pct,
        picks: Math.round((pct / 100) * n),
      };
    })
    .sort((a, b) => {
      if (b.pct !== a.pct) return b.pct - a.pct;
      return a.teamId.localeCompare(b.teamId);
    })
    .slice(0, topN);
}

/**
 * チーム別分布から「平均予想順位表」を作る。
 * 各チームは1回だけ。avgRank 昇順で boardRank 1–15 に並べる。
 */
export function buildStandingsCrowdBoard(
  rows: readonly SeasonStandingsTeamMarketRow[]
): readonly SeasonStandingsCrowdBoardRow[] {
  const scored = rows.map((row) => {
    let sum = 0;
    for (let i = 0; i < row.rankPct.length; i += 1) {
      sum += (i + 1) * (row.rankPct[i] ?? 0);
    }
    const avgRank = Math.round((sum / 100) * 10) / 10;
    return { row, avgRank };
  });

  scored.sort((a, b) => {
    if (a.avgRank !== b.avgRank) return a.avgRank - b.avgRank;
    if (b.row.modePct !== a.row.modePct) return b.row.modePct - a.row.modePct;
    return a.row.teamId.localeCompare(b.row.teamId);
  });

  return scored.map((s, i) => ({
    boardRank: i + 1,
    teamId: s.row.teamId,
    avgRank: s.avgRank,
    modeRank: s.row.modeRank,
    modePct: s.row.modePct,
    detailBandPct: standingsDetailBandPct(s.row.rankPct),
  }));
}

export function buildStandingsConsensusSlots(
  rows: readonly SeasonStandingsTeamMarketRow[],
  submissionCount: number
): readonly SeasonStandingsConsensusSlot[] {
  const slots: SeasonStandingsConsensusSlot[] = [];
  const n = Math.max(1, submissionCount);

  for (let rank = 1; rank <= NBA_STANDINGS_RANKS; rank += 1) {
    let best: SeasonStandingsTeamMarketRow | null = null;
    let bestPct = -1;
    for (const row of rows) {
      const pct = row.rankPct[rank - 1] ?? 0;
      if (
        pct > bestPct ||
        (pct === bestPct &&
          best != null &&
          row.teamId.localeCompare(best.teamId) < 0)
      ) {
        bestPct = pct;
        best = row;
      }
    }
    if (!best) continue;
    slots.push({
      rank,
      teamId: best.teamId,
      pct: Math.round(bestPct * 10) / 10,
      picks: Math.round((bestPct / 100) * n),
    });
  }

  return slots;
}
