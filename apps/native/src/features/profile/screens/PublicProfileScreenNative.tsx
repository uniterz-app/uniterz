/** Web `app/mobile/u/[handle]/page.tsx` → ProfileHome の handle ルート薄ラッパー */
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import ProfileHomeScreen from "../ProfileHomeScreen";
import type { ProfileStackParamList } from "../../../navigation/types";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";

export default function PublicProfileScreenNative() {
  const route = useRoute<RouteProp<ProfileStackParamList, "PublicProfile">>();
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const handle = route.params?.handle ?? "";

  return (
    <ProfileHomeScreen
      key={handle}
      bottomReserveY={bottomContentReserveY}
      routeHandle={handle}
      fromRankings={route.params?.fromRankings === true}
      fromLeaderboards={route.params?.fromLeaderboards === true}
      leaderboardsGroupId={route.params?.leaderboardsGroupId}
    />
  );
}
