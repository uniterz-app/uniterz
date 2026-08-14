/**
 * __DEV__ リザルトカード — 案1（3層スキャン）専用プレビュー。
 * バッジは A（LEGEND 塗り）固定。UPSET 枠は濃い赤 / PERFECT は深い青。
 * 右辺 DETAIL タブ → 詳細プレビュー。Upset/Score は D + 相対ラベル。YOU なし。
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import JerseyMarkAdaptive from "../games/JerseyMarkAdaptive";
import { PANEL_BG } from "../profile/reports/reportThemeNative";
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
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";

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

const FRAME_BY_BADGE: Record<
  OutcomeBadge,
  {
    borderColor: string;
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
  }
> = {
  hit: {
    borderColor: "rgba(254,243,199,0.92)",
    shadowColor: "rgba(251,191,36,1)",
    shadowOpacity: 0.72,
    shadowRadius: 18,
  },
  perfect: {
    borderColor: "rgba(37,99,235,0.95)",
    shadowColor: "rgba(29,78,216,1)",
    shadowOpacity: 0.78,
    shadowRadius: 20,
  },
  upset: {
    borderColor: "rgba(185,28,28,0.98)",
    shadowColor: "rgba(153,27,27,1)",
    shadowOpacity: 0.82,
    shadowRadius: 20,
  },
  miss: {
    borderColor: "rgba(107,114,128,0.55)",
    shadowColor: "rgba(100,116,139,0.35)",
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
};

const STREAK_OPTS = [0, 3, 5, 7] as const;

/** 連勝タグ — HIT と同系の黄（日英共通 W{n}）。グローは HIT より弱め */
const STREAK_TONE = {
  accent: "#FCD34D",
  fillText: "#1A1200",
  glow: "rgba(252,211,77,0.22)",
} as const;

const BADGE_OPTS: OutcomeBadge[] = ["hit", "perfect", "upset", "miss"];

const BADGE_LABEL: Record<OutcomeBadge, string> = {
  hit: "HIT",
  perfect: "PERFECT",
  upset: "UPSET",
  miss: "MISS",
};

/** バッジ配色（プレビュー案共通）
 * LEGEND 塗り: accent 塗り + fillText（暗い字）
 * outline: 枠/文字 = accent
 */
const BADGE_TONE: Record<
  OutcomeBadge,
  { accent: string; soft: string; text: string; fill: string; fillText: string; glow: string }
> = {
  hit: {
    accent: "#FCD34D",
    soft: "rgba(251,191,36,0.22)",
    text: "#FFFBEB",
    fill: "rgba(120,53,15,0.55)",
    fillText: "#1A1200",
    glow: "rgba(252,211,77,0.22)",
  },
  perfect: {
    accent: "#3B82F6",
    soft: "rgba(37,99,235,0.28)",
    text: "#EFF6FF",
    fill: "rgba(30,58,138,0.55)",
    fillText: "#06101F",
    glow: "rgba(37,99,235,0.5)",
  },
  upset: {
    accent: "#DC2626",
    soft: "rgba(185,28,28,0.28)",
    text: "#FEF2F2",
    fill: "rgba(127,29,29,0.6)",
    fillText: "#1A0505",
    glow: "rgba(185,28,28,0.55)",
  },
  miss: {
    accent: "#94A3B8",
    soft: "rgba(148,163,184,0.18)",
    text: "#E2E8F0",
    fill: "rgba(30,41,59,0.7)",
    fillText: "#0B1018",
    glow: "rgba(148,163,184,0.35)",
  },
};

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

/** 右辺 DETAIL タブ（背表紙タブ型・ニュートラル枠） */
const DETAIL_SPINE = {
  width: 18,
  height: 80,
  top: 68,
} as const;

