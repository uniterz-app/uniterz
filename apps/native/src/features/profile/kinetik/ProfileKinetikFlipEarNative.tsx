/**
 * プロフィール ↔ CAREER フリップ用の耳タブ。
 * FlipShell が Provider で渡し、カード枠側が描画して「枠の一部」にする。
 */
import { createContext, useContext, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import TutorialTargetNative from "../../tutorial/TutorialTargetNative";

const RAJDHANI = "Rajdhani_600SemiBold";

/** 耳の外形（天辺ノッチ計算用） */
export const KINETIK_FLIP_EAR = {
  width: 96,
  height: 22,
  right: 12,
  /**
   * カード天辺より上に出る量。
   * height - 1 にして天辺ラインが耳の下端で接合するようにする
   *（途中で横切ると左右に線が飛び出す）。
   */
  lip: 21,
} as const;

/** 耳・天辺ノッチ専用（パネルの白枠と混ぜない） */
export const KINETIK_FLIP_EAR_ACCENT = "rgba(0,245,255,0.72)";
export const KINETIK_FLIP_EAR_TEXT = "rgba(0,245,255,0.95)";

export type ProfileKinetikFlipEarValue = {
  label: string;
  onToggle: () => void;
  /** 裏面表示中（PROFILE）なら true */
  pressed: boolean;
};

const ProfileKinetikFlipEarContext =
  createContext<ProfileKinetikFlipEarValue | null>(null);

export function ProfileKinetikFlipEarProvider({
  value,
  children,
}: {
  value: ProfileKinetikFlipEarValue;
  children: ReactNode;
}) {
  return (
    <ProfileKinetikFlipEarContext.Provider value={value}>
      {children}
    </ProfileKinetikFlipEarContext.Provider>
  );
}

export function useProfileKinetikFlipEar(): ProfileKinetikFlipEarValue | null {
  return useContext(ProfileKinetikFlipEarContext);
}

type EarProps = {
  /** 省略時はシアン固定（パネル白枠と分離） */
  borderColor?: string;
};

/**
 * カード天辺の切れ込み耳。塗りは透明でスキンを通し、枠線だけがカードと連続する。
 */
export function ProfileKinetikFlipEarNative({
  borderColor = KINETIK_FLIP_EAR_ACCENT,
}: EarProps) {
  const ear = useProfileKinetikFlipEar();
  if (!ear) return null;

  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: ear.pressed }}
      accessibilityLabel={ear.label}
      onPress={ear.onToggle}
      style={({ pressed }) => [
        ear.pressed ? styles.ear : styles.earFill,
        { borderColor },
        pressed ? styles.earPressed : null,
      ]}
      hitSlop={6}
    >
      <Text style={[styles.earText, { color: KINETIK_FLIP_EAR_TEXT }]}>
        {ear.label}
      </Text>
    </Pressable>
  );

  /** 表（CAREER）だけチュートリアル穴の対象。裏の PROFILE 耳は測らない */
  if (ear.pressed) return button;

  return (
    <TutorialTargetNative id="profile-career-tab" style={styles.earPos}>
      {button}
    </TutorialTargetNative>
  );
}

/**
 * 天辺ボーダーを耳幅だけ開けた左右セグメント。
 * frame は borderTopWidth: 0 にし、これで天辺を描く。
 */
export function ProfileKinetikFlipEarTopEdgesNative({
  borderColor = KINETIK_FLIP_EAR_ACCENT,
}: EarProps) {
  const ear = useProfileKinetikFlipEar();
  if (!ear) return null;

  const gap = KINETIK_FLIP_EAR.right + KINETIK_FLIP_EAR.width;

  return (
    <>
      <View
        pointerEvents="none"
        style={[
          styles.topEdge,
          styles.topEdgeLeft,
          { backgroundColor: borderColor, right: gap },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.topEdge,
          styles.topEdgeRight,
          {
            backgroundColor: borderColor,
            width: KINETIK_FLIP_EAR.right,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  earPos: {
    position: "absolute",
    top: 0,
    right: KINETIK_FLIP_EAR.right,
    zIndex: 8,
    width: KINETIK_FLIP_EAR.width,
    height: KINETIK_FLIP_EAR.height,
  },
  earFill: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderBottomWidth: 0,
    /** カードと同じ材質に見せる — 塗りなし */
    backgroundColor: "transparent",
    paddingHorizontal: 10,
  },
  ear: {
    position: "absolute",
    top: 0,
    right: KINETIK_FLIP_EAR.right,
    zIndex: 8,
    width: KINETIK_FLIP_EAR.width,
    height: KINETIK_FLIP_EAR.height,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderBottomWidth: 0,
    /** カードと同じ材質に見せる — 塗りなし */
    backgroundColor: "transparent",
    paddingHorizontal: 10,
  },
  earPressed: {
    opacity: 0.85,
  },
  earText: {
    fontFamily: RAJDHANI,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    fontWeight: "600",
    color: "rgba(0,245,255,0.95)",
  },
  topEdge: {
    position: "absolute",
    top: 0,
    height: 1,
    zIndex: 6,
  },
  topEdgeLeft: {
    left: 0,
  },
  topEdgeRight: {
    right: 0,
  },
});
