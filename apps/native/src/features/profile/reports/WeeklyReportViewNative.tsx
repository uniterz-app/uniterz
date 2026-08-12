/** Web `WeeklyReportView` 相当。画面順: 結果 / 部門 / 順位変動 / ライバル / 診断。 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  INITIAL_REPORT_RIVALS,
  type WeeklyReport,
  type WeeklyReportComment,
  type WeeklyReportCommentTone,
  type WeeklyReportDivision,
  type WeeklyReportRival,
} from "../../../../../../lib/reports/weeklyReportTypes";
import { RankingsCyberPanelNative } from "../../rankings/RankingsCyberPanelNative";
import { RankingsAvatarNative } from "../../rankings/RankingsAvatarAndTabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ProCyberBadgeNative from "../kinetik/ProCyberBadgeNative";
import { profilePathKeyFromRow } from "../../../../../../lib/profile/profilePathKey";
import type { ProfileStackParamList } from "../../../navigation/types";
import {
  BEBAS,
  OXANIUM_600,
  OXANIUM_700,
  OXANIUM_800,
  PANEL_BG,
  REPORT_ACCENT,
  REPORT_FRAME,
  fmtReportPt,
  fmtReportRange,
  reportBodyFont,
  reportBodyFontSemibold,
  type ReportAccent,
} from "./reportThemeNative";
import { WeeklyReportCardShell } from "./reportCardShellNative";
import { ReportSquareGridOverlay } from "./reportGridOverlaysNative";

type Lang = "ja" | "en";

/* ============================================================
 * copy（Web WeeklyReportView と同一）
 * ============================================================ */

