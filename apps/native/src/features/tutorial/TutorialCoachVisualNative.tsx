/**
 * Web `TutorialSlideVisual` 相当 — ライブコーチ用の図解。
 */
import { Image, StyleSheet, Text, View } from "react-native";
import type { TutorialVisualId } from "../../../../../lib/tutorial/tutorialCopy";
import { TUTORIAL_CYAN } from "../../../../../lib/tutorial/tutorialMotion";
import { fonts } from "../../theme/tokens";

type Props = {
  visual: TutorialVisualId;
};

function MockWelcome() {
  return (
    <View style={styles.welcomeWrap}>
      <View style={styles.welcomeIconGlow}>
        <Image
          source={require("../../../assets/icon.png")}
          style={styles.welcomeIcon}
          accessibilityIgnoresInvertColors
        />
      </View>
      <Text style={styles.welcomeWordmark}>UNITERZ</Text>
      <View style={styles.welcomeLine} />
      <View style={styles.welcomeFlow}>
        {(["予想", "的中", "ランク"] as const).map((label, i) => (
          <View key={label} style={styles.welcomeFlowItem}>
            {i > 0 ? <Text style={styles.welcomeArrow}>→</Text> : null}
            <View style={styles.welcomeChip}>
              <Text style={styles.welcomeChipText}>{label}</Text>
            </View>
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

export default function TutorialCoachVisualNative({ visual }: Props) {
  if (visual === "welcome") return <MockWelcome />;
  if (visual === "rankings") return <MockRankings />;
  if (visual === "groups") return <MockGroups />;
  if (visual === "profile") return <MockProfile />;
  if (visual === "tabs-rankings") return <MockTabs highlight="rankings" />;
  if (visual === "tabs-boards" || visual === "tabs") {
    return <MockTabs highlight="boards" />;
  }
  if (visual === "tabs-profile") return <MockTabs highlight="profile" />;
  return null;
}

const styles = StyleSheet.create({
  welcomeWrap: {
    alignItems: "center",
    paddingVertical: 4,
    gap: 8,
  },
  welcomeIconGlow: {
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  welcomeWordmark: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 28,
    letterSpacing: 5,
    color: "#E8FBFF",
  },
  welcomeLine: {
    height: StyleSheet.hairlineWidth,
    width: 180,
    backgroundColor: "rgba(34,211,238,0.85)",
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  welcomeFlow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  welcomeFlowItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  welcomeArrow: {
    marginHorizontal: 4,
    fontSize: 10,
    color: "rgba(34,211,238,0.5)",
  },
  welcomeChip: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    backgroundColor: "rgba(0,245,255,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  welcomeChipText: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(207,250,254,0.9)",
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
});
