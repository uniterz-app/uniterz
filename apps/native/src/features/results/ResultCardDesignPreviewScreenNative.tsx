/**
 * __DEV__ リザルトカード — 案1（3層スキャン）専用プレビュー。
 * バッジは IMPACT（イタリック + 斜めアンダー）。UPSET 枠は濃い赤 / PERFECT は深い青。
 * 右辺 DETAIL タブ → 詳細プレビュー。Upset/Score は D + 相対ラベル。YOU なし。
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import JerseyMarkAdaptive from "../games/JerseyMarkAdaptive";
import DeferredJerseyMarkNative from "../games/DeferredJerseyMarkNative";
import MatchListLineFrameNative from "../games/MatchListLineFrameNative";
import { resultOutcomeLineFramePaint, resultPendingLineFramePaint } from "@/lib/games/matchListLineFrame";
import { resultCardFaceCopy } from "../../../../../lib/result/resultCardFaceCopy";
import { normalizeLeague } from "../../../../../lib/leagues";
import { resolveMatchupUiAccents } from "../../../../../lib/team-colors";
import { resolveTeamJerseyPalette } from "../games/teamColors";
import {
  registerTutorialTarget,
} from "../tutorial/tutorialMeasureNative";
import {
  MOBILE_RESULT_CARD_MAX_W,
  NUMERIC_FONT,
} from "./resultMobileUiNative";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
  MATCH_CARD_SCORE_FONT,
} from "../games/matchCardTypography";
import { RESULT_CYBER_FRAME_STROKE_WIDTH } from "./resultCyberFrameNativeMetrics";
import ResultImpactStreakTagNative from "./ResultImpactStreakTagNative";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import {
  ImpactTag,
  OUTCOME_LABEL,
  OUTCOME_TONE,
} from "./resultBadgeDesignPreviewPatterns";
import type { ResultFaceMatchEntranceStyles } from "./useResultFaceMatchEntrance";
import { resultFaceGroupDelayMs } from "./useResultFaceMatchEntrance";

type OutcomeBadge = "hit" | "perfect" | "upset" | "miss";

type Sample = {
  roundLabel: string;
  homeName: string;
  awayName: string;
  homeJersey: { primary: string; secondary: string };
  awayJersey: { primary: string; secondary: string };
  homeAccent: string;
  awayAccent: string;
  predHome: number;
  predAway: number;
  resultHome: number;
  resultAway: number;
  marketHomePct: number;
  marketAwayPct: number;
  userPick: "home" | "away";
  upsetPoints: number | null;
  totalPoints: number;
  topScorer: string | null;
  topScorerHit: boolean;
  /** 3以上で左上に W{n} タグ */
  winStreak: number;
  /** false = 判定前。プレビューは省略時 true */
  settled?: boolean;
  live?: boolean;
};

const SAMPLE: Sample = {
  roundLabel: "PLAYOFF GAME 7",
  homeName: "THUNDER",
  awayName: "SPURS",
  homeJersey: { primary: "#EF4444", secondary: "#FDBA74" },
  awayJersey: { primary: "#C8CDD4", secondary: "#8B919A" },
  homeAccent: "#EF4444",
  awayAccent: "#E8ECF0",
  predHome: 106,
  predAway: 113,
  resultHome: 103,
  resultAway: 111,
  marketHomePct: 41.6,
  marketAwayPct: 58.4,
  userPick: "away",
  upsetPoints: null,
  totalPoints: 8.7,
  topScorer: "S.Gilgeous-Alexander",
  topScorerHit: true,
  winStreak: 5,
};

const AMBER = "#FBBF24";
const UPSET_RED = "#DC2626";

/** 試合内相対 — 表示は #1 / TOP 5% / TOP 10% のみ。それ以外は出さない。 */
type ScoreRelKind = "max" | "top5" | "top10" | "none";

const SCORE_REL_OPTS: Array<{
  id: ScoreRelKind;
  label: string;
}> = [
  { id: "max", label: "#1" },
  { id: "top5", label: "TOP 5%" },
  { id: "top10", label: "TOP 10%" },
  { id: "none", label: "—" },
];

function scoreRelText(kind: ScoreRelKind): string | null {
  switch (kind) {
    case "max":
      return "#1";
    case "top5":
      return "TOP 5%";
    case "top10":
      return "TOP 10%";
    case "none":
      return null;
  }
}

const RESULT_LINE_FRAME_PAINT = {
  hit: resultOutcomeLineFramePaint("hit")!,
  perfect: resultOutcomeLineFramePaint("perfect")!,
  upset: resultOutcomeLineFramePaint("upset")!,
  miss: resultOutcomeLineFramePaint("miss")!,
} as const;

const RESULT_PENDING_LINE_FRAME_PAINT = resultPendingLineFramePaint();
const LIVE_TONE = "#00F5FF";

