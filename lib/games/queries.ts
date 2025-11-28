// app/lib/games/queries.ts
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";

type League = "bj" | "j";

const jstDayRange = (d: Date) => {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0);
  return { start, end };
};

export async function fetchGamesForDay(params: {
  league: League;
  dateJst: Date;
  season: string;
}) {
  const { league, dateJst, season } = params;
  const { start, end } = jstDayRange(dateJst);

  const col = collection(db, "games");
  const q = query(
    col,
    where("league", "==", league),
    where("season", "==", season),
    where("startAtJst", ">=", Timestamp.fromDate(start)), // ← Timestampで比較
    where("startAtJst", "<", Timestamp.fromDate(end)),
    orderBy("startAtJst", "asc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