/** プレビュー用・直角長方形シェル（角切りなし）+ 任意で右辺 DETAIL */
function RectShell({
  badge,
  onOpenDetail,
  showDetailTab = false,
  frameGlow = true,
  children,
}: {
  badge: OutcomeBadge;
  onOpenDetail?: () => void;
  showDetailTab?: boolean;
  /** false なら詳細向け — 枠グローなし・枠色もニュートラル */
  frameGlow?: boolean;
  children: ReactNode;
}) {
  const frame = FRAME_BY_BADGE[badge];
  const stroke = RESULT_CYBER_FRAME_STROKE_WIDTH;
  const detailTab = Boolean(showDetailTab && onOpenDetail);
  const borderColor = frameGlow
    ? frame.borderColor
    : "rgba(148,163,184,0.22)";
  return (
    <View style={styles.rectShellWrap}>
      {detailTab ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="DETAIL"
          onPress={onOpenDetail}
          hitSlop={8}
          style={({ pressed }) => [
            styles.detailSpine,
            {
              borderWidth: stroke,
              borderLeftWidth: 0,
            },
            pressed ? styles.detailSpinePressed : null,
          ]}
        >
          <View style={styles.detailSpineTextCol}>
            {"DETAIL".split("").map((ch) => (
              <Text key={ch} style={styles.detailSpineChar}>
                {ch}
              </Text>
            ))}
          </View>
        </Pressable>
      ) : null}
      <View
        style={[
          styles.rectShell,
          {
            borderColor,
            borderWidth: stroke,
            ...(frameGlow
              ? {
                  shadowColor: frame.shadowColor,
                  shadowOpacity: frame.shadowOpacity,
                  shadowRadius: frame.shadowRadius,
                  elevation: 8,
                }
              : {
                  shadowOpacity: 0,
                  elevation: 0,
                }),
          },
        ]}
      >
        <View style={styles.rectBody}>{children}</View>
      </View>
    </View>
  );
}

function TopBar({
  sample,
  badge,
}: {
  sample: Sample;
  badge: OutcomeBadge;
}) {
  const showStreak = sample.winStreak >= 3;
  return (
    <View style={styles.topBar}>
      <View style={styles.topLeftSlot}>
        {showStreak ? (
          <LegendFilledTag
            label={`W${sample.winStreak}`}
            accent={STREAK_TONE.accent}
            fillText={STREAK_TONE.fillText}
            glow={STREAK_TONE.glow}
            glowOpacity={0.7}
            glowRadius={8}
          />
        ) : null}
      </View>
      <View style={styles.roundTitleWrap}>
        <Text style={styles.roundTitle} numberOfLines={1}>
          {sample.roundLabel}
        </Text>
      </View>
      <View style={styles.topBadgeSlot}>
        <LegendOutcomeBadge kind={badge} />
      </View>
    </View>
  );
}

/** 採用案 A — 本番 LEGEND filled（塗り + スキャン線） */
const LEGEND_TAB_H = 26;
const LEGEND_SCAN_STEP = 3;
const LEGEND_SCAN_START = 2;
const LEGEND_SKEW = "-14deg";
const LEGEND_SKEW_INV = "14deg";

function LegendTabScan() {
  const count = Math.max(
    0,
    Math.floor((LEGEND_TAB_H - LEGEND_SCAN_START - 1) / LEGEND_SCAN_STEP) + 1
  );
  return (
    <View style={styles.legendScanLayer} pointerEvents="none">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.legendScanLine,
            { top: LEGEND_SCAN_START + i * LEGEND_SCAN_STEP },
          ]}
        />
      ))}
    </View>
  );
}

function LegendFilledTag({
  label,
  accent,
  fillText,
  glow,
  glowOpacity = 1,
  glowRadius = 16,
}: {
  label: string;
  accent: string;
  fillText: string;
  glow: string;
  glowOpacity?: number;
  glowRadius?: number;
}) {
  return (
    <View
      style={[
        styles.legendOuter,
        {
          shadowColor: glow,
          shadowOpacity: glowOpacity,
          shadowRadius: glowRadius,
        },
      ]}
    >
      <View style={[styles.legendTab, { backgroundColor: accent }]}>
        <LegendTabScan />
        <Text style={[styles.legendTabText, { color: fillText }]}>{label}</Text>
      </View>
    </View>
  );
}

function LegendOutcomeBadge({ kind }: { kind: OutcomeBadge }) {
  const tone = BADGE_TONE[kind];
  const softGlow = kind === "hit";
  return (
    <LegendFilledTag
      label={BADGE_LABEL[kind]}
      accent={tone.accent}
      fillText={tone.fillText}
      glow={tone.glow}
      glowOpacity={softGlow ? 0.7 : 1}
      glowRadius={softGlow ? 8 : 16}
    />
  );
}

function MatchBlock({ sample, ja }: { sample: Sample; ja: boolean }) {
  return (
    <View style={styles.matchRow}>
      <View style={styles.matchSide}>
        <Text style={styles.homeAwayLabel}>HOME</Text>
        <JerseyMarkAdaptive
          accent={sample.homeJersey.primary}
          accentEnd={sample.homeJersey.secondary}
          size={42}
        />
        <View style={styles.skewWrap}>
          <Text style={styles.teamNameSlant}>{sample.homeName}</Text>
        </View>
      </View>

      <View style={styles.matchCenter}>
        <View style={styles.skewWrap}>
          <Text style={styles.finalStatus}>FINAL</Text>
        </View>
        <Text style={styles.finalScore}>
          {sample.resultHome}
          <Text style={styles.finalDash}> — </Text>
          {sample.resultAway}
        </Text>
        <Text style={styles.predCaption}>
          {ja ? "あなたの予想" : "YOUR CALL"}
        </Text>
        <Text style={styles.predScore}>
          {sample.predHome}
          <Text style={styles.predDash}> — </Text>
          {sample.predAway}
        </Text>
      </View>

      <View style={styles.matchSide}>
        <Text style={styles.homeAwayLabel}>AWAY</Text>
        <JerseyMarkAdaptive
          accent={sample.awayJersey.primary}
          accentEnd={sample.awayJersey.secondary}
          size={42}
        />
        <View style={styles.skewWrap}>
          <Text style={styles.teamNameSlant}>{sample.awayName}</Text>
        </View>
      </View>
    </View>
  );
}

