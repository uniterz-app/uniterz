import { useSyncExternalStore } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { uniterzBrandShelfOffsetTop } from "../features/UniterzBrandShelfNative";
import {
  getAppBrandShelfCollapsed,
  subscribeAppBrandShelfHidden,
} from "../../../../lib/ui/appBrandShelfVisibility";
import {
  getTutorialWelcomeBrandHidden,
  subscribeTutorialWelcomeBrandHidden,
} from "../../../../lib/tutorial/tutorialWelcomeChrome";

/**
 * MainTab 上部棚の占有高さ（棚を描かないときは 0）。
 * 棚は上に重ねて描き、各スタック画面の contentStyle でこの分だけ下げる。
 */
export function useBrandShelfSpaceNative(): {
  shelfRendered: boolean;
  shelfSpace: number;
} {
  const insets = useSafeAreaInsets();
  const collapsed = useSyncExternalStore(
    subscribeAppBrandShelfHidden,
    getAppBrandShelfCollapsed,
    () => false
  );
  const welcomeHidden = useSyncExternalStore(
    subscribeTutorialWelcomeBrandHidden,
    getTutorialWelcomeBrandHidden,
    () => false
  );
  const shelfRendered = !(collapsed || welcomeHidden);
  return {
    shelfRendered,
    shelfSpace: shelfRendered ? uniterzBrandShelfOffsetTop(insets.top) : 0,
  };
}
