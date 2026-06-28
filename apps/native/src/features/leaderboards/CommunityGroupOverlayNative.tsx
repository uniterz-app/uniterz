import { useCallback, useMemo, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { initialWindowMetrics, SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import type { Language } from "../../../../../lib/i18n/language";
import { t } from "../../../../../lib/i18n/t";
import CommunityGroupDetailViewNative from "./CommunityGroupDetailViewNative";
import type { CommunityGroupListPreview } from "./communityApiNative";
import { communityApiUrl, communityAuthHeader } from "./communityApiNative";
import { invalidateCommunityGroupDetail } from "./communityGroupDetailCacheNative";
import { CommunityModalBackdropNative } from "./CommunityCrtPartsNative";
import { communityPressableTapStyle } from "./communityCrtThemeNative";
import CommunityGroupDetailCardNative, {
  communityGroupOverlayTopInset,
} from "./CommunityGroupDetailCardNative";

type Props = {
  visible: boolean;
  groupId: string | null;
  listPreview: CommunityGroupListPreview | null;
  language: Language;
  onClose: () => void;
  onRefreshList?: () => void;
  onOpenProfile?: (handle: string, groupId: string) => void;
  getIdToken: () => Promise<string>;
};

export default function CommunityGroupOverlayNative({
  visible,
  groupId,
  listPreview,
  language,
  onClose,
  onRefreshList,
  onOpenProfile,
  getIdToken,
}: Props) {
  const insets = useSafeAreaInsets();
  const topInset = useMemo(() => communityGroupOverlayTopInset(insets.top), [insets.top]);
  const m = t(language);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [endConfirmName, setEndConfirmName] = useState("");
  const [endingGroup, setEndingGroup] = useState(false);
  const [headerImageEditing, setHeaderImageEditing] = useState(false);

  const confirmEndGroup = useCallback(async () => {
    if (!groupId) return;
    const h = await communityAuthHeader(getIdToken);
    if (!h) return;
    setEndingGroup(true);
    try {
      const res = await fetch(communityApiUrl(`/api/communities/${groupId}/archive`), {
        method: "POST",
        headers: { Authorization: h },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        cyberAlert("", String(json?.error ?? "failed"));
        return;
      }
      setEndConfirmOpen(false);
      cyberAlert("", language === "en" ? "Group ended." : "グループを終了しました。");
      invalidateCommunityGroupDetail(groupId);
      onRefreshList?.();
      onClose();
    } finally {
      setEndingGroup(false);
    }
  }, [groupId, language, onRefreshList, onClose, getIdToken]);

  if (!visible || !groupId) return null;

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <View style={styles.overlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={m.common.close} />
            <ScrollView
              style={styles.scroll}
              scrollEnabled={!headerImageEditing}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingTop: topInset + 4, paddingBottom: insets.bottom + 96 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <CommunityGroupDetailCardNative language={language} onBack={onClose}>
                <CommunityGroupDetailViewNative
                  groupId={groupId}
                  language={language}
                  listPreview={listPreview}
                  scrollEnabled={false}
                  inDetailCard
                  getIdToken={getIdToken}
                  onSummaryLoaded={(summary) => {
                    setEndConfirmName(summary.name);
                  }}
                  onExitAction={() => {
                    onRefreshList?.();
                    onClose();
                  }}
                  onRequestEndGroup={(name) => {
                    setEndConfirmName(name);
                    setEndConfirmOpen(true);
                  }}
                  onImageUpdated={onRefreshList}
                  onHeaderImageEditingChange={setHeaderImageEditing}
                  onOpenProfile={(handle) => {
                    onClose();
                    onOpenProfile?.(handle, groupId);
                  }}
                />
              </CommunityGroupDetailCardNative>
            </ScrollView>
          </View>
        </SafeAreaProvider>
      </Modal>

      <EndGroupConfirmModalNative
        visible={endConfirmOpen}
        groupName={endConfirmName || listPreview?.name}
        language={language}
        busy={endingGroup}
        onCancel={() => {
          if (!endingGroup) setEndConfirmOpen(false);
        }}
        onConfirm={() => void confirmEndGroup()}
      />
    </>
  );
}

function EndGroupConfirmModalNative({
  visible,
  groupName,
  language,
  busy,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  groupName?: string;
  language: Language;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const title = language === "en" ? "End this group?" : "グループを終了しますか？";
  const body =
    language === "en"
      ? `This will archive "${groupName ?? "this group"}". Members will no longer see it in active slots.`
      : `「${groupName ?? "このグループ"}」を終了します。メンバーはアクティブなスロットから非表示になります。`;

  return (
    <CommunityModalBackdropNative visible={visible} onClose={busy ? () => {} : onCancel}>
      <Text style={modalStyles.title}>{title}</Text>
      <Text style={modalStyles.body}>{body}</Text>
      <View style={modalStyles.actions}>
        <Pressable disabled={busy} onPress={onCancel} style={({ pressed }) => [modalStyles.cancelBtn, pressed && communityPressableTapStyle(true)]}>
          <Text style={modalStyles.cancelText}>{language === "en" ? "Cancel" : "キャンセル"}</Text>
        </Pressable>
        <Pressable disabled={busy} onPress={onConfirm} style={({ pressed }) => [modalStyles.confirmBtn, pressed && communityPressableTapStyle(true)]}>
          <Text style={modalStyles.confirmText}>{busy ? "…" : language === "en" ? "End group" : "終了する"}</Text>
        </Pressable>
      </View>
    </CommunityModalBackdropNative>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
});

const modalStyles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.72)",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelText: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  confirmBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.35)",
    backgroundColor: "rgba(244,63,94,0.15)",
    paddingVertical: 10,
    alignItems: "center",
  },
  confirmText: {
    color: "rgba(254,205,211,0.95)",
    fontWeight: "700",
  },
});
