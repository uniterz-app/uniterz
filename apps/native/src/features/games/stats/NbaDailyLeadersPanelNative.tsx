/** Web `NbaDailyLeadersPanel` 相当 — 今日の試合の主要スタッツ Top20 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppState,
  Pressable,
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
import { METRIC_FONT, RANK_DISPLAY_FONT } from "../../rankings/rankingsUiTheme";
import TeamAbbrBadgeNative from "../TeamAbbrBadgeNative";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { formatNbaPlayerListName } from "../../../../../../lib/nba/formatNbaPlayerListName";
import { resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import { getTodayKeyInTimeZone } from "../../../../../../lib/time/zonedTime";
import {
  DAILY_LEADER_STATS,
  dailyLeaderSideStats,
  type DailyLeaderStatKey,
  type DailyLeadersPayload,
} from "../../../../../../lib/nba/dailyLeaders/buildDailyLeaders";
import { dailyLeadersCopy } from "../../../../../../lib/nba/dailyLeaders/dailyLeadersCopy";

const POLL_MS = 60_000;

function rankColor(rank: number): string {
  if (rank === 1) return "#FCD34D";
  if (rank <= 3) return CYBER_TAB_CYAN;
  return "rgba(255,255,255,0.45)";
}
type Props = {
  language: string;
  timeZone: string;
  onSelectPlayer?: (playerId: string) => void;
};

export default function NbaDailyLeadersPanelNative({
  language,
  timeZone,
  onSelectPlayer,
}: Props) {
  const copy = useMemo(
    () => dailyLeadersCopy(resolveLocalizedLang(language)),
    [language]
  );
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const [stat, setStat] = useState<DailyLeaderStatKey>("pts");
  const [data, setData] = useState<DailyLeadersPayload | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    const dateKey = getTodayKeyInTimeZone(timeZone);
    try {
      const res = await fetch(
        `${getUniterzApiBaseUrl()}/api/nba/daily-leaders?date=${dateKey}&tz=${encodeURIComponent(timeZone)}`
      );
      const json = (await res.json()) as DailyLeadersPayload | { ok: false };
      if (!res.ok || !json.ok) throw new Error("failed");
      setData(json);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [timeZone]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data?.hasLive) return;
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
        void load();
        start();
      } else {
        stop();
      }
    });
    return () => {
      stop();
      sub.remove();
    };
  }, [data?.hasLive, load]);

  const rows = data?.boards[stat] ?? [];
  const statLabel =
    DAILY_LEADER_STATS.find((s) => s.key === stat)?.label ?? "";

  let empty: string | null = null;
  if (!data) empty = failed ? copy.loadFailed : null;
  else if (data.gameCount === 0) empty = copy.noGames;
  else if (data.gamesWithStats === 0) empty = copy.notStarted;

  return (
    <View style={styles.root}>
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

      {empty ? (
        <Text style={styles.empty}>{empty}</Text>
      ) : !data ? null : (
        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomContentReserveY + 12 },
          ]}
        >
          {rows.map((r, i) => {
            return (
              <Pressable
                key={`${r.playerId}-${r.gameId}`}
                onPress={() => onSelectPlayer?.(r.playerId)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.card,
                  i === 0 && styles.cardTop,
                  pressed && styles.cardPressed,
                ]}
              >
                <Text style={[styles.rank, { color: rankColor(i + 1) }]}>
                  {i + 1}
                </Text>
                <View style={styles.who}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {formatNbaPlayerListName(
                        `${r.firstName} ${r.lastName}`,
                        r.playerId
                      )}
                    </Text>
                    <TeamAbbrBadgeNative teamId={r.teamId} />
                  </View>
                  <View style={styles.subRow}>
                    <Text style={styles.sub}>
                      {r.isHome ? "vs" : "@"} {r.oppAbbr}
                    </Text>
                    {r.stats ? (
                      <Text style={styles.sideStats} numberOfLines={1}>
                        {dailyLeaderSideStats(r.stats, stat).map((s) => (
                          <Text key={s.key}>
                            {" · "}
                            <Text style={styles.sideValue}>{s.value}</Text>{" "}
                            {s.label}
                          </Text>
                        ))}
                      </Text>
                    ) : null}
                    {r.live ? (
                      <Text style={styles.live}>● {copy.live}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.valueCol}>
                  <Text style={[styles.value, i === 0 && styles.valueTop]}>
                    {r.value}
                  </Text>
                  <Text style={styles.valueLabel}>{statLabel}</Text>
                </View>
              </Pressable>
            );
          })}
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
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    paddingLeft: 14,
    paddingRight: 14,
    paddingVertical: 8,
    overflow: "hidden",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  cardTop: { borderColor: "rgba(252,211,77,0.35)" },
  cardPressed: { opacity: 0.75 },
  rank: {
    width: 26,
    textAlign: "center",
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 28,
    lineHeight: 30,
    transform: [{ skewX: "-6deg" }],
  },
  who: { flex: 1, minWidth: 0, gap: 5 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: {
    flexShrink: 1,
    fontFamily: "Oxanium_600SemiBold",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.95)",
    textTransform: "uppercase",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
  },
  subRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sub: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  sideStats: {
    flexShrink: 1,
    fontFamily: METRIC_FONT,
    fontSize: 10,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.4)",
    transform: [{ skewX: "-6deg" }],
  },
  sideValue: { color: "rgba(255,255,255,0.85)" },
  live: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    letterSpacing: 1,
    color: "#f87171",
    transform: [{ skewX: "-6deg" }],
  },
  valueCol: { alignItems: "flex-end", minWidth: 44 },
  value: {
    fontFamily: "Oxanium_800ExtraBold",
    fontSize: 26,
    lineHeight: 28,
    color: "#fff",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  valueTop: { color: CYBER_TAB_CYAN },
  valueLabel: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.4)",
    transform: [{ skewX: "-6deg" }],
  },
});