const STREAK_OPTS = [0, 3, 5, 7, 10] as const;

const BADGE_OPTS: OutcomeBadge[] = ["hit", "perfect", "upset", "miss"];

type ScorerIconId = "check" | "checkBold" | "shield";

const SCORER_ICONS: Array<{
  id: ScorerIconId;
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
}> = [
  { id: "check", name: "check", label: "check" },
  { id: "checkBold", name: "check-bold", label: "bold" },
  { id: "shield", name: "shield-check", label: "shield" },
];

/** HIT 系はアンバー寄り（シアンは使わない） */
const SCORER_HIT_COLOR = "#FBBF24";
const SCORER_MISS_COLOR = "rgba(148,163,184,0.55)";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  onOpenDetail?: () => void;
};

function hexWithAlpha(hex: string, alphaHex: string): string {
  const n = hex.startsWith("#") ? hex : `#${hex}`;
  if (n.length === 9) return n;
  return `${n}${alphaHex}`;
}

/** @deprecated DETAIL 背表紙タブは廃止。互換のため残す */
export const RESULT_CARD_DETAIL_SPINE = {
  width: 0,
  height: 0,
  top: 0,
} as const;

/** プレビュー用・直角長方形シェル（角切りなし）+ 任意で詳細ヒント › */
function RectShell({
  badge,
  paint: paintProp,
  topLabel,
  onOpenDetail,
  showDetailTab = false,
  strokeEnd,
  animateDraw = false,
  drawDelayMs = 0,
  motion,
  detailSpineStyle,
  children,
}: {
  badge: OutcomeBadge;
  paint?: { color: string; glow: string };
  topLabel?: string;
  onOpenDetail?: () => void;
  /** true: カード右下に ›（詳細へ） */
  showDetailTab?: boolean;
  /** 線枠グローは MatchListLineFrame。elevation は Skia を覆うので使わない */
  frameGlow?: boolean;
  strokeEnd?: SharedValue<number>;
  animateDraw?: boolean;
  drawDelayMs?: number;
  motion?: ResultFaceMatchEntranceStyles;
  /** 親 Pressable の押下と連動させる › ヒント見た目 */
  detailSpineStyle?: object;
  children: ReactNode;
}) {
  const paint = paintProp ?? RESULT_LINE_FRAME_PAINT[badge];
  const showHint = Boolean(showDetailTab);
  const inner = (
    <View style={styles.rectShell}>
      <View style={styles.rectBody}>
        {children}
        {showHint ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.detailHint, detailSpineStyle]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={styles.detailHintLabel}>DETAIL</Text>
            <Text style={styles.detailHintChevron}>›</Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
  const shell = (
    <MatchListLineFrameNative
      topLabel={topLabel}
      paint={paint}
      strokeEnd={strokeEnd}
      animateDraw={animateDraw}
      drawDelayMs={drawDelayMs}
    >
      {inner}
    </MatchListLineFrameNative>
  );
  if (!onOpenDetail) {
    return <View style={styles.rectShellWrap}>{shell}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open result detail"
      delayPressIn={0}
      onPress={onOpenDetail}
      style={({ pressed }) => [
        styles.rectShellWrap,
        pressed ? styles.cardPressed : null,
      ]}
    >
      {shell}
    </Pressable>
  );
}

function TopBar({
  sample,
  badge,
  live,
  motion,
}: {
  sample: Sample;
  badge: OutcomeBadge | null;
  live?: boolean;
  motion?: ResultFaceMatchEntranceStyles;
}) {
  const showStreak = sample.settled !== false && sample.winStreak >= 3;
  if (!showStreak && !badge) return null;
  return (
    <Animated.View style={[styles.topBar, motion?.headerGroupStyle]}>
      <View style={styles.topLeftSlot}>
        {showStreak ? (
          <ResultImpactStreakTagNative winStreak={sample.winStreak} />
        ) : null}
      </View>
      <View style={styles.topBadgeSlot}>
        {badge ? (
          <ImpactOutcomeBadge kind={badge} />
        ) : live ? (
          <ImpactTag label="LIVE" color={LIVE_TONE} />
        ) : null}
      </View>
    </Animated.View>
  );
}

function ImpactOutcomeBadge({ kind }: { kind: OutcomeBadge }) {
  return (
    <ImpactTag
      label={OUTCOME_LABEL[kind]}
      color={OUTCOME_TONE[kind].accent}
    />
  );
}

function MatchBlock({
  sample,
  ja,
  motion,
  deferJerseys = false,
}: {
  sample: Sample;
  ja: boolean;
  motion?: ResultFaceMatchEntranceStyles;
  /** 一覧: 画面近傍まで Skia ジャージを遅延（熱対策） */
  deferJerseys?: boolean;
}) {
  const copy = resultCardFaceCopy(ja ? "ja" : "en");
  const settled = sample.settled !== false;
  const live = sample.live === true;
  const statusLabel = settled
    ? "FINAL"
    : live
      ? "LIVE"
      : copy.pendingCall;
  const mainHome = settled ? sample.resultHome : sample.predHome;
  const mainAway = settled ? sample.resultAway : sample.predAway;
  const Jersey = deferJerseys ? DeferredJerseyMarkNative : JerseyMarkAdaptive;
  return (
    <Animated.View style={[styles.matchRow, motion?.teamsGroupStyle]}>
      <View style={styles.matchSide}>
        <Text style={styles.homeAwayLabel}>HOME</Text>
        <Animated.View style={motion?.homeJerseyStyle}>
          <Jersey
            accent={sample.homeJersey.primary}
            accentEnd={sample.homeJersey.secondary}
            size={42}
            density="coarse"
          />
        </Animated.View>
        <View style={styles.skewWrap}>
          <Text style={styles.teamNameSlant}>{sample.homeName}</Text>
        </View>
      </View>

      <Animated.View style={[styles.matchCenter, motion?.centerBlockStyle]}>
        <View style={styles.skewWrap}>
          <Text
            style={[
              styles.finalStatus,
              live && !settled ? styles.liveStatus : null,
              !settled && !live && ja ? styles.finalStatusJa : null,
            ]}
          >
            {statusLabel}
          </Text>
        </View>
        <Text style={settled ? styles.finalScore : styles.predScoreMain}>
          {mainHome}
          <Text style={settled ? styles.finalDash : styles.predDash}> — </Text>
          {mainAway}
        </Text>
        {settled ? (
          <>
            <Text style={styles.predCaption}>
              {copy.pendingCall}
            </Text>
            <Text style={styles.predScore}>
              {sample.predHome}
              <Text style={styles.predDash}> — </Text>
              {sample.predAway}
            </Text>
          </>
        ) : null}
      </Animated.View>

      <View style={styles.matchSide}>
        <Text style={styles.homeAwayLabel}>AWAY</Text>
        <Animated.View style={motion?.awayJerseyStyle}>
          <Jersey
            accent={sample.awayJersey.primary}
            accentEnd={sample.awayJersey.secondary}
            size={42}
            density="coarse"
          />
        </Animated.View>
        <View style={styles.skewWrap}>
          <Text style={styles.teamNameSlant}>{sample.awayName}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const BIAS_SEGS = 16;
const BIAS_SEG_STAGGER_MS = 32;

function BiasSegFace({
  index,
  progress,
  accent,
  targetOp,
  animate,
}: {
  index: number;
  progress: SharedValue<number>;
  accent: string;
  targetOp: number;
  animate: boolean;
}) {
  const style = useAnimatedStyle(() => {
    if (!animate) {
      return { opacity: targetOp, transform: [{ scaleX: 1 }] };
    }
    const t = interpolate(
      progress.value,
      [index, index + 0.8],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity: t * targetOp,
      transform: [{ scaleX: 0.12 + t * 0.88 }],
    };
  });
  return (
    <View style={styles.biasSegSlot}>
      <View style={styles.biasSegSkew}>
        <Animated.View
          style={[
            styles.biasSegFace,
            {
              borderColor: hexWithAlpha(accent, "88"),
              backgroundColor: accent,
            },
            style,
          ]}
        />
      </View>
    </View>
  );
}

function MarketBias({
  sample,
  ja,
  animate = false,
  revealDelayMs = 0,
}: {
  sample: Sample;
  ja: boolean;
  animate?: boolean;
  revealDelayMs?: number;
}) {
  const copy = resultCardFaceCopy(ja ? "ja" : "en");
  const homeSegs = Math.max(
    0,
    Math.min(BIAS_SEGS, Math.round((sample.marketHomePct / 100) * BIAS_SEGS))
  );
  const progress = useSharedValue(animate ? 0 : BIAS_SEGS);

  useLayoutEffect(() => {
    if (!animate) {
      progress.value = BIAS_SEGS;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      revealDelayMs,
      withTiming(BIAS_SEGS, {
        duration: BIAS_SEGS * BIAS_SEG_STAGGER_MS,
        easing: Easing.linear,
      })
    );
  }, [animate, revealDelayMs, progress]);

  return (
    <View style={styles.biasRoot}>
      <View style={styles.biasPctHeader}>
        <Text style={[styles.biasPctHeaderNum, { color: sample.homeAccent }]}>
          {sample.marketHomePct.toFixed(1)}%
        </Text>
        <Text style={styles.biasPctHeaderMid}>
          — {copy.marketBias} —
        </Text>
        <Text
          style={[
            styles.biasPctHeaderNum,
            styles.biasPctHeaderNumAway,
            { color: sample.awayAccent },
          ]}
        >
          {sample.marketAwayPct.toFixed(1)}%
        </Text>
      </View>

      <View style={styles.biasBarOuter}>
        <View style={styles.biasBarInner}>
          {Array.from({ length: BIAS_SEGS }).map((_, i) => {
            const home = i < homeSegs;
            return (
              <BiasSegFace
                key={i}
                index={i}
                progress={progress}
                accent={home ? sample.homeAccent : sample.awayAccent}
                targetOp={home ? 0.95 : 0.85}
                animate={animate}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function TopScorerRow({
  sample,
  scorerIcon,
}: {
  sample: Sample;
  scorerIcon: ScorerIconId;
}) {
  if (!sample.topScorer || sample.topScorer === "—") return null;
  const settled = sample.settled !== false;
  const scorerHit = sample.topScorerHit;
  const iconName =
    SCORER_ICONS.find((i) => i.id === scorerIcon)?.name ?? "check";
  const iconColor = scorerHit ? SCORER_HIT_COLOR : SCORER_MISS_COLOR;

  return (
    <View style={styles.scorerBlock}>
      <View style={styles.scorerValueRow}>
        <View style={styles.skewWrap}>
          <Text style={styles.scorerLabel}>TOP SCORER</Text>
        </View>
        <View style={styles.scorerNameWrap}>
          <View style={styles.scorerNameSkew}>
            <Text style={styles.scorerName} numberOfLines={1}>
              {sample.topScorer}
            </Text>
          </View>
        </View>
        {settled ? (
          <View style={styles.scorerHitCluster}>
            <MaterialCommunityIcons
              name={scorerHit ? iconName : "close"}
              size={14}
              color={iconColor}
            />
            <Text
              style={[
                styles.scorerHit,
                scorerHit ? styles.scorerHitOn : styles.scorerHitOff,
              ]}
            >
              {scorerHit ? "HIT" : "MISS"}
            </Text>
          </View>
        ) : (
          <View style={styles.scorerHitCluster} />
        )}
      </View>
    </View>
  );
}

/** D — 枠なし分割 + スコア下に短い相対ラベル */
function UpsetScoreD({
  sample,
  ja,
  scoreRel,
}: {
  sample: Sample;
  ja: boolean;
  scoreRel: ScoreRelKind;
}) {
  const copy = resultCardFaceCopy(ja ? "ja" : "en");
  const settled = sample.settled !== false;
  const hasUpset = settled && sample.upsetPoints != null;
  const upsetValue = hasUpset ? sample.upsetPoints!.toFixed(1) : "--";
  const rel = settled ? scoreRelText(scoreRel) : null;
  const relHot = scoreRel === "max" || scoreRel === "top5";

  return (
    <View style={styles.splitRow}>
      <View style={[styles.splitSide, !hasUpset && styles.splitSideMuted]}>
        <Text style={styles.splitLabel}>{copy.upset}</Text>
        <View style={styles.skewWrap}>
          <Text
            style={[
              styles.splitValue,
              hasUpset ? styles.splitValueUpset : styles.splitValueEmpty,
            ]}
          >
            {upsetValue}
          </Text>
        </View>
        {/* 左右の高さ揃え用プレースホルダ */}
        <Text style={styles.splitRelSpacer}> </Text>
      </View>
      <View style={styles.splitRule} />
      <View style={styles.splitSide}>
        <Text style={styles.splitLabel}>{copy.score}</Text>
        <View style={styles.skewWrap}>
          <Text style={[styles.splitValue, styles.splitValueScore]}>
            {settled ? sample.totalPoints.toFixed(1) : "--"}
          </Text>
        </View>
        {rel ? (
          <Text
            style={[styles.splitRel, relHot ? styles.splitRelHot : null]}
            numberOfLines={1}
          >
            {rel}
          </Text>
        ) : (
          <Text style={styles.splitRelSpacer}> </Text>
        )}
      </View>
    </View>
  );
}

function StatBlock({
  sample,
  ja,
  scorerIcon,
  scoreRel,
  tutorialMetricsTargetId,
}: {
  sample: Sample;
  ja: boolean;
  scorerIcon: ScorerIconId;
  scoreRel: ScoreRelKind;
  tutorialMetricsTargetId?: string;
}) {
  const metricsRef = useRef<View>(null);

  useEffect(() => {
    if (!tutorialMetricsTargetId) return;
    return registerTutorialTarget(tutorialMetricsTargetId, () =>
      new Promise((resolve) => {
        const node = metricsRef.current;
        if (!node) {
          resolve(null);
          return;
        }
        node.measureInWindow((x, y, width, height) => {
          if (width < 2 || height < 2) {
            resolve(null);
            return;
          }
          resolve({ x, y, width, height });
        });
      })
    );
  }, [tutorialMetricsTargetId]);

  return (
    <View ref={metricsRef} collapsable={false} style={styles.statBlock}>
      <TopScorerRow sample={sample} scorerIcon={scorerIcon} />
      <UpsetScoreD sample={sample} ja={ja} scoreRel={scoreRel} />
    </View>
  );
}

/** 案1 — 3層スキャン（長方形）・バッジは LEGEND 塗り・Upset/Score は D */
function Plan1Card({
  sample,
  badge,
  ja,
  scorerIcon,
  scoreRel,
  onOpenDetail,
  showDetailTab = false,
  frameGlow = true,
  bare = false,
  tutorialMetricsTargetId,
  strokeEnd,
  animateDraw = false,
  drawDelayMs = 0,
  motion,
  detailSpineStyle,
  deferJerseys = false,
}: {
  sample: Sample;
  badge: OutcomeBadge | null;
  ja: boolean;
  scorerIcon: ScorerIconId;
  scoreRel: ScoreRelKind;
  onOpenDetail?: () => void;
  showDetailTab?: boolean;
  frameGlow?: boolean;
  bare?: boolean;
  tutorialMetricsTargetId?: string;
  strokeEnd?: SharedValue<number>;
  animateDraw?: boolean;
  drawDelayMs?: number;
  motion?: ResultFaceMatchEntranceStyles;
  detailSpineStyle?: object;
  deferJerseys?: boolean;
}) {
  const settled = sample.settled !== false;
  const paint = settled && badge
    ? RESULT_LINE_FRAME_PAINT[badge]
    : RESULT_PENDING_LINE_FRAME_PAINT;
  const shellBadge: OutcomeBadge = badge ?? "miss";
  const body = (
    <View style={styles.pad}>
      <TopBar
        sample={sample}
        badge={badge}
        live={sample.live === true}
        motion={motion}
      />
      <MatchBlock
        sample={sample}
        ja={ja}
        motion={motion}
        deferJerseys={deferJerseys}
      />
      <Animated.View style={[styles.layerDivider, motion?.dividerStyle]} />
      <Animated.View style={motion?.footerGroupStyle}>
        <MarketBias
          sample={sample}
          ja={ja}
          animate={animateDraw}
          revealDelayMs={resultFaceGroupDelayMs(drawDelayMs, 2) + 60}
        />
        <StatBlock
          sample={sample}
          ja={ja}
          scorerIcon={scorerIcon}
          scoreRel={scoreRel}
          tutorialMetricsTargetId={tutorialMetricsTargetId}
        />
      </Animated.View>
    </View>
  );

  if (bare) {
    return (
      <MatchListLineFrameNative
        topLabel={sample.roundLabel}
        paint={paint}
        strokeEnd={strokeEnd}
        animateDraw={animateDraw}
        drawDelayMs={drawDelayMs}
      >
        <View style={styles.bareFace}>{body}</View>
      </MatchListLineFrameNative>
    );
  }

  return (
    <RectShell
      badge={shellBadge}
      paint={paint}
      topLabel={sample.roundLabel}
      onOpenDetail={onOpenDetail}
      showDetailTab={showDetailTab}
      frameGlow={frameGlow}
      strokeEnd={strokeEnd}
      animateDraw={animateDraw}
      drawDelayMs={drawDelayMs}
      motion={motion}
      detailSpineStyle={detailSpineStyle}
    >
      {body}
    </RectShell>
  );
}

/** 本番／詳細用 — 共有 `ResultCardFaceModel` をカード面に描画 */
export function ResultCardDesignFaceNative({
  language,
  badge,
  scoreRel,
  sample,
  face,
  /** true: 外側シェルなし（親が Team Detail 風の枠を持つとき） */
  bare = false,
  frameGlow = false,
  showDetailTab = false,
  onOpenDetail,
  tutorialMetricsTargetId,
  strokeEnd,
  animateDraw = false,
  drawDelayMs = 0,
  motion,
  detailSpineStyle,
  live = false,
  deferJerseys = false,
}: {
  language: "ja" | "en";
  badge?: OutcomeBadge | null;
  scoreRel?: ScoreRelKind;
  sample?: Sample;
  /** 共有 `buildResultCardFaceModel` 出力 */
  face?: {
    roundLabel: string;
    homeName: string;
    awayName: string;
    homeTeamId?: string;
    awayTeamId?: string;
    league?: string;
    predHome: number;
    predAway: number;
    resultHome: number | null;
    resultAway: number | null;
    marketHomePct: number;
    marketAwayPct: number;
    userPick: "home" | "away" | "draw";
    upsetPoints: number | null;
    totalPoints: number;
    topScorer: string | null;
    topScorerHit: boolean | null;
    winStreak: number;
    outcomeBadge?: OutcomeBadge | null;
    scoreRel?: ScoreRelKind;
  };
  bare?: boolean;
  frameGlow?: boolean;
  showDetailTab?: boolean;
  onOpenDetail?: () => void;
  /** チュートリアル穴（Upset / Score 行） */
  tutorialMetricsTargetId?: string;
  strokeEnd?: SharedValue<number>;
  animateDraw?: boolean;
  drawDelayMs?: number;
  motion?: ResultFaceMatchEntranceStyles;
  detailSpineStyle?: object;
  /** 開始〜確定まで。判定前カードの LIVE 表示 */
  live?: boolean;
  /** 一覧: 画面近傍まで Skia ジャージ遅延 */
  deferJerseys?: boolean;
}) {
  const settledFromFace =
    face != null
      ? face.resultHome != null && face.resultAway != null
      : sample?.settled !== false;
  const resolved: Sample = face
    ? (() => {
        const homeJersey = resolveTeamJerseyPalette(
          face.league ?? "nba",
          { teamId: face.homeTeamId, name: face.homeName },
          SAMPLE.homeJersey.primary
        );
        const awayJersey = resolveTeamJerseyPalette(
          face.league ?? "nba",
          { teamId: face.awayTeamId, name: face.awayName },
          SAMPLE.awayJersey.primary
        );
        const matchupAccents = resolveMatchupUiAccents(
          normalizeLeague(face.league ?? "nba"),
          face.homeTeamId,
          face.awayTeamId
        );
        return {
          ...SAMPLE,
          roundLabel: face.roundLabel,
          homeName: face.homeName,
          awayName: face.awayName,
          homeJersey: {
            primary: homeJersey.primary,
            secondary: homeJersey.secondary,
          },
          awayJersey: {
            primary: awayJersey.primary,
            secondary: awayJersey.secondary,
          },
          homeAccent: matchupAccents.homeAccent,
          awayAccent: matchupAccents.awayAccent,
          predHome: face.predHome,
          predAway: face.predAway,
          resultHome: face.resultHome ?? 0,
          resultAway: face.resultAway ?? 0,
          marketHomePct: face.marketHomePct,
          marketAwayPct: face.marketAwayPct,
          userPick: face.userPick === "draw" ? "home" : face.userPick,
          upsetPoints: face.upsetPoints,
          totalPoints: face.totalPoints,
          topScorer: face.topScorer,
          topScorerHit: face.topScorerHit === true,
          winStreak: face.winStreak,
          settled: settledFromFace,
          live,
        };
      })()
    : { ...(sample ?? { ...SAMPLE, upsetPoints: 2.4 }), live: sample?.live ?? live };

  const resolvedBadge: OutcomeBadge | null = settledFromFace
    ? (badge ?? face?.outcomeBadge ?? "hit")
    : null;
  const resolvedScoreRel = settledFromFace
    ? (scoreRel ?? face?.scoreRel ?? "none")
    : "none";

  return (
    <Plan1Card
      sample={resolved}
      badge={resolvedBadge}
      ja={language === "ja"}
      scorerIcon="check"
      scoreRel={resolvedScoreRel}
      showDetailTab={showDetailTab}
      onOpenDetail={onOpenDetail}
      frameGlow={frameGlow}
      bare={bare}
      tutorialMetricsTargetId={tutorialMetricsTargetId}
      strokeEnd={strokeEnd}
      animateDraw={animateDraw}
      drawDelayMs={drawDelayMs}
      motion={motion}
      detailSpineStyle={detailSpineStyle}
      deferJerseys={deferJerseys}
    />
  );
}

export default function ResultCardDesignPreviewScreenNative({
  language,
  onClose,
  onOpenDetail,
}: Props) {
  const insets = useSafeAreaInsets();
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const ja = language === "ja";
  const [badge, setBadge] = useState<OutcomeBadge>("hit");
  const [scorerIcon, setScorerIcon] = useState<ScorerIconId>("check");
  const [upsetOn, setUpsetOn] = useState(true);
  const [scoreRel, setScoreRel] = useState<ScoreRelKind>("top10");
  const [winStreak, setWinStreak] = useState<number>(5);

  const sample: Sample = {
    ...SAMPLE,
    upsetPoints: upsetOn ? 2.4 : null,
    winStreak,
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={22} color="#E2E8F0" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>RESULT · PLAN A BADGE</Text>
          <Text style={styles.subtitle}>
            {ja
              ? "バッジは LEGEND 塗り固定。UPSET 枠は本番どおり赤。"
              : "LEGEND filled badges locked. UPSET frame matches prod red."}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgeTabs}
      >
        {BADGE_OPTS.map((b) => (
          <Pressable
            key={b}
            onPress={() => setBadge(b)}
            style={[styles.badgeTab, badge === b && styles.badgeTabOn]}
          >
            <Text
              style={[
                styles.badgeTabText,
                badge === b && styles.badgeTabTextOn,
              ]}
            >
              {b.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgeTabs}
      >
        {STREAK_OPTS.map((n) => (
          <Pressable
            key={n}
            onPress={() => setWinStreak(n)}
            style={[styles.badgeTab, winStreak === n && styles.badgeTabOn]}
          >
            <Text
              style={[
                styles.badgeTabText,
                winStreak === n && styles.badgeTabTextOn,
              ]}
            >
              {n === 0 ? "W—" : `W${n}`}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setUpsetOn(true)}
          style={[styles.badgeTab, upsetOn && styles.badgeTabOn]}
        >
          <Text
            style={[styles.badgeTabText, upsetOn && styles.badgeTabTextOn]}
          >
            UPSET ON
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setUpsetOn(false)}
          style={[styles.badgeTab, !upsetOn && styles.badgeTabOn]}
        >
          <Text
            style={[styles.badgeTabText, !upsetOn && styles.badgeTabTextOn]}
          >
            UPSET OFF
          </Text>
        </Pressable>
        {SCORE_REL_OPTS.map((opt) => (
          <Pressable
            key={opt.id}
            onPress={() => setScoreRel(opt.id)}
            style={[styles.badgeTab, scoreRel === opt.id && styles.badgeTabOn]}
          >
            <Text
              style={[
                styles.badgeTabText,
                scoreRel === opt.id && styles.badgeTabTextOn,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomContentReserveY + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionName}>
            {ja ? "試用 · IMPACT バッジ" : "Trial · IMPACT badge"}
          </Text>
          <Text style={styles.sectionBlurb}>
            {ja
              ? "イタリック + 斜めアンダー。HIT=金 / PERFECT=青 / UPSET=赤 / MISS=鋼。"
              : "Italic + slash underline. HIT=gold / PERFECT=blue / UPSET=red / MISS=steel."}
          </Text>
          <View style={styles.badgeGalleryRow}>
            {BADGE_OPTS.map((k) => (
              <ImpactOutcomeBadge key={k} kind={k} />
            ))}
          </View>
          <Plan1Card
            sample={sample}
            badge={badge}
            ja={ja}
            scorerIcon={scorerIcon}
            scoreRel={scoreRel}
            onOpenDetail={onOpenDetail}
            showDetailTab
          />
        </View>
      </ScrollView>
    </View>
  );
}

const CARD_W = MOBILE_RESULT_CARD_MAX_W;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#05080e" },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.28)",
    backgroundColor: "rgba(15,23,42,0.7)",
  },
  title: {
    fontFamily: NUMERIC_FONT,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#F8FAFC",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(226,232,240,0.55)",
  },
  badgeTabs: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    flexDirection: "row",
  },
  badgeTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.25)",
  },
  badgeTabOn: {
    borderColor: "#FBBF24",
    backgroundColor: "rgba(251,191,36,0.12)",
  },
  badgeTabText: {
    fontFamily: NUMERIC_FONT,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(226,232,240,0.45)",
  },
  badgeTabTextOn: { color: "#FBBF24" },
  list: {
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 22,
    alignItems: "center",
  },
  section: { width: "100%", maxWidth: CARD_W, gap: 8, overflow: "visible" },
  sectionName: {
    fontFamily: NUMERIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#F1F5F9",
  },
  sectionBlurb: {
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(226,232,240,0.5)",
    marginBottom: 4,
  },

  rectShellWrap: {
    width: "100%",
    overflow: "visible",
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  detailHint: {
    position: "absolute",
    right: 8,
    bottom: 6,
    zIndex: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: "rgba(0,245,255,0.55)",
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  detailHintLabel: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 8,
    fontWeight: "800",
    lineHeight: 10,
    letterSpacing: 1.1,
    includeFontPadding: false,
    color: "rgba(0,245,255,0.88)",
  },
  detailHintChevron: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 14,
    letterSpacing: 0,
    includeFontPadding: false,
    color: "rgba(0,245,255,0.95)",
    marginTop: -1,
  },
  rectShell: {
    width: "100%",
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
  },
  bareFace: {
    width: "100%",
    backgroundColor: "transparent",
  },
  rectBody: {
    position: "relative",
    zIndex: 1,
  },

  pad: {
    paddingHorizontal: 10,
    paddingTop: 18,
    paddingBottom: 14,
  },
  layerDivider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: 10,
    marginBottom: 10,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    minHeight: 28,
  },
  topLeftSlot: {
    minWidth: 52,
    maxWidth: 96,
    alignItems: "flex-start",
  },
  topBadgeSlot: { maxWidth: 96, alignItems: "flex-end" },

  matchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  matchSide: {
    width: 92,
    alignItems: "center",
    gap: 3,
    /** 中央の予想スコアより少し下にユニフォーム＋チーム名を置く */
    paddingTop: 16,
  },
  homeAwayLabel: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(226,232,240,0.45)",
  },
  /** 本番 teamName — Bebas */
  teamNameSlant: {
    marginTop: 4,
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: 1.04,
    color: "rgba(248,250,252,0.95)",
    textAlign: "center",
    width: "100%",
    textTransform: "uppercase",
    includeFontPadding: false,
  },
  skewWrap: {
    transform: [{ skewX: "-10deg" }],
    alignSelf: "center",
  },
  matchCenter: {
    flex: 1,
    alignItems: "center",
    /** 判定前の「あなたの予想」＋数字をユニフォーム寄りに少し下げる */
    paddingTop: 20,
    gap: 2,
  },
  /** FINAL — 得点の上 */
  finalStatus: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 2.2,
    color: "rgba(248,250,252,0.75)",
    textTransform: "uppercase",
    includeFontPadding: false,
    marginBottom: 2,
  },
  finalStatusJa: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "none",
    color: "rgba(226,232,240,0.55)",
  },
  liveStatus: {
    color: LIVE_TONE,
  },
  /** 本番スコア — Montserrat Black Italic */
  finalScore: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "900",
    color: "rgba(255,255,255,0.95)",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
  },
  finalDash: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 18,
    fontWeight: "900",
    color: "rgba(255,255,255,0.7)",
  },
  predCaption: {
    fontSize: 10,
    color: "rgba(226,232,240,0.45)",
  },
  predScoreMain: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "900",
    color: "rgba(253,224,71,0.95)",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
    textShadowColor: "rgba(251,191,36,0.32)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  predScore: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 15,
    lineHeight: 17,
    fontWeight: "900",
    color: "rgba(253,224,71,0.95)",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.4,
    textShadowColor: "rgba(251,191,36,0.32)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  predDash: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 13,
    fontWeight: "900",
    color: "rgba(253,224,71,0.95)",
  },

  biasRoot: { width: "100%", marginBottom: 6 },
  biasPctHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 6,
    paddingHorizontal: 28,
  },
  biasPctHeaderNum: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.4,
    minWidth: 48,
  },
  biasPctHeaderNumAway: {
    marginRight: -6,
    textAlign: "right",
  },
  biasPctHeaderMid: {
    flex: 1,
    textAlign: "center",
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(0,245,255,0.55)",
    textTransform: "uppercase",
  },
  biasBarOuter: { width: "100%", marginBottom: 0 },
  biasBarInner: {
    flexDirection: "row",
    width: "100%",
    padding: 2,
    gap: 2,
  },
  biasSegSlot: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  biasSegSkew: { transform: [{ skewX: "-16deg" }] },
  biasSegFace: {
    height: 10,
    width: "100%",
    borderWidth: 1,
    transformOrigin: "left center",
  },

  statBlock: { gap: 6, paddingTop: 2 },

  /** D split + relative */
  splitRow: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: 2,
  },
  splitSide: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
  },
  splitSideMuted: { opacity: 0.55 },
  splitRule: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginVertical: 2,
  },
  splitLabel: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(148,163,184,0.7)",
    textTransform: "uppercase",
  },
  splitValue: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.4,
    color: "#F8FAFC",
  },
  splitValueUpset: { color: UPSET_RED },
  splitValueScore: { color: AMBER },
  splitValueEmpty: { color: "rgba(148,163,184,0.55)" },
  splitRel: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: "rgba(226,232,240,0.55)",
    textTransform: "uppercase",
    marginTop: 1,
  },
  splitRelHot: {
    color: AMBER,
  },
  splitRelSpacer: {
    fontSize: 9,
    lineHeight: 12,
    opacity: 0,
  },

  scorerBlock: {
    marginBottom: 0,
    paddingVertical: 3,
  },
  scorerLabel: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: 1.04,
    color: "rgba(248,250,252,0.92)",
    textTransform: "uppercase",
    flexShrink: 0,
    width: 88,
    includeFontPadding: false,
  },
  scorerValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scorerNameWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  scorerNameSkew: {
    transform: [{ skewX: "-10deg" }],
    maxWidth: "100%",
  },
  scorerName: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: 0.8,
    color: "#F8FAFC",
    textTransform: "uppercase",
    textAlign: "center",
    includeFontPadding: false,
  },
  scorerHitCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
    width: 88,
    justifyContent: "flex-end",
  },
  scorerHit: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    lineHeight: 14,
  },
  scorerHitOn: { color: SCORER_HIT_COLOR },
  scorerHitOff: { color: SCORER_MISS_COLOR },


  badgeGalleryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },

  /** C · HUD bar */
  hudBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  hudBadgeBar: {
    width: 3,
    alignSelf: "stretch",
    minHeight: 22,
  },
  hudBadgeText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  /** D · stencil plate */
  stencilBadge: {
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 7,
  },
  stencilScan: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "42%",
    height: 1,
  },
  stencilText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  /** E · pip */
  pipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pipDot: {
    width: 6,
    height: 6,
    transform: [{ rotate: "45deg" }],
  },
  pipText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
});
