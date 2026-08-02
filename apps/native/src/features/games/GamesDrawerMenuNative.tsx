import { StyleSheet, View } from "react-native";
import type { ReactNode } from "react";
import CyberSideMenuSectionTitleNative from "../../ui/CyberSideMenuSectionTitleNative";
import SideMenuItemButtonNative from "../../ui/SideMenuItemButtonNative";
import {
  CYBER_TAB_CYAN,
  SIDE_MENU_LABEL_FONT,
  sideMenuLabelStyle,
} from "../../ui/cyberSideMenuNative";

const ICONS = {
  nba: require("../../../assets/games-drawer/nba.png") as number,
  awards: require("../../../assets/games-drawer/awards.png") as number,
  standings: require("../../../assets/games-drawer/standings.png") as number,
} as const;

const BRANCH = "rgba(0, 245, 255, 0.42)";

type Props = {
  league: "nba" | "wc";
  onSelectNba: () => void;
  onSelectAwardsPredict: () => void;
  onSelectStandingsPredict: () => void;
  language: "ja" | "en";
};

/** NBA 下の枝分かれ行（├ / └） */
function BranchRow({ last, children }: { last?: boolean; children: ReactNode }) {
  return (
    <View style={styles.branchRow}>
      <View
        pointerEvents="none"
        style={[styles.vline, last ? styles.vlineLast : null]}
      />
      <View pointerEvents="none" style={styles.hline} />
      <View style={styles.branchContent}>{children}</View>
    </View>
  );
}

/** Web `GamesDrawerMenu` と同等（NBA + 枝分かれサブ） */
export default function GamesDrawerMenuNative({
  league,
  onSelectNba,
  onSelectAwardsPredict,
  onSelectStandingsPredict,
  language,
}: Props) {
  const isJa = language === "ja";
  const labelStyle = sideMenuLabelStyle(language);

  return (
    <View style={styles.root}>
      <CyberSideMenuSectionTitleNative first>
        {isJa ? "試合" : "Games"}
      </CyberSideMenuSectionTitleNative>
      <View style={styles.itemGroup}>
        <View style={styles.nbaCluster}>
          <SideMenuItemButtonNative
            iconSource={ICONS.nba}
            active={league === "nba"}
            labelStyle={labelStyle}
            onPress={onSelectNba}
          >
            NBA
          </SideMenuItemButtonNative>

          <View style={styles.branchList}>
            <View pointerEvents="none" style={styles.trunkFromParent} />

            <BranchRow>
              <SideMenuItemButtonNative
                iconSource={ICONS.awards}
                dense
                labelStyle={labelStyle}
                onPress={onSelectAwardsPredict}
              >
                {isJa ? "アワード予想" : "Award Predictions"}
              </SideMenuItemButtonNative>
            </BranchRow>
            <BranchRow last>
              <SideMenuItemButtonNative
                iconSource={ICONS.standings}
                dense
                labelStyle={labelStyle}
                onPress={onSelectStandingsPredict}
              >
                {isJa ? "順位予想" : "Standings Predictions"}
              </SideMenuItemButtonNative>
            </BranchRow>
          </View>
        </View>
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
  nbaCluster: {
    gap: 0,
  },
  branchList: {
    marginTop: 4,
    gap: 6,
    position: "relative",
  },
  trunkFromParent: {
    position: "absolute",
    left: 9,
    top: -4,
    width: 1,
    height: 4,
    backgroundColor: BRANCH,
    shadowColor: CYBER_TAB_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  branchRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 36,
  },
  vline: {
    position: "absolute",
    left: 9,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: BRANCH,
    shadowColor: CYBER_TAB_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  vlineLast: {
    bottom: undefined,
    height: "50%",
  },
  hline: {
    position: "absolute",
    left: 9,
    top: "50%",
    width: 14,
    height: 1,
    marginTop: -0.5,
    backgroundColor: BRANCH,
    shadowColor: CYBER_TAB_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  branchContent: {
    flex: 1,
    paddingLeft: 28,
    minWidth: 0,
  },
});
