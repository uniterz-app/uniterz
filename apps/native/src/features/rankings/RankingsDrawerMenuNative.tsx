import { StyleSheet, View } from "react-native";
import CyberSideMenuSectionTitleNative from "../../ui/CyberSideMenuSectionTitleNative";
import SideMenuItemButtonNative from "../../ui/SideMenuItemButtonNative";
import { SIDE_MENU_LABEL_FONT } from "../../ui/cyberSideMenuNative";

type League = "nba" | "wc";

type Props = {
  league: League;
  onChange: (league: League) => void;
  language: "ja" | "en";
};

/** Web `RankingsDrawerMenu` 相当 */
export default function RankingsDrawerMenuNative({ league, onChange, language }: Props) {
  const isJa = language === "ja";
  const isEn = language === "en";
  const labelStyle = isEn
    ? { ...SIDE_MENU_LABEL_FONT, textTransform: "uppercase" as const }
    : SIDE_MENU_LABEL_FONT;

  return (
    <View style={styles.root}>
      <CyberSideMenuSectionTitleNative first>
        {isJa ? "ランキング" : "Rankings"}
      </CyberSideMenuSectionTitleNative>
      <View style={styles.itemGroup}>
        <SideMenuItemButtonNative
          icon="trophy-outline"
          active={league === "nba"}
          labelStyle={labelStyle}
          onPress={() => onChange("nba")}
        >
          {isJa ? "NBA プレーオフ" : "NBA Playoffs"}
        </SideMenuItemButtonNative>
        <SideMenuItemButtonNative
          icon="earth"
          active={league === "wc"}
          labelStyle={labelStyle}
          onPress={() => onChange("wc")}
        >
          {isJa ? "ワールドカップ" : "World Cup"}
        </SideMenuItemButtonNative>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  itemGroup: {
    gap: 8,
  },
});
