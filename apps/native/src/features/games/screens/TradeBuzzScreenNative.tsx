/** 試合一覧の右端 BUZZ。トレード Buzz / 確定トレード */
import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { GamesStackParamList } from "../../../navigation/types";
import TradeBuzzPreviewScreenNative from "../predict/buzz/TradeBuzzPreviewScreenNative";
import { showTradeBuzzRewardedAdNative } from "../../ads/proPickRewardedAdNative";
import { waitHostDismissedForRewardedAd } from "../scheduleAfterPredictModalDismissed";
import { setTradeBuzzAdEarned } from "../predict/buzz/tradeBuzzAdSessionNative";

export default function TradeBuzzScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const presentRewardedAd = useCallback(
    async (userId: string) => {
      navigation.goBack();
      await waitHostDismissedForRewardedAd();
      try {
        const result = await showTradeBuzzRewardedAdNative({ userId });
        if (result === "earned") setTradeBuzzAdEarned(true);
        return result;
      } finally {
        navigation.navigate("TradeBuzz");
      }
    },
    [navigation]
  );
  return (
    <TradeBuzzPreviewScreenNative
      onClose={() => navigation.goBack()}
      presentRewardedAd={presentRewardedAd}
    />
  );
}
