import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import type * as UpdatesModule from "expo-updates";

const LAUNCH_APPLY_WINDOW_MS = 10_000;
/** Android は課金・画像選択・Google ログインでも background になるので、短い離脱では reload しない */
const MIN_AWAY_TO_APPLY_MS = 5 * 60_000;
const RECHECK_INTERVAL_MS = 30 * 60_000;

const jsStartedAt = Date.now();

/** 開発クライアントには ExpoUpdates ネイティブモジュールが無いので、本番バンドルでだけ読み込む */
function loadUpdates(): typeof UpdatesModule | null {
  if (__DEV__) return null;
  try {
    const mod = require("expo-updates") as typeof UpdatesModule;
    return mod.isEnabled ? mod : null;
  } catch {
    return null;
  }
}

const Updates = loadUpdates();

function useNoop() {}

/**
 * OTA を「完全終了 → 再起動」待ちにせず反映する。
 * 起動直後（スプラッシュ中）に落ちてきた更新はその場で、それ以降は 5 分以上離れてから戻ったときに reload。
 * 操作中には reload しない（入力途中の画面を消さない）。
 */
function useOtaAutoApply(updates: typeof UpdatesModule) {
  const { isUpdatePending } = updates.useUpdates();
  const backgroundedAt = useRef<number | null>(null);
  const lastCheckAt = useRef(jsStartedAt);
  const reloading = useRef(false);

  useEffect(() => {
    if (!isUpdatePending || reloading.current) return;
    if (Date.now() - jsStartedAt > LAUNCH_APPLY_WINDOW_MS) return;
    reloading.current = true;
    void updates.reloadAsync().catch(() => {
      reloading.current = false;
    });
  }, [updates, isUpdatePending]);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === "background") {
        backgroundedAt.current = Date.now();
        return;
      }
      if (next !== "active") return;
      const awayMs =
        backgroundedAt.current == null ? 0 : Date.now() - backgroundedAt.current;
      backgroundedAt.current = null;

      if (isUpdatePending) {
        if (awayMs >= MIN_AWAY_TO_APPLY_MS && !reloading.current) {
          reloading.current = true;
          void updates.reloadAsync().catch(() => {
            reloading.current = false;
          });
        }
        return;
      }

      if (Date.now() - lastCheckAt.current < RECHECK_INTERVAL_MS) return;
      lastCheckAt.current = Date.now();
      void (async () => {
        try {
          const check = await updates.checkForUpdateAsync();
          if (check.isAvailable) await updates.fetchUpdateAsync();
        } catch {
          /* 通信失敗は次の復帰で再試行 */
        }
      })();
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [updates, isUpdatePending]);
}

export const useOtaAutoApplyNative: () => void = Updates
  ? () => useOtaAutoApply(Updates)
  : useNoop;
