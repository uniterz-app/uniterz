import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../lib/nba-team-names";
import { teamColorsNBA } from "../../../../../lib/teams-nba";
import { TEAM_SHORT } from "../../../../../lib/team-short";
import { lastGameAtMillis } from "../../../../../lib/teamLastGameAt";
import { nbaRegularSeasonWinsLosses } from "../../../../../lib/nbaRegularSeasonRecord";
import { compareNbaStandingsSortRows } from "../../../../../lib/nba/compareNbaStandingsSort";

const FALLBACK_COLORS = {
  primary: "#555555",
  secondary: "#999999",
  orange: "#EF3B24",
};

export type NativeTeamLastGame = {
  date: string;
  sortAtMs: number;
  vs: string;
  home: boolean;
  score: string;
  result: "W" | "L";
};

export type NativeTeamDetail = {
  id: string;
  name: string;
  conference: string;
  rank: number | null;
  wins: number;
  losses: number;
  winRate: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  ppgRank: number | null;
  papgRank: number | null;
  homeAway: {
    home: { wins: number; losses: number; avgFor: number; avgAgainst: number };
    away: { wins: number; losses: number; avgFor: number; avgAgainst: number };
  };
  clutch: { wins: number; losses: number };
  conferenceRecord: {
    vsEast: { wins: number; losses: number };
    vsWest: { wins: number; losses: number };
  };
  conferenceRank: number | null;
  last10: { wins: number; losses: number; games: NativeTeamLastGame[] };
  colors: { primary: string; secondary: string; orange: string };
};

function toMD(v: unknown): string {
  const d: Date | null =
    v instanceof Date
      ? v
      : v instanceof Timestamp
        ? v.toDate()
        : v && typeof v === "object" && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function"
          ? (v as { toDate: () => Date }).toDate()
          : typeof v === "number"
            ? new Date(v)
            : null;
  if (!d || Number.isNaN(d.getTime())) return "--/--";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function useNativeTeamDetail(teamId: string | undefined) {
  const [team, setTeam] = useState<NativeTeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!teamId) {
      setTeam(null);
      setLoading(false);
      setNotFound(true);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    void (async () => {
      try {
        const snap = await getDoc(doc(db, "teams", teamId));
        if (cancelled) return;
        if (!snap.exists()) {
          setTeam(null);
          setNotFound(true);
          return;
        }

        const d = snap.data() as Record<string, unknown>;
        const gp = Number(d.gamesPlayed ?? 0);
        const homeGames = Number(d.homeGames ?? 0);
        const awayGames = Number(d.awayGames ?? 0);
        const lastGamesRaw = Array.isArray(d.lastGames) ? d.lastGames : [];

        const last10Games: NativeTeamLastGame[] = lastGamesRaw
          .slice()
          .sort((a, b) => lastGameAtMillis(b) - lastGameAtMillis(a))
          .slice(0, 10)
          .map((g) => {
            const row = g as Record<string, unknown>;
            const oppTeamId = String(row.oppTeamId ?? "");
            const rawTs = row.playedAt ?? row.at;
            return {
              date: toMD(rawTs),
              sortAtMs: lastGameAtMillis(g),
              vs: TEAM_SHORT[oppTeamId] ?? (oppTeamId || "UNK"),
              home: row.homeAway === "home",
              score: `${row.teamScore ?? 0}-${row.oppScore ?? 0}`,
              result: (row.isWin ? "W" : "L") as "W" | "L",
            };
          })
          .reverse();

        const w10 = last10Games.filter((x) => x.result === "W").length;
        const l10 = last10Games.filter((x) => x.result === "L").length;
        const homeWins = Number(d.homeWins ?? 0);
        const awayWins = Number(d.awayWins ?? 0);
        const conference = String(d.conference ?? "");
        const rs = nbaRegularSeasonWinsLosses({
          wins: Number(d.wins ?? 0),
          losses: Number(d.losses ?? 0),
          homeGames,
          homeWins,
          awayGames,
          awayWins,
          cupFinalWins: Number(d.cupFinalWins ?? 0),
          cupFinalLosses: Number(d.cupFinalLosses ?? 0),
        });
        const rsTotal = rs.wins + rs.losses;
        const rsWinRate = rsTotal > 0 ? (rs.wins / rsTotal) * 100 : 0;
        let conferenceRank: number | null = null;
        try {
          const confSnap = await getDocs(
            query(collection(db, "teams"), where("league", "==", "nba"), where("conference", "==", conference))
          );
          const confTeams = confSnap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Record<string, unknown>),
          }));
          const sorted = [...confTeams].sort((a, b) => compareNbaStandingsSortRows(a, b));
          const idx = sorted.findIndex((x) => x.id === teamId);
          conferenceRank = idx >= 0 ? idx + 1 : null;
        } catch {
          conferenceRank = null;
        }

        setTeam({
          id: teamId,
          name: NBA_TEAM_NAME_BY_ID[teamId] ?? String(d.name ?? teamId),
          conference,
          rank: typeof d.rank === "number" ? d.rank : null,
          wins: rs.wins,
          losses: rs.losses,
          winRate: rsWinRate,
          avgPointsFor: gp > 0 ? Number(d.pointsForTotal ?? 0) / gp : 0,
          avgPointsAgainst: gp > 0 ? Number(d.pointsAgainstTotal ?? 0) / gp : 0,
          ppgRank: typeof d.ppgRank === "number" ? d.ppgRank : null,
          papgRank: typeof d.papgRank === "number" ? d.papgRank : null,
          homeAway: {
            home: {
              wins: homeWins,
              losses: Math.max(0, homeGames - homeWins),
              avgFor: homeGames > 0 ? Number(d.homePointsForTotal ?? 0) / homeGames : 0,
              avgAgainst:
                homeGames > 0 ? Number(d.homePointsAgainstTotal ?? 0) / homeGames : 0,
            },
            away: {
              wins: awayWins,
              losses: Math.max(0, awayGames - awayWins),
              avgFor: awayGames > 0 ? Number(d.awayPointsForTotal ?? 0) / awayGames : 0,
              avgAgainst:
                awayGames > 0 ? Number(d.awayPointsAgainstTotal ?? 0) / awayGames : 0,
            },
          },
          clutch: {
            wins: Number(d.closeWins ?? 0),
            losses: Math.max(0, Number(d.closeGames ?? 0) - Number(d.closeWins ?? 0)),
          },
          conferenceRecord: {
            vsEast: {
              wins: Number(d.vsEastWins ?? 0),
              losses: Math.max(0, Number(d.vsEastGames ?? 0) - Number(d.vsEastWins ?? 0)),
            },
            vsWest: {
              wins: Number(d.vsWestWins ?? 0),
              losses: Math.max(0, Number(d.vsWestGames ?? 0) - Number(d.vsWestWins ?? 0)),
            },
          },
          conferenceRank,
          last10: { wins: w10, losses: l10, games: last10Games },
          colors: { ...FALLBACK_COLORS, ...(teamColorsNBA[teamId] ?? {}) },
        });
      } catch {
        if (cancelled) return;
        setTeam(null);
        setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  return { team, loading, notFound };
}
