/**
 * Web `PredictProBriefPanel` 相当 — HOME | AWAY 2カラム · Free ゲート CTA
 */
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
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
import { proInsightGateCopy } from "../../../../../../lib/predict/proInsightGateCopy";
import { proPickAdCopy } from "../../../../../../lib/predict/proPickAdCopy";
import { PRO_INSIGHT_PREDICT_KIT_SAMPLES } from "../../../../../../lib/predict/proInsightPredictKitSample";
import PredictProInsightKitNative, {
  PredictKitAccuracyHeroNative,
} from "./PredictProInsightKitNative";
import type { ProInsightPredictKitRecord } from "../../../../../../lib/nba/insights/predictKit/predictKitTypes";
import { resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import { getTeamJerseyPrimaryColor } from "../../../../../../lib/team-colors";
import ProCyberBadgeNative from "../../profile/kinetik/ProCyberBadgeNative";
import {
  OXANIUM_600,
  OXANIUM_700,
  OXANIUM_800,
  JP_400,
  JP_600,
  JP_700,
} from "../../profile/reports/reportThemeNative";
import { MATCH_CARD_TEAM_NAME_FONT } from "../matchCardTypography";
import type { GamesLanguage } from "../gamesI18n";
import { UNITERZ_PRO_BADGE_GOLD } from "../../../../../../lib/units/uniterzProBadge";

const GATE_KIT_SAMPLE = PRO_INSIGHT_PREDICT_KIT_SAMPLES[0]!;
const GATE_HERO_MAX_H = 128;
const GATE_HERO_WIDTH_RATIO = 0.44;
const GATE_HERO = require("../../../assets/pro/pro-pick-hero.jpg") as ImageSourcePropType;

type Props = {
  brief?: PredictProBrief | null;
  language: GamesLanguage;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  /** Free: タイトル + 精度（無ければ説明 1 文）+ CTA + この試合の伏せ字カード */
  locked?: boolean;
  onPressUpgrade?: () => void;
  /** Free: この試合だけ解除（初回は無料 / それ以外は広告） */
  onPressProPickUnlock?: () => void;
  firstFreeAvailable?: boolean;
  unlockBusy?: boolean;
  /** 広告後、サーバーの解除を待っている */
  unlockConfirming?: boolean;
  /** Free に出す今季の的中率（20 試合未満は null） */
  kitRecord?: ProInsightPredictKitRecord | null;
  /** みんなの予想（伏せ字カードに出す公開情報） */
  crowd?: { homePct: number; total: number } | null;
};

type SectionTone = "matchup" | "schedule" | "context" | "players";

const EMPTY_CARD: ProBriefTeamCard = {
  edges: [],
  schedule: [],
  context: [],
  players: [],
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
  const parts = title.split(/(PRO PICK)/);
  return (
    <Text style={styles.gateTitle}>
      {parts.map((part, i) =>
        part === "PRO PICK" ? (
          <Text key={i} style={styles.gateTitlePro}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

function GatePeekCell({ label, veil }: { label: string; veil: string }) {
  return (
    <View style={styles.gatePeekCell}>
      <Text style={styles.gatePeekLab} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.gatePeekVeil}>{veil}</Text>
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
  onPressProPickUnlock,
  firstFreeAvailable = false,
  unlockBusy = false,
  unlockConfirming = false,
  kitRecord = null,
}: Props) {
  const { width: winW } = useWindowDimensions();
  const gateHeroH = Math.min(GATE_HERO_MAX_H, Math.round((winW - 48) * GATE_HERO_WIDTH_RATIO));
  const gate = proInsightGateCopy(language);
  const unlockCopy = proPickAdCopy(language);
  const homeNick = teamNick(homeTeamId, homeTeamName).toUpperCase();
  const awayNick = teamNick(awayTeamId, awayTeamName).toUpperCase();
  const homeColor = getTeamJerseyPrimaryColor("nba", homeTeamId);
  const awayColor = getTeamJerseyPrimaryColor("nba", awayTeamId);
  const safeBrief = useMemo(() => sanitizeProBriefForDisplay(brief), [brief]);
  const displayBrief = safeBrief;
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
                <View style={styles.gateKickerFill}>
                  <Text style={styles.gateKickerFillLabel}>
                    {firstFreeAvailable
                      ? gate.firstFreeKicker
                      : gate.trialKicker}
                  </Text>
                </View>
                <TitleWithBrandFontsNative
                  title={firstFreeAvailable ? gate.firstFreeAskTitle : gate.title}
                />
                {homeTeamId || awayTeamId ? (
                  <View style={styles.gateMatch}>
                    <Text
                      style={[styles.gateMatchTeam, { color: homeColor }]}
                      numberOfLines={1}
                    >
                      {homeNick}
                    </Text>
                    <Text style={styles.gateMatchVs}>vs</Text>
                    <Text
                      style={[styles.gateMatchTeam, { color: awayColor }]}
                      numberOfLines={1}
                    >
                      {awayNick}
                    </Text>
                  </View>
                ) : null}
                <View style={[styles.gateHero, { height: gateHeroH }]}>
                  <Image
                    source={GATE_HERO}
                    style={styles.gateHeroImg}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                </View>
                <View style={styles.gatePeek}>
                  <GatePeekCell
                    label={gate.bullets[0]?.title ?? ""}
                    veil="??%"
                  />
                  <View style={styles.gatePeekRule} />
                  <GatePeekCell
                    label={gate.bullets[1]?.title ?? ""}
                    veil="??–??"
                  />
                  <View style={styles.gatePeekRule} />
                  <GatePeekCell
                    label={(gate.bullets[2]?.title ?? "").replace(/の候補$/, "")}
                    veil="???"
                  />
                </View>
                <Text style={styles.gateBody}>
                  {firstFreeAvailable ? gate.firstFreeAskBody : gate.body}
                </Text>
                {firstFreeAvailable && onPressProPickUnlock ? (
                  <Pressable
                    onPress={onPressProPickUnlock}
                    disabled={unlockBusy}
                    style={({ pressed }) => [
                      styles.cta,
                      styles.ctaFilled,
                      pressed || unlockBusy ? styles.ctaFilledPressed : null,
                      unlockBusy ? styles.ctaBusy : null,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={
                      unlockConfirming ? unlockCopy.confirmingCta : unlockCopy.firstFreeCta
                    }
                  >
                    <Text style={[styles.ctaLabel, styles.ctaFilledLabel]}>
                      {unlockConfirming ? unlockCopy.confirmingCta : unlockCopy.firstFreeCta}
                    </Text>
                  </Pressable>
                ) : (
                  <>
                    {onPressUpgrade ? (
                      <Pressable
                        onPress={onPressUpgrade}
                        disabled={unlockBusy}
                        style={({ pressed }) => [
                          styles.cta,
                          styles.ctaFilled,
                          pressed ? styles.ctaFilledPressed : null,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={gate.trialCta}
                      >
                        <Text style={[styles.ctaLabel, styles.ctaFilledLabel]}>
                          {gate.trialCta}
                        </Text>
                      </Pressable>
                    ) : null}
                    {onPressProPickUnlock ? (
                      <Pressable
                        onPress={onPressProPickUnlock}
                        disabled={unlockBusy}
                        style={({ pressed }) => [
                          styles.ctaAdText,
                          pressed || unlockBusy ? styles.ctaAdTextPressed : null,
                          unlockBusy ? styles.ctaBusy : null,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={
                          unlockConfirming ? unlockCopy.confirmingCta : unlockCopy.adCta
                        }
                      >
                        <Text style={styles.ctaAdTextLabel}>
                          {unlockConfirming ? unlockCopy.confirmingCta : unlockCopy.adCta}
                        </Text>
                      </Pressable>
                    ) : null}
                  </>
                )}
                <Text style={styles.gateDisclaimer}>{gate.disclaimer}</Text>
              </View>
            </View>
          </View>

          {homeTeamId.startsWith("nba-") && awayTeamId.startsWith("nba-") ? (
            kitRecord ? (
              <PredictKitAccuracyHeroNative
                record={kitRecord}
                language={language}
              />
            ) : null
          ) : (
            <View style={styles.exampleBlock} pointerEvents="none">
              <Text style={styles.exampleLabel}>{gate.exampleLabel}</Text>
              <PredictProInsightKitNative
                kit={GATE_KIT_SAMPLE.kit}
                homeTeamId={GATE_KIT_SAMPLE.homeTeamId}
                awayTeamId={GATE_KIT_SAMPLE.awayTeamId}
                language={language}
                crowd={GATE_KIT_SAMPLE.crowd ?? null}
              />
            </View>
          )}
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
    gap: 8,
  },
  gateMatch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingHorizontal: 8,
  },
  gateMatchTeam: {
    flexShrink: 1,
    fontFamily: MATCH_CARD_TEAM_NAME_FONT,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  gateMatchVs: {
    fontFamily: OXANIUM_600,
    fontSize: 11,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
    textTransform: "lowercase",
  },
  gateHero: {
    alignSelf: "stretch",
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#05070c",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,245,255,0.28)",
  },
  gateHeroImg: {
    position: "absolute",
    width: "170%",
    height: "200%",
    left: "-18%",
    top: "-32%",
  },
  gatePeek: {
    flexDirection: "row",
    alignItems: "stretch",
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: "rgba(244,223,154,0.22)",
    backgroundColor: "rgba(244,223,154,0.05)",
  },
  gatePeekCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 3,
  },
  gatePeekLab: {
    fontFamily: JP_600,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.58)",
    textAlign: "center",
  },
  gatePeekVeil: {
    fontFamily: OXANIUM_800,
    fontSize: 16,
    letterSpacing: 0.6,
    color: UNITERZ_PRO_BADGE_GOLD.bright,
    opacity: 0.45,
  },
  gatePeekRule: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(244,223,154,0.22)",
  },
  gateDisclaimer: {
    fontFamily: JP_400,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.42)",
    textAlign: "center",
  },
  gateKickerFill: {
    backgroundColor: UNITERZ_PRO_BADGE_GOLD.bright,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gateKickerFillLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "#120e08",
  },
  gateTitle: {
    fontFamily: JP_700,
    fontSize: 20,
    lineHeight: 26,
    color: "#fff",
    textAlign: "center",
  },
  gateTitlePro: {
    fontFamily: OXANIUM_800,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  gateBody: {
    fontFamily: JP_400,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
  },
  cta: {
    alignSelf: "stretch",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(232,198,106,0.75)",
    backgroundColor: "#050508",
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: "#E8C66A",
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
    fontFamily: JP_600,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#fde68a",
  },
  ctaLabelPressed: {
    color: "#fffbeb",
  },
  ctaFilled: {
    borderColor: "rgba(232,198,106,0.55)",
    backgroundColor: "#E8C66A",
    shadowColor: "#E8C66A",
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  ctaFilledPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: "#fde68a",
  },
  ctaBusy: {
    opacity: 0.7,
  },
  ctaFilledLabel: {
    color: "#120e08",
  },
  ctaFilledLabelPressed: {
    color: "#120e08",
  },
  ctaAdText: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: 6,
  },
  ctaAdTextPressed: {
    opacity: 0.55,
  },
  ctaAdTextLabel: {
    fontFamily: JP_400,
    fontSize: 13,
    letterSpacing: 0.2,
    color: "rgba(255,255,255,0.48)",
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
});
