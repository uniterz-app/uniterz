import { useEffect } from "react";
import * as Linking from "expo-linking";
import { parseShareDeepLink } from "../../../../lib/share/shareAppUrls";
import { navigateFromShareDeepLink } from "./shareDeepLinkNative";
import { navigationRef } from "./navigationRef";

/** __DEV__ のみ: `uniterz://dev/<ProfileStack の画面名>` でプレビュー画面を開く（シミュレーター確認用） */
function handleDevUrl(rawUrl: string): boolean {
  if (!__DEV__) return false;
  const m = /^uniterz:\/\/dev\/([A-Za-z]+)/.exec(rawUrl);
  if (!m || !navigationRef.isReady()) return false;
  (navigationRef.navigate as (...args: unknown[]) => void)("Main", {
    screen: "ProfileTab",
    params: { screen: m[1], initial: false },
  });
  return true;
}

function handleIncomingShareUrl(rawUrl: string | null) {
  if (!rawUrl) return;
  if (handleDevUrl(rawUrl)) return;
  const target = parseShareDeepLink(rawUrl);
  if (target) navigateFromShareDeepLink(target);
}

/** Universal Link / カスタムスキーム → 共有先画面へ */
export function useNativeShareDeepLinks() {
  useEffect(() => {
    void Linking.getInitialURL().then(handleIncomingShareUrl);
    const sub = Linking.addEventListener("url", ({ url }) => {
      handleIncomingShareUrl(url);
    });
    return () => sub.remove();
  }, []);
}
