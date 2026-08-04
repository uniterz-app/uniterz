/**
 * Web `RedemptionProgressPage` 相当
 */
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import LegalPageLayoutNative from "../../legal/LegalPageLayoutNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import type { ProfileStackParamList } from "../../../navigation/types";
import {
  cancelMeRedemptionNative,
  fetchMeRedemptionNative,
  submitMeRedemptionDraftNative,
} from "../redemptionApiNative";
import {
  REDEMPTION_PROGRESS_STEPS,
  canUserCancelRedemption,
  progressStepIndex,
  redemptionStatusLabel,
} from "../../../../../../lib/redemption/redemptionStatus";
import { redemptionBatchScheduleCopy } from "../../../../../../lib/redemption/redemptionBatchScheduleCopy";
import type { RedemptionRequest } from "../../../../../../lib/redemption/redemptionTypes";

const OX = "Oxanium_700Bold";

export default function RedemptionProgressScreenNative() {
  const route = useRoute<RouteProp<ProfileStackParamList, "RedeemProgress">>();
  const id = route.params?.id ?? "";
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const isJa = language === "ja";
  const gateLang = isJa ? "ja" : "en";
  const batch = redemptionBatchScheduleCopy(gateLang);

  const [request, setRequest] = useState<RedemptionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!fUser?.uid || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRequest(await fetchMeRedemptionNative(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, [fUser?.uid, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const stepIdx = request ? progressStepIndex(request.status) : -1;
  const terminalBad =
    request?.status === "cancelled" || request?.status === "rejected";

  return (
    <LegalPageLayoutNative
      title="TRACK"
      eyebrow="UNIT EXCHANGE"
      description={
        isJa
          ? "購入は月末まとめ（おおよそ25日前後）。"
          : "Purchase is batched near month-end (~25th)."
      }
    >
      <View style={styles.batchCard}>
        <Text style={styles.batchBody}>{batch.detail}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#67e8f9" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !request ? (
        <Text style={styles.muted}>
          {isJa ? "申請が見つかりません。" : "Not found."}
        </Text>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.title}>{request.productName}</Text>
            <Text style={styles.meta}>
              {redemptionStatusLabel(request.status, gateLang)} ·{" "}
              {request.unitsRequired} Unit
            </Text>
            {request.status === "pending" ||
            request.status === "needs_revision" ? (
              <Text style={styles.hint}>{batch.pendingHint}</Text>
            ) : null}
            {request.status === "approved" ? (
              <Text style={styles.hint}>{batch.approvedHint}</Text>
            ) : null}
            {request.trackingNumber ? (
              <Text style={styles.track}>
                {request.trackingCarrier ?? "—"} {request.trackingNumber}
              </Text>
            ) : null}
            {request.adminNote ? (
              <Text style={styles.note}>{request.adminNote}</Text>
            ) : null}
          </View>

          {!terminalBad
            ? REDEMPTION_PROGRESS_STEPS.map((step, i) => {
                const done = stepIdx >= i;
                const current = stepIdx === i;
                return (
                  <View
                    key={step}
                    style={[
                      styles.step,
                      current && styles.stepCurrent,
                      done && !current && styles.stepDone,
                    ]}
                  >
                    <Text style={styles.stepNum}>
                      {String(i + 1).padStart(2, "0")}
                    </Text>
                    <Text style={styles.stepLabel}>
                      {redemptionStatusLabel(step, gateLang)}
                    </Text>
                  </View>
                );
              })
            : (
              <Text style={styles.bad}>
                {redemptionStatusLabel(request.status, gateLang)}
              </Text>
            )}

          <Text style={styles.section}>{isJa ? "履歴" : "Timeline"}</Text>
          {[...request.timeline].reverse().map((ev, i) => (
            <Text key={`${ev.status}-${ev.atMs}-${i}`} style={styles.timeline}>
              {ev.atMs
                ? new Date(ev.atMs).toLocaleDateString(
                    isJa ? "ja-JP" : "en-US",
                    { month: "short", day: "numeric" }
                  )
                : "—"}{" "}
              · {redemptionStatusLabel(ev.status, gateLang)}
              {ev.note ? ` — ${ev.note}` : ""}
            </Text>
          ))}

          <View style={styles.actions}>
            {request.status === "draft" ? (
              <Pressable
                disabled={busy}
                style={styles.primaryBtn}
                onPress={() => {
                  setBusy(true);
                  void submitMeRedemptionDraftNative(request.id)
                    .then(setRequest)
                    .catch((e) =>
                      setError(e instanceof Error ? e.message : "error")
                    )
                    .finally(() => setBusy(false));
                }}
              >
                <Text style={styles.primaryBtnText}>
                  {isJa ? "申請を送信" : "Submit draft"}
                </Text>
              </Pressable>
            ) : null}
            {canUserCancelRedemption(request.status) ? (
              <Pressable
                disabled={busy}
                style={styles.dangerBtn}
                onPress={() => {
                  setBusy(true);
                  void cancelMeRedemptionNative(request.id)
                    .then(setRequest)
                    .catch((e) =>
                      setError(e instanceof Error ? e.message : "error")
                    )
                    .finally(() => setBusy(false));
                }}
              >
                <Text style={styles.dangerBtnText}>
                  {isJa ? "取り消す" : "Cancel"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </>
      )}
    </LegalPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  batchCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(103,232,249,0.3)",
    backgroundColor: "rgba(34,211,238,0.06)",
  },
  batchBody: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(236,254,255,0.85)",
  },
  card: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(4,9,16,0.97)",
  },
  title: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.9)" },
  meta: { marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.5)" },
  hint: { marginTop: 8, fontSize: 12, color: "rgba(165,243,252,0.85)" },
  track: { marginTop: 8, fontSize: 12, color: "rgba(165,243,252,0.9)" },
  note: { marginTop: 8, fontSize: 12, color: "rgba(253,230,138,0.85)" },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  stepCurrent: {
    borderColor: "rgba(103,232,249,0.4)",
    backgroundColor: "rgba(34,211,238,0.1)",
  },
  stepDone: {
    borderColor: "rgba(110,231,183,0.25)",
    backgroundColor: "rgba(52,211,153,0.05)",
  },
  stepNum: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(110,231,183,0.9)",
  },
  stepLabel: { fontSize: 13, color: "rgba(255,255,255,0.85)" },
  bad: {
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(251,113,133,0.35)",
    backgroundColor: "rgba(244,63,94,0.1)",
    color: "rgba(255,228,230,0.9)",
    marginBottom: 12,
  },
  section: {
    marginTop: 12,
    marginBottom: 8,
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.55)",
  },
  timeline: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6 },
  actions: { flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 24 },
  primaryBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(103,232,249,0.4)",
    backgroundColor: "rgba(34,211,238,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryBtnText: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    color: "#ecfeff",
  },
  dangerBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(251,113,133,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dangerBtnText: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(254,205,211,0.9)",
  },
  muted: { fontSize: 13, color: "rgba(255,255,255,0.45)" },
  error: { fontSize: 13, color: "rgba(253,164,175,0.9)" },
});
