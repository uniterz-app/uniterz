/**
 * リワード広告のあとの解除確認。画面やシートを閉じても止めない。
 * SSV が先に書いていればそれを使い、無ければ見終わった確認（adWatched）で解除する。
 */
import { requestProPickUnlock } from "../../../../../lib/nba/predict/proPickUnlockApi";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import { fetchTradeBuzzUnlockNative } from "../games/predict/buzz/tradeBuzzUnlockApiNative";
import { markProPickUnlockConfirmed } from "../games/predict/proPickAdSessionNative";
import { setTradeBuzzAdEarned } from "../games/predict/buzz/tradeBuzzAdSessionNative";

const TRIES = 30;
const GAP_MS = 2000;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let proPickPoll: { gameId: string; promise: Promise<boolean> } | null = null;
let buzzPoll: Promise<boolean> | null = null;

export function startProPickUnlockPollNative(gameId: string): Promise<boolean> {
  if (proPickPoll?.gameId === gameId) return proPickPoll.promise;
  const promise = (async () => {
    const apiBase = getUniterzApiBaseUrl();
    for (let i = 0; i < TRIES; i++) {
      if (i > 0) await sleep(GAP_MS);
      const again = await requestProPickUnlock({
        apiBase,
        gameId,
        adWatched: true,
      });
      if (again?.unlocked) {
        markProPickUnlockConfirmed(gameId);
        return true;
      }
    }
    return false;
  })();
  proPickPoll = { gameId, promise };
  void promise.finally(() => {
    if (proPickPoll?.promise === promise) proPickPoll = null;
  });
  return promise;
}

export function startTradeBuzzUnlockPollNative(): Promise<boolean> {
  if (buzzPoll) return buzzPoll;
  const promise = (async () => {
    for (let i = 0; i < TRIES; i++) {
      if (i > 0) await sleep(GAP_MS);
      const state = await fetchTradeBuzzUnlockNative();
      if (state?.unlocked) {
        setTradeBuzzAdEarned(true);
        return true;
      }
    }
    return false;
  })();
  buzzPoll = promise;
  void promise.finally(() => {
    if (buzzPoll === promise) buzzPoll = null;
  });
  return promise;
}
