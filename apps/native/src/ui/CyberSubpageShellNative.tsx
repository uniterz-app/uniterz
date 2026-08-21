/**
 * Web `CyberSubpageShell` 相当。
 * 戻る（角切り）+ eyebrow + サイバー題名（中央）+ 説明は右上はてな（オーバーレイ）。
 */
import { useLayoutEffect, useState, type ReactNode } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { acquireAppBrandShelfHidden } from "../../../../lib/ui/appBrandShelfVisibility";
import {
  acquireAppBrandWordmark,
  isHeaderWordmark,
} from "../../../../lib/ui/headerWordmark";
import { uniterzBrandShelfOffsetTop } from "../features/UniterzBrandShelfNative";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { RankingsPageTitleCyberNative } from "../features/rankings/RankingsPageTitleCyberNative";
import {
  nbaSubpageBodyEntering,
  nbaSubpageHeaderEntering,
  nbaSubpageTitleEntering,
} from "../features/games/gamesNbaSubpageMotion";
import ProfileBackEdgeHandleNative from "../features/profile/ProfileBackEdgeHandleNative";
import CyberHelpMarkNative from "./CyberHelpMarkNative";

/** Web `CyberHelpPanel` 相当 — オーバーレイ内カード */
function CyberHelpPanelNative({
  text,
  onClose,
}: {
  text: string;
  onClose: () => void;
}) {
  return (
    <View style={styles.helpCard} accessibilityRole="summary">
      <View style={styles.helpRail} pointerEvents="none" />
      <View style={styles.helpScan} pointerEvents="none" />

      <View style={styles.helpInner}>
        <View style={styles.helpHeaderRow}>
          <View style={styles.helpLabelRow}>
            <View style={styles.helpLabelLine} />
            <Text style={styles.helpLabel}>INFO</Text>
            <View style={styles.helpLabelLine} />
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="閉じる"
            style={({ pressed }) => [
              styles.helpCloseBtn,
              pressed && styles.helpCloseBtnPressed,
            ]}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="close" size={16} color="#ecfeff" />
          </Pressable>
        </View>
        <Text style={styles.helpText}>{text}</Text>
      </View>
    </View>
  );
}

/** Web `CyberHelpOverlay` 相当 */
function CyberHelpOverlayNative({
  open,
  text,
  onClose,
}: {
  open: boolean;
  text: string;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlayRoot}>
        <Pressable
          style={styles.overlayBackdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="閉じる"
        />
        <View style={styles.overlayCardWrap} pointerEvents="box-none">
          <CyberHelpPanelNative text={text} onClose={onClose} />
        </View>
      </View>
    </Modal>
  );
}

export type CyberSubpageHeaderNativeProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /**
   * 右上はてなの左に置く追加アクション（例: プレビュー用バーガー）。
   * はてなと同じ 40px タップ領域を想定。
   */
  headerTrailing?: ReactNode;
  onBack: () => void;
  /**
   * 右端の縦 BACK タブに置き換え（ヘッダー左の戻るは非表示）。既定 true。
   * `hideBack` を明示した場合はそちらを優先。
   */
  edgeBack?: boolean;
  /** @deprecated `edgeBack` を利用 */
  hideBack?: boolean;
  /** 埋め込み時は sticky/背景を弱める */
  embedded?: boolean;
  /**
   * グローバル UNITERZ 棚を隠す。
   * 既定は埋め込み以外 true。Settings モーダルなど SafeArea 済みは false。
   */
  hideBrandShelf?: boolean;
  /**
   * ページ名は上部ワードマーク（RESULT / RANKING と同じ）に出す。
   * このバーのタイトルは出さない。
   */
  titleInBrandShelf?: boolean;
};

