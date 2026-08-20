/**
 * Web `PredictProBriefPanel` 相当 — タイトル + Pro バッジ + 左右比較
 * Free は ReportGate 同型の PRO INSIGHT ブラーゲート
 */
import type { ComponentProps, ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  briefEdgeDetail,
  briefLineText,
  splitBriefLineLead,
  type PredictProBrief,
  type ProBriefEdgeItem,
  type ProBriefLineItem,
  type ProBriefTeamCard,
} from "../../../../../../lib/predict/predictProBrief";
import { sanitizeProBriefForDisplay } from "../../../../../../lib/predict/validateProBrief";
import {
  proInsightGateCopy,
  type ProInsightGateBulletIcon,
} from "../../../../../../lib/predict/proInsightGateCopy";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import { getTeamJerseyPrimaryColor } from "../../../../../../lib/team-colors";
import { nativeBlurViewExtraProps } from "../../../ui/nativeBlurProps";
import ProCyberBadgeNative from "../../profile/kinetik/ProCyberBadgeNative";
import {
  OXANIUM_700,
  OXANIUM_800,
} from "../../profile/reports/reportThemeNative";
import { MATCH_CARD_DISPLAY_FONT } from "../matchCardTypography";
import type { GamesLanguage } from "../gamesI18n";
import { UNITERZ_PRO_BADGE_GOLD } from "../../../../../../lib/units/uniterzProBadge";

type Props = {
  brief?: PredictProBrief | null;
  language: GamesLanguage;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  /** Free: タイトル下をぼかして CTA */
  locked?: boolean;
  onPressUpgrade?: () => void;
};

type SectionTone = "matchup" | "schedule" | "context";

const EMPTY_CARD: ProBriefTeamCard = {
  edges: [],
  schedule: [],
  context: [],
};

const BULLET_ICONS: Record<
  ProInsightGateBulletIcon,
  ComponentProps<typeof MaterialCommunityIcons>["name"]
