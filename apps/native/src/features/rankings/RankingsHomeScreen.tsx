import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  METRICS,
  type MobileMetric,
} from "../../../../../app/component/rankings/_data/mockRows";
import type { RankingRowWithCountry } from "../../../../../app/component/rankings/_data/mockRows";
import {
  API_METRIC_BY_MOBILE,
  type RankingApiRow,
  toMobileRows,
} from "../../../../../lib/rankings/rankingTransform";
import type { RankingRow } from "../../../../../lib/rankings/useRanking";
import type { PlayoffRoundKey } from "../../../../../lib/rankings/playoffRound";
import type { Language } from "../../../../../lib/i18n/language";
import { getRankingsScheduleNoticeText } from "../../../../../lib/rankings/getRankingsScheduleNoticeText";
import RankingsCyberBackgroundNative from "./RankingsCyberBackgroundNative";
import UniterzBrandShelfNative from "../UniterzBrandShelfNative";
import CyberMenuButton from "../../ui/CyberMenuButton";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import { useNativeCumulativeRankingsBulk } from "./useNativeCumulativeRankingsBulk";
import { useNativeMyRankingUser } from "./useNativeMyRankingUser";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import {
  MyRankCardNative,
  PlayoffRoundTabsNative,
  RankingListCardNative,
  RankingsCategoryTabsNative,
  RankingsMetricRowNative,
  RankingsTopPodiumNative,
} from "./RankingsUiParts";

type Props = {
  bottomReserveY: number;
};

const VISIBLE_METRICS: MobileMetric[] = [
  "totalScore",
  "winRate",
  "marginPrecision",
  "upsetScore",
  "streak",
];

function scheduleNoticeForUser(
  language: RankingsLanguage,
  countryCode: string | null,
): string {
  const lang = (language === "en" ? "en" : "ja") as Language;
  return getRankingsScheduleNoticeText(lang, countryCode);
}

