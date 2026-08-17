"use client";

import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import type { ProfilePlanProMetricLayoutVariant } from "@/lib/profile/profilePlanProMetricLayoutVariants";
import { KINETIK_UPSET_METRIC_LABEL } from "@/lib/profile/kinetikMetricDisplay";
import {
  KINETIK_CYAN,
  KINETIK_GREEN,
  KINETIK_MAGENTA,
  KINETIK_RED,
} from "@/app/component/profile/edit/profileEditKinetikTypes";

export type ProfilePlanProMetricShowcaseData = {
  winRate: number;
  posts: number;
  hits: number;
  totalPoints: number;
  totalPointsRank: number | null;
  goalScorerHits?: number;
  upset: number;
  winSegs: number;
  ptsSegs: number;
};

type Accent = "green" | "magenta" | "cyan" | "red";

const ACCENT: Record<Accent, { line: string; glow: string }> = {
  green: { line: KINETIK_GREEN, glow: "rgba(168,255,42,0.4)" },
  magenta: { line: KINETIK_MAGENTA, glow: "rgba(255,43,214,0.38)" },
  cyan: { line: KINETIK_CYAN, glow: "rgba(34,211,238,0.38)" },
  red: { line: KINETIK_RED, glow: "rgba(248,113,113,0.38)" },
};

type Layout = "web" | "mobile";

function variantClass(base: string, layout: Layout) {
  return `${base} pro-metric-variant--layout-${layout}`;
}

function SegBar({
  filled,
  accent,
  total = 6,
  layout,
}: {
  filled: number;
  accent: Accent;
  total?: number;
  layout: Layout;
}) {
  const colors = ACCENT[accent];
  return (
    <div
      className={[
        "pro-metric-variant__seg-row",
        layout === "web" ? "pro-metric-variant__seg-row--web" : "",
      ].join(" ")}
      aria-hidden
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="pro-metric-variant__seg"
          style={{
            backgroundColor: i < filled ? colors.line : "rgba(255,255,255,0.08)",
            boxShadow: i < filled ? `0 0 6px ${colors.glow}` : "none",
          }}
        />
      ))}
    </div>
  );
}

function MetricValue({
  value,
  unit,
  large = false,
  layout,
}: {
  value: string;
  unit?: string;
  large?: boolean;
  layout: Layout;
}) {
  return (
    <span
      className={[
        nameOxanium.className,
        "pro-metric-variant__value",
        large ? "pro-metric-variant__value--lg" : "",
        layout === "web" ? "pro-metric-variant__value--web" : "",
      ].join(" ")}
    >
      {value}
      {unit ? (
        <span className="pro-metric-variant__unit">{unit}</span>
      ) : null}
    </span>
  );
}

type MetricItem = {
  key: string;
  label: string;
  sub?: string;
  value: string;
  unit?: string;
  accent: Accent;
  segs?: number;
  rank?: string;
  footnote?: string;
};

function buildMetrics(
  data: ProfilePlanProMetricShowcaseData,
  isJa: boolean
): MetricItem[] {
  const rankLabel =
    data.totalPointsRank != null
      ? isJa
        ? `${data.totalPointsRank}位`
        : `#${data.totalPointsRank}`
      : undefined;

  return [
    {
      key: "win",
      label: isJa ? "勝率" : "WIN RATE",
      sub: isJa ? "%" : "%",
      value: `${data.winRate.toFixed(1)}%`,
      accent: "green",
      segs: data.winSegs,
      footnote: isJa
        ? `投稿 ${data.posts} · 的中 ${data.hits}`
        : `${data.hits} hits · ${data.posts} posts`,
    },
    {
      key: "pts",
      label: isJa ? "総合得点" : "TOTAL PTS",
      sub: isJa ? "累計" : "CUM",
      value: data.totalPoints.toLocaleString(),
      unit: "PTS",
      accent: "magenta",
      segs: data.ptsSegs,
      rank: rankLabel,
    },
    {
      key: "scorer",
      label: isJa ? "最多得点者" : "TOP SCORER",
      sub: isJa ? "累計" : "CUM",
      value: String(Math.round(data.goalScorerHits ?? 0)),
      unit: isJa ? "試合" : "MTCH",
      accent: "cyan",
    },
    {
      key: "upset",
      label: KINETIK_UPSET_METRIC_LABEL,
      sub: isJa ? "累計" : "CUM",
      value: data.upset.toFixed(1),
      unit: "PTS",
      accent: "red",
    },
  ];
}

