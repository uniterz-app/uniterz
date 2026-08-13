/**
 * Web `TutorialSlideVisual` 相当 — ライブコーチ用の図解。
 */
import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { TutorialVisualId } from "../../../../../lib/tutorial/tutorialCopy";
import { TUTORIAL_CYAN } from "../../../../../lib/tutorial/tutorialMotion";
import { fonts } from "../../theme/tokens";

type Props = {
  visual: TutorialVisualId;
};

const WELCOME_STEPS = [
  { n: "01", label: "予想", en: "PREDICT" },
  { n: "02", label: "的中", en: "HIT" },
  { n: "03", label: "ランク", en: "RANK" },
] as const;

/** 角括弧（HUD コーナー） */
function WelcomeCorner({
  top,
  left,
  right,
  bottom,
}: {
  top?: boolean;
  left?: boolean;
  right?: boolean;
  bottom?: boolean;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.welcomeCorner,
        top ? { top: 0 } : { bottom: 0 },
        left ? { left: 0 } : { right: 0 },
        top && left ? styles.welcomeCornerTL : null,
        top && right ? styles.welcomeCornerTR : null,
        bottom && left ? styles.welcomeCornerBL : null,
        bottom && right ? styles.welcomeCornerBR : null,
      ]}
    />
  );
}

