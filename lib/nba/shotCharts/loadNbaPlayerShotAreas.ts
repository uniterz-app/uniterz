import type { Firestore } from "firebase-admin/firestore";
import {
  NBA_PLAYER_SHOT_AREAS_COLLECTION,
  type NbaPlayerShotAreasDoc,
} from "@/lib/nba/shotCharts/shotChartTypes";

export async function loadNbaPlayerShotAreas(
  db: Firestore,
  seasonKey: string
): Promise<NbaPlayerShotAreasDoc | null> {
  const snap = await db.collection(NBA_PLAYER_SHOT_AREAS_COLLECTION).doc(seasonKey).get();
  return snap.exists ? (snap.data() as NbaPlayerShotAreasDoc) : null;
}
