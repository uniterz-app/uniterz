import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as Updates from "expo-updates";

const LAUNCH_APPLY_WINDOW_MS = 10_000;
/** Android は課金・画像選択・Google ログインでも background になるので、短い離脱では reload しない */
const MIN_AWAY_TO_APPLY_MS = 5 * 60_000;
const RECHECK_INTERVAL_MS = 30 * 60_000;

const jsStartedAt = Date.now();

/**
 * OTA を「完全終了 → 再起動」待ちにせず反映する。
 * 起動直後（スプラッシュ中）に落ちてきた更新はその場で、それ以降は 5 分以上離れてから戻ったときに reload。
 * 操作中には reload しない（入力途中の画面を消さない）。
 */
export function useOtaAutoApplyNative() {
  const { isUpdatePending } = Updates.useUpdates();
  const backgroundedAt = useRef<number | null>(null);
  const lastCheckAt = useRef(jsStartedAt);
  const reloading = useRef(false);

  const enabled = !__DEV__ && Updates.isEnabled;

  useEffect(() => {
    if (!enabled || !isUpdatePending || reloading.current) return;
    if (Date.now() - jsStartedAt > LAUNCH_APPLY_WINDOW_MS) return;
    reloading.current = true;
    void Updates.reloadAsync().catch(() => {
      reloading.current = false;
    });
  }, [enabled, isUpdatePending]);

  useEffect(() => {
    if (!enabled) return;
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
          void Updates.reloadAsync().catch(() => {
            reloading.current = false;
          });
        }
        return;
      }

      if (Date.now() - lastCheckAt.current < RECHECK_INTERVAL_MS) return;
      lastCheckAt.current = Date.now();
      void (async () => {
        try {
          const check = await Updates.checkForUpdateAsync();
          if (check.isAvailable) await Updates.fetchUpdateAsync();
        } catch {
          /* 通信失敗は次の復帰で再試行 */
        }
      })();
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [enabled, isUpdatePending]);
}