const COPY = {
  ja: {
    title: "WEEKLY REPORT",
    live: "LEGACY",
    liveNote: "過去の進行中レポートです。いまは確定週のみ配信されます。",
    heroRank: "順位",
    heroScore: "スコア",
    participants: (n: number) => `${n}人中`,
    top: (p: string) => `TOP ${p}%`,
    posts: "投稿",
    wins: "勝",
    losses: "敗",
    firstWeekRank: "今週から参戦",
    divisions: "部門成績",
    divisionRank: (n: number) => `部門 #${n}`,
    divisionUnranked: "圏外",
    divisionReference: "参考記録",
    divisionPostsToQualify: (n: number) => `あと${n}予想`,
    overtaken: "抜いた相手",
    overtakenBy: "抜かれた相手",
    noOvertaken: "今週は誰も抜けなかった",
    noOvertakenBy: "誰にも抜かれなかった",
    moreRivals: (n: number) => `ほか ${n} 人`,
    showMore: (n: number) => `もっと見る（${n}人）`,
    showLess: "閉じる",
    firstWeekBattle: "今週から参戦。抜いた・抜かれたは来週から表示されます。",
    battleSummary: (passed: number, passedBy: number) =>
      `今週は${passed}人を抜き、${passedBy}人に抜かれました`,
    battleSection: "順位変動",
    nowRank: (n: number) => `現在 #${n}`,
    nextTarget: "次のターゲット",
    targetGapLabel: "抜くまであと",
    youAreTop: "あなたが首位。追われる側です。",
    threat: "背後の脅威",
    threatGapLabel: "背後に接近中",
    noThreat: "背後に脅威なし",
    proMember: "Pro会員",
    commentTone: {
      climbedBig: "圧巻の週。",
      climbed: "確実に順位を上げた。",
      held: "順位キープ。",
      dropped: "後退した週。",
      firstWeek: "初参戦の記録がここから始まる。来週は順位変動も表示される。",
    } satisfies Record<WeeklyReportCommentTone, string>,
    commentFactor: {
      targetGap: (rank: number, name: string, pt: string) =>
        `#${rank} ${name} まであと ${pt}pt。来週の数試合で届く。`,
      overtakenBy: (name: string) => `${name} に抜かれたまま終わるか、抜き返すか。`,
      divisionUp: (label: string) => `${label} の伸びが効いた。`,
      divisionDown: (label: string) => `${label} が足を引っ張った。`,
      lowVolume: (n: number) => `投稿 ${n} 件。まずは母数から。`,
    },
  },
  en: {
    title: "WEEKLY REPORT",
    live: "LEGACY",
    liveNote: "Legacy in-progress report. Weekly reports now ship as finals only.",
    heroRank: "Rank",
    heroScore: "Score",
    participants: (n: number) => `of ${n}`,
    top: (p: string) => `TOP ${p}%`,
    posts: "picks",
    wins: "W",
    losses: "L",
    firstWeekRank: "First week",
    divisions: "Divisions",
    divisionRank: (n: number) => `Div #${n}`,
    divisionUnranked: "Unranked",
    divisionReference: "Reference",
    divisionPostsToQualify: (n: number) => `${n} more picks`,
    overtaken: "Passed",
    overtakenBy: "Passed by",
    noOvertaken: "No one passed this week",
    noOvertakenBy: "Nobody passed you",
    moreRivals: (n: number) => `+${n} more`,
    showMore: (n: number) => `Show all (+${n})`,
    showLess: "Show less",
    firstWeekBattle: "First week in. Battle log starts next week.",
    battleSummary: (passed: number, passedBy: number) =>
      `Passed ${passed}, passed by ${passedBy} this week`,
    battleSection: "Rank Moves",
    nowRank: (n: number) => `now #${n}`,
    nextTarget: "Next Target",
    targetGapLabel: "To pass",
    youAreTop: "You lead the board.",
    threat: "Closing In",
    threatGapLabel: "Behind you",
    noThreat: "No threat behind",
    proMember: "Pro member",
    commentTone: {
      climbedBig: "A statement week.",
      climbed: "A solid climb.",
      held: "Held your ground.",
      dropped: "A step back.",
      firstWeek: "Your record starts here. Rank moves show next week.",
    } satisfies Record<WeeklyReportCommentTone, string>,
    commentFactor: {
      targetGap: (rank: number, name: string, pt: string) =>
        `${pt}pt to #${rank} ${name}. A few games away.`,
      overtakenBy: (name: string) => `Passed by ${name}. Pass back next week.`,
      divisionUp: (label: string) => `${label} carried the week.`,
      divisionDown: (label: string) => `${label} held you back.`,
      lowVolume: (n: number) => `${n} picks. Volume first.`,
    },
  },
} as const;

const DIVISION_META: Record<
  WeeklyReportDivision["key"],
  { label: string; accent: ReportAccent }
> = {
  winRate: { label: "WIN%", accent: REPORT_ACCENT.emerald },
  goalScorerHits: { label: "SCORER", accent: REPORT_ACCENT.gold },
  upset: { label: "UPSET", accent: REPORT_ACCENT.orange },
};

function slabStyle(_accent?: ReportAccent): ViewStyle {
  return {
    borderWidth: 1,
    borderColor: REPORT_FRAME.weekly.border,
    backgroundColor: PANEL_BG,
    borderRadius: 3,
    overflow: "hidden",
  };
}

function commentText(comment: WeeklyReportComment, lang: Lang): string {
  const c = COPY[lang];
  const tone = c.commentTone[comment.tone];
  const f = comment.factor;
  const factor =
    f.kind === "targetGap"
      ? c.commentFactor.targetGap(f.rank, f.displayName, fmtReportPt(f.pointsBehind))
      : f.kind === "overtakenBy"
        ? c.commentFactor.overtakenBy(f.displayName)
        : f.kind === "divisionUp"
          ? c.commentFactor.divisionUp(DIVISION_META[f.division].label)
          : f.kind === "divisionDown"
            ? c.commentFactor.divisionDown(DIVISION_META[f.division].label)
            : f.kind === "lowVolume"
              ? c.commentFactor.lowVolume(f.posts)
              : null;
  return factor ? `${tone}${lang === "en" ? " " : ""}${factor}` : tone;
}

