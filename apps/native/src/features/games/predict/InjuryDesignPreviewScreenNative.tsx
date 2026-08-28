import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
const OXANIUM_FONT = METRIC_FONT;

type InjuryStatus = "out" | "questionable" | "doubtful" | "day-to-day";

type InjuryMockItem = {
  id: string;
  name: string;
  status: InjuryStatus;
  statusText: string;
  bodyPartJa: string;
  bodyPartEn: string;
  conditionJa: string;
  conditionEn: string;
  returnEstimateJa: string;
  returnEstimateEn: string;
  newsJa: string;
  newsEn: string;
};

const SAMPLE_HORNETS: InjuryMockItem[] = [
  {
    id: "p1",
    name: "P.HALL",
    status: "questionable",
    statusText: "QUES",
    bodyPartJa: "左膝",
    bodyPartEn: "Left Knee",
    conditionJa: "打撲・張り",
    conditionEn: "Contusion / Soreness",
    returnEstimateJa: "10/01 復帰見込み",
    returnEstimateEn: "Exp: Oct 1",
    newsJa: "Gリーグの試合中に負傷。直近の練習参加状況を見て判断予定。",
    newsEn: "Hall sustained the injury in the G League. Will be evaluated after practice.",
  },
  {
    id: "p2",
    name: "B.MILLER",
    status: "out",
    statusText: "OUT",
    bodyPartJa: "右足首",
    bodyPartEn: "Right Ankle",
    conditionJa: "捻挫 (Grade 2)",
    conditionEn: "Sprain (Grade 2)",
    returnEstimateJa: "10/15 復帰見込み",
    returnEstimateEn: "Exp: Oct 15",
    newsJa: "右足首の捻挫により離脱中。来週再検査予定。",
    newsEn: "Out with a right ankle sprain. Re-evaluation scheduled next week.",
  },
];

const SAMPLE_NETS: InjuryMockItem[] = [
  {
    id: "p3",
    name: "N.TRAORÉ",
    status: "doubtful",
    statusText: "DOUBT",
    bodyPartJa: "ハムストリング",
    bodyPartEn: "Hamstring",
    conditionJa: "肉離れ",
    conditionEn: "Strain",
    returnEstimateJa: "10/01 復帰見込み",
    returnEstimateEn: "Exp: Oct 1",
    newsJa: "サマーリーグ以降のリハビリが継続中。プレシーズン復帰目処。",
    newsEn: "Traore won't play in Summer League. Targeting preseason return.",
  },
  {
    id: "p4",
    name: "D.SHARPE",
    status: "day-to-day",
    statusText: "DTD",
    bodyPartJa: "腰",
    bodyPartEn: "Lower Back",
    conditionJa: "張り・疲労",
    conditionEn: "Soreness",
    returnEstimateJa: "Day-To-Day",
    returnEstimateEn: "Day-To-Day",
    newsJa: "背中の張りで前日練習を制限。当日判断。",
    newsEn: "Limited in practice due to back soreness. Game-time decision.",
  },
];

const STATUS_THEME: Record<
  InjuryStatus,
  { accent: string; bg: string; border: string; badgeBg: string }
> = {
  out: {
    accent: "#FF2D78",
    bg: "rgba(255, 45, 120, 0.08)",
    border: "rgba(255, 45, 120, 0.4)",
    badgeBg: "rgba(255, 45, 120, 0.2)",
  },
  doubtful: {
    accent: "#FF8A3D",
    bg: "rgba(255, 138, 61, 0.08)",
    border: "rgba(255, 138, 61, 0.4)",
    badgeBg: "rgba(255, 138, 61, 0.2)",
  },
  questionable: {
    accent: "#F5C518",
    bg: "rgba(245, 197, 24, 0.08)",
    border: "rgba(245, 197, 24, 0.4)",
    badgeBg: "rgba(245, 197, 24, 0.2)",
  },
  "day-to-day": {
    accent: "#00E5FF",
    bg: "rgba(0, 229, 255, 0.08)",
    border: "rgba(0, 229, 255, 0.4)",
    badgeBg: "rgba(0, 229, 255, 0.2)",
  },
};

