/** Result スタック用 · チーム / プレイヤー詳細 */
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../hooks/useNativeUserLanguage";
import { resolveLocalizedLang } from "../../../../../lib/i18n/localize";
import type { ResultStackParamList } from "../../navigation/types";
import TeamDetailPreviewScreenNative from "../games/teamDetail/TeamDetailPreviewScreenNative";
import PlayerDetailPreviewScreenNative from "../games/playerDetail/PlayerDetailPreviewScreenNative";

export function ResultTeamDetailPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ResultStackParamList>>();
  const route =
    useRoute<RouteProp<ResultStackParamList, "TeamDetailPreview">>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);

  return (
    <TeamDetailPreviewScreenNative
      language={resolveLocalizedLang(language) === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
      teamId={route.params?.teamId}
      onSelectPlayer={(playerId) =>
        navigation.navigate("PlayerDetailPreview", { playerId })
      }
    />
  );
}

export function ResultPlayerDetailPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ResultStackParamList>>();
  const route =
    useRoute<RouteProp<ResultStackParamList, "PlayerDetailPreview">>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);

  return (
    <PlayerDetailPreviewScreenNative
      language={resolveLocalizedLang(language) === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
      playerId={route.params?.playerId}
    />
  );
}
