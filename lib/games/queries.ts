// app/lib/games/queries.ts
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";

// JST day range
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
  // ★ すべて normalize して League 型に統一
  const league = normalizeLeague(params.league);
  const { dateJst, season } = params;

  const { start, end } = jstDayRange(dateJst);

  const col = collection(db, "games");
  const q = query(
    col,
    where("league", "==", league),
    where("season", "==", season),
    where("startAtJst", ">=", Timestamp.fromDate(start)),
    where("startAtJst", "<", Timestamp.fromDate(end)),
    orderBy("startAtJst", "asc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
