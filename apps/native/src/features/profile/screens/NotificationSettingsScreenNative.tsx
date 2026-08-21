import { useCallback, useEffect, useState } from "react";
import { cyberAlert } from "../../../components/cyberAlert";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  PREDICTION_DEADLINE_MINUTE_OPTIONS,
  isProOnlyPrefKey,
  type PredictionDeadlineMinutes,
  type PushNotificationPrefKey,
} from "@/lib/notifications/pushNotificationPrefs";
import LegalPageLayoutNative from "../../legal/LegalPageLayoutNative";
import ProCyberBadgeNative from "../kinetik/ProCyberBadgeNative";
import NotificationProGateModalNative from "./NotificationProGateModalNative";
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
import type { ProfileStackParamList } from "../../../navigation/types";

type PermissionState = "unknown" | "granted" | "denied" | "unavailable";

type PrefRow = {
  key: PushNotificationPrefKey;
  titleJa: string;
  titleEn: string;
  descJa: string;
  descEn: string;
};

const MATCH_PREF_ROWS: PrefRow[] = [
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
  {
    key: "predictionDeadline",
    titleJa: "予想締切",
    titleEn: "Prediction deadline",
    descJa: "未予想の試合だけ。締切前にお知らせ",
    descEn: "Unpredicted matches only — before the deadline",
  },
];

const PRO_PREF_ROWS: PrefRow[] = [
  {
    key: "injuryStatus",
    titleJa: "出場ステータス変更",
    titleEn: "Availability change",
    descJa: "欠場・復帰など、予想を見直すべき変化",
    descEn: "Out / return — changes that warrant a recheck",
  },
  {
    key: "starterChange",
    titleJa: "重要な先発変更",
    titleEn: "High-impact lineup change",
    descJa: "主力落ち・控え先発。通常の先発発表は送らない",
    descEn: "Starters dropped / bench starts — not every lineup",
  },
  {
    key: "pregameDigest",
    titleJa: "複数変化のまとめ",
    titleEn: "Pregame digest",
    descJa: "短時間の更新を1通にまとめる",
    descEn: "Bundle several updates into one notification",
  },
  {
    key: "proInsightUpdate",
    titleJa: "PRO INSIGHT 重要更新",
    titleEn: "PRO INSIGHT update",
    descJa: "結論が変わったときだけ",
    descEn: "Only when the conclusion changes",
  },
  {
    key: "monthlyReport",
    titleJa: "月次レポート",
    titleEn: "Monthly report",
    descJa: "月次レポートが確定したとき",
    descEn: "When your monthly report is ready",
  },
];