export default function RankingsHomeScreen({ bottomReserveY }: Props) {
  const [category, setCategory] = useState<"playoffs" | "bracket">("playoffs");
  const [round, setRound] = useState<PlayoffRoundKey>("overall");
  const [metric, setMetric] = useState<MobileMetric>("totalScore");
  const [scheduleNoticeOpen, setScheduleNoticeOpen] = useState(false);

  const { listReady, personalPending, myUid, byMetric, ensureMetric } =
    useNativeCumulativeRankingsBulk("playoffs", round, null);
  const { user } = useNativeMyRankingUser(myUid);
  const language = user.language;
  const t = rankingsTexts(language);

  const apiKey = API_METRIC_BY_MOBILE[metric];
  const bundle = byMetric?.[apiKey];

  useEffect(() => {
    void ensureMetric(apiKey);
  }, [apiKey, ensureMetric]);

  const rawRows = useMemo(
    () => (Array.isArray(bundle?.rows) ? (bundle.rows as RankingApiRow[]) : []),
    [bundle?.rows]
  );

  const rows: RankingRowWithCountry[] = useMemo(() => {
    if (rawRows.length === 0) return [];
    return toMobileRows(metric, rawRows);
  }, [metric, rawRows]);

  const myRank = bundle?.myRank ?? null;
  const myRankDeltaPlaces = bundle?.myRankDeltaPlaces ?? null;
  const myRawRow = (bundle?.myRow ?? null) as RankingRow | null;
  const rankingListCount =
    typeof bundle?.count === "number" && Number.isFinite(bundle.count) ? bundle.count : 0;

  const myValue = useMemo(() => {
    if (!myRawRow) return 0;
    if (metric === "totalScore") return myRawRow.totalPoints ?? 0;
    if (metric === "marginPrecision") return myRawRow.totalPrecision ?? 0;
    if (metric === "exactHits")
      return myRawRow.totalExactHits ?? myRawRow.totalPrecision ?? 0;
    if (metric === "upsetScore") return myRawRow.totalUpset ?? 0;
    if (metric === "winRate") {
      const raw = myRawRow.winRate ?? 0;
      return raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
    }
    return myRawRow.activeWinStreak ?? 0;
  }, [metric, myRawRow]);

  const winRateMinPosts = round === "overall" || round === "r1" ? 20 : 1;
  const rankingHasNoEntries =
    listReady && (rows.length === 0 || rankingListCount === 0);

  const metricItems = useMemo(
    () => METRICS.filter((m) => VISIBLE_METRICS.includes(m.key)).map((m) => m.key),
    [],
  );

  const top3 = rows.slice(0, 3);
  const restRows = rows.slice(3);

  return (
    <View style={styles.root}>
      <View style={styles.bgLayer} collapsable={false}>
        <RankingsCyberBackgroundNative />
      </View>
      <ScrollView
        style={styles.scrollLayer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomReserveY + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <UniterzBrandShelfNative horizontalBleed={12} />
        <View style={styles.titleRow}>
          <CyberMenuButton
            size="sm"
            accessibilityLabel={language === "ja" ? "メニュー" : "Menu"}
            onPress={() =>
              Alert.alert(
                "",
                language === "ja" ? "メニューは準備中です。" : "Menu is not available yet.",
              )
            }
          />
          <Text style={styles.headerTitle} maxFontSizeMultiplier={1.2}>
            {t.title}
          </Text>
          <Pressable
            style={styles.infoBtn}
            accessibilityRole="button"
            accessibilityLabel={t.scheduleInfoToggle}
            accessibilityState={{ expanded: scheduleNoticeOpen }}
            onPress={() => setScheduleNoticeOpen((open) => !open)}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color="rgba(255,255,255,0.7)"
            />
          </Pressable>
        </View>
        {scheduleNoticeOpen ? (
          <View style={styles.noticeGlass}>
            <Text style={styles.notice} maxFontSizeMultiplier={1.15}>
              {scheduleNoticeForUser(language, user.countryCode)}
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <RankingsCategoryTabsNative
            category={category}
            onChange={setCategory}
            language={language}
          />
          {category === "playoffs" ? (
            <PlayoffRoundTabsNative round={round} onChange={setRound} language={language} />
          ) : null}
        </View>

        {category === "bracket" ? (
          <View style={styles.bracketPlaceholder}>
            <Text style={styles.bracketPlaceholderText}>{t.bracketSoon}</Text>
          </View>
        ) : null}

        {category === "playoffs" ? (
          <>
            <MyRankCardNative
              rank={rankingHasNoEntries ? null : myRank}
              metric={metric}
              value={myValue}
              displayName={user.displayName?.trim() ?? ""}
              photoURL={user.photoURL || null}
              totalPosts={
                typeof myRawRow?.totalPosts === "number" ? myRawRow.totalPosts : undefined
              }
              loading={!listReady}
              statsScramble={listReady && personalPending}
              isPro={user.plan === "pro"}
              rankDeltaPlaces={rankingHasNoEntries ? null : myRankDeltaPlaces}
              language={language}
            />

            <RankingsMetricRowNative
              metrics={metricItems}
              metric={metric}
              onChange={setMetric}
              language={language}
            />

            {metric === "winRate" ? (
              <Text style={styles.winRateHint}>
                {winRateMinPosts > 1 ? t.winRateMin(winRateMinPosts) : t.winRateNoMin}
              </Text>
            ) : null}

            {!listReady ? (
              <View style={styles.loadingWrap}>
                <BlocksPulseLoader pixelScale={0.85} label="loading" />
              </View>
            ) : rankingHasNoEntries ? (
              <View style={styles.noDataWrap}>
                <Text style={styles.noData}>{t.noData}</Text>
              </View>
            ) : (
              <View style={styles.listSection}>
                <RankingsTopPodiumNative rows={top3} metric={metric} language={language} />
                <View style={styles.restList}>
                  {restRows.map((row, index) => (
                    <RankingListCardNative
                      key={`${metric}-${row.uid}`}
                      row={row}
                      rank={index + 4}
                      metric={metric}
                      language={language}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020409",
  },
  /** 3D を背面に固定し、前面 ScrollView は透明にしてロゴが透けて見えるようにする */
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  scrollLayer: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
    ...Platform.select({
      android: { elevation: 0 },
      default: {},
    }),
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "rgba(248,250,252,0.9)",
    fontSize: 14,
    letterSpacing: 4.2,
    fontFamily: Platform.select({
      ios: "BebasNeue_400Regular",
      android: "BebasNeue_400Regular",
      default: "BebasNeue_400Regular",
    }),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  infoBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeGlass: {
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "hidden",
  },
  notice: {
    textAlign: "center",
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    lineHeight: 16,
  },
  section: {
    gap: 4,
    marginBottom: 8,
  },
  bracketPlaceholder: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  bracketPlaceholderText: {
    color: "rgba(148,163,184,0.85)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  winRateHint: {
    marginTop: 6,
    marginBottom: 4,
    paddingHorizontal: 4,
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    lineHeight: 16,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  noDataWrap: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  noData: {
    color: "rgba(248,250,252,0.35)",
    fontSize: 28,
    letterSpacing: 4,
    fontFamily: Platform.select({
      ios: "BebasNeue_400Regular",
      android: "BebasNeue_400Regular",
      default: "BebasNeue_400Regular",
    }),
  },
  listSection: {
    marginTop: 8,
    gap: 10,
  },
  restList: {
    gap: 8,
    paddingTop: 4,
  },
});
