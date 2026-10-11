/**
 * Web `NbaFavoriteStarButton` 相当 — 詳細ヒーロー用星トグル。
 * チーム追加時はファン歴シーズンを選ぶ。選手上限時は入れ替えモーダル。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  formatNbaFavoritePlayerInitialLast,
  hasNbaFavoritePlayer,
  hasNbaFavoriteTeam,
  NBA_FAVORITE_MAX_PLAYERS,
} from "../../../../../lib/profile/nbaFavorites";
import { getNbaTeamNicknameById } from "../../../../../lib/nba-team-names";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../lib/rankings/nbaSeason";
import { formatNbaFavoriteCount } from "../../../../../lib/nba/favoriteCounts";
import { useNbaFavoriteCount } from "../../../../../lib/nba/useNbaFavoriteCount";
import { METRIC_FONT } from "../rankings/rankingsUiTheme";
import {
  NbaFavoritesMaxPlayersError,
  saveMeNbaFavoritesNative,
} from "../profile/saveMeNbaFavoritesNative";
import { useMyNbaFavoritesNative } from "../profile/useMyNbaFavoritesNative";
import NbaFanSinceSeasonPickerNative from "./NbaFanSinceSeasonPickerNative";
import NbaFavoriteLimitModalNative from "./NbaFavoriteLimitModalNative";
import NbaFavoritePromptModalNative, {
  hasSeenNbaFavoritePrompt,
  markNbaFavoritePromptSeen,
} from "./NbaFavoritePromptModalNative";

const PROMPT_DELAY_MS = 1000;
/** iOS は Modal の退場中に次の Modal を出すと表示されないことがある */
const MODAL_HANDOFF_MS = 350;

type TeamProps = {
  kind: "team";
  teamId: string;
  language?: "ja" | "en";
};

type PlayerProps = {
  kind: "player";
  playerId: string;
  displayName: string;
  teamId: string;
  language?: "ja" | "en";
};

export type NbaFavoriteStarButtonNativeProps = TeamProps | PlayerProps;

const apiBase = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL ?? null;