/** アプリ内通知設定（試合の進行 / Pro の見直し / 端末許可） */
export default function NotificationSettingsScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? null;
  const { language } = useNativeUserLanguageFromAuth();
  const isJa = language === "ja";
  const gateLanguage = isJa ? "ja" : "en";
  const { isPro } = useNativeUserPlan(uid);
  const { prefs, loading, updatePref, updateDeadlineMinutes } =
    usePushNotificationPrefsNative(uid);
  const [permission, setPermission] = useState<PermissionState>("unknown");
  const [requesting, setRequesting] = useState(false);
  const [proGateOpen, setProGateOpen] = useState(false);

  const osReady = permission === "granted";
  const controlsEnabled = Boolean(uid) && !loading && osReady;

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
        matchSection: "試合の進行",
        matchHint: "予想した試合の開始・結果・ランキングと、未予想の締切。",
        deadlineSection: "締切の何分前",
        deadlineFreeHint: "Free は 30 分前。60 / 10 分前は Pro。",
        reviewSection: "予想を見直す",
        reviewHintPro: "欠場・先発など、予想を直すべき変化だけ。",
        reviewHintFree:
          "欠場・先発・Insight・月次レポートは Pro で届きます。",
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
        matchSection: "Match progress",
        matchHint: "Start, result, and rankings for matches you predicted — plus deadlines you haven't entered.",
        deadlineSection: "Minutes before deadline",
        deadlineFreeHint: "Free is 30 min. Pro unlocks 60 / 10.",
        reviewSection: "Recheck alerts",
        reviewHintPro: "Only changes that warrant editing a prediction.",
        reviewHintFree:
          "Availability, lineup, Insight, and monthly report are Pro.",
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

  function openProGate() {
    setProGateOpen(true);
  }

  function handlePrefChange(key: PushNotificationPrefKey, value: boolean) {
    if (!controlsEnabled) return;
    if (isProOnlyPrefKey(key) && !isPro) {
      openProGate();
      return;
    }
    void updatePref(key, value);
  }

  function handleDeadline(minutes: PredictionDeadlineMinutes) {
    if (!isPro && minutes !== 30) {
      openProGate();
      return;
    }
    if (!controlsEnabled) return;
    void updateDeadlineMinutes(minutes);
  }

  function renderSwitchRows(rows: PrefRow[], locked: boolean) {
    return rows.map((row, index) => {
      const switchEl = (
        <Switch
          value={locked ? false : prefs[row.key]}
          onValueChange={(value) => handlePrefChange(row.key, value)}
          disabled={!controlsEnabled && !locked}
          trackColor={{
            false: "rgba(51,65,85,0.9)",
            true: "rgba(6,182,212,0.55)",
          }}
          thumbColor={
            Platform.OS === "android"
              ? !locked && prefs[row.key]
                ? "rgba(224,242,254,0.98)"
                : "rgba(148,163,184,0.95)"
              : undefined
          }
        />
      );

      return (
        <Pressable
          key={row.key}
          style={[styles.prefRow, index > 0 && styles.prefRowBorder]}
          onPress={locked ? openProGate : undefined}
          disabled={!locked}
          accessibilityRole={locked ? "button" : undefined}
          accessibilityHint={
            locked
              ? isJa
                ? "Pro 限定です。プランの説明を開きます"
                : "Pro-only. Opens plan details"
              : undefined
          }
        >
          <View style={styles.prefTextCol}>
            <Text style={[styles.prefTitle, locked && styles.prefMuted]}>
              {isJa ? row.titleJa : row.titleEn}
            </Text>
            <Text style={styles.prefDesc}>{isJa ? row.descJa : row.descEn}</Text>
          </View>
          {locked ? <View pointerEvents="none">{switchEl}</View> : switchEl}
        </Pressable>
      );
    });
  }

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

      <View style={[styles.card, !osReady && styles.cardDimmed]}>
        <Text style={styles.sectionTitle}>{labels.matchSection}</Text>
        <Text style={styles.sectionHint}>{labels.matchHint}</Text>
        {renderSwitchRows(MATCH_PREF_ROWS, false)}
        {prefs.predictionDeadline ? (
          <View style={styles.deadlineBlock}>
            <Text style={styles.deadlineLabel}>{labels.deadlineSection}</Text>
            {!isPro ? (
              <Text style={styles.sectionHint}>{labels.deadlineFreeHint}</Text>
            ) : null}
            <View style={styles.deadlineRow}>
              {PREDICTION_DEADLINE_MINUTE_OPTIONS.map((minutes) => {
                const selected = prefs.predictionDeadlineMinutes === minutes;
                const locked = !isPro && minutes !== 30;
                return (
                  <Pressable
                    key={minutes}
                    style={({ pressed }) => [
                      styles.deadlineChip,
                      selected && styles.deadlineChipOn,
                      locked && styles.deadlineChipLocked,
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={() => handleDeadline(minutes)}
                    disabled={!controlsEnabled && !locked}
                  >
                    <Text
                      style={[
                        styles.deadlineChipText,
                        selected && styles.deadlineChipTextOn,
                        locked && styles.deadlineChipTextLocked,
                      ]}
                    >
                      {minutes}
                      {isJa ? "分前" : "m"}
                    </Text>
                    {locked ? (
                      <View style={styles.chipBadge} pointerEvents="none">
                        <ProCyberBadgeNative compact />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      <View style={[styles.card, !osReady && styles.cardDimmed]}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{labels.reviewSection}</Text>
          <ProCyberBadgeNative compact />
        </View>
        <Text style={styles.sectionHint}>
          {isPro ? labels.reviewHintPro : labels.reviewHintFree}
        </Text>
        {renderSwitchRows(PRO_PREF_ROWS, !isPro)}
      </View>

      <NotificationProGateModalNative
        visible={proGateOpen}
        language={gateLanguage}
        onClose={() => setProGateOpen(false)}
        onSeePro={() => {
          setProGateOpen(false);
          navigation.navigate("ProSubscribe");
        }}
      />
    </LegalPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.18)",
    backgroundColor: "rgba(0,0,0,0.28)",
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  cardDimmed: {
    opacity: 0.42,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.52)",
    backgroundColor: "rgba(0,190,230,0.28)",
    paddingVertical: 12,
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
  prefTitle: {
    color: "rgba(248,250,252,0.94)",
    fontSize: 14,
    fontWeight: "600",
  },
  prefMuted: {
    color: "rgba(226,232,240,0.62)",
  },
  prefDesc: {
    color: "rgba(148,163,184,0.88)",
    fontSize: 11,
    lineHeight: 16,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deadlineChipOn: {
    borderColor: "rgba(103,232,249,0.65)",
    backgroundColor: "rgba(6,182,212,0.22)",
  },
  deadlineChipLocked: {
    borderColor: "rgba(251,191,36,0.28)",
    backgroundColor: "rgba(15,23,42,0.4)",
  },
  deadlineChipText: {
    color: "rgba(203,213,225,0.92)",
    fontSize: 12,
    fontWeight: "700",
  },
  deadlineChipTextOn: {
    color: "rgba(236,254,255,0.98)",
  },
  deadlineChipTextLocked: {
    color: "rgba(148,163,184,0.72)",
  },
  chipBadge: {
    transform: [{ scale: 0.78 }, { translateY: 1 }],
  },
});
