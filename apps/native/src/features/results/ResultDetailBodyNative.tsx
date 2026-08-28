/**
 * 本番／DEV 共用 — リザルト詳細ボディ（カード面 + 中央値/最高 + Top10 + 内訳）。
 * `ResultDetailViewModel` をそのまま描画。
 */
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { ResultCardDesignFaceNative } from "./ResultCardDesignPreviewScreenNative";
import { useLiveGameStats } from "../../../../../lib/games/useLiveGameStats";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import { useScreenActiveNative } from "../../hooks/useScreenActiveNative";
import LiveGameStatsPanelNative from "../games/live/LiveGameStatsPanelNative";
import LiveGameStatsPlaceholderNative from "../games/live/LiveGameStatsPlaceholderNative";
import {
  notifyTutorialTargetsChanged,
  registerTutorialTarget,
} from "../tutorial/tutorialMeasureNative";
import ResultDetailScoreDonutNative from "./ResultDetailScoreDonutNative";
import { CyberRankingListRowNative } from "../rankings/CyberRankingListRowNative";
import { MATCH_CARD_SCORE_FONT } from "../games/matchCardTypography";
import { METRIC_FONT } from "../rankings/rankingsUiTheme";
import { CYBER_LIST_CYAN } from "../../../../../lib/rankings/cyberRankVisual";
import { WeeklyReportCardShell } from "../profile/reports/reportCardShellNative";
import { SCORE_BREAKDOWN_COLORS } from "../../../../../lib/result/resultScoreBreakdownColors";
import type {
  ResultDetailBreakdownView,
  ResultDetailMatchStats,
  ResultDetailViewModel,
} from "../../../../../lib/result/buildResultDetailView";
import type { ResultTopScorerMarketView } from "../../../../../lib/result/resultTopScorerMarket";
import type { GamePointsTopEntryV1 } from "../../../../../lib/results/gamePointsTop";
import { profilePathKeyFromRow } from "../../../../../lib/profile/profilePathKey";
import { warmPublicProfileNative } from "../profile/warmPublicProfileNative";

const ACCENT = "#00F5FF";

