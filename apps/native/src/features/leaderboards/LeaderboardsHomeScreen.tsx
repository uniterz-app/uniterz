import { ScrollView, StyleSheet, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { spacing } from "../../theme/tokens";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import type { LeaderboardsStackParamList } from "../../navigation/types";
import { navigateToPublicProfileNative } from "../../navigation/navigateToPublicProfileNative";
import { useNativeMyRankingUser } from "../rankings/useNativeMyRankingUser";
import RankingsCommunityPanelNative from "./RankingsCommunityPanelNative";
import TutorialLiveHostNative from "../tutorial/TutorialLiveHostNative";
import type { Language } from "../../../../../lib/i18n/language";

type Props = { bottomReserveY?: number };

export default function LeaderboardsHomeScreen({ bottomReserveY = 0 }: Props) {
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
          onOpenSquadBattle={() => {
            stackNavigation.navigate("SquadBattlePreview");
          }}
          onOpenProfile={(handle, groupId) => {
            if (groupId) {
              stackNavigation.setParams({ reopenGroupId: groupId });
            }
            navigateToPublicProfileNative(stackNavigation, {
              handle,
              fromLeaderboards: true,
              ...(groupId ? { leaderboardsGroupId: groupId } : {}),
            });
          }}
        />
      </ScrollView>
      <TutorialLiveHostNative
        page="groups"
        language={(language === "en" ? "en" : "ja") as Language}
      />
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
