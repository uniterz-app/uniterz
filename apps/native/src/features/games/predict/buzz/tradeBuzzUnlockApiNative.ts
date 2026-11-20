/**
 * トレード Buzz の解除状態（`GET /api/nba/trade-buzz-unlock`）。
 * 判定はサーバーだけ。ここは取りに行って返すだけ。
 */
import { auth } from "../../../../lib/firebase";
import { getUniterzApiBaseUrl } from "../../submitPredictionApi";

export type TradeBuzzUnlockState = {
  unlocked: boolean;
  via: "pro" | "ad" | null;
};

/** 取れなかったとき（未ログイン・通信失敗など）は null */
export async function fetchTradeBuzzUnlockNative(): Promise<TradeBuzzUnlockState | null> {
  const user = auth.currentUser;
  const base = getUniterzApiBaseUrl();
  if (!user || !base) return null;
  try {
    const token = await user.getIdToken();
    const res = await fetch(`${base}/api/nba/trade-buzz-unlock`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { unlocked?: unknown; via?: unknown };
    return {
      unlocked: json.unlocked === true,
      via: json.via === "pro" || json.via === "ad" ? json.via : null,
    };
  } catch {
    return null;
  }
}