export default function NbaFavoriteStarButtonNative(
  props: NbaFavoriteStarButtonNativeProps
) {
  const isJa = (props.language ?? "ja") === "ja";
  const { favorites, ready, uid } = useMyNbaFavoritesNative();
  const [busy, setBusy] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [replaceBusy, setReplaceBusy] = useState(false);
  const [fanSinceOpen, setFanSinceOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  const hasAnyOfKind =
    props.kind === "team"
      ? Boolean(favorites.favoriteNbaTeamId)
      : favorites.favoriteNbaPlayers.length > 0;

  useEffect(() => {
    if (!ready || !uid || hasAnyOfKind) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    void hasSeenNbaFavoritePrompt(props.kind, uid).then((seen) => {
      if (cancelled || seen) return;
      timer = setTimeout(() => {
        if (cancelled) return;
        void markNbaFavoritePromptSeen(props.kind, uid);
        setPromptOpen(true);
      }, PROMPT_DELAY_MS);
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [ready, uid, hasAnyOfKind, props.kind]);

  const pulseStar = useCallback(() => {
    const beat = () =>
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.3,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]);
    Animated.sequence([Animated.delay(MODAL_HANDOFF_MS), beat(), beat()]).start();
  }, [pulse]);

  const active =
    props.kind === "team"
      ? hasNbaFavoriteTeam(favorites, props.teamId)
      : hasNbaFavoritePlayer(favorites, props.playerId);
  const favoriteCount = useNbaFavoriteCount({
    apiBase,
    kind: props.kind,
    id: props.kind === "team" ? props.teamId : props.playerId,
    active,
    ready,
  });

  const saveTeam = useCallback(
    async (teamId: string, fanSinceSeason?: string | null) => {
      setBusy(true);
      try {
        await saveMeNbaFavoritesNative({
          action: "toggleTeam",
          teamId,
          fanSinceSeason,
        });
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const onToggle = useCallback(async () => {
    if (busy || replaceBusy) return;
    if (!uid) {
      Alert.alert(
        isJa ? "ログインが必要です" : "Sign in required",
        isJa
          ? "お気に入りを登録するにはログインしてください。"
          : "Sign in to save favorites."
      );
      return;
    }
    if (props.kind === "team") {
      if (active) {
        await saveTeam(props.teamId);
        return;
      }
      setFanSinceOpen(true);
      return;
    }
    if (
      !active &&
      favorites.favoriteNbaPlayers.length >= NBA_FAVORITE_MAX_PLAYERS
    ) {
      setLimitOpen(true);
      return;
    }
    setBusy(true);
    try {
      await saveMeNbaFavoritesNative({
        action: "togglePlayer",
        playerId: props.playerId,
        displayName: props.displayName,
        teamId: props.teamId,
      });
    } catch (e) {
      if (e instanceof NbaFavoritesMaxPlayersError) {
        setLimitOpen(true);
      }
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    replaceBusy,
    uid,
    props,
    isJa,
    active,
    saveTeam,
    favorites.favoriteNbaPlayers.length,
  ]);

  const onReplace = useCallback(
    async (removePlayerId: string) => {
      if (props.kind !== "player" || replaceBusy) return;
      setReplaceBusy(true);
      try {
        await saveMeNbaFavoritesNative({
          action: "replacePlayer",
          removePlayerId,
          playerId: props.playerId,
          displayName: props.displayName,
          teamId: props.teamId,
        });
        setLimitOpen(false);
      } finally {
        setReplaceBusy(false);
      }
    },
    [props, replaceBusy]
  );

  const label = active
    ? isJa
      ? "お気に入りを解除"
      : "Remove favorite"
    : isJa
      ? "お気に入りに追加"
      : "Add favorite";

  const incomingLabel =
    props.kind === "player"
      ? formatNbaFavoritePlayerInitialLast(props.displayName)
      : undefined;

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <Pressable
        onPress={() => void onToggle()}
        disabled={busy || replaceBusy || !ready}
        accessibilityRole="button"
        accessibilityState={{
          selected: active,
          disabled: busy || replaceBusy || !ready,
        }}
        accessibilityLabel={label}
        style={[
          styles.btn,
          active ? styles.btnOn : styles.btnOff,
          busy || replaceBusy || !ready ? styles.btnBusy : null,
        ]}
        hitSlop={6}
      >
        {busy ? (
          <ActivityIndicator size="small" color={active ? "#FCD34D" : "#fff"} />
        ) : (
          <MaterialCommunityIcons
            name={active ? "star" : "star-outline"}
            size={18}
            color={active ? "#FCD34D" : "rgba(255,255,255,0.55)"}
          />
        )}
      </Pressable>
      </Animated.View>
      {favoriteCount != null && favoriteCount > 0 ? (
        <Text
          style={styles.countText}
          numberOfLines={1}
          accessibilityLabel={
            isJa
              ? `お気に入り ${favoriteCount} 人`
              : `${favoriteCount} favorites`
          }
        >
          {formatNbaFavoriteCount(favoriteCount)} FANS
        </Text>
      ) : null}
      <NbaFavoritePromptModalNative
        open={promptOpen}
        kind={props.kind}
        language={isJa ? "ja" : "en"}
        onConfirm={() => {
          setPromptOpen(false);
          setTimeout(() => void onToggle(), MODAL_HANDOFF_MS);
        }}
        onLater={() => {
          setPromptOpen(false);
          pulseStar();
        }}
      />
      {props.kind === "player" ? (
        <NbaFavoriteLimitModalNative
          open={limitOpen}
          language={isJa ? "ja" : "en"}
          incomingLabel={incomingLabel}
          players={favorites.favoriteNbaPlayers}
          busy={replaceBusy}
          onClose={() => {
            if (!replaceBusy) setLimitOpen(false);
          }}
          onReplace={(id) => void onReplace(id)}
        />
      ) : null}
      {props.kind === "team" ? (
        <NbaFanSinceSeasonPickerNative
          open={fanSinceOpen}
          language={isJa ? "ja" : "en"}
          teamLabel={getNbaTeamNicknameById(props.teamId)}
          initialSeason={
            favorites.favoriteNbaTeamFanSinceSeason ?? CURRENT_NBA_SEASON_KEY
          }
          onCancel={() => setFanSinceOpen(false)}
          onPick={(seasonKey) => {
            setFanSinceOpen(false);
            void saveTeam(props.teamId, seasonKey);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    zIndex: 2,
    alignItems: "center",
    gap: 3,
  },
  countText: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#FCD34D",
    fontVariant: ["tabular-nums"],
  },
  btn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  btnOn: {
    borderColor: "rgba(252,211,77,0.7)",
    backgroundColor: "rgba(251,191,36,0.15)",
  },
  btnOff: {
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  btnBusy: {
    opacity: 0.5,
  },
});