/* ============================================================
 * parts
 * ============================================================ */

function MicroLabel({
  children,
  color = "rgba(255,255,255,0.42)",
}: {
  children: string;
  color?: string;
}) {
  return <Text style={[styles.microLabel, { color }]}>{children}</Text>;
}

function SectionBadge({ children }: { children: string }) {
  return (
    <View style={styles.sectionBadgeWrap}>
      <Text style={styles.sectionBadgeText}>{children}</Text>
    </View>
  );
}

function RingedAvatar({
  rival,
  size,
  ringColor,
}: {
  rival: WeeklyReportRival;
  size: number;
  ringColor: string;
}) {
  return (
    <View
      style={[
        styles.avatarRing,
        { borderColor: ringColor, width: size + 2, height: size + 2 },
      ]}
    >
      <RankingsAvatarNative photoURL={rival.photoURL} label={rival.displayName} size={size} square />
    </View>
  );
}

function openRivalProfile(
  navigation: NativeStackNavigationProp<ProfileStackParamList>,
  rival: WeeklyReportRival
) {
  const handle = profilePathKeyFromRow(rival);
  if (!handle) return;
  // Profile スタック内から push（タブ切替用の reset は使わない → 戻れる）
  navigation.push("PublicProfile", { handle, fromWeeklyReport: true });
}

function RivalRow({
  rival,
  accent,
  lang,
}: {
  rival: WeeklyReportRival;
  accent: ReportAccent;
  lang: Lang;
}) {
  const c = COPY[lang];
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  return (
    <Pressable
      style={styles.rivalRow}
      onPress={() => openRivalProfile(navigation, rival)}
      accessibilityRole="button"
      accessibilityLabel={rival.displayName}
    >
      <RingedAvatar rival={rival} size={30} ringColor={accent.border} />
      <View style={styles.rivalNameWrap}>
        <Text style={[styles.rivalName, { fontFamily: reportBodyFontSemibold(lang) }]} numberOfLines={1}>
          {rival.displayName}
        </Text>
        {rival.plan === "pro" ? <ProCyberBadgeNative compact /> : null}
      </View>
      <Text style={[styles.rivalRank, { color: accent.main }]}>{c.nowRank(rival.rank)}</Text>
    </Pressable>
  );
}

/* ============================================================
 * blocks
 * ============================================================ */

