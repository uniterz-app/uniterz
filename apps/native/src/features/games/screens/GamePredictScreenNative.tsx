/**
 * 通知・ディープリンク用の薄い入口。
 * 本体の予想 UI は GamesHome の PredictModal に一本化する。
 */
import { useEffect } from "react";
import { View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { GamesStackParamList } from "../../../navigation/types";
import { BlocksPulseLoader } from "../../../components/BlocksPulseLoader";

export default function GamePredictScreenNative() {
  const route = useRoute<RouteProp<GamesStackParamList, "GamePredict">>();
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const gameId = route.params?.gameId?.trim() ?? "";

  useEffect(() => {
    if (!gameId) {
      navigation.replace("GamesHome");
      return;
    }
    navigation.replace("GamesHome", {
      openPredictGameId: gameId,
      expandScoreForm: true,
    });
  }, [gameId, navigation]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <BlocksPulseLoader />
    </View>
  );
}
