/** Web `UniterzDailyScoreLeadersPanel` 相当 — その日の合計ポイント Top20（PICK UP / PRO LEAGUE） */
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  CYBER_TAB_CYAN,
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import { RankingsAvatarNative } from "../../rankings/RankingsAvatarAndTabs";
import { rankingFlagImageUri } from "../../rankings/rankingFlagUri";
import { rankingsTexts } from "../../rankings/rankingsTexts";
import { METRIC_FONT, RANK_DISPLAY_FONT } from "../../rankings/rankingsUiTheme";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import { auth } from "../../../lib/firebase";
import { openProSubscribeNative } from "../../../navigation/navigationRef";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import { PRO_LEAGUE_ATMOSPHERE } from "../../../../../../lib/rankings/proLeagueAtmosphere";
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


function rankColor(rank: number): string {
  if (rank === 1) return "#FCD34D";
  if (rank <= 3) return CYBER_TAB_CYAN;
  return "rgba(255,255,255,0.45)";
}

type LoadState =
  | { kind: "loading" }
  | { kind: "failed" }
  | { kind: "locked" }
  | { kind: "ok"; data: DailyScoreLeadersResponse };

type Props = {
  language: string;
  onSelectUser?: (row: DailyScoreLeaderRow) => void;
};

export default function UniterzDailyScoreLeadersPanelNative({
  language,
  onSelectUser,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const copy = useMemo(() => dailyScoreLeadersCopy(lang), [lang]);
  const baseCopy = useMemo(() => dailyLeadersCopy(lang), [lang]);
  const lockCopy = useMemo(() => rankingsTexts(language), [language]);
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const [division, setDivision] = useState<DailyScoreDivision>("standard");
  const [state, setState] = useState<LoadState>({ kind: "loading" });

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

  return (
    <View style={styles.root}>
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

      {state.kind === "locked" ? (
        <View style={styles.lock}>
          <Text style={styles.lockEyebrow}>PRO ONLY</Text>
          <Text style={styles.lockTitle}>
            {lockCopy.divisionOpenTitle ?? "PRO LEAGUE"}
          </Text>
          <Text style={styles.lockBody}>{lockCopy.divisionOpenLockBody}</Text>
          <Pressable
            onPress={openProSubscribeNative}
            accessibilityRole="button"
            style={({ pressed }) => [styles.lockCta, pressed && styles.cardPressed]}
          >
            <Text style={styles.lockCtaText}>
              {lockCopy.divisionOpenCta ?? "Explore Pro"}
            </Text>
          </Pressable>
        </View>
      ) : empty ? (
        <Text style={styles.empty}>{empty}</Text>
      ) : !data ? null : (
        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomContentReserveY + 12 },
          ]}
        >
          {rows.map((r) => {
            const name = r.displayName || r.handle || "—";
            const flagUri = rankingFlagImageUri(r.countryCode ?? undefined);
            return (
              <Pressable
                key={r.uid}
                onPress={() => onSelectUser?.(r)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.card,
                  r.rank === 1 && styles.cardTop,
                  pressed && styles.cardPressed,
                ]}
              >
                <Text style={[styles.rank, { color: rankColor(r.rank) }]}>
                  {r.rank}
                </Text>
                <RankingsAvatarNative photoURL={r.photoURL} label={name} size={36} square />
                <View style={styles.who}>
                  <Text style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                  <View style={styles.subRow}>
                    {flagUri ? (
                      <Image source={{ uri: flagUri }} style={styles.flag} resizeMode="cover" />
                    ) : null}
                    <Text style={styles.subMuted}>{copy.postsLabel(r.posts)}</Text>
                  </View>
                </View>
                <View style={styles.valueCol}>
                  <Text style={[styles.value, r.rank === 1 && styles.valueTop]}>
                    {formatDailyScorePoints(r.points)}
                  </Text>
                  <Text style={styles.valueLabel}>{copy.pointsUnit}</Text>
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
  empty: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    textAlign: "center",
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
  },
  lock: {
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: PRO_LEAGUE_ATMOSPHERE.panelBorder,
    backgroundColor: "rgba(192,132,252,0.10)",
  },
  lockEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: PRO_LEAGUE_ATMOSPHERE.gold,
  },
  lockTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#fff",
  },
  lockBody: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: "rgba(255,255,255,0.65)",
  },
  lockCta: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 2,
    backgroundColor: PRO_LEAGUE_ATMOSPHERE.gold,
  },
  lockCtaText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: PRO_LEAGUE_ATMOSPHERE.ink,
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
  name: {
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
  flag: {
    width: 21,
    height: 14,
    borderRadius: 1,
    opacity: 0.8,
  },
  subMuted: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.4)",
    transform: [{ skewX: "-6deg" }],
  },
  valueCol: { alignItems: "flex-end", minWidth: 52 },
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
