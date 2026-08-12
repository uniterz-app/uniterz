/**
 * Web `ReferralInvitePage` 相当
 */
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import LegalPageLayoutNative from "../../legal/LegalPageLayoutNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import { cyberAlert } from "../../../components/cyberAlert";
import { fetchMeReferralNative } from "../referralApiNative";
import {
  REFERRAL_INVITEE_UNITS,
  REFERRAL_MILESTONES,
  REFERRAL_REFERRER_MAX_COMPLETED,
  REFERRAL_REFERRER_MAX_UNITS,
  REFERRAL_REFERRER_UNITS_PER_COMPLETED,
  emptyReferralInviteSummary,
  type ReferralInviteProgressRow,
  type ReferralInviteStatus,
  type ReferralInviteSummary,
} from "../../../../../../lib/referral/referralRewards";
import ReferralStampBoardNative from "./ReferralStampBoardNative";

const OX = "Oxanium_700Bold";
const WEB_ORIGIN =
  process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ||
  "https://uniterz.app";

function statusLabel(status: ReferralInviteStatus, isJa: boolean): string {
  if (isJa) {
    switch (status) {
      case "completed":
        return "達成";
      case "in_progress":
        return "進行中";
      case "under_review":
        return "確認中";
      case "registered":
        return "登録済";
      case "invalid":
        return "無効";
      case "fraud_rejected":
        return "対象外";
      case "withdrawn":
        return "退会";
      default:
        return status;
    }
  }
  switch (status) {
    case "completed":
      return "Done";
    case "in_progress":
      return "In progress";
    case "under_review":
      return "Review";
    case "registered":
      return "Registered";
    case "invalid":
      return "Invalid";
    case "fraud_rejected":
      return "Rejected";
    case "withdrawn":
      return "Left";
    default:
      return status;
  }
}

function progressHint(row: ReferralInviteProgressRow, isJa: boolean): string {
  if (row.status === "completed") {
    return isJa ? "条件達成・付与済" : "Completed";
  }
  if (row.status === "in_progress" || row.status === "registered") {
    const left = Math.max(0, 7 - row.activePredictDays);
    return isJa
      ? `予想投稿日数：${row.activePredictDays}／7日 / あと${left}日間の予想投稿で条件達成`
      : `Predict days: ${row.activePredictDays}/7 · ${left} more day(s) to qualify`;
  }
  return statusLabel(row.status, isJa);
}

function qrImageUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=168x168&margin=8&data=${encodeURIComponent(data)}`;
}

export default function ReferralInviteScreenNative() {
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const isJa = language === "ja";
  const [summary, setSummary] = useState<ReferralInviteSummary>(() =>
    emptyReferralInviteSummary()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = fUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const data = await fetchMeReferralNative();
        if (cancelled) return;
        const path = data.invitePath || data.inviteUrl || "";
        const inviteUrl = path.startsWith("http")
          ? path
          : `${WEB_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
        setSummary({
          inviteCode: data.inviteCode,
          inviteUrl,
          completedCount: data.completedCount,
          inProgressCount: data.inProgressCount,
          underReviewCount: data.underReviewCount,
          unitsFromBase: data.unitsFromBase,
          unitsFromMilestones: data.unitsFromMilestones,
          rows: data.rows ?? [],
        });
      } catch {
        if (!cancelled) setSummary(emptyReferralInviteSummary());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fUser?.uid]);

  const copy = useCallback(
    async (text: string, ok: string) => {
      try {
        await Clipboard.setStringAsync(text);
        cyberAlert("", ok, undefined, { variant: "success" });
      } catch {
        cyberAlert("", isJa ? "コピーに失敗しました" : "Copy failed");
      }
    },
    [isJa]
  );

  const share = useCallback(async () => {
    const message = isJa
      ? `Uniterz でスポーツ予想しよう。招待コード: ${summary.inviteCode}\n${summary.inviteUrl}`
      : `Join me on Uniterz. Invite code: ${summary.inviteCode}\n${summary.inviteUrl}`;
    try {
      await Share.share({ message, url: summary.inviteUrl });
    } catch {
      /* cancelled */
    }
  }, [isJa, summary.inviteCode, summary.inviteUrl]);

  return (
    <LegalPageLayoutNative
      title="INVITE"
      eyebrow="PROFILE"
      description={
        isJa
          ? "友達を招待して Unit を獲得。相手が7日分の予想を出すと双方に付与されます。"
          : "Invite friends for Units. Both earn when they predict on 7 different days."
      }
    >
      {loading ? (
        <Text style={styles.loading}>
          {isJa ? "読み込み中…" : "Loading…"}
        </Text>
      ) : null}
      <View style={styles.stack}>
        {/* 共有（主役） */}
        <View style={styles.shareCard}>
          <View style={styles.shareHead}>
            <Text style={styles.sectionTitleCyan}>
              {isJa ? "招待を送る" : "Send invite"}
            </Text>
            <Text style={styles.shareHeadMeta}>CODE · LINK · QR</Text>
          </View>

          <View style={styles.shareRow}>
            <View style={styles.shareCol}>
              <Text style={styles.fieldLabel}>
                {isJa ? "招待コード" : "Invite code"}
              </Text>
              <View style={styles.codeRow}>
                <Text style={styles.code} numberOfLines={1}>
                  {summary.inviteCode}
                </Text>
                <Pressable
                  onPress={() =>
                    void copy(
                      summary.inviteCode,
                      isJa ? "コードをコピーしました" : "Code copied"
                    )
                  }
                  style={styles.copyAmber}
                >
                  <Text style={styles.copyAmberText}>
                    {isJa ? "コピー" : "Copy"}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                {isJa ? "招待リンク" : "Invite link"}
              </Text>
              <View style={styles.linkRow}>
                <Text style={styles.linkBox} numberOfLines={2}>
                  {summary.inviteUrl}
                </Text>
                <Pressable
                  onPress={() =>
                    void copy(
                      summary.inviteUrl,
                      isJa ? "リンクをコピーしました" : "Link copied"
                    )
                  }
                  style={styles.ghostBtn}
                >
                  <Text style={styles.ghostBtnText}>
                    {isJa ? "コピー" : "Copy"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.qrWrap}>
              <Image
                source={{ uri: qrImageUrl(summary.inviteUrl) }}
                style={styles.qr}
              />
              <Text style={styles.qrCaption}>QR</Text>
            </View>
          </View>

          <Pressable onPress={() => void share()} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>
              {isJa ? "招待を共有" : "Share invite"}
            </Text>
          </Pressable>
        </View>

        {/* 報酬（コンパクト） */}
        <View style={styles.rewardsCard}>
          <Text style={styles.sectionTitleMuted}>
            {isJa ? "報酬" : "Rewards"}
          </Text>
          <View style={styles.rewardGrid}>
            {(
              [
                [
                  isJa ? "あなた" : "You",
                  `+${REFERRAL_REFERRER_UNITS_PER_COMPLETED}`,
                  isJa ? "1人達成ごと" : "per clear",
                ],
                [
                  isJa ? "友達" : "Friend",
                  `+${REFERRAL_INVITEE_UNITS}`,
                  isJa ? "1回のみ" : "once",
                ],
                [
                  isJa ? "区切り" : "Bonus",
                  `+${REFERRAL_MILESTONES[0].bonusUnits}/+${REFERRAL_MILESTONES[1].bonusUnits}/+${REFERRAL_MILESTONES[2].bonusUnits}`,
                  "3 / 5 / 10",
                ],
                [
                  isJa ? "上限" : "Cap",
                  String(REFERRAL_REFERRER_MAX_UNITS),
                  `${REFERRAL_REFERRER_MAX_COMPLETED} invites`,
                ],
              ] as const
            ).map(([label, value, hint]) => (
              <View key={label} style={styles.rewardCell}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.rewardValue}>
                  {value.split("").map((ch, i) =>
                    /\d/.test(ch) ? (
                      <Text key={`${i}-${ch}`} style={styles.rewardValueDigit}>
                        {ch}
                      </Text>
                    ) : (
                      <Text key={`${i}-${ch}`}>{ch}</Text>
                    )
                  )}
                  <Text style={styles.rewardUnit}> UNIT</Text>
                </Text>
                <Text style={styles.rewardHint}>
                  {hint.split("").map((ch, i) =>
                    /\d/.test(ch) ? (
                      <Text key={`${i}-${ch}`} style={styles.rewardHintDigit}>
                        {ch}
                      </Text>
                    ) : (
                      <Text key={`${i}-${ch}`}>{ch}</Text>
                    )
                  )}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.muted}>
            {isJa
              ? "付与は、友達が異なる7日に有効予想を投稿したあと。登録だけでは付きません。"
              : "Granted after the invitee posts on 7 different days. Signup alone does not count."}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {(
            [
              [isJa ? "進行中" : "Active", summary.inProgressCount],
              [isJa ? "確認中" : "Review", summary.underReviewCount],
            ] as const
          ).map(([label, value]) => (
            <View key={label} style={styles.statCell}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={styles.statValue}>{value}</Text>
            </View>
          ))}
        </View>

        <ReferralStampBoardNative
          completedCount={summary.completedCount}
          isJa={isJa}
        />

        <Text style={styles.sectionTitleMuted}>
          {isJa ? "招待の進捗" : "Invite progress"}
        </Text>
        {summary.rows.map((row) => (
          <View key={row.id} style={styles.rowCard}>
            <View style={styles.rowHead}>
              <View style={styles.rowLabelWrap}>
                {row.status === "completed" ? (
                  <View style={styles.checkBadge}>
                    <MaterialCommunityIcons
                      name="check"
                      size={12}
                      color="#F97316"
                    />
                  </View>
                ) : null}
                <Text style={styles.rowLabel} numberOfLines={1}>
                  {row.label}
                </Text>
              </View>
              <Text
                style={[
                  styles.rowStatus,
                  row.status === "completed" ? styles.rowStatusDone : null,
                ]}
              >
                {statusLabel(row.status, isJa)}
              </Text>
            </View>
            <Text style={styles.muted}>{progressHint(row, isJa)}</Text>
          </View>
        ))}
        <Text style={styles.footnote}>
          {isJa
            ? "※ プレビュー用モック。本番データ接続はこれから。"
            : "※ Preview mock. Live API comes next."}
        </Text>
      </View>
    </LegalPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  loading: {
    fontFamily: OX,
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  shareCard: {
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.25)",
    backgroundColor: "rgba(6,12,20,0.92)",
    padding: 12,
    gap: 12,
  },
  shareHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sectionTitleCyan: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "rgba(165,243,252,0.9)",
    textTransform: "uppercase",
  },
  sectionTitleMuted: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
  },
  shareHeadMeta: {
    fontFamily: OX,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.35)",
  },
  muted: { fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 16 },
  shareRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  shareCol: { flex: 1, minWidth: 0 },
  fieldLabel: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  codeRow: { flexDirection: "row", alignItems: "stretch", gap: 8 },
  code: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.35)",
    backgroundColor: "rgba(252,211,77,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: "rgba(254,243,199,0.95)",
    transform: [{ skewX: "-12deg" }],
  },
  copyAmber: {
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.3)",
    backgroundColor: "rgba(252,211,77,0.1)",
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  copyAmberText: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(254,243,199,0.9)",
    textTransform: "uppercase",
  },
  linkRow: { flexDirection: "row", alignItems: "stretch", gap: 8 },
  linkBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 11,
    color: "rgba(125,211,252,0.85)",
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  ghostBtnText: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
  },
  primaryBtn: {
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.5)",
    backgroundColor: "rgba(103,232,249,0.15)",
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: OX,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "rgba(236,254,255,0.95)",
    textTransform: "uppercase",
  },
  qrWrap: { width: 120, alignItems: "center", gap: 4 },
  qr: { width: 112, height: 112, backgroundColor: "#fff" },
  qrCaption: {
    fontFamily: OX,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.35)",
  },
  rewardsCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    gap: 10,
  },
  rewardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rewardCell: {
    width: "48%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rewardValue: {
    marginTop: 4,
    fontFamily: OX,
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(207,250,254,1)",
  },
  rewardUnit: {
    fontSize: 8,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
  },
  rewardHint: {
    marginTop: 2,
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
  },
  rewardValueDigit: {
    transform: [{ skewX: "-12deg" }],
  },
  rewardHintDigit: {
    transform: [{ skewX: "-12deg" }],
  },
  statsGrid: { flexDirection: "row", gap: 8 },
  statCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 10,
    alignItems: "center",
  },
  statLabel: {
    fontFamily: OX,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  statValue: {
    marginTop: 4,
    fontFamily: OX,
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  rowCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  rowHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  rowLabelWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(249,115,22,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  rowStatus: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(125,211,252,0.75)",
    textTransform: "uppercase",
  },
  rowStatusDone: {
    color: "rgba(249,115,22,0.9)",
  },
  footnote: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 },
});
