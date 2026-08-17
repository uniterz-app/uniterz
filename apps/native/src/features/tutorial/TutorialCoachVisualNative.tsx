/**
 * Web `TutorialSlideVisual` 相当 — ライブコーチ用の図解。
 */
import { useEffect, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import type { TutorialVisualId } from "../../../../../lib/tutorial/tutorialCopy";
import {
  TUTORIAL_CYAN,
  TUTORIAL_WELCOME_PATH_CHARGE,
  TUTORIAL_WELCOME_PATH_CLEAR_AT,
  TUTORIAL_WELCOME_PATH_DELAY_MS,
  TUTORIAL_WELCOME_PATH_LOOP_MS,
  TUTORIAL_WELCOME_PATH_NODE_AT,
} from "../../../../../lib/tutorial/tutorialMotion";
import { fonts } from "../../theme/tokens";
import TutorialWelcomeLogoNative, {
  WelcomeGatherNative,
} from "./TutorialWelcomeLogoNative";
import { ResultCardDesignFaceNative } from "../results/ResultCardDesignPreviewScreenNative";
import { buildResultCardFaceModel } from "../../../../../lib/result/buildResultCardFace";
import {
  buildTutorialDemoPick,
  buildTutorialResultMarket,
  buildTutorialResultPost,
} from "../../../../../lib/tutorial/tutorialNbaUi";

type Props = {
  visual: TutorialVisualId;
};

const WELCOME_STEPS = [
  { n: "01", label: "予想", en: "PREDICT" },
  { n: "02", label: "的中", en: "HIT" },
  { n: "03", label: "ランク", en: "RANK" },
] as const;

function WelcomePathLitNative({
  progress,
  index,
  reduceMotion,
  children,
}: {
  progress: SharedValue<number>;
  index: 0 | 1 | 2;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const at = TUTORIAL_WELCOME_PATH_NODE_AT[index];
  const clear = TUTORIAL_WELCOME_PATH_CLEAR_AT;
  const lit = useAnimatedStyle(() => {
    const on = reduceMotion
      ? index === 0
        ? 1
        : 0.48
      : interpolate(
          progress.value,
          [0, Math.max(0, at - 0.02), at, clear, Math.min(1, clear + 0.04), 1],
          [0.62, 0.62, 1, 1, 0.62, 0.62]
        );
    return {
      opacity: on,
    };
  });
  return <Animated.View style={[styles.welcomeStepInner, lit]}>{children}</Animated.View>;
}

function WelcomePathNodeNative({
  progress,
  index,
  reduceMotion,
}: {
  progress: SharedValue<number>;
  index: 0 | 1 | 2;
  reduceMotion: boolean;
}) {
  const at = TUTORIAL_WELCOME_PATH_NODE_AT[index];
  const clear = TUTORIAL_WELCOME_PATH_CLEAR_AT;
  const ringStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 0, transform: [{ scale: 0.7 }] };
    const t = progress.value;
    if (t < at || t > clear) return { opacity: 0, transform: [{ scale: 0.7 }] };
    return {
      opacity: interpolate(
        t,
        [at, at + 0.02, at + 0.1],
        [0, 0.95, 0],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            t,
            [at, at + 0.1],
            [0.85, 1.55],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });
  const coreStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {
        backgroundColor: index === 0 ? TUTORIAL_CYAN : "rgba(0,245,255,0.4)",
      };
    }
    const t = progress.value;
    const hot = t >= at && t < at + 0.06;
    const on = t >= at && t < clear;
    return {
      backgroundColor: hot ? "#E8FFFF" : on ? TUTORIAL_CYAN : "rgba(0,245,255,0.4)",
    };
  });
  return (
    <View style={styles.welcomeNode}>
      <Animated.View pointerEvents="none" style={[styles.welcomeNodeRing, ringStyle]} />
      <Animated.View style={[styles.welcomeNodeCore, coreStyle]} />
    </View>
  );
}

