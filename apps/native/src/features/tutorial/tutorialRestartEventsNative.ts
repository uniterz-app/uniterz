/**
 * 「チュートリアル」再開の同期（サイドメニュー／DEV）。
 *
 * タブは `lazy: true` のため、Games 未訪問だと購読者がいない。
 * そのため in-memory イベントに加え、AsyncStorage トークンと
 * ルート params（`restartTutorialAt`）の三重で確実に起こす。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearAppTutorialSeenNative } from "./tutorialSeenNative";
import { writeTutorialLivePhaseNative } from "./tutorialLivePhaseNative";
import { clearTutorialLivePickNative } from "./tutorialLivePickNative";
import { TUTORIAL_NBA_GAME_ID } from "../../../../../lib/tutorial/tutorialNbaRawGame";
import { prefetchRankingsLogoGlb } from "../rankings/rankingsLogoGlbCache";
import { armTutorialTabTransitionQuiet } from "../../../../../lib/tutorial/tutorialTabTransitionQuiet";

export const TUTORIAL_RESTART_TOKEN_KEY = "uniterz:tutorialLiveRestartAt:v1";

type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeTutorialRestartNative(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function requestTutorialRestartNative(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

/** 再開トークンを書き、メモリ購読者へ通知（複数回リトライ用） */
export async function markTutorialRestartPendingNative(
  atMs: number = Date.now()
): Promise<number> {
  try {
    await AsyncStorage.setItem(TUTORIAL_RESTART_TOKEN_KEY, String(atMs));
  } catch {
    /* ignore */
  }
  return atMs;
}

/** Games 側で消費。未消費ならタイムスタンプ、なければ null */
export async function consumeTutorialRestartTokenNative(): Promise<
  number | null
> {
  try {
    const raw = await AsyncStorage.getItem(TUTORIAL_RESTART_TOKEN_KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(TUTORIAL_RESTART_TOKEN_KEY);
    const n = Number(raw);
    return Number.isFinite(n) ? n : Date.now();
  } catch {
    return null;
  }
}

/**
 * 既読・下書き・ピックを消し、フェーズを welcome にする。
 * 戻り値はナビ params に載せるタイムスタンプ。
 */
export async function prepareTutorialRestartNative(
  uid: string | null
): Promise<number> {
  /** ナビ前にタブスライドを止め、welcome 合成の黒画面を避ける */
  armTutorialTabTransitionQuiet();
  prefetchRankingsLogoGlb();
  await clearAppTutorialSeenNative(uid);
  await clearTutorialLivePickNative();
  if (uid) {
    try {
      await AsyncStorage.removeItem(`predictDraft:${uid}:${TUTORIAL_NBA_GAME_ID}`);
    } catch {
      /* ignore */
    }
  }
  await writeTutorialLivePhaseNative("welcome");
  const at = await markTutorialRestartPendingNative(Date.now());
  return at;
}

/** ナビ後に Games がマウントされるまでイベントを再送 */
export function pulseTutorialRestartNative(): void {
  requestTutorialRestartNative();
  const delays = [0, 50, 150, 400, 900];
  for (const ms of delays) {
    setTimeout(() => requestTutorialRestartNative(), ms);
  }
}

const clearListeners = new Set<Listener>();

/** チュートリアル完了・スキップ — Games のモック試合残留を消す */
export function subscribeTutorialClearedNative(fn: Listener): () => void {
  clearListeners.add(fn);
  return () => {
    clearListeners.delete(fn);
  };
}

export function requestTutorialClearedNative(): void {
  clearListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}
