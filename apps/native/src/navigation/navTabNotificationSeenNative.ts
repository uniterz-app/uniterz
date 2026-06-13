import AsyncStorage from "@react-native-async-storage/async-storage";

/** Web `lib/nav/navTabNotificationSeen.ts` と同一キー（ストレージのみ AsyncStorage） */
const RANKING_SEEN_KEY = "uniterz:navSeen:rankingUpdatedAtMs:v1";
const RESULT_SEEN_KEY = "uniterz:navSeen:resultSettledAtMs:v1";

function rankingStorageKey(uid: string): string {
  return `${RANKING_SEEN_KEY}:${uid}`;
}

function resultStorageKey(uid: string): string {
  return `${RESULT_SEEN_KEY}:${uid}`;
}

export async function readNavRankingSeenMsNative(
  uid: string
): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(rankingStorageKey(uid));
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function readNavResultSeenMsNative(
  uid: string
): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(resultStorageKey(uid));
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function markNavRankingSeenNative(
  uid: string,
  updatedAtMs: number
): Promise<void> {
  if (!Number.isFinite(updatedAtMs)) return;
  try {
    await AsyncStorage.setItem(
      rankingStorageKey(uid),
      String(Math.floor(updatedAtMs))
    );
  } catch {
    // 握りつぶす
  }
}

export async function markNavResultSeenNative(
  uid: string,
  settledAtMs: number
): Promise<void> {
  if (!Number.isFinite(settledAtMs)) return;
  try {
    await AsyncStorage.setItem(
      resultStorageKey(uid),
      String(Math.floor(settledAtMs))
    );
  } catch {
    // 握りつぶす
  }
}
