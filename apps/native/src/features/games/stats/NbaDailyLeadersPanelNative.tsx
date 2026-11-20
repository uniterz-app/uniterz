/** Web `NbaDailyLeadersPanel` 相当 — 今日の試合の主要スタッツ Top20 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, ScrollView, StyleSheet, Text, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import RankingsListEntranceRowNative from "../../rankings/RankingsListEntranceRowNative";
import NbaDailyLeaderRowNative from "./NbaDailyLeaderRowNative";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import { fetchLatestNbaSlateDateKey } from "../../../../../../lib/games/latestNbaSlate";
import { TIMEZONE_ET } from "../../../../../../lib/time/zonedTime";
import {
  DAILY_LEADER_STATS,
  type DailyLeaderStatKey,
  type DailyLeadersPayload,
} from "../../../../../../lib/nba/dailyLeaders/buildDailyLeaders";
import { dailyLeadersCopy } from "../../../../../../lib/nba/dailyLeaders/dailyLeadersCopy";
import {
  LeagueStatsCollapsedSummaryNative,
  LeagueStatsCollapsibleNative,
  useLeagueStatsCollapse,
} from "./LeagueStatsCollapseNative";

/** Web `restItem`（0.048s 刻み・最大 0.32s・0.32s）と同じ秒数 */
const LIST_ENTRANCE_STAGGER_MS = 48;
const LIST_ENTRANCE_MAX_STAGGER_INDEX = 7;
const LIST_ENTRANCE_DURATION_MS = 320;

const POLL_MS = 60_000;

type Props = {
  language: string;
  /** 畳んだときのサマリー先頭（上段タブ名） */
  summaryPrefix?: string;
  onSelectPlayer?: (playerId: string) => void;
};

export default function NbaDailyLeadersPanelNative({
  language,
  summaryPrefix,
  onSelectPlayer,
}: Props) {
  const { onTableScroll } = useLeagueStatsCollapse();
  const copy = useMemo(
    () => dailyLeadersCopy(resolveLocalizedLang(language)),
    [language]
  );
  const { bottomContentReserveY } = useBottomTabBarInsets();
  // 下に詳細画面を重ねたあいだは 60 秒ごとの取り直しを止める
  const focused = useIsFocused();
  const [stat, setStat] = useState<DailyLeaderStatKey>("pts");
  const [data, setData] = useState<DailyLeadersPayload | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const apiBase = getUniterzApiBaseUrl();
      const dateKey = await fetchLatestNbaSlateDateKey(apiBase);
      const res = await fetch(
        `${apiBase}/api/nba/daily-leaders?date=${dateKey}&tz=${encodeURIComponent(TIMEZONE_ET)}`
      );
      const json = (await res.json()) as DailyLeadersPayload | { ok: false };
      if (!res.ok || !json.ok) throw new Error("failed");
      setData(json);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!focused) return;
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") void load();
    });
    return () => sub.remove();
  }, [load, focused]);

  useEffect(() => {
    if (!data?.hasLive || !focused) return;
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id) return;
      id = setInterval(() => void load(), POLL_MS);
    };
    const stop = () => {
      if (id) clearInterval(id);
      id = null;
    };
    if (AppState.currentState === "active") start();
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        start();
      } else {
        stop();
      }
    });
    return () => {
      stop();
      sub.remove();
    };
  }, [data?.hasLive, load, focused]);

  const rows = data?.boards[stat] ?? [];
  const statLabel =
    DAILY_LEADER_STATS.find((s) => s.key === stat)?.label ?? "";

  let empty: string | null = null;
  if (!data) empty = failed ? copy.loadFailed : null;
  else if (data.gameCount === 0) empty = copy.noGames;
  else if (data.gamesWithStats === 0) empty = copy.notStarted;

  const summaryText = [
    summaryPrefix,
    statLabel,
    data && data.gameCount > 0 ? copy.gamesLabel(data.gameCount) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.root}>
      <LeagueStatsCollapsibleNative>
        <View style={styles.tabs}>
          <CyberSlantedTabBarNative fill>
            {DAILY_LEADER_STATS.map((s) => (
              <CyberSlantedTabNative
                key={s.key}
                label={s.label}
                active={stat === s.key}
                onPress={() => setStat(s.key)}
                compact
              />
            ))}
          </CyberSlantedTabBarNative>
        </View>

        {data && data.gameCount > 0 ? (
          <View style={styles.meta}>
            <Text style={styles.metaText}>{copy.gamesLabel(data.gameCount)}</Text>
            {data.preseason ? (
              <View style={styles.preseasonBadge}>
                <Text style={styles.preseasonText}>{copy.preseason}</Text>
              </View>
            ) : null}
            {data.hasLive ? (
              <Text style={styles.liveNote} numberOfLines={1}>
                · {copy.liveNote}
              </Text>
            ) : null}
          </View>
        ) : null}
      </LeagueStatsCollapsibleNative>
      <LeagueStatsCollapsedSummaryNative text={summaryText} />

      {empty ? (
        <Text style={styles.empty}>{empty}</Text>
      ) : !data ? null : (
        <ScrollView
          onScroll={onTableScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomContentReserveY + 12 },
          ]}
        >
          {rows.map((r, i) => (
            <RankingsListEntranceRowNative
              key={`${r.playerId}-${r.gameId}`}
              index={Math.min(i, LIST_ENTRANCE_MAX_STAGGER_INDEX)}
              entranceKey={stat}
              staggerMs={LIST_ENTRANCE_STAGGER_MS}
              durationMs={LIST_ENTRANCE_DURATION_MS}
            >
              <NbaDailyLeaderRowNative
                row={r}
                rank={i + 1}
                stat={stat}
                statLabel={statLabel}
                liveLabel={copy.live}
                onPress={() => onSelectPlayer?.(r.playerId)}
              />
            </RankingsListEntranceRowNative>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 },
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
  liveNote: { flexShrink: 1, fontSize: 10, color: "rgba(255,255,255,0.45)" },
  empty: {
    paddingVertical: 40,
    textAlign: "center",
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
  },
  list: {
    paddingHorizontal: 12,
    gap: 6,
  },
});
