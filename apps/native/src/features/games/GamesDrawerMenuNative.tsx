import { StyleSheet, View } from "react-native";
import CyberSideMenuSectionTitleNative from "../../ui/CyberSideMenuSectionTitleNative";
import SideMenuItemButtonNative from "../../ui/SideMenuItemButtonNative";
import { SIDE_MENU_LABEL_FONT } from "../../ui/cyberSideMenuNative";

type Props = {
  league: "nba" | "wc";
  onSelectNba: () => void;
  onSelectWorldCup: () => void;
  language: "ja" | "en";
};

/** Web `GamesDrawerMenu` と同等（NBA / World Cup） */
export default function GamesDrawerMenuNative({
  league,
  onSelectNba,
  onSelectWorldCup,
  language,
}: Props) {
  const isJa = language === "ja";
  const isEn = language === "en";
  const labelStyle = isEn
    ? { ...SIDE_MENU_LABEL_FONT, textTransform: "uppercase" as const }
    : SIDE_MENU_LABEL_FONT;

  return (
    <View style={styles.root}>
      <CyberSideMenuSectionTitleNative first>
        {isJa ? "試合" : "Games"}
      </CyberSideMenuSectionTitleNative>
      <View style={styles.itemGroup}>
        <SideMenuItemButtonNative
          icon="trophy-outline"
          active={league === "nba"}
          labelStyle={labelStyle}
          onPress={onSelectNba}
        >
          {isJa ? "NBA" : "NBA"}
        </SideMenuItemButtonNative>
        <SideMenuItemButtonNative
          icon="earth"
          active={league === "wc"}
          labelStyle={labelStyle}
          onPress={onSelectWorldCup}
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
