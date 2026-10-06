/**
 * 試合一覧の「自分の予想」キャッシュを端末に保存・復元する。
 * 起動直後は Firestore の初回クエリが遅く、一覧を予想待ちで隠すと初回表示が遅れるため。
 */
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  exportScheduleMyPosts,
  hydrateScheduleMyPosts,
  subscribeScheduleMyPosts,
  type ScheduleMyPostsMap,
} from "../../../../../lib/games/scheduleMyPostsCache";

const KEY_PREFIX = "uniterz:scheduleMyPosts:v1:";
const SAVE_DEBOUNCE_MS = 800;

/** uid の保存分を復元し終えたら true（保存が無い・失敗でも true） */
export function useScheduleMyPostsPersistNative(uid: string | null | undefined): boolean {
  const [hydratedUid, setHydratedUid] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    void AsyncStorage.getItem(KEY_PREFIX + uid)
      .then((raw) => {
        if (!alive || !raw) return;
        const saved = JSON.parse(raw) as {
          byGameId?: ScheduleMyPostsMap;
          absentIds?: string[];
        };
        hydrateScheduleMyPosts(uid, {
          byGameId: saved.byGameId ?? {},
          absentIds: saved.absentIds ?? [],
        });
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setHydratedUid(uid);
      });

    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribeScheduleMyPosts((changedUid) => {
      if (changedUid !== uid) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void AsyncStorage.setItem(
          KEY_PREFIX + uid,
          JSON.stringify(exportScheduleMyPosts(uid))
        ).catch(() => {});
      }, SAVE_DEBOUNCE_MS);
    });
    return () => {
      alive = false;
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [uid]);

  return !uid || hydratedUid === uid;
}
