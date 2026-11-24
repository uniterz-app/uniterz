/** 試合一覧の右端 BUZZ。トレード Buzz / 確定トレード */
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { GamesStackParamList } from "../../../navigation/types";
import TradeBuzzPreviewScreenNative from "../predict/buzz/TradeBuzzPreviewScreenNative";

export default function TradeBuzzScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  return (
    <TradeBuzzPreviewScreenNative onClose={() => navigation.goBack()} />
  );
}
