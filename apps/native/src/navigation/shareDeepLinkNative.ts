import type { ShareDeepLinkTarget } from "../../../../lib/share/shareAppUrls";
import { navigationRef, runWhenNavigationReady } from "./navigationRef";

export function navigateFromShareDeepLink(target: ShareDeepLinkTarget) {
  runWhenNavigationReady(() => {
    if (!navigationRef.isReady()) return;

    switch (target.kind) {
      case "result":
        navigationRef.navigate("Main", {
          screen: "ResultTab",
          params: {
            screen: "ResultDetail",
            params: { postId: target.postId },
          },
        });
        return;
      case "profile":
        navigationRef.navigate("Main", {
          screen: "ProfileTab",
          params: {
            screen: "PublicProfile",
            params: { handle: target.handle },
            initial: false,
          },
        });
        return;
      case "rankings":
        navigationRef.navigate("Main", {
          screen: "RankingsTab",
          params: { screen: "RankingsHome" },
        });
        return;
    }
  });
}
