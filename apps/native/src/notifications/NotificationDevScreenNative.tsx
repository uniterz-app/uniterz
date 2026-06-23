/**
 * __DEV__ 専用 — OS プッシュ 3 種 + タブドットの動作確認
 */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import { buildPushNotificationCopy } from "@/lib/notifications/pushNotificationCopy";
import type { PushNotificationType } from "@/lib/notifications/pushPayloadTypes";
import MobilePageShell from "../features/profile/mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../hooks/useNativeUserLanguage";
import type { ProfileStackParamList } from "../navigation/types";
import { useNativeNavTabNotificationBadges } from "../navigation/useNativeNavTabNotificationBadges";
import {
  getCachedExpoPushToken,
  registerNativePushTokenFlow,
} from "./registerPushTokenNative";
import { loadExpoNotificationsModule } from "./expoNotificationsModuleNative";
import { copyTextNative } from "../features/leaderboards/copyTextNative";
import { colors, fonts, spacing } from "../theme/tokens";

const LEADERBOARDS_INTRO_KEY = "uniterz:leaderboardsGroupsIntroSeen:v1";

async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = await loadExpoNotificationsModule();
  if (!Notifications) return false;

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return requested.status === "granted";
}

async function scheduleLocalPushPreview(input: {
  type: PushNotificationType;
  language: "ja" | "en";
  gameId?: string;
  postId?: string;
  /** ロック画面確認用 — 秒数指定で遅延送信 */
  delaySeconds?: number;
}): Promise<"ok" | "no_module" | "denied"> {
  const Notifications = await loadExpoNotificationsModule();
  if (!Notifications) {
    return "no_module";
  }

  const granted = await ensureNotificationPermission();
  if (!granted) {
    return "denied";
  }

  const copy = buildPushNotificationCopy(input.type, input.language, {
    homeLabel: "Japan",
    awayLabel: "Brazil",
    homeTeamId: "wc-jpn",
    awayTeamId: "wc-bra",
    homeScore: input.type === "game_final" ? 2 : undefined,
    awayScore: input.type === "game_final" ? 1 : undefined,
  });

  const data: Record<string, string> = { type: input.type };
  if (input.gameId) data.gameId = input.gameId;
  if (input.postId) data.postId = input.postId;

  const delay = input.delaySeconds ?? 0;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: copy.body,
      ...(copy.subtitle ? { subtitle: copy.subtitle } : {}),
      data,
      sound: "default",
    },
    trigger: delay > 0 ? { type: "timeInterval", seconds: delay, repeats: false } : null,
  });
  return "ok";
}

