import { doc, getDoc, type Firestore } from "firebase/firestore";
import type { GamePointsTopEntryV1 } from "@/lib/results/gamePointsTop";
import {
  mergeCountryIntoTopEntries,
  pickCountryCodeFromUserDoc,
} from "@/lib/results/mergeCountryIntoTopEntries";

/** 既存 snapshot に国が無いとき users.countryCode を足す（得点は触らない） */
export async function enrichTopEntriesCountryFromUsers(
  firestore: Firestore,
  top: GamePointsTopEntryV1[]
): Promise<GamePointsTopEntryV1[]> {
  const missing = [
    ...new Set(
      top
        .filter((row) => !row.countryCode)
        .map((row) => row.uid?.trim() || "")
        .filter(Boolean)
    ),
  ];
  if (missing.length === 0) return top.map((row) => ({ ...row }));

  const countryByUid = new Map<string, string | null>();
  await Promise.all(
    missing.map(async (uid) => {
      const snap = await getDoc(doc(firestore, "users", uid));
      const data = snap.exists() ? snap.data() : null;
      countryByUid.set(uid, pickCountryCodeFromUserDoc(data?.countryCode));
    })
  );
  return mergeCountryIntoTopEntries(top, countryByUid);
}
