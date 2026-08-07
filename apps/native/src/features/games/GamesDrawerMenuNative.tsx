import { StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import CyberSideMenuSectionTitleNative from "../../ui/CyberSideMenuSectionTitleNative";
import SideMenuItemButtonNative from "../../ui/SideMenuItemButtonNative";
import {
  CYBER_SIDE_MENU_BRANCH,
  CYBER_SIDE_MENU_BRANCH_GLOW_COLOR,
  CYBER_SIDE_MENU_BRANCH_JOINT,
  sideMenuLabelStyle,
} from "../../ui/cyberSideMenuNative";
import { formatCyberSideMenuDate } from "../../../../../lib/ui/cyberSideMenuDate";

const ICONS = {
  nba: require("../../../assets/games-drawer/nba.png") as number,
  awards: require("../../../assets/games-drawer/awards.png") as number,
  standings: require("../../../assets/games-drawer/standings.png") as number,
} as const;

type Props = {
  league: "nba";
  /** full = NBA + 予想枝 + STATS / stats = STATS のみ */
  mode?: "full" | "stats";
  onSelectNba?: () => void;
  onSelectAwardsPredict?: () => void;
  onSelectStandingsPredict?: () => void;
  onSelectTeamStats?: () => void;
  onSelectPlayerStats?: () => void;
  language: "ja" | "en";
};

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

/** Web `GamesDrawerMenu` と同等 */
export default function GamesDrawerMenuNative({
  league,
  mode = "full",
  onSelectNba,
  onSelectAwardsPredict,
  onSelectStandingsPredict,
  onSelectTeamStats,
  onSelectPlayerStats,
  language,
}: Props) {
  const isJa = language === "ja";
  const labelStyle = sideMenuLabelStyle(language);
  const hudDate = formatCyberSideMenuDate();
  const statsOnly = mode === "stats";

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>
          {statsOnly ? "STATS" : "UNITERZ"}
        </Text>
        <View style={styles.headerDate}>
          <Text style={styles.headerDateWeekday} allowFontScaling={false}>
            {hudDate.weekday}
          </Text>
          <Text style={styles.headerDateNum} allowFontScaling={false}>
            {hudDate.date}
          </Text>
        </View>
      </View>

      {!statsOnly &&
      onSelectNba &&
      onSelectAwardsPredict &&
      onSelectStandingsPredict ? (
        <>
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
        </>
      ) : null}

      {onSelectTeamStats || onSelectPlayerStats ? (
        <>
          <CyberSideMenuSectionTitleNative first={statsOnly}>
            STATS
          </CyberSideMenuSectionTitleNative>
          <View style={styles.itemGroup}>
            {onSelectTeamStats ? (
              <SideMenuItemButtonNative
                icon="chart-box-outline"
                labelStyle={labelStyle}
                onPress={onSelectTeamStats}
              >
                Team Stats
              </SideMenuItemButtonNative>
            ) : null}
            {onSelectPlayerStats ? (
              <SideMenuItemButtonNative
                icon="account-multiple-outline"
                labelStyle={labelStyle}
                onPress={onSelectPlayerStats}
              >
                Player Stats
              </SideMenuItemButtonNative>
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  header: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 245, 255, 0.16)",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  headerTitle: {
    flexShrink: 1,
    fontFamily: "Oxanium_700Bold",
    fontSize: 15,
    letterSpacing: 0.28 * 15,
    color: "rgba(0, 245, 255, 0.9)",
    textShadowColor: "rgba(0, 245, 255, 0.35)",
    textShadowRadius: 12,
    textTransform: "uppercase",
  },
  headerDate: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  headerDateNum: {
    marginTop: 2,
    fontFamily: "Oxanium_700Bold",
    fontSize: 15,
    letterSpacing: 0.1 * 15,
    color: "rgba(0, 245, 255, 0.9)",
    textShadowColor: "rgba(0, 245, 255, 0.35)",
    textShadowRadius: 10,
    fontVariant: ["tabular-nums"],
  },
  headerDateWeekday: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    letterSpacing: 0.24 * 10,
    color: "rgba(255, 255, 255, 0.4)",
    textTransform: "uppercase",
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
  branchContent: {
    flex: 1,
    paddingLeft: 28,
    paddingRight: 16,
    minWidth: 0,
  },
});