/** Web `CyberSubpageHeader` 相当 */
export function CyberSubpageHeaderNative({
  eyebrow = "PROFILE",
  title,
  subtitle,
  headerTrailing,
  onBack,
  edgeBack = true,
  hideBack,
  embedded = false,
  hideBrandShelf,
  titleInBrandShelf = false,
}: CyberSubpageHeaderNativeProps) {
  const useEdgeBack = hideBack ?? edgeBack;
  const hideShelf = hideBrandShelf ?? !embedded;
  const insets = useSafeAreaInsets();
  const [helpOpen, setHelpOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const motionOn = reduceMotion !== true;
  const hasRightCluster = Boolean(subtitle || headerTrailing);

  useLayoutEffect(() => {
    if (!hideShelf) return;
    return acquireAppBrandShelfHidden();
  }, [hideShelf]);

  useLayoutEffect(() => {
    if (!titleInBrandShelf || !isHeaderWordmark(title)) return;
    return acquireAppBrandWordmark(title);
  }, [titleInBrandShelf, title]);

  if (titleInBrandShelf) {
    if (!subtitle && !headerTrailing) return null;
    return (
      <View style={styles.shelfHelpRow}>
        {headerTrailing}
        {subtitle ? (
          <>
            <Pressable
              onPress={() => setHelpOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="説明"
              accessibilityState={{ expanded: helpOpen }}
              style={({ pressed }) => [
                styles.helpBtn,
                pressed && styles.helpBtnPressed,
              ]}
            >
              <CyberHelpMarkNative active={helpOpen} />
            </Pressable>
            <CyberHelpOverlayNative
              open={helpOpen}
              text={subtitle}
              onClose={() => setHelpOpen(false)}
            />
          </>
        ) : null}
      </View>
    );
  }

  const HeaderWrap = embedded ? View : Animated.View;
  const TitleWrap = embedded ? View : Animated.View;

  return (
    <HeaderWrap
      style={[
        styles.headerWrap,
        embedded && styles.headerWrapEmbedded,
        hideShelf ? { paddingTop: insets.top } : null,
      ]}
      {...(!embedded && motionOn
        ? { entering: nbaSubpageHeaderEntering }
        : {})}
    >
      <View style={styles.header}>
        {useEdgeBack ? (
          <View style={styles.sideSpacer} pointerEvents="none" />
        ) : (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="戻る"
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={22}
              color="#ecfeff"
            />
          </Pressable>
        )}
        <TitleWrap
          style={[
            styles.titleBlock,
            headerTrailing && subtitle ? styles.titleBlockWide : null,
          ]}
          pointerEvents="none"
          {...(!embedded && motionOn
            ? { entering: nbaSubpageTitleEntering }
            : {})}
        >
          <Text style={styles.eyebrow} numberOfLines={1}>
            {eyebrow}
          </Text>
          <RankingsPageTitleCyberNative title={title} embedded size="md" />
        </TitleWrap>
        {hasRightCluster ? (
          <View style={styles.rightCluster}>
            {headerTrailing}
            {subtitle ? (
              <Pressable
                onPress={() => setHelpOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="説明"
                accessibilityState={{ expanded: helpOpen }}
                style={({ pressed }) => [
                  styles.helpBtn,
                  pressed && styles.helpBtnPressed,
                ]}
              >
                <CyberHelpMarkNative active={helpOpen} />
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.sideSpacer} pointerEvents="none" />
        )}
      </View>

      {subtitle ? (
        <CyberHelpOverlayNative
          open={helpOpen}
          text={subtitle}
          onClose={() => setHelpOpen(false)}
        />
      ) : null}
    </HeaderWrap>
  );
}

type Props = CyberSubpageHeaderNativeProps & {
  children: ReactNode;
  /** ScrollView を使わず children をそのまま置く（ブラケット等） */
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** ScrollView の stickyHeaderIndices（RANK ピン留め等） */
  stickyHeaderIndices?: number[];
};

export default function CyberSubpageShellNative({
  eyebrow = "NBA · 2026-27",
  title,
  subtitle,
  headerTrailing,
  onBack,
  edgeBack = true,
  hideBack,
  hideBrandShelf = true,
  titleInBrandShelf = false,
  children,
  scroll = true,
  contentStyle,
  stickyHeaderIndices,
}: Props) {
  const useEdgeBack = hideBack ?? edgeBack;
  const reduceMotion = useReducedMotion();
  const motionOn = reduceMotion !== true;
  const insets = useSafeAreaInsets();
  const shelfPull = hideBrandShelf ? uniterzBrandShelfOffsetTop(insets.top) : 0;

  const body = scroll ? (
    <ScrollView
      style={styles.body}
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={stickyHeaderIndices}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, contentStyle]}>{children}</View>
  );

  return (
    <View
      style={[
        styles.root,
        hideBrandShelf
          ? {
              position: "absolute",
              top: -shelfPull,
              left: 0,
              right: 0,
              bottom: 0,
            }
          : null,
      ]}
    >
      <CyberSubpageHeaderNative
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        headerTrailing={headerTrailing}
        onBack={onBack}
        edgeBack={useEdgeBack}
        hideBack={useEdgeBack}
        hideBrandShelf={hideBrandShelf}
        titleInBrandShelf={titleInBrandShelf}
      />

      <Animated.View
        style={styles.bodyMotion}
        entering={motionOn ? nbaSubpageBodyEntering : undefined}
      >
        {body}
      </Animated.View>

      {useEdgeBack ? (
        <ProfileBackEdgeHandleNative onPress={onBack} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  shelfHelpRow: {
    zIndex: 30,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  headerWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0, 245, 255, 0.14)",
    backgroundColor: "#000000",
  },
  headerWrapEmbedded: {
    backgroundColor: "#000000",
  },
  header: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 56,
  },
  iconBtn: {
    zIndex: 3,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.28)",
    backgroundColor: "rgba(0, 245, 255, 0.06)",
    borderTopLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  iconBtnPressed: {
    borderColor: "rgba(0, 245, 255, 0.5)",
    backgroundColor: "rgba(0, 245, 255, 0.12)",
  },
  helpBtn: {
    zIndex: 3,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  helpBtnPressed: {
    opacity: 0.85,
  },
  titleBlock: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 52,
    zIndex: 1,
  },
  titleBlockWide: {
    paddingHorizontal: 88,
  },
  rightCluster: {
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
  },
  sideSpacer: {
    width: 40,
    height: 40,
  },
  eyebrow: {
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "Oxanium_700Bold",
    }),
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
    color: "rgba(103, 232, 249, 0.7)",
  },
  overlayRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 9, 0.78)",
  },
  overlayCardWrap: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  helpCard: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.32)",
    backgroundColor: "#050b14",
    borderRadius: 2,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 245, 255, 0.35)",
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 16,
        shadowOpacity: 0.4,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  helpRail: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 2,
    backgroundColor: "rgba(0, 245, 255, 0.55)",
  },
  helpScan: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(103, 232, 249, 0.55)",
  },
  helpInner: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  helpHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  helpLabelRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingLeft: 32,
  },
  helpLabelLine: {
    width: 24,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(34, 211, 238, 0.45)",
  },
  helpLabel: {
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "Oxanium_700Bold",
    }),
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.8,
    textTransform: "uppercase",
    color: "rgba(103, 232, 249, 0.9)",
    ...Platform.select({
      ios: {
        textShadowColor: "rgba(0, 245, 255, 0.45)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
      },
      default: {},
    }),
  },
  helpCloseBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.28)",
    backgroundColor: "rgba(0, 245, 255, 0.06)",
    borderTopLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  helpCloseBtnPressed: {
    borderColor: "rgba(0, 245, 255, 0.5)",
    backgroundColor: "rgba(0, 245, 255, 0.12)",
  },
  helpText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 13,
    lineHeight: 22,
    textAlign: "center",
  },
  bodyMotion: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 64,
  },
});
