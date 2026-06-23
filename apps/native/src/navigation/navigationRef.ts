import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** NavigationContainer 準備完了後に実行（通知タップは起動直後もあり得る） */
export function runWhenNavigationReady(run: () => void): void {
  if (navigationRef.isReady()) {
    run();
    return;
  }
  let attempts = 0;
  const id = setInterval(() => {
    attempts += 1;
    if (navigationRef.isReady()) {
      clearInterval(id);
      run();
      return;
    }
    if (attempts >= 30) {
      clearInterval(id);
      if (__DEV__) {
        console.warn("[push] navigationRef not ready — tap navigation skipped");
      }
    }
  }, 100);
}
