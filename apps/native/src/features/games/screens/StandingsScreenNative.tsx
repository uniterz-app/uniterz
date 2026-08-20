/** Web `/mobile/standings` 相当 — カンファレンス順位表 */
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import type { GamesStackParamList } from "../../../navigation/types";
import NbaLeagueStandingsPanelNative from "../standings/NbaLeagueStandingsPanelNative";

export default function StandingsScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const lang = language === "ja" ? "ja" : "en";
  const isJa = lang === "ja";

  return (
    <MobilePageShell
      eyebrow="GAMES"
      title="STANDINGS"
      subtitle={
        isJa
          ? "イースト / ウエスト。成績・勝率・連勝敗・L10・HOME / AWAY。"
          : "East / West. Record, win%, streak, L10, home / away."
      }
      appBackground
      onClose={() => navigation.goBack()}
    >
      <NbaLeagueStandingsPanelNative
        language={lang}
        onSelectTeam={(teamId) =>
          navigation.navigate("TeamDetailPreview", { teamId })
        }
      />
    </MobilePageShell>
  );
}
