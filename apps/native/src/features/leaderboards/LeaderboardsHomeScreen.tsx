import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import type { MainTabParamList } from "../../navigation/types";
import { useNativeMyRankingUser } from "../rankings/useNativeMyRankingUser";
import RankingsCommunityPanelNative from "./RankingsCommunityPanelNative";

type Props = { bottomReserveY?: number };

export default function LeaderboardsHomeScreen({ bottomReserveY = 0 }: Props) {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const insets = useSafeAreaInsets();
  const { fUser } = useFirebaseUser();
  const { user } = useNativeMyRankingUser(fUser?.uid);
  const language = user.language;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 4 }]}>
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
