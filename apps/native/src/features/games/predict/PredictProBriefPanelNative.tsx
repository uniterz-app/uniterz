/**
 * Web `PredictProBriefPanel` 相当 — HOME | AWAY 2カラム · Free ゲート CTA
 */
import type { ComponentProps, ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  briefEdgeDetail,
  briefLineText,
  briefPlayerDetail,
  briefSampleNote,
  splitBriefLineLead,
  type PredictProBrief,
  type ProBriefEdgeItem,
  type ProBriefLineItem,
  type ProBriefPlayerItem,
  type ProBriefTeamCard,
} from "../../../../../../lib/predict/predictProBrief";
import { sanitizeProBriefForDisplay } from "../../../../../../lib/predict/validateProBrief";
import {
  proInsightGateCopy,
  type ProInsightGateBulletIcon,
} from "../../../../../../lib/predict/proInsightGateCopy";
import { PRO_INSIGHT_GATE_SAMPLE_BRIEF } from "../../../../../../lib/predict/proInsightGateSampleBrief";
import { resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import { getTeamJerseyPrimaryColor } from "../../../../../../lib/team-colors";
import ProCyberBadgeNative from "../../profile/kinetik/ProCyberBadgeNative";
import UniterzLogoNative from "../../profile/UniterzLogoNative";
import {
  OXANIUM_600,
  OXANIUM_700,
  OXANIUM_800,
  JP_400,
} from "../../profile/reports/reportThemeNative";
import { MATCH_CARD_TEAM_NAME_FONT } from "../matchCardTypography";
import type { GamesLanguage } from "../gamesI18n";
import { UNITERZ_PRO_BADGE_GOLD } from "../../../../../../lib/units/uniterzProBadge";

type Props = {
  brief?: PredictProBrief | null;
  language: GamesLanguage;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  /** Free: 説明 + CTA + 下に実画面サンプル */
  locked?: boolean;
  onPressUpgrade?: () => void;
};

type SectionTone = "matchup" | "schedule" | "context" | "players";

const EMPTY_CARD: ProBriefTeamCard = {
  edges: [],
  schedule: [],
  context: [],
  players: [],
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
    <View style={styles.gateTitleRow}>
      {title.split(/(PRO INSIGHT|Pro)/).map((part, i) => {
        if (!part) return null;
        if (part === "PRO INSIGHT" || part === "Pro") {
          return (
            <Text key={i} style={[styles.gateTitle, styles.gateTitlePro]}>
              {part}
            </Text>
          );
        }
        return (
          <Text key={i} style={styles.gateTitle}>
            {part}
          </Text>
        );
      })}
    </View>
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
        : tone === "context"
          ? "rgba(103,232,249,0.88)"
          : "rgba(196,181,253,0.9)";
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
  const lang = resolveLocalizedLang(language);
  const end = align === "right";
  if (edges.length === 0) {
    return (
      <Text style={[styles.emptyLine, detailFont(lang), end && styles.textRight]}>
        —
      </Text>
    );
  }
  return (
    <View style={styles.blockStack}>
      {edges.map((edge, i) => {
        const detail = briefEdgeDetail(edge, lang);
        return (
          <View key={`e-${i}`} style={styles.edgeItem}>
            <Text
              style={[
                styles.itemLabel,
                lang === "en" ? styles.itemLabelEn : null,
                end && styles.textRight,
              ]}
              numberOfLines={2}
            >
              {edge.label}
            </Text>
            {detail ? (
              <Text
                style={[
                  styles.itemDetail,
                  detailFont(lang),
                  end && styles.textRight,
                ]}
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
  const lang = resolveLocalizedLang(language);
  const end = align === "right";
  const detailTone =
    tone === "schedule" ? styles.itemDetailSchedule : styles.itemDetailContext;
  if (items.length === 0) {
    return (
      <Text style={[styles.emptyLine, detailFont(lang), end && styles.textRight]}>
        —
      </Text>
    );
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
                  style={[
                    styles.itemLabel,
                    lang === "en" ? styles.itemLabelEn : null,
                    end && styles.textRight,
                  ]}
                  numberOfLines={2}
                >
                  {label}
                </Text>
                <Text
                  style={[
                    styles.itemDetail,
                    detailTone,
                    detailFont(lang),
                    end && styles.textRight,
                  ]}
                  numberOfLines={3}
                >
                  {body}
                </Text>
              </>
            ) : (
              <Text
                style={[
                  styles.itemDetail,
                  detailTone,
                  detailFont(lang),
                  end && styles.textRight,
                ]}
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

function PlayerBlock({
  players,
  language,
  align,
}: {
  players: ProBriefPlayerItem[];
  language: GamesLanguage;
  align: "left" | "right";
}) {
  const lang = resolveLocalizedLang(language);
  const end = align === "right";
  if (players.length === 0) {
    return (
      <Text style={[styles.emptyLine, detailFont(lang), end && styles.textRight]}>
        —
      </Text>
    );
  }
  return (
    <View style={styles.blockStack}>
      {players.map((player, i) => {
        const detail = briefPlayerDetail(player, lang);
        const title = `${player.playerName} · ${player.label}`;
        return (
          <View key={`p-${player.playerId ?? i}`} style={styles.edgeItem}>
            <Text
              style={[
                styles.itemLabel,
                lang === "en" ? styles.itemLabelEn : null,
                end && styles.textRight,
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>
            {detail ? (
              <Text
                style={[
                  styles.itemDetail,
                  detailFont(lang),
                  end && styles.textRight,
                ]}
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

function detailFont(lang: ReturnType<typeof resolveLocalizedLang>) {
  return { fontFamily: lang === "ja" ? JP_400 : OXANIUM_600 };
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
      <Text style={styles.itemLabel}>······</Text>
      <Text style={[styles.itemDetail, { fontFamily: OXANIUM_600 }]}>······</Text>
    </View>
  );
}

function TitleRow({
  homeNick,
  awayNick,
  homeColor,
  awayColor,
}: {
  homeNick: string;
  awayNick: string;
  homeColor: string;
  awayColor: string;
}) {
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleSide}>
        <Text style={[styles.sideTag, { color: hexToRgba(homeColor, 0.9) }]}>
          HOME
        </Text>
        <Text style={[styles.titleNick, { color: homeColor }]} numberOfLines={1}>
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
  const gate = proInsightGateCopy(language);
  const homeNick = teamNick(homeTeamId, homeTeamName).toUpperCase();
  const awayNick = teamNick(awayTeamId, awayTeamName).toUpperCase();
  const homeColor = getTeamJerseyPrimaryColor("nba", homeTeamId);
  const awayColor = getTeamJerseyPrimaryColor("nba", awayTeamId);
  const safeBrief = useMemo(() => sanitizeProBriefForDisplay(brief), [brief]);
  /** Free ゲート下は実データ or サンプルで実画面例を見せる */
  const displayBrief =
    safeBrief ?? (locked ? PRO_INSIGHT_GATE_SAMPLE_BRIEF : null);
  const home = displayBrief?.home ?? EMPTY_CARD;
  const away = displayBrief?.away ?? EMPTY_CARD;
  const homePlayers = home.players ?? [];
  const awayPlayers = away.players ?? [];
  const hasPlayers = homePlayers.length > 0 || awayPlayers.length > 0;
  const usePlaceholder = displayBrief == null;

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
      {hasPlayers && !usePlaceholder ? (
        <CompareSection
          label="PLAYERS"
          tone="players"
          left={
            <PlayerBlock
              players={homePlayers}
              language={language}
              align="left"
            />
          }
          right={
            <PlayerBlock
              players={awayPlayers}
              language={language}
              align="right"
            />
          }
        />
      ) : null}
    </View>
  );

  return (
    <View style={styles.shell}>
      {!locked ? (
        <TitleRow
          homeNick={homeNick}
          awayNick={awayNick}
          homeColor={homeColor}
          awayColor={awayColor}
        />
      ) : null}

      {!locked &&
      !usePlaceholder &&
      (safeBrief?.sampleNoteJa || safeBrief?.sampleNoteEn) ? (
        <Text style={styles.sampleNote}>
          {briefSampleNote(safeBrief, language)}
        </Text>
      ) : null}

      {locked ? (
        <View style={styles.lockedHost}>
          <View style={styles.gateMessageWrap}>
            <View style={styles.gateMessage}>
              <View style={styles.gateCenter}>
                <View style={styles.gateEyebrowBlock}>
                  <View style={styles.gateBrandLogo}>
                    <UniterzLogoNative width={168} />
                  </View>
                  <View style={styles.gateBadgeScale}>
                    <ProCyberBadgeNative premium />
                  </View>
                </View>
                <TitleWithBrandFontsNative title={gate.title} />
                <Text style={styles.gateBody}>{gate.body}</Text>
                {onPressUpgrade ? (
                  <Pressable
                    onPress={onPressUpgrade}
                    style={({ pressed }) => [
                      styles.cta,
                      pressed ? styles.ctaPressed : null,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={gate.cta}
                  >
                    {({ pressed }) => (
                      <Text
                        style={[
                          styles.ctaLabel,
                          pressed ? styles.ctaLabelPressed : null,
                        ]}
                      >
                        {gate.cta}
                      </Text>
                    )}
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

          {/* ゲート下に実際の PRO INSIGHT 画面例 */}
          <View style={styles.exampleBlock} pointerEvents="none">
            <Text style={styles.exampleLabel}>{gate.exampleLabel}</Text>
            <View style={styles.exampleCard}>
              <TitleRow
                homeNick={homeNick}
                awayNick={awayNick}
                homeColor={homeColor}
                awayColor={awayColor}
              />
              {body}
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
  sampleNote: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(253, 230, 138, 0.75)",
    marginBottom: 8,
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
    fontFamily: MATCH_CARD_TEAM_NAME_FONT,
    fontSize: 18,
    fontWeight: "800",
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
    transform: [{ skewX: "-6deg" }],
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
  /** 全セクション共通の見出し行（試合カード名と同傾き） */
  itemLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 13,
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.92)",
    transform: [{ skewX: "-6deg" }],
  },
  itemLabelEn: {
    textTransform: "uppercase",
  },
  /** 全セクション共通の本文（色だけ tone でわずかに分ける） */
  itemDetail: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    color: "rgba(255,255,255,0.72)",
  },
  itemDetailSchedule: {
    color: "rgba(255,251,235,0.82)",
  },
  itemDetailContext: {
    color: "rgba(236,254,255,0.82)",
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
    gap: 16,
  },
  gateMessageWrap: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 4,
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
  gateEyebrowBlock: {
    alignItems: "center",
    gap: 10,
  },
  gateBrandLogo: {
    width: 168,
    maxWidth: "72%",
    alignItems: "center",
  },
  gateBadgeScale: {
    transform: [{ scale: 1.45 }],
    marginVertical: 4,
  },
  gateTitleRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
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
    minHeight: 44,
    minWidth: 168,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.75)",
    backgroundColor: "#050508",
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: "#fbbf24",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  ctaPressed: {
    transform: [{ scale: 0.94 }],
    borderColor: "rgba(253,230,138,0.95)",
    backgroundColor: "rgba(251,191,36,0.2)",
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  ctaLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#fde68a",
  },
  ctaLabelPressed: {
    color: "#fffbeb",
  },
  exampleBlock: {
    gap: 8,
    paddingTop: 4,
  },
  exampleLabel: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.85)",
    textAlign: "center",
  },
  exampleCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  bulletPanel: {
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.55)",
    backgroundColor: "rgba(249,115,22,0.07)",
    borderRadius: 0,
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
    borderRadius: 0,
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