function MockWelcome() {
  const reduceMotion = useReducedMotion() ?? false;
  const pathP = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      pathP.value = 0;
      return;
    }
    pathP.value = 0;
    pathP.value = withDelay(
      TUTORIAL_WELCOME_PATH_DELAY_MS,
      withRepeat(
        withTiming(1, {
          duration: TUTORIAL_WELCOME_PATH_LOOP_MS,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
  }, [pathP, reduceMotion]);

  const bloomStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 0, transform: [{ scaleX: 0 }] };
    return {
      opacity: interpolate(
        pathP.value,
        [0, 0.04, 0.85, 0.9, 1],
        [0.22, 0.22, 0.22, 0, 0]
      ),
      transform: [
        {
          scaleX: interpolate(
            pathP.value,
            [0, 0.08, 0.38, 0.68, 0.9, 0.9001, 1],
            [0.02, 0.06, 0.5, 1, 1, 0.02, 0.02]
          ),
        },
      ],
    };
  });

  const chargeStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 0, transform: [{ scaleX: 0 }] };
    return {
      opacity: interpolate(
        pathP.value,
        [0, 0.04, 0.85, 0.9, 1],
        [1, 1, 1, 0, 0]
      ),
      transform: [
        {
          scaleX: interpolate(
            pathP.value,
            [0, 0.08, 0.38, 0.68, 0.9, 0.9001, 1],
            [0.02, 0.06, 0.5, 1, 1, 0.02, 0.02]
          ),
        },
      ],
    };
  });

  return (
    <View style={styles.welcomeStage}>
      <View style={styles.welcomeHero}>
        <TutorialWelcomeLogoNative width={300} />
        <WelcomeGatherNative delayMs={420} fromY={14}>
          <Text style={styles.welcomeTag}>SCORE PREDICTION PROTOCOL</Text>
        </WelcomeGatherNative>
      </View>

      <View style={styles.welcomePath}>
        <WelcomeGatherNative delayMs={520} fromY={0} style={styles.welcomePathRailWrap}>
          <View style={styles.welcomePathRail} pointerEvents="none">
            <View style={styles.welcomePathRailLine} />
            {reduceMotion ? null : (
              <View style={styles.welcomePathChargeClip}>
                <Animated.View style={[styles.welcomePathBloom, bloomStyle]} />
                <Animated.View style={[styles.welcomePathCharge, chargeStyle]} />
              </View>
            )}
          </View>
        </WelcomeGatherNative>
        {WELCOME_STEPS.map((s, i) => (
          <WelcomeGatherNative
            key={s.n}
            delayMs={500 + i * 80}
            fromY={22}
            fromX={(i - 1) * 28}
            style={styles.welcomeStep}
          >
            <WelcomePathLitNative
              progress={pathP}
              index={i as 0 | 1 | 2}
              reduceMotion={reduceMotion}
            >
              <WelcomePathNodeNative
                progress={pathP}
                index={i as 0 | 1 | 2}
                reduceMotion={reduceMotion}
              />
              <Text style={styles.welcomeStepN}>{s.n}</Text>
              <Text style={styles.welcomeStepLabel}>{s.label}</Text>
              <Text style={styles.welcomeStepEn}>{s.en}</Text>
            </WelcomePathLitNative>
          </WelcomeGatherNative>
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

function MockResult() {
  return (
    <View style={styles.resultMockScale}>
      <ResultCardDesignFaceNative
        language="ja"
        face={buildResultCardFaceModel(
          buildTutorialResultPost(buildTutorialDemoPick()) as Record<
            string,
            unknown
          > & { id?: string },
          { market: buildTutorialResultMarket() }
        )}
        frameGlow
        bare
      />
    </View>
  );
}

export default function TutorialCoachVisualNative({ visual }: Props) {
  if (visual === "welcome") return <MockWelcome />;
  if (visual === "result") return <MockResult />;
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
    overflow: "visible",
    backgroundColor: "transparent",
    paddingTop: 6,
    paddingBottom: 2,
    paddingHorizontal: 2,
    gap: 24,
  },
  welcomeHero: {
    alignItems: "center",
    marginTop: 4,
    gap: 10,
    width: "100%",
  },
  welcomeTag: {
    fontFamily: fonts.metricExtra,
    fontSize: 9,
    letterSpacing: 2.6,
    color: TUTORIAL_CYAN,
    opacity: 0.75,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 10,
  },
  /** 本番 `ResultCardDesignFaceNative` をコーチ枠に収める */
  resultMockScale: {
    width: "100%",
    transform: [{ scale: 0.88 }],
  },
  welcomePath: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    paddingTop: 8,
    position: "relative",
  },
  welcomePathRailWrap: {
    position: "absolute",
    left: 38,
    right: 38,
    top: 8,
    height: 14,
    zIndex: 0,
  },
  welcomePathRail: {
    ...StyleSheet.absoluteFillObject,
    overflow: "visible",
    justifyContent: "center",
  },
  welcomePathRailLine: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(0,245,255,0.34)",
  },
  welcomePathChargeClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  welcomePathBloom: {
    position: "absolute",
    left: 0,
    top: 4,
    height: 6,
    width: "100%",
    backgroundColor: TUTORIAL_WELCOME_PATH_CHARGE,
    transformOrigin: "left center",
  },
  welcomePathCharge: {
    position: "absolute",
    left: 0,
    top: 6,
    height: 2,
    width: "100%",
    backgroundColor: TUTORIAL_WELCOME_PATH_CHARGE,
    transformOrigin: "left center",
  },
  welcomeStep: {
    width: 76,
    alignItems: "center",
    zIndex: 1,
  },
  welcomeStepInner: {
    alignItems: "center",
    gap: 4,
  },
  welcomeNode: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.88)",
    backgroundColor: "#050B12",
    marginBottom: 8,
    overflow: "visible",
  },
  welcomeNodeRing: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderWidth: 1,
    borderColor: TUTORIAL_CYAN,
  },
  welcomeNodeCore: {
    width: 5,
    height: 5,
    backgroundColor: "rgba(0,245,255,0.4)",
  },
  welcomeStepN: {
    fontFamily: fonts.metricExtra,
    fontSize: 10,
    letterSpacing: 1.8,
    color: TUTORIAL_CYAN,
  },
  welcomeStepLabel: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 15,
    color: "#F4FBFF",
  },
  welcomeStepEn: {
    fontFamily: fonts.metric,
    fontSize: 8,
    letterSpacing: 1.8,
    color: "rgba(165,243,252,0.7)",
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
