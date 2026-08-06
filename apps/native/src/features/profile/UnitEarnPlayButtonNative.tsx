/**
 * Web `UnitEarnPlayButton` 相当 — Unit 獲得演出の再生ボタン。
 * フォーカス復帰直後は InteractionManager 後に play する。
 */
import { useRef, useState } from "react";
import {
  InteractionManager,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fonts } from "../../theme/tokens";

type Props = {
  onPlay: () => void;
  disabled?: boolean;
  language?: "ja" | "en";
};

export default function UnitEarnPlayButtonNative({
  onPlay,
  disabled = false,
  language = "ja",
}: Props) {
  const isJa = language === "ja";
  const label = isJa ? "Unit獲得を再生" : "Play unit earn";
  const [pending, setPending] = useState(false);
  const lockedRef = useRef(false);

  function handlePress() {
    if (disabled || lockedRef.current) return;
    lockedRef.current = true;
    setPending(true);
    const task = InteractionManager.runAfterInteractions(() => {
      // タブ復帰直後のレイアウト / 画像デコードが終わってから開始
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            try {
              onPlay();
            } finally {
              setTimeout(() => {
                lockedRef.current = false;
                setPending(false);
              }, 400);
            }
          }, 48);
        });
      });
    });
    return () => task.cancel?.();
  }

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled || pending}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.btn,
          pressed && !disabled && !pending ? styles.btnPressed : null,
          disabled || pending ? styles.btnDisabled : null,
        ]}
      >
        <View style={styles.disc}>
          <Text style={styles.discU}>U</Text>
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    zIndex: 40,
  },
  btn: {
    width: "100%",
    maxWidth: 320,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "#f6c344",
    backgroundColor: "#f6c344",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#f6c344",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.55,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  disc: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#241902",
    alignItems: "center",
    justifyContent: "center",
  },
  discU: {
    fontFamily: fonts.metricExtra,
    fontSize: 10,
    fontWeight: "800",
    color: "#f6c344",
  },
  label: {
    fontFamily: fonts.metricExtra,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#241902",
  },
});
