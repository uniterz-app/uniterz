import {
  nbaRegularSeasonWinsLosses,
  type NbaTeamRecordFields,
} from "@/lib/nbaRegularSeasonRecord";

/** NbaStandingsPanel の Conference と同じ会議室キー */
function normalizeConference(v: unknown): "east" | "west" {
  if (v === "EAST" || v === "east") return "east";
  return "west";
}

export type NbaTeamDocForConferenceRank = NbaTeamRecordFields & {
  id: string;
  conference?: unknown;
};

/**
 * スタンディング（会議室内）と同じソートで、各チームの conference 内順位 1.. を返す。
 */
export function nbaConferenceRankByTeamId(
  teams: NbaTeamDocForConferenceRank[]
): Record<string, number> {
  const byConf: Record<"east" | "west", NbaTeamDocForConferenceRank[]> = {
    east: [],
    west: [],
  };
  for (const t of teams) {
    byConf[normalizeConference(t.conference)].push(t);
  }
  const out: Record<string, number> = {};
  for (const conf of ["east", "west"] as const) {
    const sorted = [...byConf[conf]].sort((a, b) => {
      const { wins: aw, losses: al } = nbaRegularSeasonWinsLosses(a);
      const { wins: bw, losses: bl } = nbaRegularSeasonWinsLosses(b);
      const ar = aw + al > 0 ? aw / (aw + al) : 0;
      const br = bw + bl > 0 ? bw / (bw + bl) : 0;
      if (ar !== br) return br - ar;
      if (aw !== bw) return bw - aw;
      return String(a.id).localeCompare(String(b.id));
    });
    sorted.forEach((t, i) => {
      out[t.id] = i + 1;
    });
  }
  return out;
}
