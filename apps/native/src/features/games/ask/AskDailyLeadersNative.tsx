import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { CyberSlantedTabBarNative, CyberSlantedTabNative } from "../../rankings/CyberSlantedTabNative";
import NbaDailyLeaderRowNative from "../stats/NbaDailyLeaderRowNative";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import { resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import { TIMEZONE_ET } from "../../../../../../lib/time/zonedTime";
import {
  DAILY_LEADER_STATS,
  type DailyLeaderStatKey,
  type DailyLeadersPayload,
} from "../../../../../../lib/nba/dailyLeaders/buildDailyLeaders";
import { dailyLeadersCopy } from "../../../../../../lib/nba/dailyLeaders/dailyLeadersCopy";

type Props = {
  /** 米国東部の試合日 YYYY-MM-DD */
  date: string;
  stat: DailyLeaderStatKey;
  count?: number;
  language: string;
  onSelectPlayer?: (playerId: string) => void;
};

/** ASK の答えの下に、TODAY の NBA リーダーと同じ行を同じ API で出す（その日・聞かれた人数） */
export default function AskDailyLeadersNative({ date, stat: initialStat, count = 5, language, onSelectPlayer }: Props) {
  const copy = useMemo(() => dailyLeadersCopy(resolveLocalizedLang(language)), [language]);
  const [stat, setStat] = useState<DailyLeaderStatKey>(initialStat);
  const [data, setData] = useState<DailyLeadersPayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(
          `${getUniterzApiBaseUrl()}/api/nba/daily-leaders?date=${date}&tz=${encodeURIComponent(TIMEZONE_ET)}`
        );
        const json = (await res.json()) as DailyLeadersPayload | { ok: false };
        if (!res.ok || !json.ok) throw new Error("failed");
        if (alive) setData(json);
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [date]);

  if (failed) return null;
  if (!data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#00F5FF" />
      </View>
    );
  }
  const rows = (data.boards[stat] ?? []).slice(0, count);
  const statLabel = DAILY_LEADER_STATS.find((s) => s.key === stat)?.label ?? "";

  return (
    <View style={styles.root}>
      <CyberSlantedTabBarNative fill>
        {DAILY_LEADER_STATS.map((s) => (
          <CyberSlantedTabNative key={s.key} label={s.label} active={stat === s.key} onPress={() => setStat(s.key)} compact />
        ))}
      </CyberSlantedTabBarNative>
      <View style={styles.list}>
        {rows.map((r, i) => (
          <NbaDailyLeaderRowNative
            key={`${r.playerId}-${r.gameId}`}
            row={r}
            rank={i + 1}
            stat={stat}
            statLabel={statLabel}
            liveLabel={copy.live}
            onPress={onSelectPlayer ? () => onSelectPlayer(r.playerId) : undefined}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10, paddingTop: 4 },
  list: { gap: 6 },
  loading: { paddingVertical: 24, alignItems: "center" },
});
