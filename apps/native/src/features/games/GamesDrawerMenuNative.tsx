import { StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import CyberSideMenuSectionTitleNative from "../../ui/CyberSideMenuSectionTitleNative";
import SideMenuItemButtonNative from "../../ui/SideMenuItemButtonNative";
import {
  CYBER_SIDE_MENU_BRANCH,
  CYBER_SIDE_MENU_BRANCH_GLOW_COLOR,
  CYBER_SIDE_MENU_BRANCH_JOINT,
  SIDE_MENU_LABEL_FONT,
  sideMenuLabelStyle,
} from "../../ui/cyberSideMenuNative";
import { formatCyberSideMenuDate } from "../../../../../lib/ui/cyberSideMenuDate";

const ICONS = {
  nba: require("../../../assets/games-drawer/nba.png") as number,
  awards: require("../../../assets/games-drawer/awards.png") as number,
  standings: require("../../../assets/games-drawer/standings.png") as number,
  wc: require("../../../assets/games-drawer/wc.png") as number,
} as const;

type Props = {
  league: "nba" | "wc";
  onSelectNba: () => void;
  onSelectWorldCup: () => void;
  onSelectAwardsPredict: () => void;
  onSelectStandingsPredict: () => void;
  language: "ja" | "en";
};

/** NBA 下の枝分かれ行（├ / └）— 2px 線 + 枝先ジョイントで階層を明示 */
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

/** Web `GamesDrawerMenu` と同等（NBA + 枝分かれサブ / World Cup） */
export default function GamesDrawerMenuNative({
  league,
  onSelectNba,
  onSelectWorldCup,
  onSelectAwardsPredict,
  onSelectStandingsPredict,
  language,
}: Props) {
  const isJa = language === "ja";
  const labelStyle = sideMenuLabelStyle(language);
  const hudDate = formatCyberSideMenuDate();

  return (
    <View style={styles.root}>
      {/* ミニヘッダー — 左ブランド / 右日付 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle} allowFontScaling={false}>
            UNITERZ
          </Text>
          <Text style={styles.headerSub} allowFontScaling={false}>
            GAMES // DRAWER
          </Text>
        </View>
        <View style={styles.headerDate}>
          <Text style={styles.headerDateNum} allowFontScaling={false}>
            {hudDate.date}
          </Text>
          <Text style={styles.headerDateWeekday} allowFontScaling={false}>
            {hudDate.weekday}
          </Text>
        </View>
      </View>

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

        <SideMenuItemButtonNative
          iconSource={ICONS.wc}
          active={league === "wc"}
          labelStyle={{ ...SIDE_MENU_LABEL_FONT, textTransform: "uppercase" }}
          onPress={onSelectWorldCup}
        >
          World Cup
        </SideMenuItemButtonNative>
      </View>

      {/* HUD フッター — 空洞だった下部を分節 */}
      <View style={styles.footer}>
        <LinearGradient
          colors={[
            "rgba(0, 245, 255, 0.5)",
            "rgba(0, 245, 255, 0.08)",
            "transparent",
          ]}
          locations={[0, 0.7, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.footerRule}
        />
        <View style={styles.footerRow}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText} allowFontScaling={false}>
            SYS ONLINE
          </Text>
          <Text style={styles.footerVer} allowFontScaling={false}>
            V1.0 // UNITERZ
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
  headerLeft: {
    minWidth: 0,
    flexShrink: 1,
  },
  headerTitle: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    letterSpacing: 0.34 * 10,
    color: "rgba(0, 245, 255, 0.85)",
    textShadowColor: "rgba(0, 245, 255, 0.35)",
    textShadowRadius: 12,
    textTransform: "uppercase",
  },
  headerSub: {
    marginTop: 2,
    fontFamily: "Oxanium_700Bold",
    fontSize: 8,
    letterSpacing: 0.22 * 8,
    color: "rgba(255, 255, 255, 0.38)",
    textTransform: "uppercase",
  },
  headerDate: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  headerDateNum: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 11,
    letterSpacing: 0.12 * 11,
    color: "rgba(0, 245, 255, 0.9)",
    textShadowColor: "rgba(0, 245, 255, 0.35)",
    textShadowRadius: 10,
    fontVariant: ["tabular-nums"],
  },
  headerDateWeekday: {
    marginTop: 2,
    fontFamily: "Oxanium_700Bold",
    fontSize: 8,
    letterSpacing: 0.28 * 8,
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
  footer: {
    marginTop: "auto",
    paddingTop: 12,
  },
  footerRule: {
    height: 1,
  },
  footerRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerDot: {
    width: 5,
    height: 5,
    transform: [{ rotate: "45deg" }],
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.6)",
    shadowColor: "#00F5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  footerText: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 8,
    letterSpacing: 0.18 * 8,
    color: "rgba(0, 245, 255, 0.55)",
    textTransform: "uppercase",
  },
  footerVer: {
    marginLeft: "auto",
    fontFamily: "Oxanium_700Bold",
    fontSize: 8,
    letterSpacing: 0.18 * 8,
    color: "rgba(255, 255, 255, 0.32)",
    textTransform: "uppercase",
  },
});
