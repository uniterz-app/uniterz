/** Web `UniterzDailyScoreLeadersPanel` 相当 — その日の合計ポイント Top50（PICK UP / PRO LEAGUE） */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppState,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  CYBER_TAB_CYAN,
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import { RankingsProLeagueTeaserNative } from "../../rankings/RankingsProLeagueTeaserNative";
import RankingCommentEditorNative from "../../rankings/RankingCommentEditorNative";
import RankingRowCommentNative from "../../rankings/RankingRowCommentNative";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import RankingsListEntranceRowNative from "../../rankings/RankingsListEntranceRowNative";
import DailyScoreRankRowNative, {
  dailyScoreRankRowSubStyles,
} from "../../rankings/DailyScoreRankRowNative";
import { rankingRowProSkinVariant } from "../../../../../../lib/rankings/rankingRowProSkinVariant";
import { auth } from "../../../lib/firebase";
import { openProSubscribeNative } from "../../../navigation/navigationRef";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import type {
  DailyScoreDivision,
  DailyScoreLeaderRow,
  DailyScoreLeadersResponse,
  DailyScoreMeResponse,
} from "../../../../../../lib/rankings/dailyScoreLeaders/buildDailyScoreLeaders";
import {
  dailyScoreLeadersCopy,
  formatDailyScorePoints,
  formatDailyScoreSlateLabel,
} from "../../../../../../lib/rankings/dailyScoreLeaders/dailyScoreLeadersCopy";
import { dailyLeadersCopy } from "../../../../../../lib/nba/dailyLeaders/dailyLeadersCopy";
import {
  LeagueStatsCollapsedSummaryNative,
  LeagueStatsCollapsibleNative,
  useLeagueStatsCollapse,
} from "./LeagueStatsCollapseNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import {
  RANKING_LIST_ENTRANCE_DURATION_MS,
  RANKING_LIST_ENTRANCE_MAX_STAGGER_INDEX,
  RANKING_LIST_ENTRANCE_STAGGER_MS,
} from "../../rankings/rankingsMotion";

function leaderRowKey(r: DailyScoreLeaderRow): string {
  return r.uid;
}

function RowGap() {
  return <View style={styles.rowGap} />;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "failed" }
  | { kind: "locked" }
  | { kind: "ok"; data: DailyScoreLeadersResponse };

type Props = {
  language: string;
  /** 畳んだときのサマリー先頭（上段タブ名） */
  summaryPrefix?: string;
  onSelectUser?: (row: DailyScoreLeaderRow) => void;
};

