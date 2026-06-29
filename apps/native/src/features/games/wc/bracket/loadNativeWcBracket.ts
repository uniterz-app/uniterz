import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import type { WcBracketDoc } from "@/lib/wc/wc-bracket-firestore";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";

function getWcBracketDocId(uid: string, season: string) {
  return `${season}_${uid}`;
}

/** `wcBrackets/{season}_{uid}` を Firestore から読み込む */
export async function loadNativeWcBracket(
  uid: string,
  season = WC_KNOCKOUT_SEASON
): Promise<WcBracketDoc | null> {
  const ref = doc(db, "wcBrackets", getWcBracketDocId(uid, season));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as WcBracketDoc;
}
