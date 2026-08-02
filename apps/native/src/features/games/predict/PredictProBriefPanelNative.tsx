/** Web `PredictProBriefPanel` 相当 — タイトル + Pro バッジ + 左右比較（Free はぼかし + CTA） */
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import {
  briefEdgeDetail,
  briefLineText,
  type PredictProBrief,
  type ProBriefEdgeItem,
  type ProBriefLineItem,
  type ProBriefTeamCard,
} from "../../../../../../lib/predict/predictProBrief";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import { getTeamJerseyPrimaryColor } from "../../../../../../lib/team-colors";
import { nativeBlurViewExtraProps } from "../../../ui/nativeBlurProps";
import ProCyberBadgeNative from "../../profile/kinetik/ProCyberBadgeNative";
import type { GamesLanguage } from "../gamesI18n";
import { getGamesTexts } from "../gamesI18n";

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
    <Text style={[styles.sectionLabel, { color }]} numberOfLines={1}>
      {children}
    </Text>
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
      {items.map((item, i) => (
        <Text
          key={`${tone}-${i}`}
          style={[lineStyle, end && styles.textRight]}
          numberOfLines={3}
        >
          {briefLineText(item, lang)}
        </Text>
      ))}
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
      <View style={[styles.compareSide, styles.compareSideLeft]}>{left}</View>
      <View style={styles.compareLabelCol}>
        <SectionLabel tone={tone}>{label}</SectionLabel>
      </View>
      <View style={[styles.compareSide, styles.compareSideRight]}>{right}</View>
    </View>
  );
}

function PlaceholderBody({ language }: { language: GamesLanguage }) {
  const dash = language === "ja" ? "······" : "······";
  return (
    <View style={styles.blockStack}>
      <Text style={styles.edgeLabel}>{dash}</Text>
      <Text style={styles.edgeDetail}>{dash}</Text>
      <Text style={styles.scheduleLine}>{dash}</Text>
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
  const t = getGamesTexts(language);
  const homeNick = teamNick(homeTeamId, homeTeamName).toUpperCase();
  const awayNick = teamNick(awayTeamId, awayTeamName).toUpperCase();
  const homeColor = getTeamJerseyPrimaryColor("nba", homeTeamId);
  const awayColor = getTeamJerseyPrimaryColor("nba", awayTeamId);
  const home = brief?.home ?? EMPTY_CARD;
  const away = brief?.away ?? EMPTY_CARD;
  const usePlaceholder = brief == null;

  const body = (
    <View style={styles.body}>
      <CompareSection
        label="MATCHUP"
        tone="matchup"
        left={
          usePlaceholder ? (
            <PlaceholderBody language={language} />
          ) : (
            <EdgeBlock edges={home.edges} language={language} align="right" />
          )
        }
        right={
          usePlaceholder ? (
            <PlaceholderBody language={language} />
          ) : (
            <EdgeBlock edges={away.edges} language={language} align="left" />
          )
        }
      />
      <CompareSection
        label="SCHEDULE"
        tone="schedule"
        left={
          usePlaceholder ? (
            <PlaceholderBody language={language} />
          ) : (
            <LineBlock
              items={home.schedule}
              language={language}
              align="right"
              tone="schedule"
            />
          )
        }
        right={
          usePlaceholder ? (
            <PlaceholderBody language={language} />
          ) : (
            <LineBlock
              items={away.schedule}
              language={language}
              align="left"
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
            <PlaceholderBody language={language} />
          ) : (
            <LineBlock
              items={home.context}
              language={language}
              align="right"
              tone="context"
            />
          )
        }
        right={
          usePlaceholder ? (
            <PlaceholderBody language={language} />
          ) : (
            <LineBlock
              items={away.context}
              language={language}
              align="left"
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
          <View pointerEvents="none">{body}</View>
          <BlurView
            intensity={34}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
            {...nativeBlurViewExtraProps()}
          />
          <View style={styles.lockedVeil} pointerEvents="none" />
          <View style={styles.lockedCtaWrap} pointerEvents="box-none">
            <Text style={styles.lockedHint}>{t.insightProOnly}</Text>
            <Pressable
              onPress={onPressUpgrade}
              style={styles.cta}
              accessibilityRole="button"
              accessibilityLabel={t.insightUpgradeCta}
            >
              <Text style={styles.ctaLabel}>{t.insightUpgradeCta}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        body
      )}
    </View>
  );
}

const OXANIUM = "Oxanium_700Bold";

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.22)",
    backgroundColor: "rgba(5,10,18,0.88)",
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
    fontFamily: OXANIUM,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.6,
    marginBottom: 3,
  },
  titleNick: {
    fontFamily: OXANIUM,
    fontSize: 18,
    fontWeight: "800",
    fontStyle: "italic",
    letterSpacing: 0.6,
  },
  proBadgeWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    transform: [{ scale: 1.18 }],
  },
  body: {
    gap: 0,
  },
  compareRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  compareSide: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  compareSideLeft: {},
  compareSideRight: {},
  compareLabelCol: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  sectionLabel: {
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
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
    fontFamily: OXANIUM,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.92)",
  },
  edgeDetail: {
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.5)",
  },
  scheduleLine: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: "rgba(255,251,235,0.85)",
  },
  contextLine: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: "rgba(236,254,255,0.8)",
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
    minHeight: 180,
  },
  lockedVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4,8,14,0.42)",
  },
  lockedCtaWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
  },
  lockedHint: {
    fontFamily: OXANIUM,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
  },
  cta: {
    minWidth: 180,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 2,
    backgroundColor: "#00F5FF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  ctaLabel: {
    fontFamily: OXANIUM,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    textAlign: "center",
    color: "#050508",
    textTransform: "uppercase",
  },
});