function MarketBias({ sample, ja }: { sample: Sample; ja: boolean }) {
  const segs = 16;
  const homeSegs = Math.max(
    1,
    Math.round((sample.marketHomePct / 100) * segs)
  );

  return (
    <View style={styles.biasRoot}>
      <View style={styles.biasPctHeader}>
        <Text style={[styles.biasPctHeaderNum, { color: sample.homeAccent }]}>
          {sample.marketHomePct.toFixed(1)}%
        </Text>
        <Text style={styles.biasPctHeaderMid}>
          — {ja ? "市場の偏り" : "MARKET BIAS"} —
        </Text>
        <Text
          style={[
            styles.biasPctHeaderNum,
            styles.biasPctHeaderNumAway,
            { color: "#E8ECF0" },
          ]}
        >
          {sample.marketAwayPct.toFixed(1)}%
        </Text>
      </View>

      <View style={styles.biasBarOuter}>
        <View style={styles.biasBarInner}>
          {Array.from({ length: segs }).map((_, i) => {
            const home = i < homeSegs;
            const accent = home ? sample.homeAccent : "#9CA3AF";
            return (
              <View key={i} style={styles.biasSegSlot}>
                <View style={styles.biasSegSkew}>
                  <View
                    style={[
                      styles.biasSegFace,
                      {
                        borderColor: hexWithAlpha(accent, "88"),
                        backgroundColor: accent,
                        opacity: home ? 0.95 : 0.55,
                      },
                    ]}
                  />
                </View>
              </View>
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
  if (!sample.topScorer) return null;
  const scorerHit = sample.topScorerHit;
  const iconName =
    SCORER_ICONS.find((i) => i.id === scorerIcon)?.name ?? "check";
  const iconColor = scorerHit ? SCORER_HIT_COLOR : SCORER_MISS_COLOR;

  return (
    <View style={styles.scorerBlock}>
      <View style={styles.scorerValueRow}>
        <Text style={styles.scorerLabel}>TOP SCORER</Text>
        <View style={styles.scorerNameWrap}>
          <View style={styles.scorerNameSkew}>
            <Text style={styles.scorerName} numberOfLines={1}>
              {sample.topScorer}
            </Text>
          </View>
        </View>
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
  const hasUpset = sample.upsetPoints != null;
  const upsetValue = hasUpset ? sample.upsetPoints!.toFixed(1) : "--";
  const rel = scoreRelText(scoreRel);
  const relHot = scoreRel === "max" || scoreRel === "top5";

  return (
    <View style={styles.splitRow}>
      <View style={[styles.splitSide, !hasUpset && styles.splitSideMuted]}>
        <Text style={styles.splitLabel}>{ja ? "アップセット" : "UPSET"}</Text>
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
        <Text style={styles.splitLabel}>{ja ? "スコア" : "SCORE"}</Text>
        <View style={styles.skewWrap}>
          <Text style={[styles.splitValue, styles.splitValueScore]}>
            {sample.totalPoints.toFixed(1)}
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
}: {
  sample: Sample;
  badge: OutcomeBadge;
  ja: boolean;
  scorerIcon: ScorerIconId;
  scoreRel: ScoreRelKind;
  onOpenDetail?: () => void;
  showDetailTab?: boolean;
  frameGlow?: boolean;
  bare?: boolean;
  tutorialMetricsTargetId?: string;
}) {
  const body = (
    <View style={styles.pad}>
      <TopBar sample={sample} badge={badge} />
      <MatchBlock sample={sample} ja={ja} />
      <View style={styles.layerDivider} />
      <MarketBias sample={sample} ja={ja} />
      <StatBlock
        sample={sample}
        ja={ja}
        scorerIcon={scorerIcon}
        scoreRel={scoreRel}
        tutorialMetricsTargetId={tutorialMetricsTargetId}
      />
    </View>
  );

  if (bare) {
    return <View style={styles.bareFace}>{body}</View>;
  }

  return (
    <RectShell
      badge={badge}
      onOpenDetail={onOpenDetail}
      showDetailTab={showDetailTab}
      frameGlow={frameGlow}
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
}: {
  language: "ja" | "en";
  badge?: OutcomeBadge;
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
}) {
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
          homeAccent: homeJersey.primary,
          awayAccent: awayJersey.primary,
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
        };
      })()
    : (sample ?? { ...SAMPLE, upsetPoints: 2.4 });

  const resolvedBadge =
    badge ??
    face?.outcomeBadge ??
    "hit";
  const resolvedScoreRel = scoreRel ?? face?.scoreRel ?? "none";

  return (
    <Plan1Card
      sample={resolved}
      badge={resolvedBadge === null ? "miss" : resolvedBadge}
      ja={language === "ja"}
      scorerIcon="check"
      scoreRel={resolvedScoreRel}
      showDetailTab={showDetailTab}
      onOpenDetail={onOpenDetail}
      frameGlow={frameGlow}
      bare={bare}
      tutorialMetricsTargetId={tutorialMetricsTargetId}
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
            {ja ? "採用 · LEGEND バッジ" : "Locked · LEGEND badge"}
          </Text>
          <Text style={styles.sectionBlurb}>
            {ja
              ? "HIT=金 / PERFECT=深い青 / UPSET=濃い赤 / MISS=灰。枠も同系統。"
              : "HIT=gold / PERFECT=deep blue / UPSET=deep red / MISS=slate."}
          </Text>
          <View style={styles.badgeGalleryRow}>
            {BADGE_OPTS.map((k) => (
              <LegendOutcomeBadge key={k} kind={k} />
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

const CARD_W = Math.min(MOBILE_RESULT_CARD_MAX_W, 360);

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
  detailSpine: {
    position: "absolute",
    top: DETAIL_SPINE.top,
    /** カード幅は変えず、タブだけ右に出す */
    right: -(DETAIL_SPINE.width - 1),
    zIndex: 24,
    width: DETAIL_SPINE.width,
    height: DETAIL_SPINE.height,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#070b12",
    borderColor: "rgba(148,163,184,0.35)",
  },
  detailSpinePressed: { opacity: 0.85 },
  detailSpineDisabled: { opacity: 0.45 },
  detailSpineTextCol: {
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  detailSpineChar: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 8,
    fontWeight: "700",
    lineHeight: 9,
    letterSpacing: 0,
    textTransform: "uppercase",
    includeFontPadding: false,
    color: "rgba(226,232,240,0.72)",
    textAlign: "center",
  },
  rectShell: {
    width: "100%",
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: PANEL_BG,
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
    paddingTop: 10,
    paddingBottom: 12,
  },
  layerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: 4,
    marginBottom: 6,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    minHeight: 28,
  },
  topLeftSlot: {
    minWidth: 52,
    maxWidth: 96,
    alignItems: "flex-start",
  },
  roundTitleWrap: {
    flex: 1,
    marginHorizontal: 8,
    alignItems: "center",
    transform: [{ skewX: "-10deg" }],
  },
  roundTitle: {
    textAlign: "center",
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: "rgba(253,230,138,0.85)",
  },
  topBadgeSlot: { maxWidth: 96, alignItems: "flex-end" },

  matchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  matchSide: { width: 92, alignItems: "center", gap: 3 },
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
    paddingTop: 4,
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

  biasRoot: { width: "100%", marginBottom: 4 },
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
  biasSegSlot: { flex: 1, minWidth: 0 },
  biasSegSkew: { transform: [{ skewX: "-16deg" }] },
  biasSegFace: { height: 10, width: "100%", borderWidth: 1 },

  statBlock: { gap: 6, paddingTop: 0 },

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
    marginBottom: 4,
  },
  scorerLabel: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    color: "rgba(148,163,184,0.75)",
    textTransform: "uppercase",
    flexShrink: 0,
    width: 78,
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
    fontSize: 15,
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
    width: 78,
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

  /** A · LEGEND filled — 本番 Kinetik slant tab 準拠 */
  legendOuter: {
    flexShrink: 0,
    overflow: "visible",
    shadowOffset: { width: 0, height: 0 },
  },
  legendTab: {
    position: "relative",
    overflow: "hidden",
    height: LEGEND_TAB_H,
    minHeight: LEGEND_TAB_H,
    maxHeight: LEGEND_TAB_H,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    transform: [{ skewX: LEGEND_SKEW }],
  },
  legendScanLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  legendScanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  legendTabText: {
    position: "relative",
    zIndex: 1,
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.1,
    lineHeight: 10,
    includeFontPadding: false,
    transform: [{ skewX: LEGEND_SKEW_INV }],
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
