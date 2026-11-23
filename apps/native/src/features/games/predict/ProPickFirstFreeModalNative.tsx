/** 予想送信直後。次の試合案内と同じ枠で、今予想した試合の PRO PICK 初回無料を聞く。 */
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { nativeBlurViewExtraProps } from "../../../ui/nativeBlurProps";
import MatchTeamMarkNative from "../MatchTeamMarkNative";
import MatchListLineFrameNative, {
  MATCH_LINE_FRAME_GOLD,
} from "../MatchListLineFrameNative";
import MatchCardTeamNameNative from "../MatchCardTeamNameNative";
import { gameCardListStyles as card } from "../gameCardListStyles";
import ProCyberBadgeNative from "../../profile/kinetik/ProCyberBadgeNative";
import {
  ModalActionButtonNative,
  ModalActionRowNative,
} from "../../../ui/ModalActionButtonNative";
import { UNITERZ_LOGO_FLAT_ASSET } from "../../../../../../lib/units/uniterzLogoFlat";
import { proInsightGateCopy } from "../../../../../../lib/predict/proInsightGateCopy";
import { proPickAdCopy } from "../../../../../../lib/predict/proPickAdCopy";
import { JP_400, JP_700 } from "../../profile/reports/reportThemeNative";

const LOGO_FLAT = require("../../../../assets/brand/uniterz-logo-flat.png");

const OXANIUM = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "sans-serif",
});

const JERSEY_SIZE = 50;
const LOGO_W = 108;
const LOGO_H = (LOGO_W * UNITERZ_LOGO_FLAT_ASSET.height) / UNITERZ_LOGO_FLAT_ASSET.width;
const LOGO_GAP_PAD = 10;
const FRAME_BORDER = "rgba(232,197,71,0.5)";
const FRAME_GOLD = MATCH_LINE_FRAME_GOLD;

type Palette = { primary: string; secondary: string };

export type ProPickFirstFreeMatch = {
  homeTitle: string;
  awayTitle: string;
  kickoff: string;
  homePalette: Palette;
  awayPalette: Palette;
  leagueRaw: unknown;
  homeSide: unknown;
  awaySide: unknown;
};

type Props = {
  visible: boolean;
  language: string;
  match: ProPickFirstFreeMatch;
  onLater: () => void;
  onOpenFree: () => void;
};

