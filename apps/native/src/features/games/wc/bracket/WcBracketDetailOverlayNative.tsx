/** Web `WcBracketLeaderboardSection` 詳細オーバーレイ相当 */
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WcBracketLeaderboardRow } from "@/lib/leaderboards/useWcBracketLeaderboard";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import type { Language } from "@/lib/i18n/language";
import { nativeBlurViewExtraProps } from "../../../../ui/nativeBlurProps";
import PredictOverlayCornerButtonNative from "../../PredictOverlayCornerButtonNative";
import { colors } from "../../../../theme/tokens";
import { loadNativeWcBracket } from "./loadNativeWcBracket";
import { useNativeWcBracketResults } from "./useNativeWcBracketResults";
import { useNativeWcKnockoutAdvancement } from "./useNativeWcKnockoutAdvancement";
import WcBracketTreeInputNative from "./WcBracketTreeInputNative";
import WcBracketUserCardNative from "./WcBracketUserCardNative";

type Props = {
  visible: boolean;
  row: WcBracketLeaderboardRow | null;
  season: string;
  language: Language;
  onClose: () => void;
};

export default function WcBracketDetailOverlayNative({
  visible,
  row,
  season,
  language,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const isJa = language === "ja";
  const { advancement } = useNativeWcKnockoutAdvancement(season, {
    enabled: visible,
  });
  const { winners: officialWinners } = useNativeWcBracketResults(season, {
    enabled: visible,
    pollIntervalMs: visible ? 30_000 : 0,
  });

  const [bracketLoading, setBracketLoading] = useState(false);
  const [overlayBracket, setOverlayBracket] = useState<WcBracketState | null>(
    null
  );

  useEffect(() => {
    if (!visible || !row) {
      setOverlayBracket(null);
      setBracketLoading(false);
      return;
    }

    let cancelled = false;
    setBracketLoading(true);
    setOverlayBracket(null);

    void loadNativeWcBracket(row.uid, season)
      .then((doc) => {
        if (cancelled) return;
        setOverlayBracket(doc?.bracket ?? null);
      })
      .catch((e) => {
        if (!cancelled) {
          console.error("failed to load wc bracket", e);
          setOverlayBracket(null);
        }
      })
      .finally(() => {
        if (!cancelled) setBracketLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, row, season]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!visible || !row) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.root}>
        {(Platform.OS === "ios" || Platform.OS === "android") && (
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFillObject}
            tint="dark"
            intensity={Platform.OS === "ios" ? 28 : 22}
            {...nativeBlurViewExtraProps()}
          />
        )}
        <Pressable
          style={styles.scrim}
          onPress={handleClose}
          accessibilityLabel={isJa ? "閉じる" : "Close"}
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: Math.max(insets.top, 8) },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.closeRow}>
              <PredictOverlayCornerButtonNative
                embedded
                align="right"
                onPress={handleClose}
                accessibilityLabel={isJa ? "閉じる" : "Close"}
              />
            </View>

            <View style={styles.userCardWrap}>
              <WcBracketUserCardNative row={row} language={language} />
            </View>

            {bracketLoading ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator color={colors.accentCyan} size="large" />
                <Text style={styles.loaderLabel}>
                  {isJa ? "読み込み中" : "Loading"}
                </Text>
              </View>
            ) : overlayBracket ? (
              <View style={styles.treeWrap}>
                <WcBracketTreeInputNative
                  bracket={overlayBracket}
                  advancement={advancement}
                  officialWinners={officialWinners}
                  language={language}
                />
              </View>
            ) : (
              <View style={styles.loaderWrap}>
                <Text style={styles.errorText}>
                  {isJa
                    ? "ブラケットを読み込めませんでした"
                    : "Could not load bracket"}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  sheet: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  closeRow: {
    alignItems: "flex-end",
    paddingBottom: 4,
    paddingTop: 8,
  },
  userCardWrap: {
    paddingBottom: 12,
  },
  treeWrap: {
    paddingBottom: 16,
  },
  loaderWrap: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 32,
  },
  loaderLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
