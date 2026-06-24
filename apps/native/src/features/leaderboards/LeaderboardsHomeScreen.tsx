import { ScrollView, StyleSheet, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { spacing } from "../../theme/tokens";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import type { LeaderboardsStackParamList, MainTabParamList } from "../../navigation/types";
import { useNativeMyRankingUser } from "../rankings/useNativeMyRankingUser";
import RankingsCommunityPanelNative from "./RankingsCommunityPanelNative";

type Props = { bottomReserveY?: number };

export default function LeaderboardsHomeScreen({ bottomReserveY = 0 }: Props) {
  const tabNavigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const stackNavigation = useNavigation<NativeStackNavigationProp<LeaderboardsStackParamList>>();
  const route = useRoute<RouteProp<LeaderboardsStackParamList, "LeaderboardsHome">>();
  const reopenGroupId = route.params?.reopenGroupId ?? null;
  const { topContentPadY } = useBottomTabBarInsets();
  const { fUser } = useFirebaseUser();
  const { user } = useNativeMyRankingUser(fUser?.uid);
  const language = user.language;

  return (
    <View style={[styles.root, { paddingTop: topContentPadY }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomReserveY + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <RankingsCommunityPanelNative
          language={language}
          bottomReserveY={0}
          reopenGroupId={reopenGroupId}
          onReopenGroupConsumed={() => {
            stackNavigation.setParams({ reopenGroupId: undefined });
          }}
          onOpenProfile={(handle, groupId) => {
            tabNavigation.navigate("ProfileTab", {
              screen: "ProfileHome",
              params: {
                handle,
                fromLeaderboards: true,
                ...(groupId ? { leaderboardsGroupId: groupId } : {}),
              },
            });
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scroll: {
    flexGrow: 1,
  },
});
