import { getAdminDb } from "@/lib/firebaseAdmin";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";
import {
  defaultWcKnockoutAdvancement,
  parseWcKnockoutAdvancementDoc,
} from "@/lib/wc/wc-knockout-advancement-store";

/** サーバー側: Firestore → 静的フォールバック */
export async function loadWcKnockoutAdvancement(
  season: string
): Promise<WcKnockoutAdvancement> {
  const fallback = defaultWcKnockoutAdvancement(season);
  try {
    const snap = await getAdminDb()
      .collection("wcKnockoutAdvancement")
      .doc(season)
      .get();
    return parseWcKnockoutAdvancementDoc(snap.data()) ?? fallback;
  } catch {
    return fallback;
  }
}
