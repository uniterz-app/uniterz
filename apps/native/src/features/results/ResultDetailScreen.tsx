/**
 * 本番リザルト詳細。共有 `buildResultDetailViewFromLoad` + `ResultDetailBodyNative`。
 * ゲーム予想オーバーレイ（`PredictModal`）と同じ Modal + 下からスライド挙動。
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { navigateToPublicProfileNative } from "../../navigation/navigateToPublicProfileNative";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import ProfileBackEdgeHandleNative from "../profile/ProfileBackEdgeHandleNative";
import {
  PREDICT_MODAL_EXIT_COMPLETION_MS,
  predictModalBackdropEnter,
  predictModalBackdropExit,
  predictModalPreviewEnter,
  predictModalSheetEnter,
  predictModalSheetExit,
} from "../games/predictMotion";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import { spacing } from "../../theme/tokens";
import {
  buildResultDetailViewFromLoad,
  loadResultPostDetailNative,
} from "./loadResultPostDetailNative";
import ResultDetailBodyNative, {
  type ResultDetailBodySections,
} from "./ResultDetailBodyNative";
import { buildResultDetailDesignPreviewView } from "./resultDetailDesignPreviewMock";
import type { ResultDetailViewModel } from "../../../../../lib/result/buildResultDetailView";
import { buildResultDetailViewModel } from "../../../../../lib/result/buildResultDetailView";
import {
  buildTutorialResultDetailOptions,
  buildTutorialResultPost,
  RESULT_DETAIL_DESIGN_PREVIEW_POST_ID,
  TUTORIAL_RESULT_POST_ID,
} from "../../../../../lib/tutorial/tutorialNbaUi";
import { readTutorialLivePickNative } from "../tutorial/tutorialLivePickNative";

export default function ResultDetailScreen({
  visible,
  postId,
  language,
  onClose,
  onOpenProfile,
  sections = "full",
  /** true: RN Modal を使わず親ツリーに載せる（チュートリアルコーチが前面に出る） */
  embedInParent = false,
}: {
  visible: boolean;
  postId: string | null;
  language: "ja" | "en";
  onClose: () => void;
  onOpenProfile?: (handle: string) => void;
  sections?: ResultDetailBodySections;
  embedInParent?: boolean;
}) {
  const isEn = language === "en";
  const reduceMotion = useReducedMotion() ?? false;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { fUser } = useFirebaseUser();
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const [loading, setLoading] = useState(false);
  const [missing, setMissing] = useState(false);
  const [view, setView] = useState<ResultDetailViewModel | null>(null);
  const [layersVisible, setLayersVisible] = useState(visible);
  const [exitingUi, setExitingUi] = useState(false);
  const closeAnimLockRef = useRef(false);
  const closeAnimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const backdropEnter = reduceMotion ? undefined : predictModalBackdropEnter();
  const backdropExit = reduceMotion ? undefined : predictModalBackdropExit();
  const sheetEnter = reduceMotion ? undefined : predictModalSheetEnter();
  const sheetExit = reduceMotion ? undefined : predictModalSheetExit();
  const contentEnter = reduceMotion ? undefined : predictModalPreviewEnter();

  const modalChromeVisible = visible || exitingUi;

  const openProfile =
    onOpenProfile ??
    ((handle: string) => {
      const detailPostId = postId?.trim() ?? "";
      onClose();
      navigateToPublicProfileNative(navigation, {
        handle,
        fromResultDetail: true,
        ...(detailPostId ? { resultDetailPostId: detailPostId } : {}),
      });
    });

  const reset = useCallback(() => {
    setView(null);
    setMissing(false);
    setLoading(false);
  }, []);

  function scheduleCloseAfterExitAnimation() {
    if (closeAnimLockRef.current) return;
    if (reduceMotion) {
      onClose();
      return;
    }
    closeAnimLockRef.current = true;
    setExitingUi(true);
    setLayersVisible(false);
    if (closeAnimTimerRef.current) clearTimeout(closeAnimTimerRef.current);
    closeAnimTimerRef.current = setTimeout(() => {
      closeAnimTimerRef.current = null;
      closeAnimLockRef.current = false;
      onClose();
      setExitingUi(false);
    }, PREDICT_MODAL_EXIT_COMPLETION_MS);
  }

  useLayoutEffect(() => {
    if (visible) {
      setLayersVisible(true);
      setExitingUi(false);
      closeAnimLockRef.current = false;
      if (closeAnimTimerRef.current) {
        clearTimeout(closeAnimTimerRef.current);
        closeAnimTimerRef.current = null;
      }
      return;
    }
    setLayersVisible(false);
    setExitingUi(false);
    closeAnimLockRef.current = false;
    if (closeAnimTimerRef.current) {
      clearTimeout(closeAnimTimerRef.current);
      closeAnimTimerRef.current = null;
    }
  }, [visible]);

  useEffect(
    () => () => {
      if (closeAnimTimerRef.current) {
        clearTimeout(closeAnimTimerRef.current);
        closeAnimTimerRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (!visible || !postId) {
      reset();
      return;
    }
    let alive = true;
    setLoading(true);
    setMissing(false);

    void (async () => {
      try {
        const viewer = {
          uid: fUser?.uid ?? null,
          handle: null as string | null,
          displayName: fUser?.displayName ?? null,
          photoURL: fUser?.photoURL ?? null,
          isPro: false,
        };

        if (postId === RESULT_DETAIL_DESIGN_PREVIEW_POST_ID) {
          if (!alive) return;
          setView(buildResultDetailDesignPreviewView(viewer));
          return;
        }

        if (postId === TUTORIAL_RESULT_POST_ID) {
          const pick = await readTutorialLivePickNative();
          if (!alive) return;
          if (!pick) {
            setMissing(true);
            setView(null);
            return;
          }
          const built = buildTutorialResultPost(pick.pick, pick.grade);
          const myPoints =
            typeof built.stats?.pointsV3 === "number" ? built.stats.pointsV3 : 0;
          setView(
            buildResultDetailViewModel(
              { id: TUTORIAL_RESULT_POST_ID, ...(built as object) },
              {
                viewer,
                ...buildTutorialResultDetailOptions(myPoints),
              }
            )
          );
          return;
        }

        const loaded = await loadResultPostDetailNative(postId);
        if (!alive) return;
        if (!loaded.ok) {
          setMissing(true);
          setView(null);
          return;
        }
        setView(buildResultDetailViewFromLoad(loaded, viewer));
      } catch {
        if (!alive) return;
        setMissing(true);
        setView(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [visible, postId, reset, fUser?.uid, fUser?.displayName, fUser?.photoURL]);

  useEffect(() => {
    if (!modalChromeVisible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      scheduleCloseAfterExitAnimation();
      return true;
    });
    return () => sub.remove();
  }, [modalChromeVisible, reduceMotion]);

  const sheetTopPad = insets.top + spacing.lg;
  const sheetScrollMaxHeight =
    Platform.OS === "ios" ? "88%" : "90%";

  const body = modalChromeVisible ? (
    <View
      style={[styles.root, embedInParent ? styles.rootEmbedded : null]}
      pointerEvents={layersVisible ? "auto" : "none"}
    >
      {layersVisible ? (
        <>
          <Animated.View
            entering={backdropEnter}
            exiting={backdropExit}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="box-none"
          >
            {(Platform.OS === "ios" || Platform.OS === "android") && (
              <BlurView
                intensity={Platform.OS === "ios" ? 28 : 22}
                tint="dark"
                {...nativeBlurViewExtraProps()}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <View style={styles.backdropDim} pointerEvents="none" />
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={scheduleCloseAfterExitAnimation}
              accessibilityRole="button"
              accessibilityLabel={isEn ? "Close detail" : "詳細を閉じる"}
            />
          </Animated.View>

          <Animated.View
            entering={sheetEnter}
            exiting={sheetExit}
            style={styles.modalSheetWrap}
            pointerEvents="box-none"
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={[
                styles.kav,
                {
                  paddingTop: sheetTopPad,
                  paddingBottom: Math.max(insets.bottom, spacing.md),
                },
              ]}
              pointerEvents="box-none"
            >
              <ScrollView
                style={[styles.scroll, { maxHeight: sheetScrollMaxHeight }]}
                contentContainerStyle={[
                  styles.scrollContent,
                  { paddingBottom: bottomContentReserveY + spacing.md },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                pointerEvents="auto"
              >
                <View style={styles.modalContent}>
                  {loading ? (
                    <View style={styles.centerFill}>
                      <BlocksPulseLoader />
                    </View>
                  ) : missing || !view ? (
                    <View style={styles.centerFill}>
                      <Text style={styles.missingTitle}>
                        {isEn ? "Post not found" : "投稿が見つかりません"}
                      </Text>
                      <Pressable
                        onPress={scheduleCloseAfterExitAnimation}
                        style={styles.primaryBtn}
                      >
                        <Text style={styles.primaryBtnText}>
                          {isEn ? "Close" : "閉じる"}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Animated.View entering={contentEnter} collapsable={false}>
                      <ResultDetailBodyNative
                        language={language}
                        view={view}
                        onOpenProfile={openProfile}
                        sections={sections}
                      />
                    </Animated.View>
                  )}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
            <ProfileBackEdgeHandleNative
              onPress={scheduleCloseAfterExitAnimation}
              accessibilityLabel={isEn ? "Back" : "戻る"}
            />
          </Animated.View>
        </>
      ) : null}
    </View>
  ) : null;

  if (embedInParent) {
    if (!modalChromeVisible) return null;
    return body;
  }

  return (
    <Modal
      visible={modalChromeVisible}
      transparent
      animationType="none"
      onRequestClose={scheduleCloseAfterExitAnimation}
    >
      {body}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** チュートリアル時は親ツリーに載せてコーチ（zIndex 200）より後ろへ */
  rootEmbedded: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 120,
    elevation: 120,
  },
  modalSheetWrap: {
    flex: 1,
    zIndex: 1,
    position: "relative",
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  kav: {
    flex: 1,
    zIndex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: spacing.md,
  },
  scroll: {
    width: "100%",
  },
  scrollContent: {
    alignItems: "stretch",
    paddingTop: spacing.sm,
  },
  modalContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  centerFill: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  missingTitle: {
    color: "rgba(248,250,252,0.9)",
    fontSize: 16,
    fontWeight: "700",
  },
  primaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    backgroundColor: "rgba(0,245,255,0.1)",
  },
  primaryBtnText: {
    color: "#ecfeff",
    fontWeight: "700",
  },
});
