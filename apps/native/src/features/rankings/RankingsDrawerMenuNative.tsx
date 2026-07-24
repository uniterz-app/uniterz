import { StyleSheet, View } from "react-native";
import CyberSideMenuSectionTitleNative from "../../ui/CyberSideMenuSectionTitleNative";
import SideMenuItemButtonNative from "../../ui/SideMenuItemButtonNative";
import { SIDE_MENU_LABEL_FONT, sideMenuLabelStyle } from "../../ui/cyberSideMenuNative";

type League = "nba" | "wc";

type Props = {
  league: League;
  onChange: (league: League) => void;
  language: "ja" | "en";
  /** SQUAD BATTLE プレビュー（仮入口） */
  onOpenSquadBattlePreview?: () => void;
};

/** Web `RankingsDrawerMenu` 相当 */
export default function RankingsDrawerMenuNative({
  league,
  onChange,
  language,
  onOpenSquadBattlePreview,
}: Props) {
  const isJa = language === "ja";
  const labelStyle = sideMenuLabelStyle(language);

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
          labelStyle={{ ...SIDE_MENU_LABEL_FONT, textTransform: "uppercase" }}
          onPress={() => onChange("wc")}
        >
          World Cup
        </SideMenuItemButtonNative>
        {onOpenSquadBattlePreview ? (
          <SideMenuItemButtonNative
            icon="account-group-outline"
            labelStyle={{ ...SIDE_MENU_LABEL_FONT, textTransform: "uppercase" }}
            onPress={onOpenSquadBattlePreview}
          >
            Squad Battle (Preview)
          </SideMenuItemButtonNative>
        ) : null}
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
