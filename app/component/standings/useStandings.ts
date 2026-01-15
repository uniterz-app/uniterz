"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type StandingTeam = {
  id: string;
  name: string;
  wins: number;
  losses: number;
  winRate: number;
  conference: "east" | "west";
};

export function useStandings() {
  const [east, setEast] = useState<StandingTeam[]>([]);
  const [west, setWest] = useState<StandingTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const q = query(
        collection(db, "teams"),
        where("league", "==", "nba")
      );

      const snap = await getDocs(q);

      const teams = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<StandingTeam, "id">),
      }));

      setEast(
        teams
          .filter((t) => t.conference === "east")
          .sort((a, b) => b.winRate - a.winRate)
      );

      setWest(
        teams
          .filter((t) => t.conference === "west")
          .sort((a, b) => b.winRate - a.winRate)
      );

      setLoading(false);
    })();
  }, []);

  return { east, west, loading };
}