export default function NotificationDevScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const uid = fUser?.uid ?? null;

  const badges = useNativeNavTabNotificationBadges();

  const [permission, setPermission] = useState<string>("…");
  const [token, setToken] = useState<string | null>(getCachedExpoPushToken());
  const [gameId, setGameId] = useState("test-game-id");
  const [postId, setPostId] = useState("test-post-id");
  const [busy, setBusy] = useState(false);

  const refreshStatus = useCallback(async () => {
    const Notifications = await loadExpoNotificationsModule();
    if (!Notifications) {
      setPermission("モジュール未ロード（再ビルド要）");
      setToken(null);
      return;
    }
    const perm = await Notifications.getPermissionsAsync();
    setPermission(perm.status);
    setToken(getCachedExpoPushToken());
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const runRequestPermission = async () => {
    setBusy(true);
    try {
      const granted = await ensureNotificationPermission();
      await refreshStatus();
      Alert.alert(
        granted ? "通知を許可しました" : "通知が拒否されました",
        granted
          ? "① などのボタンでテストできます。"
          : "設定 → 通知 → native →「通知を許可」を ON にしてください。"
      );
    } catch (e) {
      Alert.alert("エラー", String(e));
    } finally {
      setBusy(false);
    }
  };

  const runRegisterToken = async () => {
    if (!Device.isDevice) {
      Alert.alert(
        "シミュレーター",
        "Push Token は実機のみ取得できます。\nローカル通知テストは「通知を許可」だけで OK です。"
      );
      return;
    }
    setBusy(true);
    try {
      const t = await registerNativePushTokenFlow();
      setToken(t);
      await refreshStatus();
      Alert.alert(
        t ? "Token 取得 OK" : "Token 未取得",
        t ? `${t.slice(0, 40)}…` : "通知権限を確認してください。"
      );
    } catch (e) {
      Alert.alert("エラー", String(e));
    } finally {
      setBusy(false);
    }
  };

  const firePush = async (type: PushNotificationType, delaySeconds = 0) => {
    setBusy(true);
    try {
      const result = await scheduleLocalPushPreview({
        type,
        language,
        gameId: type !== "ranking_updated" ? gameId : undefined,
        postId: type === "game_final" ? postId : undefined,
        delaySeconds,
      });
      if (result === "no_module") {
        Alert.alert("通知モジュールなし", "dev-client の再ビルドが必要です。");
        return;
      }
      if (result === "denied") {
        Alert.alert(
          "通知がオフです",
          "シミュレーター: 設定 → 通知 → native → 「通知を許可」を ON にしてください。"
        );
        return;
      }
      if (delaySeconds > 0) {
        Alert.alert(
          `${delaySeconds}秒後に通知`,
          "今すぐ Cmd+Shift+H でホームに戻るか、ロックしてください。\nロック画面 or 通知センターに表示されます。"
        );
        return;
      }
      Alert.alert(
        "通知を送りました",
        "アプリを開いたまま → 画面上部のバナーを探してください。\n\nロック画面に出したい場合は「3秒後（ロック確認）」ボタンを使ってください。"
      );
    } catch (e) {
      Alert.alert("送信失敗", String(e));
    } finally {
      setBusy(false);
    }
  };

  const resetRankingBadge = async () => {
    if (!uid) return;
    await AsyncStorage.removeItem(`uniterz:navSeen:rankingUpdatedAtMs:v1:${uid}`);
    Alert.alert("完了", "Rankings ドット用の既読をリセットしました。\nFirestore に更新があればドットが付きます。");
  };

  const resetResultBadge = async () => {
    if (!uid) return;
    await AsyncStorage.setItem(
      `uniterz:navSeen:resultSettledAtMs:v1:${uid}`,
      "0"
    );
    Alert.alert("完了", "Result ドット用の既読をリセットしました。\n未確定の settled 投稿があればドットが付きます。");
  };

  const resetLeaderboardsBadge = async () => {
    await AsyncStorage.removeItem(LEADERBOARDS_INTRO_KEY);
    Alert.alert("完了", "Leaderboards イントロ既読をリセットしました。\nLeaderboards タブにシアンドットが付くはずです。");
  };

  if (!__DEV__) {
    return null;
  }

  return (
    <MobilePageShell
      title="通知テスト（DEV）"
      onClose={() => navigation.goBack()}
      appBackground
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.note}>
          実機 + dev-client ビルド推奨。シミュレータでは Token 取得不可のことがあります。
        </Text>

        <Section title="登録状態">
          <Row label="端末" value={Device.isDevice ? "実機" : "シミュレータ"} />
          <Row label="権限" value={permission} />
          <Row label="Token" value={token ? `${token.slice(0, 36)}…` : Device.isDevice ? "未取得" : "実機のみ"} />
          <View style={styles.rowBtns}>
            <DevButton label="通知を許可" onPress={() => void runRequestPermission()} disabled={busy} />
            {Device.isDevice ? (
              <DevButton label="Token 再取得" onPress={() => void runRegisterToken()} disabled={busy} />
            ) : null}
            {token ? (
              <DevButton
                label="Token コピー"
                onPress={() => void copyTextNative(token).then((ok) => {
                  if (ok) Alert.alert("コピーしました", "Expo Push Tool に貼り付けてください。");
                })}
              />
            ) : null}
          </View>
        </Section>

        <Section title="OS プッシュ（ローカル即時表示）">
          <Text style={styles.hint}>
            アプリ前面 → 画面上部バナー（ロック画面には出ません）。{"\n"}
            ロック画面確認 → 下の「3秒後」ボタン → OK 後すぐホームへ。
          </Text>
          <Field label="gameId（開始・結果用）" value={gameId} onChange={setGameId} />
          <Field label="postId（結果用）" value={postId} onChange={setPostId} />
          <DevButton
            label="① まもなくキックオフ"
            onPress={() => void firePush("game_start")}
            disabled={busy}
          />
          <DevButton
            label="② 試合結果確定"
            onPress={() => void firePush("game_final")}
            disabled={busy}
          />
          <DevButton
            label="③ ランキング更新"
            onPress={() => void firePush("ranking_updated")}
            disabled={busy}
          />
          <DevButton
            label="① 3秒後（ロック画面確認）"
            onPress={() => void firePush("game_start", 3)}
            disabled={busy}
          />
        </Section>

        <Section title="タブドット（アプリ内）">
          <Row label="Rankings" value={badges.showRankingBadge ? "● 表示中" : "なし"} />
          <Row label="Result" value={badges.showResultBadge ? "● 表示中" : "なし"} />
          <Row
            label="Leaderboards"
            value={badges.showLeaderboardsBadge ? "● 表示中" : "なし"}
          />
          <Text style={styles.hint}>
            下部タブのアイコン右上にシアン色の丸。タブを開くと消えます。
          </Text>
          <DevButton label="Rankings 既読リセット" onPress={() => void resetRankingBadge()} />
          <DevButton label="Result 既読リセット" onPress={() => void resetResultBadge()} />
          <DevButton
            label="Leaderboards イントロリセット"
            onPress={() => void resetLeaderboardsBadge()}
          />
        </Section>

        <Section title="リモート送信（任意）">
          <Text style={styles.hint}>
            Token をコピー → expo.dev/notifications に貼り付け → data に type / gameId / postId
          </Text>
        </Section>
      </ScrollView>
    </MobilePageShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="rgba(255,255,255,0.35)"
      />
    </View>
  );
}

function DevButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.btn, disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.md,
    paddingBottom: 48,
    gap: 16,
  },
  note: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.22)",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    backgroundColor: "rgba(2,6,23,0.45)",
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    fontFamily: fonts.metric,
    letterSpacing: 1.2,
  },
  hint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    lineHeight: 17,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  rowLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
  },
  rowValue: {
    color: colors.textPrimary,
    fontSize: 12,
    flex: 1,
    textAlign: "right",
  },
  rowBtns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  field: { gap: 6 },
  fieldLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 13,
  },
  btn: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.45)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(34,211,238,0.08)",
  },
  btnDisabled: { opacity: 0.45 },
  btnText: {
    color: "#a5f3fc",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
