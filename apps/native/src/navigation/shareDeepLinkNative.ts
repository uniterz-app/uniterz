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
        // ProfileHome が一瞬出ないよう、PublicProfile だけでスタックを差し替える
        navigationRef.navigate("Main", {
          screen: "ProfileTab",
          params: {
            state: {
              routes: [
                {
                  name: "PublicProfile",
                  params: { handle: target.handle },
                },
              ],
              index: 0,
            },
          },
        });
        return;
      case "rankings":
        navigationRef.navigate("Main", {
          screen: "RankingsTab",
          params: { screen: "RankingsHome" },
        });
        return;
      case "community":
        navigationRef.navigate("Main", {
          screen: "LeaderboardsTab",
          params: {
            screen: "CommunityDetail",
            params: { groupId: target.groupId },
          },
        });
        return;
    }
  });
}
