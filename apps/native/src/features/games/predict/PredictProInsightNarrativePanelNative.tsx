/**
 * 新 Pro Insight UI — 試合1本 · 4枠短文 · 各枠2本。
 * HOME/AWAY 分割なし（被る事実は1回だけ）。
 */
import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { difficultyExplainCopy } from "../../../../../../lib/nba/matchupDifficulty/difficultyExplainCopy";
import {
  proInsightShowsEvidence,
  type ProInsightNarrativeBrief,
  type ProInsightNarrativeKind,
  type ProInsightPreviewName,
} from "../../../../../../lib/predict/proInsightNarrativeTypes";
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import type { UiStrings } from "../../../../../../lib/i18n/ui";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import {
  getTeamAbbrBadgeColor,
  getTeamJerseyPrimaryColor,
} from "../../../../../../lib/team-colors";
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
import PredictProInsightMatchupTableNative from "./PredictProInsightMatchupTableNative";
type Props = {
  brief: ProInsightNarrativeBrief;
  language: GamesLanguage;
  homeTeamName?: string;
  awayTeamName?: string;
};

/** セクション見出しの文字色・枠色（既存 ProBrief トーンに合わせる） */
const SECTION_ACCENT: Record<ProInsightNarrativeKind, string> = {
  MATCHUP: "rgba(110,231,183,0.95)",
  SCHEDULE: "rgba(253,230,138,0.95)",
  CONTEXT: "rgba(103,232,249,0.92)",
  "INJURY IMPACT": "rgba(251,113,133,0.95)",
};
const PREVIEW_ACCENT = "rgba(232,197,110,0.95)";

function teamNick(teamId: string, fallbackName: string): string {
  if (teamId.startsWith("nba-")) {
    const full = NBA_TEAM_NAME_BY_ID[teamId];
    if (full) return getMobileTeamName("nba", full);
  }
  return fallbackName.trim();
}

function t(strings: UiStrings, language: GamesLanguage): string {
  return L(resolveLocalizedLang(language), strings);
}

/** PREVIEW の 4 段落の役割（試合の形 → 狙い目の選手 → 厳しさ・日程 → 前回対戦と見どころ） */
const PREVIEW_ROLE_LABELS: UiStrings[] = [
  { ja: "試合の形", en: "GAME SHAPE", ko: "경기 양상", zh: "比赛走势", es: "EL PARTIDO", pt: "O JOGO", fr: "LE MATCH", de: "SPIELBILD", ar: "شكل المباراة" },
  { ja: "狙い目", en: "SET UP", ko: "주목 선수", zh: "看点球员", es: "PROTAGONISTAS", pt: "DESTAQUES", fr: "À SUIVRE", de: "IM FOKUS", ar: "لاعبون مرشحون" },
  { ja: "コンディション", en: "CONDITION", ko: "컨디션", zh: "状态", es: "CONDICIÓN", pt: "CONDIÇÃO", fr: "CONDITION", de: "VERFASSUNG", ar: "الجاهزية" },
  { ja: "見どころ", en: "WATCH", ko: "관전 포인트", zh: "观察点", es: "CLAVES", pt: "FIQUE DE OLHO", fr: "POINTS CLÉS", de: "WORAUF ACHTEN", ar: "نقاط المتابعة" },
];

type PreviewHighlight = { token: string; color: string };