export default function InjuryDesignPreviewScreenNative() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<"tab" | "chip2col" | "rowList">("chip2col");
  const [selectedTeamTab, setSelectedTeamTab] = useState<"home" | "away">("home");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#00F5FF" />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>INJURY UI LAB</Text>
          <Text style={styles.headerSubtitle}>シンプル＆コンパクト 3案比較</Text>
        </View>
      </View>

      {/* PATTERN SELECTOR TABS */}
      <View style={styles.patternTabBar}>
        <Pressable
          style={[styles.patternTab, activeTab === "chip2col" && styles.patternTabActive]}
          onPress={() => setActiveTab("chip2col")}
        >
          <Text
            style={[
              styles.patternTabText,
              activeTab === "chip2col" && styles.patternTabTextActive,
            ]}
          >
            案1: 2列ミニカード
          </Text>
        </Pressable>

        <Pressable
          style={[styles.patternTab, activeTab === "rowList" && styles.patternTabActive]}
          onPress={() => setActiveTab("rowList")}
        >
          <Text
            style={[
              styles.patternTabText,
              activeTab === "rowList" && styles.patternTabTextActive,
            ]}
          >
            案2: スリム横1行
          </Text>
        </Pressable>

        <Pressable
          style={[styles.patternTab, activeTab === "tab" && styles.patternTabActive]}
          onPress={() => setActiveTab("tab")}
        >
          <Text
            style={[
              styles.patternTabText,
              activeTab === "tab" && styles.patternTabTextActive,
            ]}
          >
            案3: チーム切替
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* ========================================================= */}
        {/* 案1: 2列ミニカード (左右2カラムのまま極限までスリム化) */}
        {/* ========================================================= */}
        {activeTab === "chip2col" && (
          <View style={styles.sectionWrap}>
            <View style={styles.descBox}>
              <Text style={styles.descTitle}>💡 案1: 2列ミニカード（現行の進化系）</Text>
              <Text style={styles.descBody}>
                巨大アイコンを廃止し、右上にミニバッジ化。長文は省き「部位・症状」と「復帰予定」のみを2〜3行で超コンパクトに表示。タップで詳細ニュースを展開。
              </Text>
            </View>

            <View style={styles.matchupTwoCol}>
              {/* HOME COL */}
              <View style={styles.colHalf}>
                <View style={styles.teamHeaderRow}>
                  <Text style={styles.teamHeaderName}>HORNETS</Text>
                  <Text style={styles.teamHeaderCount}>2名</Text>
                </View>
                <View style={styles.cardList}>
                  {SAMPLE_HORNETS.map((p) => {
                    const theme = STATUS_THEME[p.status];
                    const isExp = expandedId === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => toggleExpand(p.id)}
                        style={[
                          styles.mini2ColCard,
                          { borderColor: theme.border, backgroundColor: theme.bg },
                        ]}
                      >
                        <View style={styles.miniCardTopRow}>
                          <Text style={styles.miniCardName} numberOfLines={1}>
                            {p.name}
                          </Text>
                          <View
                            style={[
                              styles.miniStatusBadge,
                              { backgroundColor: theme.badgeBg, borderColor: theme.accent },
                            ]}
                          >
                            <Text style={[styles.miniStatusBadgeText, { color: theme.accent }]}>
                              {p.statusText}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.miniCardDetail} numberOfLines={1}>
                          {p.bodyPartJa} · {p.conditionJa}
                        </Text>
                        <Text style={[styles.miniCardExp, { color: theme.accent }]}>
                          ↳ {p.returnEstimateJa}
                        </Text>
                        {isExp && (
                          <View style={styles.expandedNewsBox}>
                            <Text style={styles.expandedNewsText}>{p.newsJa}</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* AWAY COL */}
              <View style={styles.colHalf}>
                <View style={styles.teamHeaderRow}>
                  <Text style={styles.teamHeaderName}>NETS</Text>
                  <Text style={styles.teamHeaderCount}>2名</Text>
                </View>
                <View style={styles.cardList}>
                  {SAMPLE_NETS.map((p) => {
                    const theme = STATUS_THEME[p.status];
                    const isExp = expandedId === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => toggleExpand(p.id)}
                        style={[
                          styles.mini2ColCard,
                          { borderColor: theme.border, backgroundColor: theme.bg },
                        ]}
                      >
                        <View style={styles.miniCardTopRow}>
                          <Text style={styles.miniCardName} numberOfLines={1}>
                            {p.name}
                          </Text>
                          <View
                            style={[
                              styles.miniStatusBadge,
                              { backgroundColor: theme.badgeBg, borderColor: theme.accent },
                            ]}
                          >
                            <Text style={[styles.miniStatusBadgeText, { color: theme.accent }]}>
                              {p.statusText}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.miniCardDetail} numberOfLines={1}>
                          {p.bodyPartJa} · {p.conditionJa}
                        </Text>
                        <Text style={[styles.miniCardExp, { color: theme.accent }]}>
                          ↳ {p.returnEstimateJa}
                        </Text>
                        {isExp && (
                          <View style={styles.expandedNewsBox}>
                            <Text style={styles.expandedNewsText}>{p.newsJa}</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* 案2: スリム横1行リスト (左右に割らず1行で通す) */}
        {/* ========================================================= */}
        {activeTab === "rowList" && (
          <View style={styles.sectionWrap}>
            <View style={styles.descBox}>
              <Text style={styles.descTitle}>💡 案2: スリム横1行リスト</Text>
              <Text style={styles.descBody}>
                上下にチームを並べ、1人につき1行の超スリムバーで表現。視線の動きが少なく、選手名・部位・復帰日が横一列で自然に読めます。
              </Text>
            </View>

            {/* HORNETS */}
            <View style={styles.rowSectionBlock}>
              <View style={styles.rowSectionHeader}>
                <Text style={styles.rowSectionTitle}>HORNETS</Text>
                <Text style={styles.rowSectionSubtitle}>CHARLOTTE (2)</Text>
              </View>
              <View style={styles.rowListContainer}>
                {SAMPLE_HORNETS.map((p) => {
                  const theme = STATUS_THEME[p.status];
                  const isExp = expandedId === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => toggleExpand(p.id)}
                      style={[
                        styles.slimRowBar,
                        { borderLeftColor: theme.accent, backgroundColor: theme.bg },
                      ]}
                    >
                      <View style={styles.slimRowMain}>
                        <View
                          style={[
                            styles.slimStatusTag,
                            { backgroundColor: theme.badgeBg, borderColor: theme.accent },
                          ]}
                        >
                          <Text style={[styles.slimStatusTagText, { color: theme.accent }]}>
                            {p.statusText}
                          </Text>
                        </View>
                        <Text style={styles.slimRowName}>{p.name}</Text>
                        <Text style={styles.slimRowPart} numberOfLines={1}>
                          {p.bodyPartJa}
                        </Text>
                        <Text style={[styles.slimRowExp, { color: theme.accent }]}>
                          {p.returnEstimateJa}
                        </Text>
                        <MaterialCommunityIcons
                          name={isExp ? "chevron-up" : "chevron-down"}
                          size={16}
                          color="rgba(255,255,255,0.4)"
                        />
                      </View>
                      {isExp && (
                        <View style={styles.slimRowExpanded}>
                          <Text style={styles.slimRowDetailLabel}>
                            詳細: {p.conditionJa} — {p.newsJa}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* NETS */}
            <View style={[styles.rowSectionBlock, { marginTop: 16 }]}>
              <View style={styles.rowSectionHeader}>
                <Text style={styles.rowSectionTitle}>NETS</Text>
                <Text style={styles.rowSectionSubtitle}>BROOKLYN (2)</Text>
              </View>
              <View style={styles.rowListContainer}>
                {SAMPLE_NETS.map((p) => {
                  const theme = STATUS_THEME[p.status];
                  const isExp = expandedId === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => toggleExpand(p.id)}
                      style={[
                        styles.slimRowBar,
                        { borderLeftColor: theme.accent, backgroundColor: theme.bg },
                      ]}
                    >
                      <View style={styles.slimRowMain}>
                        <View
                          style={[
                            styles.slimStatusTag,
                            { backgroundColor: theme.badgeBg, borderColor: theme.accent },
                          ]}
                        >
                          <Text style={[styles.slimStatusTagText, { color: theme.accent }]}>
                            {p.statusText}
                          </Text>
                        </View>
                        <Text style={styles.slimRowName}>{p.name}</Text>
                        <Text style={styles.slimRowPart} numberOfLines={1}>
                          {p.bodyPartJa}
                        </Text>
                        <Text style={[styles.slimRowExp, { color: theme.accent }]}>
                          {p.returnEstimateJa}
                        </Text>
                        <MaterialCommunityIcons
                          name={isExp ? "chevron-up" : "chevron-down"}
                          size={16}
                          color="rgba(255,255,255,0.4)"
                        />
                      </View>
                      {isExp && (
                        <View style={styles.slimRowExpanded}>
                          <Text style={styles.slimRowDetailLabel}>
                            詳細: {p.conditionJa} — {p.newsJa}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* 案3: チーム切替タブ (横幅フル活用) */}
        {/* ========================================================= */}
        {activeTab === "tab" && (
          <View style={styles.sectionWrap}>
            <View style={styles.descBox}>
              <Text style={styles.descTitle}>💡 案3: チーム切替タブ</Text>
              <Text style={styles.descBody}>
                上部のチームタブで対象を切り替え、全幅を使って贅沢かつゆとりを持って表示。
              </Text>
            </View>

            {/* TEAM SWITCHER */}
            <View style={styles.teamSwitcherRow}>
              <Pressable
                style={[
                  styles.teamSwitchBtn,
                  selectedTeamTab === "home" && styles.teamSwitchBtnActive,
                ]}
                onPress={() => setSelectedTeamTab("home")}
              >
                <Text
                  style={[
                    styles.teamSwitchText,
                    selectedTeamTab === "home" && styles.teamSwitchTextActive,
                  ]}
                >
                  HORNETS (2)
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.teamSwitchBtn,
                  selectedTeamTab === "away" && styles.teamSwitchBtnActive,
                ]}
                onPress={() => setSelectedTeamTab("away")}
              >
                <Text
                  style={[
                    styles.teamSwitchText,
                    selectedTeamTab === "away" && styles.teamSwitchTextActive,
                  ]}
                >
                  NETS (2)
                </Text>
              </Pressable>
            </View>

            <View style={styles.tabListContainer}>
              {(selectedTeamTab === "home" ? SAMPLE_HORNETS : SAMPLE_NETS).map((p) => {
                const theme = STATUS_THEME[p.status];
                return (
                  <View
                    key={p.id}
                    style={[
                      styles.tabFullCard,
                      { borderColor: theme.border, backgroundColor: theme.bg },
                    ]}
                  >
                    <View style={styles.tabFullCardHeader}>
                      <View style={styles.tabFullNameRow}>
                        <Text style={styles.tabFullName}>{p.name}</Text>
                        <Text style={styles.tabFullPart}>
                          {p.bodyPartJa} ({p.conditionJa})
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.tabFullBadge,
                          { backgroundColor: theme.badgeBg, borderColor: theme.accent },
                        ]}
                      >
                        <Text style={[styles.tabFullBadgeText, { color: theme.accent }]}>
                          {p.statusText}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.tabFullNews}>{p.newsJa}</Text>

                    <View style={styles.tabFullFooter}>
                      <Text style={[styles.tabFullExp, { color: theme.accent }]}>
                        復帰予定: {p.returnEstimateJa}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#05080C",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 245, 255, 0.15)",
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: OXANIUM_FONT,
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  patternTabBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  patternTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  patternTabActive: {
    borderColor: "#00F5FF",
    backgroundColor: "rgba(0, 245, 255, 0.12)",
  },
  patternTabText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
  },
  patternTabTextActive: {
    color: "#00F5FF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  sectionWrap: {
    gap: 12,
  },
  descBox: {
    padding: 10,
    backgroundColor: "rgba(0, 245, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.2)",
    gap: 4,
  },
  descTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#00F5FF",
  },
  descBody: {
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.75)",
  },

  /* 案1: 2列ミニカード */
  matchupTwoCol: {
    flexDirection: "row",
    gap: 8,
  },
  colHalf: {
    flex: 1,
    gap: 6,
  },
  teamHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  teamHeaderName: {
    fontFamily: OXANIUM_FONT,
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },
  teamHeaderCount: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
  },
  cardList: {
    gap: 6,
  },
  mini2ColCard: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 2,
    gap: 3,
  },
  miniCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  miniCardName: {
    fontFamily: OXANIUM_FONT,
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
    flex: 1,
  },
  miniStatusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderRadius: 2,
  },
  miniStatusBadgeText: {
    fontFamily: OXANIUM_FONT,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  miniCardDetail: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
  },
  miniCardExp: {
    fontFamily: OXANIUM_FONT,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },
  expandedNewsBox: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  expandedNewsText: {
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.85)",
  },

  /* 案2: スリム横1行リスト */
  rowSectionBlock: {
    gap: 6,
  },
  rowSectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    paddingHorizontal: 2,
  },
  rowSectionTitle: {
    fontFamily: OXANIUM_FONT,
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },
  rowSectionSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
  },
  rowListContainer: {
    gap: 4,
  },
  slimRowBar: {
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 2,
    gap: 4,
  },
  slimRowMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slimStatusTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderRadius: 2,
    minWidth: 36,
    alignItems: "center",
  },
  slimStatusTagText: {
    fontFamily: OXANIUM_FONT,
    fontSize: 9,
    fontWeight: "900",
  },
  slimRowName: {
    fontFamily: OXANIUM_FONT,
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
    minWidth: 70,
  },
  slimRowPart: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    flex: 1,
  },
  slimRowExp: {
    fontFamily: OXANIUM_FONT,
    fontSize: 10,
    fontWeight: "700",
  },
  slimRowExpanded: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  slimRowDetailLabel: {
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.85)",
  },

  /* 案3: チーム切替 */
  teamSwitcherRow: {
    flexDirection: "row",
    gap: 8,
  },
  teamSwitchBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  teamSwitchBtnActive: {
    borderColor: "#00F5FF",
    backgroundColor: "rgba(0, 245, 255, 0.15)",
  },
  teamSwitchText: {
    fontFamily: OXANIUM_FONT,
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.5)",
  },
  teamSwitchTextActive: {
    color: "#00F5FF",
  },
  tabListContainer: {
    gap: 8,
  },
  tabFullCard: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 2,
    gap: 6,
  },
  tabFullCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabFullNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabFullName: {
    fontFamily: OXANIUM_FONT,
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
  },
  tabFullPart: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "600",
  },
  tabFullBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderRadius: 2,
  },
  tabFullBadgeText: {
    fontFamily: OXANIUM_FONT,
    fontSize: 9,
    fontWeight: "900",
  },
  tabFullNews: {
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.8)",
  },
  tabFullFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  tabFullExp: {
    fontFamily: OXANIUM_FONT,
    fontSize: 10,
    fontWeight: "800",
  },
});
