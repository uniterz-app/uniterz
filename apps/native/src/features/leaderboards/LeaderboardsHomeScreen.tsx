import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { spacing } from "../../theme/tokens";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import type { MainTabParamList } from "../../navigation/types";
import {
  markLeaderboardsIntroSeenNative,
  readLeaderboardsIntroSeenNative,
} from "../../navigation/navLeaderboardsIntroSeenNative";
import { useNativeMyRankingUser } from "../rankings/useNativeMyRankingUser";
import LeaderboardsGroupsIntroModalNative from "./LeaderboardsGroupsIntroModalNative";
import RankingsCommunityPanelNative from "./RankingsCommunityPanelNative";

type Props = { bottomReserveY?: number };

export default function LeaderboardsHomeScreen({ bottomReserveY = 0 }: Props) {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { topContentPadY } = useBottomTabBarInsets();
  const { fUser } = useFirebaseUser();
  const { user } = useNativeMyRankingUser(fUser?.uid);
  const language = user.language;
  const [introOpen, setIntroOpen] = useState(false);

  useEffect(() => {
    void readLeaderboardsIntroSeenNative().then((seen) => {
      if (!seen) {
        void markLeaderboardsIntroSeenNative();
        setIntroOpen(true);
      }
    });
  }, []);

  return (
    <View style={[styles.root, { paddingTop: topContentPadY }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomReserveY + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <RankingsCommunityPanelNative
          language={language}
          bottomReserveY={0}
          onOpenProfile={(handle) => {
            navigation.navigate("ProfileTab", {
              screen: "ProfileHome",
              params: { handle, fromRankings: true },
            });
          }}
        />
      </ScrollView>

      <LeaderboardsGroupsIntroModalNative
        visible={introOpen}
        language={language}
        onClose={() => setIntroOpen(false)}
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
