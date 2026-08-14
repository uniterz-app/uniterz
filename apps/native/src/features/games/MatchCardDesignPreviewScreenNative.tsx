/**
 * __DEV__ 試合一覧カードの現行デザイン。
 * 本番 `GameCardList` を mock でそのまま表示する。
 */
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { resolveGameStatus, resolveGameTeamName } from "@uniterz/shared";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import GameCardList from "./GameCardList";
import { gameCardListStyles } from "./gameCardListStyles";
import {
  getGameCardCenterBlock,
  isGameStarted,
  isSoccerLeague,
  resolveLeagueColor,
  toCompactTeamName,
} from "./gameCardDisplayUtils";
import { getGamesTexts } from "./gamesI18n";
import {
  MATCH_CARD_PREVIEW_PICKUP_PREDICTED_ID,
  MATCH_CARD_PREVIEW_PREDICTED_ID,
  matchCardPreviewFinal,
  matchCardPreviewFinalOt,
  matchCardPreviewLive,
  matchCardPreviewPickup,
  matchCardPreviewPickupPredicted,
  matchCardPreviewPlayoff,
  matchCardPreviewPredicted,
  matchCardPreviewScheduled,
} from "./matchCardDesignPreviewMocks";
import { resolveNativeSeriesLabel, resolveNativeSeriesPair } from "./resolveNativeSeriesStanding";
import { resolveTeamJerseyPalette } from "./teamColors";
import { formatTeamRecordForCard } from "./teamRecordDisplay";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

type PreviewSection = {
  id: string;
  titleJa: string;
  titleEn: string;
  game: Record<string, unknown>;
  predicted?: boolean;
  pickupMark?: "top" | "left";
};

const SECTIONS: PreviewSection[] = [
  {
    id: "scheduled",
    titleJa: "通常 · 未予想",
    titleEn: "Standard · not predicted",
    game: matchCardPreviewScheduled,
  },
  {
    id: "predicted",
    titleJa: "通常 · 予想済み",
    titleEn: "Standard · predicted",
    game: matchCardPreviewPredicted,
    predicted: true,
  },
  {
    id: "pickup",
    titleJa: "ピックアップ · 未予想",
    titleEn: "Pickup · not predicted",
    game: matchCardPreviewPickup,
    pickupMark: "left",
  },
  {
    id: "pickup-predicted",
    titleJa: "ピックアップ · 予想済み",
    titleEn: "Pickup · predicted",
    game: matchCardPreviewPickupPredicted,
    predicted: true,
    pickupMark: "left",
  },
  {
    id: "live",
    titleJa: "LIVE（線色は通常 · 未予想と同じ）",
    titleEn: "LIVE (same line as standard open)",
    game: matchCardPreviewLive,
  },
  {
    id: "final",
    titleJa: "FINAL（線色は通常 · 未予想と同じ）",
    titleEn: "FINAL (same line as standard open)",
    game: matchCardPreviewFinal,
  },
  {
    id: "final-ot",
    titleJa: "FINAL · OT",
    titleEn: "FINAL · OT",
    game: matchCardPreviewFinalOt,
  },
  {
    id: "playoff",
    titleJa: "プレーオフ · シリーズ",
    titleEn: "Playoffs · series",
    game: matchCardPreviewPlayoff,
  },
];

export default function MatchCardDesignPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const isJa = language === "ja";
  const t = useMemo(() => getGamesTexts(language), [language]);
  const predictedGameIds = useMemo(
    () =>
      new Set([
        MATCH_CARD_PREVIEW_PREDICTED_ID,
        MATCH_CARD_PREVIEW_PICKUP_PREDICTED_ID,
      ]),
    []
  );

  return (
    <MobilePageShell
      title="Match Card"
      eyebrow="PREVIEW"
      subtitle={
        isJa
          ? "線色はピックアップがゴールド、通常が青。予想済みは同系の落ち着いた色。LIVE / FINAL は変えない。"
          : "Pickup = gold, standard = blue. Predicted uses a muted shade. LIVE / FINAL do not change the line."
      }
      appBackground
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={styles.pad}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionLabel}>
              {isJa ? section.titleJa : section.titleEn}
            </Text>
            <GameCardList
              games={[section.game]}
              enteringAnimationEnabled={false}
              predictedGameIds={
                section.predicted ? predictedGameIds : new Set()
              }
              language={language}
              t={t}
              styles={gameCardListStyles}
              shellVariant="lineFrame"
              pickupMark={section.pickupMark}
              openPredictModal={() => {}}
              resolveGameTeamName={resolveGameTeamName}
              toCompactTeamName={toCompactTeamName}
              isSoccerLeague={isSoccerLeague}
              resolveGameStatus={resolveGameStatus}
              isGameStarted={isGameStarted}
              resolveLeagueColor={resolveLeagueColor}
              getGameCardCenterBlock={(game) =>
                getGameCardCenterBlock(game, language)
              }
              resolveSeriesLabel={(game) =>
                resolveNativeSeriesLabel(game, [])
              }
              resolveSeriesPair={(game) => resolveNativeSeriesPair(game, [])}
              getTeamRecordLabel={(side, leagueRaw) =>
                formatTeamRecordForCard(side, {}, leagueRaw ?? "nba")
              }
              resolveTeamJerseyPalette={resolveTeamJerseyPalette}
            />
          </View>
        ))}
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  pad: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 22,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    color: "rgba(226,232,240,0.55)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    paddingHorizontal: 8,
  },
});
