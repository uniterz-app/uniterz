// functions/src/ranking/updateTeamRankings.ts

import { getFirestore, FieldValue } from "firebase-admin/firestore";

import { compareNbaStandingsSeasonTiebreak } from "./nbaStandingsSeasonTiebreak";

const db = getFirestore();

type TeamRow = {
  id: string;
  wins: number;
  losses: number;
  draws: number;
  games: number;
  winRate: number;
  points: number;
  rankMetric: number;
  /** Lower sorts first (better rank) when rankMetric and wins tie; omit → last among ties, then teamId */
  tiebreakOrder: number;
};

function readTiebreakOrder(data: FirebaseFirestore.DocumentData): number {
  const v = data.standingsTiebreakOrder;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return Number.MAX_SAFE_INTEGER;
}

function normalizeConference(raw: unknown): "east" | "west" | null {
  if (typeof raw !== "string") return null;
  const u = raw.trim().toLowerCase();
  if (u === "east") return "east";
  if (u === "west") return "west";
  return null;
}

/** NBA / BJ: split by conference; missing conference → `_unassigned` bucket */
function rankGroupKey(league: string, conferenceRaw: unknown): string {
  const isBasket = league === "nba" || league === "bj";
  if (!isBasket) return league;
  const c = normalizeConference(conferenceRaw);
  if (c) return `${league}:${c}`;
  return `${league}:_unassigned`;
}

/**
 * チーム勝敗から順位を計算し、teams に rank / winRate / points を書き込む
 *
 * 【NBA / BJ（バスケ）】
 * - Group by conference (east / west), then within each group:
 *   1. winRate 降順（wins / (wins + losses)）
 *   2. wins 降順
 *   3. （NBA のみ）今季固定の対戦タイブレーク（nbaStandingsSeasonTiebreak）
 *   4. standingsTiebreakOrder 昇順（小さい方が上位）。未設定は同率内で最後、その後 teamId
 *   5. teamId アルファベット順
 * - conference未設定チームは `${league}:_unassigned` でまとめて同ルール
 *
 * 【J1 / PL（サッカー）】
 * - リーグ単位で
 *   1. 勝点 降順（wins * 3 + draws）
 *   2. wins 降順
 *   3. standingsTiebreakOrder 昇順（同上）
 *   4. teamId アルファベット順
 * - サッカーには NBA 対戦タイブレークは適用しない
 *
 * - `teams.rank`: ソートグループ内の順位。NBA/BJ は東西カンファレンスごとに 1〜15（30チーム全体の 1 位〜30 位ではない）
 */
export async function updateTeamRankings() {
  const teamsSnap = await db.collection("teams").get();

  const groups: Record<string, TeamRow[]> = {};

  teamsSnap.docs.forEach((doc) => {
    const data = doc.data();
    if (!data.league) return;

    const league = String(data.league);

    const wins = Number(data.wins || 0);
    const losses = Number(data.losses || 0);
    const draws = Number(data.d || data.draws || 0);

    const isSoccer = league === "j1" || league === "pl" || league === "wc";

    const games = isSoccer ? wins + losses + draws : wins + losses;

    const winRate = games > 0 ? wins / games : 0;

    const points = isSoccer ? wins * 3 + draws : 0;

    const rankMetric = isSoccer ? points : winRate;

    const tiebreakOrder = readTiebreakOrder(data);

    const gk = rankGroupKey(league, data.conference);

    if (!groups[gk]) groups[gk] = [];

    groups[gk].push({
      id: doc.id,
      wins,
      losses,
      draws,
      games,
      winRate,
      points,
      rankMetric,
      tiebreakOrder,
    });
  });

  const batch = db.batch();

  Object.keys(groups).forEach((gk) => {
    const teams = groups[gk];

    teams.sort((a, b) => {
      if (b.rankMetric !== a.rankMetric) {
        return b.rankMetric - a.rankMetric;
      }

      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      if (gk.startsWith("nba:")) {
        const seasonTb = compareNbaStandingsSeasonTiebreak(a.id, b.id);
        if (seasonTb !== 0) return seasonTb;
      }

      if (a.tiebreakOrder !== b.tiebreakOrder) {
        return a.tiebreakOrder - b.tiebreakOrder;
      }

      return a.id.localeCompare(b.id);
    });

    teams.forEach((team, index) => {
      const ref = db.collection("teams").doc(team.id);

      batch.update(ref, {
        rank: index + 1,
        winRate: team.winRate,
        points: team.points,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  });

  await batch.commit();

  return { ok: true };
}
