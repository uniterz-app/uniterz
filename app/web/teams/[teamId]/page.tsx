"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, Timestamp } from "firebase/firestore";

import { db } from "@/lib/firebase";
import TeamDetailViewWeb from "./TeamDetailViewWeb";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { teamColorsNBA } from "@/lib/teams-nba";
import { TEAM_SHORT } from "@/lib/team-short";
import { lastGameAtMillis } from "@/lib/teamLastGameAt";
import { nbaRegularSeasonWinsLosses } from "@/lib/nbaRegularSeasonRecord";

const FALLBACK_COLORS = {
  primary: "#555555",
  secondary: "#999999",
  orange: "#EF3B24",
};

/** 1/24 形式 */
function toMD(v: unknown): string {
  const d: Date | null =
    v instanceof Date
      ? v
      : v instanceof Timestamp
        ? v.toDate()
        : typeof (v as { toDate?: () => Date })?.toDate === "function"
          ? (v as { toDate: () => Date }).toDate()
          : typeof v === "number"
            ? new Date(v)
            : null;

  if (!d || Number.isNaN(d.getTime())) return "--/--";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

type Team = {
  id: string;
  name: string;
  rank: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  winRate: number;

  wins: number;
  losses: number;

  ppgRank?: number | null;
  papgRank?: number | null;

  last10: {
    wins: number;
    losses: number;
    games: unknown[];
  };

  clutch: {
    wins: number;
    losses: number;
  };

  homeAway: {
    home: { wins: number; losses: number; avgFor: number; avgAgainst: number };
    away: { wins: number; losses: number; avgFor: number; avgAgainst: number };
  };

  conference: string;
  conferenceRecord: {
    vsEast: { wins: number; losses: number };
    vsWest: { wins: number; losses: number };
  };

  colors: {
    primary: string;
    secondary: string;
    orange: string;
  };
};

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;

    const fetchTeam = async () => {
      try {
        const snap = await getDoc(doc(db, "teams", teamId));
        if (!snap.exists()) {
          setTeam(null);
          return;
        }

        const d = snap.data() as Record<string, unknown>;

        const gp = Number(d.gamesPlayed ?? 0);
        const homeGames = Number(d.homeGames ?? 0);
        const awayGames = Number(d.awayGames ?? 0);

        const lastGamesRaw = Array.isArray(d.lastGames) ? d.lastGames : [];

        const last10Games = lastGamesRaw
          .slice()
          .sort(
            (a: { playedAt?: unknown; at?: unknown }, b: { playedAt?: unknown; at?: unknown }) =>
              lastGameAtMillis(b) - lastGameAtMillis(a)
          )
          .slice(0, 10)
          .map((g: Record<string, unknown>) => {
            const oppTeamId = (g.oppTeamId ?? "") as string;
            const rawTs = g.playedAt ?? g.at;
            return {
              date: toMD(rawTs),
              sortAtMs: lastGameAtMillis(g as { playedAt?: unknown; at?: unknown }),
              vs: TEAM_SHORT[oppTeamId] ?? oppTeamId ?? "UNK",
              home: g.homeAway === "home",
              score: `${g.teamScore ?? 0}-${g.oppScore ?? 0}`,
              result: g.isWin ? "W" : "L",
            };
          })
          .reverse();

        const w10 = last10Games.filter((x: { result: string }) => x.result === "W").length;
        const l10 = last10Games.filter((x: { result: string }) => x.result === "L").length;

        const homeWins = Number(d.homeWins ?? 0);
        const awayWins = Number(d.awayWins ?? 0);

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

        setTeam({
          id: teamId,
          name:
            NBA_TEAM_NAME_BY_ID[teamId] ??
            (typeof d.name === "string" ? d.name : teamId),
          rank: Number(d.rank ?? 0),

          wins: rs.wins,
          losses: rs.losses,
          winRate: rsWinRate,

          avgPointsFor: gp > 0 ? Number(d.pointsForTotal ?? 0) / gp : 0,
          avgPointsAgainst: gp > 0 ? Number(d.pointsAgainstTotal ?? 0) / gp : 0,

          ppgRank: (d.ppgRank as number | null | undefined) ?? null,
          papgRank: (d.papgRank as number | null | undefined) ?? null,

          homeAway: {
            home: {
              wins: homeWins,
              losses: Math.max(0, homeGames - homeWins),
              avgFor:
                homeGames > 0
                  ? Number(d.homePointsForTotal ?? 0) / homeGames
                  : 0,
              avgAgainst:
                homeGames > 0
                  ? Number(d.homePointsAgainstTotal ?? 0) / homeGames
                  : 0,
            },
            away: {
              wins: awayWins,
              losses: Math.max(0, awayGames - awayWins),
              avgFor:
                awayGames > 0
                  ? Number(d.awayPointsForTotal ?? 0) / awayGames
                  : 0,
              avgAgainst:
                awayGames > 0
                  ? Number(d.awayPointsAgainstTotal ?? 0) / awayGames
                  : 0,
            },
          },

          clutch: {
            wins: Number(d.closeWins ?? 0),
            losses: Math.max(
              0,
              Number(d.closeGames ?? 0) - Number(d.closeWins ?? 0)
            ),
          },

          conferenceRecord: {
            vsEast: {
              wins: Number(d.vsEastWins ?? 0),
              losses: Math.max(
                0,
                Number(d.vsEastGames ?? 0) - Number(d.vsEastWins ?? 0)
              ),
            },
            vsWest: {
              wins: Number(d.vsWestWins ?? 0),
              losses: Math.max(
                0,
                Number(d.vsWestGames ?? 0) - Number(d.vsWestWins ?? 0)
              ),
            },
          },

          last10: {
            wins: w10,
            losses: l10,
            games: last10Games,
          },

          conference: typeof d.conference === "string" ? d.conference : "",

          colors: (() => {
            const c = teamColorsNBA[teamId];
            if (!c) return FALLBACK_COLORS;
            return {
              primary: c.primary,
              secondary: c.secondary ?? FALLBACK_COLORS.secondary,
              orange: FALLBACK_COLORS.orange,
            };
          })(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  if (loading) return null;
  if (!team) return null;

  return <TeamDetailViewWeb team={team} />;
}