/** チーム名（大文字ニックネーム）と選手名（"N.Jokic" と姓だけの "Jokic"）をチーム色で塗る */
function buildPreviewHighlights(input: {
  homeNick: string;
  awayNick: string;
  homeTeamId: string;
  awayTeamId: string;
  names: ProInsightPreviewName[];
}): PreviewHighlight[] {
  const colorOf = (teamId: string) => getTeamAbbrBadgeColor(teamId);
  const out = new Map<string, string>();
  if (input.homeNick) out.set(input.homeNick, colorOf(input.homeTeamId));
  if (input.awayNick) out.set(input.awayNick, colorOf(input.awayTeamId));
  const lastNameCount = new Map<string, number>();
  for (const n of input.names) {
    const last = n.name.split(".").pop() ?? "";
    lastNameCount.set(last, (lastNameCount.get(last) ?? 0) + 1);
  }
  for (const n of input.names) {
    const color = colorOf(n.teamId);
    out.set(n.name, color);
    const last = n.name.split(".").pop() ?? "";
    // 同姓が両チームにいるときは姓だけでは塗らない
    if (last.length >= 3 && last !== n.name && lastNameCount.get(last) === 1 && !out.has(last)) {
      out.set(last, color);
    }
  }
  return [...out.entries()]
    .map(([token, color]) => ({ token, color }))
    .sort((a, b) => b.token.length - a.token.length);
}

const isAsciiLetter = (ch: string | undefined) => !!ch && /[A-Za-z]/.test(ch);

function PreviewRichText({ text, highlights }: { text: string; highlights: PreviewHighlight[] }) {
  const parts: Array<{ s: string; color?: string }> = [];
  let i = 0;
  let plainStart = 0;
  while (i < text.length) {
    const hit = highlights.find(
      (h) =>
        text.startsWith(h.token, i) &&
        !isAsciiLetter(text[i - 1]) &&
        !isAsciiLetter(text[i + h.token.length])
    );
    if (!hit) {
      i += 1;
      continue;
    }
    if (i > plainStart) parts.push({ s: text.slice(plainStart, i) });
    parts.push({ s: hit.token, color: hit.color });
    i += hit.token.length;
    plainStart = i;
  }
  if (plainStart < text.length) parts.push({ s: text.slice(plainStart) });
  return (
    <>
      {parts.map((p, k) =>
        p.color ? (
          <Text key={k} style={[styles.previewName, { color: p.color }]}>
            {p.s}
          </Text>
        ) : (
          p.s
        )
      )}
    </>
  );
}

