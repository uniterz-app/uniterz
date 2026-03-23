import { onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase";
import type { SeriesId } from "./playoffBracketTypes";
import type { Bracket } from "./scorePlayoffBracket";

type MarketCountMap = Record<string, number>;

type TeamProgressMap = {
  R2: MarketCountMap;
  CF: MarketCountMap;
  FINALS: MarketCountMap;
  CHAMPION: MarketCountMap;
};

type MatchupMarketItem = {
  total: number;
  winnerPickCounts: MarketCountMap;
  gamesPickCounts: MarketCountMap;
};

type MatchupMarketMap = Record<string, MatchupMarketItem>;

type Round1SeriesMarketMap = Record<
  string,
  {
    winnerPickCounts: MarketCountMap;
    gamesPickCounts: MarketCountMap;
  }
>;

function inc(map: MarketCountMap, key?: string | null, amount = 1) {
  if (!key) return;
  map[key] = (map[key] ?? 0) + amount;
}

function incNestedWinner(
  target: Round1SeriesMarketMap,
  seriesId: string,
  winner?: string | null
) {
  if (!target[seriesId]) {
    target[seriesId] = {
      winnerPickCounts: {},
      gamesPickCounts: {},
    };
  }
  inc(target[seriesId].winnerPickCounts, winner);
}

function incNestedGames(
  target: Round1SeriesMarketMap,
  seriesId: string,
  games?: number | string | null
) {
  if (games == null || games === "") return;
  if (!target[seriesId]) {
    target[seriesId] = {
      winnerPickCounts: {},
      gamesPickCounts: {},
    };
  }
  inc(target[seriesId].gamesPickCounts, String(games));
}

function getPredWinner(prediction: Bracket, seriesId: SeriesId) {
  return prediction[seriesId]?.winner ?? null;
}

function getPredGames(prediction: Bracket, seriesId: SeriesId) {
  return prediction[seriesId]?.games ?? null;
}

function makeMatchupKey(round: "R2" | "CF" | "FINALS", a?: string | null, b?: string | null) {
  if (!a || !b) return null;
  const [t1, t2] = [a, b].sort();
  return `${round}|${t1}|${t2}`;
}

function ensureMatchupItem(target: MatchupMarketMap, matchupKey: string) {
  if (!target[matchupKey]) {
    target[matchupKey] = {
      total: 0,
      winnerPickCounts: {},
      gamesPickCounts: {},
    };
  }
  return target[matchupKey];
}

function addMatchupMarket(
  target: MatchupMarketMap,
  round: "R2" | "CF" | "FINALS",
  teamA?: string | null,
  teamB?: string | null,
  pickedWinner?: string | null,
  pickedGames?: number | string | null
) {
  const matchupKey = makeMatchupKey(round, teamA, teamB);
  if (!matchupKey) return;

  const item = ensureMatchupItem(target, matchupKey);
  item.total += 1;
  inc(item.winnerPickCounts, pickedWinner);
  if (pickedGames != null && pickedGames !== "") {
    inc(item.gamesPickCounts, String(pickedGames));
  }
}

export const rebuildPlayoffBracketMarket = onCall(async (request) => {
  const season = String(request.data?.season ?? "").trim();

  if (!season) {
    throw new Error("season is required");
  }

  const bracketsSnap = await db
    .collection("playoffBrackets")
    .where("season", "==", season)
    .get();

  const championPickCounts: MarketCountMap = {};
  const round1SeriesMarkets: Round1SeriesMarketMap = {};

  const teamProgressMarkets: TeamProgressMap = {
    R2: {},
    CF: {},
    FINALS: {},
    CHAMPION: {},
  };

  const matchupMarkets = {
    R2: {} as MatchupMarketMap,
    CF: {} as MatchupMarketMap,
    FINALS: {} as MatchupMarketMap,
  };

  let totalEntries = 0;

  for (const docSnap of bracketsSnap.docs) {
    const data = docSnap.data();
    const bracket = (data.bracket ?? {}) as Bracket;

    totalEntries += 1;

    // champion
    inc(championPickCounts, getPredWinner(bracket, "FINALS"));

    // Round 1 fixed series markets
    const round1Ids: SeriesId[] = [
      "R1_E1",
      "R1_E2",
      "R1_E3",
      "R1_E4",
      "R1_W1",
      "R1_W2",
      "R1_W3",
      "R1_W4",
    ];

    for (const id of round1Ids) {
      incNestedWinner(round1SeriesMarkets, id, getPredWinner(bracket, id));
      incNestedGames(round1SeriesMarkets, id, getPredGames(bracket, id));
    }

    // Advancement to R2 = Round 1 winners
    const r1e1 = getPredWinner(bracket, "R1_E1");
    const r1e2 = getPredWinner(bracket, "R1_E2");
    const r1e3 = getPredWinner(bracket, "R1_E3");
    const r1e4 = getPredWinner(bracket, "R1_E4");
    const r1w1 = getPredWinner(bracket, "R1_W1");
    const r1w2 = getPredWinner(bracket, "R1_W2");
    const r1w3 = getPredWinner(bracket, "R1_W3");
    const r1w4 = getPredWinner(bracket, "R1_W4");

    [r1e1, r1e2, r1e3, r1e4, r1w1, r1w2, r1w3, r1w4].forEach((team) => {
      inc(teamProgressMarkets.R2, team);
    });

    // R2 matchup markets
    addMatchupMarket(
      matchupMarkets.R2,
      "R2",
      r1e1,
      r1e2,
      getPredWinner(bracket, "R2_E1"),
      getPredGames(bracket, "R2_E1")
    );
    addMatchupMarket(
      matchupMarkets.R2,
      "R2",
      r1e3,
      r1e4,
      getPredWinner(bracket, "R2_E2"),
      getPredGames(bracket, "R2_E2")
    );
    addMatchupMarket(
      matchupMarkets.R2,
      "R2",
      r1w1,
      r1w2,
      getPredWinner(bracket, "R2_W1"),
      getPredGames(bracket, "R2_W1")
    );
    addMatchupMarket(
      matchupMarkets.R2,
      "R2",
      r1w3,
      r1w4,
      getPredWinner(bracket, "R2_W2"),
      getPredGames(bracket, "R2_W2")
    );

    // Advancement to CF = R2 winners
    const r2e1 = getPredWinner(bracket, "R2_E1");
    const r2e2 = getPredWinner(bracket, "R2_E2");
    const r2w1 = getPredWinner(bracket, "R2_W1");
    const r2w2 = getPredWinner(bracket, "R2_W2");

    [r2e1, r2e2, r2w1, r2w2].forEach((team) => {
      inc(teamProgressMarkets.CF, team);
    });

    // CF matchup markets
    addMatchupMarket(
      matchupMarkets.CF,
      "CF",
      r2e1,
      r2e2,
      getPredWinner(bracket, "CF_E"),
      getPredGames(bracket, "CF_E")
    );
    addMatchupMarket(
      matchupMarkets.CF,
      "CF",
      r2w1,
      r2w2,
      getPredWinner(bracket, "CF_W"),
      getPredGames(bracket, "CF_W")
    );

    // Advancement to FINALS = CF winners
    const cfe = getPredWinner(bracket, "CF_E");
    const cfw = getPredWinner(bracket, "CF_W");

    [cfe, cfw].forEach((team) => {
      inc(teamProgressMarkets.FINALS, team);
    });

    // FINALS matchup market
    addMatchupMarket(
      matchupMarkets.FINALS,
      "FINALS",
      cfe,
      cfw,
      getPredWinner(bracket, "FINALS"),
      getPredGames(bracket, "FINALS")
    );

    // Champion
    inc(teamProgressMarkets.CHAMPION, getPredWinner(bracket, "FINALS"));
  }

  await db
    .collection("playoffBracketMarket")
    .doc(season)
    .set(
      {
        season,
        totalEntries,
        championPickCounts,
        round1SeriesMarkets,
        teamProgressMarkets,
        matchupMarkets,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  return {
    ok: true,
    season,
    totalEntries,
  };
});