function GridVariant({
  metrics,
  layout,
}: {
  metrics: MetricItem[];
  layout: Layout;
}) {
  return (
    <div className={variantClass("pro-metric-variant pro-metric-variant--grid", layout)}>
      {metrics.map((m) => (
        <article
          key={m.key}
          className={`pro-metric-variant__card pro-metric-variant__card--${m.accent}`}
        >
          <span
            className="pro-metric-variant__bar"
            style={{
              background: ACCENT[m.accent].line,
              boxShadow: `0 0 8px ${ACCENT[m.accent].glow}`,
            }}
            aria-hidden
          />
          <p className={[nameOxanium.className, "pro-metric-variant__label"].join(" ")}>
            {m.label}
            {m.sub ? <span className="pro-metric-variant__sub">{m.sub}</span> : null}
          </p>
          <MetricValue value={m.value} unit={m.unit} layout={layout} />
          {m.segs != null ? (
            <SegBar filled={m.segs} accent={m.accent} layout={layout} />
          ) : null}
          {m.rank ? (
            <span className="pro-metric-variant__rank">{m.rank}</span>
          ) : null}
          {m.footnote ? (
            <p className="pro-metric-variant__footnote">{m.footnote}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function BentoVariant({
  metrics,
  layout,
}: {
  metrics: MetricItem[];
  layout: Layout;
}) {
  const [win, pts, ...secondary] = metrics;
  const [prec, upset] =
    secondary.length === 2 ? secondary : [null, secondary[0]!];
  return (
    <div className={variantClass("pro-metric-variant pro-metric-variant--bento", layout)}>
      <article
        className={`pro-metric-variant__card pro-metric-variant__card--hero pro-metric-variant__card--${win.accent}`}
      >
        <div className="pro-metric-variant__hero-inner">
          <div>
            <p className={[nameOxanium.className, "pro-metric-variant__label"].join(" ")}>
              {win.label}
            </p>
            <MetricValue value={win.value} large layout={layout} />
            {win.footnote ? (
              <p className="pro-metric-variant__footnote">{win.footnote}</p>
            ) : null}
          </div>
          {win.segs != null ? (
            <SegBar filled={win.segs} accent={win.accent} total={6} layout={layout} />
          ) : null}
        </div>
      </article>

      <article
        className={`pro-metric-variant__card pro-metric-variant__card--tall pro-metric-variant__card--${pts.accent}`}
      >
        <p className={[nameOxanium.className, "pro-metric-variant__label"].join(" ")}>
          {pts.label}
        </p>
        <MetricValue value={pts.value} unit={pts.unit} large layout={layout} />
        {pts.segs != null ? (
          <SegBar filled={pts.segs} accent={pts.accent} total={5} layout={layout} />
        ) : null}
        {pts.rank ? <span className="pro-metric-variant__rank">{pts.rank}</span> : null}
      </article>

      {prec ? (
        <article
          className={`pro-metric-variant__card pro-metric-variant__card--compact pro-metric-variant__card--${prec.accent}`}
        >
          <p className={[nameOxanium.className, "pro-metric-variant__label"].join(" ")}>
            {prec.label}
          </p>
          <MetricValue value={prec.value} unit={prec.unit} layout={layout} />
        </article>
      ) : null}

      <article
        className={`pro-metric-variant__card pro-metric-variant__card--compact pro-metric-variant__card--${upset.accent}`}
      >
        <p className={[nameOxanium.className, "pro-metric-variant__label"].join(" ")}>
          {upset.label}
        </p>
        <MetricValue value={upset.value} unit={upset.unit} layout={layout} />
      </article>
    </div>
  );
}

function SlantVariant({
  metrics,
  layout,
}: {
  metrics: MetricItem[];
  layout: Layout;
}) {
  return (
    <div className={variantClass("pro-metric-variant pro-metric-variant--slant", layout)}>
      {metrics.map((m, i) => (
        <article
          key={m.key}
          className={`pro-metric-variant__slant-card pro-metric-variant__slant-card--${i} pro-metric-variant__card--${m.accent}`}
        >
          <div className="pro-metric-variant__slant-inner">
            <p className={[nameOxanium.className, "pro-metric-variant__label"].join(" ")}>
              {m.label}
            </p>
            <MetricValue value={m.value} unit={m.unit} layout={layout} />
            {m.segs != null ? (
              <SegBar filled={m.segs} accent={m.accent} layout={layout} />
            ) : null}
            {m.rank ? <span className="pro-metric-variant__rank">{m.rank}</span> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function OrbitVariant({
  metrics,
  layout,
}: {
  metrics: MetricItem[];
  layout: Layout;
}) {
  const [win, pts, ...secondary] = metrics;
  const [prec, upset] =
    secondary.length === 2 ? secondary : [null, secondary[0]!];
  const slots = [
    { item: win, pos: "top" as const },
    { item: pts, pos: "right" as const },
    ...(prec ? [{ item: prec, pos: "left" as const }] : []),
    { item: upset, pos: "bottom" as const },
  ];

  return (
    <div className={variantClass("pro-metric-variant pro-metric-variant--orbit", layout)}>
      <div className="pro-metric-variant__orbit-hub" aria-hidden>
        <span className="pro-metric-variant__orbit-ring" />
        <span className="pro-metric-variant__orbit-core" />
      </div>
      {slots.map(({ item, pos }) => (
        <article
          key={item.key}
          className={`pro-metric-variant__orbit-node pro-metric-variant__orbit-node--${pos} pro-metric-variant__card--${item.accent}`}
        >
          <p className={[nameOxanium.className, "pro-metric-variant__label"].join(" ")}>
            {item.label}
          </p>
          <MetricValue value={item.value} unit={item.unit} layout={layout} />
          {item.segs != null ? (
            <SegBar filled={item.segs} accent={item.accent} total={5} layout={layout} />
          ) : null}
          {item.rank ? <span className="pro-metric-variant__rank">{item.rank}</span> : null}
        </article>
      ))}
    </div>
  );
}

function RibbonVariant({
  metrics,
  layout,
}: {
  metrics: MetricItem[];
  layout: Layout;
}) {
  return (
    <div className={variantClass("pro-metric-variant pro-metric-variant--ribbon", layout)}>
      {metrics.map((m, i) => (
        <article
          key={m.key}
          className={`pro-metric-variant__ribbon-row pro-metric-variant__card--${m.accent}`}
        >
          <span
            className="pro-metric-variant__ribbon-index"
            style={{ color: ACCENT[m.accent].line }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="pro-metric-variant__ribbon-body">
            <p className={[nameOxanium.className, "pro-metric-variant__label"].join(" ")}>
              {m.label}
              {m.sub ? <span className="pro-metric-variant__sub">{m.sub}</span> : null}
            </p>
            {m.segs != null ? (
              <SegBar filled={m.segs} accent={m.accent} layout={layout} />
            ) : null}
            {m.footnote ? (
              <p className="pro-metric-variant__footnote">{m.footnote}</p>
            ) : null}
          </div>
          <div className="pro-metric-variant__ribbon-value">
            <MetricValue value={m.value} unit={m.unit} layout={layout} />
            {m.rank ? <span className="pro-metric-variant__rank">{m.rank}</span> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function TerminalVariant({
  metrics,
  layout,
}: {
  metrics: MetricItem[];
  layout: Layout;
}) {
  return (
    <div className={variantClass("pro-metric-variant pro-metric-variant--terminal", layout)}>
      <div className="pro-metric-variant__terminal-head">
        <span className="pro-metric-variant__terminal-dot" />
        <span className="pro-metric-variant__terminal-dot" />
        <span className="pro-metric-variant__terminal-dot" />
        <span className={[nameRajdhani.className, "pro-metric-variant__terminal-title"].join(" ")}>
          METRICS_STREAM
        </span>
      </div>
      <div className="pro-metric-variant__terminal-body">
        {metrics.map((m) => (
          <div
            key={m.key}
            className={`pro-metric-variant__terminal-line pro-metric-variant__card--${m.accent}`}
          >
            <span className="pro-metric-variant__terminal-key">
              {m.label.replace(/\s/g, "_")}
            </span>
            <span className="pro-metric-variant__terminal-dots" aria-hidden />
            <span
              className="pro-metric-variant__terminal-val"
              style={{ color: ACCENT[m.accent].line }}
            >
              {m.value}
              {m.unit ? ` ${m.unit}` : ""}
            </span>
            {m.rank ? (
              <span className="pro-metric-variant__terminal-rank">{m.rank}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  variant: ProfilePlanProMetricLayoutVariant;
  data: ProfilePlanProMetricShowcaseData;
  language?: "ja" | "en";
  layout?: Layout;
};

/** PRO メトリクス — レイアウト案レンダラ（dev） */
export default function ProfilePlanProMetricsVariant({
  variant,
  data,
  language = "ja",
  layout = "mobile",
}: Props) {
  const metrics = buildMetrics(data, language === "ja");

  switch (variant) {
    case "bento":
      return <BentoVariant metrics={metrics} layout={layout} />;
    case "slant":
      return <SlantVariant metrics={metrics} layout={layout} />;
    case "orbit":
      return <OrbitVariant metrics={metrics} layout={layout} />;
    case "ribbon":
      return <RibbonVariant metrics={metrics} layout={layout} />;
    case "terminal":
      return <TerminalVariant metrics={metrics} layout={layout} />;
    case "grid":
    default:
      return <GridVariant metrics={metrics} layout={layout} />;
  }
}