function HeroBlock({ report, lang }: { report: WeeklyReport; lang: Lang }) {
  const c = COPY[lang];
  const delta = report.rankDeltaPlaces;
  const losses = Math.max(0, report.totalPosts - report.totalWins);

  return (
    <RankingsCyberPanelNative
      compact
      style={{
        marginBottom: 0,
        backgroundColor: PANEL_BG,
        borderColor: REPORT_FRAME.weekly.border,
      }}
    >
      <ReportSquareGridOverlay borderRadius={0} />
      {/* 左=順位 / 右=スコア。数字は同一テキスト行でベースライン共有 */}
      <View style={styles.heroSplit}>
        <View style={styles.heroDivider} pointerEvents="none" />

        <View style={styles.heroLabelRow}>
          <View style={styles.heroLabelLeft}>
            <MicroLabel>{c.heroRank}</MicroLabel>
          </View>
          <View style={styles.heroLabelRight}>
            <MicroLabel>{c.heroScore}</MicroLabel>
          </View>
        </View>

        <View style={styles.heroNumbersRow}>
          <Text style={styles.rankLine}>
            <Text style={styles.rankHash}>#</Text>
            {report.rank}
            {delta != null ? (
              <Text
                style={[
                  styles.deltaInline,
                  {
                    color:
                      delta > 0
                        ? REPORT_ACCENT.emerald.main
                        : delta < 0
                          ? REPORT_ACCENT.orange.main
                          : "rgba(255,255,255,0.45)",
                  },
                ]}
              >
                {delta > 0 ? " ↑" : delta < 0 ? " ↓" : " "}
                {delta === 0 ? "±0" : Math.abs(delta)}
              </Text>
            ) : (
              <Text style={styles.firstWeekInline}> {c.firstWeekRank}</Text>
            )}
          </Text>

          <Text style={styles.ptsLine}>
            {fmtReportPt(report.totalPoints)}
            <Text style={styles.ptsUnitInline}> PTS</Text>
          </Text>
        </View>

        <View style={styles.heroMetaGrid}>
          <View style={styles.heroMetaLeft}>
            <Text style={styles.participantsText}>{c.participants(report.participantCount)}</Text>
            {report.topPercent != null ? (
              <View
                style={[
                  styles.topPill,
                  {
                    borderColor: REPORT_ACCENT.cyan.border,
                    backgroundColor: REPORT_ACCENT.cyan.tint,
                  },
                ]}
              >
                <Text style={[styles.topPillText, { color: REPORT_ACCENT.cyan.main }]}>
                  {c.top(fmtReportPt(report.topPercent))}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.postsLine}>
            {c.posts} {report.totalPosts} · {report.totalWins}
            {c.wins}
            {losses}
            {c.losses}
          </Text>
        </View>
      </View>
    </RankingsCyberPanelNative>
  );
}

function DivisionsBlock({ report, lang }: { report: WeeklyReport; lang: Lang }) {
  const c = COPY[lang];
  return (
    <View>
      <SectionBadge>{c.divisions}</SectionBadge>
      <View style={styles.divRow}>
        {report.divisions.map((d) => {
          const meta = DIVISION_META[d.key];
          const isReference = d.postsToQualify != null && d.postsToQualify > 0;
          const isTop10 = !isReference && d.rank != null && d.rank <= 10;
          const integer = d.key === "goalScorerHits";
          return (
            <WeeklyReportCardShell key={d.key} style={[styles.divCell, slabStyle(meta.accent)]}>
              <View style={styles.divCellHeader}>
                <MicroLabel color={meta.accent.main}>{meta.label}</MicroLabel>
                {isTop10 ? (
                  <View style={[styles.top10Chip, { backgroundColor: meta.accent.main }]}>
                    <Text style={styles.top10ChipText}>TOP10</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.divValueRow}>
                <Text style={styles.divValue}>
                  {d.key === "winRate"
                    ? `${Math.round(d.value)}%`
                    : integer
                      ? Math.round(d.value)
                      : fmtReportPt(d.value)}
                </Text>
              </View>
              {isReference ? (
                <View style={styles.divRefBlock}>
                  <Text style={[styles.divRefLabel, lang === "ja" ? { fontFamily: reportBodyFontSemibold(lang) } : null]}>{c.divisionReference}</Text>
                  <Text style={styles.divRefSub}>{c.divisionPostsToQualify(d.postsToQualify!)}</Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.divRank,
                    { color: d.rank != null ? meta.accent.main : "rgba(255,255,255,0.35)" },
                  ]}
                >
                  {d.rank != null ? c.divisionRank(d.rank) : c.divisionUnranked}
                </Text>
              )}
            </WeeklyReportCardShell>
          );
        })}
      </View>
    </View>
  );
}

