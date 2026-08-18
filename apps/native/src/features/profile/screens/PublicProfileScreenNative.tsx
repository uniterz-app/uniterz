/** Web `app/mobile/u/[handle]/page.tsx` → ProfileHome の handle ルート薄ラッパー */
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import ProfileHomeScreen from "../ProfileHomeScreen";
import type { PublicProfileParams } from "../../../navigation/types";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";

export default function PublicProfileScreenNative() {
  const route = useRoute<RouteProp<{ PublicProfile: PublicProfileParams }, "PublicProfile">>();
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const handle = route.params?.handle ?? "";

  return (
    <ProfileHomeScreen
      key={handle}
      bottomReserveY={bottomContentReserveY}
      routeHandle={handle}
      fromRankings={route.params?.fromRankings === true}
      fromLeaderboards={route.params?.fromLeaderboards === true}
      fromWeeklyReport={route.params?.fromWeeklyReport === true}
      fromResultDetail={route.params?.fromResultDetail === true}
      fromMarkList={route.params?.fromMarkList === true}
      resultDetailPostId={route.params?.resultDetailPostId}
      leaderboardsGroupId={route.params?.leaderboardsGroupId}
    />
  );
}
