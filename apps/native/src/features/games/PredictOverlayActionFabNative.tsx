/**
 * 予想オーバーレイ左上 — Web mobile `CyberMenuButton` + 左フライアウト
 */
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import CornerMenuClusterNative from "../../ui/CornerMenuClusterNative";
import CyberChamferButtonNative from "../../ui/CyberChamferButtonNative";

type Props = {
  showClose?: boolean;
  onClose?: () => void;
  closeLabel?: string;
  showEdit?: boolean;
  showShare?: boolean;
  onEdit?: () => void;
  onShare?: () => void;
  menuLabel: string;
  editLabel: string;
  shareLabel: string;
};

export default function PredictOverlayActionFabNative({
  showClose = false,
  onClose,
  closeLabel = "Close",
  showEdit = false,
  showShare = false,
  onEdit,
  onShare,
  menuLabel,
  editLabel,
  shareLabel,
}: Props) {
  const [open, setOpen] = useState(false);

  const hasClose = Boolean(showClose && onClose);
  const hasShare = Boolean(showShare && onShare);
  const hasEdit = Boolean(showEdit && onEdit);
  const hasFlyout = hasClose || hasShare || hasEdit;

  useEffect(() => {
    if (!hasFlyout) {
      setOpen(false);
    }
  }, [hasFlyout]);

  if (!hasFlyout) return null;

  // 予想前など close のみ — ハンバーガーではなく × だけ
  if (hasClose && !hasShare && !hasEdit) {
    return (
      <View style={styles.root} pointerEvents="box-none">
        <CyberChamferButtonNative
          size="xs"
          embedded
          variant="close"
          onPress={() => onClose?.()}
          accessibilityLabel={closeLabel}
        />
      </View>
    );
  }

  return (
    <View style={styles.root} pointerEvents="box-none">
      <CornerMenuClusterNative
        open={open}
        onToggle={() => setOpen((v) => !v)}
        menuLabel={menuLabel}
        horizontalFlyout="right"
        sideFlyout={
        <>
          {hasClose ? (
            <CyberChamferButtonNative
              size="xs"
              embedded
              variant="close"
              onPress={() => {
                setOpen(false);
                onClose?.();
              }}
              accessibilityLabel={closeLabel}
            />
          ) : null}
          {hasShare ? (
            <CyberChamferButtonNative
              size="xs"
              embedded
              variant="share"
              onPress={() => {
                setOpen(false);
                onShare?.();
              }}
              accessibilityLabel={shareLabel}
            />
          ) : null}
          {hasEdit ? (
            <CyberChamferButtonNative
              size="xs"
              embedded
              variant="edit"
              onPress={() => {
                setOpen(false);
                onEdit?.();
              }}
              accessibilityLabel={editLabel}
            />
          ) : null}
        </>
      }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 50,
    overflow: "visible",
  },
});
