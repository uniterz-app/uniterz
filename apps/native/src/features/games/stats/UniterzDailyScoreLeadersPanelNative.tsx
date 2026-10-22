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

  const load = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (division === "open") {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          setState({ kind: "locked" });
          return;
        }
        headers.Authorization = `Bearer ${token}`;
      }
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
  }, [division]);

  useEffect(() => {
    setState({ kind: "loading" });
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
            onPressSubscribe={openProSubscribeNative}
            onBackToPickUp={() => {
              setDivision("standard");
              expand();
            }}
          />
        </ScrollView>
      ) : empty ? (
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
});
