/**
 * プロフィールタブ初回表示前に users / stats / badges / marks を温める。
 * 起動直後の Games 初回描画を奪わないよう、idle 後に回す。
 *
 * 画面の `preload("ProfileTab")` はしない（この Host は Tab.Navigator の外なので
 * PRELOAD が扱えずコンソールエラーになり、lazy Profile の早期マウントで Games も重くなる）。
 */
import { useEffect, useRef } from "react";
import { InteractionManager } from "react-native";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import {
  loadProfileUserDocNative,
  peekProfileUserDocNative,
} from "./profileUserDocCacheNative";
import {
  hydrateMarksFromUserDoc,
  listMarksNative,
} from "./marksFirestoreNative";
import { replaceMarksMemory } from "../../../../../lib/marks/marksMemoryStore";
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

    // 同期 seed だけ先に（peek があるとき）。重い list / prefetch は idle 後。
    const peek = peekProfileUserDocNative(uid);
    if (peek) {
      seedNativeProfileStatsFromUserDoc(uid, peek);
      hydrateMarksFromUserDoc(uid, peek);
    }

    const task = InteractionManager.runAfterInteractions(() => {
      if (warmedUidRef.current === uid) return;
      warmedUidRef.current = uid;

      void loadProfileUserDocNative(uid).then((loaded) => {
        if (!loaded?.exists) return;
        seedNativeProfileStatsFromUserDoc(uid, loaded.data);
        hydrateMarksFromUserDoc(uid, loaded.data);
      });

      void listMarksNative(uid).then((rows) => {
        replaceMarksMemory(uid, rows);
        prefetchMarksWeeklyBoard(
          rows.map((m) => m.targetUid),
          getUniterzApiBaseUrl() || undefined
        );
      });

      void prefetchNativeProfileStats(uid);
      void prefetchNativeProfileBadges(uid);
    });

    return () => task.cancel();
  }, [fUser?.uid, status]);

  return null;
}
