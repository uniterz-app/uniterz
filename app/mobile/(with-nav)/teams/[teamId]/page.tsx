// app/mobile/(with-nav)/team/[teamId]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, Timestamp } from "firebase/firestore";

import { db } from "@/lib/firebase";
import TeamDetailView from "@/app/component/team/TeamDetailView";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { teamColorsNBA } from "@/lib/teams-nba";
import { TEAM_SHORT } from "@/lib/team-short";

const FALLBACK_COLORS = {
  primary: "#555555",
  secondary: "#999999",
  orange: "#EF3B24",
};

// 1/24 形式
function toMD(v: any): string {
  const d: Date | null =
    v instanceof Date
      ? v
      : v instanceof Timestamp
      ? v.toDate()
      : typeof v?.toDate === "function"
      ? v.toDate()
      : typeof v === "number"
      ? new Date(v)
      : null;

  if (!d || Number.isNaN(d.getTime())) return "--/--";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function TeamPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<any | null>(null);

  useEffect(() => {
    if (!teamId) return;

    const run = async () => {
      const snap = await getDoc(doc(db, "teams", teamId));
      if (!snap.exists()) return;

      const d: any = snap.data();

      const gp = d.gamesPlayed ?? 0;
      const homeGames = d.homeGames ?? 0;
      const awayGames = d.awayGames ?? 0;

      // ✅ lastGames -> last10.games
      const lastGamesRaw = Array.isArray(d.lastGames) ? d.lastGames : [];

      const last10Games = lastGamesRaw
        .slice()
        .sort((a: any, b: any) => {
          const atA = a?.at?.toDate?.()?.getTime?.() ?? 0;
          const atB = b?.at?.toDate?.()?.getTime?.() ?? 0;
          return atB - atA; // 新しい順
        })
        .slice(0, 10)
        .map((g: any) => {
          const oppTeamId = (g.oppTeamId ?? "") as string;

          return {
            date: toMD(g.at), // 1/24
            vs: TEAM_SHORT[oppTeamId] ?? oppTeamId ?? "UNK",
            home: g.homeAway === "home",
            score: `${g.teamScore ?? 0}-${g.oppScore ?? 0}`,
            result: g.isWin ? "W" : "L",
          };
        })
        .reverse(); // 古い→新しい表示（今のUIに合わせる）

      const w10 = last10Games.filter((x: any) => x.result === "W").length;
      const l10 = last10Games.filter((x: any) => x.result === "L").length;

      const teamDetail = {
        id: teamId,
        name: NBA_TEAM_NAME_BY_ID[teamId] ?? d.name ?? teamId,
        conference: d.conference,
        rank: d.rank,

        wins: d.wins ?? 0,
        losses: d.losses ?? 0,
        winRate: (d.winRate ?? 0) * 100,

        avgPointsFor: gp > 0 ? (d.pointsForTotal ?? 0) / gp : 0,
        avgPointsAgainst: gp > 0 ? (d.pointsAgainstTotal ?? 0) / gp : 0,

        avgForRank: d.ppgRank ?? null,
        avgAgainstRank: d.papgRank ?? null,

        // ✅ home/away 平均得点・平均失点
        homeAway: {
          home: {
            wins: d.homeWins ?? 0,
            losses: Math.max(0, homeGames - (d.homeWins ?? 0)),
            avgFor: homeGames > 0 ? (d.homePointsForTotal ?? 0) / homeGames : 0,
            avgAgainst:
              homeGames > 0 ? (d.homePointsAgainstTotal ?? 0) / homeGames : 0,
          },
          away: {
            wins: d.awayWins ?? 0,
            losses: Math.max(0, awayGames - (d.awayWins ?? 0)),
            avgFor: awayGames > 0 ? (d.awayPointsForTotal ?? 0) / awayGames : 0,
            avgAgainst:
              awayGames > 0 ? (d.awayPointsAgainstTotal ?? 0) / awayGames : 0,
          },
        },

        clutch: {
          wins: d.closeWins ?? 0,
          losses: Math.max(0, (d.closeGames ?? 0) - (d.closeWins ?? 0)),
        },

        conferenceRecord: {
          vsEast: {
            wins: d.vsEastWins ?? 0,
            losses: Math.max(0, (d.vsEastGames ?? 0) - (d.vsEastWins ?? 0)),
          },
          vsWest: {
            wins: d.vsWestWins ?? 0,
            losses: Math.max(0, (d.vsWestGames ?? 0) - (d.vsWestWins ?? 0)),
          },
        },

        // ✅ Last 10
        last10: {
          wins: w10,
          losses: l10,
          games: last10Games,
        },

        colors: teamColorsNBA[teamId] ?? FALLBACK_COLORS,
      };

      setTeam(teamDetail);
    };

    run();
  }, [teamId]);

  if (!team) return null;
  return <TeamDetailView team={team} />;
}
