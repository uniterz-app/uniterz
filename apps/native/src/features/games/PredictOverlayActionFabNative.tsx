/**
 * 予想オーバーレイ左上 — Web mobile `CyberMenuButton` + 左フライアウト
 */
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CornerMenuClusterNative from "../../ui/CornerMenuClusterNative";
import CornerMenuFlyoutButtonNative from "../../ui/CornerMenuFlyoutButtonNative";

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
            <CornerMenuFlyoutButtonNative
              onPress={() => {
                setOpen(false);
                onClose?.();
              }}
              accessibilityLabel={closeLabel}
            >
              <Text style={styles.closeIcon} accessibilityElementsHidden importantForAccessibility="no">
                ×
              </Text>
            </CornerMenuFlyoutButtonNative>
          ) : null}
          {hasShare ? (
            <CornerMenuFlyoutButtonNative
              variant="share"
              onPress={() => {
                setOpen(false);
                onShare?.();
              }}
              accessibilityLabel={shareLabel}
            >
              <MaterialCommunityIcons
                name="share-variant"
                size={12}
                color="rgba(207,250,254,0.88)"
              />
            </CornerMenuFlyoutButtonNative>
          ) : null}
          {hasEdit ? (
            <CornerMenuFlyoutButtonNative
              onPress={() => {
                setOpen(false);
                onEdit?.();
              }}
              accessibilityLabel={editLabel}
            >
              <MaterialCommunityIcons
                name="pencil"
                size={12}
                color="rgba(207,250,254,0.88)"
              />
            </CornerMenuFlyoutButtonNative>
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
  closeIcon: {
    color: "rgba(236,254,255,0.9)",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "300",
    includeFontPadding: false,
    textAlign: "center",
  },
});