export default function PredictProInsightNarrativePanelNative({
  brief,
  language,
  homeTeamName = "",
  awayTeamName = "",
}: Props) {
  const homeNick = teamNick(brief.homeTeamId, homeTeamName).toUpperCase();
  const awayNick = teamNick(brief.awayTeamId, awayTeamName).toUpperCase();
  const homeColor = getTeamJerseyPrimaryColor("nba", brief.homeTeamId);
  const awayColor = getTeamJerseyPrimaryColor("nba", brief.awayTeamId);

  const note = useMemo(() => {
    if (!brief.sampleNote) return null;
    return t(brief.sampleNote, language);
  }, [brief.sampleNote, language]);
  const preview = useMemo(() => {
    if (!brief.preview) return null;
    const paras = t(brief.preview, language)
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!paras.length) return null;
    const lang = resolveLocalizedLang(language);
    const headsRaw = brief.previewHeads?.[lang] ?? (brief.preview[lang] ? null : brief.previewHeads?.en);
    const heads = headsRaw?.split("\n").map((h) => h.trim()).filter(Boolean) ?? [];
    const labels = paras.length === PREVIEW_ROLE_LABELS.length ? PREVIEW_ROLE_LABELS : null;
    return paras.map((body, i) => ({
      body,
      head: heads.length === paras.length ? heads[i] : null,
      label: labels ? t(labels[i], language) : null,
    }));
  }, [brief.preview, brief.previewHeads, language]);
  const highlights = useMemo(
    () =>
      buildPreviewHighlights({
        homeNick,
        awayNick,
        homeTeamId: brief.homeTeamId,
        awayTeamId: brief.awayTeamId,
        names: brief.previewNames ?? [],
      }),
    [homeNick, awayNick, brief.homeTeamId, brief.awayTeamId, brief.previewNames]
  );
  const explain = useMemo(
    () => difficultyExplainCopy(resolveLocalizedLang(language)),
    [language]
  );
  const [explainOpen, setExplainOpen] = useState(false);

  return (
    <View style={styles.shell}>
      <View style={styles.matchRow}>
        <View style={styles.proBadgeWrap}>
          <ProCyberBadgeNative premium />
        </View>
        <View
          collapsable={false}
          renderToHardwareTextureAndroid
          style={[
            styles.matchTeamSkew,
            Platform.OS === "android" ? { opacity: 0.999 } : null,
          ]}
        >
          <Text style={[styles.matchTeam, { color: homeColor }]} numberOfLines={1}>
            {homeNick}
          </Text>
        </View>
        <View
          collapsable={false}
          renderToHardwareTextureAndroid
          style={[
            styles.matchVsSkew,
            Platform.OS === "android" ? { opacity: 0.999 } : null,
          ]}
        >
          <Text style={styles.matchVs}>vs</Text>
        </View>
        <View
          collapsable={false}
          renderToHardwareTextureAndroid
          style={[
            styles.matchTeamSkew,
            Platform.OS === "android" ? { opacity: 0.999 } : null,
          ]}
        >
          <Text style={[styles.matchTeam, { color: awayColor }]} numberOfLines={1}>
            {awayNick}
          </Text>
        </View>
      </View>

      {note ? <Text style={styles.sampleNote}>{note}</Text> : null}

      {preview ? (
        <View
          style={[styles.section, brief.sections.length > 0 ? styles.sectionBorder : null]}
        >
          <View style={styles.kindRow}>
            <View
              collapsable={false}
              renderToHardwareTextureAndroid
              style={[
                styles.kindWrap,
                { borderColor: PREVIEW_ACCENT },
                Platform.OS === "android" ? { opacity: 0.999 } : null,
              ]}
            >
              <Text style={[styles.kind, { color: PREVIEW_ACCENT }]}>PREVIEW</Text>
            </View>
          </View>
          <View style={styles.previewParagraphs}>
            {preview.map((para, i) => (
              <View key={i} style={styles.previewBlock}>
                {para.label || para.head ? (
                  <View style={styles.previewHeadRow}>
                    {para.label ? (
                      <Text style={styles.previewLabel}>{para.label}</Text>
                    ) : null}
                    {para.head ? (
                      <Text style={styles.previewHead}>
                        <PreviewRichText text={para.head} highlights={highlights} />
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                <Text style={styles.previewBody}>
                  <PreviewRichText text={para.body} highlights={highlights} />
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.sections}>
        {brief.sections.map((section, si) => {
          const accent = SECTION_ACCENT[section.kind];
          return (
            <View
              key={section.kind}
              style={[
                styles.section,
                si < brief.sections.length - 1 ? styles.sectionBorder : null,
              ]}
            >
              <View style={styles.kindRow}>
                <View
                  collapsable={false}
                  renderToHardwareTextureAndroid
                  style={[
                    styles.kindWrap,
                    { borderColor: accent },
                    Platform.OS === "android" ? { opacity: 0.999 } : null,
                  ]}
                >
                  <Text style={[styles.kind, { color: accent }]}>
                    {section.kind}
                  </Text>
                </View>
                {section.items.some((it) => it.template === "difficulty") ? (
                  <Pressable
                    onPress={() => setExplainOpen((v) => !v)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={explain.helpAria}
                    accessibilityState={{ expanded: explainOpen }}
                    style={[
                      styles.helpBtn,
                      { borderColor: accent },
                      explainOpen ? { backgroundColor: accent } : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.helpBtnText,
                        { color: explainOpen ? "#050508" : accent },
                      ]}
                    >
                      ?
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              {explainOpen &&
              section.items.some((it) => it.template === "difficulty") ? (
                <View style={[styles.explainBox, { borderColor: accent }]}>
                  <Text style={[styles.explainTitle, { color: accent }]}>
                    {explain.title}
                  </Text>
                  {explain.lines.map((line, li) => (
                    <Text key={li} style={styles.explainLine}>
                      {line}
                    </Text>
                  ))}
                </View>
              ) : null}
              {section.table ? (
                <PredictProInsightMatchupTableNative
                  table={section.table}
                  lang={resolveLocalizedLang(language)}
                  awayNick={awayNick}
                  homeNick={homeNick}
                  awayColor={awayColor}
                  homeColor={homeColor}
                />
              ) : (
              <View style={styles.items}>
                {section.items.map((item, ii) => (
                  <View key={`${section.kind}-${ii}`} style={styles.item}>
                    <View
                      collapsable={false}
                      renderToHardwareTextureAndroid
                      style={[
                        styles.bodySkew,
                        Platform.OS === "android" ? { opacity: 0.999 } : null,
                      ]}
                    >
                      <Text style={styles.body}>{t(item.body, language)}</Text>
                    </View>
                    {proInsightShowsEvidence(section.kind) &&
                    item.evidence.length > 0 ? (
                      <View style={styles.evidenceList}>
                        {item.evidence.map((ev, j) => (
                          <Text key={j} style={styles.evidence}>
                            · {t(ev, language)}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
              )}
            </View>
          );
        })}
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
    marginBottom: 12,
  },
  proBadgeWrap: {
    flexShrink: 0,
    transform: [{ scale: 0.92 }],
  },
  matchTeamSkew: {
    flexShrink: 1,
    maxWidth: "42%",
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
  matchVsSkew: {
    flexShrink: 0,
    transform: [{ skewX: "-8deg" }],
  },
  matchVs: {
    flexShrink: 0,
    fontFamily: OXANIUM_600,
    fontSize: 11,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.45)",
    textTransform: "lowercase",
  },
  sampleNote: {
    fontFamily: JP_600,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 10,
  },
  sections: {
    gap: 0,
  },
  section: {
    paddingVertical: 12,
    gap: 8,
  },
  sectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  kindRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  helpBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  helpBtnText: {
    fontFamily: OXANIUM_800,
    fontSize: 11,
    lineHeight: 13,
    includeFontPadding: false,
  },
  explainBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    backgroundColor: "rgba(253,230,138,0.04)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  explainTitle: {
    fontFamily: JP_600,
    fontSize: 12,
    lineHeight: 16,
  },
  explainLine: {
    fontFamily: JP_600,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.7)",
  },
  kindWrap: {
    alignSelf: "flex-start",
    backgroundColor: "#000",
    borderWidth: 1,
    borderRadius: 0,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
    transform: [{ skewX: "-6deg" }],
  },
  kind: {
    fontFamily: OXANIUM_800,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    includeFontPadding: false,
    /** 枠の skew を相殺して字形の潰れを防ぐ */
    transform: [{ skewX: "6deg" }],
  },
  items: {
    gap: 10,
  },
  item: {
    gap: 4,
  },
  bodySkew: {
    transform: [{ skewX: "-4deg" }],
  },
  body: {
    fontFamily: JP_600,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.9)",
  },
  previewParagraphs: {
    gap: 18,
  },
  previewBlock: {
    gap: 6,
  },
  previewHeadRow: {
    gap: 3,
  },
  previewLabel: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    letterSpacing: 1.4,
    color: PREVIEW_ACCENT,
    textTransform: "uppercase",
  },
  previewHead: {
    fontFamily: JP_700,
    fontSize: 15,
    lineHeight: 21,
    color: "#FFFFFF",
  },
  previewBody: {
    fontFamily: JP_400,
    fontSize: 14,
    lineHeight: 23,
    color: "rgba(255,255,255,0.84)",
  },
  previewName: {
    fontFamily: JP_700,
  },
  evidenceList: {
    gap: 2,
  },
  evidence: {
    fontFamily: OXANIUM_600,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    color: "rgba(255,255,255,0.5)",
  },
});