function BattlePanel({
  label,
  count,
  countIcon,
  accent,
  rivals,
  emptyText,
  lang,
}: {
  label: string;
  count: number;
  countIcon: "up" | "down";
  accent: ReportAccent;
  rivals: WeeklyReportRival[];
  emptyText: string;
  lang: Lang;
}) {
  const c = COPY[lang];
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rivals : rivals.slice(0, INITIAL_REPORT_RIVALS);
  const hiddenInList = rivals.length - visible.length;
  const overflowCount = Math.max(0, count - rivals.length);

  return (
    <WeeklyReportCardShell style={[styles.battlePanel, slabStyle(accent)]}>
      <View style={styles.battlePanelHeader}>
        <MicroLabel color={accent.main}>{label}</MicroLabel>
        {count > 0 ? (
          <View style={styles.battleCountRow}>
            <MaterialCommunityIcons
              name={countIcon === "up" ? "chevron-up" : "arrow-down-bold"}
              size={16}
              color={accent.main}
            />
            <Text style={[styles.battleCountText, { color: accent.main }]}>{count}</Text>
          </View>
        ) : null}
      </View>
      {rivals.length > 0 ? (
        <>
          <View style={styles.rivalList}>
            {visible.map((r) => (
              <RivalRow key={r.uid} rival={r} accent={accent} lang={lang} />
            ))}
          </View>
          {expanded && overflowCount > 0 ? (
            <Text style={[styles.moreRivalsText, { color: accent.main }]}>
              {c.moreRivals(overflowCount)}
            </Text>
          ) : null}
          {hiddenInList > 0 || (expanded && rivals.length > INITIAL_REPORT_RIVALS) ? (
            <Pressable style={styles.showMoreBtn} onPress={() => setExpanded((v) => !v)}>
              <Text style={[styles.showMoreText, { color: accent.main }]}>
                {expanded ? c.showLess : c.showMore(hiddenInList)}
              </Text>
              <MaterialCommunityIcons
                name="chevron-up"
                size={12}
                color={accent.main}
                style={expanded ? undefined : styles.iconFlip180}
              />
            </Pressable>
          ) : null}
        </>
      ) : (
        <Text style={[styles.emptyText, { fontFamily: reportBodyFont(lang) }]}>{emptyText}</Text>
      )}
    </WeeklyReportCardShell>
  );
}

function BattleBlock({ report, lang }: { report: WeeklyReport; lang: Lang }) {
  const c = COPY[lang];
  const firstWeek = report.rankDeltaPlaces == null && report.prevRank == null;

  if (firstWeek && report.overtaken.length === 0 && report.overtakenBy.length === 0) {
    return (
      <WeeklyReportCardShell style={[styles.firstWeekBattlePanel, slabStyle(REPORT_ACCENT.cyan)]}>
        <Text style={[styles.firstWeekBattleText, { fontFamily: reportBodyFont(lang) }]}>{c.firstWeekBattle}</Text>
      </WeeklyReportCardShell>
    );
  }

  return (
    <View style={styles.battleBlockRoot}>
      <View>
        <SectionBadge>{c.battleSection}</SectionBadge>
        <Text style={[styles.battleSummary, { fontFamily: reportBodyFontSemibold(lang) }]}>
          {c.battleSummary(report.overtakenCount, report.overtakenByCount)}
        </Text>
      </View>
      <BattlePanel
        label={c.overtaken}
        count={report.overtakenCount}
        countIcon="up"
        accent={REPORT_ACCENT.emerald}
        rivals={report.overtaken}
        emptyText={c.noOvertaken}
        lang={lang}
      />
      <BattlePanel
        label={c.overtakenBy}
        count={report.overtakenByCount}
        countIcon="down"
        accent={REPORT_ACCENT.orange}
        rivals={report.overtakenBy}
        emptyText={c.noOvertakenBy}
        lang={lang}
      />
    </View>
  );
}

function GapValue({
  label,
  points,
  accent,
}: {
  label: string;
  points: number;
  accent: ReportAccent;
}) {
  return (
    <View style={styles.gapValueWrap}>
      <Text style={[styles.gapValueLabel, { color: accent.main }]}>{label}</Text>
      <View style={styles.gapValueRow}>
        <Text style={[styles.gapValueNum, { color: accent.main }]}>{fmtReportPt(points)}</Text>
        <Text style={[styles.gapValueUnit, { color: accent.main }]}>PT</Text>
      </View>
    </View>
  );
}

