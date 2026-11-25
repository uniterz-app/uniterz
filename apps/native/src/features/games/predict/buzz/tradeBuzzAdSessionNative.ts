/**
 * トレード Buzz の広告解除。日本時間 0 時まで端末に残す（サーバー確認は裏で取る）。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getTodayKeyInTimeZone,
  TIMEZONE_JST,
} from "../../../../../../../lib/time/zonedTime";

const KEY = "uniterz:tradeBuzzAdEarnedDay:v1";

let earnedDay: string | null = null;
let hydrateStarted = false;
let hydratePromise: Promise<boolean> | null = null;

function jstDayKey(): string {
  return getTodayKeyInTimeZone(TIMEZONE_JST);
}

function isEarnedToday(): boolean {
  return earnedDay === jstDayKey();
}

export function peekTradeBuzzAdEarned(): boolean {
  return isEarnedToday();
}

export async function hydrateTradeBuzzAdEarned(): Promise<boolean> {
  if (hydrateStarted && hydratePromise) return hydratePromise;
  hydrateStarted = true;
  hydratePromise = (async () => {
    try {
      const stored = await AsyncStorage.getItem(KEY);
      if (stored) earnedDay = stored;
    } catch {
      // 読めなくてもサーバー確認がある
    }
    if (earnedDay && earnedDay !== jstDayKey()) {
      earnedDay = null;
      try {
        await AsyncStorage.removeItem(KEY);
      } catch {
        // 古い日付が残っても peek は今日だけ見る
      }
    }
    return isEarnedToday();
  })();
  return hydratePromise;
}

export function setTradeBuzzAdEarned(next: boolean) {
  const day = jstDayKey();
  earnedDay = next ? day : null;
  void (async () => {
    try {
      if (next) await AsyncStorage.setItem(KEY, day);
      else await AsyncStorage.removeItem(KEY);
    } catch {
      // メモリ上の今日の解除は残る
    }
  })();
}
