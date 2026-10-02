import { doc, getDoc, type Firestore } from "firebase/firestore";
import type { GamePointsTopEntryV1 } from "@/lib/results/gamePointsTop";
import {
  mergeCountryIntoTopEntries,
  pickCountryCodeFromUserDoc,
} from "@/lib/results/mergeCountryIntoTopEntries";

const COUNTRY_TTL_MS = 10 * 60 * 1000;

type CountryCacheEntry = { at: number; code: string | null };
const countryByUidCache = new Map<string, CountryCacheEntry>();

async function loadCountryCode(
  firestore: Firestore,
  uid: string
): Promise<string | null> {
  const now = Date.now();
  const hit = countryByUidCache.get(uid);
  if (hit && now - hit.at < COUNTRY_TTL_MS) return hit.code;

  const snap = await getDoc(doc(firestore, "users", uid));
  const data = snap.exists() ? snap.data() : null;
  const code = pickCountryCodeFromUserDoc(data?.countryCode);
  countryByUidCache.set(uid, { at: Date.now(), code });
  return code;
}

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
      countryByUid.set(uid, await loadCountryCode(firestore, uid));
    })
  );
  return mergeCountryIntoTopEntries(top, countryByUid);
}
