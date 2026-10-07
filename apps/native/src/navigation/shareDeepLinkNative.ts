import type { ShareDeepLinkTarget } from "../../../../lib/share/shareAppUrls";
import { navigationRef } from "./navigationRef";

/** ログイン前・起動直後に来た共有リンク。Main が出たら消化する */
let pendingTarget: ShareDeepLinkTarget | null = null;

function mainRouteMounted(): boolean {
  if (!navigationRef.isReady()) return false;
  return navigationRef.getRootState()?.routeNames?.includes("Main") ?? false;
}

function navigateNow(target: ShareDeepLinkTarget) {
  switch (target.kind) {
    case "result":
      navigationRef.navigate("Main", {
        screen: "ResultTab",
        params: {
          screen: "ResultDetail",
          params: { postId: target.postId },
          // タブ未マウント時も ResultHome を下に残し、戻るで一覧へ戻れるようにする
          initial: false,
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
          initial: false,
        },
      });
      return;
  }
}

/** 保留中の共有リンクを開く（Main マウント時・ナビ準備完了時に呼ぶ） */
export function flushPendingShareDeepLink(): void {
  if (!pendingTarget || !mainRouteMounted()) return;
  const target = pendingTarget;
  pendingTarget = null;
  navigateNow(target);
}

export function navigateFromShareDeepLink(target: ShareDeepLinkTarget) {
  pendingTarget = target;
  flushPendingShareDeepLink();
}
