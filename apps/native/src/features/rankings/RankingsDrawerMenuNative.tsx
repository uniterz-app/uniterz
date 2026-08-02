import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import CyberSideMenuSectionTitleNative from "../../ui/CyberSideMenuSectionTitleNative";
import SideMenuItemButtonNative from "../../ui/SideMenuItemButtonNative";
import {
  CYBER_SIDE_MENU_BRANCH,
  CYBER_SIDE_MENU_BRANCH_GLOW_COLOR,
  CYBER_SIDE_MENU_BRANCH_JOINT,
  SIDE_MENU_LABEL_FONT,
  sideMenuLabelStyle,
} from "../../ui/cyberSideMenuNative";
import type { NbaRankingBoard } from "../../../../../lib/rankings/rankingDivision";
import { rankingsTexts } from "./rankingsTexts";

type League = "nba" | "wc";

type Props = {
  league: League;
  onChange: (league: League) => void;
  language: "ja" | "en";
  nbaBoard?: NbaRankingBoard;
  onSelectNbaRegular?: () => void;
  onSelectNbaPlayoffs?: () => void;
  /** SQUAD BATTLE プレビュー（仮入口） */
  onOpenSquadBattlePreview?: () => void;
};

/** NBA 下の枝分かれ行（├ / └）— `GamesDrawerMenuNative` と同型（2px 線 + 枝先ジョイント） */
function BranchRow({ last, children }: { last?: boolean; children: ReactNode }) {
  return (
    <View style={styles.branchRow}>
      <View
        pointerEvents="none"
        style={[styles.vline, last ? styles.vlineLast : null]}
      />
      <View pointerEvents="none" style={styles.hline} />
      <View pointerEvents="none" style={styles.joint} />
      <View style={styles.branchContent}>{children}</View>
    </View>
  );
}

/** Web `RankingsDrawerMenu` 相当 */
export default function RankingsDrawerMenuNative({
  league,
  onChange,
  language,
  nbaBoard = "regular",
  onSelectNbaRegular,
  onSelectNbaPlayoffs,
  onOpenSquadBattlePreview,
}: Props) {
  const isJa = language === "ja";
  const t = rankingsTexts(language);
  const labelStyle = sideMenuLabelStyle(language);
  const nbaClusterActive = league === "nba";
  const regularActive =
    league === "nba" && (nbaBoard === "regular" || nbaBoard === "open");
  const playoffsActive = league === "nba" && nbaBoard === "playoffs";
  const showNbaBranch = Boolean(onSelectNbaRegular && onSelectNbaPlayoffs);

  return (
    <View style={styles.root}>
      <CyberSideMenuSectionTitleNative first>
        {isJa ? "ランキング" : "Rankings"}
      </CyberSideMenuSectionTitleNative>
      <View style={styles.itemGroup}>
        {showNbaBranch ? (
          <View style={styles.nbaCluster}>
            <SideMenuItemButtonNative
              icon="trophy-outline"
              active={nbaClusterActive}
              labelStyle={labelStyle}
              onPress={() => onSelectNbaRegular?.()}
            >
              NBA
            </SideMenuItemButtonNative>

            <View style={styles.branchList}>
              <View pointerEvents="none" style={styles.trunkFromParent} />

              <BranchRow>
                <SideMenuItemButtonNative
                  icon="calendar-month-outline"
                  dense
                  active={regularActive}
                  labelStyle={{
                    ...SIDE_MENU_LABEL_FONT,
                    textTransform: "uppercase",
                  }}
                  onPress={() => onSelectNbaRegular?.()}
                >
                  {t.nbaBoardRegular}
                </SideMenuItemButtonNative>
              </BranchRow>
              <BranchRow last>
                <SideMenuItemButtonNative
                  icon="trophy-outline"
                  dense
                  active={playoffsActive}
                  labelStyle={{
                    ...SIDE_MENU_LABEL_FONT,
                    textTransform: "uppercase",
                  }}
                  onPress={() => onSelectNbaPlayoffs?.()}
                >
                  {t.nbaBoardPlayoffs}
                </SideMenuItemButtonNative>
              </BranchRow>
            </View>
          </View>
        ) : (
          <SideMenuItemButtonNative
            icon="trophy-outline"
            active={nbaClusterActive}
            labelStyle={labelStyle}
            onPress={() => onChange("nba")}
          >
            NBA Playoffs
          </SideMenuItemButtonNative>
        )}

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
    width: 2,
    height: 4,
    backgroundColor: CYBER_SIDE_MENU_BRANCH,
    shadowColor: CYBER_SIDE_MENU_BRANCH_GLOW_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  branchRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 32,
  },
  vline: {
    position: "absolute",
    left: 9,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: CYBER_SIDE_MENU_BRANCH,
    shadowColor: CYBER_SIDE_MENU_BRANCH_GLOW_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
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
    height: 2,
    marginTop: -1,
    backgroundColor: CYBER_SIDE_MENU_BRANCH,
    shadowColor: CYBER_SIDE_MENU_BRANCH_GLOW_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  /** 枝先ジョイント（◆） */
  joint: {
    position: "absolute",
    left: 20,
    top: "50%",
    width: 5,
    height: 5,
    marginTop: -2.5,
    transform: [{ rotate: "45deg" }],
    backgroundColor: CYBER_SIDE_MENU_BRANCH_JOINT,
    shadowColor: CYBER_SIDE_MENU_BRANCH_GLOW_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    zIndex: 1,
  },
  /** サブ行は右端を短くして「ぶら下がり」を形で見せる */
  branchContent: {
    flex: 1,
    paddingLeft: 28,
    paddingRight: 16,
    minWidth: 0,
  },
});