> = {
  matchup: "sword-cross",
  schedule: "calendar-range",
  context: "chart-timeline-variant",
  edge: "scale-balance",
  comment: "comment-text-outline",
};

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(34,211,238,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function teamNick(teamId: string, fallback: string): string {
  if (teamId.startsWith("nba-")) {
    const full = NBA_TEAM_NAME_BY_ID[teamId];
    if (full) return getMobileTeamName("nba", full);
  }
  return fallback;
}

function TitleWithBrandFontsNative({ title }: { title: string }) {
  return (
    <>
      {title.split(/(Pro)/).map((part, i) =>
        part === "Pro" ? (
          <Text key={i} style={styles.gateTitlePro}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </>
  );
}

function SectionLabel({
  children,
  tone,
}: {
  children: string;
  tone: SectionTone;
}) {
  const color =
    tone === "matchup"
      ? "rgba(110,231,183,0.9)"
      : tone === "schedule"
        ? "rgba(253,230,138,0.9)"
        : "rgba(103,232,249,0.88)";
  return (
    <View style={styles.sectionLabelWrap}>
      <Text style={[styles.sectionLabel, { color }]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

function EdgeBlock({
  edges,
  language,
  align,
}: {
  edges: ProBriefEdgeItem[];
  language: GamesLanguage;
  align: "left" | "right";
}) {
  const lang = language === "ja" ? "ja" : "en";
  const end = align === "right";
  if (edges.length === 0) {
    return <Text style={[styles.emptyLine, end && styles.textRight]}>—</Text>;
  }
  return (
    <View style={styles.blockStack}>
      {edges.map((edge, i) => {
        const detail = briefEdgeDetail(edge, lang);
        return (
          <View key={`e-${i}`} style={styles.edgeItem}>
            <Text
              style={[styles.edgeLabel, end && styles.textRight]}
              numberOfLines={2}
            >
              {edge.label}
            </Text>
            {detail ? (
              <Text
                style={[styles.edgeDetail, end && styles.textRight]}
                numberOfLines={3}
              >
                {detail}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function LineBlock({
  items,
  language,
  align,
  tone,
}: {
  items: ProBriefLineItem[];
  language: GamesLanguage;
  align: "left" | "right";
  tone: "schedule" | "context";
}) {
  const lang = language === "ja" ? "ja" : "en";
  const end = align === "right";
  const lineStyle = tone === "schedule" ? styles.scheduleLine : styles.contextLine;
  if (items.length === 0) {
    return <Text style={[styles.emptyLine, end && styles.textRight]}>—</Text>;
  }
  return (
    <View style={styles.blockStack}>
      {items.map((item, i) => {
        const { label, body } = splitBriefLineLead(briefLineText(item, lang));
        return (
          <View key={`${tone}-${i}`} style={styles.edgeItem}>
            {label ? (
              <>
                <Text
                  style={[styles.edgeLabel, end && styles.textRight]}
                  numberOfLines={2}
                >
                  {label}
                </Text>
                <Text
                  style={[lineStyle, end && styles.textRight]}
                  numberOfLines={3}
                >
                  {body}
                </Text>
              </>
            ) : (
              <Text
                style={[lineStyle, styles.lineSolo, end && styles.textRight]}
                numberOfLines={3}
              >
                {body}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function CompareSection({
  label,
  tone,
  left,
  right,
}: {
  label: string;
  tone: SectionTone;
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <View style={styles.compareRow}>
      <View style={styles.compareHead}>
        <SectionLabel tone={tone}>{label}</SectionLabel>
      </View>
      <View style={styles.compareCols}>
        <View style={[styles.compareSide, styles.compareSideLeft]}>{left}</View>
        <View style={[styles.compareSide, styles.compareSideRight]}>{right}</View>
      </View>
    </View>
  );
}

function PlaceholderBody() {
  return (
    <View style={styles.blockStack}>
      <Text style={styles.edgeLabel}>······</Text>
      <Text style={styles.edgeDetail}>······</Text>
      <Text style={styles.scheduleLine}>······</Text>
    </View>
  );
}

export default function PredictProBriefPanelNative({
  brief = null,
  language,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  locked = false,
  onPressUpgrade,
}: Props) {
  const gateLang = language === "ja" ? "ja" : "en";
  const gate = proInsightGateCopy(gateLang);
  const homeNick = teamNick(homeTeamId, homeTeamName).toUpperCase();
  const awayNick = teamNick(awayTeamId, awayTeamName).toUpperCase();
  const homeColor = getTeamJerseyPrimaryColor("nba", homeTeamId);
  const awayColor = getTeamJerseyPrimaryColor("nba", awayTeamId);
  const safeBrief = useMemo(() => sanitizeProBriefForDisplay(brief), [brief]);
  const home = safeBrief?.home ?? EMPTY_CARD;
  const away = safeBrief?.away ?? EMPTY_CARD;
  const usePlaceholder = safeBrief == null;

  const body = (
    <View style={styles.body}>
      <View pointerEvents="none" style={styles.centerRule} />
      <CompareSection
        label="MATCHUP"
        tone="matchup"
        left={
          usePlaceholder ? (
            <PlaceholderBody />
          ) : (
            <EdgeBlock edges={home.edges} language={language} align="left" />
          )
        }
        right={
          usePlaceholder ? (
            <PlaceholderBody />
          ) : (
            <EdgeBlock edges={away.edges} language={language} align="right" />
          )
        }
      />
      <CompareSection
        label="SCHEDULE"
        tone="schedule"
        left={
          usePlaceholder ? (
            <PlaceholderBody />
          ) : (
            <LineBlock
              items={home.schedule}
              language={language}
              align="left"
              tone="schedule"
            />
          )
        }
        right={
          usePlaceholder ? (
            <PlaceholderBody />
          ) : (
            <LineBlock
              items={away.schedule}
              language={language}
              align="right"
              tone="schedule"
            />
          )
        }
      />
      <CompareSection
        label="CONTEXT"
        tone="context"
        left={
          usePlaceholder ? (
            <PlaceholderBody />
          ) : (
            <LineBlock
              items={home.context}
              language={language}
              align="left"
              tone="context"
            />
          )
        }
        right={
          usePlaceholder ? (
            <PlaceholderBody />
          ) : (
            <LineBlock
              items={away.context}
              language={language}
              align="right"
              tone="context"
            />
          )
        }
      />
    </View>
  );

  return (
    <View style={styles.shell}>
      <View style={styles.titleRow}>
        <View style={styles.titleSide}>
          <Text style={[styles.sideTag, { color: hexToRgba(homeColor, 0.9) }]}>
            HOME
          </Text>
          <Text
            style={[styles.titleNick, { color: homeColor }]}
            numberOfLines={1}
          >
            {homeNick}
          </Text>
        </View>

        <View style={styles.proBadgeWrap}>
          <ProCyberBadgeNative premium />
        </View>

        <View style={[styles.titleSide, styles.titleSideAway]}>
          <Text style={[styles.sideTag, { color: hexToRgba(awayColor, 0.9) }]}>
            AWAY
          </Text>
          <Text
            style={[styles.titleNick, styles.textRight, { color: awayColor }]}
            numberOfLines={1}
          >
            {awayNick}
          </Text>
        </View>
      </View>

      {locked ? (
        <View style={styles.lockedHost}>
          <View pointerEvents="none" style={styles.previewClip}>
            {body}
          </View>
          <BlurView
            intensity={36}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
            {...nativeBlurViewExtraProps()}
          />
          <View style={styles.lockedVeil} pointerEvents="none" />
          <View style={styles.gateOverlay} pointerEvents="box-none">
            <View style={styles.gateMessage}>
              <View style={styles.gateCenter}>
                <Text style={styles.gateEyebrow}>{gate.eyebrow}</Text>
                <View style={styles.gateBadgeScale}>
                  <ProCyberBadgeNative premium />
                </View>
                <Text style={styles.gateTitle}>
                  <TitleWithBrandFontsNative title={gate.title} />
                </Text>
                <Text style={styles.gateBody}>{gate.body}</Text>
                {onPressUpgrade ? (
                  <Pressable
                    onPress={onPressUpgrade}
                    style={styles.cta}
                    accessibilityRole="button"
                    accessibilityLabel={gate.cta}
                  >
                    <Text style={styles.ctaLabel}>{gate.cta}</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.bulletPanel}>
                {gate.bullets.map((item) => (
                  <View key={item.title} style={styles.bulletRow}>
                    <View style={styles.bulletIcon}>
                      <MaterialCommunityIcons
                        name={BULLET_ICONS[item.icon]}
                        size={12}
                        color="#fdba74"
                      />
                    </View>
                    <View style={styles.bulletCopy}>
                      <Text style={styles.bulletTitle}>{item.title}</Text>
                      <Text style={styles.bulletDetail}>{item.detail}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1,
    borderColor: UNITERZ_PRO_BADGE_GOLD.mid,
    backgroundColor: "#000000",
    paddingHorizontal: 10,
    paddingVertical: 10,
    overflow: "hidden",
    position: "relative",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  titleSide: {
    flex: 1,
    minWidth: 0,
  },
  titleSideAway: {
    alignItems: "flex-end",
  },
  sideTag: {
    fontFamily: OXANIUM_700,
    fontSize: 9,
    letterSpacing: 1.6,
    marginBottom: 3,
  },
  titleNick: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 18,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: 1.44,
    textTransform: "uppercase",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
  },
  proBadgeWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    transform: [{ scale: 1.18 }],
  },
  body: {
    position: "relative",
    gap: 0,
  },
  centerRule: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 1,
    marginLeft: -0.5,
    backgroundColor: "rgba(0,245,255,0.38)",
    zIndex: 0,
  },
  compareRow: {
    position: "relative",
    zIndex: 1,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  compareHead: {
    marginBottom: 8,
    alignItems: "center",
    zIndex: 1,
  },
  compareCols: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 16,
  },
  compareSide: {
    flex: 1,
    minWidth: 0,
    justifyContent: "flex-start",
  },
  compareSideLeft: {},
  compareSideRight: {},
  sectionLabelWrap: {
    backgroundColor: "#000000",
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  sectionLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  blockStack: {
    gap: 8,
  },
  edgeItem: {
    gap: 2,
  },
  edgeLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 13,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.92)",
  },
  edgeDetail: {
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.72)",
  },
  scheduleLine: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "rgba(255,251,235,0.9)",
  },
  contextLine: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "rgba(236,254,255,0.88)",
  },
  lineSolo: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyLine: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
  },
  textRight: {
    textAlign: "right",
  },
  lockedHost: {
    position: "relative",
    overflow: "hidden",
    minHeight: 320,
  },
  previewClip: {
    opacity: 0.9,
  },
  lockedVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4,8,14,0.55)",
  },
  gateOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 8,
  },
  gateMessage: {
    width: "100%",
    maxWidth: 360,
    gap: 12,
  },
  gateCenter: {
    alignItems: "center",
    gap: 10,
  },
  gateEyebrow: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(165,243,252,0.8)",
  },
  gateBadgeScale: {
    transform: [{ scale: 1.45 }],
    marginVertical: 4,
  },
  gateTitle: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 24,
    color: "#fff",
    textAlign: "center",
  },
  gateTitlePro: {
    fontFamily: OXANIUM_800,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  gateBody: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
  },
  cta: {
    minWidth: 160,
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 2,
    backgroundColor: "#00F5FF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 12,
    letterSpacing: 1.2,
    textAlign: "center",
    color: "#050508",
    textTransform: "uppercase",
  },
  bulletPanel: {
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.55)",
    backgroundColor: "rgba(249,115,22,0.07)",
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletIcon: {
    marginTop: 2,
    width: 20,
    height: 20,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.45)",
    backgroundColor: "rgba(249,115,22,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  bulletCopy: {
    flex: 1,
    minWidth: 0,
  },
  bulletTitle: {
    fontFamily: OXANIUM_800,
    fontSize: 11,
    letterSpacing: 0.4,
    color: "#ffedd5",
  },
  bulletDetail: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.7)",
  },
});