function TargetThreatBlock({ report, lang }: { report: WeeklyReport; lang: Lang }) {
  const c = COPY[lang];
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const rivalLine = (rival: WeeklyReportRival, ringColor: string) => (
    <Pressable
      style={styles.targetRivalRow}
      onPress={() => openRivalProfile(navigation, rival)}
      accessibilityRole="button"
      accessibilityLabel={rival.displayName}
    >
      <RingedAvatar rival={rival} size={26} ringColor={ringColor} />
      <Text
        style={[styles.targetRivalName, { fontFamily: reportBodyFontSemibold(lang) }]}
        numberOfLines={1}
      >
        <Text style={styles.targetRivalHash}>#{rival.rank} </Text>
        {rival.displayName}
      </Text>
      {rival.plan === "pro" ? <ProCyberBadgeNative compact /> : null}
    </Pressable>
  );

  return (
    <View style={styles.battleBlockRoot}>
      <WeeklyReportCardShell style={[styles.targetRow, slabStyle(REPORT_ACCENT.cyan)]}>
        <MaterialCommunityIcons name="crosshairs" size={20} color={REPORT_ACCENT.cyan.main} />
        <View style={styles.targetMain}>
          <MicroLabel color={REPORT_ACCENT.cyan.main}>{c.nextTarget}</MicroLabel>
          {report.nextTarget ? (
            rivalLine(report.nextTarget.rival, REPORT_ACCENT.cyan.border)
          ) : (
            <Text style={[styles.targetEmptyText, { fontFamily: reportBodyFont(lang) }]}>
              {c.youAreTop}
            </Text>
          )}
        </View>
        {report.nextTarget ? (
          <GapValue
            label={c.targetGapLabel}
            points={report.nextTarget.pointsBehind}
            accent={REPORT_ACCENT.cyan}
          />
        ) : null}
      </WeeklyReportCardShell>

      {report.threat ? (
        <WeeklyReportCardShell style={[styles.targetRow, slabStyle(REPORT_ACCENT.orange)]}>
          <MaterialCommunityIcons name="shield-alert" size={20} color={REPORT_ACCENT.orange.main} />
          <View style={styles.targetMain}>
            <MicroLabel color={REPORT_ACCENT.orange.main}>{c.threat}</MicroLabel>
            {rivalLine(report.threat.rival, REPORT_ACCENT.orange.border)}
          </View>
          <GapValue
            label={c.threatGapLabel}
            points={report.threat.pointsGap}
            accent={REPORT_ACCENT.orange}
          />
        </WeeklyReportCardShell>
      ) : null}
    </View>
  );
}

/* ============================================================
 * main
 * ============================================================ */

export type WeeklyReportPeriodOptionNative = {
  id: string;
  label: string;
};

