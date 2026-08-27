/** Web `NbaStatsSearchBar` 相当 */
import { useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  searchNbaStatsIndex,
  type NbaStatsSearchHit,
  type NbaStatsSearchKind,
} from "../../../../../../lib/nba/nbaStatsSearch";
import { useLeagueTeamStatsBundle } from "../../../../../../lib/nba/useLeagueTeamStatsBundle";
import { usePlayerStatLeadersBundle } from "../../../../../../lib/nba/usePlayerStatLeadersBundle";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

type Props = {
  kind: NbaStatsSearchKind;
  language: "ja" | "en";
  onSelect: (hit: NbaStatsSearchHit) => void;
};

export default function NbaStatsSearchBarNative({
  kind,
  language,
  onSelect,
}: Props) {
  const isJa = language === "ja";
  const [query, setQuery] = useState("");
  const apiBaseUrl = getUniterzApiBaseUrl();
  // 検索対象の kind 側だけ取得する。パネルが既に読んだ bundle は共有キャッシュから来る
  const { bundle: teamBundle } = useLeagueTeamStatsBundle({
    apiBaseUrl,
    enabled: kind === "team",
  });
  const { bundle: playerBundle } = usePlayerStatLeadersBundle({
    apiBaseUrl,
    enabled: kind === "player",
  });
  const hits = useMemo(
    () =>
      searchNbaStatsIndex(query, kind, 8, {
        team: teamBundle,
        player: playerBundle,
      }),
    [query, kind, teamBundle, playerBundle]
  );
  const placeholder =
    kind === "team"
      ? isJa
        ? "チームを検索（Lakers / LAL）"
        : "Search teams (Lakers / LAL)"
      : isJa
        ? "選手を検索（Luka / Curry）"
        : "Search players (Luka / Curry)";

  return (
    <View style={styles.wrap}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.35)"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        style={styles.input}
      />
      {query.trim() ? (
        <View style={styles.dropdown}>
          {hits.length === 0 ? (
            <Text style={styles.empty}>
              {isJa ? "該当なし" : "NO MATCHES"}
            </Text>
          ) : (
            hits.map((hit) => (
              <Pressable
                key={`${hit.kind}-${hit.id}`}
                onPress={() => {
                  Keyboard.dismiss();
                  onSelect(hit);
                  setQuery("");
                }}
                style={({ pressed }) => [
                  styles.row,
                  pressed ? { opacity: 0.8 } : null,
                ]}
              >
                <Text style={styles.name} numberOfLines={1}>
                  {hit.name}
                </Text>
                <Text style={styles.abbr}>{hit.abbr}</Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    zIndex: 20,
    overflow: "visible",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "#fff",
    fontFamily: METRIC_FONT,
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "100%",
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
    backgroundColor: "#050808",
    zIndex: 30,
    elevation: 16,
  },
  empty: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  name: {
    flex: 1,
    minWidth: 0,
    color: "#fff",
    fontFamily: METRIC_FONT,
    fontSize: 13,
    fontWeight: "700",
  },
  abbr: {
    color: "rgba(0,245,255,0.85)",
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
});
