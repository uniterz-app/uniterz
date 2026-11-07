/**
 * Web `NbaFavoriteLimitModal` 相当 — 上限時に誰を外すか選ぶ。
 */
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  formatNbaFavoritePlayerInitialLast,
  NBA_FAVORITE_MAX_PLAYERS_PRO,
  type NbaFavoritePlayer,
} from "../../../../../lib/profile/nbaFavorites";
import TeamAbbrBadgeNative from "./TeamAbbrBadgeNative";

const OXANIUM_BOLD = "Oxanium_700Bold";
const OXANIUM_EXTRA = "Oxanium_800ExtraBold";

type Props = {
  open: boolean;
  language?: "ja" | "en";
  incomingLabel?: string;
  players: NbaFavoritePlayer[];
  maxPlayers: number;
  isPro: boolean;
  busy?: boolean;
  onClose: () => void;
  onReplace: (removePlayerId: string) => void;
  /** 無料ユーザーだけ。Pro 購入へ */
  onUpgrade?: () => void;
};

function limitMessage(
  isJa: boolean,
  maxPlayers: number,
  isPro: boolean,
  incomingLabel: string | undefined
): string {
  if (isJa) {
    const head = isPro
      ? `お気に入り選手は${maxPlayers}人までです。`
      : `無料プランのお気に入り選手は${maxPlayers}人までです。Pro なら${NBA_FAVORITE_MAX_PLAYERS_PRO}人まで登録できます。`;
    return incomingLabel
      ? `${head}「${incomingLabel}」に入れ替える選手を選んでください。`
      : head;
  }
  const plural = (n: number) => `${n} player${n === 1 ? "" : "s"}`;
  const head = isPro
    ? `You can favorite ${plural(maxPlayers)}.`
    : `Free plan: ${plural(maxPlayers)}. Pro: up to ${plural(NBA_FAVORITE_MAX_PLAYERS_PRO)}.`;
  return incomingLabel
    ? `${head} Pick who to replace with ${incomingLabel}.`
    : head;
}

export default function NbaFavoriteLimitModalNative({
  open,
  language = "ja",
  incomingLabel,
  players,
  maxPlayers,
  isPro,
  busy = false,
  onClose,
  onReplace,
  onUpgrade,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const [pickedId, setPickedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPickedId(null);
      return;
    }
    if (players.length === 1) {
      setPickedId(players[0]!.playerId);
    } else {
      setPickedId(null);
    }
  }, [open, players]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          if (!busy) onClose();
        }}
      >
        <Pressable
          style={[
            styles.sheet,
            { marginBottom: Math.max(12, insets.bottom) },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>FAVORITES</Text>
            <Text style={styles.title}>
              {isJa ? "入れ替えますか？" : "Replace favorite?"}
            </Text>
            <Text style={styles.sub}>
              {limitMessage(isJa, maxPlayers, isPro, incomingLabel)}
            </Text>
          </View>
          <View style={styles.list}>
            {players.map((p) => {
              const selected = pickedId === p.playerId;
              return (
                <Pressable
                  key={p.playerId}
                  disabled={busy}
                  onPress={() => setPickedId(p.playerId)}
                  style={[
                    styles.row,
                    selected ? styles.rowOn : styles.rowOff,
                    busy ? styles.rowBusy : null,
                  ]}
                >
                  <Text style={styles.rowName} numberOfLines={1}>
                    {formatNbaFavoritePlayerInitialLast(p.displayName)}
                  </Text>
                  {p.teamId ? (
                    <TeamAbbrBadgeNative teamId={p.teamId} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          {!isPro && onUpgrade ? (
            <Pressable
              disabled={busy}
              onPress={onUpgrade}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.upgrade,
                pressed || busy ? styles.btnBusy : null,
              ]}
            >
              <Text style={styles.upgradeText}>
                {isJa
                  ? `PRO で${NBA_FAVORITE_MAX_PLAYERS_PRO}人まで登録`
                  : `GO PRO · UP TO ${NBA_FAVORITE_MAX_PLAYERS_PRO}`}
              </Text>
            </Pressable>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              disabled={busy}
              onPress={onClose}
              style={[styles.btn, styles.btnCancel, busy ? styles.btnBusy : null]}
            >
              <Text style={styles.btnCancelText}>
                {isJa ? "キャンセル" : "Cancel"}
              </Text>
            </Pressable>
            <Pressable
              disabled={busy || !pickedId}
              onPress={() => {
                if (pickedId) onReplace(pickedId);
              }}
              style={[
                styles.btn,
                styles.btnReplace,
                busy || !pickedId ? styles.btnBusy : null,
              ]}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#FEF3C7" />
              ) : (
                <Text style={styles.btnReplaceText}>
                  {isJa ? "入れ替える" : "Replace"}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 16,
  },
  sheet: {
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.55)",
    backgroundColor: "#0a0a0c",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  eyebrow: {
    color: "rgba(252,211,77,0.8)",
    fontFamily: OXANIUM_BOLD,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 4,
    color: "#fff",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 15,
    fontWeight: "800",
    transform: [{ skewX: "-8deg" }],
  },
  sub: {
    marginTop: 6,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 18,
  },
  list: {
    gap: 6,
    padding: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowOn: {
    borderColor: "rgba(252,211,77,0.7)",
    backgroundColor: "rgba(251,191,36,0.15)",
  },
  rowOff: {
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  rowBusy: {
    opacity: 0.5,
  },
  rowName: {
    flex: 1,
    minWidth: 0,
    color: "rgba(255,255,255,0.9)",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    transform: [{ skewX: "-8deg" }],
  },
  upgrade: {
    marginHorizontal: 12,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.7)",
    backgroundColor: "#FCD34D",
  },
  upgradeText: {
    color: "#0a0a0c",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    transform: [{ skewX: "-8deg" }],
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    padding: 8,
  },
  btn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    minHeight: 42,
  },
  btnCancel: {
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "transparent",
  },
  btnReplace: {
    borderColor: "rgba(252,211,77,0.4)",
    backgroundColor: "rgba(251,191,36,0.1)",
  },
  btnBusy: {
    opacity: 0.4,
  },
  btnCancelText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: OXANIUM_BOLD,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  btnReplaceText: {
    color: "#FEF3C7",
    fontFamily: OXANIUM_BOLD,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
});
