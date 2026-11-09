/** 順位ページ LEAGUE タブ — 今季の NBA を図で見る（TEAM / PLAYER） */
import { useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
  CYBER_TAB_CYAN,
} from "../../rankings/CyberSlantedTabNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import {
  LeagueStatsCollapsedSummaryNative,
  LeagueStatsCollapsibleNative,
  useLeagueStatsCollapse,
} from "../stats/LeagueStatsCollapseNative";
import LeagueHubPlayerPanelNative, {
  LEAGUE_HUB_PLAYER_SECTIONS,
  type LeagueHubPlayerSection,
} from "./LeagueHubPlayerPanelNative";
import { SUB_TAB_THEME } from "./LeagueHubBranchTabsNative";
import LeagueHubTeamPanelNative from "./LeagueHubTeamPanelNative";
import { HubEmpty, HubSubTabs, type HubLang } from "./leagueHubUiNative";
import { useNbaLeagueHubNative } from "./useNbaLeagueHubNative";

type Props = {
  lang: HubLang;
  onSelectTeam: (teamId: string) => void;
  onSelectPlayer: (playerId: string) => void;
};

/** compact タブ列のレイアウト高さ（本体 30 + 上下 6）。部品の寸法は変えない */
const TAB_BAR_H = 42;
const TAB_BAR_PAD = 6;
const TAB_BODY_H = 30;
/** 下の段だけ一回り小さくする */
const LOWER_SCALE = 0.86;
/** 下の段が占める横幅（親タブと反対側へ寄せ、空いた側に線を通す） */
const LOWER_WIDTH_RATIO = 0.72;
/** 上段の本体下端から下段の本体上端までの余白 */
const ROW_GAP = 4;
const LOWER_THEME = SUB_TAB_THEME;
const LINE_COLOR = CYBER_TAB_CYAN;

/** 親タブがどちら側か。右なら下の段は左寄せで線は右から、左なら反転 */
type ParentSide = "left" | "right";
const PARENT_SIDE: ParentSide = "right";

function subRowGeometry(w: number, parent: ParentSide) {
  const visualW = w * LOWER_WIDTH_RATIO;
  /** transform scale は中心基準。縮めた後の見た目の幅が visualW になる素の幅 */
  const rawW = visualW / LOWER_SCALE;
  const inset = (rawW - visualW) / 2;
  const rawLeft = parent === "right" ? -inset : w - visualW - inset;
  const nearEdge = parent === "right" ? visualW : w - visualW;
  const outerEdge = parent === "right" ? w : 0;
  const lineX = (nearEdge + outerEdge) / 2;
  const lowerMidY = ROW_GAP + (TAB_BAR_PAD + TAB_BODY_H / 2) * LOWER_SCALE;
  return { rawW, rawLeft, nearEdge, lineX, lowerMidY };
}

function ElbowLine({ width, parent }: { width: number; parent: ParentSide }) {
  const g = subRowGeometry(width, parent);
  const x = Math.round(g.lineX);
  const y = Math.round(g.lowerMidY);
  const near = Math.round(g.nearEdge);
  const hLeft = Math.min(near, x);
  const hWidth = Math.abs(x - near) + 1;
  return (
    <View pointerEvents="none" style={styles.branch}>
      <View
        style={[
          styles.line,
          { left: x - 0.5, top: -TAB_BAR_PAD, width: 1, height: y + TAB_BAR_PAD + 0.5 },
        ]}
      />
      <View style={[styles.line, { left: hLeft, top: y - 0.5, width: hWidth, height: 1 }]} />
    </View>
  );
}

