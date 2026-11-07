/**
 * Free 向け INSIGHT — ピックアップ試合の PREVIEW 第 1 段落だけ見せ、続きは Pro（無料トライアル）へ。
 */
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import { getTeamJerseyPrimaryColor } from "../../../../../../lib/team-colors";
import { proInsightTeaserCopy } from "../../../../../../lib/predict/proInsightGateCopy";
import type { ProInsightPreviewTeaser } from "../../../../../../lib/predict/proInsightPreviewTeaser";
import ProCyberBadgeNative from "../../profile/kinetik/ProCyberBadgeNative";
import { OXANIUM_600, OXANIUM_800, JP_600 } from "../../profile/reports/reportThemeNative";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";
import { MATCH_CARD_TEAM_NAME_FONT } from "../matchCardTypography";
import type { GamesLanguage } from "../gamesI18n";

const PREVIEW_ACCENT = "rgba(232,197,110,0.95)";
/** 続きがあることだけを見せるダミー行（本文はサーバーから来ない） */
const GHOST_LINE_WIDTHS = ["100%", "96%", "100%", "88%", "93%", "62%"] as const;

type Props = {
  teaser: ProInsightPreviewTeaser;
  language: GamesLanguage;
  homeTeamName: string;
  awayTeamName: string;
  onPressUpgrade: () => void;
};

function teamNick(teamId: string, fallbackName: string): string {
  const full = NBA_TEAM_NAME_BY_ID[teamId];
  if (full) return getMobileTeamName("nba", full);
  return fallbackName.trim();
}

export default function PredictProInsightTeaserPanelNative({
  teaser,
  language,
  homeTeamName,
  awayTeamName,
  onPressUpgrade,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const copy = proInsightTeaserCopy(language);
  const para = L(lang, teaser.preview);
  const homeNick = teamNick(teaser.homeTeamId, homeTeamName).toUpperCase();
  const awayNick = teamNick(teaser.awayTeamId, awayTeamName).toUpperCase();
  const androidLayer = Platform.OS === "android" ? { opacity: 0.999 } : null;

  return (
    <View style={styles.shell}>
      <View style={styles.matchRow}>
        <View style={styles.proBadgeWrap}>
          <ProCyberBadgeNative premium />
        </View>
        <View collapsable={false} renderToHardwareTextureAndroid style={[styles.skew8, androidLayer]}>
          <Text
            style={[styles.matchTeam, { color: getTeamJerseyPrimaryColor("nba", teaser.homeTeamId) }]}
            numberOfLines={1}
          >
            {homeNick}
          </Text>
        </View>
        <View collapsable={false} renderToHardwareTextureAndroid style={[styles.skew8, androidLayer]}>
          <Text style={styles.matchVs}>vs</Text>
        </View>
        <View collapsable={false} renderToHardwareTextureAndroid style={[styles.skew8, androidLayer]}>
          <Text
            style={[styles.matchTeam, { color: getTeamJerseyPrimaryColor("nba", teaser.awayTeamId) }]}
            numberOfLines={1}
          >
            {awayNick}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View collapsable={false} renderToHardwareTextureAndroid style={[styles.kindWrap, androidLayer]}>
          <Text style={styles.kind}>PREVIEW</Text>
        </View>
        <View collapsable={false} renderToHardwareTextureAndroid style={[styles.bodySkew, androidLayer]}>
          <Text style={styles.previewBody}>{para}</Text>
        </View>
        <View style={styles.ghost} pointerEvents="none">
          {GHOST_LINE_WIDTHS.map((w, i) => (
            <View key={i} style={[styles.ghostLine, { width: w }]} />
          ))}
          <LinearGradient
            colors={["rgba(5,5,8,0)", "rgba(5,5,8,0.85)", "rgba(5,5,8,1)"]}
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>

      <View style={styles.lockBox}>
        <Text style={styles.lockTitle}>{copy.title}</Text>
        <Text style={styles.lockBody}>{copy.body}</Text>
        <Pressable
          onPress={onPressUpgrade}
          style={({ pressed }) => [styles.cta, pressed ? styles.ctaPressed : null]}
          accessibilityRole="button"
          accessibilityLabel={copy.cta}
        >
          <Text style={styles.ctaLabel}>{copy.cta}</Text>
        </Pressable>
        <Text style={styles.note}>{copy.note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: "#050508",
    borderWidth: 1,
    borderColor: "rgba(212,175,90,0.35)",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  proBadgeWrap: {
    flexShrink: 0,
    transform: [{ scale: 0.92 }],
  },
  skew8: {
    flexShrink: 1,
    transform: [{ skewX: "-8deg" }],
  },
  matchTeam: {
    flexShrink: 1,
    fontFamily: MATCH_CARD_TEAM_NAME_FONT,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  matchVs: {
    fontFamily: OXANIUM_600,
    fontSize: 11,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.45)",
  },
  section: {
    paddingVertical: 12,
    gap: 8,
  },
  kindWrap: {
    alignSelf: "flex-start",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: PREVIEW_ACCENT,
    paddingHorizontal: 8,
    paddingVertical: 2,
    transform: [{ skewX: "-6deg" }],
  },
  kind: {
    fontFamily: OXANIUM_800,
    fontSize: 10,
    letterSpacing: 1.6,
    color: PREVIEW_ACCENT,
    includeFontPadding: false,
    transform: [{ skewX: "6deg" }],
  },
  bodySkew: {
    transform: [{ skewX: "-4deg" }],
  },
  previewBody: {
    fontFamily: JP_600,
    fontSize: 13.5,
    lineHeight: 21,
    color: "rgba(255,255,255,0.92)",
  },
  ghost: {
    marginTop: 4,
    gap: 9,
    overflow: "hidden",
  },
  ghostLine: {
    height: 11,
    backgroundColor: "rgba(255,255,255,0.13)",
    transform: [{ skewX: "-4deg" }],
  },
  lockBox: {
    borderWidth: 1,
    borderColor: "rgba(232,197,110,0.55)",
    backgroundColor: "rgba(232,197,110,0.05)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
    alignItems: "center",
  },
  lockTitle: {
    fontFamily: OXANIUM_800,
    fontSize: 15,
    letterSpacing: 1,
    color: PREVIEW_ACCENT,
    textAlign: "center",
  },
  lockBody: {
    fontFamily: JP_600,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.78)",
    textAlign: "center",
  },
  cta: {
    alignSelf: "stretch",
    marginTop: 4,
    backgroundColor: CYBER_TAB_CYAN,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaLabel: {
    fontFamily: JP_600,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#050508",
  },
  note: {
    fontFamily: JP_600,
    fontSize: 10.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
});
