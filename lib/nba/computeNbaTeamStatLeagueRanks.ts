/** NBA team stat ranks within league (ties share rank). For GameTeamStats. */

export type NbaLeagueStatRanksByTeamId = Record<
  string,
  {
    ppg?: number;
    papg?: number;
    diff?: number;
    ofrtg?: number;
    dfrtg?: number;
    netrtg?: number;
  }
>;

export type NbaTeamStatRowInput = {
  id: string;
  gamesPlayed: number;
  pointsForTotal: number;
  pointsAgainstTotal: number;
  ofrtg?: number;
  dfrtg?: number;
  netrtg?: number;
};

function assignCompetitionRank(
  pairs: { id: string; value: number }[],
  higherIsBetter: boolean
): Map<string, number> {
  if (!pairs.length) return new Map();
  const sorted = [...pairs].sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value
  );
  const map = new Map<string, number>();
  let i = 0;
  while (i < sorted.length) {
    const v = sorted[i].value;
    let j = i;
    while (j < sorted.length && sorted[j].value === v) j++;
    const rank = i + 1;
    for (let k = i; k < j; k++) map.set(sorted[k].id, rank);
    i = j;
  }
  return map;
}

function mergeRank(
  acc: NbaLeagueStatRanksByTeamId,
  map: Map<string, number>,
  key: "ppg" | "papg" | "diff" | "ofrtg" | "dfrtg" | "netrtg"
) {
  map.forEach((rank, id) => {
    if (!acc[id]) acc[id] = {};
    acc[id][key] = rank;
  });
}

export function computeNbaTeamStatLeagueRanks(
  rows: NbaTeamStatRowInput[]
): NbaLeagueStatRanksByTeamId {
  const acc: NbaLeagueStatRanksByTeamId = {};
  const withGp = rows.filter((r) => r.gamesPlayed > 0);

  const ppgPairs = withGp.map((r) => ({
    id: r.id,
    value: r.pointsForTotal / r.gamesPlayed,
  }));
  mergeRank(acc, assignCompetitionRank(ppgPairs, true), "ppg");

  const papgPairs = withGp.map((r) => ({
    id: r.id,
    value: r.pointsAgainstTotal / r.gamesPlayed,
  }));
  mergeRank(acc, assignCompetitionRank(papgPairs, false), "papg");

  const diffPairs = withGp.map((r) => {
    const af = r.pointsForTotal / r.gamesPlayed;
    const aa = r.pointsAgainstTotal / r.gamesPlayed;
    return { id: r.id, value: af - aa };
  });
  mergeRank(acc, assignCompetitionRank(diffPairs, true), "diff");

  const ofrtgPairs = rows
    .filter((r) => typeof r.ofrtg === "number" && Number.isFinite(r.ofrtg))
    .map((r) => ({ id: r.id, value: r.ofrtg as number }));
  if (ofrtgPairs.length) {
    mergeRank(acc, assignCompetitionRank(ofrtgPairs, true), "ofrtg");
  }

  const dfrtgPairs = rows
    .filter((r) => typeof r.dfrtg === "number" && Number.isFinite(r.dfrtg))
    .map((r) => ({ id: r.id, value: r.dfrtg as number }));
  if (dfrtgPairs.length) {
    mergeRank(acc, assignCompetitionRank(dfrtgPairs, false), "dfrtg");
  }

  const netPairs = rows
    .filter((r) => typeof r.netrtg === "number" && Number.isFinite(r.netrtg))
    .map((r) => ({ id: r.id, value: r.netrtg as number }));
  if (netPairs.length) {
    mergeRank(acc, assignCompetitionRank(netPairs, true), "netrtg");
  }

  return acc;
}