function MockWelcome() {
  return (
    <View style={styles.welcomeStage}>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(0,245,255,0.14)", "transparent", "rgba(0,245,255,0.06)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <WelcomeCorner top left />
      <WelcomeCorner top right />
      <WelcomeCorner bottom left />
      <WelcomeCorner bottom right />

      <Text style={styles.welcomeBrief}>BRIEFING</Text>

      <View style={styles.welcomeHero}>
        <View style={styles.welcomeHalo} />
        <View style={styles.welcomeRingOuter}>
          <View style={styles.welcomeRingInner}>
            <Image
              source={require("../../../assets/icon.png")}
              style={styles.welcomeIcon}
              accessibilityIgnoresInvertColors
            />
          </View>
        </View>
        <Text style={styles.welcomeWordmark}>UNITERZ</Text>
        <Text style={styles.welcomeTag}>SCORE PREDICTION PROTOCOL</Text>
      </View>

      <View style={styles.welcomeBeamRow}>
        <LinearGradient
          colors={["transparent", TUTORIAL_CYAN, "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.welcomeBeam}
        />
      </View>

      <View style={styles.welcomeStepsTrack}>
        <View style={styles.welcomeStepsLine} pointerEvents="none" />
        {WELCOME_STEPS.map((s) => (
          <View key={s.n} style={styles.welcomeStep}>
            <View style={styles.welcomeStepDot} />
            <Text style={styles.welcomeStepN}>{s.n}</Text>
            <Text style={styles.welcomeStepLabel}>{s.label}</Text>
            <Text style={styles.welcomeStepEn}>{s.en}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function MockRankings() {
  const rows = [
    { rank: "1", name: "ace_shot", pts: "2,480", me: false },
    { rank: "2", name: "you", pts: "2,310", me: true },
    { rank: "3", name: "court_king", pts: "2,105", me: false },
  ];
  return (
    <View style={styles.card}>
      <View style={styles.rankHero}>
        <Text style={styles.rankBig}>#2</Text>
        <Text style={styles.rankHeroLabel}>YOUR RANK</Text>
      </View>
      {rows.map((r) => (
        <View key={r.rank} style={[styles.row, r.me && styles.rowMe]}>
          <Text style={[styles.rowRank, r.me && styles.rowRankMe]}>{r.rank}</Text>
          <Text style={[styles.rowName, r.me && styles.rowNameMe]}>{r.name}</Text>
          <Text style={styles.rowPts}>{r.pts}</Text>
        </View>
      ))}
    </View>
  );
}

function MockGroups() {
  return (
    <View style={styles.card}>
      <View style={styles.squadBanner}>
        <Text style={styles.squadText}>SQUAD BATTLE</Text>
      </View>
      <View style={styles.groupPad}>
        <Text style={styles.groupKicker}>GROUP</Text>
        <Text style={styles.groupName}>Night Owls</Text>
        <View style={styles.groupMeta}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>#2</Text>
          </View>
          <Text style={styles.metaText}>8 members · private board</Text>
        </View>
      </View>
    </View>
  );
}

function MockProfile() {
  const stats = [
    { label: "HIT%", value: "62" },
    { label: "STREAK", value: "3" },
    { label: "PTS", value: "2.3k" },
  ];
  return (
    <View style={styles.card}>
      <View style={styles.profileHead}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>YOU</Text>
        </View>
        <View>
          <Text style={styles.profileName}>your_name</Text>
          <Text style={styles.profileKicker}>MY PAGE</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCell}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function MockTabs({ highlight }: { highlight: string }) {
  const tabs = [
    { id: "games", label: "試合" },
    { id: "result", label: "リザルト" },
    { id: "rankings", label: "ランキング" },
    { id: "boards", label: "LB" },
    { id: "profile", label: "マイ" },
  ];
  return (
    <View style={styles.tabs}>
      {tabs.map((t) => {
        const on = t.id === highlight;
        return (
          <View key={t.id} style={[styles.tab, on && styles.tabOn]}>
            <Text style={[styles.tabText, on && styles.tabTextOn]}>{t.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function MockHorizon() {
  /** このあと説明する順番（overview の並び = 各ステップの順） */
  const items = [
    { num: "1", label: "スクワッドバトル", sub: "仲間とチーム対戦" },
    { num: "2", label: "UNIT", sub: "通貨・報酬" },
    { num: "3", label: "キャリア", sub: "成績の軌跡" },
    { num: "4", label: "STATS", sub: "試合スタッツ" },
  ];
  return (
    <View style={styles.card}>
      <Text style={styles.horizonHead}>このあと説明する機能</Text>
      {items.map((it) => (
        <View key={it.num} style={styles.horizonRow}>
          <View style={styles.horizonNumBadge}>
            <Text style={styles.horizonNum}>{it.num}</Text>
          </View>
          <View style={styles.horizonTextCol}>
            <Text style={styles.horizonLabel}>{it.label}</Text>
            <Text style={styles.horizonSub}>{it.sub}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function MockHorizonStats() {
  return (
    <View style={styles.statsEdgeWrap}>
      <View style={styles.statsEdgeMockScreen}>
        <Text style={styles.statsEdgeHint}>GAMES</Text>
        <View style={styles.statsEdgeHandle}>
          {"STATS".split("").map((ch, i) => (
            <Text key={`${ch}-${i}`} style={styles.statsEdgeLetter}>
              {ch}
            </Text>
          ))}
        </View>
      </View>
      <Text style={styles.statsEdgeCaption}>右端の黄色いタブ</Text>
    </View>
  );
}

function MockHorizonUnit() {
  return (
    <View style={styles.card}>
      <View style={styles.unitBanner}>
        <Text style={styles.unitBannerText}>UNIT EARN</Text>
      </View>
      <View style={styles.groupPad}>
        <Text style={styles.groupKicker}>MINI GAME</Text>
        <Text style={styles.groupName}>Play → Earn UNIT</Text>
        <Text style={styles.metaText}>プロフィールからいつでも挑戦できる</Text>
      </View>
    </View>
  );
}

function MockHorizonCareer() {
  return (
    <View style={styles.card}>
      <View style={styles.profileHead}>
        <View style={[styles.avatar, styles.careerAvatar]}>
          <Text style={styles.avatarText}>REC</Text>
        </View>
        <View>
          <Text style={styles.profileName}>Career</Text>
          <Text style={styles.profileKicker}>TRACK RECORD</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        {[
          { label: "HITS", value: "42" },
          { label: "STREAK", value: "5" },
          { label: "SEASON", value: "A" },
        ].map((s) => (
          <View key={s.label} style={styles.statCell}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function TutorialCoachVisualNative({ visual }: Props) {
  if (visual === "welcome") return <MockWelcome />;
  if (visual === "rankings") return <MockRankings />;
  if (visual === "groups") return <MockGroups />;
  if (visual === "profile") return <MockProfile />;
  if (visual === "horizon") return <MockHorizon />;
  if (visual === "horizon-unit") return <MockHorizonUnit />;
  if (visual === "horizon-career") return <MockHorizonCareer />;
  if (visual === "horizon-stats") return <MockHorizonStats />;
  if (visual === "tabs-rankings") return <MockTabs highlight="rankings" />;
  if (visual === "tabs-boards" || visual === "tabs") {
    return <MockTabs highlight="boards" />;
  }
  if (visual === "tabs-profile") return <MockTabs highlight="profile" />;
  return null;
}

const styles = StyleSheet.create({
  welcomeStage: {
    position: "relative",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.22)",
    backgroundColor: "rgba(3,10,18,0.55)",
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  welcomeCorner: {
    position: "absolute",
    width: 12,
    height: 12,
    borderColor: TUTORIAL_CYAN,
  },
  welcomeCornerTL: {
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  welcomeCornerTR: {
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  welcomeCornerBL: {
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  welcomeCornerBR: {
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  welcomeBrief: {
    position: "absolute",
    top: 8,
    left: 14,
    fontFamily: fonts.metricExtra,
    fontSize: 8,
    letterSpacing: 2.4,
    color: "rgba(0,245,255,0.55)",
  },
  welcomeHero: {
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  welcomeHalo: {
    position: "absolute",
    top: -6,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(0,245,255,0.12)",
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.85,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  welcomeRingOuter: {
    width: 76,
    height: 76,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,245,255,0.06)",
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  welcomeRingInner: {
    width: 66,
    height: 66,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  welcomeIcon: {
    width: 66,
    height: 66,
  },
  welcomeWordmark: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 32,
    letterSpacing: 6,
    color: "#F2FEFF",
    textShadowColor: "rgba(0,245,255,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  welcomeTag: {
    fontFamily: fonts.metric,
    fontSize: 9,
    letterSpacing: 2.2,
    color: "rgba(165,243,252,0.72)",
  },
  welcomeBeamRow: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  welcomeBeam: {
    height: 1,
    width: "92%",
  },
  welcomeStepsTrack: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingTop: 4,
    position: "relative",
  },
  welcomeStepsLine: {
    position: "absolute",
    left: "16%",
    right: "16%",
    top: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,245,255,0.35)",
  },
  welcomeStep: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  welcomeStepDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: TUTORIAL_CYAN,
    borderWidth: 2,
    borderColor: "rgba(5,12,20,0.95)",
    marginBottom: 2,
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  welcomeStepN: {
    fontFamily: fonts.metricExtra,
    fontSize: 10,
    letterSpacing: 1.5,
    color: TUTORIAL_CYAN,
  },
  welcomeStepLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F4FBFF",
  },
  welcomeStepEn: {
    fontFamily: fonts.metric,
    fontSize: 8,
    letterSpacing: 1.4,
    color: "rgba(165,243,252,0.55)",
  },
  horizonHead: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    letterSpacing: 2,
    color: TUTORIAL_CYAN,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  horizonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  horizonNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  horizonNum: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    fontWeight: "800",
    color: TUTORIAL_CYAN,
  },
  horizonTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  horizonSub: {
    fontFamily: fonts.metric,
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.3,
  },
  horizonLabel: {
    fontFamily: fonts.metric,
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  unitBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0,245,255,0.16)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,245,255,0.35)",
  },
  unitBannerText: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    letterSpacing: 2,
    color: "rgba(207,250,254,0.95)",
  },
  careerAvatar: {
    backgroundColor: "rgba(251,191,36,0.95)",
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
    backgroundColor: "rgba(6,10,16,0.95)",
    overflow: "hidden",
  },
  rankHero: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  rankBig: {
    fontFamily: fonts.metricExtra,
    fontSize: 28,
    color: TUTORIAL_CYAN,
    lineHeight: 30,
  },
  rankHeroLabel: {
    fontFamily: fonts.metric,
    fontSize: 9,
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.45)",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 2,
    borderRadius: 4,
  },
  rowMe: {
    backgroundColor: "rgba(0,245,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
  },
  rowRank: {
    fontFamily: fonts.metric,
    width: 18,
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  rowRankMe: { color: TUTORIAL_CYAN },
  rowName: {
    flex: 1,
    fontFamily: fonts.metric,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  rowNameMe: { color: "#CFFAFE", fontWeight: "700" },
  rowPts: {
    fontFamily: fonts.metric,
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },
  squadBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(212,160,60,0.28)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(212,160,60,0.35)",
  },
  squadText: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    letterSpacing: 2,
    color: "rgba(253,230,138,0.95)",
  },
  groupPad: { paddingHorizontal: 12, paddingVertical: 10 },
  groupKicker: {
    fontFamily: fonts.metric,
    fontSize: 9,
    letterSpacing: 1.6,
    color: "rgba(103,232,249,0.65)",
    marginBottom: 2,
  },
  groupName: {
    fontFamily: fonts.metric,
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  groupMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(0,245,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.45)",
  },
  badgeText: {
    fontFamily: fonts.metric,
    fontSize: 11,
    color: TUTORIAL_CYAN,
  },
  metaText: {
    fontFamily: fonts.metric,
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },
  profileHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TUTORIAL_CYAN,
  },
  avatarText: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    color: "#050508",
  },
  profileName: {
    fontFamily: fonts.metric,
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  profileKicker: {
    fontFamily: fonts.metric,
    fontSize: 9,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.4)",
  },
  statsRow: { flexDirection: "row", gap: 6 },
  statCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 6,
    alignItems: "center",
  },
  statValue: {
    fontFamily: fonts.metric,
    fontSize: 13,
    color: TUTORIAL_CYAN,
  },
  statLabel: {
    fontFamily: fonts.metric,
    fontSize: 8,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },
  tabs: {
    flexDirection: "row",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  tabOn: {
    backgroundColor: TUTORIAL_CYAN,
  },
  tabText: {
    fontFamily: fonts.metric,
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
  },
  tabTextOn: {
    color: "#050508",
  },
  statsEdgeWrap: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  statsEdgeMockScreen: {
    width: "100%",
    height: 88,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(4,8,12,0.9)",
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
    paddingLeft: 14,
  },
  statsEdgeHint: {
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.35)",
  },
  statsEdgeHandle: {
    position: "absolute",
    right: 0,
    top: "22%",
    width: 18,
    paddingVertical: 8,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: "rgba(250,204,21,0.7)",
    backgroundColor: "rgba(8,12,6,0.95)",
  },
  statsEdgeLetter: {
    fontFamily: fonts.metric,
    fontSize: 7,
    fontWeight: "800",
    lineHeight: 8,
    color: "#facc15",
  },
  statsEdgeCaption: {
    fontFamily: fonts.metric,
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.4,
  },
});
