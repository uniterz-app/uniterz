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
import { L } from "../../../../../../lib/i18n/localize";
import { cyberAlert } from "../../../components/cyberAlert";
import { fetchMeReferralNative } from "../referralApiNative";
import {
  REFERRAL_INVITEE_UNITS,
  REFERRAL_MILESTONES,
  REFERRAL_REFERRER_MAX_COMPLETED,
  REFERRAL_REFERRER_MAX_UNITS,
  REFERRAL_REFERRER_UNITS_PER_COMPLETED,
  emptyReferralInviteSummary,
  type ReferralInviteSummary,
} from "../../../../../../lib/referral/referralRewards";
import ReferralStampBoardNative from "./ReferralStampBoardNative";
import {
  referralInviteProgressHint,
  referralInviteScreenCopy,
  referralInviteStatusLabel,
} from "../referralInviteCopy";

const OX = "Oxanium_700Bold";
const WEB_ORIGIN =
  process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ||
  "https://uniterz.app";

function qrImageUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=168x168&margin=8&data=${encodeURIComponent(data)}`;
}

export default function ReferralInviteScreenNative() {
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const inviteCopy = referralInviteScreenCopy(language);
  const lang = inviteCopy.lang;
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
        cyberAlert("", inviteCopy.copyFailed);
      }
    },
    [inviteCopy.copyFailed]
  );

  const share = useCallback(async () => {
    const message = inviteCopy.shareMessage(
      summary.inviteCode,
      summary.inviteUrl
    );
    try {
      await Share.share({ message, url: summary.inviteUrl });
    } catch {
      /* cancelled */
    }
  }, [inviteCopy, summary.inviteCode, summary.inviteUrl]);

  return (
    <LegalPageLayoutNative
      title="INVITE"
      eyebrow="PROFILE"
      description={inviteCopy.description}
    >
      {loading ? (
        <Text style={styles.loading}>
          {L(lang, { ja: "読み込み中…", en: "Loading…", ko: "불러오는 중…", zh: "加载中…", es: "Cargando…", pt: "Carregando…", fr: "Chargement…" })}
        </Text>
      ) : null}
      <View style={styles.stack}>
        {/* 共有（主役） */}
        <View style={styles.shareCard}>
          <View style={styles.shareHead}>
            <Text style={styles.sectionTitleCyan}>
              {L(lang, { ja: "招待を送る", en: "Send invite", ko: "초대 보내기", zh: "发送邀请", es: "Enviar invitación", pt: "Enviar convite", fr: "Envoyer une invitation" })}
            </Text>
            <Text style={styles.shareHeadMeta}>CODE · LINK · QR</Text>
          </View>

          <View style={styles.shareRow}>
            <View style={styles.shareCol}>
              <Text style={styles.fieldLabel}>
                {L(lang, { ja: "招待コード", en: "Invite code", ko: "초대 코드", zh: "邀请码", es: "Código de invitación", pt: "Código de convite", fr: "Code d’invitation" })}
              </Text>
              <View style={styles.codeRow}>
                <Text style={styles.code} numberOfLines={1}>
                  {summary.inviteCode}
                </Text>
                <Pressable
                  onPress={() =>
                    void copy(
                      summary.inviteCode,
                      inviteCopy.codeCopied
                    )
                  }
                  style={styles.copyAmber}
                >
                  <Text style={styles.copyAmberText}>
                    {L(lang, { ja: "コピー", en: "Copy", ko: "복사", zh: "复制", es: "Copiar", pt: "Copiar", fr: "Copier" })}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                {L(lang, { ja: "招待リンク", en: "Invite link", ko: "초대 링크", zh: "邀请链接", es: "Enlace de invitación", pt: "Link de convite", fr: "Lien d’invitation" })}
              </Text>
              <View style={styles.linkRow}>
                <Text style={styles.linkBox} numberOfLines={2}>
                  {summary.inviteUrl}
                </Text>
                <Pressable
                  onPress={() =>
                    void copy(
                      summary.inviteUrl,
                      inviteCopy.linkCopied
                    )
                  }
                  style={styles.ghostBtn}
                >
                  <Text style={styles.ghostBtnText}>
                    {L(lang, { ja: "コピー", en: "Copy", ko: "복사", zh: "复制", es: "Copiar", pt: "Copiar", fr: "Copier" })}
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
              {L(lang, { ja: "招待を共有", en: "Share invite", ko: "초대 공유", zh: "分享邀请", es: "Compartir invitación", pt: "Compartilhar convite", fr: "Partager l’invitation" })}
            </Text>
          </Pressable>
        </View>

        {/* 報酬（コンパクト） */}
        <View style={styles.rewardsCard}>
          <Text style={styles.sectionTitleMuted}>
            {L(lang, { ja: "報酬", en: "Rewards", ko: "보상", zh: "奖励", es: "Recompensas", pt: "Recompensas", fr: "Récompenses" })}
          </Text>
          <View style={styles.rewardGrid}>
            {(
              [
                [
                  inviteCopy.you,
                  `+${REFERRAL_REFERRER_UNITS_PER_COMPLETED}`,
                  inviteCopy.perClear,
                ],
                [
                  inviteCopy.friend,
                  `+${REFERRAL_INVITEE_UNITS}`,
                  inviteCopy.once,
                ],
                [
                  inviteCopy.bonus,
                  `+${REFERRAL_MILESTONES[0].bonusUnits}/+${REFERRAL_MILESTONES[1].bonusUnits}/+${REFERRAL_MILESTONES[2].bonusUnits}`,
                  "3 / 5 / 10",
                ],
                [
                  inviteCopy.cap,
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
          <Text style={styles.muted}>{inviteCopy.grantNote}</Text>
        </View>

        <View style={styles.statsGrid}>
          {(
            [
              [inviteCopy.active, summary.inProgressCount],
              [inviteCopy.review, summary.underReviewCount],
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
          language={lang}
        />

        <Text style={styles.sectionTitleMuted}>
          {L(lang, { ja: "招待の進捗", en: "Invite progress", ko: "초대 진행", zh: "邀请进度", es: "Progreso de invitaciones", pt: "Progresso dos convites", fr: "Progression des invitations" })}
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
                {referralInviteStatusLabel(row.status, lang)}
              </Text>
            </View>
            <Text style={styles.muted}>
              {referralInviteProgressHint(row, language)}
            </Text>
          </View>
        ))}
        <Text style={styles.footnote}>{inviteCopy.footnote}</Text>
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
