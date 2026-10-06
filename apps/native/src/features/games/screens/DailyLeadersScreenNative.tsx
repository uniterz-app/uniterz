/** Web `/mobile/today-leaders` 相当 — 今日の試合のスタッツリーダー */
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";
import GamesNbaSubpageShellNative from "../GamesNbaSubpageShellNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import type { GamesStackParamList } from "../../../navigation/types";
import NbaDailyLeadersPanelNative from "../stats/NbaDailyLeadersPanelNative";

export default function DailyLeadersScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language, timeZone } = useNativeUserLanguage(fUser?.uid);

  return (
    <GamesNbaSubpageShellNative
      eyebrow="GAMES"
      title="TODAY'S LEADERS"
      onBack={() => navigation.goBack()}
      scroll={false}
      contentStyle={styles.shell}
    >
      <NbaDailyLeadersPanelNative
        language={language}
        timeZone={timeZone}
        onSelectPlayer={(playerId) =>
          navigation.navigate("PlayerDetailPreview", { playerId })
        }
      />
    </GamesNbaSubpageShellNative>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
});
