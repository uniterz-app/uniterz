"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TeamDetailViewWeb from "./TeamDetailViewWeb";

type Team = {
  id: string;
  name: string;
rank: number; 
  avgPointsFor: number;
  avgPointsAgainst: number;
  winRate: number;

  wins: number;
  losses: number;

  last10: {
    wins: number;
    losses: number;
    games: any[];
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

        const d = snap.data();

        setTeam({
          id: teamId,
          name: d.name ?? "",
rank: d.rank ?? 0,
          avgPointsFor: d.avgPointsFor ?? 0,
          avgPointsAgainst: d.avgPointsAgainst ?? 0,
          winRate: d.winRate ?? 0,

          wins: d.wins ?? 0,
          losses: d.losses ?? 0,

          last10: d.last10 ?? {
            wins: 0,
            losses: 0,
            games: [],
          },

          clutch: d.clutch ?? {
            wins: 0,
            losses: 0,
          },

          homeAway: d.homeAway ?? {
            home: { wins: 0, losses: 0, avgFor: 0, avgAgainst: 0 },
            away: { wins: 0, losses: 0, avgFor: 0, avgAgainst: 0 },
          },

          conference: d.conference ?? "",

          conferenceRecord: d.conferenceRecord ?? {
            vsEast: { wins: 0, losses: 0 },
            vsWest: { wins: 0, losses: 0 },
          },

          colors: d.colors ?? {
            primary: "#3b82f6",
            secondary: "#22d3ee",
            orange: "#f97316",
          },
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
