/** Web `WcChampionCard` 相当 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import {
  WC_TREE_CHAMPION_CARD_H,
  WC_TREE_CHAMPION_CARD_W,
} from "@/lib/wc/wc-bracket-tree-layout";
import CountryFlagNative from "../../CountryFlagNative";

type Props = {
  teamId: string;
};

export default function WcBracketChampionCardNative({ teamId }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.crownWrap}>
        <MaterialCommunityIcons
          name="crown"
          size={21}
          color="#fcd34d"
          style={styles.crownIcon}
        />
      </View>
      <View style={styles.flagWrap}>
        <CountryFlagNative teamId={teamId} variant="bracketChampion" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: WC_TREE_CHAMPION_CARD_W,
    alignItems: "center",
  },
  crownWrap: {
    position: "absolute",
    bottom: WC_TREE_CHAMPION_CARD_H,
    marginBottom: 5,
    alignSelf: "center",
    zIndex: 2,
  },
  crownIcon: {
    shadowColor: "#fbbf24",
    shadowOpacity: 0.65,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  flagWrap: {
    width: WC_TREE_CHAMPION_CARD_W,
    height: WC_TREE_CHAMPION_CARD_H,
    overflow: "hidden",
    borderRadius: 2,
    shadowColor: "#fbbf24",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
});
