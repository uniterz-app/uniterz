/**
 * Web `ModerationSheet` 相当 — ユーザー / グループの通報・ブロック（App Store 1.2）。
 * 完了表示までシート内で完結（cyberAlert は Modal の裏に出るため使わない）。
 */
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { resolveLocalizedLang } from "../../../../../lib/i18n/localize";
import { moderationCopy } from "../../../../../lib/moderation/moderationCopy";
import {
  MODERATION_REPORT_REASONS,
  type ModerationReportReason,
  type ModerationTargetType,
} from "../../../../../lib/moderation/moderationTypes";
import { submitModerationReportNative } from "./reportApiNative";
import {
  blockUserNative,
  unblockUserNative,
  useBlockedUidsNative,
} from "./blockedUsersStoreNative";

type Step =
  | { kind: "menu" }
  | { kind: "reasons" }
  | { kind: "blockConfirm" }
  | { kind: "sending" }
  | { kind: "done"; title: string; body?: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  targetType: ModerationTargetType;
  targetId: string;
  /** 見出し（@handle / グループ名） */
  targetLabel: string;
  language: string | null | undefined;
  /** ブロック完了後（プロフィールを閉じる等） */
  onBlocked?: () => void;
};

type Tone = "accent" | "danger" | "ghost";

const TONE: Record<Tone, { border: string; text: string; pressed: string }> = {
  accent: {
    border: "rgba(0,245,255,0.55)",
    text: "#a5f3fc",
    pressed: "rgba(0,245,255,0.12)",
  },
  danger: {
    border: "rgba(248,113,113,0.55)",
    text: "#fca5a5",
    pressed: "rgba(248,113,113,0.12)",
  },
  ghost: {
    border: "rgba(255,255,255,0.16)",
    text: "rgba(248,250,252,0.72)",
    pressed: "rgba(255,255,255,0.08)",
  },
};

function ActionRow({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone: Tone;
  onPress: () => void;
}) {
  const t = TONE[tone];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.action,
        { borderColor: t.border },
        pressed && { backgroundColor: t.pressed },
      ]}
    >
      <Text style={[styles.actionLabel, { color: t.text }]}>{label}</Text>
    </Pressable>
  );
}

export default function ModerationSheetNative({
  visible,
  onClose,
  targetType,
  targetId,
  targetLabel,
  language,
  onBlocked,
}: Props) {
  const copy = useMemo(
    () => moderationCopy(resolveLocalizedLang(language)),
    [language]
  );
  const blockedUids = useBlockedUidsNative();
  const isBlocked = targetType === "user" && blockedUids.has(targetId);
  const initialStep: Step =
    targetType === "group" ? { kind: "reasons" } : { kind: "menu" };
  const [step, setStep] = useState<Step>(initialStep);
  const [afterDone, setAfterDone] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (visible) {
      setStep(targetType === "group" ? { kind: "reasons" } : { kind: "menu" });
      setAfterDone(null);
    }
  }, [visible, targetType]);

  const close = () => {
    if (step.kind === "sending") return;
    onClose();
    afterDone?.();
  };

  const sendReport = async (reason: ModerationReportReason) => {
    setStep({ kind: "sending" });
    const result = await submitModerationReportNative({
      targetType,
      targetId,
      reason,
    });
    setStep(
      result === "ok"
        ? { kind: "done", title: copy.reportDoneTitle, body: copy.reportDoneBody }
        : {
            kind: "done",
            title: result === "rate_limited" ? copy.rateLimited : copy.failed,
          }
    );
  };

  const doBlock = async () => {
    setStep({ kind: "sending" });
    const ok = await blockUserNative(targetId);
    if (ok) setAfterDone(() => onBlocked ?? null);
    setStep(
      ok
        ? { kind: "done", title: copy.blockDoneTitle, body: copy.blockDoneBody }
        : { kind: "done", title: copy.failed }
    );
  };

  const doUnblock = async () => {
    setStep({ kind: "sending" });
    const ok = await unblockUserNative(targetId);
    setStep({ kind: "done", title: ok ? copy.unblockDoneTitle : copy.failed });
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={close}
      statusBarTranslucent
    >
      <Pressable style={styles.root} onPress={close}>
        <View style={styles.scrim} pointerEvents="none" />
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {targetLabel ? (
            <Text style={styles.target} numberOfLines={1}>
              {targetLabel}
            </Text>
          ) : null}

          {step.kind === "menu" ? (
            <View style={styles.actions}>
              <ActionRow
                label={copy.report}
                tone="accent"
                onPress={() => setStep({ kind: "reasons" })}
              />
              <ActionRow
                label={isBlocked ? copy.unblock : copy.block}
                tone="danger"
                onPress={() =>
                  isBlocked
                    ? void doUnblock()
                    : setStep({ kind: "blockConfirm" })
                }
              />
              <ActionRow label={copy.cancel} tone="ghost" onPress={close} />
            </View>
          ) : null}

          {step.kind === "reasons" ? (
            <>
              <Text style={styles.title}>{copy.reasonTitle}</Text>
              <View style={styles.actions}>
                {MODERATION_REPORT_REASONS.map((reason) => (
                  <ActionRow
                    key={reason}
                    label={copy.reasons[reason]}
                    tone="accent"
                    onPress={() => void sendReport(reason)}
                  />
                ))}
                <ActionRow label={copy.cancel} tone="ghost" onPress={close} />
              </View>
            </>
          ) : null}

          {step.kind === "blockConfirm" ? (
            <>
              <Text style={styles.title}>{copy.blockConfirmTitle}</Text>
              <Text style={styles.body}>{copy.blockConfirmBody}</Text>
              <View style={styles.actions}>
                <ActionRow
                  label={copy.block}
                  tone="danger"
                  onPress={() => void doBlock()}
                />
                <ActionRow label={copy.cancel} tone="ghost" onPress={close} />
              </View>
            </>
          ) : null}

          {step.kind === "sending" ? (
            <ActivityIndicator style={styles.spinner} color="#00f5ff" />
          ) : null}

          {step.kind === "done" ? (
            <>
              <Text style={styles.title}>{step.title}</Text>
              {step.body ? <Text style={styles.body}>{step.body}</Text> : null}
              <View style={styles.actions}>
                <ActionRow label={copy.close} tone="ghost" onPress={close} />
              </View>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  target: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(248,250,252,0.96)",
    textAlign: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(248,250,252,0.96)",
    textAlign: "center",
  },
  body: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(148,163,184,0.94)",
    textAlign: "center",
  },
  actions: {
    marginTop: 16,
    gap: 10,
  },
  action: {
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 14,
    letterSpacing: 0.6,
  },
  spinner: {
    marginVertical: 24,
  },
});