async function loadGameDocForLiveStats(
  gameId: string
): Promise<Record<string, unknown> | null> {
  const snap = await getDoc(doc(db, "games", gameId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

const TOP_SCORER_SLICE_COLORS = [
  "#00F5FF",
  "#FFD65A",
  "#FF2BD6",
  "#B8FF3C",
  "#FB923C",
  "rgba(148,163,184,0.55)",
] as const;

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(255,255,255,${alpha})`;
  const n = parseInt(raw, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function fmtPt(v: number) {
  return v.toFixed(1);
}

function SectionHeader({ title, accent }: { title: string; accent: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: hexToRgba(accent, 0.75) }]}>
        {title}
      </Text>
      <View
        style={[
          styles.sectionTitleLine,
          { backgroundColor: hexToRgba(accent, 0.35) },
        ]}
      />
    </View>
  );
}

function MatchStatsPanel({
  ja,
  frameColor,
  stats,
  topScorerMarket,
}: {
  ja: boolean;
  frameColor: string;
  stats: ResultDetailMatchStats;
  topScorerMarket?: ResultTopScorerMarketView | null;
}) {
  const median = stats.median ?? 0;
  const postCount = stats.postCount;
  const market = topScorerMarket ?? null;
  const slices = market?.slices ?? [];
  const donutSegments = slices.map((s, i) => ({
    value: Math.max(0, s.pct),
    color: TOP_SCORER_SLICE_COLORS[i % TOP_SCORER_SLICE_COLORS.length],
  }));
  const hitRate =
    market?.hitRatePct != null && Number.isFinite(market.hitRatePct)
      ? market.hitRatePct
      : null;
  const myPick = market?.myPick ?? null;
  const myPickSlice =
    myPick != null
      ? slices.find(
          (s) =>
            s.playerId === myPick.playerId && s.teamId === myPick.teamId
        )
      : null;

  return (
    <View style={styles.sectionBlock}>
      <SectionHeader title={ja ? "この試合" : "THIS MATCH"} accent={ACCENT} />
      <WeeklyReportCardShell
        hideGrid
        style={[styles.sectionCard, { borderColor: frameColor }]}
      >
        <View style={styles.matchStatsRow}>
          <View style={styles.matchStatCell}>
            <Text style={styles.matchStatLabel}>
              {ja ? "投稿数" : "POSTS"}
            </Text>
            <Text style={styles.matchStatValue}>{postCount}</Text>
            <Text style={styles.matchStatSub}>
              {ja ? "この試合" : "This match"}
            </Text>
          </View>
          <View
            style={[
              styles.matchStatRule,
              { backgroundColor: hexToRgba(ACCENT, 0.22) },
            ]}
          />
          <View style={styles.matchStatCell}>
            <Text style={styles.matchStatLabel}>
              {ja ? "中央値" : "MEDIAN"}
            </Text>
            <Text style={[styles.matchStatValue, styles.matchStatValueMax]}>
              {fmtPt(median)}
            </Text>
            <Text style={styles.matchStatSub}>
              {ja ? "全投稿の中央" : "All posts"}
            </Text>
          </View>
        </View>

        {market && slices.length > 0 ? (
          <>
            <View
              style={[
                styles.topScorerRule,
                { backgroundColor: hexToRgba(ACCENT, 0.18) },
              ]}
            />
            <Text style={styles.topScorerSectionLabel}>TOP SCORER</Text>
            <View style={styles.topScorerRow}>
              <ResultDetailScoreDonutNative
                segments={donutSegments}
                total={hitRate ?? slices[0]?.pct ?? 0}
                totalLabel={ja ? "的中率%" : "HIT %"}
                size={108}
                thickness={14}
              />
              <View style={styles.topScorerLegend}>
                {slices.map((slice, i) => {
                  const color =
                    TOP_SCORER_SLICE_COLORS[i % TOP_SCORER_SLICE_COLORS.length];
                  const showPoints =
                    slice.points != null && Number.isFinite(slice.points);
                  return (
                    <View
                      key={`${slice.playerId}-${slice.teamId}`}
                      style={styles.topScorerLegendRow}
                    >
                      <View
                        style={[
                          styles.topScorerSwatch,
                          { backgroundColor: color },
                        ]}
                      />
                      <View style={styles.topScorerLegendCopy}>
                        <View style={styles.topScorerNameRow}>
                          <Text style={styles.topScorerName} numberOfLines={1}>
                            {slice.name}
                          </Text>
                          {slice.isActual ? (
                            <MaterialCommunityIcons
                              name="check"
                              size={13}
                              color="#FBBF24"
                            />
                          ) : null}
                        </View>
                        {showPoints ? (
                          <Text style={styles.topScorerPoints}>
                            {slice.points} PT
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.topScorerPct}>
                        {slice.pct.toFixed(1)}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View
              style={[
                styles.myPickBox,
                myPick?.hit === true
                  ? styles.myPickBoxHit
                  : myPick?.hit === false
                    ? styles.myPickBoxMiss
                    : styles.myPickBoxNeutral,
              ]}
            >
              <View style={styles.myPickCopy}>
                <Text style={styles.myPickLabel}>
                  {ja ? "あなたの選択" : "YOUR PICK"}
                </Text>
                <Text style={styles.myPickName} numberOfLines={1}>
                  {myPick?.name ?? (ja ? "未選択" : "NO PICK")}
                </Text>
                {myPickSlice?.points != null &&
                Number.isFinite(myPickSlice.points) ? (
                  <Text style={styles.myPickPoints}>
                    {myPickSlice.points} PT
                  </Text>
                ) : null}
              </View>
              {myPick?.hit != null ? (
                <View style={styles.myPickHitCluster}>
                  <MaterialCommunityIcons
                    name={myPick.hit ? "check" : "close"}
                    size={14}
                    color={myPick.hit ? "#FBBF24" : "rgba(148,163,184,0.75)"}
                  />
                  <Text
                    style={[
                      styles.myPickHitText,
                      myPick.hit ? styles.myPickHitOn : styles.myPickHitOff,
                    ]}
                  >
                    {myPick.hit ? "HIT" : "MISS"}
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </WeeklyReportCardShell>
    </View>
  );
}

function Top10Panel({
  ja,
  entries,
  onOpenProfile,
}: {
  ja: boolean;
  frameColor: string;
  entries: GamePointsTopEntryV1[];
  onOpenProfile?: (handle: string) => void;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  if (entries.length === 0) return null;
  return (
    <View style={styles.sectionBlock}>
      <SectionHeader title={ja ? "得点上位" : "TOP SCORES"} accent={ACCENT} />
      <View>
        {entries.map((row) => {
          const profileKey = profilePathKeyFromRow({
            uid: row.uid,
            handle: row.handle === "—" ? "" : row.handle,
          });
          return (
            <CyberRankingListRowNative
              key={`${row.rank}-${row.postId}`}
              rank={row.rank}
              displayName={row.displayName}
              photoURL={row.photoURL}
              metric="totalScore"
              counted={row.points}
              countryCode={row.countryCode}
              language={ja ? "ja" : "en"}
              isPro={row.isPro}
              hideListMeta
              animateCrown={row.rank === 1}
              reduceMotion={reduceMotion}
              onPress={
                onOpenProfile && profileKey
                  ? () => {
                      warmPublicProfileNative({
                        routeKey: profileKey,
                        uid: row.uid,
                        handle: row.handle === "—" ? "" : row.handle,
                        displayName: row.displayName,
                        photoURL: row.photoURL,
                        plan: row.isPro ? "pro" : "free",
                        countryCode: row.countryCode,
                        skipStatsPrime: true,
                      });
                      onOpenProfile(profileKey);
                    }
                  : undefined
              }
            />
          );
        })}
      </View>
    </View>
  );
}

function ScoreBreakdownPanel({
  ja,
  frameColor,
  breakdown,
}: {
  ja: boolean;
  frameColor: string;
  breakdown: ResultDetailBreakdownView;
}) {
  const b = breakdown;
  const segments = [
    { value: b.basePoints, color: SCORE_BREAKDOWN_COLORS.base },
    ...(b.streakBonus > 1e-6
      ? [{ value: b.streakBonus, color: SCORE_BREAKDOWN_COLORS.streak }]
      : []),
    ...(b.upsetBonus > 1e-6
      ? [{ value: b.upsetBonus, color: SCORE_BREAKDOWN_COLORS.upset }]
      : []),
    ...(b.goalScorerBonus > 1e-6
      ? [{ value: b.goalScorerBonus, color: SCORE_BREAKDOWN_COLORS.scorer }]
      : []),
  ];

  type Row = {
    key: string;
    label: string;
    value: number;
    color: string;
    hit?: boolean;
    sub?: string;
  };

  const rows: Row[] = [
    {
      key: "base",
      label: ja ? "基本点" : "Base",
      value: b.basePoints,
      color: SCORE_BREAKDOWN_COLORS.base,
      sub: ja ? "勝者＋スコア精度" : "Winner + score precision",
    },
    ...(b.streakBonus > 1e-6
      ? [
          {
            key: "streak",
            label: ja ? "連勝ボーナス" : "Win streak",
            value: b.streakBonus,
            color: SCORE_BREAKDOWN_COLORS.streak,
          },
        ]
      : []),
    ...(b.upsetBonus > 1e-6
      ? [
          {
            key: "upset",
            label: ja ? "Upsetボーナス" : "Upset bonus",
            value: b.upsetBonus,
            color: SCORE_BREAKDOWN_COLORS.upset,
          },
        ]
      : []),
    ...(b.goalScorerBonus > 1e-6
      ? [
          {
            key: "scorer",
            label: "TOP SCORER",
            value: b.goalScorerBonus,
            color: SCORE_BREAKDOWN_COLORS.scorer,
            hit: b.topScorerHit === true,
            sub: b.topScorerName ?? undefined,
          },
        ]
      : []),
  ];

  return (
    <View style={styles.sectionBlock}>
      <SectionHeader
        title={ja ? "得点の内訳" : "POINTS BREAKDOWN"}
        accent={ACCENT}
      />
      <WeeklyReportCardShell
        hideGrid
        style={[styles.sectionCard, { borderColor: frameColor }]}
      >
        <View style={styles.breakdownRow}>
          <ResultDetailScoreDonutNative
            segments={segments}
            total={b.totalPoints}
            totalLabel={ja ? "スコア" : "SCORE"}
          />
          <View style={styles.breakdownList}>
            {rows.map((row) => (
              <View key={row.key} style={styles.breakdownItem}>
                <View
                  style={[
                    styles.breakdownSwatch,
                    { backgroundColor: row.color },
                  ]}
                />
                <View style={styles.breakdownCopy}>
                  <View style={styles.breakdownLabelRow}>
                    <Text style={styles.breakdownLabel}>{row.label}</Text>
                    {row.hit != null ? (
                      <View
                        style={[
                          styles.hitPill,
                          row.hit ? styles.hitPillOn : styles.hitPillOff,
                        ]}
                      >
                        {row.hit ? (
                          <MaterialCommunityIcons
                            name="check-bold"
                            size={10}
                            color="#422006"
                          />
                        ) : null}
                        <Text
                          style={[
                            styles.hitPillText,
                            row.hit
                              ? styles.hitPillTextOn
                              : styles.hitPillTextOff,
                          ]}
                        >
                          {row.hit ? "HIT" : "MISS"}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {row.sub ? (
                    <Text style={styles.breakdownSub} numberOfLines={1}>
                      {row.sub}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.breakdownValue}>+{fmtPt(row.value)}</Text>
              </View>
            ))}
            <View
              style={[
                styles.breakdownTotalRule,
                { backgroundColor: hexToRgba(ACCENT, 0.22) },
              ]}
            />
            <View style={styles.breakdownItem}>
              <View
                style={[styles.breakdownSwatch, styles.breakdownSwatchTotal]}
              />
              <Text style={[styles.breakdownLabel, styles.breakdownLabelTotal]}>
                {ja ? "スコア" : "SCORE"}
              </Text>
              <Text style={styles.breakdownTotalValue}>
                {fmtPt(b.totalPoints)}
              </Text>
            </View>
          </View>
        </View>
      </WeeklyReportCardShell>
    </View>
  );
}

export type ResultDetailBodySections = "full" | "cardAndLiveStats";

type Props = {
  language: "ja" | "en";
  view: ResultDetailViewModel;
  onOpenProfile?: (handle: string) => void;
  /** ScrollView の contentContainerStyle に足す余白 */
  contentPaddingBottom?: number;
  /**
   * `cardAndLiveStats` = 試合カードから開いたとき。
   * リザルトカードの下にライブスタッツのみ（この試合 / 得点上位 / 内訳は出さない）。
   */
  sections?: ResultDetailBodySections;
};

/** Web 新リザルト詳細 / Native DEV プレビューと同じ構成 */
export default function ResultDetailBodyNative({
  language,
  view,
  onOpenProfile,
  contentPaddingBottom = 24,
  sections = "full",
}: Props) {
  const ja = language === "ja";
  const frameColor = hexToRgba(ACCENT, 0.4);
  const dividerColor = hexToRgba(ACCENT, 0.22);
  const matchStats = view.matchStats;
  const cardBadge = view.card.outcomeBadge ?? "hit";
  const scoreRel = view.card.scoreRel;
  const cardAndLiveStats = sections === "cardAndLiveStats";
  const nbaGameId =
    String(view.card.league ?? "").toLowerCase() === "nba"
      ? view.card.gameId || null
      : null;
  const screenActive = useScreenActiveNative();
  const { report: liveStatsReport, loading: liveStatsLoading } = useLiveGameStats(
    nbaGameId,
    Boolean(nbaGameId) && cardAndLiveStats,
    {
      apiBaseUrl: getUniterzApiBaseUrl(),
      loadGameDoc: loadGameDocForLiveStats,
      paused: !screenActive,
    }
  );
  const cardTargetRef = useRef<View>(null);

  useEffect(() => {
    return registerTutorialTarget("result-detail-card", () =>
      new Promise((resolve) => {
        const node = cardTargetRef.current;
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
  }, []);

  useEffect(() => {
    notifyTutorialTargetsChanged();
  }, [view]);

  return (
    <View style={[styles.list, { paddingBottom: contentPaddingBottom }]}>
      <View ref={cardTargetRef} collapsable={false}>
        <WeeklyReportCardShell
          hideGrid
          style={[styles.heroCard, { borderColor: ACCENT }]}
        >
          <ResultCardDesignFaceNative
            language={language}
            bare
            badge={cardBadge}
            scoreRel={scoreRel}
            face={view.card}
            tutorialMetricsTargetId="result-detail-metrics"
          />
        </WeeklyReportCardShell>
      </View>

      {cardAndLiveStats ? (
        <>
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />
          {liveStatsReport ? (
            <LiveGameStatsPanelNative
              report={liveStatsReport}
              language={ja ? "ja" : "en"}
              omitScoreHeader
            />
          ) : (
            <LiveGameStatsPlaceholderNative
              language={ja ? "ja" : "en"}
              loading={liveStatsLoading}
            />
          )}
        </>
      ) : (
        <>
          {matchStats ? (
            <>
              <View style={[styles.divider, { backgroundColor: dividerColor }]} />
              <MatchStatsPanel
                ja={ja}
                frameColor={frameColor}
                stats={matchStats}
                topScorerMarket={view.topScorerMarket}
              />
            </>
          ) : null}

          {view.topEntries.length > 0 ? (
            <>
              <View style={[styles.divider, { backgroundColor: dividerColor }]} />
              <Top10Panel
                ja={ja}
                frameColor={frameColor}
                entries={view.topEntries}
                onOpenProfile={onOpenProfile}
              />
            </>
          ) : null}

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />
          <ScoreBreakdownPanel
            ja={ja}
            frameColor={frameColor}
            breakdown={view.breakdown}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 0,
    paddingTop: 4,
  },
  heroCard: {
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: "visible",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  sectionTitleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  sectionCard: {
    borderWidth: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  matchStatsRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  matchStatCell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  matchStatRule: {
    width: 1,
    marginVertical: 2,
  },
  matchStatLabel: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(148,163,184,0.88)",
  },
  matchStatValue: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 28,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#F8FAFC",
  },
  matchStatValueMax: {
    color: CYBER_LIST_CYAN,
  },
  matchStatSub: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    letterSpacing: 0.6,
    color: "rgba(148,163,184,0.7)",
  },
  topScorerRule: {
    height: StyleSheet.hairlineWidth,
    marginTop: 14,
    marginBottom: 12,
  },
  topScorerSectionLabel: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: hexToRgba(ACCENT, 0.72),
    marginBottom: 10,
  },
  topScorerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  topScorerLegend: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  topScorerLegendRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  topScorerSwatch: {
    width: 8,
    height: 8,
    borderRadius: 1,
    marginTop: 4,
  },
  topScorerLegendCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  topScorerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },
  topScorerName: {
    flexShrink: 1,
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(226,232,240,0.88)",
  },
  topScorerPoints: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 13,
    fontWeight: "800",
    fontStyle: "italic",
    letterSpacing: 0.4,
    color: "rgba(226,232,240,0.82)",
  },
  topScorerPct: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 13,
    fontWeight: "900",
    fontStyle: "italic",
    color: "rgba(226,232,240,0.9)",
    marginTop: 2,
  },
  myPickBox: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  myPickBoxHit: {
    borderColor: "rgba(184,255,60,0.45)",
    backgroundColor: "rgba(184,255,60,0.08)",
  },
  myPickBoxMiss: {
    borderColor: "rgba(148,163,184,0.35)",
    backgroundColor: "rgba(15,23,42,0.55)",
  },
  myPickBoxNeutral: {
    borderColor: "rgba(0,245,255,0.28)",
    backgroundColor: "rgba(0,245,255,0.06)",
  },
  myPickCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  myPickLabel: {
    fontFamily: METRIC_FONT,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(148,163,184,0.75)",
  },
  myPickName: {
    fontFamily: METRIC_FONT,
    fontSize: 13,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  myPickPoints: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 14,
    fontWeight: "800",
    fontStyle: "italic",
    color: "rgba(226,232,240,0.78)",
  },
  myPickHitCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
  },
  myPickHitText: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    lineHeight: 14,
  },
  myPickHitOn: {
    color: "#FBBF24",
  },
  myPickHitOff: {
    color: "rgba(148,163,184,0.75)",
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  breakdownList: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  breakdownSwatch: {
    width: 8,
    height: 8,
    borderRadius: 1,
  },
  breakdownSwatchTotal: {
    backgroundColor: "transparent",
  },
  breakdownCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  breakdownLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  breakdownLabel: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "rgba(226,232,240,0.9)",
  },
  breakdownLabelTotal: {
    flex: 1,
  },
  breakdownSub: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    color: "rgba(148,163,184,0.75)",
  },
  breakdownValue: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 14,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#F8FAFC",
  },
  breakdownTotalRule: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },
  breakdownTotalValue: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 18,
    fontWeight: "900",
    fontStyle: "italic",
    color: CYBER_LIST_CYAN,
  },
  hitPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
  },
  hitPillOn: {
    borderColor: "rgba(251,191,36,0.55)",
    backgroundColor: "rgba(251,191,36,0.92)",
  },
  hitPillOff: {
    borderColor: "rgba(148,163,184,0.35)",
    backgroundColor: "rgba(15,23,42,0.55)",
  },
  hitPillText: {
    fontFamily: METRIC_FONT,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  hitPillTextOn: {
    color: "#422006",
  },
  hitPillTextOff: {
    color: "rgba(148,163,184,0.85)",
  },
});
