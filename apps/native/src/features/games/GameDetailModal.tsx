import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import type { GamesTexts } from "./gamesI18n";
import { predictBlockFadeUpEnter } from "./predictMotion";

type ScreenStyles = Record<string, ViewStyle & TextStyle & ImageStyle>;

type GameDetailModalProps = {
  visible: boolean;
  selectedGame: Record<string, unknown> | null;
  myPostIdByGameId: Record<string, string>;
  myPredictionByGameId: Record<
    string,
    {
      winner: "home" | "away" | "draw";
      score: { home: number; away: number };
      comment: string;
      updatedAt?: unknown;
    }
  >;
  renderWinnerLabel: (
    winner: "home" | "away" | "draw",
    leagueRaw: unknown
  ) => string;
  formatDateTimeJst: (value: unknown) => string;
  toCompactTeamName: (leagueRaw: unknown, rawName: string) => string;
  resolveGameTeamName: (
    side: unknown,
    fallback: unknown,
    defaultName: string
  ) => string;
  resolveTeamPrimaryColor: (
    leagueRaw: unknown,
    side: unknown,
    fallback: string
  ) => string;
  renderCenterText: (
    game: Record<string, unknown>,
    language: "ja" | "en"
  ) => string;
  renderStatusLabel: (
    game: Record<string, unknown>,
    language: "ja" | "en"
  ) => string;
  resolveGameStartAt: (game: Record<string, unknown>) => Date | null;
  resolveGameStatus: (game: Record<string, unknown>) => "scheduled" | "live" | "final";
  formatCountdownLabel: (startAt: Date, nowMs: number) => string;
  isGameStarted: (game: Record<string, unknown>) => boolean;
  countdownNowMs: number;
  language: "ja" | "en";
  t: GamesTexts;
  openPredictModal: () => void;
  onClose: () => void;
  styles: ScreenStyles;
};

export default function GameDetailModal(props: GameDetailModalProps) {
  const {
    visible,
    selectedGame,
    myPostIdByGameId,
    myPredictionByGameId,
    renderWinnerLabel,
    formatDateTimeJst,
    toCompactTeamName,
    resolveGameTeamName,
    resolveTeamPrimaryColor,
    renderCenterText,
    renderStatusLabel,
    resolveGameStartAt,
    resolveGameStatus,
    formatCountdownLabel,
    isGameStarted,
    countdownNowMs,
    language,
    t,
    openPredictModal,
    onClose,
    styles,
  } = props;

  const reduceMotion = useReducedMotion();
  const cardEntering = reduceMotion ? undefined : predictBlockFadeUpEnter(0);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        {/** Web スケジュール系オーバーレイ同様、背景は即表示 */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.65)" }]}
        />
        <View
          style={[styles.modalBackdrop, { backgroundColor: "transparent", zIndex: 1 }]}
        >
          <Animated.View style={styles.modalCard} entering={cardEntering}>
          <View style={styles.modalHeaderRow}>
            <Text style={[styles.modalTitle, styles.modalTitleInHeader]} numberOfLines={1}>
              {t.gameDetail}
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.modalHeaderClose, pressed && { opacity: 0.65 }]}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t.close}
            >
              <Text style={styles.modalHeaderCloseX}>×</Text>
            </Pressable>
          </View>
          {selectedGame ? (
            <>
              {(() => {
                const gameId = String(selectedGame.id ?? "");
                const myPrediction = myPredictionByGameId[gameId];
                if (!myPrediction) return null;
                return (
                  <Text style={styles.myPredictionSummary}>
                    {t.myPrediction}: {renderWinnerLabel(myPrediction.winner, selectedGame.league)} /{" "}
                    {myPrediction.score.home} – {myPrediction.score.away}
                    {"\n"}
                    {t.updatedAt}: {formatDateTimeJst(myPrediction.updatedAt)}
                  </Text>
                );
              })()}
              <View style={styles.modalTeamBadgeRow}>
                <View
                  style={[
                    styles.modalTeamBadge,
                    {
                      borderColor: resolveTeamPrimaryColor(
                        selectedGame.league,
                        selectedGame.away,
                        "#5aa4ff"
                      ),
                    },
                  ]}
                >
                  <Text style={styles.modalTeamBadgeLabel}>AWAY</Text>
                  <Text style={styles.modalTeamBadgeName}>
                    {toCompactTeamName(
                      selectedGame.league,
                      resolveGameTeamName(selectedGame.away, selectedGame.awayTeamName, "AWAY")
                    )}
                  </Text>
                </View>
                <View
                  style={[
                    styles.modalTeamBadge,
                    {
                      borderColor: resolveTeamPrimaryColor(
                        selectedGame.league,
                        selectedGame.home,
                        "#ff6b8a"
                      ),
                    },
                  ]}
                >
                  <Text style={styles.modalTeamBadgeLabel}>HOME</Text>
                  <Text style={styles.modalTeamBadgeName}>
                    {toCompactTeamName(
                      selectedGame.league,
                      resolveGameTeamName(selectedGame.home, selectedGame.homeTeamName, "HOME")
                    )}
                  </Text>
                </View>
              </View>
              <Text style={styles.modalBody}>
                {toCompactTeamName(
                  selectedGame.league,
                  resolveGameTeamName(selectedGame.away, selectedGame.awayTeamName, "AWAY")
                )}{" "}
                vs{" "}
                {toCompactTeamName(
                  selectedGame.league,
                  resolveGameTeamName(selectedGame.home, selectedGame.homeTeamName, "HOME")
                )}
              </Text>
              <Text style={styles.modalBody}>
                {t.scoreTime}: {renderCenterText(selectedGame, language)}
              </Text>
              <Text style={styles.modalBody}>
                {t.statusLabel}: {renderStatusLabel(selectedGame, language)}
              </Text>
              {(() => {
                const startAt = resolveGameStartAt(selectedGame);
                const isScheduled = resolveGameStatus(selectedGame) === "scheduled";
                if (!isScheduled || !startAt) return null;
                return (
                  <Text style={styles.countdownText}>
                    {t.startsIn}: {formatCountdownLabel(startAt, countdownNowMs)}
                  </Text>
                );
              })()}
              {(() => {
                const gameId = String(selectedGame.id ?? "");
                const hasMyPost = Boolean(myPostIdByGameId[gameId]);
                const started = isGameStarted(selectedGame);
                const status = resolveGameStatus(selectedGame);
                const actionLabel =
                  started && !hasMyPost
                    ? status === "final"
                      ? t.final
                      : t.live
                    : hasMyPost
                    ? t.editPrediction
                    : t.makePrediction;
                return (
                  <Pressable
                    style={[
                      styles.predictButton,
                      started && !hasMyPost && styles.primaryButtonDisabled,
                    ]}
                    onPress={openPredictModal}
                    disabled={started && !hasMyPost}
                  >
                    <Text style={styles.predictButtonText}>{actionLabel}</Text>
                  </Pressable>
                );
              })()}
            </>
          ) : null}
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
