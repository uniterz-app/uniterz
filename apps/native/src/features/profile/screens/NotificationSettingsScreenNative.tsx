import { useCallback, useEffect, useState } from "react";
import { cyberAlert } from "../../../components/cyberAlert";
import {
  Linking, Platform, Pressable, StyleSheet, Switch, Text, View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  PREDICTION_DEADLINE_MINUTE_OPTIONS,
  type PredictionDeadlineMinutes,
  type PushNotificationPrefKey,
} from "@/lib/notifications/pushNotificationPrefs";
import LegalPageLayoutNative from "../../legal/LegalPageLayoutNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguageFromAuth } from "../../../hooks/useNativeUserLanguage";
import { useNativeUserPlan } from "../../../hooks/useNativeUserPlan";
import { usePushNotificationPrefsNative } from "../../../notifications/usePushNotificationPrefsNative";
import {
  loadExpoNotificationsModule,
  isExpoPushNotificationsNativeAvailable,
} from "../../../notifications/expoNotificationsModuleNative";
import {
  registerNativePushTokenFlow,
  registerNativePushTokenIfGranted,
} from "../../../notifications/registerPushTokenNative";

type PermissionState = "unknown" | "granted" | "denied" | "unavailable";

type PrefRow = {
  key: PushNotificationPrefKey;
  titleJa: string;
  titleEn: string;
  descJa: string;
  descEn: string;
  /** Pro 限定（送信側でもゲート。UI はバッジ表示） */
  proOnly?: boolean;
};

const BASIC_PREF_ROWS: PrefRow[] = [
  {
    key: "gameStart",
    titleJa: "試合開始（15分前）",
    titleEn: "Match start (15 min before)",
    descJa: "予想した試合が始まる前にお知らせ",
    descEn: "Before a match you predicted is about to start",
  },
  {
    key: "gameFinal",
    titleJa: "結果確定",
    titleEn: "Result confirmed",
    descJa: "予想した試合の結果が確定したとき",
    descEn: "When a match you predicted is finalized",
  },
  {
    key: "rankingUpdated",
    titleJa: "ランキング更新",
    titleEn: "Rankings updated",
    descJa: "本日予想した日の累積ランキング更新（16:00頃）",
    descEn: "Daily ranking update on days you predicted (~4pm JST)",
  },
];

const PREGAME_PREF_ROWS: PrefRow[] = [
  {
    key: "injuryStatus",
    titleJa: "出場ステータス変更",
    titleEn: "Availability change",
    descJa: "例: Questionable → Out など、予想を見直すべき欠場・復帰",
    descEn: "e.g. Questionable → Out — changes that warrant a recheck",
    proOnly: true,
  },
  {
    key: "starterChange",
    titleJa: "重要な先発変更",
    titleEn: "High-impact lineup change",
    descJa: "主力落ち・控え先発など。通常の先発発表は送らない",
    descEn: "Starters dropped / bench starts — not every lineup release",
    proOnly: true,
  },
  {
    key: "predictionDeadline",
    titleJa: "予想締切",
    titleEn: "Prediction deadline",
    descJa: "未予想試合のみ。締切前にお知らせ",
    descEn: "Unpredicted matches only — before the deadline",
  },
  {
    key: "pregameDigest",
    titleJa: "複数変化のまとめ",
    titleEn: "Pregame digest",
    descJa: "短時間の更新をまとめて1通で届ける",
    descEn: "Bundle several updates into one notification",
    proOnly: true,
  },
  {
    key: "proInsightUpdate",
    titleJa: "PRO INSIGHT 重要更新",
    titleEn: "PRO INSIGHT update",
    descJa: "結論が変わったときだけ",
    descEn: "Only when the conclusion changes",
    proOnly: true,
  },
];

