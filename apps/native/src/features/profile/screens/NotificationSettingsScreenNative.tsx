import { useCallback, useEffect, useMemo, useState } from "react";
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
import { canViewMonthlyReport } from "@/lib/reports/reportEntitlements";
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
import { notificationSettingsCopy } from "../notificationSettingsCopy";
import { L } from "@/lib/i18n/localize";

type PermissionState = "unknown" | "granted" | "denied" | "unavailable";

/** アプリ内通知設定（試合の進行 / Pro の見直し / 端末許可） */
export default function NotificationSettingsScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? null;
  const { language } = useNativeUserLanguageFromAuth();
  const labels = notificationSettingsCopy(language);
  const gateLanguage = labels.lang;
  const { isPro, plan, planType } = useNativeUserPlan(uid);
  const { prefs, loading, updatePref, updateDeadlineMinutes } =
    usePushNotificationPrefsNative(uid);
  const [permission, setPermission] = useState<PermissionState>("unknown");
  const [requesting, setRequesting] = useState(false);
  const [proGateOpen, setProGateOpen] = useState(false);

  const osReady = permission === "granted";
  const controlsEnabled = Boolean(uid) && !loading && osReady;
  const proRows = useMemo(() => {
    const showMonthly =
      !isPro || canViewMonthlyReport({ plan, planType });
    return showMonthly
      ? labels.proRows
      : labels.proRows.filter((row) => row.key !== "monthlyReport");
  }, [isPro, plan, planType, labels.proRows]);

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

  async function handleAllowPress() {
    setRequesting(true);
    try {
      const token = await registerNativePushTokenFlow();
      await refreshPermission();
      if (!token && permission !== "granted") {
        cyberAlert(
          "",
          L(labels.lang, {
            ja: "通知を許可できませんでした。システム設定から変更できます。",
            en: "Could not enable notifications. You can change this in system settings.",
            ko: "알림을 허용할 수 없습니다. 시스템 설정에서 변경할 수 있습니다.",
            zh: "无法启用通知。可在系统设置中更改。",
            es: "No se pudieron activar las notificaciones. Cámbialo en ajustes del sistema.",
            pt: "Não foi possível ativar as notificações. Altere nas configurações do sistema.",
            fr: "Impossible d’activer les notifications. Modifiez-les dans les réglages système.",
          })
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
      cyberAlert("", labels.openSettingsFail);
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

  function renderSwitchRows(
    rows: { key: (typeof labels.matchRows)[number]["key"]; title: string; desc: string }[],
    locked: boolean
  ) {
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
              ? L(labels.lang, {
                  ja: "Pro 限定です。プランの説明を開きます",
                  en: "Pro-only. Opens plan details",
                  ko: "Pro 전용입니다. 플랜 설명을 엽니다",
                  zh: "仅限 Pro。打开方案说明",
                  es: "Solo Pro. Abre detalles del plan",
                  pt: "Somente Pro. Abre detalhes do plano",
                  fr: "Réservé Pro. Ouvre les détails du plan",
                })
              : undefined
          }
        >
          <View style={styles.prefTextCol}>
            <Text style={[styles.prefTitle, locked && styles.prefMuted]}>
              {row.title}
            </Text>
            <Text style={styles.prefDesc}>{row.desc}</Text>
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
        {renderSwitchRows(labels.matchRows, false)}
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
                      {labels.minutesShort}
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
        {renderSwitchRows(proRows, !isPro)}
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
