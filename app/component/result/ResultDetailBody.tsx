"use client";

/**
 * Native `ResultDetailBodyNative` 相当 — リザルト詳細ボディ（カード面 + この試合 + Top10 + 内訳）。
 */
import { Check, X } from "lucide-react";
import Link from "next/link";
import ResultCardDesignFace from "@/app/component/result/ResultCardDesignFace";
import ResultDetailScoreDonut from "@/app/component/result/ResultDetailScoreDonut";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import {
  CyberRankingListRow,
  CyberRankingScore,
} from "@/app/component/rankings/CyberRankingListParts";
import { cyberMetricTag } from "@/lib/rankings/cyberRankVisual";
import { matchScoreClass, nameOxanium } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import type {
  ResultDetailBreakdownView,
  ResultDetailMatchStats,
  ResultDetailViewModel,
} from "@/lib/result/buildResultDetailView";
import { SCORE_BREAKDOWN_COLORS } from "@/lib/result/resultScoreBreakdownColors";
import type { ResultTopScorerMarketView } from "@/lib/result/resultTopScorerMarket";
import type { GamePointsTopEntryV1 } from "@/lib/results/gamePointsTop";
import { profilePathKeyFromRow } from "@/lib/profile/profilePathKey";
import { warmPublicProfileFromListEntry } from "@/app/component/profile/useProfile";

const ACCENT = "#00F5FF";

const TOP_SCORER_SLICE_COLORS = [
  "#00F5FF",
  "#FFD65A",
  "#FF2BD6",
  "#B8FF3C",
  "#FB923C",
  "rgba(148,163,184,0.55)",
] as const;

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(255,255,255,${alpha})`;
  const n = parseInt(raw, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function fmtPt(v: number) {
  return v.toFixed(1);
}

function SectionHeader({ title, accent }: { title: string; accent: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3">
      <span
        className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em]`}
        style={{ color: hexToRgba(accent, 0.75) }}
      >
        {title}
      </span>
      <div
        className="h-px flex-1"
        style={{ backgroundColor: hexToRgba(accent, 0.35) }}
      />
    </div>
  );
}

function SectionCard({
  children,
  frameColor,
}: {
  children: React.ReactNode;
  frameColor: string;
}) {
  return (
    <div
      className="flex flex-col gap-2.5 border bg-transparent px-3 py-3"
      style={{ borderColor: frameColor }}
    >
      {children}
    </div>
  );
}

