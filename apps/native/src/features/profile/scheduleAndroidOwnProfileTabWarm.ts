/**
 * Android: 自分のプロフィール初回（lazy ProfileTab）を Games 安定後に温める。
 * データ prefetch は ProfileStatsPrefetchHost と重複してもよい（idempotent）。
 * 画面 preload は Tab.Navigator 内の navigation からだけ呼ぶこと。
 */
import { InteractionManager, Platform } from "react-native";
import {
  loadProfileUserDocNative,
  peekProfileUserDocNative,
} from "./profileUserDocCacheNative";
import { hydrateMarksFromUserDoc } from "./marksFirestoreNative";
import { prefetchNativeProfileBadges } from "./useNativeProfileBadges";
import {
  prefetchNativeProfileStats,
  seedNativeProfileStatsFromUserDoc,
} from "./useNativeProfileStats";
import { prefetchNativeProfileSettledTodayResults } from "./useNativeProfileSettledTodayResults";

type PreloadableTabNav = {
  preload?: (name: "ProfileTab") => void;
};

let warmedUid: string | null = null;
let preloadScheduled = false;

function warmOwnProfileData(uid: string): void {
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
  void prefetchNativeProfileStats(uid);
  void prefetchNativeProfileBadges(uid);
  prefetchNativeProfileSettledTodayResults(uid);
}

/**
 * Games の初回スケルトンが消えたあと呼ぶ。Android のみ ProfileTab を preload。
 */
export function scheduleAndroidOwnProfileTabWarm(opts: {
  uid: string | null | undefined;
  tabNavigation: PreloadableTabNav;
}): () => void {
  if (Platform.OS !== "android") return () => {};
  const uid = opts.uid?.trim();
  if (!uid) return () => {};
  if (warmedUid === uid && preloadScheduled) return () => {};

  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const task = InteractionManager.runAfterInteractions(() => {
    /** Games の入場アニメ・FlatList 初回レイアウトとぶつからない余白 */
    timeoutId = setTimeout(() => {
      if (cancelled) return;
      warmOwnProfileData(uid);
      try {
        opts.tabNavigation.preload?.("ProfileTab");
        preloadScheduled = true;
        warmedUid = uid;
      } catch {
        /* preload 非対応ビルドはデータ warm だけ */
      }
    }, 1400);
  });

  return () => {
    cancelled = true;
    task.cancel();
    if (timeoutId) clearTimeout(timeoutId);
  };
}
