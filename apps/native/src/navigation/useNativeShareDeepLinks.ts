import { useEffect } from "react";
import * as Linking from "expo-linking";
import { parseShareDeepLink } from "../../../../lib/share/shareAppUrls";
import { navigateFromShareDeepLink } from "./shareDeepLinkNative";

function handleIncomingShareUrl(rawUrl: string | null) {
  if (!rawUrl) return;
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
