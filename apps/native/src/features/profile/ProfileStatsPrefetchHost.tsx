/**
 * プロフィールタブ初回表示前に users / stats / badges / marks を温める。
 * 追加 read は inflight・メモリ TTL 共有で抑える。
 */
import { useEffect, useRef } from "react";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import {
  loadProfileUserDocNative,
  peekProfileUserDocNative,
} from "./profileUserDocCacheNative";
import {
  hydrateMarksFromUserDoc,
  listMarksNative,
} from "./marksFirestoreNative";
import {
  hydrateMarksMemory,
  peekMarksWriteEpoch,
} from "../../../../../lib/marks/marksMemoryStore";
import { prefetchNativeProfileBadges } from "./useNativeProfileBadges";
import {
  prefetchNativeProfileStats,
  seedNativeProfileStatsFromUserDoc,
} from "./useNativeProfileStats";
import { prefetchMarksWeeklyBoard } from "../../../../../lib/profile/fetchMarksWeeklyBoard";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";

export default function ProfileStatsPrefetchHost() {
  const { fUser, status } = useFirebaseUser();
  const warmedUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "ready") return;
    const uid = fUser?.uid?.trim();
    if (!uid || warmedUidRef.current === uid) return;
    warmedUidRef.current = uid;

    const peek = peekProfileUserDocNative(uid);
    if (peek) {
      seedNativeProfileStatsFromUserDoc(uid, peek);
      hydrateMarksFromUserDoc(uid, peek);
    }

    void loadProfileUserDocNative(uid).then((loaded) => {
      if (!loaded?.exists) return;
      seedNativeProfileStatsFromUserDoc(uid, loaded.data);
      hydrateMarksFromUserDoc(uid, loaded.data);
    });

    void listMarksNative(uid).then((rows) => {
      hydrateMarksMemory(uid, rows, peekMarksWriteEpoch());
      prefetchMarksWeeklyBoard(
        rows.map((m) => m.targetUid),
        getUniterzApiBaseUrl() || undefined
      );
    });

    void prefetchNativeProfileStats(uid);
    void prefetchNativeProfileBadges(uid);
  }, [fUser?.uid, status]);

  return null;
}
