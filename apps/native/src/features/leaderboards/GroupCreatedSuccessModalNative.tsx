import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Language } from "../../../../../lib/i18n/language";
import { buildCommunityInviteShareText } from "../../../../../lib/communities/inviteShare";
import { getShareAppOrigin } from "../../../../../lib/share/shareAppUrls";
import { CommunityModalBackdropNative } from "./CommunityCrtPartsNative";
import { copyTextNative, shareTextNative } from "./copyTextNative";
import { communityMono, communityPressableTapStyle } from "./communityCrtThemeNative";

type Props = {
  visible: boolean;
  inviteCode: string;
  groupName?: string;
  language: Language;
  onClose: () => void;
};

export default function GroupCreatedSuccessModalNative({
  visible,
  inviteCode,
  groupName,
  language,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);

  const t =
    language === "en"
      ? {
          title: "Group created",
          body: groupName
            ? `"${groupName}" is ready. Share this invite code so friends can join.`
            : "Share this invite code so friends can join.",
          inviteLabel: "Invite code",
          copied: "Copied to clipboard",
          copy: "Copy code",
          share: "Share invite",
          ok: "OK",
        }
      : {
          title: "作成しました",
          body: groupName
            ? `「${groupName}」を作成しました。友達に招待コードを共有して参加してもらいましょう。`
            : "友達に招待コードを共有して参加してもらいましょう。",
          inviteLabel: "招待コード",
          copied: "クリップボードにコピーしました",
          copy: "コードをコピー",
          share: "招待を共有",
          ok: "OK",
        };

  async function onCopy() {
    const ok = await copyTextNative(inviteCode);
    if (ok) setCopied(true);
  }

  async function onShare() {
    const base = buildCommunityInviteShareText({ inviteCode, groupName, language });
    const origin = getShareAppOrigin();
    const message = base.includes(origin) ? base : `${base}\n\n${origin}`;
    await shareTextNative(t.share, message);
  }

  if (!inviteCode) return null;

  return (
    <CommunityModalBackdropNative visible={visible} onClose={onClose}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="check" size={28} color="rgba(147,197,253,0.95)" />
      </View>
      <Text style={styles.title}>{t.title}</Text>
      <Text style={styles.body}>{t.body}</Text>
      <Text style={styles.inviteLabel}>{t.inviteLabel}</Text>
      <Text style={styles.inviteCode}>{inviteCode}</Text>
      {copied ? <Text style={styles.copied}>{t.copied}</Text> : null}
      <View style={styles.row}>
        <Pressable onPress={() => void onShare()} style={({ pressed }) => [styles.shareBtn, pressed && communityPressableTapStyle(true)]}>
          <MaterialCommunityIcons name="share-variant" size={16} color="rgba(219,234,254,0.95)" />
          <Text style={styles.shareText}>{t.share}</Text>
        </Pressable>
        <Pressable onPress={() => void onCopy()} style={({ pressed }) => [styles.copyBtn, pressed && communityPressableTapStyle(true)]}>
          <MaterialCommunityIcons name="content-copy" size={16} color="rgba(255,255,255,0.9)" />
          <Text style={styles.copyText}>{t.copy}</Text>
        </Pressable>
      </View>
      <Pressable onPress={onClose} style={({ pressed }) => [styles.okBtn, pressed && communityPressableTapStyle(true)]}>
        <Text style={styles.okText}>{t.ok}</Text>
      </Pressable>
    </CommunityModalBackdropNative>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignSelf: "center",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(59,130,246,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },
  inviteLabel: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  inviteCode: {
    marginTop: 4,
    textAlign: "center",
    fontFamily: communityMono,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 4,
    color: "#fff",
  },
  copied: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
    color: "rgba(110,231,183,0.9)",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.35)",
    backgroundColor: "rgba(59,130,246,0.2)",
    paddingVertical: 10,
  },
  shareText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(219,234,254,0.95)",
  },
  copyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 10,
  },
  copyText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  okBtn: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,1)",
    paddingVertical: 10,
    alignItems: "center",
  },
  okText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
