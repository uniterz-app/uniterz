import type { NbaConferenceStandingsRow } from "@/lib/nba/nbaConferenceStandings";
import type { NbaTeamDetailPreview } from "@/lib/predict/nbaTeamDetailPreviewMocks";

/** BDL standings 行で season / rank / HOME-AWAY / L10 / 連勝を上書き */
export function applyStandingsToTeamDetailPreview(
  detail: NbaTeamDetailPreview,
  row: NbaConferenceStandingsRow
): NbaTeamDetailPreview {
  return {
    ...detail,
    conference: row.conference,
    conferenceRank: row.rank,
    season: {
      wins: row.wins,
      losses: row.losses,
      winPct: row.winPct,
    },
    homeAwaySplit: {
      home: { ...row.home },
      away: { ...row.away },
    },
    last10Record: { ...row.last10 },
    streak: { ...row.streak },
  };
}