/** アプリ内通知設定（種類別 ON/OFF + OS 許可状態） */
export default function NotificationSettingsScreenNative() {
  const navigation = useNavigation();
  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? null;
  const { language } = useNativeUserLanguageFromAuth();
  const isJa = language === "ja";
  const { isPro } = useNativeUserPlan(uid);
  const { prefs, loading, updatePref, updateDeadlineMinutes } =
    usePushNotificationPrefsNative(uid);
  const [permission, setPermission] = useState<PermissionState>("unknown");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (loading || !uid || isPro) return;
    if (prefs.predictionDeadlineMinutes !== 30) {
      void updateDeadlineMinutes(30);
    }
  }, [
    loading,
    uid,
    isPro,
    prefs.predictionDeadlineMinutes,
    updateDeadlineMinutes,
  ]);

  const refreshPermission = useCallback(async () => {
    if (!isExpoPushNotificationsNativeAvailable()) {
      setPermission("unavailable");
      return;
    }
    const Notifications = await loadExpoNotificationsModule();
    if (!Notifications) {
      setPermission("unavailable");
      return;
    }
    const result = await Notifications.getPermissionsAsync();
    if (result.status === "granted") setPermission("granted");
    else if (result.status === "denied") setPermission("denied");
    else setPermission("unknown");
  }, []);

  useEffect(() => {
    void refreshPermission();
  }, [refreshPermission]);

  const labels = isJa
    ? {
        title: "通知設定",
        description:
          "受け取る通知の種類を選べます。端末の通知がオフの場合は届きません。",
        osSection: "端末の通知",
        osGranted: "許可済み",
        osDenied: "オフ（システム設定で変更）",
        osUnknown: "未設定",
        osUnavailable: "このビルドでは利用できません",
        allowBtn: "通知を許可",
        openSettingsBtn: "システム設定を開く",
        typesSection: "基本の通知",
        pregameSection: "試合直前アラート",
        pregameHint:
          "予想を見直すべき変化だけ届けます。Pro 項目は Pro プランで送信されます。",
        deadlineSection: "締切の何分前",
        deadlineFreeHint: "Free は 30 分前のみ。Pro で 60 / 10 分前も選べます。",
        proBadge: "PRO",
        requesting: "確認中…",
      }
    : {
        title: "Notifications",
        description:
          "Choose which notifications you receive. They won't arrive if system notifications are off.",
        osSection: "Device notifications",
        osGranted: "Allowed",
        osDenied: "Off (change in system settings)",
        osUnknown: "Not set",
        osUnavailable: "Unavailable in this build",
        allowBtn: "Allow notifications",
        openSettingsBtn: "Open system settings",
        typesSection: "Basics",
        pregameSection: "Pregame alerts",
        pregameHint:
          "Only changes that warrant a recheck. Pro items are sent on a Pro plan.",
        deadlineSection: "Minutes before deadline",
        deadlineFreeHint: "Free is 30 min only. Pro unlocks 60 / 10 min.",
        proBadge: "PRO",
        requesting: "Checking…",
      };

  async function handleAllowPress() {
    setRequesting(true);
    try {
      const token = await registerNativePushTokenFlow();
      await refreshPermission();
      if (!token && permission !== "granted") {
        cyberAlert(
          "",
          isJa
            ? "通知を許可できませんでした。システム設定から変更できます。"
            : "Could not enable notifications. You can change this in system settings."
        );
      }
    } finally {
      setRequesting(false);
    }
  }

  async function handleOpenSettings() {
    try {
      await Linking.openSettings();
    } catch {
      cyberAlert(
        "",
        isJa ? "設定アプリを開けませんでした。" : "Could not open settings."
      );
    }
  }

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      void refreshPermission();
      if (uid) void registerNativePushTokenIfGranted();
    });
    return unsub;
  }, [navigation, refreshPermission, uid]);

  const osStatusLabel =
    permission === "granted"
      ? labels.osGranted
      : permission === "denied"
        ? labels.osDenied
        : permission === "unavailable"
          ? labels.osUnavailable
          : labels.osUnknown;

  function renderPrefRows(rows: PrefRow[]) {
    return rows.map((row, index) => (
      <View
        key={row.key}
        style={[styles.prefRow, index > 0 && styles.prefRowBorder]}
      >
        <View style={styles.prefTextCol}>
          <View style={styles.prefTitleRow}>
            <Text style={styles.prefTitle}>{isJa ? row.titleJa : row.titleEn}</Text>
            {row.proOnly ? (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>{labels.proBadge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.prefDesc}>{isJa ? row.descJa : row.descEn}</Text>
        </View>
        <Switch
          value={prefs[row.key]}
          onValueChange={(value) => void updatePref(row.key, value)}
          disabled={loading || !uid}
          trackColor={{
            false: "rgba(51,65,85,0.9)",
            true: "rgba(6,182,212,0.55)",
          }}
          thumbColor={
            Platform.OS === "android"
              ? prefs[row.key]
                ? "rgba(224,242,254,0.98)"
                : "rgba(148,163,184,0.95)"
              : undefined
          }
        />
      </View>
    ));
  }

  const deadlineOptions: PredictionDeadlineMinutes[] = isPro
    ? [...PREDICTION_DEADLINE_MINUTE_OPTIONS]
    : [30];

  return (
    <LegalPageLayoutNative title="ALERTS" description={labels.description}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{labels.osSection}</Text>
        <View style={styles.osRow}>
          <MaterialCommunityIcons
            name={
              permission === "granted"
                ? "bell-check-outline"
                : permission === "denied"
                  ? "bell-off-outline"
                  : "bell-outline"
            }
            size={18}
            color="rgba(103,232,249,0.9)"
          />
          <Text style={styles.osStatus}>{osStatusLabel}</Text>
        </View>
        {permission === "unknown" ? (
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]}
            onPress={() => void handleAllowPress()}
            disabled={requesting}
          >
            <Text style={styles.actionBtnText}>
              {requesting ? labels.requesting : labels.allowBtn}
            </Text>
          </Pressable>
        ) : null}
        {permission === "denied" ? (
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]}
            onPress={() => void handleOpenSettings()}
          >
            <Text style={styles.actionBtnText}>{labels.openSettingsBtn}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{labels.typesSection}</Text>
        {renderPrefRows(BASIC_PREF_ROWS)}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{labels.pregameSection}</Text>
        <Text style={styles.sectionHint}>{labels.pregameHint}</Text>
        {renderPrefRows(PREGAME_PREF_ROWS)}
        {prefs.predictionDeadline ? (
          <View style={styles.deadlineBlock}>
            <Text style={styles.deadlineLabel}>{labels.deadlineSection}</Text>
            {!isPro ? (
              <Text style={styles.sectionHint}>{labels.deadlineFreeHint}</Text>
            ) : null}
            <View style={styles.deadlineRow}>
              {deadlineOptions.map((minutes) => {
                const selected = prefs.predictionDeadlineMinutes === minutes;
                return (
                  <Pressable
                    key={minutes}
                    style={({ pressed }) => [
                      styles.deadlineChip,
                      selected && styles.deadlineChipOn,
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={() => void updateDeadlineMinutes(minutes)}
                    disabled={loading || !uid}
                  >
                    <Text
                      style={[
                        styles.deadlineChipText,
                        selected && styles.deadlineChipTextOn,
                      ]}
                    >
                      {minutes}
                      {isJa ? "分前" : "m"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>
    </LegalPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(9,14,24,0.92)",
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    color: "rgba(148,163,184,0.95)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionHint: {
    color: "rgba(148,163,184,0.78)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: -4,
  },
  osRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  osStatus: {
    color: "rgba(248,250,252,0.92)",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  actionBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.4)",
    backgroundColor: "rgba(6,182,212,0.12)",
    paddingVertical: 10,
    alignItems: "center",
  },
  actionBtnText: {
    color: "rgba(236,254,255,0.95)",
    fontSize: 13,
    fontWeight: "700",
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  prefRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  prefTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  prefTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  prefTitle: {
    color: "rgba(248,250,252,0.94)",
    fontSize: 14,
    fontWeight: "600",
  },
  prefDesc: {
    color: "rgba(148,163,184,0.88)",
    fontSize: 11,
    lineHeight: 16,
  },
  proBadge: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.55)",
    backgroundColor: "rgba(245,158,11,0.18)",
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  proBadgeText: {
    color: "rgba(253,230,138,0.98)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  deadlineBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 12,
    gap: 8,
  },
  deadlineLabel: {
    color: "rgba(226,232,240,0.92)",
    fontSize: 12,
    fontWeight: "700",
  },
  deadlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  deadlineChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    backgroundColor: "rgba(15,23,42,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deadlineChipOn: {
    borderColor: "rgba(103,232,249,0.65)",
    backgroundColor: "rgba(6,182,212,0.22)",
  },
  deadlineChipText: {
    color: "rgba(203,213,225,0.92)",
    fontSize: 12,
    fontWeight: "700",
  },
  deadlineChipTextOn: {
    color: "rgba(236,254,255,0.98)",
  },
});
