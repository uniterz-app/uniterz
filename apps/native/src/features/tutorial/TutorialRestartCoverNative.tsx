/**
 * Web の再開暗幕相当 — メニュー閉鎖とタブ切替のあいだ、元画面を隠す。
 */
import { Modal, StyleSheet, View } from "react-native";
import { useSyncExternalStore } from "react";
import {
  getTutorialRestartCover,
  getTutorialRestartCoverColor,
  subscribeTutorialRestartCover,
} from "../../../../../lib/tutorial/tutorialRestartCover";

export default function TutorialRestartCoverNative() {
  const visible = useSyncExternalStore(
    subscribeTutorialRestartCover,
    getTutorialRestartCover,
    () => false
  );

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View
        pointerEvents="auto"
        style={[
          styles.fill,
          { backgroundColor: getTutorialRestartCoverColor() },
        ]}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
