import { doc, getDoc, type Firestore } from "firebase/firestore";
import type { GamePointsTopEntryV1 } from "@/lib/results/gamePointsTop";
import {
  mergeCountryIntoTopEntries,
  pickCountryCodeFromUserDoc,
} from "@/lib/results/mergeCountryIntoTopEntries";
import { parseEquippedProSkinFromUserDoc } from "@/lib/profile/profilePlanProBgVariantField";

const USER_TTL_MS = 10 * 60 * 1000;

type UserCacheEntry = {
  at: number;
  code: string | null;
  proSkin: string | null;
};
const userByUidCache = new Map<string, UserCacheEntry>();

async function loadUserBits(
  firestore: Firestore,
  uid: string
): Promise<UserCacheEntry> {
  const now = Date.now();
  const hit = userByUidCache.get(uid);
  if (hit && now - hit.at < USER_TTL_MS) return hit;

  const snap = await getDoc(doc(firestore, "users", uid));
  const data = snap.exists() ? snap.data() : null;
  const entry: UserCacheEntry = {
    at: Date.now(),
    code: pickCountryCodeFromUserDoc(data?.countryCode),
    proSkin: data ? parseEquippedProSkinFromUserDoc(data) ?? null : null,
  };
  userByUidCache.set(uid, entry);
  return entry;
}

/**
 * 既存 snapshot に国が無いとき users.countryCode を足す（得点は触らない）。
 * Pro 行は users.planProBgVariant も足す（行背景の Pro Skin）。
 */
export async function enrichTopEntriesCountryFromUsers(
  firestore: Firestore,
  top: GamePointsTopEntryV1[]
): Promise<GamePointsTopEntryV1[]> {
  const targets = [
    ...new Set(
      top
        .filter((row) => !row.countryCode || row.isPro)
        .map((row) => row.uid?.trim() || "")
        .filter(Boolean)
    ),
  ];
  if (targets.length === 0) return top.map((row) => ({ ...row }));

  const bitsByUid = new Map<string, UserCacheEntry>();
  await Promise.all(
    targets.map(async (uid) => {
      bitsByUid.set(uid, await loadUserBits(firestore, uid));
    })
  );
  const countryByUid = new Map<string, string | null>(
    [...bitsByUid].map(([uid, b]) => [uid, b.code])
  );
  return mergeCountryIntoTopEntries(top, countryByUid).map((row) => {
    if (!row.isPro) return row;
    const skin = bitsByUid.get(row.uid?.trim() || "")?.proSkin;
    return skin ? { ...row, planProBgVariant: skin } : row;
  });
}
