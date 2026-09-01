/** @deprecated `TeamDetailPreview` へリダイレクト（レガシー Firestore 画面） */
import { useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { GamesStackParamList } from "../../../navigation/types";

export default function TeamDetailScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const route = useRoute<RouteProp<GamesStackParamList, "TeamDetail">>();

  useEffect(() => {
    navigation.replace("TeamDetailPreview", {
      teamId: route.params?.teamId,
    });
  }, [navigation, route.params?.teamId]);

  return null;
}