export default function UniterzDailyScoreLeadersPanelNative({
  language,
  summaryPrefix,
  onSelectUser,
}: Props) {
  const { onTableScroll, expand } = useLeagueStatsCollapse();
  const lang = resolveLocalizedLang(language);
  const copy = useMemo(() => dailyScoreLeadersCopy(lang), [lang]);
  const baseCopy = useMemo(() => dailyLeadersCopy(lang), [lang]);
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const [division, setDivision] = useState<DailyScoreDivision>("standard");
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const myUid = auth.currentUser?.uid ?? null;
  /** 保存直後の自分のひとこと（API キャッシュ更新前の即時反映） */
  const [myComment, setMyComment] = useState<string | null>(null);
  /** 自分の順位（一覧は上位 50 だけなので別 API。ログインしていなければ出さない） */
  const [mine, setMine] = useState<DailyScoreMeResponse | null>(null);

  const loadMine = useCallback(async (token: string | null) => {
    if (!token) {
      setMine(null);
      return;
    }
    try {
      const res = await fetch(
        `${getUniterzApiBaseUrl()}/api/uniterz/daily-leaders/me?division=${division}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = (await res.json()) as DailyScoreMeResponse | { ok: false };
      setMine(res.ok && json.ok ? json : null);
    } catch {
      setMine((prev) => (prev?.division === division ? prev : null));
    }
  }, [division]);

  const load = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      const token = (await auth.currentUser?.getIdToken().catch(() => null)) ?? null;
      if (division === "open") {
        if (!token) {
          setState({ kind: "locked" });
          return;
        }
        headers.Authorization = `Bearer ${token}`;
      }
      void loadMine(token);
      const res = await fetch(
        `${getUniterzApiBaseUrl()}/api/uniterz/daily-leaders?division=${division}`,
        { headers }
      );
      if (res.status === 403) {
        setState({ kind: "locked" });
        return;
      }
      const json = (await res.json()) as DailyScoreLeadersResponse | { ok: false };
      if (!res.ok || !json.ok) throw new Error("failed");
      setState({ kind: "ok", data: json });
    } catch {
      setState((prev) => (prev.kind === "ok" ? prev : { kind: "failed" }));
    }
  }, [division, loadMine]);

  useEffect(() => {
    setState({ kind: "loading" });
    setMine(null);
    void load();
  }, [load]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") void load();
    });
    return () => sub.remove();
  }, [load]);

  const data = state.kind === "ok" ? state.data : null;
  const rows = data?.rows ?? [];
  /** 一覧と別の試合日を返した（切り替わりの瞬間）ときは出さない */
  const myRank = mine && data && mine.dateKey === data.dateKey && mine.division === division ? mine : null;

  let empty: string | null = null;
  if (state.kind === "failed") empty = baseCopy.loadFailed;
  else if (data) {
    if (data.gameCount === 0) empty = baseCopy.noGames;
    else if (data.finalCount === 0) empty = copy.noFinals;
    else if (rows.length === 0) empty = copy.noEntries;
  }

  const renderRow = useCallback(
    ({ item: r, index: i }: { item: DailyScoreLeaderRow; index: number }) => (
      <RankingsListEntranceRowNative
        index={i}
        entranceKey={division}
        staggerMs={RANKING_LIST_ENTRANCE_STAGGER_MS}
        durationMs={RANKING_LIST_ENTRANCE_DURATION_MS}
        maxStaggerIndex={RANKING_LIST_ENTRANCE_MAX_STAGGER_INDEX}
      >
        <DailyScoreRankRowNative
          rank={r.rank}
          name={r.displayName || r.handle || "—"}
          photoURL={r.photoURL}
          isPro={r.plan === "pro"}
          planProBgVariant={rankingRowProSkinVariant(
            r.plan,
            typeof r.planProBgVariant === "string" ? r.planProBgVariant : null
          )}
          countryCode={r.countryCode}
          sub={
            <>
              <Text style={dailyScoreRankRowSubStyles.muted}>
                {copy.postsLabel(r.posts)}
              </Text>
              {typeof r.wins === "number" ? (
                <Text style={dailyScoreRankRowSubStyles.hits}>
                  {copy.hitsLabel(r.wins, r.posts)}
                </Text>
              ) : null}
            </>
          }
          value={formatDailyScorePoints(r.points)}
          valueUnit={copy.pointsUnit}
          onPress={() => onSelectUser?.(r)}
        />
        <RankingRowCommentNative
          align="daily"
          comment={
            r.uid === myUid && myComment != null ? myComment : r.rankingComment
          }
        />
      </RankingsListEntranceRowNative>
    ),
    [copy, division, myComment, myUid, onSelectUser]
  );

  const summaryText = [
    summaryPrefix,
    division === "open" ? copy.proLeague : copy.pickUp,
    data && data.gameCount > 0 ? formatDailyScoreSlateLabel(data.dateKey) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.root}>
      <LeagueStatsCollapsibleNative>
        <View style={styles.tabs}>
          <CyberSlantedTabBarNative fill>
            <CyberSlantedTabNative
              label={copy.pickUp}
              active={division === "standard"}
              onPress={() => setDivision("standard")}
              compact
            />
            <CyberSlantedTabNative
              label={copy.proLeague}
              active={division === "open"}
              onPress={() => setDivision("open")}
              compact
            />
          </CyberSlantedTabBarNative>
        </View>

        {data && data.gameCount > 0 ? (
          <View style={styles.meta}>
            <Text style={styles.metaText}>
              {formatDailyScoreSlateLabel(data.dateKey)} ·{" "}
              {copy.finalsLabel(data.finalCount, data.gameCount)}
            </Text>
            {data.preseason ? (
              <View style={styles.preseasonBadge}>
                <Text style={styles.preseasonText}>{baseCopy.preseason}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {state.kind !== "locked" ? (
          <View style={styles.commentEditor}>
            <RankingCommentEditorNative language={lang} onSaved={setMyComment} />
          </View>
        ) : null}
      </LeagueStatsCollapsibleNative>
      <LeagueStatsCollapsedSummaryNative text={summaryText} />

      {state.kind === "locked" ? (
        <ScrollView
          contentContainerStyle={[
            styles.lock,
            { paddingBottom: bottomContentReserveY + 12 },
          ]}
        >
          <RankingsProLeagueTeaserNative
            language={lang}
            onPressSubscribe={() => openProSubscribeNative("pro_league")}
            onBackToPickUp={() => {
              setDivision("standard");
              expand();
            }}
          />
        </ScrollView>
      ) : (
        <>
          {myRank && data && data.finalCount > 0 ? (
            <View style={styles.mine}>
              <Text style={styles.mineLabel}>{copy.myLabel}</Text>
              {myRank.me ? (
                <>
                  <View style={styles.mineRankCol}>
                    <Text style={styles.mineRank}>
                      {myRank.me.rank.toLocaleString()}
                      <Text style={styles.mineRankSuffix}>{copy.myRankSuffix}</Text>
                    </Text>
                    <Text style={styles.mineOf}>{copy.myRankOf(myRank.total)}</Text>
                  </View>
                  <View style={styles.mineSub}>
                    <Text style={dailyScoreRankRowSubStyles.muted}>{copy.postsLabel(myRank.me.posts)}</Text>
                    <Text style={dailyScoreRankRowSubStyles.hits}>{copy.hitsLabel(myRank.me.wins, myRank.me.posts)}</Text>
                  </View>
                  <View style={styles.mineValueCol}>
                    <Text style={styles.mineValue}>{formatDailyScorePoints(myRank.me.points)}</Text>
                    <Text style={styles.mineValueUnit}>{copy.pointsUnit}</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.mineEmpty}>{copy.myNoScore}</Text>
              )}
            </View>
          ) : null}
          {empty ? (
            <Text style={styles.empty}>{empty}</Text>
          ) : !data ? null : (
        <FlatList
          data={rows}
          keyExtractor={leaderRowKey}
          renderItem={renderRow}
          ItemSeparatorComponent={RowGap}
          onScroll={onTableScroll}
          scrollEventThrottle={16}
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={Platform.OS === "android"}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomContentReserveY + 12 },
          ]}
        />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 },
  commentEditor: { paddingHorizontal: 12, paddingBottom: 8 },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  metaText: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
  },
  preseasonBadge: {
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.5)",
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  preseasonText: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    letterSpacing: 1.4,
    color: "#fde68a",
  },
  empty: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    textAlign: "center",
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
  },
  lock: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  list: {
    paddingHorizontal: 12,
  },
  rowGap: { height: 6 },
  mine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "rgba(0,245,255,0.06)",
  },
  mineLabel: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    letterSpacing: 1.4,
    color: CYBER_TAB_CYAN,
    textTransform: "uppercase",
  },
  mineRankCol: { alignItems: "flex-start" },
  mineRank: {
    fontFamily: "Oxanium_800ExtraBold",
    fontSize: 22,
    lineHeight: 24,
    color: "#fff",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  mineRankSuffix: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  mineOf: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.45)",
    fontVariant: ["tabular-nums"],
  },
  mineSub: { flex: 1, minWidth: 0, gap: 3 },
  mineValueCol: { alignItems: "flex-end", minWidth: 52 },
  mineValue: {
    fontFamily: "Oxanium_800ExtraBold",
    fontSize: 22,
    lineHeight: 24,
    color: CYBER_TAB_CYAN,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  mineValueUnit: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.4)",
  },
  mineEmpty: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
});
