import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import CyberSideMenuSectionTitleNative from "../../ui/CyberSideMenuSectionTitleNative";
import SideMenuItemButtonNative from "../../ui/SideMenuItemButtonNative";
import {
  CYBER_TAB_CYAN,
  SIDE_MENU_LABEL_FONT,
  sideMenuLabelStyle,
} from "../../ui/cyberSideMenuNative";
import type { NbaRankingBoard } from "../../../../../lib/rankings/rankingDivision";
import { rankingsTexts } from "./rankingsTexts";

const BRANCH = "rgba(0, 245, 255, 0.42)";

type League = "nba" | "wc";

type Props = {
  league: League;
  onChange: (league: League) => void;
  language: "ja" | "en";
  nbaBoard?: NbaRankingBoard;
  onSelectNbaRegular?: () => void;
  onSelectNbaPlayoffs?: () => void;
  onSelectOpenweight?: () => void;
  /** SQUAD BATTLE プレビュー（仮入口） */
  onOpenSquadBattlePreview?: () => void;
};

/** NBA 下の枝分かれ行（├ / └）— `GamesDrawerMenuNative` と同型 */
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

/** Web `RankingsDrawerMenu` 相当 */
export default function RankingsDrawerMenuNative({
  league,
  onChange,
  language,
  nbaBoard = "regular",
  onSelectNbaRegular,
  onSelectNbaPlayoffs,
  onSelectOpenweight,
  onOpenSquadBattlePreview,
}: Props) {
  const isJa = language === "ja";
  const t = rankingsTexts(language);
  const labelStyle = sideMenuLabelStyle(language);
  const nbaClusterActive = league === "nba";
  const regularActive = league === "nba" && nbaBoard === "regular";
  const playoffsActive = league === "nba" && nbaBoard === "playoffs";
  const openActive = league === "nba" && nbaBoard === "open";
  const showNbaBranch = Boolean(
    onSelectNbaRegular && onSelectNbaPlayoffs && onSelectOpenweight
  );

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
              <BranchRow>
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
              <BranchRow last>
                <SideMenuItemButtonNative
                  icon="crown-outline"
                  dense
                  active={openActive}
                  labelStyle={{
                    ...SIDE_MENU_LABEL_FONT,
                    textTransform: "uppercase",
                  }}
                  onPress={() => onSelectOpenweight?.()}
                >
                  {t.divisionOpen}
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
