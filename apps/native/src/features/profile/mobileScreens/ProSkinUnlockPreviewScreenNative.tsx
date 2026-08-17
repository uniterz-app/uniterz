/**
 * Web `/mobile/pro-skin-unlock-preview` 相当。
 * マイルストーン解放モーダルのデザイン確認用。
 */
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import ProfileProSkinUnlockOverlayNative from "../reports/ProfileProSkinUnlockOverlayNative";
import { PRO_SKIN_UNLOCK_NOTICE_PREVIEW_IDS } from "../../../../../../lib/profile/proSkinUnlockNotice";
import {
  parseProSkinOwnerCounts,
  PRO_SKIN_OWNER_COUNTS_DOC_PATH,
} from "../../../../../../lib/profile/proSkinOwnerCountsClient";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  onForceOnProfile?: () => void;
};

export default function ProSkinUnlockPreviewScreenNative({
  language,
  onClose,
  onForceOnProfile,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(true);
  const [ownerCounts, setOwnerCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const snap = await getDoc(doc(db, PRO_SKIN_OWNER_COUNTS_DOC_PATH));
        if (!alive) return;
        setOwnerCounts(
          snap.exists() ? parseProSkinOwnerCounts(snap.data()) : {}
        );
      } catch {
        if (!alive) return;
        setOwnerCounts({});
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.eyebrow}>PREVIEW</Text>
      <Text style={styles.title}>Pro Skin Unlock Modal</Text>
      <Text style={styles.desc}>
        {isJa
          ? "解放モーダルのヒーローに実際のスキン模様を1枚表示。"
          : "Unlock modal hero shows the real skin pattern."}
      </Text>

      <View style={styles.actions}>
        <Pressable style={styles.primaryBtn} onPress={() => setOpen(true)}>
          <Text style={styles.primaryBtnText}>
            {isJa ? "モーダルを表示" : "Show modal"}
          </Text>
        </Pressable>
        {onForceOnProfile ? (
          <Pressable style={styles.secondaryBtn} onPress={onForceOnProfile}>
            <Text style={styles.secondaryBtnText}>
              {isJa ? "プロフィールで表示" : "Show on profile"}
            </Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.ghostBtn} onPress={onClose}>
          <Text style={styles.ghostBtnText}>{isJa ? "とじる" : "Close"}</Text>
        </Pressable>
      </View>

      {!open ? (
        <Text style={styles.hint}>
          {isJa
            ? "モーダルは閉じています。「モーダルを表示」で再表示。"
            : "Modal closed. Tap Show modal to reopen."}
        </Text>
      ) : null}

      <ProfileProSkinUnlockOverlayNative
        unlockedIds={[...PRO_SKIN_UNLOCK_NOTICE_PREVIEW_IDS]}
        language={language}
        preview
        visible={open}
        ownerCounts={ownerCounts}
        onDismiss={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#03080d",
    paddingHorizontal: 16,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    color: "rgba(103,232,249,0.85)",
  },
  title: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  desc: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.5)",
  },
  actions: {
    marginTop: 20,
    gap: 8,
  },
  primaryBtn: {
    borderWidth: 2,
    borderColor: CYBER_TAB_CYAN,
    backgroundColor: CYBER_TAB_CYAN,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#050508",
    textTransform: "uppercase",
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.85)",
    textTransform: "uppercase",
  },
  ghostBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  ghostBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
  },
  hint: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
  },
});