function TitleWithProPick({ title }: { title: string }) {
  const parts = title.split(/(PRO PICK)/);
  return (
    <Text style={s.title}>
      {parts.map((part, i) =>
        part === "PRO PICK" ? (
          <Text key={i} style={s.titlePro}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

export default function ProPickFirstFreeModalNative({
  visible,
  language,
  match,
  onLater,
  onOpenFree,
}: Props) {
  const gate = proInsightGateCopy(language);
  const unlock = proPickAdCopy(language);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onLater}
      statusBarTranslucent
    >
      <Pressable
        style={s.root}
        onPress={onLater}
        accessibilityRole="button"
        accessibilityLabel={gate.firstFreeLater}
      >
        {(Platform.OS === "ios" || Platform.OS === "android") && (
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFillObject}
            tint="dark"
            intensity={Platform.OS === "ios" ? 28 : 22}
            {...nativeBlurViewExtraProps()}
          />
        )}
        <View style={s.scrim} pointerEvents="none" />

        <Pressable style={s.cardWrap} onPress={(e) => e.stopPropagation()}>
          <View style={s.glass}>
            {(Platform.OS === "ios" || Platform.OS === "android") && (
              <BlurView
                pointerEvents="none"
                style={StyleSheet.absoluteFillObject}
                tint="dark"
                intensity={Platform.OS === "ios" ? 46 : 32}
                {...nativeBlurViewExtraProps()}
              />
            )}
            <View pointerEvents="none" style={s.glassTint} />

            <View style={s.content}>
              <View style={s.badgeWrap}>
                <ProCyberBadgeNative premium />
              </View>
              <TitleWithProPick title={gate.firstFreeAskTitle} />
              <Text style={s.body}>{gate.firstFreeAskBody}</Text>

              <View style={s.facts}>
                {gate.bullets.slice(0, 3).map((row) => (
                  <View key={row.icon} style={s.fact}>
                    <Text style={s.factTitle}>{row.title}</Text>
                    <Text style={s.factDetail}>{row.detail}</Text>
                  </View>
                ))}
              </View>

              <MatchListLineFrameNative
                topLabel="PRO PICK"
                paint={{
                  color: FRAME_GOLD,
                  glow: "rgba(232,197,71,0.28)",
                }}
                style={s.matchFrame}
              >
                <View style={s.matchInterior}>
                  <View style={card.matchupGrid}>
                    <View style={card.lineFrameTeamColumn}>
                      <View style={card.teamTopGroup}>
                        <Text style={card.sideLabel}>HOME</Text>
                        <View style={s.teamMark}>
                          <MatchTeamMarkNative
                            leagueRaw={match.leagueRaw}
                            side={match.homeSide}
                            palette={match.homePalette}
                            jerseySize={JERSEY_SIZE}
                            flagVariant="nextModal"
                          />
                        </View>
                      </View>
                      <View style={card.teamBottomGroup}>
                        <MatchCardTeamNameNative textStyle={card.lineFrameTeamName}>
                          {match.homeTitle}
                        </MatchCardTeamNameNative>
                      </View>
                    </View>

                    <View style={card.centerColumn}>
                      <View style={card.centerScoreWrap}>
                        <Text style={card.centerText} numberOfLines={1}>
                          {match.kickoff}
                        </Text>
                      </View>
                    </View>

                    <View style={card.lineFrameTeamColumn}>
                      <View style={card.teamTopGroup}>
                        <Text style={card.sideLabel}>AWAY</Text>
                        <View style={s.teamMark}>
                          <MatchTeamMarkNative
                            leagueRaw={match.leagueRaw}
                            side={match.awaySide}
                            palette={match.awayPalette}
                            jerseySize={JERSEY_SIZE}
                            flagVariant="nextModal"
                          />
                        </View>
                      </View>
                      <View style={card.teamBottomGroup}>
                        <MatchCardTeamNameNative textStyle={card.lineFrameTeamName}>
                          {match.awayTitle}
                        </MatchCardTeamNameNative>
                      </View>
                    </View>
                  </View>
                </View>
              </MatchListLineFrameNative>

              <View style={s.actions}>
                <ModalActionRowNative>
                  <ModalActionButtonNative
                    label={gate.firstFreeLater}
                    tone="ghost"
                    onPress={onLater}
                  />
                  <ModalActionButtonNative
                    label={unlock.firstFreeCta}
                    tone="primary"
                    onPress={onOpenFree}
                  />
                </ModalActionRowNative>
              </View>
            </View>
          </View>

          <View pointerEvents="none" style={s.frameSidesBottom} />
          <View pointerEvents="none" style={s.frameTopRow}>
            <View style={s.frameTopLine} />
            <View style={{ width: LOGO_W + LOGO_GAP_PAD * 2 }} />
            <View style={s.frameTopLine} />
          </View>
          <View pointerEvents="none" style={s.logoOnLine}>
            <Image
              source={LOGO_FLAT}
              style={{ width: LOGO_W, height: LOGO_H, tintColor: "#fde68a" }}
              resizeMode="contain"
              accessibilityLabel="UNITERZ"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  cardWrap: {
    position: "relative",
    width: "100%",
    maxWidth: 360,
  },
  glass: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 0,
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18,14,6,0.78)",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: LOGO_H / 2 + 14,
    paddingBottom: 18,
    alignItems: "stretch",
  },
  frameSidesBottom: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: FRAME_BORDER,
  },
  frameTopRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    flexDirection: "row",
  },
  frameTopLine: {
    flex: 1,
    height: 1,
    backgroundColor: FRAME_BORDER,
  },
  logoOnLine: {
    position: "absolute",
    top: -LOGO_H / 2,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  badgeWrap: {
    alignItems: "center",
    transform: [{ scale: 1.2 }],
    marginBottom: 10,
  },
  title: {
    fontFamily: OXANIUM,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "rgba(248,250,252,0.96)",
    textAlign: "center",
  },
  titlePro: {
    color: "#fde68a",
    letterSpacing: 0.8,
  },
  body: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    color: "rgba(148,163,184,0.94)",
  },
  facts: {
    marginTop: 14,
    gap: 10,
    paddingHorizontal: 4,
  },
  fact: {
    gap: 2,
  },
  factTitle: {
    fontFamily: JP_700,
    fontSize: 13,
    lineHeight: 18,
    color: "#fde68a",
    textAlign: "center",
  },
  factDetail: {
    fontFamily: JP_400,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(226,232,240,0.78)",
    textAlign: "center",
  },
  matchFrame: {
    marginTop: 14,
    marginBottom: 0,
  },
  matchInterior: {
    paddingHorizontal: 4,
    paddingTop: 18,
    paddingBottom: 14,
  },
  teamMark: {
    width: JERSEY_SIZE,
    height: JERSEY_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    marginTop: 18,
    width: "100%",
  },
});
