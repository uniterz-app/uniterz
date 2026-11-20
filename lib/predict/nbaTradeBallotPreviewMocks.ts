/**
 * トレードバレット DEV モック — Featured / 提出済み / マーケット。
 * 名簿本体は team-rosters。保存・集計は未接続。
 */
import { TEAM_SHORT } from "@/lib/team-short";
import { AWARDS_PREVIEW_PLAYERS } from "@/lib/predict/nbaSeasonAwardsPreviewMocks";
import {
  TRADE_BALLOT_SLOT_COUNT,
  type NbaTradeBallotPrediction,
} from "@/lib/predict/nbaTradeBallotPredict";
import type { NbaTradeBallotMarketSnapshot } from "@/lib/predict/nbaTradeBallotMarket";
import type { NbaTradeBallotOfficialTrade } from "@/lib/predict/nbaTradeBallotScoring";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export const TRADE_BALLOT_CURATED_FEATURED_IDS: readonly string[] = [
  "419", // Anfernee Simons
  "132", // Luka Doncic（過去例・検索確認用）
  "666682", // Keldon Johnson
  "17896076", // Evan Mobley
  "3547276", // Payton Pritchard
  "56677823", // Brandon Miller
  "1028029127", // Kel'el Ware
  "1028037477", // Ajay Mitchell
];

const MOCK_DEST_TEAM_IDS = [
  "nba-lakers",
  "nba-knicks",
  "nba-heat",
  "nba-warriors",
  "nba-mavericks",
  "nba-suns",
  "nba-bucks",
  "nba-celtics",
  "nba-rockets",
  "nba-spurs",
] as const;

/** 提出後ビュー用の固定モック（7 枠） */
export const MOCK_SUBMITTED_TRADE_BALLOT: NbaTradeBallotPrediction = {
  season: CURRENT_NBA_SEASON_KEY,
  picks: [
    { playerId: "419", toTeamId: "nba-lakers" },
    { playerId: "666682", toTeamId: "nba-knicks" },
    { playerId: "17896076", toTeamId: "nba-heat" },
    { playerId: "3547276", toTeamId: "nba-warriors" },
    { playerId: "56677823", toTeamId: "nba-mavericks" },
    { playerId: "1028029127", toTeamId: "nba-suns" },
    { playerId: "1028037477", toTeamId: "nba-bucks" },
  ].slice(0, TRADE_BALLOT_SLOT_COUNT),
};

/**
 * 採点プレビュー用の「実際の移籍」。
 * 7 枠のうち 4 選手当たり・うち 2 チーム当たり、という差が付く想定。
 */
export const MOCK_OFFICIAL_TRADE_BALLOT_RESULTS: readonly NbaTradeBallotOfficialTrade[] =
  [
    { playerId: "419", toTeamId: "nba-lakers" }, // チームまで当たり
    { playerId: "666682", toTeamId: "nba-heat" }, // 選手だけ（行き先違い）
    { playerId: "17896076", toTeamId: "nba-heat" }, // チームまで当たり
    { playerId: "56677823", toTeamId: "nba-clippers" }, // 選手だけ
    // 3547276 / Ware / Mitchell は移籍なし → MISS
  ];

/** 締切時点の投票率モック（%）→ 少数派 +0/+5/+10/+20/+30 */
export const MOCK_TRADE_BALLOT_VOTE_PCT: Readonly<Record<string, number>> = {
  "419": 38, // +5（25–50%）
  "666682": 12, // +10（10–25%）
  "17896076": 6, // +20（3–10%）
  "3547276": 55, // +0（50%+）
  "56677823": 2.4, // +30（<3%）
  "1028029127": 18, // +10
  "1028037477": 9, // +20
};

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function abbrOf(teamId: string): string {
  return (TEAM_SHORT[teamId] ?? teamId.replace(/^nba-/, "")).toUpperCase();
}

/** みんなの予想プレビュー用マーケット */
export function buildTradeBallotMarketPreviewMock(
  season: string = CURRENT_NBA_SEASON_KEY
): NbaTradeBallotMarketSnapshot {
  const submissionCount = 612;
  const rand = mulberry32(0x7a7eba11 ^ hashId(season));
  const pool = [...AWARDS_PREVIEW_PLAYERS];

  // Featured を先頭に寄せつつ、残りを混ぜる
  const featured = TRADE_BALLOT_CURATED_FEATURED_IDS.map((id) =>
    pool.find((p) => p.id === id)
  ).filter(Boolean) as typeof pool;
  const rest = pool.filter(
    (p) => !TRADE_BALLOT_CURATED_FEATURED_IDS.includes(p.id)
  );
  const ordered = [...featured, ...rest].slice(0, 12);

  const rawWeights = ordered.map((_, i) => {
    const base = Math.max(0.08, 0.42 - i * 0.028);
    return base * (0.75 + rand() * 0.55);
  });
  const weightSum = rawWeights.reduce((a, b) => a + b, 0) || 1;

  const players = ordered.map((p, i) => {
    const share = rawWeights[i]! / weightSum;
    // 1 人あたり最大でも提出の ~55% くらいに抑える（7 枠あるので合計は 700%）
    const pct = Math.round(share * 55 * 10) / 10;
    const picks = Math.max(8, Math.round((pct / 100) * submissionCount));

    const destWeights = MOCK_DEST_TEAM_IDS.map(() => 0.35 + rand());
    const destSum = destWeights.reduce((a, b) => a + b, 0) || 1;
    const destinations = MOCK_DEST_TEAM_IDS.map((teamId, di) => {
      const dPct = Math.round((destWeights[di]! / destSum) * 1000) / 10;
      return {
        teamId,
        teamAbbr: abbrOf(teamId),
        pct: dPct,
        picks: Math.max(1, Math.round((dPct / 100) * picks)),
      };
    })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);

    // 行き先 % を合計 100 に寄せない（上位 3 だけ表示）
    return {
      playerId: p.id,
      name: `${p.firstName} ${p.lastName}`.trim(),
      fromTeamAbbr: p.teamAbbr ?? null,
      pct,
      picks,
      destinations,
    };
  });

  players.sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name, "en"));

  return {
    season,
    submissionCount,
    builtAtMs: Date.now(),
    players,
  };
}
