/**
 * Pro 導線の計測を `POST /api/me/pro-funnel` へ送る（失敗しても UI に影響させない）。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import {
  proFunnelDayKey,
  type ProFunnelEvent,
  type ProFunnelSource,
} from "../../../../../lib/billing/proFunnelEvents";

type Extra = {
  source?: ProFunnelSource;
  plan?: string;
  trial?: boolean;
  gameId?: string;
  pro?: boolean;
};

const ONCE_PER_DAY_PREFIX = "uniterz.proFunnel.v1";

let pendingSubscribeSource: ProFunnelSource = "other";
let viewSubscribeSource: ProFunnelSource = "other";

/** 次に開く購入画面の入口を覚える（`openProSubscribeNative` の直前） */
export function setProSubscribeSourceNative(source: ProFunnelSource): void {
  pendingSubscribeSource = source;
}

/** 購入画面の表示を記録し、その入口を購入イベントにも引き継ぐ */
export function trackProSubscribeViewNative(): void {
  viewSubscribeSource = pendingSubscribeSource;
  pendingSubscribeSource = "other";
  trackProFunnelNative("subscribe_view", { source: viewSubscribeSource });
}

export function trackProPurchaseNative(
  event: "purchase_tap" | "purchase_done",
  plan: string,
  trial: boolean
): void {
  trackProFunnelNative(event, { source: viewSubscribeSource, plan, trial });
}

export function trackProFunnelNative(
  event: ProFunnelEvent,
  extra?: Extra,
  opts?: { oncePerDay?: boolean }
): void {
  void (async () => {
    try {
      const user = auth.currentUser;
      const base = getUniterzApiBaseUrl();
      if (!user || !base) return;
      if (opts?.oncePerDay) {
        const key = `${ONCE_PER_DAY_PREFIX}.${user.uid}.${event}`;
        const today = proFunnelDayKey(Date.now());
        if ((await AsyncStorage.getItem(key)) === today) return;
        await AsyncStorage.setItem(key, today);
      }
      const token = await user.getIdToken();
      await fetch(`${base}/api/me/pro-funnel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event, ...extra }),
      });
    } catch {
      /* ignore */
    }
  })();
}
