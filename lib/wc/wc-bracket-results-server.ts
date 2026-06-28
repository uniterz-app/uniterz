import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  parseWcOfficialWinnersDoc,
  type WcOfficialWinners,
} from "@/lib/wc/wc-bracket-results-types";

export async function loadWcOfficialWinners(
  season: string
): Promise<WcOfficialWinners> {
  try {
    const snap = await getAdminDb()
      .collection("wcBracketResults")
      .doc(season)
      .get();
    return parseWcOfficialWinnersDoc(snap.data());
  } catch {
    return {};
  }
}
