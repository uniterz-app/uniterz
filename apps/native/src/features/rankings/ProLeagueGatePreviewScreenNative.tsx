/**
 * __DEV__ Free が PRO LEAGUE を開いたときのゲート（本番 `RankingsProLeagueTeaserNative`）。
 */
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import type { ProfileStackParamList } from "../../navigation/types";
import RankingsProLeagueMeshBackgroundNative from "./RankingsProLeagueMeshBackgroundNative";
import { RankingsProLeagueTeaserNative } from "./RankingsProLeagueTeaserNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

export default function ProLeagueGatePreviewScreenNative({
  language,
  onClose,
}: Props) {
  const isJa = language === "ja";
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  return (
    <View style={styles.root}>
      <RankingsProLeagueMeshBackgroundNative />
      <MobilePageShell
        title="PRO LEAGUE GATE"
        eyebrow="DEV PREVIEW"
        subtitle={
          isJa
            ? "Free が PRO LEAGUE タブを開いたときの本番ゲート。"
            : "Production gate when Free opens PRO LEAGUE."
        }
        appBackground
        onClose={onClose}
      >
        <View style={styles.body}>
          <RankingsProLeagueTeaserNative
            language={language}
            onPressSubscribe={() => navigation.navigate("ProSubscribe")}
            onBackToPickUp={onClose}
          />
        </View>
      </MobilePageShell>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050508",
  },
  body: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 4,
  },
});