function MatchStatsPanel({
  ja,
  frameColor,
  stats,
  topScorerMarket,
}: {
  ja: boolean;
  frameColor: string;
  stats: ResultDetailMatchStats;
  topScorerMarket?: ResultTopScorerMarketView | null;
}) {
  const median = stats.median ?? 0;
  const postCount = stats.postCount;
  const market = topScorerMarket ?? null;
  const slices = market?.slices ?? [];
  const donutSegments = slices.map((s, i) => ({
    value: Math.max(0, s.pct),
    color: TOP_SCORER_SLICE_COLORS[i % TOP_SCORER_SLICE_COLORS.length],
  }));
  const hitRate =
    market?.hitRatePct != null && Number.isFinite(market.hitRatePct)
      ? market.hitRatePct
      : null;
  const myPick = market?.myPick ?? null;
  const myPickSlice =
    myPick != null
      ? slices.find(
          (s) =>
            s.playerId === myPick.playerId && s.teamId === myPick.teamId
        )
      : null;

  return (
    <div className="flex flex-col gap-2.5">
      <SectionHeader title={ja ? "この試合" : "THIS MATCH"} accent={ACCENT} />
      <SectionCard frameColor={frameColor}>
        <div className="flex items-stretch">
          <div className="flex flex-1 flex-col items-center gap-1 py-1">
            <span
              className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400/90`}
            >
              {ja ? "投稿数" : "POSTS"}
            </span>
            <span
              className={`${matchScoreClass} text-[28px] font-black italic leading-none text-slate-50`}
            >
              {postCount}
            </span>
            <span className="text-[9px] tracking-wide text-slate-400/70">
              {ja ? "この試合" : "This match"}
            </span>
          </div>
          <div
            className="mx-0 my-0.5 w-px"
            style={{ backgroundColor: hexToRgba(ACCENT, 0.22) }}
          />
          <div className="flex flex-1 flex-col items-center gap-1 py-1">
            <span
              className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400/90`}
            >
              {ja ? "中央値" : "MEDIAN"}
            </span>
            <span
              className={`${matchScoreClass} text-[28px] font-black italic leading-none text-cyan-300`}
            >
              {fmtPt(median)}
            </span>
            <span className="text-[9px] tracking-wide text-slate-400/70">
              {ja ? "全投稿の中央" : "All posts"}
            </span>
          </div>
        </div>

        {market && slices.length > 0 ? (
          <>
            <div
              className="my-3.5 h-px"
              style={{ backgroundColor: hexToRgba(ACCENT, 0.18) }}
            />
            <p
              className={`${nameOxanium.className} mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-300/70`}
            >
              TOP SCORER
            </p>
            <div className="flex items-start gap-3">
              <ResultDetailScoreDonut
                segments={donutSegments}
                total={hitRate ?? slices[0]?.pct ?? 0}
                totalLabel={ja ? "的中率%" : "HIT %"}
                size={108}
                thickness={14}
              />
              <div className="min-w-0 flex-1 space-y-2">
                {slices.map((slice, i) => {
                  const color =
                    TOP_SCORER_SLICE_COLORS[i % TOP_SCORER_SLICE_COLORS.length];
                  const showPoints =
                    slice.points != null && Number.isFinite(slice.points);
                  return (
                    <div
                      key={`${slice.playerId}-${slice.teamId}`}
                      className="flex items-start gap-2"
                    >
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="truncate text-[12px] font-semibold text-slate-100">
                            {slice.name}
                          </span>
                          {slice.isActual ? (
                            <Check className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                          ) : null}
                        </div>
                        {showPoints ? (
                          <span className="text-[10px] text-slate-400">
                            {slice.points} PT
                          </span>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[11px] tabular-nums text-slate-300">
                        {slice.pct.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className={[
                "mt-2 flex items-center justify-between gap-2 border px-3 py-2",
                myPick?.hit === true
                  ? "border-amber-400/35 bg-amber-400/8"
                  : myPick?.hit === false
                    ? "border-slate-500/25 bg-slate-500/5"
                    : "border-cyan-400/20 bg-cyan-400/5",
              ].join(" ")}
            >
              <div className="min-w-0">
                <p
                  className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400/80`}
                >
                  {ja ? "あなたの選択" : "YOUR PICK"}
                </p>
                <p className="truncate text-[13px] font-semibold text-slate-100">
                  {myPick?.name ?? (ja ? "未選択" : "NO PICK")}
                </p>
                {myPickSlice?.points != null &&
                Number.isFinite(myPickSlice.points) ? (
                  <p className="text-[10px] text-slate-400">
                    {myPickSlice.points} PT
                  </p>
                ) : null}
              </div>
              {myPick?.hit != null ? (
                <div className="flex shrink-0 items-center gap-1">
                  {myPick.hit ? (
                    <Check className="h-3.5 w-3.5 text-amber-300" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-slate-400/75" />
                  )}
                  <span
                    className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-wide ${
                      myPick.hit ? "text-amber-300" : "text-slate-400/75"
                    }`}
                  >
                    {myPick.hit ? "HIT" : "MISS"}
                  </span>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </SectionCard>
    </div>
  );
}

function TopScoresPanel({
  ja,
  entries,
  language,
  gamesRoutePrefix,
}: {
  ja: boolean;
  entries: GamePointsTopEntryV1[];
  language: Language;
  gamesRoutePrefix: "/web" | "/mobile";
}) {
  if (entries.length === 0) return null;
  const metricTag = cyberMetricTag("totalScore", language);

  return (
    <div className="flex flex-col gap-2.5">
      <SectionHeader title={ja ? "得点上位" : "TOP SCORES"} accent={ACCENT} />
      <div>
        {entries.map((entry) => {
          const profileKey = profilePathKeyFromRow({
            uid: entry.uid,
            handle: entry.handle === "—" ? "" : entry.handle,
          });
          const warm = () => {
            if (!profileKey) return;
            warmPublicProfileFromListEntry({
              routeKey: profileKey,
              uid: entry.uid,
              handle: entry.handle === "—" ? "" : entry.handle,
              displayName: entry.displayName,
              photoURL: entry.photoURL,
              plan: entry.isPro ? "pro" : "free",
              countryCode: entry.countryCode,
            });
          };
          const row = (
            <CyberRankingListRow
              rank={entry.rank}
              displayName={entry.displayName}
              photoURL={entry.photoURL}
              metric="totalScore"
              metricTag={metricTag}
              countryCode={entry.countryCode}
              hideListMeta
              showFirstPlaceFrame
              nameExtra={
                entry.isPro ? (
                  <ProCyberBadge
                    {...proBadgeStaticMotion}
                    compact
                    ariaLabel={t(language).common.proMember}
                  />
                ) : null
              }
              language={language}
              scoreSlot={
                <CyberRankingScore
                  rank={entry.rank}
                  metric="totalScore"
                  counted={entry.points}
                />
              }
            />
          );
          if (!profileKey) return <div key={entry.postId}>{row}</div>;
          return (
            <Link
              key={entry.postId}
              href={`${gamesRoutePrefix}/profile/${encodeURIComponent(profileKey)}`}
              className="block"
              onMouseEnter={warm}
              onFocus={warm}
            >
              {row}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ScoreBreakdownPanel({
  ja,
  frameColor,
  breakdown,
}: {
  ja: boolean;
  frameColor: string;
  breakdown: ResultDetailBreakdownView;
}) {
  const b = breakdown;
  const segments = [
    { value: b.basePoints, color: SCORE_BREAKDOWN_COLORS.base },
    ...(b.streakBonus > 1e-6
      ? [{ value: b.streakBonus, color: SCORE_BREAKDOWN_COLORS.streak }]
      : []),
    ...(b.upsetBonus > 1e-6
      ? [{ value: b.upsetBonus, color: SCORE_BREAKDOWN_COLORS.upset }]
      : []),
    ...(b.goalScorerBonus > 1e-6
      ? [{ value: b.goalScorerBonus, color: SCORE_BREAKDOWN_COLORS.scorer }]
      : []),
  ];

  type Row = {
    key: string;
    label: string;
    value: number;
    color: string;
    hit?: boolean;
    sub?: string;
  };

  const rows: Row[] = [
    {
      key: "base",
      label: ja ? "基本点" : "Base",
      value: b.basePoints,
      color: SCORE_BREAKDOWN_COLORS.base,
      sub: ja ? "勝者＋スコア精度" : "Winner + score precision",
    },
    ...(b.streakBonus > 1e-6
      ? [
          {
            key: "streak",
            label: ja ? "連勝ボーナス" : "Win streak",
            value: b.streakBonus,
            color: SCORE_BREAKDOWN_COLORS.streak,
          },
        ]
      : []),
    ...(b.upsetBonus > 1e-6
      ? [
          {
            key: "upset",
            label: ja ? "Upsetボーナス" : "Upset bonus",
            value: b.upsetBonus,
            color: SCORE_BREAKDOWN_COLORS.upset,
          },
        ]
      : []),
    ...(b.goalScorerBonus > 1e-6
      ? [
          {
            key: "scorer",
            label: "TOP SCORER",
            value: b.goalScorerBonus,
            color: SCORE_BREAKDOWN_COLORS.scorer,
            hit: b.topScorerHit === true,
            sub: b.topScorerName ?? undefined,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-2.5">
      <SectionHeader
        title={ja ? "得点の内訳" : "POINTS BREAKDOWN"}
        accent={ACCENT}
      />
      <SectionCard frameColor={frameColor}>
        <div className="flex items-start gap-3">
          <ResultDetailScoreDonut
            segments={segments}
            total={b.totalPoints}
            totalLabel={ja ? "スコア" : "SCORE"}
          />
          <div className="min-w-0 flex-1 space-y-3">
            {rows.map((row) => (
              <div key={row.key} className="flex items-start gap-2">
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0"
                  style={{ backgroundColor: row.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-slate-100">
                      {row.label}
                    </span>
                    {row.hit != null ? (
                      <span
                        className={[
                          `${nameOxanium.className} inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide`,
                          row.hit
                            ? "bg-amber-300 text-amber-950"
                            : "bg-slate-600/40 text-slate-300/80",
                        ].join(" ")}
                      >
                        {row.hit ? "HIT" : "MISS"}
                      </span>
                    ) : null}
                  </div>
                  {row.sub ? (
                    <p className="truncate text-[10px] text-slate-400">
                      {row.sub}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`${matchScoreClass} shrink-0 text-[13px] font-black italic tabular-nums text-slate-100`}
                >
                  {row.value.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export type ResultDetailBodySections = "full" | "cardAndLiveStats";

type Props = {
  language: Language;
  view: ResultDetailViewModel;
  gamesRoutePrefix?: "/web" | "/mobile";
  contentPaddingBottom?: number;
  sections?: ResultDetailBodySections;
};

/** Web 新リザルト詳細 — Native `ResultDetailBodyNative` と同じ構成 */
export default function ResultDetailBody({
  language,
  view,
  gamesRoutePrefix = "/mobile",
  contentPaddingBottom = 24,
  sections = "full",
}: Props) {
  const ja = language === "ja";
  const frameColor = hexToRgba(ACCENT, 0.4);
  const dividerColor = hexToRgba(ACCENT, 0.22);
  const matchStats = view.matchStats;

  return (
    <div
      className="pt-1 text-white"
      style={{ paddingBottom: contentPaddingBottom }}
      data-tutorial-target="result-detail-card"
    >
      <div
        className="overflow-visible border bg-transparent p-0"
        style={{ borderColor: ACCENT }}
      >
        <ResultCardDesignFace
          language={language}
          face={view.card}
          showDetailTab={false}
        />
      </div>

      {sections === "full" ? (
        <>
          {matchStats ? (
            <>
              <div
                className="my-4 h-px"
                style={{ backgroundColor: dividerColor }}
              />
              <MatchStatsPanel
                ja={ja}
                frameColor={frameColor}
                stats={matchStats}
                topScorerMarket={view.topScorerMarket}
              />
            </>
          ) : null}

          {view.topEntries.length > 0 ? (
            <>
              <div
                className="my-4 h-px"
                style={{ backgroundColor: dividerColor }}
              />
              <TopScoresPanel
                ja={ja}
                entries={view.topEntries}
                language={language}
                gamesRoutePrefix={gamesRoutePrefix}
              />
            </>
          ) : null}

          <div
            className="my-4 h-px"
            style={{ backgroundColor: dividerColor }}
          />
          <ScoreBreakdownPanel
            ja={ja}
            frameColor={frameColor}
            breakdown={view.breakdown}
          />
        </>
      ) : null}
    </div>
  );
}