export default function LeagueHubPanelNative({ lang, onSelectTeam, onSelectPlayer }: Props) {
  const [tab, setTab] = useState<"team" | "player">("team");
  const [playerSection, setPlayerSection] = useState<LeagueHubPlayerSection>("style");
  const [barW, setBarW] = useState(0);
  const { hub, loading } = useNbaLeagueHubNative();
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const { onTableScroll } = useLeagueStatsCollapse();
  const scrollRef = useRef<ScrollView>(null);
  const sectionLabel = LEAGUE_HUB_PLAYER_SECTIONS.find((s) => s.id === playerSection)?.label;

  const changePlayerSection = (id: LeagueHubPlayerSection) => {
    if (id === playerSection) return;
    setPlayerSection(id);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <View style={styles.root}>
      <LeagueStatsCollapsibleNative>
      <View style={styles.tabs}>
        <View style={styles.row} onLayout={(e) => setBarW(e.nativeEvent.layout.width)}>
          {barW > 0 ? <ElbowLine width={barW} parent={PARENT_SIDE} /> : null}
          <View style={styles.lowerHost}>
            <View
              style={[
                styles.lowerScale,
                barW > 0
                  ? (() => {
                      const g = subRowGeometry(barW, PARENT_SIDE);
                      return { left: g.rawLeft, width: g.rawW };
                    })()
                  : styles.lowerHidden,
              ]}
            >
              <CyberSlantedTabBarNative fill>
                <CyberSlantedTabNative
                  label="TEAM"
                  active={tab === "team"}
                  onPress={() => setTab("team")}
                  compact
                  theme={LOWER_THEME}
                />
                <CyberSlantedTabNative
                  label="PLAYER"
                  active={tab === "player"}
                  onPress={() => setTab("player")}
                  compact
                  theme={LOWER_THEME}
                />
              </CyberSlantedTabBarNative>
            </View>
          </View>
        </View>
      </View>
      </LeagueStatsCollapsibleNative>
      <LeagueStatsCollapsedSummaryNative
        text={`LEAGUE · ${tab.toUpperCase()}${tab === "player" && sectionLabel ? ` · ${sectionLabel}` : ""}`}
      />
      {tab === "player" ? (
        <View style={styles.subTabs}>
          <HubSubTabs
            items={LEAGUE_HUB_PLAYER_SECTIONS}
            value={playerSection}
            onChange={changePlayerSection}
          />
        </View>
      ) : null}
      <ScrollView
        ref={scrollRef}
        onScroll={onTableScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomContentReserveY + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        {hub ? (
          <Text style={styles.season}>
            {hub.seasonKey} SEASON
          </Text>
        ) : null}
        {tab === "team" ? (
          <LeagueHubTeamPanelNative hub={hub} lang={lang} onSelectTeam={onSelectTeam} />
        ) : loading && !hub ? (
          <View style={styles.loading}>
            <ActivityIndicator color={CYBER_TAB_CYAN} />
          </View>
        ) : hub ? (
          <LeagueHubPlayerPanelNative
            hub={hub}
            lang={lang}
            section={playerSection}
            onSelectPlayer={onSelectPlayer}
          />
        ) : (
          <HubEmpty text={lang === "ja" ? "まだデータがありません" : "No data yet"} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "visible" },
  tabs: {
    paddingHorizontal: 12,
    paddingBottom: 6,
    overflow: "visible",
  },
  row: {
    overflow: "visible",
    paddingTop: ROW_GAP,
  },
  lowerHost: {
    height: TAB_BAR_H * LOWER_SCALE,
    overflow: "visible",
  },
  branch: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    overflow: "visible",
  },
  line: {
    position: "absolute",
    backgroundColor: LINE_COLOR,
  },
  lowerScale: {
    position: "absolute",
    top: -(TAB_BAR_H * (1 - LOWER_SCALE)) / 2,
    height: TAB_BAR_H,
    overflow: "visible",
    transform: [{ scale: LOWER_SCALE }],
  },
  lowerHidden: {
    left: 0,
    width: 0,
    opacity: 0,
  },
  subTabs: {
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  season: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.45)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.6,
    textAlign: "right",
    marginBottom: 6,
  },
  loading: {
    paddingVertical: 40,
    alignItems: "center",
  },
});
