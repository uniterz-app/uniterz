/** 予想ページを開いたとき。この試合の PRO PICK 初回無料を聞く。 */
import {
  Image,
  type ImageSourcePropType,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { nativeBlurViewExtraProps } from "../../../ui/nativeBlurProps";
import MatchTeamMarkNative from "../MatchTeamMarkNative";
import { ModalActionButtonNative } from "../../../ui/ModalActionButtonNative";
import { UNITERZ_LOGO_FLAT_ASSET } from "../../../../../../lib/units/uniterzLogoFlat";
import { UNITERZ_PRO_BADGE_GOLD } from "../../../../../../lib/units/uniterzProBadge";
import { proInsightGateCopy } from "../../../../../../lib/predict/proInsightGateCopy";
import { proPickAdCopy } from "../../../../../../lib/predict/proPickAdCopy";
import {
  JP_400,
  JP_600,
  JP_700,
  OXANIUM_700,
  OXANIUM_800,
} from "../../profile/reports/reportThemeNative";

const LOGO_FLAT = require("../../../../assets/brand/uniterz-logo-flat.png");
const HERO = require("../../../assets/pro/pro-pick-hero.jpg") as ImageSourcePropType;

const JERSEY_SIZE = 40;
const LOGO_W = 108;
const LOGO_H =
  (LOGO_W * UNITERZ_LOGO_FLAT_ASSET.height) / UNITERZ_LOGO_FLAT_ASSET.width;
const LOGO_GAP_PAD = 10;
const FRAME_BORDER = "rgba(232,197,71,0.5)";
const HERO_MAX_H = 148;
const HERO_WIDTH_RATIO = 0.5;

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
  /** 予想 Modal の中に重ねる（入れ子 Modal にしない） */
  embedded?: boolean;
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

function PeekCell({ label, veil }: { label: string; veil: string }) {
  return (
    <View style={s.peekCell}>
      <Text style={s.peekLab} numberOfLines={1}>
        {label}
      </Text>
      <Text style={s.peekVeil}>{veil}</Text>
    </View>
  );
}

export default function ProPickFirstFreeModalNative({
  visible,
  language,
  match,
  onLater,
  onOpenFree,
  embedded = false,
}: Props) {
  const gate = proInsightGateCopy(language);
  const unlock = proPickAdCopy(language);
  const { width: winW } = useWindowDimensions();
  const heroH = Math.min(HERO_MAX_H, Math.round((winW - 56) * HERO_WIDTH_RATIO));
  const peek = gate.bullets.slice(0, 3);

  const body = (
    <Pressable
      style={embedded ? [s.root, s.embedded] : s.root}
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
            <View style={s.kicker}>
              <Text style={s.kickerText}>{gate.firstFreeKicker}</Text>
            </View>
            <TitleWithProPick title={gate.firstFreeAskTitle} />
            <Text style={s.body}>{gate.firstFreeAskBody}</Text>

            <View style={[s.hero, { height: heroH }]}>
              <Image
                source={HERO}
                style={s.heroImg}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            </View>
            <View style={s.matchRow}>
              <View style={s.matchSide}>
                <MatchTeamMarkNative
                  leagueRaw={match.leagueRaw}
                  side={match.homeSide}
                  palette={match.homePalette}
                  jerseySize={JERSEY_SIZE}
                  flagVariant="nextModal"
                />
                <Text style={s.heroTeam} numberOfLines={1}>
                  {match.homeTitle}
                </Text>
              </View>
              <View style={s.heroCenter}>
                <Text style={s.heroVs}>VS</Text>
                <Text style={s.heroKick}>{match.kickoff}</Text>
              </View>
              <View style={s.matchSide}>
                <MatchTeamMarkNative
                  leagueRaw={match.leagueRaw}
                  side={match.awaySide}
                  palette={match.awayPalette}
                  jerseySize={JERSEY_SIZE}
                  flagVariant="nextModal"
                />
                <Text style={s.heroTeam} numberOfLines={1}>
                  {match.awayTitle}
                </Text>
              </View>
            </View>

            <View style={s.peek}>
              <PeekCell label={peek[0]?.title ?? ""} veil="??%" />
              <View style={s.peekRule} />
              <PeekCell label={peek[1]?.title ?? ""} veil="??–??" />
              <View style={s.peekRule} />
              <PeekCell
                label={(peek[2]?.title ?? "").replace(/の候補$/, "")}
                veil="???"
              />
            </View>

            <View style={s.actions}>
              <ModalActionButtonNative
                label={unlock.firstFreeCta}
                tone="primary"
                onPress={onOpenFree}
              />
              <Pressable
                onPress={onLater}
                accessibilityRole="button"
                accessibilityLabel={gate.firstFreeLater}
                style={({ pressed }) => [
                  s.laterBtn,
                  pressed && s.laterBtnPressed,
                ]}
              >
                <Text style={s.laterTxt}>{gate.firstFreeLater}</Text>
              </Pressable>
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
  );

  if (embedded) {
    if (!visible) return null;
    return body;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onLater}
      statusBarTranslucent
    >
      {body}
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
  embedded: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
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
    backgroundColor: "rgba(8,10,16,0.92)",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: LOGO_H / 2 + 12,
    paddingBottom: 14,
    alignItems: "stretch",
    gap: 10,
  },
  kicker: {
    alignSelf: "center",
    backgroundColor: UNITERZ_PRO_BADGE_GOLD.bright,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  kickerText: {
    fontFamily: OXANIUM_800,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "#120e08",
  },
  title: {
    fontFamily: JP_700,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0.2,
    color: "#f8fafc",
    textAlign: "center",
  },
  titlePro: {
    fontFamily: OXANIUM_800,
    color: UNITERZ_PRO_BADGE_GOLD.bright,
    letterSpacing: 0.8,
  },
  body: {
    fontFamily: JP_400,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "rgba(255,255,255,0.72)",
  },
  hero: {
    alignSelf: "stretch",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,245,255,0.28)",
  },
  heroImg: {
    position: "absolute",
    width: "170%",
    height: "200%",
    left: "-18%",
    top: "-32%",
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 4,
  },
  matchSide: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  heroTeam: {
    fontFamily: OXANIUM_800,
    fontSize: 10,
    letterSpacing: 0.8,
    color: "#fff",
    textTransform: "uppercase",
  },
  heroCenter: {
    alignItems: "center",
    paddingBottom: 2,
    gap: 2,
  },
  heroVs: {
    fontFamily: OXANIUM_800,
    fontSize: 11,
    letterSpacing: 2,
    color: UNITERZ_PRO_BADGE_GOLD.bright,
  },
  heroKick: {
    fontFamily: OXANIUM_700,
    fontSize: 11,
    color: "rgba(255,255,255,0.82)",
  },
  peek: {
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: "rgba(244,223,154,0.22)",
    backgroundColor: "rgba(244,223,154,0.05)",
  },
  peekCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 4,
  },
  peekLab: {
    fontFamily: JP_600,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.58)",
    textAlign: "center",
  },
  peekVeil: {
    fontFamily: OXANIUM_800,
    fontSize: 16,
    letterSpacing: 0.6,
    color: UNITERZ_PRO_BADGE_GOLD.bright,
    opacity: 0.45,
  },
  peekRule: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(244,223,154,0.22)",
  },
  actions: {
    marginTop: 4,
    width: "100%",
    gap: 8,
  },
  laterBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  laterBtnPressed: {
    opacity: 0.7,
  },
  laterTxt: {
    fontFamily: JP_600,
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
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
});