export default function WeeklyReportViewNative({
  report,
  language = "ja",
  periods,
  selectedPeriodId,
  onSelectPeriod,
}: {
  report: WeeklyReport;
  language?: Lang;
  periods?: WeeklyReportPeriodOptionNative[];
  selectedPeriodId?: string;
  onSelectPeriod?: (id: string) => void;
}) {
  const c = COPY[language];
  const periodList = periods ?? [];
  const selectedIdx = periodList.findIndex((p) => p.id === selectedPeriodId);
  const activeIdx = selectedIdx >= 0 ? selectedIdx : 0;
  const canPrev = periodList.length > 1 && activeIdx < periodList.length - 1;
  const canNext = periodList.length > 1 && activeIdx > 0;
  const rangeLabel = fmtReportRange(report.range.startKey, report.range.endKey);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>{c.title}</Text>
          {report.status === "live" ? (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{c.live}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.headerRange}>
          {periodList.length > 1 ? (
            <Pressable
              disabled={!canPrev}
              onPress={() => {
                if (!canPrev || !onSelectPeriod) return;
                onSelectPeriod(periodList[activeIdx + 1]!.id);
              }}
              style={[styles.rangeNavBtn, !canPrev && styles.rangeNavBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel={language === "ja" ? "前の週" : "Previous week"}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={16}
                color={canPrev ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)"}
              />
            </Pressable>
          ) : null}

          <Text style={styles.range}>{rangeLabel}</Text>

          {periodList.length > 1 ? (
            <Pressable
              disabled={!canNext}
              onPress={() => {
                if (!canNext || !onSelectPeriod) return;
                onSelectPeriod(periodList[activeIdx - 1]!.id);
              }}
              style={[styles.rangeNavBtn, !canNext && styles.rangeNavBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel={language === "ja" ? "次の週" : "Next week"}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={canNext ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)"}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

        {periodList.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodChipRow}
          >
            {periodList.map((p, i) => {
              const selected = i === activeIdx;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => onSelectPeriod?.(p.id)}
                  style={[styles.periodChip, selected && styles.periodChipOn]}
                >
                  <Text style={[styles.periodChipText, selected && styles.periodChipTextOn]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

      {report.status === "live" ? (
        <Text style={[styles.liveNote, { fontFamily: reportBodyFont(language) }]}>{c.liveNote}</Text>
      ) : null}

      <HeroBlock report={report} lang={language} />
      <DivisionsBlock report={report} lang={language} />
      <BattleBlock report={report} lang={language} />
      <TargetThreatBlock report={report} lang={language} />

      <WeeklyReportCardShell style={[styles.commentSlab, slabStyle(REPORT_ACCENT.cyan)]}>
        <Text style={[styles.commentText, { fontFamily: reportBodyFont(language) }]}>
          {commentText(report.comment, language)}
        </Text>
      </WeeklyReportCardShell>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  title: {
    fontFamily: OXANIUM_800,
    color: "#fff",
    fontSize: 13,
    letterSpacing: 1.6,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.4)",
    backgroundColor: "rgba(239,68,68,0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  liveDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#f87171" },
  liveText: {
    fontFamily: OXANIUM_800,
    color: "#fca5a5",
    fontSize: 8,
    letterSpacing: 1.2,
  },
  headerRange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flexShrink: 0,
  },
  rangeNavBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  rangeNavBtnDisabled: {
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "transparent",
  },
  range: {
    fontFamily: OXANIUM_700,
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    letterSpacing: 1,
  },
  periodChipRow: {
    gap: 6,
    paddingVertical: 2,
  },
  periodChip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  periodChipOn: {
    borderColor: REPORT_FRAME.weekly.border,
    backgroundColor: "rgba(34,211,238,0.14)",
  },
  periodChipText: {
    fontFamily: OXANIUM_700,
    fontSize: 11,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
  },
  periodChipTextOn: {
    color: "#a5f3fc",
  },
  liveNote: { color: "rgba(255,255,255,0.45)", fontSize: 11, lineHeight: 16 },

  microLabel: {
    fontFamily: OXANIUM_700,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  sectionBadgeWrap: { alignSelf: "flex-start", backgroundColor: "#fff", paddingHorizontal: 8, paddingVertical: 5 },
  sectionBadgeText: {
    fontFamily: OXANIUM_800,
    color: "#000",
    fontSize: 8,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },

  avatarRing: {
    borderWidth: 1,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  rivalRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  rivalNameWrap: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  rivalName: { flexShrink: 1, color: "rgba(255,255,255,0.88)", fontSize: 13 },
  rivalRank: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    opacity: 0.75,
  },

  heroSplit: {
    position: "relative",
    marginTop: 8,
  },
  heroDivider: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 1,
    marginLeft: -0.5,
    backgroundColor: "rgba(34,211,238,0.16)",
  },
  heroLabelRow: {
    flexDirection: "row",
  },
  heroLabelLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: 14,
  },
  heroLabelRight: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 14,
  },
  heroNumbersRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
  },
  rankLine: {
    flex: 1,
    minWidth: 0,
    paddingRight: 14,
    fontFamily: BEBAS,
    color: "#fff",
    fontSize: 40,
    lineHeight: 40,
    letterSpacing: 0.4,
    transform: [{ skewX: "-10deg" }],
  },
  rankHash: {
    fontFamily: BEBAS,
    fontSize: 24,
    lineHeight: 40,
    color: "rgba(255,255,255,0.4)",
  },
  deltaInline: {
    fontFamily: BEBAS,
    fontSize: 18,
    lineHeight: 40,
  },
  firstWeekInline: {
    fontFamily: OXANIUM_700,
    fontSize: 9,
    lineHeight: 40,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  ptsLine: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 14,
    fontFamily: BEBAS,
    fontSize: 40,
    lineHeight: 40,
    color: REPORT_ACCENT.cyan.main,
    transform: [{ skewX: "-10deg" }],
  },
  ptsUnitInline: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    lineHeight: 40,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.4)",
  },
  heroMetaGrid: {
    flexDirection: "row",
    marginTop: 8,
  },
  heroMetaLeft: {
    flex: 1,
    minWidth: 0,
    height: 20,
    paddingRight: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  topPill: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  topPillText: {
    fontFamily: OXANIUM_800,
    fontSize: 8,
    letterSpacing: 1.2,
    lineHeight: 10,
    textTransform: "uppercase",
  },
  participantsText: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  postsLine: {
    flex: 1,
    minWidth: 0,
    height: 20,
    paddingLeft: 14,
    fontFamily: OXANIUM_700,
    fontSize: 10,
    lineHeight: 20,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.55)",
  },

  divRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  divCell: { flex: 1, paddingHorizontal: 10, paddingVertical: 9, gap: 4 },
  divCellHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  top10Chip: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2 },
  top10ChipText: {
    fontFamily: OXANIUM_800,
    fontSize: 8,
    letterSpacing: 0.8,
    color: "#050508",
    textTransform: "uppercase",
  },
  divValueRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  divValue: {
    fontFamily: BEBAS,
    fontSize: 27,
    lineHeight: 29,
    color: "#fff",
    transform: [{ skewX: "-10deg" }],
  },
  divRefBlock: { gap: 2, marginTop: 2 },
  divRefLabel: { fontFamily: OXANIUM_600, fontSize: 10, color: "rgba(255,255,255,0.55)" },
  divRefSub: {
    fontFamily: OXANIUM_700,
    fontSize: 9,
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  divRank: {
    fontFamily: OXANIUM_700,
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: 2,
    textTransform: "uppercase",
  },

  battleBlockRoot: { gap: 8 },
  battleSummary: {
    marginTop: 8,
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    lineHeight: 18,
  },
  battlePanel: { paddingHorizontal: 14, paddingVertical: 10 },
  battlePanelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  battleCountRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  battleCountText: { fontFamily: BEBAS, fontSize: 20 },
  rivalList: { marginTop: 4 },
  moreRivalsText: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.65,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  showMoreBtn: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  showMoreText: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  iconFlip180: { transform: [{ rotate: "180deg" }] },
  emptyText: { color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 16, marginTop: 6 },

  firstWeekBattlePanel: { paddingHorizontal: 14, paddingVertical: 12 },
  firstWeekBattleText: { color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 17 },

  targetRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  targetMain: { flex: 1, minWidth: 0 },
  targetRivalRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexShrink: 1 },
  targetRivalName: { flexShrink: 1, color: "rgba(255,255,255,0.9)", fontSize: 13 },
  targetRivalHash: { fontFamily: OXANIUM_700, color: "rgba(255,255,255,0.45)" },
  targetEmptyText: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 },

  gapValueWrap: { alignItems: "flex-end" },
  gapValueLabel: {
    fontFamily: OXANIUM_700,
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    opacity: 0.75,
  },
  gapValueRow: { flexDirection: "row", alignItems: "baseline", gap: 3, marginTop: 2 },
  gapValueNum: { fontFamily: BEBAS, fontSize: 22 },
  gapValueUnit: { fontFamily: OXANIUM_700, fontSize: 9, letterSpacing: 1, opacity: 0.7 },

  commentSlab: { paddingHorizontal: 14, paddingVertical: 12 },
  commentText: { color: "rgba(255,255,255,0.7)", fontSize: 12.5, lineHeight: 19 },
});
